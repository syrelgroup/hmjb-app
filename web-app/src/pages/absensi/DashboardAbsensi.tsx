import { useState, useEffect } from "react";
import api from "../../libs/api";
import {
  Users,
  Clock,
  UserCheck,
  UserX,
  CalendarDays,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import type { IUser, IPermitAbsence } from "../../libs/interface";
import { calculatePayroll } from "../utils/libs"; // Impor fungsi formula terbaru Anda

const COLORS = [
  "#10b981", // Hadir Tepat Waktu
  "#f59e0b", // Hadir (Terlambat)
  "#ff7849", // Hadir (Pulang Cepat)
  "#3b82f6", // Izin/Cuti
  "#ef4444", // Alpha
];

// Helper untuk standarisasi format YYYY-MM-DD
const toYMD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function DashboardAbsensi() {
  const [loading, setLoading] = useState(false);
  const [dataPayload, setDataPayload] = useState<{
    users: IUser[];
    permit: IPermitAbsence[];
  }>({ users: [], permit: [] });

  const [metricsToday, setMetricsToday] = useState({
    totalEmployees: 0,
    presentOnTime: 0,
    presentLate: 0,
    presentEarlyLeave: 0,
    absent: 0,
    onLeave: 0,
  });

  const [metricsPeriod, setMetricsPeriod] = useState({
    totalPresent: 0,
    totalLate: 0,
    totalAbsent: 0,
  });

  const [attendanceBreakdownToday, setAttendanceBreakdownToday] = useState<
    any[]
  >([]);
  const [periodTrendData, setPeriodTrendData] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any[]>([]);
  const [periodLabel, setPeriodLabel] = useState("");

  const formatIDR = (num: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/absensi");
      if (res?.data) {
        const { users = [], permit = [] } = res.data;
        setDataPayload({ users, permit });

        const now = new Date();
        const todayYMD = toYMD(now);

        // =======================================================
        // MENENTUKAN PERIODE CUT-OFF (TGL 21 HINGGA TGL 20)
        // =======================================================
        const currentDay = now.getDate();
        let startYear = now.getFullYear();
        let startMonth = now.getMonth();
        let endYear = now.getFullYear();
        let endMonth = now.getMonth();

        if (currentDay > 20) {
          endMonth = startMonth + 1;
        } else {
          startMonth = startMonth - 1;
        }

        const startDate = new Date(startYear, startMonth, 21);
        const endDate = new Date(endYear, endMonth, 20);

        setPeriodLabel(
          `${startDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - ${endDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`,
        );

        let tOnTime = 0,
          tLate = 0,
          tEarlyLeave = 0,
          tAbsent = 0,
          tLeave = 0;
        let mPresent = 0,
          mLate = 0,
          mAbsent = 0;

        const todayMap: Record<string, number> = {
          HADIR_TEPAT: 0,
          TERLAMBAT: 0,
          PULANG_CEPAT: 0,
          IZIN_CUTI: 0,
          ALPHA: 0,
        };

        // Buat kerangka peta periode (21 - 20) untuk grafik
        const periodMap: Record<
          string,
          {
            date: string;
            fullDate: string;
            Hadir: number;
            Terlambat: number;
            Absen: number;
          }
        > = {};
        let cursor = new Date(startDate);
        while (cursor <= endDate) {
          const dateStr = toYMD(cursor);
          const label = `${String(cursor.getDate()).padStart(2, "0")}/${String(cursor.getMonth() + 1).padStart(2, "0")}`;
          periodMap[dateStr] = {
            date: label,
            fullDate: dateStr,
            Hadir: 0,
            Terlambat: 0,
            Absen: 0,
          };
          cursor.setDate(cursor.getDate() + 1);
        }

        const userFinances: any[] = [];

        users.forEach((u: IUser) => {
          // 1. Jalankan fungsi perhitungan formula terbaru
          const payroll = calculatePayroll(u);

          // Gunakan hasil rekap absensi terpusat dari core library agar sinkron
          mPresent += payroll.hadir?.length || 0;
          mAbsent += payroll.alpha?.length || 0;

          let hasTodayRecord = false;

          if (u.Absence && u.Absence.length > 0) {
            u.Absence.forEach((abs: any) => {
              const absDateStrRaw =
                abs.created_at || abs.check_in || new Date().toISOString();
              const absDateObj = new Date(absDateStrRaw);
              const absYMD = toYMD(absDateObj);

              const baseStatus = abs.absence_status || "ALPHA";
              const desc = (abs.description || "").toUpperCase();

              let isLate = false;
              let isEarlyLeave = false;
              if (baseStatus === "HADIR") {
                if (desc.includes("TERLAMBAT")) isLate = true;
                if (
                  desc.includes("PULANG_CEPAT") ||
                  desc.includes("PULANG CEPAT")
                )
                  isEarlyLeave = true;
              }

              // Kalkulasi Tren Grafik Periode Aktif
              if (periodMap[absYMD]) {
                if (baseStatus === "HADIR") {
                  if (isLate) {
                    periodMap[absYMD].Terlambat++;
                    mLate++;
                  } else {
                    periodMap[absYMD].Hadir++;
                  }
                } else if (
                  !["CUTI", "SAKIT", "PERDIN", "IZIN"].includes(baseStatus)
                ) {
                  periodMap[absYMD].Absen++;
                }
              }

              // Kalkulasi Data Real-time HARI INI
              if (absYMD === todayYMD) {
                hasTodayRecord = true;
                if (baseStatus === "HADIR") {
                  if (isLate) {
                    tLate++;
                    todayMap["TERLAMBAT"]++;
                  } else if (isEarlyLeave) {
                    tEarlyLeave++;
                    todayMap["PULANG_CEPAT"]++;
                  } else {
                    tOnTime++;
                    todayMap["HADIR_TEPAT"]++;
                  }
                } else if (
                  ["CUTI", "SAKIT", "PERDIN", "IZIN"].includes(baseStatus)
                ) {
                  tLeave++;
                  todayMap["IZIN_CUTI"]++;
                } else {
                  tAbsent++;
                  todayMap["ALPHA"]++;
                }
              }
            });
          }

          if (!hasTodayRecord) {
            tAbsent++;
            todayMap["ALPHA"]++;
          }

          // 2. Satukan komponen finansial dengan Formula TER & Rekap Potongan Absen Baru
          const totalInsentif =
            payroll.allowancePay + payroll.insentifPay + payroll.lemburPay;
          const totalPotongan =
            payroll.deductionPay +
            payroll.tt_deductionPay +
            payroll.latePay +
            payroll.fastLeaveDeduction +
            payroll.alphaPay +
            payroll.pph; // Termasuk pajak PPh 21 TER

          userFinances.push({
            id: u.id,
            name: u.fullname,
            position: u.Position?.name || "-",
            salary: u.salary || 0,
            insentif: totalInsentif,
            potongan: totalPotongan,
            pph: payroll.pph,
            kategoriTER: payroll.kategoriTER,
            tarifTER: payroll.tarifTER,
            net: payroll.takeHome, // Sesuai THP akhir rumus
            permitCount: payroll.permitCount,
            permitApproved: payroll.permitApproved,
          });
        });

        userFinances.sort((a, b) => b.net - a.net);
        setFinancialSummary(userFinances);

        setMetricsToday({
          totalEmployees: users.length,
          presentOnTime: tOnTime,
          presentLate: tLate,
          presentEarlyLeave: tEarlyLeave,
          absent: tAbsent,
          onLeave: tLeave,
        });

        setMetricsPeriod({
          totalPresent: mPresent,
          totalLate: mLate,
          totalAbsent: mAbsent,
        });

        setAttendanceBreakdownToday(
          Object.entries(todayMap)
            .filter(([_, qty]) => qty > 0)
            .map(([name, qty]) => ({
              name: name.replace("_", " "),
              value: qty,
            })),
        );

        setPeriodTrendData(Object.values(periodMap));
      }
    } catch (err) {
      console.error("Gagal memuat data analisis dashboard absensi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 h-96 flex flex-col items-center justify-center text-slate-500 gap-2">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">
          Sinkronisasi Formula & Laporan Pajak TER...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Dashboard Laporan Absensi & Anggaran
          </h2>
          <p className="text-xs text-slate-400">
            Periode aktif:{" "}
            <span className="font-semibold text-indigo-500">{periodLabel}</span>{" "}
            (Siklus Tgl 21 - 20)
          </p>
        </div>
      </div>

      {/* --- METRIK HARI INI --- */}
      <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 pt-2">
        <Clock className="w-4 h-4 text-indigo-500" /> Ringkasan Absensi Hari Ini
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase">
              Karyawan Aktif
            </p>
            <h3 className="text-2xl font-bold text-slate-800">
              {metricsToday.totalEmployees}
            </h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase">
              Total Hadir
            </p>
            <h3 className="text-2xl font-bold text-emerald-600">
              {metricsToday.presentOnTime +
                metricsToday.presentLate +
                metricsToday.presentEarlyLeave}{" "}
              <span className="text-xs text-amber-500 font-medium">
                ({metricsToday.presentLate} Tlk)
              </span>
            </h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase">
              Izin / Cuti
            </p>
            <h3 className="text-2xl font-bold text-blue-600">
              {metricsToday.onLeave}
            </h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase">
              Alpha
            </p>
            <h3 className="text-2xl font-bold text-red-600">
              {metricsToday.absent}
            </h3>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* --- GRAFIK TREN & DISTRIBUSI --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Tren Kehadiran Periode Aktif
              </h3>
              <p className="text-xs text-slate-400">
                Statistik akumulasi kehadiran dalam siklus berjalan
              </p>
            </div>
            <div className="flex gap-4 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>{" "}
                Hadir: {metricsPeriod.totalPresent}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>{" "}
                Terlambat: {metricsPeriod.totalLate}
              </div>
            </div>
          </div>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={periodTrendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  minTickGap={5}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  labelFormatter={(label) => `Tanggal: ${label}`}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                />
                <Bar
                  dataKey="Hadir"
                  fill="#10b981"
                  radius={[2, 2, 0, 0]}
                  stackId="a"
                />
                <Bar
                  dataKey="Terlambat"
                  fill="#f59e0b"
                  radius={[2, 2, 0, 0]}
                  stackId="a"
                />
                <Bar
                  dataKey="Absen"
                  name="Alpha"
                  fill="#ef4444"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Status Hari Ini
            </h3>
            <p className="text-xs text-slate-400">
              Proporsi distribusi data kehadiran real-time
            </p>
          </div>
          <div className="w-full h-48 flex items-center justify-center my-2">
            {attendanceBreakdownToday.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceBreakdownToday}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {attendanceBreakdownToday.map((_, index) => (
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
              <div className="text-slate-300 flex flex-col items-center gap-2">
                <AlertTriangle className="w-8 h-8" />
                <span className="text-xs">Belum ada presensi</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 border-t pt-3 border-slate-100 text-[11px] text-slate-500 font-medium">
            {attendanceBreakdownToday.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 truncate">
                <span
                  className="w-2 h-2 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                ></span>
                <span className="truncate">
                  {item.name}: <b>{item.value}</b>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- TABEL SINKRONISASI FINANSIAL & PERMIT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rekapitulasi Tunjangan & Potongan Berdasarkan Perhitungan Terbaru */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-indigo-500" /> Estimasi Beban
              Finansial & TER Pajak
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Akumulasi akurat berdasarkan potongan keterlambatan, denda alpa
              harian, serta PPh 21 TER.
            </p>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-2">Karyawan / Posisi</th>
                  <th className="py-3 px-2 text-right">Gaji Pokok</th>
                  <th className="py-3 px-2 text-right text-emerald-500">
                    Tunj. + Lembur
                  </th>
                  <th className="py-3 px-2 text-right text-rose-500">
                    Pot. + TER Pajak
                  </th>
                  <th className="py-3 px-2 text-right font-bold text-slate-700">
                    Take Home Pay
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600">
                {financialSummary.slice(0, 10).map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <div className="font-medium text-slate-800">{u.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{u.position}</span>
                        {u.permitCount > 0 && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1 rounded text-[9px] font-medium">
                            Izin: {u.permitApproved}/{u.permitCount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatIDR(u.salary)}
                    </td>
                    <td className="py-3 px-2 text-right text-emerald-600 font-medium">
                      + {formatIDR(u.insentif)}
                    </td>
                    <td className="py-3 px-2 text-right text-rose-600 font-medium">
                      <div>- {formatIDR(u.potongan)}</div>
                      {u.pph > 0 && (
                        <div className="text-[9px] text-slate-400 font-normal">
                          Inc. PPh21 (Kat {u.kategoriTER}-{u.tarifTER})
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-slate-900 bg-slate-50/30 font-mono">
                      {formatIDR(u.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pengajuan Dokumen Izin Terbaru */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800">
              Pengajuan Izin & Cuti
            </h3>
            <p className="text-xs text-slate-400">
              Berkas perizinan masuk dalam siklus berjalan
            </p>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
            {dataPayload.permit.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 font-medium">
                Belum ada pengajuan izin/cuti.
              </div>
            ) : (
              dataPayload.permit.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-slate-50/60 hover:bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-1 transition-colors"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">{p.type}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        p.permit_status === "DISETUJUI"
                          ? "bg-emerald-50 text-emerald-600"
                          : p.permit_status === "PENDING"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-red-50 text-red-600"
                      }`}
                    >
                      {p.permit_status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {p.description || "Tanpa deskripsi"}
                  </p>
                  <div className="text-[10px] text-slate-400 flex justify-between pt-1">
                    <span>
                      Oleh: {p.User?.fullname || p.userId.substring(0, 8)}
                    </span>
                    <span>
                      {p.start_date
                        ? new Date(p.start_date).toLocaleDateString("id-ID")
                        : ""}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
