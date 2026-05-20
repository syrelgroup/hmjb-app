import {
  TrendingUp,
  CheckCircle,
  Calendar,
  DollarSign,
  Activity,
  Target,
  Bookmark,
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "../../libs/api";
import {
  LineChart,
  Line,
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
import type { IVisit } from "../../libs/interface";

interface IBilling {
  bill_status: string;
  value: number;
  realize_value: number;
}

const STATUS_COLORS: Record<string, string> = {
  "Sudah Bayar": "#10b981",
  Partial: "#f59e0b",
  "Belum Bayar": "#ef4444",
};

// Palet warna variatif untuk segmentasi Pie Chart Distribusi Kunjungan
const PIE_COLORS = [
  "#0ea5e9",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#eab308",
  "#10b981",
];

export default function DashboardCallReport() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalVisitRealized: 0,
    totalVisitPlan: 0,

    // Nominal Piutang Global (Value)
    billingPaidValue: 0,
    billingPartialValue: 0,
    billingUnpaidValue: 0,

    // Nominal Uang Masuk Global (Realize Value)
    billingPaidRealize: 0,
    billingPartialRealize: 0,
    billingUnpaidRealize: 0,

    // Counter Box Global
    billingPaidCount: 0,
    billingPartialCount: 0,
    billingUnpaidCount: 0,
  });

  const [billingBreakdown, setBillingBreakdown] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);

  // State untuk Pie Chart Distribusi + Detail Finansialnya
  const [visitStatusDist, setVisitStatusDist] = useState<any[]>([]);
  const [visitPurposeDist, setVisitPurposeDist] = useState<any[]>([]);
  const [visitCategoryDist, setVisitCategoryDist] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/callreport");

      if (res?.data) {
        // Ambil data mentah bawaan API: { visit, visit_plan, tagihan }
        const { visit = [], visit_plan = [], tagihan = [] } = res.data;

        // ==========================================
        // 1. KALKULASI DATA BILLING UTAMA
        // ==========================================
        let paidValue = 0,
          paidRealize = 0,
          paidCount = 0;
        let partialValue = 0,
          partialRealize = 0,
          partialCount = 0;
        let unpaidValue = 0,
          unpaidRealize = 0,
          unpaidCount = 0;

        tagihan.forEach((b: IBilling) => {
          if (b.bill_status === "BAYAR") {
            paidValue += b.value || 0;
            paidRealize += b.realize_value || b.value || 0;
            paidCount++;
          } else if (b.bill_status === "PARTIAL") {
            partialValue += b.value || 0;
            partialRealize += b.realize_value || 0;
            partialCount++;
          } else if (b.bill_status === "BELUMBAYAR") {
            unpaidValue += b.value || 0;
            unpaidRealize += 0;
            unpaidCount++;
          }
        });

        setSummary({
          totalVisitRealized: visit.length,
          totalVisitPlan: visit_plan.length,

          billingPaidValue: paidValue,
          billingPartialValue: partialValue,
          billingUnpaidValue: unpaidValue,

          billingPaidRealize: paidRealize,
          billingPartialRealize: partialRealize,
          billingUnpaidRealize: unpaidRealize, // Sudah diperbaiki dari typo sebelumnya (unpaidUnize)

          billingPaidCount: paidCount,
          billingPartialCount: partialCount,
          billingUnpaidCount: unpaidCount,
        });

        setBillingBreakdown([
          { name: "Sudah Bayar", value: paidCount },
          { name: "Partial", value: partialCount },
          { name: "Belum Bayar", value: unpaidCount },
        ]);

        // ==========================================
        // 2. OLAH TREN KUNJUNGAN 7 HARI TERAKHIR
        // ==========================================
        const last7Days = Array.from({ length: 7 })
          .map((_, i) => moment().subtract(i, "days").format("YYYY-MM-DD"))
          .reverse();

        const dailyMap: Record<string, { Realisasi: number; Rencana: number }> =
          {};
        last7Days.forEach((date) => {
          dailyMap[date] = { Realisasi: 0, Rencana: 0 };
        });

        visit.forEach((v: IVisit) => {
          if (v.date_action) {
            const dayStr = moment(v.date_action).format("YYYY-MM-DD");
            if (dailyMap[dayStr]) dailyMap[dayStr].Realisasi++;
          }
        });

        visit_plan.forEach((vp: IVisit) => {
          if (vp.date_plan) {
            const dayStr = moment(vp.date_plan).format("YYYY-MM-DD");
            if (dailyMap[dayStr]) dailyMap[dayStr].Rencana++;
          }
        });

        setTrendData(
          last7Days.map((date) => ({
            date: moment(date).format("DD MMM"),
            "Kunjungan Sukses": dailyMap[date].Realisasi,
            "Rencana Kunjungan": dailyMap[date].Rencana,
          })),
        );

        // ==========================================
        // 3. GROUPING DATA VISIT + FINANSIAL (AMMAN DARI TS OVERWRITE)
        // ==========================================
        interface IDistItem {
          count: number;
          billingValue: number; // Ubah nama agar tidak bentrok dengan 'value' Recharts
          realizeValue: number;
        }

        const statusMap: Record<string, IDistItem> = {};
        const purposeMap: Record<string, IDistItem> = {};
        const categoryMap: Record<string, IDistItem> = {};

        const allVisits = [...visit, ...visit_plan];

        allVisits.forEach((v: any) => {
          const statusName = v.VisitStatus?.name || "Tanpa Status";
          const purposeName = v.VisitPurpose?.name || "Tanpa Tujuan";
          const categoryName = v.VisitCategory?.name || "Tanpa Kategori";

          // Mengambil nominal dari data billing yang menempel di objek visit jika ada
          const itemValue = v.value || 0;
          const itemRealize = v.realize_value || 0;

          if (!statusMap[statusName])
            statusMap[statusName] = {
              count: 0,
              billingValue: 0,
              realizeValue: 0,
            };
          statusMap[statusName].count += 1;
          statusMap[statusName].billingValue += itemValue;
          statusMap[statusName].realizeValue += itemRealize;

          if (!purposeMap[purposeName])
            purposeMap[purposeName] = {
              count: 0,
              billingValue: 0,
              realizeValue: 0,
            };
          purposeMap[purposeName].count += 1;
          purposeMap[purposeName].billingValue += itemValue;
          purposeMap[purposeName].realizeValue += itemRealize;

          if (!categoryMap[categoryName])
            categoryMap[categoryName] = {
              count: 0,
              billingValue: 0,
              realizeValue: 0,
            };
          categoryMap[categoryName].count += 1;
          categoryMap[categoryName].billingValue += itemValue;
          categoryMap[categoryName].realizeValue += itemRealize;
        });

        // Mapping ke array untuk Recharts Pie (Aman tanpa overwrite linting ts)
        setVisitStatusDist(
          Object.entries(statusMap).map(([name, data]) => ({
            name,
            ...data,
            value: data.count, // 'value' ditempatkan paling akhir/terpisah untuk porsi besar busur PieChart
          })),
        );

        setVisitPurposeDist(
          Object.entries(purposeMap).map(([name, data]) => ({
            name,
            ...data,
            value: data.count,
          })),
        );

        setVisitCategoryDist(
          Object.entries(categoryMap).map(([name, data]) => ({
            name,
            ...data,
            value: data.count,
          })),
        );
      }
    } catch (error) {
      console.error("Gagal memuat data dashboard:", error);
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
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Memuat data analisis dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      {/* --- ROW 1: KUMPULAN MINI METRICS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Rencana Kunjungan
            </p>
            <h3 className="text-3xl font-bold text-slate-800">
              {summary.totalVisitPlan}{" "}
              <span className="text-sm font-normal text-slate-400">Agenda</span>
            </h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Kunjungan Sukses
            </p>
            <h3 className="text-3xl font-bold text-emerald-600">
              {summary.totalVisitRealized}{" "}
              <span className="text-sm font-normal text-slate-400">Lokasi</span>
            </h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Dana Tertagih
            </p>
            <h3 className="text-2xl font-bold text-slate-800">
              {IDRFormat(
                summary.billingPaidRealize + summary.billingPartialRealize,
              )}
            </h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* --- ROW 2: TREN AKTIVITAS & RINGKASAN INVOICE GLOBAL --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Tren Aktivitas Lapangan
              </h3>
              <p className="text-xs text-slate-400">
                Perbandingan agenda vs realisasi kunjungan 7 hari terakhir
              </p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "13px", paddingTop: "15px" }}
                />
                <Line
                  type="monotone"
                  dataKey="Rencana Kunjungan"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Kunjungan Sukses"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card Ringkasan Status Tagihan */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Ringkasan Status Tagihan
            </h3>
            <p className="text-xs text-slate-400">
              Distribusi volume status invoice & komparasi aliran dana
            </p>
          </div>
          <div className="w-full h-44 flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={billingBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {billingBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.name]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Kasus`, "Volume"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 border-t pt-4 border-slate-100">
            <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              <span>Status (Kasus)</span>
              <div className="flex gap-12">
                <span className="w-24 text-right">Nilai Tagihan</span>
                <span className="w-24 text-right">Tertagih</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs px-1 py-0.5 hover:bg-slate-50 rounded-lg transition-colors">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                Sudah Bayar ({summary.billingPaidCount})
              </span>
              <div className="flex gap-4 text-right font-semibold">
                <span className="w-24 text-slate-400 font-normal">
                  {IDRFormat(summary.billingPaidValue)}
                </span>
                <span className="w-24 text-emerald-600">
                  {IDRFormat(summary.billingPaidRealize)}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs px-1 py-0.5 hover:bg-slate-50 rounded-lg transition-colors">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                Partial ({summary.billingPartialCount})
              </span>
              <div className="flex gap-4 text-right font-semibold">
                <span className="w-24 text-slate-400 font-normal">
                  {IDRFormat(summary.billingPartialValue)}
                </span>
                <span className="w-24 text-amber-500">
                  {IDRFormat(summary.billingPartialRealize)}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs px-1 py-0.5 hover:bg-slate-50 rounded-lg transition-colors">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                Belum Bayar ({summary.billingUnpaidCount})
              </span>
              <div className="flex gap-4 text-right font-semibold">
                <span className="w-24 text-slate-400 font-normal">
                  {IDRFormat(summary.billingUnpaidValue)}
                </span>
                <span className="w-24 text-red-500">
                  {IDRFormat(summary.billingUnpaidRealize)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- ROW 3: DETIL PIE CHART DENGAN FINANSIAL FIX --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Pie Chart: By Status Kunjungan */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="mb-2 flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Kunjungan Berdasarkan Status
              </h4>
              <p className="text-[11px] text-slate-400">
                Respon performa kasus di lapangan
              </p>
            </div>
          </div>
          <div className="w-full h-40 flex items-center justify-center my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={visitStatusDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {visitStatusDist.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val} Kasus`, "Volume"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 border-t pt-3 border-slate-50 text-[11px]">
            <div className="flex justify-between font-bold text-slate-400 uppercase tracking-wider px-0.5">
              <span>Status (Kunjungan)</span>
              <div className="flex gap-6">
                <span className="w-16 text-right">Tagihan</span>
                <span className="w-16 text-right">Tertagih</span>
              </div>
            </div>
            {visitStatusDist.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center text-slate-600 font-medium py-0.5"
              >
                <span className="truncate max-w-25 flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full inline-block shrink-0"
                    style={{
                      backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                    }}
                  ></span>
                  {item.name} ({item.count})
                </span>
                <div className="flex gap-2 text-right font-semibold">
                  <span className="w-20 text-slate-400 font-normal">
                    {IDRFormat(item.billingValue)}
                  </span>
                  <span className="w-20 text-indigo-600">
                    {IDRFormat(item.realizeValue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Pie Chart: By Tujuan Kunjungan */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="mb-2 flex items-center gap-2">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Kunjungan Berdasarkan Tujuan
              </h4>
              <p className="text-[11px] text-slate-400">
                Objektif utama penugasan tim
              </p>
            </div>
          </div>
          <div className="w-full h-40 flex items-center justify-center my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={visitPurposeDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {visitPurposeDist.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[(index + 2) % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val} Kunjungan`, "Volume"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 border-t pt-3 border-slate-50 text-[11px]">
            <div className="flex justify-between font-bold text-slate-400 uppercase tracking-wider px-0.5">
              <span>Tujuan</span>
              <div className="flex gap-6">
                <span className="w-16 text-right">Tagihan</span>
                <span className="w-16 text-right">Tertagih</span>
              </div>
            </div>
            {visitPurposeDist.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center text-slate-600 font-medium py-0.5"
              >
                <span className="truncate max-w-25 flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full inline-block shrink-0"
                    style={{
                      backgroundColor:
                        PIE_COLORS[(idx + 2) % PIE_COLORS.length],
                    }}
                  ></span>
                  {item.name} ({item.count})
                </span>
                <div className="flex gap-2 text-right font-semibold">
                  <span className="w-20 text-slate-400 font-normal">
                    {IDRFormat(item.billingValue)}
                  </span>
                  <span className="w-20 text-sky-600">
                    {IDRFormat(item.realizeValue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Pie Chart: By Jenis / Kategori Kunjungan */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="mb-2 flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Kunjungan Berdasarkan Jenis
              </h4>
              <p className="text-[11px] text-slate-400">
                Klasifikasi tipe divisi operasional
              </p>
            </div>
          </div>
          <div className="w-full h-40 flex items-center justify-center my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={visitCategoryDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {visitCategoryDist.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[(index + 4) % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val} Data`, "Volume"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 border-t pt-3 border-slate-50 text-[11px]">
            <div className="flex justify-between font-bold text-slate-400 uppercase tracking-wider px-0.5">
              <span>Jenis Kategori</span>
              <div className="flex gap-6">
                <span className="w-16 text-right">Tagihan</span>
                <span className="w-16 text-right">Tertagih</span>
              </div>
            </div>
            {visitCategoryDist.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center text-slate-600 font-medium py-0.5"
              >
                <span className="truncate max-w-25 flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full inline-block shrink-0"
                    style={{
                      backgroundColor:
                        PIE_COLORS[(idx + 4) % PIE_COLORS.length],
                    }}
                  ></span>
                  {item.name} ({item.count})
                </span>
                <div className="flex gap-2 text-right font-semibold">
                  <span className="w-20 text-slate-400 font-normal">
                    {IDRFormat(item.billingValue)}
                  </span>
                  <span className="w-20 text-purple-600">
                    {IDRFormat(item.realizeValue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
