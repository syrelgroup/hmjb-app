import { useEffect, useState } from "react";
import {
  Users,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  LogIn,
  LogOut,
  CalendarDays,
  CheckCircle2,
  UserCheck,
  Activity,
} from "lucide-react";
import { Spin, message, Card, Button } from "antd";
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
import api from "../../libs/api";
import moment from "moment";
import type { IAbsence, IUser } from "../../libs/interface";

interface IAbsenceData extends IAbsence {
  User?: IUser;
}

interface IDashboardStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  overtimeToday: number;
  permitToday: number;
  attendanceRate: number;
  averageLate: number;
}

interface IMonthlyStats {
  presentMonth: number;
  absentMonth: number;
  permitMonth: number;
  lateMonth: number;
  overtimeMonth: number;
  attendanceRateMonth: number;
}

interface IRequestStats {
  permitRequests: number;
  permitApproved: number;
  permitPending: number;
  insentifRequests: number;
  insentifApproved: number;
  insentifTotalNominal: number;
  insentifApprovedNominal: number;
}

interface IStatusDistribution {
  name: string;
  value: number;
  color: string;
}

interface IPermitSummary {
  permit_status?: string;
}

interface IInsentifSummary {
  approve_status?: string;
  nominal_type?: string;
  nominal?: number;
  User?: {
    salary?: number;
  };
}

interface ITrendData {
  date: string;
  hadir: number;
  cuti: number;
  sakit: number;
  alpha: number;
  perdin: number;
  lembur: number;
}

