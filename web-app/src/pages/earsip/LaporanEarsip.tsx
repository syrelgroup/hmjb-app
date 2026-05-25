import { useState, useEffect } from "react";
import api from "../../libs/api";
import {
  FolderArchive,
  Users,
  Layers,
  Building2,
  ShieldCheck,
  Wallet,
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
import ExcelJS from "exceljs";

// --- INTERFACES BINDING DATA ---
import type { IMitra, ISubmission } from "../../libs/interface";
import { IDRFormat } from "../utils/utilForm";
import { Button, DatePicker, Modal } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import { printEarsip } from "../utils/pdfs/earsip";
import moment from "moment";
import useContext from "../../libs/context";

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

export default function LaporanEarsip() {
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState<string | null>(null);
  const [data, setData] = useState<any>();
  const { hasAccess } = useContext();

  // 1. Indikator Utama Global
  const [globalMetrics, setGlobalMetrics] = useState({
    totalDebitur: 0,
    totalSubmission: 0,
    totalValueLending: 0, // Khusus untuk Tabungan/Kredit/Deposito penyebutan disesuaikan
    totalValueFunding: 0, // Dana Pihak Ketiga (Tabungan + Deposito)
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
      const res = await api.get("/earsip", { params: { month: month } });
      if (res?.data) {
        const {
          debitur = [],
          submission = [],
          producttype = [],
          mitra = [],
          asuransi = [],
          payoffice = [],
        } = res.data;
        setData(res.data);

        // Penampung Rumpun Status
        const appMap: Record<string, number> = {};
        const docMap: Record<string, number> = {};
        const guaMap: Record<string, number> = {};
        const flaMap: Record<string, number> = {};

        let totalLending = 0;
        let totalFunding = 0;
        let totalRequiredFiles = 0;
        let totalUploadedFiles = 0;

        // ==================================================
        // 1. BREAKDOWN PORTOFOLIO BERJENJANG (PRODUCT TYPE -> PRODUCT)
        // ==================================================
        const matrixReport = producttype.map((pt: any) => {
          let typeSubmissionCount = 0;
          let typeTotalValue = 0;
          const isFunding =
            pt.name.toUpperCase().includes("TABUNGAN") ||
            pt.name.toUpperCase().includes("DEPOSITO");

          // Ambil aturan jumlah file wajib pada tipe produk ini
          const requiredFileCount = pt.ProductTypeFile?.length || 0;

          const productBreakdown = pt.Product?.map((p: any) => {
            const subList = p.Submission || [];
            typeSubmissionCount += subList.length;

            let productValue = 0;
            subList.forEach((s: ISubmission) => {
              const val = s.value || 0;
              productValue += val;

              // Masuk kalkulasi file compliance
              totalRequiredFiles += requiredFileCount;
              totalUploadedFiles += s.Files?.length || 0;

              // Akumulasi nominal global berdasarkan jenis produk
              if (isFunding) {
                totalFunding += val;
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

            typeTotalValue += productValue;

            return {
              productName: p.name,
              count: subList.length,
              value: productValue,
            };
          });

          return {
            typeName: pt.name,
            totalSubmissions: typeSubmissionCount,
            totalValue: typeTotalValue,
            products: productBreakdown || [],
          };
        });

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
          mitraDist: formatExternal(mitra),
          asuransiDist: formatExternal(asuransi),
          payOfficeDist: formatExternal(payoffice),
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
  }, [month]);

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
          Melakukan data analisis dashboard...
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
            Analisis matriks komparatif produk Funding (Tabungan, Deposito) vs
            Lending (Kredit) & Tata Kelola Dokumen
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2  self-start">
          {/* <Percent className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-semibold text-slate-600">
            Digital Archive Compliance:{" "}
            <b className="text-emerald-600">{globalMetrics.complianceRate}%</b>
          </span> */}
          <DatePicker
            picker="month"
            size="small"
            onChange={(_, datestr) => setMonth(datestr)}
          />
          {hasAccess(window.location.pathname, "download") && (
            <ExportsData data={data} month={month} />
          )}
        </div>
      </div>

      {/* --- ROW 1: KUMPULAN METRICS UTAMA (FUNDING VS LENDING) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total CIF Debitur
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
              Total Rekening Arsip
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
              Volume Funding (DPK)
            </p>
            <h3 className="text-xl font-bold text-slate-800">
              {formatIDR(globalMetrics.totalValueFunding)}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              Akumulasi Tabungan + Deposito
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Portofolio Dana Keluar (Lending) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">
              Outstanding Lending
            </p>
            <h3 className="text-xl font-bold text-slate-800">
              {formatIDR(globalMetrics.totalValueLending)}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              Plafond Penyaluran Kredit
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* --- ROW 2: MATRIX ANALISIS BERJENJANG (PRODUCT TYPE -> PRODUCT -> SUBMISSION) --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-800">
            Matriks Segmentasi Berjenjang Lini Produk
          </h3>
          <p className="text-xs text-slate-400">
            Analisis sebaran akun rekening dan kapitalisasi nilai nominal per
            jenis sub-produk
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
                <Tooltip formatter={(v) => formatIDR(Number(v))} />
                <Bar
                  dataKey="totalValue"
                  name="Total Kapitalisasi"
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
                    {formatIDR(type.totalValue)}{" "}
                    <span className="text-slate-400 font-normal">
                      ({type.totalSubmissions} Akun)
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
                          {prod.count} Berkas Berhasil diarsip
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
            <CheckCircle2 className="w-4 h-4 text-slate-500" /> 4 Pilar Utama
            Kontrol Status Administrasi Arsip
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pilar 1: Approve Status Nasabah */}
          <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              1. Status Nasabah (Approve)
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
              2. Status Validasi Dokumen
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
                    dataKey="value"
                  >
                    {statusState.guarantee.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          COLOR_STATUS[entry.name.toUpperCase()] ||
                          PALETTE[(index + 2) % PALETTE.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] font-medium space-y-1 border-t pt-2 border-slate-50 text-slate-600">
              {statusState.guarantee.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.name}</span>
                  <b>{item.value} Agunan</b>
                </div>
              ))}
            </div>
          </div>

          {/* Pilar 4: Status Flagging */}
          <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              4. Status Flagging Berkas
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
                    dataKey="value"
                  >
                    {statusState.flagging.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          COLOR_STATUS[entry.name.toUpperCase()] ||
                          PALETTE[(index + 3) % PALETTE.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] font-medium space-y-1 border-t pt-2 border-slate-50 text-slate-600">
              {statusState.flagging.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.name}</span>
                  <b>{item.value} Data</b>
                </div>
              ))}
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

const ExportsData = ({ data, month }: { data: any; month: string | null }) => {
  const [open, setOpen] = useState(false);

  const handleExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();

      // 1. Inisialisasi struktur penampung data terpisah
      const dataPensiunan: any[] = [];
      const dataNonPensiunan: any[] = [];

      // Inisialisasi struktur akumulator nilai total global
      const totalspensiun = createInitialTotal();
      const totalsnonpensiun = createInitialTotal();

      // 2. Pemisahan mutlak tingkat Debitur/Nasabah
      data.mitra.forEach((mitra: IMitra) => {
        const submissions = (mitra.Submission || []) as ISubmission[];
        const subPensiun: ISubmission[] = [];
        const subNonPensiun: ISubmission[] = [];

        for (const s of submissions) {
          if (s.flagging_status === "NON_PENSIUNAN") {
            subNonPensiun.push(s);
          } else {
            subPensiun.push(s);
          }
        }

        if (subPensiun.length > 0) {
          const rowPensiun = hitungStatusSubmissions(subPensiun, totalspensiun);
          dataPensiunan.push({
            ...mitra,
            Submission: subPensiun,
            rekap: rowPensiun,
          });
        }

        if (subNonPensiun.length > 0) {
          const rowNonPensiun = hitungStatusSubmissions(
            subNonPensiun,
            totalsnonpensiun,
          );
          dataNonPensiunan.push({
            ...mitra,
            Submission: subNonPensiun,
            rekap: rowNonPensiun,
          });
        }
      });

      // 3. Bangun Lembar Kerja (Sheets) Excel
      buildSheet(
        workbook,
        "Rekap Mitra Pensiun",
        "REKAP BERDASARKAN MITRA KERJA PENSIUN",
        dataPensiunan,
        true,
        month,
      );
      buildSheet(
        workbook,
        "Rekap Mitra Non Pensiun",
        "REKAP BERDASARKAN MITRA KERJA NON PENSIUN",
        dataNonPensiunan,
        false,
        month,
      );

      // === FIX TERBESAR: Proses Memicu Unduhan Otomatis Di Browser ===
      const buffer = await workbook.xlsx.writeBuffer();

      // Bungkus kumpulan byte menjadi tipe file Excel resmi
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Buat link samaran untuk download file
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Rekap_Mitra_Kerja_${month || "Semua_Periode"}.xlsx`;

      document.body.appendChild(anchor);
      anchor.click(); // Paksa browser klik download

      // Bersihkan sisa elemen dari DOM browser
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      // Tutup modal otomatis setelah berhasil download
      setOpen(false);
    } catch (error) {
      console.error("Gagal mengekspor berkas Excel: ", error);
    }
  };

  return (
    <div>
      <Button
        icon={<PrinterOutlined />}
        size="small"
        type="primary"
        onClick={() => setOpen(true)}
      >
        Cetak Laporan
      </Button>

      <Modal
        open={open}
        title="Export Data"
        destroyOnHidden
        onCancel={() => setOpen(false)}
      >
        <div className="flex gap-4 justify-evenly">
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => handleExcel()}
          >
            Cetak Excel
          </Button>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => printEarsip(data, month)}
          >
            Cetak PDF
          </Button>
        </div>
      </Modal>
    </div>
  );
};

function buildSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  titleText: string,
  dataRows: any[],
  isPensiun: boolean,
  month: string | null,
) {
  const ws = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
  });

  // ==================== 1. STYLES SHARED ====================
  const fillHeader = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFB4C6E7" },
  } as ExcelJS.Fill;
  const fontHeader = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: "FF000000" },
  };
  const borderThin = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  } as ExcelJS.Borders;

  // Sudah diperbaiki: Hanya dideklarasikan 1 kali di sini untuk seluruh fungsi
  const alignCenter: Partial<ExcelJS.Alignment> = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };

  // ==================== 2. DEFINISI KOLOM ====================
  const baseColumns = [
    { key: "no", width: 6 },
    { key: "nama_mitra", width: 35 },
    { key: "jml_debitur", width: 15 },
    { key: "aktif", width: 12 },
    { key: "lunas", width: 12 },
    { key: "jam_terima", width: 13 },
    { key: "jam_pinjam", width: 13 },
    { key: "jam_pending", width: 13 },
    { key: "file_terima", width: 13 },
    { key: "file_pinjam", width: 13 },
    { key: "file_pending", width: 13 },
  ];

  // Jika pensiun, tambahkan kolom Flagging di akhir (paling kanan)
  if (isPensiun) {
    baseColumns.push(
      { key: "flagging", width: 12 },
      { key: "pending_flag", width: 12 },
    );
  }
  ws.columns = baseColumns;

  // Teks Judul Atas
  ws.getCell("A1").value = titleText;
  ws.getCell("A1").font = {
    name: "Calibri",
    size: 16,
    bold: true,
    color: { argb: "FF002060" },
  };
  ws.getCell("A2").value = "PT. BPR HASAMITRA JAWA BARAT";
  ws.getCell("A2").font = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: "FF333333" },
  };
  ws.getCell("A3").value =
    `Periode: ${month ? moment(month).format("MMMM YYYY") : "SEMUA DATA"}`;
  ws.getCell("A3").font = {
    name: "Calibri",
    size: 10,
    italic: true,
    color: { argb: "FF595959" },
  };

  // Total jumlah kolom fisik (Pensiun: 13 kolom [A-M], Non-Pensiun: 11 kolom [A-K])
  const maxColIndex = isPensiun ? 13 : 11;

  // ==================== 3. SETUP HEADER BERTINGKAT ====================
  const headersTop = isPensiun
    ? [
        { text: "No", s: "A5", e: "A6" },
        { text: "Nama Mitra", s: "B5", e: "B6" },
        { text: "Jumlah Debitur", s: "C5", e: "C6" },
        { text: "Status Nasabah", s: "D5", e: "E5" },
        { text: "Status SK Asli", s: "F5", e: "H5" },
        { text: "Status File Kredit", s: "I5", e: "K5" },
        { text: "Status Flagging", s: "L5", e: "M5" }, // Flagging pindah ke akhir [L-M]
      ]
    : [
        { text: "No", s: "A5", e: "A6" },
        { text: "Nama Mitra", s: "B5", e: "B6" },
        { text: "Jumlah Debitur", s: "C5", e: "C6" },
        { text: "Status Nasabah", s: "D5", e: "E5" },
        { text: "Jaminan Asli", s: "F5", e: "H5" },
        { text: "Status File Kredit", s: "I5", e: "K5" },
      ];

  headersTop.forEach((h) => {
    ws.mergeCells(`${h.s}:${h.e}`);
    const cell = ws.getCell(h.s);
    cell.value = h.text;
    cell.font = fontHeader;
    cell.fill = fillHeader;
    cell.alignment = alignCenter;
  });

  const subHeaders = isPensiun
    ? [
        { pos: "D6", text: "Aktif" },
        { pos: "E6", text: "Lunas" },
        { pos: "F6", text: "Diterima" },
        { pos: "G6", text: "Dipinjam" },
        { pos: "H6", text: "Pending" },
        { pos: "I6", text: "Diterima" },
        { pos: "J6", text: "Dipinjam" },
        { pos: "K6", text: "Pending" },
        { pos: "L6", text: "Flagging" },
        { pos: "M6", text: "Pending" }, // Sub-header di akhir
      ]
    : [
        { pos: "D6", text: "Aktif" },
        { pos: "E6", text: "Lunas" },
        { pos: "F6", text: "Diterima" },
        { pos: "G6", text: "Dipinjam" },
        { pos: "H6", text: "Pending" },
        { pos: "I6", text: "Diterima" },
        { pos: "J6", text: "Dipinjam" },
        { pos: "K6", text: "Pending" },
      ];

  subHeaders.forEach((sh) => {
    const cell = ws.getCell(sh.pos);
    cell.value = sh.text;
    cell.font = fontHeader;
    cell.fill = fillHeader;
    cell.alignment = alignCenter;
  });

  // Warnai background dan border seluruh header (Baris 5 & 6)
  for (let r = 5; r <= 6; r++) {
    ws.getRow(r).height = r === 5 ? 24 : 20;
    for (let c = 1; c <= maxColIndex; c++) {
      const cell = ws.getCell(r, c);
      cell.border = borderThin;
      cell.fill = fillHeader;
    }
  }

  // ==================== 4. MASUKKAN DATA ROWS ====================
  let startRow = 7;
  dataRows.forEach((row, idx) => {
    const currentRow = startRow + idx;
    ws.getRow(currentRow).height = 20;

    // Data standar awal
    const values = [
      idx + 1,
      (row.name || "-").toUpperCase(),
      row.Submission.length,
      row.rekap.aktif,
      row.rekap.lunas,
      row.rekap.jamDiterima,
      row.rekap.jamDipinjam,
      row.rekap.jamPending,
      row.rekap.fileDiterima,
      row.rekap.fileDipinjam,
      row.rekap.filePending,
    ];

    // Jika pensiun, push data flagging di urutan paling akhir array
    if (isPensiun) {
      values.push(row.rekap.flagging, row.rekap.pendingFlagging);
    }

    values.forEach((val, colIdx) => {
      const cell = ws.getCell(currentRow, colIdx + 1);
      cell.value = val;
      cell.border = borderThin;
      cell.font = { name: "Calibri", size: 11 };

      if (colIdx === 1) {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }

      if (colIdx >= 2) {
        cell.numFmt = "#,##0";
      }
    });
  });

  // ==================== 5. BARIS TOTAL (SUM FORMULA) ====================
  const totalRowIndex = startRow + dataRows.length;
  ws.getRow(totalRowIndex).height = 22;
  ws.mergeCells(`A${totalRowIndex}:B${totalRowIndex}`);

  const totalLabelCell = ws.getCell(`A${totalRowIndex}`);
  totalLabelCell.value = "TOTAL";
  totalLabelCell.font = { name: "Calibri", size: 11, bold: true };
  totalLabelCell.alignment = { horizontal: "right", vertical: "middle" };

  // Tentukan huruf kolom yang akan di-SUM secara otomatis
  const columnsToSum = isPensiun
    ? ["C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"] // Sampai M untuk Pensiun
    : ["C", "D", "E", "F", "G", "H", "I", "J", "K"];

  columnsToSum.forEach((colLetter) => {
    const cell = ws.getCell(`${colLetter}${totalRowIndex}`);
    cell.value = {
      formula: `SUM(${colLetter}${startRow}:${colLetter}${totalRowIndex - 1})`,
    };
    cell.font = { name: "Calibri", size: 11, bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.numFmt = "#,##0";
  });

  const borderTotal = {
    top: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
    bottom: { style: "double" },
  } as ExcelJS.Borders;

  for (let c = 1; c <= maxColIndex; c++) {
    const cell = ws.getCell(totalRowIndex, c);
    cell.fill = fillHeader;
    cell.border = borderTotal;
  }

  // ==================== 6. BLOK TANDA TANGAN (3 KOLOM SEJAJAR) ====================
  const signStartRow = totalRowIndex + 3;

  // Posisi dinamis: Kolom tengah di F-G. Kolom kanan di K-M (Pensiun) atau I-K (Non-Pensiun)
  const midColStart = "F";
  const midColEnd = "G";
  const rightColStart = isPensiun ? "K" : "I";
  const rightColEnd = isPensiun ? "M" : "K";

  // Tanggal Cetak Laporan
  const today = new Date();
  const namaBulan = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const formattedDate = `Depok, ${today.getDate()} ${namaBulan[today.getMonth()]} ${today.getFullYear()}`;

  ws.mergeCells(
    `${rightColStart}${signStartRow - 1}:${rightColEnd}${signStartRow - 1}`,
  );
  const dateCell = ws.getCell(`${rightColStart}${signStartRow - 1}`);
  dateCell.value = formattedDate;
  dateCell.font = { name: "Calibri", size: 11, italic: true };
  dateCell.alignment = alignCenter;

  // Baris Jabatan Atas
  const fontLabel = { name: "Calibri", size: 11, bold: true };

  ws.mergeCells(`B${signStartRow}:C${signStartRow}`);
  const leftTitle = ws.getCell(`B${signStartRow}`);
  leftTitle.value = "Disiapkan Oleh:";
  leftTitle.font = fontLabel;
  leftTitle.alignment = alignCenter;

  ws.mergeCells(`${midColStart}${signStartRow}:${midColEnd}${signStartRow}`);
  const midTitle = ws.getCell(`${midColStart}${signStartRow}`);
  midTitle.value = "Diperiksa Oleh:";
  midTitle.font = fontLabel;
  midTitle.alignment = alignCenter;

  ws.mergeCells(
    `${rightColStart}${signStartRow}:${rightColEnd}${signStartRow}`,
  );
  const rightTitle = ws.getCell(`${rightColStart}${signStartRow}`);
  rightTitle.value = "Disetujui Oleh:";
  rightTitle.font = fontLabel;
  rightTitle.alignment = alignCenter;

  // Baris Nama Penandatangan (Space tinggi baris diatur 20)
  const nameRowIndex = signStartRow + 5;
  ws.getRow(nameRowIndex).height = 20;
  const fontName = { name: "Calibri", size: 11, bold: true, underline: true };

  ws.mergeCells(`B${nameRowIndex}:C${nameRowIndex}`);
  const leftName = ws.getCell(`B${nameRowIndex}`);
  leftName.value = "Leony";
  leftName.font = fontName;
  leftName.alignment = alignCenter;

  ws.mergeCells(`${midColStart}${nameRowIndex}:${midColEnd}${nameRowIndex}`);
  const midName = ws.getCell(`${midColStart}${nameRowIndex}`);
  midName.value = "Komang Gd Ariawan";
  midName.font = fontName;
  midName.alignment = alignCenter;

  ws.mergeCells(
    `${rightColStart}${nameRowIndex}:${rightColEnd}${nameRowIndex}`,
  );
  const rightName = ws.getCell(`${rightColStart}${nameRowIndex}`);
  rightName.value = "Ketut Sugiata";
  rightName.font = fontName;
  rightName.alignment = alignCenter;

  // Sub-Jabatan Teknis paling bawah
  const subRowIndex = nameRowIndex + 1;
  const fontSub = { name: "Calibri", size: 10, color: { argb: "FF595959" } };

  ws.mergeCells(`B${subRowIndex}:C${subRowIndex}`);
  const leftSub = ws.getCell(`B${subRowIndex}`);
  leftSub.value = "Admin Kredit";
  leftSub.font = fontSub;
  leftSub.alignment = alignCenter;

  ws.mergeCells(`${midColStart}${subRowIndex}:${midColEnd}${subRowIndex}`);
  const midSub = ws.getCell(`${midColStart}${subRowIndex}`);
  midSub.value = "Head Bisnis";
  midSub.font = fontSub;
  midSub.alignment = alignCenter;

  ws.mergeCells(`${rightColStart}${subRowIndex}:${rightColEnd}${subRowIndex}`);
  const rightSub = ws.getCell(`${rightColStart}${subRowIndex}`);
  rightSub.value = "Direktur Utama";
  rightSub.font = fontSub;
  rightSub.alignment = alignCenter;
}

// ==================== HELPER PERHITUNGAN DATA REKAP ====================
function createInitialTotal() {
  return {
    jumlahDebitur: 0,
    statusAktif: 0,
    statusLunas: 0,
    jaminanDiterima: 0,
    jaminanDipinjam: 0,
    jaminanPending: 0,
    fileDiterima: 0,
    fileDipinjam: 0,
    filePending: 0,
  };
}

function hitungStatusSubmissions(subs: ISubmission[], grandTotal: any) {
  const row = {
    aktif: 0,
    lunas: 0,
    jamDiterima: 0,
    jamDipinjam: 0,
    jamPending: 0,
    fileDiterima: 0,
    fileDipinjam: 0,
    filePending: 0,
    // Tambahkan akumulator baru di sini
    flagging: 0,
    pendingFlagging: 0,
  };

  grandTotal.jumlahDebitur += subs.length;

  for (const s of subs) {
    if (s.approve_status === "AKTIF") {
      row.aktif++;
      grandTotal.statusAktif++;
    } else if (s.approve_status === "LUNAS") {
      row.lunas++;
      grandTotal.statusLunas++;
    }

    if (s.guarantee_status === "DITERIMA") {
      row.jamDiterima++;
      grandTotal.jaminanDiterima++;
    } else if (s.guarantee_status === "DIPINJAM") {
      row.jamDipinjam++;
      grandTotal.jaminanDipinjam++;
    } else if (s.guarantee_status === "PENDING") {
      row.jamPending++;
      grandTotal.jaminanPending++;
    }

    if (s.doc_status === "DITERIMA") {
      row.fileDiterima++;
      grandTotal.fileDiterima++;
    } else if (s.doc_status === "DIPINJAM") {
      row.fileDipinjam++;
      grandTotal.fileDipinjam++;
    } else if (s.doc_status === "PENDING") {
      row.filePending++;
      grandTotal.filePending++;
    }

    // Hitung status flagging nasabah pensiun (Sesuaikan string 'FLAGGING'/'PENDING' dengan data real API Anda)
    if (s.flagging_status === "FLAGGING") {
      row.flagging++;
    } else if (s.flagging_status === "PENDING") {
      row.pendingFlagging++;
    }
  }
  return row;
}
