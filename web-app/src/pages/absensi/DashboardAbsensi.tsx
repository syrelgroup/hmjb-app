import { useState, useEffect } from "react";
import api from "../../libs/api";
import { Users, Clock, TrendingUp, UserCheck, DollarSign } from "lucide-react";
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

// --- INTERFACES SIFAT DATA ---
import type {
  IUser,
  IDeduction,
  IInsentif,
  IPermitAbsence,
} from "../../libs/interface";

const COLORS = [
  "#10b981",
  "#f59e0b",
  "#ff7849",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#64748b",
];

export default function DashboardAbsensi() {
  const [loading, setLoading] = useState(false);
  const [dataPayload, setDataPayload] = useState<{
    users: IUser[];
    deduction: IDeduction[];
    insentif: IInsentif[];
    permit: IPermitAbsence[];
  }>({ users: [], deduction: [], insentif: [], permit: [] });

  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    earlyLeaveToday: 0,
    pendingPermits: 0,
    totalGrossSalary: 0,
    totalInsentif: 0,
    totalDeduction: 0,
  });

  const [attendanceBreakdown, setAttendanceBreakdown] = useState<any[]>([]);
  const [payrollBreakdown, setPayrollBreakdown] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/absensi");
      if (res?.data) {
        const {
          users = [],
          deduction = [],
          insentif = [],
          permit = [],
        } = res.data;
        setDataPayload({ users, deduction, insentif, permit });

        // ==================================================
        // 1. METRIK OPERASIONAL UTAMA & FINANSIAL
        // ==================================================
        let present = 0;
        let late = 0;
        let earlyLeave = 0;
        let totalGajiPokok = 0;
        let akumulasiInsentif = 0;
        let akumulasiPotongan = 0;

        // Hitung akumulasi insentif global yang berstatus aktif
        insentif.forEach((i: IInsentif) => {
          if (i.status) akumulasiInsentif += i.nominal || 0;
        });

        // Hitung akumulasi potongan global
        deduction.forEach((d: IDeduction) => {
          if (d.status) akumulasiPotongan += d.nominal || 0;
        });

        // Buat map penampung distribusi status absensi
        const attendanceMap: Record<string, number> = {
          HADIR: 0,
          TERLAMBAT: 0,
          PULANG_CEPAT: 0,
          CUTI: 0,
          PERDIN: 0,
          SAKIT: 0,
          ALPHA: 0,
        };

        users.forEach((u: IUser) => {
          totalGajiPokok += u.salary || 0;

          // Periksa record absensi terakhir
          if (u.Absence && u.Absence.length > 0) {
            const latestAbsence = u.Absence[u.Absence.length - 1];
            let status = latestAbsence.absence_status;
            const desc = (latestAbsence.description || "").toUpperCase();

            // PENGKONDISIAN STRUKTURAL BERDASARKAN DESCRIPTION
            if (desc.includes("TERLAMBAT")) {
              status = "TERLAMBAT";
              late++;
            } else if (
              desc.includes("PULANG_CEPAT") ||
              desc.includes("PULANG CEPAT")
            ) {
              status = "PULANG_CEPAT";
              earlyLeave++;
            }

            // Hitung total kehadiran fisik (Hadir, Terlambat, maupun Pulang Cepat tetap terhitung absen masuk)
            if (["HADIR", "TERLAMBAT", "PULANG_CEPAT"].includes(status)) {
              present++;
            }

            if (attendanceMap[status] !== undefined) {
              attendanceMap[status]++;
            } else {
              // Fallback jika status custom/tidak terdaftar masuk ke HADIR
              attendanceMap["HADIR"]++;
            }

            // Tambahkan nominal denda finansial dari logs internal absensi
            akumulasiPotongan +=
              (latestAbsence.late_deduction || 0) +
              (latestAbsence.fast_leave_deduction || 0) +
              (latestAbsence.alpha_deduction || 0);

            // Tambahkan lemburan ke dana penambah
            akumulasiInsentif += latestAbsence.lemburan || 0;
          } else {
            attendanceMap["ALPHA"]++;
          }
        });

        const pendingApprovalPermits = permit.filter(
          (p: IPermitAbsence) => p.permit_status === "PENDING",
        ).length;

        setMetrics({
          totalEmployees: users.length,
          presentToday: present,
          lateToday: late,
          earlyLeaveToday: earlyLeave,
          pendingPermits: pendingApprovalPermits,
          totalGrossSalary: totalGajiPokok,
          totalInsentif: akumulasiInsentif,
          totalDeduction: akumulasiPotongan,
        });

        // Format data untuk Pie Chart Absensi (Hanya masukkan yang jumlahnya > 0)
        setAttendanceBreakdown(
          Object.entries(attendanceMap)
            .filter(([_, qty]) => qty > 0)
            .map(([name, qty]) => ({ name, value: qty })),
        );

        // ==================================================
        // 2. FORMULASI GRAFIK BATANG PAYROLL per KARYAWAN
        // ==================================================
        const topStaffPayroll = users.slice(0, 5).map((u: IUser) => {
          let userInsentif = 0;
          let userDeduction = 0;

          u.UserCost?.forEach((cost) => {
            if (cost.type === "PENAMBAHAN") userInsentif += cost.nominal;
            if (cost.type === "PENGURANGAN") userDeduction += cost.nominal;
          });

          return {
            name: u.fullname.split(" ")[0],
            "Gaji Pokok": u.salary,
            "Bonus/Insentif": userInsentif,
            Potongan: userDeduction,
          };
        });
        setPayrollBreakdown(topStaffPayroll);
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

  const formatIDR = (num: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);

  if (loading) {
    return (
      <div className="p-6 h-96 flex flex-col items-center justify-center text-slate-500 gap-2">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">
          Sinkronisasi data absensi & payroll deskripsi...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      {/* HEADER DASHBOARD */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Dashboard Monitor Absensi & Kompensasi
          </h2>
          <p className="text-xs text-slate-400">
            Analisis presensi terintegrasi deteksi status terlambat via log
            deskripsi
          </p>
        </div>
      </div>

      {/* --- ROW 1: METRICS UTAMA --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase">
              Total Karyawan
            </p>
            <h3 className="text-2xl font-bold text-slate-800">
              {metrics.totalEmployees}{" "}
              <span className="text-xs text-slate-400 font-normal">Aktif</span>
            </h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase">
              Presensi Masuk
            </p>
            <h3 className="text-2xl font-bold text-emerald-600">
              {metrics.presentToday}{" "}
              <span className="text-xs text-amber-500 font-medium">
                ({metrics.lateToday} Tlk / {metrics.earlyLeaveToday} PC)
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
              Pengajuan Izin
            </p>
            <h3 className="text-2xl font-bold text-amber-600">
              {metrics.pendingPermits}{" "}
              <span className="text-xs text-slate-400 font-normal">
                Pending
              </span>
            </h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase">
              Alokasi Gaji (Net)
            </p>
            <h3 className="text-xl font-bold text-slate-800">
              {formatIDR(
                metrics.totalGrossSalary +
                  metrics.totalInsentif -
                  metrics.totalDeduction,
              )}
            </h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* --- ROW 2: GRAPHICAL VIEWS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Struktur Payroll Staff */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Struktur Kompensasi Karyawan (Sampel)
              </h3>
              <p className="text-xs text-slate-400">
                Komparasi Gaji Pokok, Insentif tambahan, dan Potongan
              </p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={payrollBreakdown}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip formatter={(value) => formatIDR(Number(value))} />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                />
                <Bar dataKey="Gaji Pokok" fill="#3b82f6" stackId="a" />
                <Bar
                  dataKey="Bonus/Insentif"
                  fill="#10b981"
                  stackId="a"
                  radius={[4, 4, 0, 0]}
                />
                <Bar dataKey="Potongan" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart Proporsi Kehadiran */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Proporsi Kehadiran Hari Ini
            </h3>
            <p className="text-xs text-slate-400">
              Peta sebaran status absensi dinamis (Hadir, Terlambat, Pulang
              Cepat)
            </p>
          </div>
          <div className="w-full h-40 flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {attendanceBreakdown.map((_, index) => (
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
          <div className="grid grid-cols-2 gap-2 border-t pt-3 border-slate-100 text-[11px] text-slate-500 font-medium">
            {attendanceBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 truncate">
                <span
                  className="w-2 h-2 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                ></span>
                <span className="truncate">
                  {item.name}: <b>{item.value} Staff</b>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- ROW 3: LOGS DATA LIST --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logs Real-time Status */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800">
              Log Aktivitas Real-time Karyawan
            </h3>
            <p className="text-xs text-slate-400">
              Logs status pemicu keterlambatan & pulang cepat via deskripsi
            </p>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-2">Karyawan</th>
                  <th className="py-3 px-2">Jabatan</th>
                  <th className="py-3 px-2">Keterangan / Notes</th>
                  <th className="py-3 px-2 font-medium">Gaji Pokok</th>
                  <th className="py-3 px-2 text-center">Status Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600">
                {dataPayload.users.slice(0, 5).map((u) => {
                  const latestAbs = u.Absence?.[u.Absence.length - 1];
                  const rawStatus = latestAbs?.absence_status || "ALPHA";
                  const notes = latestAbs?.description || "-";

                  // Hitung ulang penanda warna label status list row
                  let finalStatusLabel = rawStatus;
                  if (notes.toUpperCase().includes("TERLAMBAT"))
                    finalStatusLabel = "TERLAMBAT";
                  if (
                    notes.toUpperCase().includes("PULANG_CEPAT") ||
                    notes.toUpperCase().includes("PULANG CEPAT")
                  )
                    finalStatusLabel = "PULANG_CEPAT";

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-2.5 px-2 font-medium text-slate-800">
                        {u.fullname}
                      </td>
                      <td className="py-2.5 px-2 text-slate-400">
                        {u.Position?.name || "Staff"}
                      </td>
                      <td className="py-2.5 px-2 italic text-slate-500 max-w-45 truncate">
                        {notes}
                      </td>
                      <td className="py-2.5 px-2 font-medium">
                        {formatIDR(u.salary)}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            finalStatusLabel === "HADIR"
                              ? "bg-emerald-50 text-emerald-600"
                              : finalStatusLabel === "TERLAMBAT"
                                ? "bg-amber-50 text-amber-600"
                                : finalStatusLabel === "PULANG_CEPAT"
                                  ? "bg-orange-50 text-orange-600"
                                  : "bg-red-50 text-red-600"
                          }`}
                        >
                          {finalStatusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pengajuan Dokumen Izin Terbaru */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800">
              Pengajuan Berkas Izin
            </h3>
            <p className="text-xs text-slate-400">
              Verifikasi dokumen ketidakhadiran karyawan lapangan
            </p>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-60 pr-1">
            {dataPayload.permit.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 font-medium">
                Tidak ada berkas perizinan masuk.
              </div>
            ) : (
              dataPayload.permit.slice(0, 4).map((p) => (
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
                    {p.description || "Tanpa deskripsi alasan"}
                  </p>
                  <div className="text-[10px] text-slate-400 flex justify-between pt-1">
                    <span>ID User: {p.userId.substring(0, 8)}...</span>
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