const DashboardAbsensi = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<IDashboardStats>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    overtimeToday: 0,
    permitToday: 0,
    attendanceRate: 0,
    averageLate: 0,
  });
  const [recentAbsence, setRecentAbsence] = useState<IAbsenceData[]>([]);
  const [trendData, setTrendData] = useState<ITrendData[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<
    IStatusDistribution[]
  >([]);
  const [monthlyStats, setMonthlyStats] = useState<IMonthlyStats>({
    presentMonth: 0,
    absentMonth: 0,
    permitMonth: 0,
    lateMonth: 0,
    overtimeMonth: 0,
    attendanceRateMonth: 0,
  });
  const [requestStats, setRequestStats] = useState<IRequestStats>({
    permitRequests: 0,
    permitApproved: 0,
    permitPending: 0,
    insentifRequests: 0,
    insentifApproved: 0,
    insentifTotalNominal: 0,
    insentifApprovedNominal: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const monthStart = moment().startOf("month");
      const monthEnd = moment().endOf("month");
      const monthRange = `${monthStart.format("YYYY-MM-DD")},${monthEnd.format("YYYY-MM-DD")}`;

      // Fetch today's absence data
      const todayRes = await api.request({
        url: "/absence",
        method: "GET",
        params: {
          date: moment().format("YYYY-MM-DD"),
          limit: 1000,
        },
      });

      // Fetch all absence data for the month and trend analysis
      const monthRes = await api.request({
        url: "/absence",
        method: "GET",
        params: {
          limit: 1000,
        },
      });

      const permitRes = await api.request({
        url: "/permit_absence",
        method: "GET",
        params: {
          limit: 1000,
          backdate: monthRange,
        },
      });

      const insentifRes = await api.request({
        url: "/insentif",
        method: "GET",
        params: {
          limit: 1000,
          backdate: monthRange,
        },
      });

      // Fetch all users for total employee count
      const usersRes = await api.request({
        url: "/user",
        method: "GET",
        params: { limit: 1000 },
      });

      const todayData = todayRes?.data?.data || [];
      const allData = monthRes?.data?.data || [];
      const permitData = (permitRes?.data?.data as IPermitSummary[]) || [];
      const insentifData =
        (insentifRes?.data?.data as IInsentifSummary[]) || [];
      const allUsers = usersRes?.data?.data || [];

      // Calculate daily statistics
      const presentCount = todayData.filter(
        (a: IAbsenceData) => a.absence_status === "HADIR",
      ).length;
      const absentCount = todayData.filter(
        (a: IAbsenceData) => a.absence_status === "ALPHA",
      ).length;
      const lateCount = todayData.filter(
        (a: IAbsenceData) => a.late_deduction > 0,
      ).length;
      const overtimeCount = todayData.filter(
        (a: IAbsenceData) => a.absence_status === "LEMBUR",
      ).length;
      const permitCount = todayData.filter(
        (a: IAbsenceData) =>
          a.absence_status === "CUTI" ||
          a.absence_status === "SAKIT" ||
          a.absence_status === "PERDIN",
      ).length;
      const attendanceRate =
        allUsers.length > 0
          ? Math.round((presentCount / allUsers.length) * 100)
          : 0;
      const averageLate =
        lateCount > 0
          ? Math.round(
              todayData
                .filter((a: IAbsenceData) => a.late_deduction > 0)
                .reduce(
                  (sum: number, a: IAbsenceData) => sum + a.late_deduction,
                  0,
                ) / lateCount,
            )
          : 0;

      setStats({
        totalEmployees: allUsers.length,
        presentToday: presentCount,
        absentToday: absentCount,
        lateToday: lateCount,
        overtimeToday: overtimeCount,
        permitToday: permitCount,
        attendanceRate: attendanceRate,
        averageLate: averageLate,
      });

      const monthAbsenceData = allData.filter((a: IAbsenceData) => {
        const rawDate = a.check_in || a.check_out || a.created_at;
        return (
          rawDate &&
          moment(rawDate).isBetween(monthStart, monthEnd, "day", "[]")
        );
      });

      const presentMonth = monthAbsenceData.filter(
        (a: IAbsenceData) => a.absence_status === "HADIR",
      ).length;
      const absentMonth = monthAbsenceData.filter(
        (a: IAbsenceData) => a.absence_status === "ALPHA",
      ).length;
      const lateMonth = monthAbsenceData.filter(
        (a: IAbsenceData) => a.late_deduction > 0,
      ).length;
      const overtimeMonth = monthAbsenceData.filter(
        (a: IAbsenceData) => a.absence_status === "LEMBUR",
      ).length;
      const permitMonth = monthAbsenceData.filter(
        (a: IAbsenceData) =>
          a.absence_status === "CUTI" ||
          a.absence_status === "SAKIT" ||
          a.absence_status === "PERDIN",
      ).length;
      const attendanceRateMonth =
        allUsers.length > 0
          ? Math.round((presentMonth / allUsers.length) * 100)
          : 0;

      setMonthlyStats({
        presentMonth,
        absentMonth,
        permitMonth,
        lateMonth,
        overtimeMonth,
        attendanceRateMonth,
      });

      const permitRequests = permitRes?.data?.total || permitData.length;
      const permitApproved = permitData.filter(
        (item) => item.permit_status === "DISETUJUI",
      ).length;
      const permitPending = permitData.filter(
        (item) => item.permit_status === "PENDING",
      ).length;

      const insentifRequests = insentifRes?.data?.total || insentifData.length;
      const insentifApproved = insentifData.filter(
        (item) => item.approve_status === "DISETUJUI",
      ).length;
      const insentifTotalNominal = insentifData.reduce((sum: number, item) => {
        if (item.nominal_type === "RUPIAH")
          return sum + Number(item.nominal || 0);
        if (item.nominal_type === "PERCENT" && item.User?.salary)
          return (
            sum +
            (Number(item.User.salary || 0) * Number(item.nominal || 0)) / 100
          );
        return sum;
      }, 0);
      const insentifApprovedNominal = insentifData.reduce(
        (sum: number, item) => {
          if (item.approve_status !== "DISETUJUI") return sum;
          if (item.nominal_type === "RUPIAH")
            return sum + Number(item.nominal || 0);
          if (item.nominal_type === "PERCENT" && item.User?.salary)
            return (
              sum +
              (Number(item.User.salary || 0) * Number(item.nominal || 0)) / 100
            );
          return sum;
        },
        0,
      );

      setRequestStats({
        permitRequests,
        permitApproved,
        permitPending,
        insentifRequests,
        insentifApproved,
        insentifTotalNominal,
        insentifApprovedNominal,
      });

      // Process trend data (last 7 days)
      const trendMap: Record<string, ITrendData> = {};
      for (let i = 6; i >= 0; i--) {
        const date = moment().subtract(i, "days").format("YYYY-MM-DD");
        trendMap[date] = {
          date: moment(date).format("DD MMM"),
          hadir: 0,
          cuti: 0,
          sakit: 0,
          alpha: 0,
          perdin: 0,
          lembur: 0,
        };
      }

      allData.forEach((a: IAbsenceData) => {
        if (a.check_in) {
          const dateStr = moment(a.check_in).format("YYYY-MM-DD");
          if (trendMap[dateStr]) {
            const status = a.absence_status.toLowerCase() as keyof ITrendData;
            if (status in trendMap[dateStr] && status !== "date") {
              (trendMap[dateStr] as ITrendData)[status] += 1;
            }
          }
        }
      });

      setTrendData(Object.values(trendMap));

      // Process status distribution (pie chart)
      const statusCount: Record<string, number> = {
        HADIR: 0,
        CUTI: 0,
        SAKIT: 0,
        ALPHA: 0,
        PERDIN: 0,
        LEMBUR: 0,
      };

      todayData.forEach((a: IAbsenceData) => {
        if (a.absence_status in statusCount) {
          statusCount[a.absence_status]++;
        }
      });

      const distribution = [
        { name: "Hadir", value: statusCount.HADIR, color: "#10b981" },
        { name: "Cuti", value: statusCount.CUTI, color: "#3b82f6" },
        { name: "Sakit", value: statusCount.SAKIT, color: "#f59e0b" },
        { name: "Alpha", value: statusCount.ALPHA, color: "#ef4444" },
        { name: "Perdin", value: statusCount.PERDIN, color: "#8b5cf6" },
        { name: "Lembur", value: statusCount.LEMBUR, color: "#06b6d4" },
      ];

      setStatusDistribution(distribution);

      // Get recent activities
      const recent = todayData
        .sort(
          (a: IAbsenceData, b: IAbsenceData) =>
            new Date(b.check_in || 0).getTime() -
            new Date(a.check_in || 0).getTime(),
        )
        .slice(0, 5);

      setRecentAbsence(recent);
    } catch (error) {
      console.error(error);
      message.error("Gagal mengambil data absensi");
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    label,
    value,
    icon,
    trend,
    trendUp,
    color,
    subtext,
  }: {
    label: string;
    value: string;
    icon: React.ReactNode;
    trend?: string;
    trendUp?: boolean;
    color: string;
    subtext?: string;
  }) => (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className={`${color} p-3 rounded-xl text-white shadow-lg`}>
          {icon}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-bold ${trendUp ? "text-emerald-600" : "text-red-500"}`}
          >
            {trend}
            {trendUp ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        <h3 className="text-3xl font-black text-slate-800 mt-2">{value}</h3>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
    </Card>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "HADIR":
        return "bg-emerald-100 text-emerald-800";
      case "CUTI":
        return "bg-blue-100 text-blue-800";
      case "SAKIT":
        return "bg-amber-100 text-amber-800";
      case "ALPHA":
        return "bg-red-100 text-red-800";
      case "PERDIN":
        return "bg-purple-100 text-purple-800";
      case "LEMBUR":
        return "bg-cyan-100 text-cyan-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      HADIR: "✓ Hadir",
      CUTI: "🏖️ Cuti",
      SAKIT: "🏥 Sakit",
      ALPHA: "✗ Alpha",
      PERDIN: "✈️ Perdin",
      LEMBUR: "⏰ Lembur",
    };
    return statusMap[status] || status;
  };

  const formatIDR = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <Spin spinning={loading}>
      <div className="space-y-8 pb-8">
        {/* --- WELCOME SECTION --- */}
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            📊 Dashboard Absensi
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Selamat datang! Berikut adalah ringkasan data absensi karyawan Anda
            hari ini.
          </p>
        </div>

        {/* --- STATS CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Karyawan"
            value={stats.totalEmployees.toString()}
            icon={<Users size={24} />}
            color="bg-blue-500"
            trend="+2.5%"
            trendUp={true}
          />
          <StatCard
            label="Hadir Hari Ini"
            value={stats.presentToday.toString()}
            icon={<CheckCircle2 size={24} />}
            color="bg-emerald-500"
            trend={`${stats.attendanceRate}%`}
            trendUp={true}
            subtext="Tingkat kehadiran"
          />
          <StatCard
            label="Terlambat"
            value={stats.lateToday.toString()}
            icon={<Clock size={24} />}
            color="bg-amber-500"
            trend={`${stats.averageLate}m`}
            trendUp={false}
            subtext="Rata-rata keterlambatan"
          />
          <StatCard
            label="Alpha/Bolos"
            value={stats.absentToday.toString()}
            icon={<AlertCircle size={24} />}
            color="bg-red-500"
            trend={`-${Math.round((stats.absentToday / stats.totalEmployees) * 100)}%`}
            trendUp={false}
          />
        </div>

        {/* --- MONTHLY SUMMARY --- */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-slate-900 font-bold">Ringkasan Bulan Ini</h3>
              <p className="text-slate-500 text-sm">
                Tampilan data absensi dan permohonan yang berjalan di bulan ini.
              </p>
            </div>
            <span className="text-slate-500 text-sm">
              {moment().format("MMMM YYYY")}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
            <StatCard
              label="Hadir Bulan Ini"
              value={monthlyStats.presentMonth.toString()}
              icon={<Users size={24} />}
              color="bg-emerald-500"
              trend={`${monthlyStats.attendanceRateMonth}%`}
              trendUp={true}
              subtext="Tingkat kehadiran bulan ini"
            />
            <StatCard
              label="Alpha Bulan Ini"
              value={monthlyStats.absentMonth.toString()}
              icon={<AlertCircle size={24} />}
              color="bg-red-500"
              trend={`-${Math.round((monthlyStats.absentMonth / Math.max(1, stats.totalEmployees)) * 100)}%`}
              trendUp={false}
            />
            <StatCard
              label="Izin/Cuti Bulan Ini"
              value={monthlyStats.permitMonth.toString()}
              icon={<CalendarDays size={24} />}
              color="bg-blue-500"
              trend={
                monthlyStats.permitMonth > 0
                  ? `+${monthlyStats.permitMonth}`
                  : "0"
              }
              trendUp={monthlyStats.permitMonth > 0}
            />
            <StatCard
              label="Lembur Bulan Ini"
              value={monthlyStats.overtimeMonth.toString()}
              icon={<TrendingUp size={24} />}
              color="bg-cyan-500"
              trend={
                monthlyStats.overtimeMonth > 0
                  ? `+${monthlyStats.overtimeMonth}`
                  : "0"
              }
              trendUp={monthlyStats.overtimeMonth > 0}
            />
          </div>
        </div>

        {/* --- ADDITIONAL STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Izin/Cuti"
            value={stats.permitToday.toString()}
            icon={<CalendarDays size={24} />}
            color="bg-blue-400"
            trend="+1.2%"
            trendUp={true}
          />
          <StatCard
            label="Lembur"
            value={stats.overtimeToday.toString()}
            icon={<TrendingUp size={24} />}
            color="bg-cyan-500"
            trend="+0.5%"
            trendUp={true}
          />
          <StatCard
            label="Produktivitas"
            value={`${Math.max(0, 100 - Math.round((stats.absentToday / stats.totalEmployees) * 100))}%`}
            icon={<Activity size={24} />}
            color="bg-indigo-500"
            trend="+5.3%"
            trendUp={true}
          />
        </div>

        {/* --- REQUEST SUMMARY --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Permohonan Izin Bulan Ini"
            value={requestStats.permitRequests.toString()}
            icon={<LogOut size={24} />}
            color="bg-orange-500"
            trend={`${requestStats.permitApproved} disetujui`}
            trendUp={true}
            subtext={`${requestStats.permitPending} menunggu konfirmasi`}
          />
          <StatCard
            label="Insentif Bulan Ini"
            value={requestStats.insentifRequests.toString()}
            icon={<LogIn size={24} />}
            color="bg-fuchsia-500"
            trend={`${requestStats.insentifApproved} disetujui`}
            trendUp={true}
            subtext="Jumlah permohonan insentif"
          />
          <StatCard
            label="Total Nilai Insentif"
            value={formatIDR(requestStats.insentifTotalNominal)}
            icon={<Activity size={24} />}
            color="bg-emerald-500"
            trend={
              requestStats.insentifApproved > 0
                ? `+${requestStats.insentifApproved} disetujui`
                : "0 disetujui"
            }
            trendUp={requestStats.insentifApproved > 0}
          />
          <StatCard
            label="Nilai Disetujui"
            value={formatIDR(requestStats.insentifApprovedNominal)}
            icon={<CheckCircle2 size={24} />}
            color="bg-teal-500"
            trend="Optimal"
            trendUp={true}
          />
        </div>

        {/* --- CHARTS SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* --- TREND CHART --- */}
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-lg">
                Tren Absensi 7 Hari Terakhir
              </h3>
              <Button type="text" size="small">
                Lihat Detail
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="hadir"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Hadir"
                />
                <Line
                  type="monotone"
                  dataKey="cuti"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Cuti"
                />
                <Line
                  type="monotone"
                  dataKey="sakit"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Sakit"
                />
                <Line
                  type="monotone"
                  dataKey="alpha"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Alpha"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* --- STATUS DISTRIBUTION CHART --- */}
          <Card className="border-0 shadow-sm">
            <h3 className="font-bold text-slate-800 text-lg mb-6">
              Distribusi Status Hari Ini
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) =>
                    value > 0 ? `${name}: ${value}` : null
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* --- ATTENDANCE BY STATUS CHART --- */}
        <Card className="border-0 shadow-sm">
          <h3 className="font-bold text-slate-800 text-lg mb-6">
            Ringkasan Status Absensi Hari Ini
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* --- RECENT ACTIVITIES --- */}
        <Card className="border-0 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 text-lg">
              Aktivitas Absensi Terkini
            </h3>
            <Button type="link" href="/absensi/report">
              Lihat Semua
            </Button>
          </div>

          {recentAbsence.length > 0 ? (
            <div className="space-y-4">
              {recentAbsence.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <UserCheck size={18} className="text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {item.User?.fullname || "Karyawan"}
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(item.absence_status)}`}
                      >
                        {getStatusBadge(item.absence_status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {item.User?.nik || "N/A"} • {item.User?.Position?.name}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <LogIn size={12} />
                      {item.check_in
                        ? moment(item.check_in).format("HH:mm")
                        : "-"}
                    </div>
                    {item.description && (
                      <p className="text-xs text-red-600 font-medium">
                        {item.description.split(",").join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">
                Tidak ada data absensi untuk hari ini
              </p>
            </div>
          )}
        </Card>

        {/* --- QUICK ACTIONS --- */}
        <Card className="border-0 shadow-sm bg-linear-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">
                Akses Cepat
              </h3>
              <p className="text-slate-600 text-sm">
                Kelola data absensi dan laporan dengan mudah
              </p>
            </div>
            <div className="flex gap-3">
              <Button type="primary" href="app/absensi/config">
                ⚙️ Konfigurasi
              </Button>
              <Button href="app/absensi/permit">📝 Izin/Cuti</Button>
              <Button href="app/absensi/report">📊 Laporan</Button>
              <Button href="app/absensi/insentif">🎁 Insentif</Button>
            </div>
          </div>
        </Card>
      </div>
    </Spin>
  );
};

export default DashboardAbsensi;
