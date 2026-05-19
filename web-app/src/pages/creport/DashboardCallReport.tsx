import {
  Users,
  TrendingUp,
  Phone,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  CheckSquare,
  DollarSign,
  FileText,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Spin, message } from "antd";
import api from "../../libs/api";
import {
  LineChart,
  Line,
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
import moment from "moment";
import { IDRFormat } from "../utils/utilForm";

interface IVisit {
  id: string;
  date_plan: string;
  date_action?: string;
  VisitStatus?: { id: string; name: string };
  VisitCategory?: { id: string; name: string };
  VisitPurpose?: { id: string; name: string };
  Debitur?: { fullname: string };
  created_at: string;
}

interface IBilling {
  id: string;
  value: number;
  realize_value: number;
  bill_status: "BAYAR" | "BELUMBAYAR" | "PARTIAL";
  bill_date: string;
  paid_date?: string;
  name: string | null;
  Debitur?: { fullname: string };
}

const DashboardCallReport = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    positivePercentage: 0,
    successCount: 0,
    pendingCount: 0,
    failedCount: 0,
    plannedCount: 0,
    completedCount: 0,
  });
  const [billingStats, setBillingStats] = useState({
    totalBilling: 0,
    paidBilling: 0,
    unpaidBilling: 0,
    partialBilling: 0,
    totalNominal: 0,
    paidNominal: 0,
    unpaidNominal: 0,
    paidPercentage: 0,
  });
  const [activities, setActivities] = useState<IVisit[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<any[]>([]);
  const [purposeBreakdown, setPurposeBreakdown] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [billingBreakdown, setBillingBreakdown] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch visit dan billing data secara parallel
      const [visitRes, billingRes] = await Promise.all([
        api.request({
          url: "/visit",
          method: "GET",
          params: { limit: 10000 },
        }),
        api.request({
          url: "/billing",
          method: "GET",
          params: { limit: 10000 },
        }),
      ]);

      // Process Visit Data
      if (visitRes?.data) {
        const data = visitRes.data.data || [];
        const total = visitRes.data.total || 0;

        // Calculate today's visits
        const today = new Date().toISOString().split("T")[0];
        const todayVisits = data.filter(
          (v: IVisit) => v.date_action && v.date_action.split("T")[0] === today,
        ).length;

        // Calculate success/pending/failed
        const success = data.filter(
          (v: IVisit) =>
            v.VisitStatus?.name?.toLowerCase().includes("berhasil") ||
            v.VisitStatus?.name?.toLowerCase().includes("positif"),
        ).length;
        const pending = data.filter(
          (v: IVisit) =>
            v.VisitStatus?.name?.toLowerCase().includes("pending") ||
            v.VisitStatus?.name?.toLowerCase().includes("rencana"),
        ).length;
        const failed = total - success - pending;

        // Calculate planned vs completed visits
        const planned = data.filter((v: IVisit) => !v.date_action).length;
        const completed = data.filter((v: IVisit) => v.date_action).length;

        const positivePercentage =
          total > 0 ? Math.round((success / total) * 100) : 0;

        setStats({
          total: total,
          today: todayVisits,
          positivePercentage: positivePercentage,
          successCount: success,
          pendingCount: pending,
          failedCount: failed,
          plannedCount: planned,
          completedCount: completed,
        });

        // Process chart data (7 hari terakhir)
        const chartDataMap = new Map();
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];
          chartDataMap.set(dateStr, {
            date: moment(dateStr).format("DD-MM"),
            kunjungan: 0,
            berhasil: 0,
          });
        }

        data.forEach((v: IVisit) => {
          if (v.date_action) {
            const dateStr = v.date_action.split("T")[0];
            const entry = chartDataMap.get(dateStr);
            if (entry) {
              entry.kunjungan += 1;
              if (
                v.VisitStatus?.name?.toLowerCase().includes("berhasil") ||
                v.VisitStatus?.name?.toLowerCase().includes("positif")
              ) {
                entry.berhasil += 1;
              }
            }
          }
        });

        const chartArray = Array.from(chartDataMap.values());
        setChartData(chartArray);

        // Process status breakdown
        const statusMap = new Map();
        data.forEach((v: IVisit) => {
          const status = v.VisitStatus?.name || "Tidak Diketahui";
          statusMap.set(status, (statusMap.get(status) || 0) + 1);
        });

        const statusArray = Array.from(statusMap.entries())
          .map(([name, value]) => ({
            name,
            value,
          }))
          .sort((a, b) => b.value - a.value);

        setStatusBreakdown(statusArray);

        // Process purpose breakdown
        const purposeMap = new Map();
        data.forEach((v: IVisit) => {
          const purpose = v.VisitPurpose?.name || "Tidak Diketahui";
          purposeMap.set(purpose, (purposeMap.get(purpose) || 0) + 1);
        });

        const purposeArray = Array.from(purposeMap.entries())
          .map(([name, value]) => ({
            name,
            value,
          }))
          .sort((a, b) => b.value - a.value);

        setPurposeBreakdown(purposeArray);

        // Process category breakdown
        const categoryMap = new Map();
        data.forEach((v: IVisit) => {
          const category = v.VisitCategory?.name || "Tidak Diketahui";
          categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
        });

        const categoryArray = Array.from(categoryMap.entries())
          .map(([name, value]) => ({
            name,
            value,
          }))
          .sort((a, b) => b.value - a.value);

        setCategoryBreakdown(categoryArray);

        // Set recent activities
        setActivities(data.slice(0, 5));
      }

      // Process Billing Data
      if (billingRes?.data) {
        const billingData = billingRes.data.data || [];
        const totalBilling = billingData.length;

        const paidCount = billingData.filter(
          (b: IBilling) => b.bill_status === "BAYAR",
        ).length;
        const unpaidCount = billingData.filter(
          (b: IBilling) => b.bill_status === "BELUMBAYAR",
        ).length;
        const partialCount = billingData.filter(
          (b: IBilling) => b.bill_status === "PARTIAL",
        ).length;

        const totalNominal = billingData.reduce(
          (sum: number, b: IBilling) => sum + (b.value || 0),
          0,
        );
        const paidNominal = billingData.reduce(
          (sum: number, b: IBilling) =>
            sum + (b.bill_status === "BAYAR" ? b.realize_value || 0 : 0),
          0,
        );
        const unpaidNominal = totalNominal - paidNominal;

        const paidPercentage =
          totalNominal > 0 ? Math.round((paidNominal / totalNominal) * 100) : 0;

        setBillingStats({
          totalBilling,
          paidBilling: paidCount,
          unpaidBilling: unpaidCount,
          partialBilling: partialCount,
          totalNominal,
          paidNominal,
          unpaidNominal,
          paidPercentage,
        });

        // Process billing status breakdown
        const billingMap = new Map();
        billingData.forEach((b: IBilling) => {
          const status = b.bill_status;
          billingMap.set(status, (billingMap.get(status) || 0) + 1);
        });

        const billingArray = Array.from(billingMap.entries())
          .map(([name, value]) => ({
            name:
              name === "BAYAR"
                ? "Sudah Bayar"
                : name === "BELUMBAYAR"
                  ? "Belum Bayar"
                  : "Partial",
            value,
          }))
          .sort((a, b) => b.value - a.value);

        setBillingBreakdown(billingArray);
      }
    } catch (error) {
      message.error("Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#0ea5e9", "#f97316", "#ef4444", "#8b5cf6", "#ec4899"];

  const statsDisplay = [
    {
      label: "Total Kunjungan",
      value: stats.total.toString(),
      icon: <Phone size={24} />,
      trend: "+15.3%",
      trendUp: true,
      color: "bg-blue-500",
    },
    {
      label: "Kunjungan Hari Ini",
      value: stats.today.toString(),
      icon: <TrendingUp size={24} />,
      trend: "+5.2%",
      trendUp: true,
      color: "bg-orange-500",
    },
    {
      label: "Rata-rata Hasil Positif",
      value: `${stats.positivePercentage}%`,
      icon: <Users size={24} />,
      trend: "+3.8%",
      trendUp: true,
      color: "bg-emerald-500",
    },
  ];

  const detailedStats = [
    {
      label: "Berhasil",
      value: stats.successCount,
      icon: <CheckCircle size={20} />,
      color: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      label: "Pending",
      value: stats.pendingCount,
      icon: <Clock size={20} />,
      color: "bg-yellow-50",
      textColor: "text-yellow-600",
    },
    {
      label: "Gagal",
      value: stats.failedCount,
      icon: <AlertCircle size={20} />,
      color: "bg-red-50",
      textColor: "text-red-600",
    },
    {
      label: "Kunjungan Rencana",
      value: stats.plannedCount,
      icon: <Calendar size={20} />,
      color: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      label: "Kunjungan Sudah Dilakukan",
      value: stats.completedCount,
      icon: <CheckSquare size={20} />,
      color: "bg-purple-50",
      textColor: "text-purple-600",
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
            Berikut adalah ringkasan aktivitas Call Report Anda hari ini.
          </p>
        </div>

        {/* --- MAIN STATS CARDS --- */}
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

        {/* --- DETAILED STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {detailedStats.map((stat, index) => (
            <div
              key={index}
              className={`${stat.color} p-4 rounded-xl border border-slate-200`}
            >
              <div className="flex items-center gap-3">
                <div className={`${stat.textColor}`}>{stat.icon}</div>
                <div className="flex-1">
                  <p className="text-xs text-slate-600">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.textColor}`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* --- BILLING STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="text-emerald-600">
                <FileText size={24} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-600">Total Tagihan</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {billingStats.totalBilling}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
            <div className="flex items-center gap-3">
              <div className="text-green-600">
                <CheckCircle size={24} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-600">Sudah Bayar</p>
                <p className="text-2xl font-bold text-green-600">
                  {billingStats.paidBilling}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-xl border border-red-200">
            <div className="flex items-center gap-3">
              <div className="text-red-600">
                <AlertCircle size={24} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-600">Belum Bayar</p>
                <p className="text-2xl font-bold text-red-600">
                  {billingStats.unpaidBilling}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-xl border border-yellow-200">
            <div className="flex items-center gap-3">
              <div className="text-yellow-600">
                <Clock size={24} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-600">Partial</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {billingStats.partialBilling}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- BILLING NOMINAL STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-medium">
                  Total Nominal Tagihan
                </p>
                <h3 className="text-2xl font-black text-slate-800 mt-2">
                  {IDRFormat(billingStats.totalNominal)}
                </h3>
              </div>
              <div className="bg-blue-500 p-3 rounded-xl text-white shadow-lg">
                <DollarSign size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-medium">
                  Nominal Terbayar
                </p>
                <h3 className="text-2xl font-black text-emerald-600 mt-2">
                  {IDRFormat(billingStats.paidNominal)}
                </h3>
              </div>
              <div className="bg-emerald-500 p-3 rounded-xl text-white shadow-lg">
                <CheckCircle size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-medium">
                  Persentase Terbayar
                </p>
                <h3 className="text-2xl font-black text-blue-600 mt-2">
                  {billingStats.paidPercentage}%
                </h3>
              </div>
              <div className="bg-blue-500 p-3 rounded-xl text-white shadow-lg">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* --- CHARTS SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- LINE CHART (Trend) --- */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="mb-6">
              <h3 className="font-bold text-lg text-slate-800">
                Tren Kunjungan 7 Hari Terakhir
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Perbandingan total kunjungan dan hasil berhasil
              </p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#f1f5f9" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="kunjungan"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ fill: "#0ea5e9", r: 4 }}
                  name="Total Kunjungan"
                />
                <Line
                  type="monotone"
                  dataKey="berhasil"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                  name="Berhasil"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* --- PIE CHART (Status) --- */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="mb-6">
              <h3 className="font-bold text-lg text-slate-800">
                Distribusi Status
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Breakdown kunjungan per status
              </p>
            </div>
            {statusBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent = 0 }) =>
                      `${name}: ${((percent as number) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusBreakdown.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 bg-slate-50 rounded-xl flex items-center justify-center">
                <p className="text-slate-400 text-sm">Tidak ada data</p>
              </div>
            )}
          </div>
        </div>

        {/* --- BAR CHART (Daily Comparison) --- */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h3 className="font-bold text-lg text-slate-800">
              Perbandingan Kunjungan Harian
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Total kunjungan vs hasil berhasil per hari
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#f1f5f9" }}
              />
              <Legend />
              <Bar dataKey="kunjungan" fill="#0ea5e9" name="Total Kunjungan" />
              <Bar dataKey="berhasil" fill="#10b981" name="Berhasil" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* --- BREAKDOWN CHARTS (Purpose & Category) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* --- PIE CHART (Purpose) --- */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="mb-6">
              <h3 className="font-bold text-lg text-slate-800">
                Distribusi Tujuan Kunjungan
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Breakdown kunjungan per tujuan
              </p>
            </div>
            {purposeBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={purposeBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent = 0 }) =>
                      `${name}: ${((percent as number) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {purposeBreakdown.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 bg-slate-50 rounded-xl flex items-center justify-center">
                <p className="text-slate-400 text-sm">Tidak ada data</p>
              </div>
            )}
          </div>

          {/* --- PIE CHART (Category) --- */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="mb-6">
              <h3 className="font-bold text-lg text-slate-800">
                Distribusi Jenis Kunjungan
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Breakdown kunjungan per jenis
              </p>
            </div>
            {categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent = 0 }) =>
                      `${name}: ${((percent as number) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryBreakdown.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 bg-slate-50 rounded-xl flex items-center justify-center">
                <p className="text-slate-400 text-sm">Tidak ada data</p>
              </div>
            )}
          </div>
        </div>

        {/* --- BILLING STATUS BREAKDOWN CHART --- */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h3 className="font-bold text-lg text-slate-800">
              Distribusi Status Tagihan
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Breakdown tagihan per status pembayaran
            </p>
          </div>
          {billingBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={billingBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#f1f5f9" }}
                />
                <Bar dataKey="value" fill="#0ea5e9" name="Jumlah Tagihan" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 bg-slate-50 rounded-xl flex items-center justify-center">
              <p className="text-slate-400 text-sm">Tidak ada data</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-lg text-slate-800">
                Kunjungan Terkini
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {activities.length} kunjungan terakhir
              </p>
            </div>
            <button className="text-orange-500 text-xs font-bold hover:underline">
              Lihat Semua
            </button>
          </div>
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <UserIcon size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {item.Debitur?.fullname || "Nasabah"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Status: {item.VisitStatus?.name || "Tidak Diketahui"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-medium">
                      {moment(item.created_at).format("HH:mm")}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {moment(item.created_at).format("DD-MM-YY")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm text-center py-8">
                Tidak ada data kunjungan
              </p>
            )}
          </div>
        </div>
      </div>
    </Spin>
  );
};

// Helper internal untuk icon di list
const UserIcon = ({ size, className }: { size: any; className: any }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default DashboardCallReport;
