import {
  Users,
  TrendingUp,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Spin, message } from "antd";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "../../libs/api";
import { IDRFormat } from "../utils/utilForm";

const DashboardEarsip = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDebitur: 0,
    totalValue: "Rp 0",
    activeSubmissions: 0,
  });
  const [groupedProductData, setGroupedProductData] = useState<any[]>([]);
  const [docStatusChart, setDocStatusChart] = useState<any[]>([]);
  const [guaranteeStatusChart, setGuaranteeStatusChart] = useState<any[]>([]);
  const [flaggingStatusChart, setFlaggingStatusChart] = useState<any[]>([]);
  const [approveStatusChart, setApproveStatusChart] = useState<any[]>([]);
  const [permitDownloadData, setPermitDownloadData] = useState<any[]>([]);
  const [permitDeleteData, setPermitDeleteData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.request({
        url: "/maindashboard",
        method: "GET",
      });
      if (res?.data) {
        const data = res.data || {};

        // Calculate total debitur
        const totalDebitur =
          data.submissionType?.flatMap((d: any) => d.Debitur || []).length || 0;

        // Calculate total value from submissions
        const totalValue =
          data.productType
            ?.flatMap(
              (pd: any) => pd.Product?.flatMap((p: any) => p.Submission) || [],
            )
            .reduce((acc: any, sub: any) => acc + (sub.value || 0), 0) || 0;

        // Format currency
        const formattedValue = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        }).format(totalValue);

        // Calculate active submissions
        const activeSubmissions =
          data.productType?.flatMap(
            (pd: any) =>
              pd.Product?.flatMap((p: any) => p.Submission).filter(
                (s: any) => s.status === true,
              ) || [],
          ).length || 0;

        setStats({
          totalDebitur: totalDebitur,
          totalValue: formattedValue,
          activeSubmissions: activeSubmissions,
        });

        // Group ProductType + Product data
        const grouped =
          data.productType?.map((pt: any) => {
            const products =
              pt.Product?.map((p: any) => {
                const submissions = p.Submission || [];
                return {
                  name: p.name,
                  count: submissions.length,
                  value: submissions.reduce(
                    (acc: any, s: any) => acc + (s.value || 0),
                    0,
                  ),
                };
              }) || [];
            return {
              productTypeName: pt.name,
              products: products,
            };
          }) || [];
        setGroupedProductData(grouped);

        // Chart data: Approve Status
        const approveStatusMap = new Map<string, number>();
        const docStatusMap = new Map<string, number>();
        const guaranteeStatusMap = new Map<string, number>();
        const flaggingStatusMap = new Map<string, number>();

        data.productType?.forEach((pt: any) => {
          pt.Product?.forEach((p: any) => {
            p.Submission?.forEach((sub: any) => {
              // Approve Status
              const approveStatus = sub.approve_status || "PENDING";
              approveStatusMap.set(
                approveStatus,
                (approveStatusMap.get(approveStatus) || 0) + 1,
              );

              // Doc Status
              const docStatus = sub.doc_status || "PENDING";
              docStatusMap.set(
                docStatus,
                (docStatusMap.get(docStatus) || 0) + 1,
              );

              // Guarantee Status
              const guaranteeStatus = sub.guarantee_status || "PENDING";
              guaranteeStatusMap.set(
                guaranteeStatus,
                (guaranteeStatusMap.get(guaranteeStatus) || 0) + 1,
              );

              // Flagging Status
              const flaggingStatus = sub.flagging_status || "PENDING";
              flaggingStatusMap.set(
                flaggingStatus,
                (flaggingStatusMap.get(flaggingStatus) || 0) + 1,
              );
            });
          });
        });

        setApproveStatusChart(
          Array.from(approveStatusMap, ([name, value]) => ({ name, value })),
        );
        setDocStatusChart(
          Array.from(docStatusMap, ([name, value]) => ({ name, value })),
        );
        setGuaranteeStatusChart(
          Array.from(guaranteeStatusMap, ([name, value]) => ({ name, value })),
        );
        setFlaggingStatusChart(
          Array.from(flaggingStatusMap, ([name, value]) => ({ name, value })),
        );

        // Fetch Permit Download and Delete
        try {
          const [downloadRes, deleteRes] = await Promise.all([
            api.request({ url: "/permit-download", method: "GET" }),
            api.request({ url: "/permit-delete", method: "GET" }),
          ]);

          if (downloadRes?.data?.data) {
            setPermitDownloadData(downloadRes.data.data.slice(0, 5));
          }
          if (deleteRes?.data?.data) {
            setPermitDeleteData(deleteRes.data.data.slice(0, 5));
          }
        } catch (error) {
          // Silent error - these data are optional
        }
      }
    } catch (error) {
      message.error("Gagal mengambil data dashboard");
    } finally {
      setLoading(false);
    }
  };

  const statsDisplay = [
    {
      label: "Total Nasabah",
      value: stats.totalDebitur.toString(),
      icon: <Users size={24} />,
      trend: "+12.5%",
      trendUp: true,
      color: "bg-blue-500",
    },
    {
      label: "Total Nilai Pembiayaan",
      value: stats.totalValue,
      icon: <TrendingUp size={24} />,
      trend: "+8.2%",
      trendUp: true,
      color: "bg-orange-500",
    },
    // ...productTypes.map((p) => ({
    //   label: "Total Nilai " + p.name,
    //   value: `Rp. ${IDRFormat(p.Product.flatMap((pr) => pr.Submission).reduce((acc, curr) => acc + (curr?.value || 0), 0))}`,
    //   icon: <TrendingUp size={24} />,
    //   trend: "+8.2%",
    //   trendUp: true,
    //   color: "bg-orange-500",
    // })),
    {
      label: "Pembiayaan Aktif",
      value: stats.activeSubmissions.toString(),
      icon: <CreditCard size={24} />,
      trend: "-2.4%",
      trendUp: false,
      color: "bg-emerald-500",
    },
  ];

  return (
    <Spin spinning={loading}>
      <div className="space-y-8">
        {/* --- WELCOME SECTION --- */}
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Selamat Pagi, Syihabudin! 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Berikut adalah ringkasan performa EARSIP wilayah Jawa Barat hari
            ini.
          </p>
        </div>

        {/* --- STATS CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statsDisplay.map((stat, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div
                  className={`${stat.color} p-3 rounded-xl text-white shadow-lg`}
                >
                  {stat.icon}
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-bold ${stat.trendUp ? "text-emerald-600" : "text-red-500"}`}
                >
                  {stat.trend}
                  {stat.trendUp ? (
                    <ArrowUpRight size={14} />
                  ) : (
                    <ArrowDownRight size={14} />
                  )}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-slate-500 text-sm font-medium">
                  {stat.label}
                </p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">
                  {stat.value}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* --- PRODUCT TYPE CHARTS --- */}
        <div className="space-y-6">
          {groupedProductData.length > 0 ? (
            groupedProductData.map((productType, ptIdx) => (
              <div
                key={ptIdx}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
              >
                <h3 className="font-bold text-slate-800 mb-6 text-lg">
                  📊 {productType.productTypeName}{" "}
                  {productType.products.length > 0 &&
                    `(Rp. ${IDRFormat(productType.products.reduce((acc: any, curr: any) => acc + curr.value, 0))})`}
                </h3>
                {productType.products.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-3">
                      Permohonan & Nilai Pembiayaan per Produk
                    </p>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart
                        data={productType.products}
                        margin={{ top: 20, right: 80, left: 0, bottom: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          fontSize={12}
                        />
                        <YAxis
                          yAxisId="left"
                          label={{
                            value: "Jumlah Permohonan",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          label={{
                            value: "Total Nilai (Rp)",
                            angle: 90,
                            position: "insideRight",
                          }}
                        />
                        <Tooltip
                          formatter={(value, name) => {
                            if (name === "value") {
                              return [
                                new Intl.NumberFormat("id-ID", {
                                  style: "currency",
                                  currency: "IDR",
                                  minimumFractionDigits: 0,
                                }).format(value as number),
                                "Total Nilai",
                              ];
                            }
                            return [value, "Jumlah"];
                          }}
                        />
                        <Legend />
                        <Bar
                          yAxisId="left"
                          dataKey="count"
                          fill="#3b82f6"
                          name="Jumlah Permohonan"
                          radius={[8, 8, 0, 0]}
                        />
                        <Bar
                          yAxisId="right"
                          dataKey="value"
                          fill="#f59e0b"
                          name="Total Nilai"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm py-8">
                    Tidak ada data produk untuk {productType.productTypeName}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-400 text-sm text-center py-8">
                Tidak ada data jenis produk
              </p>
            </div>
          )}
        </div>

        {/* --- STATUS CHARTS SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Approve Status Chart */}
          {approveStatusChart.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 text-center text-sm">
                Status Nasabah
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={approveStatusChart}
                    cx="50%"
                    cy="40%"
                    labelLine={false}
                    label={false}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {approveStatusChart.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {approveStatusChart.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-700">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doc Status Chart */}
          {docStatusChart.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 text-center text-sm">
                Status Dokumen
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={docStatusChart}
                    cx="50%"
                    cy="40%"
                    labelLine={false}
                    label={false}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {docStatusChart.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[(index + 2) % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {docStatusChart.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: COLORS[(idx + 2) % COLORS.length],
                        }}
                      />
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-700">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guarantee Status Chart */}
          {guaranteeStatusChart.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 text-center text-sm">
                Status Jaminan
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={guaranteeStatusChart}
                    cx="50%"
                    cy="40%"
                    labelLine={false}
                    label={false}
                    outerRadius={60}
                    fill="#82ca9d"
                    dataKey="value"
                  >
                    {guaranteeStatusChart.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[(index + 4) % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {guaranteeStatusChart.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: COLORS[(idx + 4) % COLORS.length],
                        }}
                      />
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-700">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flagging Status Chart */}
          {flaggingStatusChart.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 text-center text-sm">
                Status Flagging
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={flaggingStatusChart}
                    cx="50%"
                    cy="40%"
                    labelLine={false}
                    label={false}
                    outerRadius={60}
                    fill="#ffc658"
                    dataKey="value"
                  >
                    {flaggingStatusChart.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[(index + 6) % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {flaggingStatusChart.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: COLORS[(idx + 6) % COLORS.length],
                        }}
                      />
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-700">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* --- PERMIT DOWNLOAD & DELETE REQUESTS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Permohonan Download */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800">Permohonan Download</h3>
              <button className="text-blue-500 text-xs font-bold hover:underline">
                Lihat Semua
              </button>
            </div>
            {permitDownloadData.length > 0 ? (
              <div className="space-y-3">
                {permitDownloadData.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-semibold text-slate-800">
                        Permohonan #{item.id?.substring(0, 8)}
                      </p>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          item.permit_status === "DISETUJUI"
                            ? "bg-green-100 text-green-800"
                            : item.permit_status === "DITOLAK"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {item.permit_status || "PENDING"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(item.created_at).toLocaleString("id-ID")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm text-center py-8">
                Tidak ada permohonan download
              </p>
            )}
          </div>

          {/* Permohonan Hapus */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800">Permohonan Hapus</h3>
              <button className="text-blue-500 text-xs font-bold hover:underline">
                Lihat Semua
              </button>
            </div>
            {permitDeleteData.length > 0 ? (
              <div className="space-y-3">
                {permitDeleteData.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-semibold text-slate-800">
                        Permohonan #{item.id?.substring(0, 8)}
                      </p>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          item.permit_status === "DISETUJUI"
                            ? "bg-green-100 text-green-800"
                            : item.permit_status === "DITOLAK"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {item.permit_status || "PENDING"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(item.created_at).toLocaleString("id-ID")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm text-center py-8">
                Tidak ada permohonan hapus
              </p>
            )}
          </div>
        </div>
      </div>
    </Spin>
  );
};

// Color palette for charts
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF7C7C",
];

export default DashboardEarsip;
