import { useState, useEffect } from "react";
import api from "../../libs/api";
import {
  FolderArchive,
  Users,
  Layers,
  Building2,
  ShieldCheck,
  Wallet,
  Percent,
  CheckCircle2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// --- INTERFACES BINDING DATA ---
import type { ISubmission } from "../../libs/interface";
import { IDRFormat } from "../utils/utilForm";
import moment from "moment";

const COLOR_STATUS: Record<string, string> = {
  APPROVED: "#10b981",
  DISETUJUI: "#10b981",
  DONE: "#10b981",
  PENDING: "#f59e0b",
  PROSES: "#f59e0b",
  REJECTED: "#ef4444",
  DITOLAK: "#ef4444",
  FLAGGED: "#3b82f6",
  ACTIVE: "#3b82f6",
};

const PALETTE = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
];

export default function DashboardEarsip() {
  const [loading, setLoading] = useState(false);

  // 1. Indikator Utama Global
  const [globalMetrics, setGlobalMetrics] = useState({
    totalDebitur: 0,
    totalSubmission: 0,
    totalValueLending: 0, // Plafond kredit aktif / belum lunas
    totalValueLunas: 0, // Plafond kredit lunas
    totalValueFunding: 0, // Total plafond kredit = Aktif + Lunas
    complianceRate: 0, // Rasio pemenuhan file digital arsip
  });

  // 2. 4 Pilar Status Utama (Request User)
  const [statusState, setStatusState] = useState({
    approve: [] as any[],
    doc: [] as any[],
    guarantee: [] as any[],
    flagging: [] as any[],
  });

  // 3. Analisis Berjenjang (ProductType -> Product -> Submission)
  const [portfolioMatrix, setPortfolioMatrix] = useState<any[]>([]);

  // 4. Analisis Pihak Ketiga Eksternal
  const [externalEntities, setExternalEntities] = useState({
    mitraDist: [] as any[],
    asuransiDist: [] as any[],
    payOfficeDist: [] as any[],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/earsip");
      if (res?.data) {
        const {
          debitur = [],
          submission = [],
          producttype = [],
          mitra = [],
          asuransi = [],
          payoffice = [],
        } = res.data;

        // Penampung Rumpun Status
        const appMap: Record<string, number> = {};
        const docMap: Record<string, number> = {};
        const guaMap: Record<string, number> = {};
        const flaMap: Record<string, number> = {};

        let totalLending = 0;
        let totalLunas = 0;
        let totalFunding = 0;
        let totalRequiredFiles = 0;
        let totalUploadedFiles = 0;

        // ==================================================
        // 1. HITUNG METRICS GLOBAL DARI PRODUCT TYPE -> PRODUCT
        // ==================================================
        producttype.forEach((pt: any) => {
          const requiredFileCount = pt.ProductTypeFile?.length || 0;

          pt.Product?.forEach((p: any) => {
            const subList = p.Submission || [];

            subList.forEach((s: ISubmission) => {
              const val = s.value || 0;
              totalFunding += val;

              // Masuk kalkulasi file compliance
              totalRequiredFiles += requiredFileCount;
              totalUploadedFiles += s.Files?.length || 0;

              // Akumulasi nominal global berdasarkan status kredit.
              // Total Plafond Kredit = Plafond Aktif + Plafond Lunas.
              if (String(s.approve_status || "").toUpperCase() === "LUNAS") {
                totalLunas += val;
              } else {
                totalLending += val;
              }

              // Hitung Frekuensi Status Kontrol (4 Pilar)
              appMap[s.approve_status || "PENDING"] =
                (appMap[s.approve_status || "PENDING"] || 0) + 1;
              docMap[s.doc_status || "PROSES"] =
                (docMap[s.doc_status || "PROSES"] || 0) + 1;
              guaMap[s.guarantee_status || "PROSES"] =
                (guaMap[s.guarantee_status || "PROSES"] || 0) + 1;
              flaMap[s.flagging_status || "NONE"] =
                (flaMap[s.flagging_status || "NONE"] || 0) + 1;
            });
          });
        });

        // ==================================================
        // 1b. DATA JATUH TEMPO JAMINAN BERDASARKAN MITRA
        // Ketentuan:
        // - Hanya status_flagging selain NON_PENSIUNAN
        // - LEWAT TBO: guarantee_date sudah lewat dan belum FLAGGING
        // - MASA TBO: guarantee_date belum lewat dan belum FLAGGING
        // - NOT SET: guarantee_date masih null
        // - Mitra kosong tidak ditampilkan
        // ==================================================
        // const normalizeStatus = (value: any) =>
        //   String(value || "")
        //     .trim()
        //     .toUpperCase()
        //     .replace(/[\s-]+/g, "_");

        const getTboCategory = (s: any) => {
          // const flaggingStatus = normalizeStatus(s.flagging_status);

          if (s.flagging_status === "NON_PENSIUNAN") return null;

          if (s.guarantee_status !== "PENDING") return "DITERIMA";
          if (!s.guarantee_date) {
            return "NOT SET";
          }

          // Data yang sudah FLAGGING dianggap sudah diterima

          const guaranteeDate = moment(s.guarantee_date);

          if (!guaranteeDate.isValid()) {
            return "NOT SET";
          }

          const today = moment().startOf("day");

          if (
            s.guarantee_status === "PENDING" &&
            today.isAfter(guaranteeDate, "day")
          ) {
            return "LEWAT TBO";
          }

          return "MASA TBO";
        };

        const matrixReport = mitra
          .filter((m: any) => String(m.name || "").trim())
          .map((m: any) => {
            const categoryMap: Record<
              string,
              { productName: string; count: number; value: number }
            > = {
              "LEWAT TBO": { productName: "LEWAT TBO", count: 0, value: 0 },
              "MASA TBO": { productName: "MASA TBO", count: 0, value: 0 },
              DITERIMA: { productName: "DITERIMA", count: 0, value: 0 },
              "NOT SET": { productName: "NOT SET", count: 0, value: 0 },
            };

            (m.Submission || []).forEach((s: any) => {
              const category = getTboCategory(s);
              if (!category) return;

              categoryMap[category].count += 1;
              categoryMap[category].value += s.value || 0;
            });

            const products = Object.values(categoryMap).filter(
              (item) => item.count > 0,
            );

            const totalSubmissions = products.reduce(
              (acc, item) => acc + item.count,
              0,
            );
            const totalValue = products.reduce(
              (acc, item) => acc + item.value,
              0,
            );

            return {
              typeName: m.name,
              totalSubmissions,
              totalValue,
              products,
            };
          })
          .filter((m: any) => m.totalSubmissions > 0)
          .sort(
            (
              a: { totalSubmissions: number; totalValue: number },
              b: { totalSubmissions: number; totalValue: number },
            ) =>
              b.totalSubmissions - a.totalSubmissions ||
              b.totalValue - a.totalValue,
          );

        setPortfolioMatrix(matrixReport);

        // ==================================================
        // 2. ANALISIS ENTITAS EKSTERNAL (MITRA, INS, PAY OFFICE)
        // ==================================================
        const formatExternal = (entities: any[]) =>
          entities
            .map((e) => ({
              name: e.name,
              volume: e.Submission?.length || 0,
              value:
                e.Submission?.length > 0
                  ? e.Submission.reduce(
                      (acc: any, curr: any) => acc + curr.value,
                      0,
                    )
                  : 0,
            }))
            .filter((e) => e.volume > 0);

        setExternalEntities({
          mitraDist: formatExternal(
            mitra.sort(
              (a: any, b: any) =>
                b.Submission?.length - a.Submission?.length || 0,
            ),
          ),
          asuransiDist: formatExternal(
            asuransi.sort(
              (a: any, b: any) =>
                b.Submission?.length - a.Submission?.length || 0,
            ),
          ),
          payOfficeDist: formatExternal(
            payoffice.sort(
              (a: any, b: any) =>
                b.Submission?.length - a.Submission?.length || 0,
            ),
          ),
        });

        // ==================================================
        // 3. SET METRICS & FORMAT 4 PILAR STATUS
        // ==================================================
        const compliance =
          totalRequiredFiles > 0
            ? Math.round((totalUploadedFiles / totalRequiredFiles) * 100)
            : 100;

        setGlobalMetrics({
          totalDebitur: debitur.length,
          totalSubmission: submission.length,
          totalValueLending: totalLending,
          totalValueLunas: totalLunas,
          totalValueFunding: totalFunding,
          complianceRate: compliance > 100 ? 100 : compliance,
        });

        const mapToChartArr = (map: Record<string, number>) =>
          Object.entries(map).map(([name, value]) => ({ name, value }));
        setStatusState({
          approve: mapToChartArr(appMap),
          doc: mapToChartArr(docMap),
          guarantee: mapToChartArr(guaMap),
          flagging: mapToChartArr(flaMap),
        });
      }
    } catch (err) {
      console.error("Gagal melakukan analisis mendalam E-Arsip:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatIDR = (num: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);

  if (loading) {
    return (
      <div className="p-6 h-96 flex flex-col items-center justify-center text-slate-500 gap-2">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">
          Melakukan analisis dashboard e-arsip...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      {/* HEADER UTAMA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Dashboard Ekosistem Portofolio & E-Arsip
          </h2>
          <p className="text-xs text-slate-400">
            Analisis matriks komparatif produk Kredit & Tata Kelola Dokumen
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm self-start">
          <Percent className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-semibold text-slate-600">
            Digital Archive Compliance:{" "}
            <b className="text-emerald-600">{globalMetrics.complianceRate}%</b>
          </span>
        </div>
      </div>

      {/* --- ROW 1: KUMPULAN METRICS UTAMA (FUNDING VS LENDING) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Nasabah Kredit
            </p>
            <h3 className="text-2xl font-bold text-slate-800">
              {globalMetrics.totalDebitur}{" "}
              <span className="text-xs font-normal text-slate-400">
                Nasabah
              </span>
            </h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Rekening Kredit
            </p>
            <h3 className="text-2xl font-bold text-slate-800">
              {globalMetrics.totalSubmission}{" "}
              <span className="text-xs font-normal text-slate-400">Akun</span>
            </h3>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <FolderArchive className="w-5 h-5" />
          </div>
        </div>

        {/* Portofolio Dana Masuk (Funding) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
              Total Plafond Kredit
            </p>
            <h3 className="text-xl font-bold text-slate-800">
              {formatIDR(globalMetrics.totalValueFunding)}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              Plafond Penyaluran Kredit
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Portofolio Dana Keluar (Lending) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
          <div className="space-y-1 flex-1">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">
              Total Outstanding
            </p>
            {/* <h3 className="text-xl font-bold text-slate-800">
              {formatIDR(
                globalMetrics.totalValueLending + globalMetrics.totalValueLunas,
              )}
            </h3> */}
            <div className="space-y-0.5 text-[10px] text-slate-500 font-medium">
              <div className="flex justify-between gap-3">
                <span>Aktif</span>
                <b className="text-blue-600">
                  {formatIDR(globalMetrics.totalValueLending)}
                </b>
              </div>
              <div className="flex justify-between gap-3">
                <span>Lunas</span>
                <b className="text-slate-600">
                  {formatIDR(globalMetrics.totalValueLunas)}
                </b>
              </div>
              {/* <div className="pt-1 text-slate-400">
                
              </div> */}
            </div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* --- ROW 2: DATA JATUH TEMPO JAMINAN BERDASARKAN MITRA --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-800">
            Data Jatuh Tempo Jaminan Berdasarkan Mitra
          </h3>
          <p className="text-xs text-slate-400">
            Monitoring data jatuh tempo jaminan dikelompokkan berdasarkan Mitra
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Grafik Komparasi Lini Utama */}
          <div className="xl:col-span-1 h-64 flex items-center justify-center border-r border-slate-100 pr-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={portfolioMatrix}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="typeName"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip formatter={(v) => `${v} Data`} />
                <Bar
                  dataKey="totalSubmissions"
                  name="Total Data TBO"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdown Detail Sub-Produk */}
          <div className="xl:col-span-2 space-y-4 max-h-65 overflow-y-auto pr-2">
            {portfolioMatrix.map((type, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200/60 shadow-sm">
                    {type.typeName}
                  </span>
                  <span className="text-xs font-bold text-indigo-600">
                    {type.totalSubmissions} Data{" "}
                    <span className="text-slate-400 font-normal">
                      ({formatIDR(type.totalValue)})
                    </span>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {type.products?.map((prod: any, pIdx: number) => (
                    <div
                      key={pIdx}
                      className="bg-white p-2.5 rounded-lg border border-slate-100 flex justify-between items-center text-[11px]"
                    >
                      <span className="font-semibold text-slate-600 truncate max-w-35">
                        &#8226; {prod.productName}
                      </span>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-800 block">
                          {formatIDR(prod.value)}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          {prod.count} Data
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- ROW 3: 4 PILAR STATUS KONTROL YANG DIMINTA USER --- */}
      <div className="bg-slate-100/50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
        <div className="px-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-500" />
            Kontrol Status Administrasi Arsip Kredit
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pilar 1: Approve Status Nasabah */}
          <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              1. Status Kredit
            </h4>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusState.approve}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={42}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusState.approve.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          COLOR_STATUS[entry.name.toUpperCase()] ||
                          PALETTE[index % PALETTE.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] font-medium space-y-1 border-t pt-2 border-slate-50 text-slate-600">
              {statusState.approve.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.name}</span>
                  <b>{item.value} Akun</b>
                </div>
              ))}
            </div>
          </div>

          {/* Pilar 2: Status Dokumen */}
          <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              2. Status Dokumen Kredit
            </h4>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusState.doc}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={42}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusState.doc.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          COLOR_STATUS[entry.name.toUpperCase()] ||
                          PALETTE[(index + 1) % PALETTE.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] font-medium space-y-1 border-t pt-2 border-slate-50 text-slate-600">
              {statusState.doc.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.name}</span>
                  <b>{item.value} Berkas</b>
                </div>
              ))}
            </div>
          </div>

          {/* Pilar 3: Status Jaminan */}
          <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              3. Status Agunan / Jaminan
            </h4>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusState.guarantee}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={42}
                    paddingAngle={2}
                    minAngle={5}
                    dataKey="value"
                  >
                    {statusState.guarantee.map((entry, index) => {
                      // Tentukan warna konsisten berdasarkan mapping atau indeks palette
                      const color =
                        COLOR_STATUS[entry.name.toUpperCase()] ||
                        PALETTE[index % PALETTE.length];

                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Daftar Teks dengan Indikator Warna yang Sinkron */}
            <div className="text-[10px] font-medium space-y-1 border-t pt-2 border-slate-50 text-slate-600">
              {statusState.guarantee.map((item, i) => {
                const color =
                  COLOR_STATUS[item.name.toUpperCase()] ||
                  PALETTE[i % PALETTE.length];

                return (
                  <div key={i} className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      {/* Indikator titik warna agar sama persis dengan chart */}
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: color }}
                      />
                      {item.name}
                    </span>
                    <b>{item.value} Agunan</b>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pilar 4: Status Flagging */}
          <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              4. Status Flagging
            </h4>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusState.flagging}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={42}
                    paddingAngle={2}
                    minAngle={5}
                    dataKey="value"
                  >
                    {statusState.flagging.map((entry, index) => {
                      const nameUpper = entry.name.toUpperCase();

                      // Aturan warna spesifik
                      let color;
                      if (nameUpper === "FLAGGING") {
                        color = "#10b981"; // Hijau
                      } else if (nameUpper.includes("PENDING")) {
                        color = "#f59e0b"; // Orange
                      } else if (
                        nameUpper.includes("NON") ||
                        nameUpper.includes("PENSIUNAN")
                      ) {
                        color = "#ef4444"; // Merah
                      } else {
                        color =
                          COLOR_STATUS[nameUpper] ||
                          PALETTE[(index + 3) % PALETTE.length];
                      }

                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[10px] font-medium space-y-1 border-t pt-2 border-slate-50 text-slate-600">
              {statusState.flagging.map((item, i) => {
                const nameUpper = item.name.toUpperCase();

                // Gunakan logika warna yang SAMA PERSIS agar sinkron
                let color;
                if (nameUpper === "FLAGGING") {
                  color = "#10b981"; // Hijau
                } else if (nameUpper.includes("PENDING")) {
                  color = "#f59e0b"; // Orange
                } else if (
                  nameUpper.includes("NON") ||
                  nameUpper.includes("PENSIUNAN")
                ) {
                  color = "#ef4444"; // Merah
                } else {
                  color =
                    COLOR_STATUS[nameUpper] ||
                    PALETTE[(i + 3) % PALETTE.length];
                }

                return (
                  <div key={i} className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: color }}
                      />
                      {item.name}
                    </span>
                    <b>{item.value} Data</b>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* --- ROW 4: INTEGRASI PIHAK KETIGA (MITRA, ASURANSI, KANTOR BAYAR) & TRACKING FISIK --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kontribusi Asosiasi Pihak Ketiga */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Volume Berkas dari Aliansi Pihak Ketiga
            </h3>
            <p className="text-xs text-slate-400">
              Total sebaran kontribusi arsip dari Mitra Bisnis, Pihak Asuransi
              Proteksi, dan Kantor Bayar Mitra
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            {/* Box Mitra */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-2">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" /> Mitra
                Kerja
              </span>
              <div className="space-y-1 max-h-30 overflow-y-auto text-[11px]">
                {externalEntities.mitraDist.length === 0 ? (
                  <p className="text-slate-400">0 Data</p>
                ) : (
                  externalEntities.mitraDist.map((m, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-slate-600"
                    >
                      <span>{m.name}</span>
                      <b>
                        {m.volume} ({IDRFormat(m.value)})
                      </b>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Box Asuransi */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />{" "}
                Asuransi
              </span>
              <div className="space-y-1 max-h-30 overflow-y-auto text-[11px]">
                {externalEntities.asuransiDist.length === 0 ? (
                  <p className="text-slate-400">0 Data</p>
                ) : (
                  externalEntities.asuransiDist.map((a, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-slate-600"
                    >
                      <span>{a.name}</span>
                      <b>
                        {a.volume} ({IDRFormat(a.value)})
                      </b>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Box Kantor Bayar */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-2">
                <Wallet className="w-3.5 h-3.5 text-sky-500" /> Kantor Bayar
              </span>
              <div className="space-y-1 max-h-30 overflow-y-auto text-[11px]">
                {externalEntities.payOfficeDist.length === 0 ? (
                  <p className="text-slate-400">0 Data</p>
                ) : (
                  externalEntities.payOfficeDist.map((p, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-slate-600"
                    >
                      <span>{p.name}</span>
                      <b>
                        {p.volume} ({IDRFormat(p.value)})
                      </b>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// import { useState, useEffect } from "react";
// import api from "../../libs/api";
// import {
//   FolderArchive,
//   Users,
//   Layers,
//   Building2,
//   ShieldCheck,
//   Wallet,
//   Percent,
//   CheckCircle2,
// } from "lucide-react";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
// } from "recharts";

// // --- INTERFACES BINDING DATA ---
// import type { ISubmission } from "../../libs/interface";
// import { IDRFormat } from "../utils/utilForm";

// const COLOR_STATUS: Record<string, string> = {
//   APPROVED: "#10b981",
//   DISETUJUI: "#10b981",
//   DONE: "#10b981",
//   PENDING: "#f59e0b",
//   PROSES: "#f59e0b",
//   REJECTED: "#ef4444",
//   DITOLAK: "#ef4444",
//   FLAGGED: "#3b82f6",
//   ACTIVE: "#3b82f6",
// };

// const PALETTE = [
//   "#6366f1",
//   "#0ea5e9",
//   "#10b981",
//   "#f59e0b",
//   "#ec4899",
//   "#8b5cf6",
// ];

// export default function DashboardEarsip() {
//   const [loading, setLoading] = useState(false);

//   // 1. Indikator Utama Global
//   const [globalMetrics, setGlobalMetrics] = useState({
//     totalDebitur: 0,
//     totalSubmission: 0,
//     totalValueLending: 0, // Khusus untuk Tabungan/Kredit/Deposito penyebutan disesuaikan
//     totalValueFunding: 0, // Dana Pihak Ketiga (Tabungan + Deposito)
//     complianceRate: 0, // Rasio pemenuhan file digital arsip
//   });

//   // 2. 4 Pilar Status Utama (Request User)
//   const [statusState, setStatusState] = useState({
//     approve: [] as any[],
//     doc: [] as any[],
//     guarantee: [] as any[],
//     flagging: [] as any[],
//   });

//   // 3. Analisis Berjenjang (ProductType -> Product -> Submission)
//   const [portfolioMatrix, setPortfolioMatrix] = useState<any[]>([]);

//   // 4. Analisis Pihak Ketiga Eksternal
//   const [externalEntities, setExternalEntities] = useState({
//     mitraDist: [] as any[],
//     asuransiDist: [] as any[],
//     payOfficeDist: [] as any[],
//   });

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const res = await api.get("/earsip");
//       if (res?.data) {
//         const {
//           debitur = [],
//           submission = [],
//           producttype = [],
//           mitra = [],
//           asuransi = [],
//           payoffice = [],
//         } = res.data;

//         // Penampung Rumpun Status
//         const appMap: Record<string, number> = {};
//         const docMap: Record<string, number> = {};
//         const guaMap: Record<string, number> = {};
//         const flaMap: Record<string, number> = {};

//         let totalLending = 0;
//         let totalFunding = 0;
//         let totalRequiredFiles = 0;
//         let totalUploadedFiles = 0;

//         // ==================================================
//         // 1. HITUNG METRICS GLOBAL DARI PRODUCT TYPE -> PRODUCT
//         // ==================================================
//         producttype.forEach((pt: any) => {
//           const requiredFileCount = pt.ProductTypeFile?.length || 0;

//           pt.Product?.forEach((p: any) => {
//             const subList = p.Submission || [];

//             subList.forEach((s: ISubmission) => {
//               const val = s.value || 0;
//               totalFunding += val;

//               // Masuk kalkulasi file compliance
//               totalRequiredFiles += requiredFileCount;
//               totalUploadedFiles += s.Files?.length || 0;

//               // Akumulasi nominal global berdasarkan jenis produk
//               if (s.approve_status !== "LUNAS") {
//                 totalLending += val;
//               }

//               // Hitung Frekuensi Status Kontrol (4 Pilar)
//               appMap[s.approve_status || "PENDING"] =
//                 (appMap[s.approve_status || "PENDING"] || 0) + 1;
//               docMap[s.doc_status || "PROSES"] =
//                 (docMap[s.doc_status || "PROSES"] || 0) + 1;
//               guaMap[s.guarantee_status || "PROSES"] =
//                 (guaMap[s.guarantee_status || "PROSES"] || 0) + 1;
//               flaMap[s.flagging_status || "NONE"] =
//                 (flaMap[s.flagging_status || "NONE"] || 0) + 1;
//             });
//           });
//         });

//         // ==================================================
//         // 1b. DATA JATUH TEMPO JAMINAN BERDASARKAN MITRA
//         // Ketentuan:
//         // - Hanya status_flagging selain NON_PENSIUNAN
//         // - LEWAT TBO: guarantee_date sudah lewat dan belum FLAGGING
//         // - MASA TBO: guarantee_date belum lewat dan belum FLAGGING
//         // - NOT SET: guarantee_date masih null
//         // - Mitra kosong tidak ditampilkan
//         // ==================================================
//         const normalizeStatus = (value: any) =>
//           String(value || "")
//             .trim()
//             .toUpperCase()
//             .replace(/[\s-]+/g, "_");

//         const toStartOfDay = (date: Date) => {
//           const d = new Date(date);
//           d.setHours(0, 0, 0, 0);
//           return d;
//         };

//         const today = toStartOfDay(new Date()).getTime();

//         const getTboCategory = (s: any) => {
//           const flaggingStatus = normalizeStatus(s.flagging_status);

//           if (flaggingStatus === "NON_PENSIUNAN") return null;

//           if (!s.guarantee_date) {
//             return "NOT SET";
//           }

//           // Data yang sudah FLAGGING tidak masuk LEWAT/MASA TBO
//           if (flaggingStatus === "FLAGGING") return null;

//           const guaranteeDate = toStartOfDay(
//             new Date(s.guarantee_date),
//           ).getTime();
//           if (Number.isNaN(guaranteeDate)) {
//             return "NOT SET";
//           }

//           return guaranteeDate < today ? "LEWAT TBO" : "MASA TBO";
//         };

//         const matrixReport = mitra
//           .filter((m: any) => String(m.name || "").trim())
//           .map((m: any) => {
//             const categoryMap: Record<
//               string,
//               { productName: string; count: number; value: number }
//             > = {
//               "LEWAT TBO": { productName: "LEWAT TBO", count: 0, value: 0 },
//               "MASA TBO": { productName: "MASA TBO", count: 0, value: 0 },
//               "NOT SET": { productName: "NOT SET", count: 0, value: 0 },
//             };

//             (m.Submission || []).forEach((s: any) => {
//               const category = getTboCategory(s);
//               if (!category) return;

//               categoryMap[category].count += 1;
//               categoryMap[category].value += s.value || 0;
//             });

//             const products = Object.values(categoryMap).filter(
//               (item) => item.count > 0,
//             );

//             const totalSubmissions = products.reduce(
//               (acc, item) => acc + item.count,
//               0,
//             );
//             const totalValue = products.reduce(
//               (acc, item) => acc + item.value,
//               0,
//             );

//             return {
//               typeName: m.name,
//               totalSubmissions,
//               totalValue,
//               products,
//             };
//           })
//           .filter((m: any) => m.totalSubmissions > 0)
//           .sort(
//             (
//               a: { totalSubmissions: number; totalValue: number },
//               b: { totalSubmissions: number; totalValue: number },
//             ) =>
//               b.totalSubmissions - a.totalSubmissions ||
//               b.totalValue - a.totalValue,
//           );

//         setPortfolioMatrix(matrixReport);

//         // ==================================================
//         // 2. ANALISIS ENTITAS EKSTERNAL (MITRA, INS, PAY OFFICE)
//         // ==================================================
//         const formatExternal = (entities: any[]) =>
//           entities
//             .map((e) => ({
//               name: e.name,
//               volume: e.Submission?.length || 0,
//               value:
//                 e.Submission?.length > 0
//                   ? e.Submission.reduce(
//                       (acc: any, curr: any) => acc + curr.value,
//                       0,
//                     )
//                   : 0,
//             }))
//             .filter((e) => e.volume > 0);

//         setExternalEntities({
//           mitraDist: formatExternal(
//             mitra.sort(
//               (a: any, b: any) =>
//                 b.Submission?.length - a.Submission?.length || 0,
//             ),
//           ),
//           asuransiDist: formatExternal(
//             asuransi.sort(
//               (a: any, b: any) =>
//                 b.Submission?.length - a.Submission?.length || 0,
//             ),
//           ),
//           payOfficeDist: formatExternal(
//             payoffice.sort(
//               (a: any, b: any) =>
//                 b.Submission?.length - a.Submission?.length || 0,
//             ),
//           ),
//         });

//         // ==================================================
//         // 3. SET METRICS & FORMAT 4 PILAR STATUS
//         // ==================================================
//         const compliance =
//           totalRequiredFiles > 0
//             ? Math.round((totalUploadedFiles / totalRequiredFiles) * 100)
//             : 100;

//         setGlobalMetrics({
//           totalDebitur: debitur.length,
//           totalSubmission: submission.length,
//           totalValueLending: totalLending,
//           totalValueFunding: totalFunding,
//           complianceRate: compliance > 100 ? 100 : compliance,
//         });

//         const mapToChartArr = (map: Record<string, number>) =>
//           Object.entries(map).map(([name, value]) => ({ name, value }));
//         setStatusState({
//           approve: mapToChartArr(appMap),
//           doc: mapToChartArr(docMap),
//           guarantee: mapToChartArr(guaMap),
//           flagging: mapToChartArr(flaMap),
//         });
//       }
//     } catch (err) {
//       console.error("Gagal melakukan analisis mendalam E-Arsip:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const formatIDR = (num: number) =>
//     new Intl.NumberFormat("id-ID", {
//       style: "currency",
//       currency: "IDR",
//       maximumFractionDigits: 0,
//     }).format(num);

//   if (loading) {
//     return (
//       <div className="p-6 h-96 flex flex-col items-center justify-center text-slate-500 gap-2">
//         <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
//         <p className="text-sm font-medium">
//           Melakukan analisis dashboard e-arsip...
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
//       {/* HEADER UTAMA */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
//         <div>
//           <h2 className="text-xl font-bold text-slate-800">
//             Dashboard Ekosistem Portofolio & E-Arsip
//           </h2>
//           <p className="text-xs text-slate-400">
//             Analisis matriks komparatif produk Kredit & Tata Kelola Dokumen
//           </p>
//         </div>
//         <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm self-start">
//           <Percent className="w-4 h-4 text-emerald-500" />
//           <span className="text-xs font-semibold text-slate-600">
//             Digital Archive Compliance:{" "}
//             <b className="text-emerald-600">{globalMetrics.complianceRate}%</b>
//           </span>
//         </div>
//       </div>

//       {/* --- ROW 1: KUMPULAN METRICS UTAMA (FUNDING VS LENDING) --- */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
//         <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
//           <div className="space-y-1">
//             <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
//               Total Nasabah Kredit
//             </p>
//             <h3 className="text-2xl font-bold text-slate-800">
//               {globalMetrics.totalDebitur}{" "}
//               <span className="text-xs font-normal text-slate-400">
//                 Nasabah
//               </span>
//             </h3>
//           </div>
//           <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
//             <Users className="w-5 h-5" />
//           </div>
//         </div>

//         <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
//           <div className="space-y-1">
//             <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
//               Total Rekening Kredit
//             </p>
//             <h3 className="text-2xl font-bold text-slate-800">
//               {globalMetrics.totalSubmission}{" "}
//               <span className="text-xs font-normal text-slate-400">Akun</span>
//             </h3>
//           </div>
//           <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
//             <FolderArchive className="w-5 h-5" />
//           </div>
//         </div>

//         {/* Portofolio Dana Masuk (Funding) */}
//         <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
//           <div className="space-y-1">
//             <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
//               Total Plafond Kredit
//             </p>
//             <h3 className="text-xl font-bold text-slate-800">
//               {formatIDR(globalMetrics.totalValueFunding)}
//             </h3>
//             <p className="text-[10px] text-slate-400 font-medium">
//               Plafond Penyaluran Kredit
//             </p>
//           </div>
//           <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
//             <Wallet className="w-5 h-5" />
//           </div>
//         </div>

//         {/* Portofolio Dana Keluar (Lending) */}
//         <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
//           <div className="space-y-1">
//             <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">
//               Total Outstanding
//             </p>
//             <h3 className="text-xl font-bold text-slate-800">
//               {formatIDR(globalMetrics.totalValueLending)}
//             </h3>
//             <p className="text-[10px] text-slate-400 font-medium">
//               Plafond Kredit Aktif
//             </p>
//           </div>
//           <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
//             <Layers className="w-5 h-5" />
//           </div>
//         </div>
//       </div>

//       {/* --- ROW 2: DATA JATUH TEMPO JAMINAN BERDASARKAN MITRA --- */}
//       <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
//         <div className="mb-4">
//           <h3 className="text-sm font-bold text-slate-800">
//             Data Jatuh Tempo Jaminan Berdasarkan Mitra
//           </h3>
//           <p className="text-xs text-slate-400">
//             Monitoring TBO dari guarantee date untuk data selain Non Pensiunan,
//             dikelompokkan berdasarkan Mitra
//           </p>
//         </div>

//         <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
//           {/* Grafik Komparasi Lini Utama */}
//           <div className="xl:col-span-1 h-64 flex items-center justify-center border-r border-slate-100 pr-2">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart
//                 data={portfolioMatrix}
//                 margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
//               >
//                 <CartesianGrid
//                   strokeDasharray="3 3"
//                   stroke="#f1f5f9"
//                   vertical={false}
//                 />
//                 <XAxis
//                   dataKey="typeName"
//                   stroke="#94a3b8"
//                   fontSize={11}
//                   tickLine={false}
//                 />
//                 <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
//                 <Tooltip formatter={(v) => `${v} Data`} />
//                 <Bar
//                   dataKey="totalSubmissions"
//                   name="Total Data TBO"
//                   fill="#6366f1"
//                   radius={[4, 4, 0, 0]}
//                 />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Breakdown Detail Sub-Produk */}
//           <div className="xl:col-span-2 space-y-4 max-h-65 overflow-y-auto pr-2">
//             {portfolioMatrix.map((type, idx) => (
//               <div
//                 key={idx}
//                 className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2"
//               >
//                 <div className="flex justify-between items-center">
//                   <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200/60 shadow-sm">
//                     {type.typeName}
//                   </span>
//                   <span className="text-xs font-bold text-indigo-600">
//                     {type.totalSubmissions} Data{" "}
//                     <span className="text-slate-400 font-normal">
//                       ({formatIDR(type.totalValue)})
//                     </span>
//                   </span>
//                 </div>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
//                   {type.products?.map((prod: any, pIdx: number) => (
//                     <div
//                       key={pIdx}
//                       className="bg-white p-2.5 rounded-lg border border-slate-100 flex justify-between items-center text-[11px]"
//                     >
//                       <span className="font-semibold text-slate-600 truncate max-w-35">
//                         &#8226; {prod.productName}
//                       </span>
//                       <div className="text-right shrink-0">
//                         <span className="font-bold text-slate-800 block">
//                           {formatIDR(prod.value)}
//                         </span>
//                         <span className="text-slate-400 text-[10px]">
//                           {prod.count} Data
//                         </span>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* --- ROW 3: 4 PILAR STATUS KONTROL YANG DIMINTA USER --- */}
//       <div className="bg-slate-100/50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
//         <div className="px-1">
//           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
//             <CheckCircle2 className="w-4 h-4 text-slate-500" />
//             Kontrol Status Administrasi Arsip Kredit
//           </h3>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//           {/* Pilar 1: Approve Status Nasabah */}
//           <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between">
//             <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
//               1. Status Kredit
//             </h4>
//             <div className="h-28">
//               <ResponsiveContainer width="100%" height="100%">
//                 <PieChart>
//                   <Pie
//                     data={statusState.approve}
//                     cx="50%"
//                     cy="50%"
//                     innerRadius={30}
//                     outerRadius={42}
//                     paddingAngle={2}
//                     dataKey="value"
//                   >
//                     {statusState.approve.map((entry, index) => (
//                       <Cell
//                         key={`cell-${index}`}
//                         fill={
//                           COLOR_STATUS[entry.name.toUpperCase()] ||
//                           PALETTE[index % PALETTE.length]
//                         }
//                       />
//                     ))}
//                   </Pie>
//                   <Tooltip />
//                 </PieChart>
//               </ResponsiveContainer>
//             </div>
//             <div className="text-[10px] font-medium space-y-1 border-t pt-2 border-slate-50 text-slate-600">
//               {statusState.approve.map((item, i) => (
//                 <div key={i} className="flex justify-between">
//                   <span>{item.name}</span>
//                   <b>{item.value} Akun</b>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Pilar 2: Status Dokumen */}
//           <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between">
//             <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
//               2. Status Dokumen Kredit
//             </h4>
//             <div className="h-28">
//               <ResponsiveContainer width="100%" height="100%">
//                 <PieChart>
//                   <Pie
//                     data={statusState.doc}
//                     cx="50%"
//                     cy="50%"
//                     innerRadius={30}
//                     outerRadius={42}
//                     paddingAngle={2}
//                     dataKey="value"
//                   >
//                     {statusState.doc.map((entry, index) => (
//                       <Cell
//                         key={`cell-${index}`}
//                         fill={
//                           COLOR_STATUS[entry.name.toUpperCase()] ||
//                           PALETTE[(index + 1) % PALETTE.length]
//                         }
//                       />
//                     ))}
//                   </Pie>
//                   <Tooltip />
//                 </PieChart>
//               </ResponsiveContainer>
//             </div>
//             <div className="text-[10px] font-medium space-y-1 border-t pt-2 border-slate-50 text-slate-600">
//               {statusState.doc.map((item, i) => (
//                 <div key={i} className="flex justify-between">
//                   <span>{item.name}</span>
//                   <b>{item.value} Berkas</b>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Pilar 3: Status Jaminan */}
//           <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between">
//             <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
//               3. Status Agunan / Jaminan
//             </h4>
//             <div className="h-28">
//               <ResponsiveContainer width="100%" height="100%">
//                 <PieChart>
//                   <Pie
//                     data={statusState.guarantee}
//                     cx="50%"
//                     cy="50%"
//                     innerRadius={30}
//                     outerRadius={42}
//                     paddingAngle={2}
//                     dataKey="value"
//                   >
//                     {statusState.guarantee.map((entry, index) => (
//                       <Cell
//                         key={`cell-${index}`}
//                         fill={
//                           COLOR_STATUS[entry.name.toUpperCase()] ||
//                           PALETTE[(index + 2) % PALETTE.length]
//                         }
//                       />
//                     ))}
//                   </Pie>
//                   <Tooltip />
//                 </PieChart>
//               </ResponsiveContainer>
//             </div>
//             <div className="text-[10px] font-medium space-y-1 border-t pt-2 border-slate-50 text-slate-600">
//               {statusState.guarantee.map((item, i) => (
//                 <div key={i} className="flex justify-between">
//                   <span>{item.name}</span>
//                   <b>{item.value} Agunan</b>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Pilar 4: Status Flagging */}
//           <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between">
//             <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
//               4. Status Flagging
//             </h4>
//             <div className="h-28">
//               <ResponsiveContainer width="100%" height="100%">
//                 <PieChart>
//                   <Pie
//                     data={statusState.flagging}
//                     cx="50%"
//                     cy="50%"
//                     innerRadius={30}
//                     outerRadius={42}
//                     paddingAngle={2}
//                     dataKey="value"
//                   >
//                     {statusState.flagging.map((entry, index) => (
//                       <Cell
//                         key={`cell-${index}`}
//                         fill={
//                           COLOR_STATUS[entry.name.toUpperCase()] ||
//                           PALETTE[(index + 3) % PALETTE.length]
//                         }
//                       />
//                     ))}
//                   </Pie>
//                   <Tooltip />
//                 </PieChart>
//               </ResponsiveContainer>
//             </div>
//             <div className="text-[10px] font-medium space-y-1 border-t pt-2 border-slate-50 text-slate-600">
//               {statusState.flagging.map((item, i) => (
//                 <div key={i} className="flex justify-between">
//                   <span>{item.name}</span>
//                   <b>{item.value} Data</b>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* --- ROW 4: INTEGRASI PIHAK KETIGA (MITRA, ASURANSI, KANTOR BAYAR) & TRACKING FISIK --- */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Kontribusi Asosiasi Pihak Ketiga */}
//         <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
//           <div>
//             <h3 className="text-sm font-bold text-slate-800">
//               Volume Berkas dari Aliansi Pihak Ketiga
//             </h3>
//             <p className="text-xs text-slate-400">
//               Total sebaran kontribusi arsip dari Mitra Bisnis, Pihak Asuransi
//               Proteksi, dan Kantor Bayar Mitra
//             </p>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
//             {/* Box Mitra */}
//             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
//               <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-2">
//                 <Building2 className="w-3.5 h-3.5 text-indigo-500" /> Mitra
//                 Kerja
//               </span>
//               <div className="space-y-1 max-h-30 overflow-y-auto text-[11px]">
//                 {externalEntities.mitraDist.length === 0 ? (
//                   <p className="text-slate-400">0 Data</p>
//                 ) : (
//                   externalEntities.mitraDist.map((m, i) => (
//                     <div
//                       key={i}
//                       className="flex justify-between text-slate-600"
//                     >
//                       <span>{m.name}</span>
//                       <b>
//                         {m.volume} ({IDRFormat(m.value)})
//                       </b>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>

//             {/* Box Asuransi */}
//             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
//               <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-2">
//                 <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />{" "}
//                 Asuransi
//               </span>
//               <div className="space-y-1 max-h-30 overflow-y-auto text-[11px]">
//                 {externalEntities.asuransiDist.length === 0 ? (
//                   <p className="text-slate-400">0 Data</p>
//                 ) : (
//                   externalEntities.asuransiDist.map((a, i) => (
//                     <div
//                       key={i}
//                       className="flex justify-between text-slate-600"
//                     >
//                       <span>{a.name}</span>
//                       <b>
//                         {a.volume} ({IDRFormat(a.value)})
//                       </b>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>

//             {/* Box Kantor Bayar */}
//             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
//               <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-2">
//                 <Wallet className="w-3.5 h-3.5 text-sky-500" /> Kantor Bayar
//               </span>
//               <div className="space-y-1 max-h-30 overflow-y-auto text-[11px]">
//                 {externalEntities.payOfficeDist.length === 0 ? (
//                   <p className="text-slate-400">0 Data</p>
//                 ) : (
//                   externalEntities.payOfficeDist.map((p, i) => (
//                     <div
//                       key={i}
//                       className="flex justify-between text-slate-600"
//                     >
//                       <span>{p.name}</span>
//                       <b>
//                         {p.volume} ({IDRFormat(p.value)})
//                       </b>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
