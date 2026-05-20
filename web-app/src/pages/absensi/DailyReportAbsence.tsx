import { useState, useEffect, useMemo } from "react";
import moment from "moment";
import type { IUser } from "../../libs/interface";
import api from "../../libs/api";
import { Calendar, FileSpreadsheet, Eye, Search, User } from "lucide-react";
import {
  Input,
  Pagination,
  Spin,
  Button,
  Modal,
  Descriptions,
  Tag,
  Divider,
} from "antd";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const DailyReportAbsence = () => {
  const [data, setData] = useState<IUser[]>([]);
  const [month, setMonth] = useState(moment().format("YYYY-MM"));
  const [holidays, setHolidays] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(50);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);

  const showDetail = (user: IUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const getUserSummary = (user: IUser) => {
    const totalDaysInMonth = daysHeader.length;

    const summary = {
      hadir:
        user.Absence?.filter((a) => a.absence_status === "HADIR").length || 0,
      alpha:
        user.Absence?.filter((a) => a.absence_status === "ALPHA").length || 0,
      sakit:
        user.Absence?.filter((a) => a.absence_status === "SAKIT").length || 0,
      cuti:
        user.Absence?.filter((a) => a.absence_status === "CUTI").length || 0,
      lembur:
        user.Absence?.filter((a) =>
          (a.description || "").split(",").includes("LEMBUR"),
        ).length || 0,
      terlambat:
        user.Absence?.filter((a) =>
          (a.description || "").split(",").includes("TERLAMBAT"),
        ).length || 0,
      pulangCepat:
        user.Absence?.filter((a) =>
          (a.description || "").split(",").includes("PULANG_CEPAT"),
        ).length || 0,
    };

    const totalTidakMasuk = summary.alpha + summary.sakit + summary.cuti;

    return { ...summary, totalTidakMasuk, totalDaysInMonth };
  };

  // --- Fungsi Export Excel ---
  const exportToExcel = () => {
    const fileType =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const fileExtension = ".xlsx";

    const excelData = data.map((user) => {
      const row: any = {
        NIK: user.nik,
        NIP: user.nip,
        "Nama Pegawai": user.fullname,
      };

      const s = getUserSummary(user);

      // Masukkan kolom tanggal (1 - 31)
      daysHeader.forEach((day) => {
        const abs = user.Absence?.find(
          (a) => moment(a.check_in).format("YYYY-MM-DD") === day.dateStr,
        );

        if (abs) {
          const inTime = abs.check_in
            ? moment(abs.check_in).format("HH:mm")
            : "--";
          const outTime = abs.check_out
            ? moment(abs.check_out).format("HH:mm")
            : "--";
          row[day.day] = `IN: ${inTime}\nOUT: ${outTime}`;
        } else {
          row[day.day] = day.isRedDay ? "OFF" : "-";
        }
      });

      // Append summary data ke baris excel
      row["Hadir"] = s.hadir;
      row["Alpha"] = s.alpha;
      row["Sakit"] = s.sakit;
      row["Cuti"] = s.cuti;
      row["Lembur"] = s.lembur;
      row["Terlambat"] = s.terlambat;
      row["Pulang Cepat"] = s.pulangCepat;
      row["Total Tidak Masuk"] = s.totalTidakMasuk;
      row["Daftar Permohonan"] =
        user.PermitAbsence?.map((p) => `${p.type} (${p.permit_status})`).join(
          ", ",
        ) || "-";

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(excelData, {
      header: [
        "NIK",
        "NIP",
        "Nama Pegawai",
        ...daysHeader.map((d) => d.day.toString()),
        "Hadir",
        "Alpha",
        "Sakit",
        "Cuti",
        "Lembur",
        "Terlambat",
        "Pulang Cepat",
        "Total Tidak Masuk",
        "Daftar Permohonan",
      ],
    });

    const wscols = [
      { wch: 15 }, // NIK
      { wch: 15 }, // NIP
      { wch: 25 }, // Nama Pegawai
      ...daysHeader.map(() => ({ wch: 8 })), // Lebar box tanggal biar muat text IN/OUT
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 12 },
      { wch: 15 },
      { wch: 40 },
    ];
    ws["!cols"] = wscols;

    const wb = { Sheets: { Laporan: ws }, SheetNames: ["Laporan"] };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], { type: fileType });
    saveAs(dataBlob, `Report_Absensi_${month}${fileExtension}`);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/absence_report`, {
        params: { page, limit, search, month },
      });
      setData(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await api.get("/holidays", {
        params: {
          month: month.split("-")[1] || moment().month(),
          year: month.split("-")[0] || moment().year(),
        },
      });
      const holidayMap: Record<string, string> = {};
      res.data.data.forEach((h: any) => {
        holidayMap[moment(h.date).format("YYYY-MM-DD")] = h.description;
      });
      setHolidays(holidayMap);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHolidays();
    fetchData();
  }, [month, search, page, limit]);

  const daysHeader = useMemo(() => {
    // Range dari tanggal 21 bulan sebelumnya sampai tanggal 20 bulan sekarang
    const currentMonth = moment(month);
    const previousMonth = currentMonth.clone().subtract(1, "month");

    // Start: tanggal 21 bulan sebelumnya
    const startDate = previousMonth.clone().date(21);
    // End: tanggal 20 bulan sekarang
    const endDate = currentMonth.clone().date(20);

    // Hitung jumlah hari antara start dan end (inclusive)
    const daysCount = endDate.diff(startDate, "days") + 1;

    return Array.from({ length: daysCount }, (_, i) => {
      const dateStr = startDate.clone().add(i, "days").format("YYYY-MM-DD");
      const day = moment(dateStr).date();
      const isSunday = moment(dateStr).day() === 0;
      return {
        day,
        dateStr,
        isRedDay: isSunday || !!holidays[dateStr],
        tooltip: holidays[dateStr] || (isSunday ? "Hari Minggu" : ""),
      };
    });
  }, [month, holidays]);

  return (
    <Spin spinning={loading}>
      <div className="p-3 sm:p-6 bg-slate-50 min-h-screen">
        {/* HEADER CONTROL BAR */}
        <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
                Laporan Absensi
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Monitoring kehadiran dan rekap log data absen karyawan
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:flex flex-wrap items-center gap-2">
            <Button
              icon={<FileSpreadsheet size={16} />}
              className="bg-emerald-600 text-white hover:bg-emerald-700 font-medium flex items-center justify-center h-9 order-3 sm:order-1"
              onClick={exportToExcel}
            >
              Export Excel
            </Button>

            <div className="relative flex items-center order-1 sm:order-2">
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-sm font-medium text-slate-700 outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <Input
              placeholder="Cari nama atau NIK..."
              prefix={<Search size={14} className="text-slate-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-52 h-9 rounded-lg order-2 sm:order-3"
              allowClear
            />
          </div>
        </div>

        {/* 1. LAYOUT TABLE UNTUK VIEW DESKTOP */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="px-4 py-3.5 sticky left-0 bg-slate-50 border-r border-b z-30 text-left font-semibold min-w-40 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    Pegawai
                  </th>
                  {daysHeader.map((item) => (
                    <th
                      key={item.day}
                      title={item.tooltip}
                      className={`px-1 py-3.5 border-b border-r border-slate-100 text-center min-w-9.5 font-medium ${
                        item.isRedDay
                          ? "text-red-600 bg-red-50/50 font-bold"
                          : "text-slate-500"
                      }`}
                    >
                      {item.day}
                    </th>
                  ))}
                  <th className="px-4 py-3.5 sticky right-0 bg-slate-50 z-30 border-b border-l font-bold text-blue-700 text-center min-w-30 shadow-[-2px_0_5px_rgba(0,0,0,0.02)]">
                    Aksi & Summary
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-200 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.01)]">
                      <div className="font-semibold text-slate-700 text-xs">
                        {user.fullname}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {user.nik}
                      </div>
                    </td>

                    {daysHeader.map((item) => {
                      const abs = user.Absence?.find(
                        (a) =>
                          moment(a.check_in).format("YYYY-MM-DD") ===
                          item.dateStr,
                      );
                      return (
                        <td
                          key={item.day}
                          className={`px-0 py-2 text-center border-r border-slate-100 align-middle ${
                            item.isRedDay ? "bg-red-50/10" : ""
                          }`}
                        >
                          {abs ? (
                            <div className="flex flex-col items-center justify-center gap-0.5">
                              <StatusBadge status={abs.absence_status} />
                              <div className="text-[9px] font-medium text-slate-600">
                                {abs.description
                                  ?.split(",")
                                  .map((ds) => ds.charAt(0))
                                  .join("/")}
                              </div>
                              <div className="text-[9px] font-medium text-slate-600 scale-90 tracking-tighter">
                                {abs.check_in
                                  ? moment(abs.check_in).format("HH:mm")
                                  : "-"}
                              </div>
                              <div className="text-[9px] font-medium text-slate-400 scale-90 tracking-tighter">
                                {abs.check_out
                                  ? moment(abs.check_out).format("HH:mm")
                                  : "-"}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-300 font-bold">
                              {item.isRedDay ? "" : "•"}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    <td className="px-3 py-2 sticky right-0 bg-white group-hover:bg-slate-50 border-l border-slate-200 z-20 shadow-[-2px_0_5px_rgba(0,0,0,0.01)] text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          {user.PermitAbsence?.length || 0} Permohonan
                        </span>
                        <Button
                          size="small"
                          type="primary"
                          ghost
                          icon={<Eye size={12} />}
                          className="text-[10px] h-6 px-2 flex items-center font-medium rounded-md"
                          onClick={() => showDetail(user)}
                        >
                          Detail
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. LAYOUT CARD UNTUK VIEW MOBILE (HP) */}
        <div className="block md:hidden space-y-3">
          {data.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-lg border text-slate-400 text-sm">
              Data tidak ditemukan
            </div>
          ) : (
            data.map((user) => {
              const s = getUserSummary(user);
              return (
                <div
                  key={user.id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start border-b pb-2 border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                        <User size={16} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">
                          {user.fullname}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">
                          {user.nik}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="small"
                      type="default"
                      icon={<Eye size={14} className="text-slate-500" />}
                      className="flex items-center text-xs h-7 border-slate-200"
                      onClick={() => showDetail(user)}
                    >
                      Detail
                    </Button>
                  </div>

                  {/* Ringkasan Parameter Cepat di HP */}
                  <div className="grid grid-cols-4 gap-2 text-center bg-slate-50 p-2 rounded-lg text-[11px]">
                    <div>
                      <div className="text-slate-400">Hadir</div>
                      <div className="font-bold text-emerald-600">
                        {s.hadir}d
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Alpha</div>
                      <div className="font-bold text-red-500">{s.alpha}d</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Sakit/Cuti</div>
                      <div className="font-bold text-amber-500">
                        {s.sakit + s.cuti}d
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Late/Early</div>
                      <div className="font-bold text-indigo-600">
                        {s.terlambat + s.pulangCepat}x
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">
                      Permohonan Izin Aktif:
                    </span>
                    <Tag
                      color={user.PermitAbsence?.length ? "blue" : "default"}
                      className="m-0 text-[10px]"
                    >
                      {user.PermitAbsence?.length || 0} Izin
                    </Tag>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* PAGINATION CONTROL BAR */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-400 italic order-2 sm:order-1">
            * T (Terlambat), P (Pulang Awal), L (Lembur)
          </div>
          <Pagination
            current={page}
            pageSize={limit}
            onChange={(p, s) => {
              setPage(p);
              setLimit(s);
            }}
            size="small"
            total={total}
            showSizeChanger
            className="order-1 sm:order-2"
          />
        </div>
      </div>

      {/* DETAILED MODAL DATA POPUP */}
      <Modal
        title={`Detail Absensi - ${selectedUser?.fullname}`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setIsModalOpen(false)}
            className="rounded-md"
          >
            Tutup
          </Button>,
        ]}
        style={{ top: 30 }}
        width={550}
        className="responsive-modal"
      >
        {selectedUser &&
          (() => {
            const s = getUserSummary(selectedUser);
            return (
              <div className="py-2 space-y-4">
                <Descriptions
                  bordered
                  column={2}
                  size="small"
                  layout="horizontal"
                >
                  <Descriptions.Item label="Hadir">
                    <Tag color="green" className="font-medium px-2">
                      {s.hadir} Hari
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Alpha">
                    <Tag color="red" className="font-medium px-2">
                      {s.alpha} Hari
                    </Tag>
                  </Descriptions.Item>

                  <Descriptions.Item label="Sakit">
                    <Tag color="warning" className="font-medium px-2">
                      {s.sakit} Hari
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Cuti">
                    <Tag color="blue" className="font-medium px-2">
                      {s.cuti} Hari
                    </Tag>
                  </Descriptions.Item>

                  <Descriptions.Item label="Terlambat">
                    <span className="text-red-500 font-bold">
                      {s.terlambat} Kali
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Pulang Cepat">
                    <span className="text-orange-500 font-bold">
                      {s.pulangCepat} Kali
                    </span>
                  </Descriptions.Item>

                  <Descriptions.Item label="Lembur" span={2}>
                    <Tag color="purple" className="font-medium px-2">
                      {s.lembur} Kali
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>

                <Divider className="my-2 text-xs text-slate-400">
                  Akumulasi Absen Kosong
                </Divider>

                <div className="bg-rose-50 border border-rose-100 p-3 sm:p-4 rounded-xl flex justify-between items-center">
                  <span className="text-xs sm:text-sm font-medium text-slate-600">
                    Total Tidak Masuk Kerja{" "}
                    <span className="text-[10px] text-slate-400 block">
                      (Alpha + Sakit + Cuti)
                    </span>
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-rose-600">
                    {s.totalTidakMasuk} Hari
                  </span>
                </div>

                {selectedUser.PermitAbsence &&
                  selectedUser.PermitAbsence.length > 0 && (
                    <>
                      <Divider className="my-2 text-xs text-slate-400">
                        Daftar Dokumen Permohonan
                      </Divider>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                        {selectedUser.PermitAbsence.map((p, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs"
                          >
                            <span className="font-medium text-slate-700">
                              {p.type}{" "}
                              <span className="text-[10px] text-slate-400 font-normal ml-1">
                                ({moment(p.created_at).format("DD MMM YYYY")})
                              </span>
                            </span>
                            <Tag
                              color={
                                p.permit_status === "DISETUJUI"
                                  ? "success"
                                  : "processing"
                              }
                              className="m-0 text-[10px]"
                            >
                              {p.permit_status}
                            </Tag>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
              </div>
            );
          })()}
      </Modal>
    </Spin>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, string> = {
    HADIR: "bg-emerald-500 text-white",
    SAKIT: "bg-amber-400 text-white",
    CUTI: "bg-blue-500 text-white",
    PERDIN: "bg-indigo-500 text-white",
    ALPHA: "bg-rose-500 text-white",
  };
  return (
    <div className="flex justify-center">
      <span
        className={`w-5 h-5 flex items-center justify-center rounded text-[9px] font-black shadow-sm ${config[status] || "bg-slate-200 text-slate-400"}`}
      >
        {status ? status.charAt(0) : "-"}
      </span>
    </div>
  );
};

export default DailyReportAbsence;
