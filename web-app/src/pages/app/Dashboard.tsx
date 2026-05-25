import {
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Activity,
  Calendar,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import type {
  IProductType,
  ISubType,
  IVisitCategory,
  IVisitStatus,
} from "../../libs/interface";
import api from "../../libs/api";
import { IDRFormat } from "../utils/utilForm";

interface IDashboardListItem {
  id: string;
  name: string;
  count: number;
}

interface IProductTypeSummary {
  id: string;
  name: string;
  submissionCount: number;
  value: number;
}

interface IDashboardSummary {
  totals: {
    debitur: number;
    submissions: number;
    visits: number;
    value: number;
    productTypes: number;
    submissionTypes: number;
    visitCategories: number;
    visitStatuses: number;
    approvedSubmissions: number;
    pendingSubmissions: number;
    rejectedSubmissions: number;
    approvedVisits: number;
    pendingVisits: number;
    rejectedVisits: number;
    averageSubmissionValue: number;
  };
  breakdowns: {
    submissionType: IDashboardListItem[];
    productType: IProductTypeSummary[];
    visitCategory: IDashboardListItem[];
    visitStatus: IDashboardListItem[];
    visitPurpose: IDashboardListItem[];
    fileCategory: IDashboardListItem[];
  };
  topLists: {
    submissionType: IDashboardListItem[];
    visitCategory: IDashboardListItem[];
    visitPurpose: IDashboardListItem[];
    fileCategory: IDashboardListItem[];
  };
  growth: Array<{
    name: string;
    submissions: number;
    visits: number;
    approved: number;
  }>;
}

type DashboardResponse = {
  submissionType: ISubType[];
  productType: IProductType[];
  visitCategory: IVisitCategory[];
  visitStatus: IVisitStatus[];
  summary: IDashboardSummary;
};

const Dashboard = () => {
  const [data, setData] = useState<DashboardResponse>({
    submissionType: [],
    productType: [],
    visitCategory: [],
    visitStatus: [],
    summary: {
      totals: {
        debitur: 0,
        submissions: 0,
        visits: 0,
        value: 0,
        productTypes: 0,
        submissionTypes: 0,
        visitCategories: 0,
        visitStatuses: 0,
        approvedSubmissions: 0,
        pendingSubmissions: 0,
        rejectedSubmissions: 0,
        approvedVisits: 0,
        pendingVisits: 0,
        rejectedVisits: 0,
        averageSubmissionValue: 0,
      },
      breakdowns: {
        submissionType: [],
        productType: [],
        visitCategory: [],
        visitStatus: [],
        visitPurpose: [],
        fileCategory: [],
      },
      topLists: {
        submissionType: [],
        visitCategory: [],
        visitPurpose: [],
        fileCategory: [],
      },
      growth: [],
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.request({
          method: "GET",
          url: `${import.meta.env.VITE_API_URL}/maindashboard`,
        });
        setData(res.data);
      } catch (error) {
        console.error("Dashboard fetch failed", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const summary = data.summary;
  const totals = summary.totals;
  const totalDebitur = totals.debitur;
  const totalVisit = totals.visits;
  const chartData = summary.growth;

  const visitPurposeData = summary.breakdowns.visitPurpose
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: item.name,
      value: item.count,
    }));

  const fileCategoryData = summary.breakdowns.fileCategory
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: item.name,
      value: item.count,
    }));

  const visitStatusData = summary.breakdowns.visitStatus
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: item.name,
      value: item.count,
    }));

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 md:p-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
          Memuat dashboard...
        </div>
      </div>
    );
  }
  const COLORS = [
    "#3b82f6",
    "#f97316",
    "#ec4899",
    "#8b5cf6",
    "#10b981",
    "#06b6d4",
    "#f59e0b",
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 md:p-6">
      {/* --- KEY STATS CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Debitur */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className="bg-linear-to-br from-blue-500 to-blue-600 h-1"></div>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Users size={24} className="text-blue-600" />
              </div>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <ArrowUpRight size={14} /> 12%
              </span>
            </div>
            <p className="text-slate-600 text-sm font-medium">Total Debitur</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {totals.debitur}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Dari {totals.submissionTypes} jenis permohonan
            </p>
          </div>
        </div>

        {/* Total Permohonan */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className="bg-linear-to-br from-orange-500 to-orange-600 h-1"></div>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-xl">
                <TrendingUp size={24} className="text-orange-600" />
              </div>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <ArrowUpRight size={14} /> 8%
              </span>
            </div>
            <p className="text-slate-600 text-sm font-medium">
              Total Permohonan
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {totals.submissions}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Dari {totals.productTypes} jenis produk
            </p>
          </div>
        </div>

        {/* Total Kunjungan */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className="bg-linear-to-br from-purple-500 to-purple-600 h-1"></div>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-xl">
                <Calendar size={24} className="text-purple-600" />
              </div>
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <ArrowDownRight size={14} /> 5%
              </span>
            </div>
            <p className="text-slate-600 text-sm font-medium">
              Total Kunjungan
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {totals.visits}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Dari {totals.visitCategories} kategori
            </p>
          </div>
        </div>

        {/* Total Nilai */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className="bg-linear-to-br from-emerald-500 to-emerald-600 h-1"></div>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-emerald-100 p-3 rounded-xl">
                <Zap size={24} className="text-emerald-600" />
              </div>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <ArrowUpRight size={14} /> 15%
              </span>
            </div>
            <p className="text-slate-600 text-sm font-medium">Total Nilai</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              Rp {(totals.value / 1000000000).toFixed(1)}M
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {IDRFormat(totals.value)}
            </p>
          </div>
        </div>
      </div>

      {/* --- MORE SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className="bg-linear-to-br from-emerald-500 to-emerald-600 h-1"></div>
          <div className="p-5">
            <p className="text-slate-600 text-sm font-medium">
              Permohonan Aktif
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {totals.approvedSubmissions}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              dari {totals.submissions} permohonan total
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className="bg-linear-to-br from-amber-500 to-orange-600 h-1"></div>
          <div className="p-5">
            <p className="text-slate-600 text-sm font-medium">
              Permohonan Pending
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {totals.pendingSubmissions}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              status sedang diproses
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className="bg-linear-to-br from-red-500 to-rose-600 h-1"></div>
          <div className="p-5">
            <p className="text-slate-600 text-sm font-medium">
              Permohonan Non-Aktif
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {totals.rejectedSubmissions}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              permohonan tidak aktif atau selesai
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className="bg-linear-to-br from-sky-500 to-cyan-600 h-1"></div>
          <div className="p-5">
            <p className="text-slate-600 text-sm font-medium">
              Rata-rata Nilai Permohonan
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {IDRFormat(totals.averageSubmissionValue)}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              berdasarkan {totals.submissions} permohonan
            </p>
          </div>
        </div>
      </div>

      {/* --- CHARTS SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Growth Chart */}
        {/* <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 mb-1">Grafik Pertumbuhan</h3>
          <p className="text-xs text-slate-500 mb-4">7 Hari Terakhir</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="day"
                stroke="#64748b"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#0f172a" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar
                dataKey="submissions"
                fill="#3b82f6"
                radius={[8, 8, 0, 0]}
                name="Permohonan"
              />
              <Bar
                dataKey="visits"
                fill="#f97316"
                radius={[8, 8, 0, 0]}
                name="Kunjungan"
              />
              <Bar
                dataKey="approved"
                fill="#10b981"
                radius={[8, 8, 0, 0]}
                name="Disetujui"
              />
            </BarChart>
          </ResponsiveContainer>
        </div> */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 mb-1">Grafik Pertumbuhan</h3>
          <p className="text-xs text-slate-500 mb-4">4 Minggu Terakhir</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                vertical={false}
              />
              <XAxis
                dataKey="name" // Menggunakan 'name' dari array weeks
                stroke="#64748b"
                style={{ fontSize: "12px" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                style={{ fontSize: "12px" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
              />
              <Bar
                dataKey="submissions"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                name="Permohonan"
                barSize={20}
              />
              <Bar
                dataKey="visits"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
                name="Kunjungan"
                barSize={20}
              />
              <Bar
                dataKey="approved"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                name="Disetujui"
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Visit Status Chart */}
        {visitStatusData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-1">Status Kunjungan</h3>
            <p className="text-xs text-slate-500 mb-4">Distribusi status</p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={visitStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent = 0 }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {visitStatusData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* --- MORE CHARTS SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Visit Purpose/Category Chart */}
        {visitPurposeData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-1">Tujuan Kunjungan</h3>
            <p className="text-xs text-slate-500 mb-4">Distribusi kunjungan</p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={visitPurposeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent = 0 }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {visitPurposeData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* File Category Chart */}
        {fileCategoryData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-1">Kategori Berkas</h3>
            <p className="text-xs text-slate-500 mb-4">Distribusi file</p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={fileCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent = 0 }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {fileCategoryData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* --- BREAKDOWN SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission Type Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Permohonan Berdasarkan Jenis
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Distribusi permohonan per tipe
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <BarChart3 size={20} className="text-blue-600" />
            </div>
          </div>
          <div className="space-y-4">
            {data.submissionType.map((item, idx) => {
              const colors = [
                "bg-blue-500",
                "bg-orange-500",
                "bg-purple-500",
                "bg-emerald-500",
                "bg-pink-500",
              ];
              const percentage =
                totalDebitur > 0
                  ? (item.Debitur.length / totalDebitur) * 100
                  : 0;
              return (
                <div key={item.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700">
                      {item.name}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {item.Debitur.length}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`${colors[idx % colors.length]} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kunjungan Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Kunjungan Berdasarkan Kategori
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Distribusi kunjungan per kategori
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-xl">
              <Activity size={20} className="text-purple-600" />
            </div>
          </div>
          <div className="space-y-4">
            {data.visitCategory.map((item, idx) => {
              const colors = [
                "bg-purple-500",
                "bg-indigo-500",
                "bg-cyan-500",
                "bg-teal-500",
                "bg-lime-500",
              ];
              const percentage =
                totalVisit > 0 ? (item.Visit.length / totalVisit) * 100 : 0;
              return (
                <div key={item.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700">
                      {item.name}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {item.Visit.length}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`${colors[idx % colors.length]} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
