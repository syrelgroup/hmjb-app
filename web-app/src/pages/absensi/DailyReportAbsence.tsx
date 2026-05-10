import { useState, useEffect, useMemo } from "react";
import moment from "moment";
import type { IUser } from "../../libs/interface";
import api from "../../libs/api";
import { Calendar, FileSpreadsheet, Eye } from "lucide-react";
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

    // Hitung berdasarkan status di array Absence
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
        ) || 0,
      terlambat:
        user.Absence?.filter((a) =>
          (a.description || "").split(",").includes("TERLAMBAT"),
        ).length || 0,
      pulangCepat:
        user.Absence?.filter((a) =>
          (a.description || "").split(",").includes("PULANG _CETAP"),
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
      // 1. Definisikan SEMUA kolom identitas di awal objek
      const row: any = {
        NIK: user.nik,
        NIP: user.nip,
        "Nama Pegawai": user.fullname,
      };

      // 2. Kalkulasi summary terlebih dahulu agar data tersedia
      // const s = getUserSummary(user);

      // 3. Masukkan kolom tanggal (1 - 31)
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

          // Menampilkan: IN: 08:00 / OUT: 17:00
          // HR sangat suka ini karena jelas jam kerjanya
          row[day.day] = `${inTime}\n${outTime}`;
        } else {
          row[day.day] = day.isRedDay ? "OFF" : "-";
        }
      });

      // // 4. Tambahkan kolom statistik/detail di paling kanan secara berurutan
      // row["Hadir"] = s.hadir;
      // row["Alpha"] = s.alpha;
      // row["Sakit"] = s.sakit;
      // row["Cuti"] = s.cuti;
      // row["Lembur"] = s.lembur;
      // row["Terlambat"] = s.terlambat;
      // row["Pulang Awal"] = s.pulangCepat;
      // row["Total Tidak Masuk"] = s.totalTidakMasuk;
      // row["Total Potongan"] = calculateTotalDeduction(user);
      // row["Daftar Permohonan"] =
      //   user.PermitAbsence?.map((p) => p.type).join(", ") || "-";

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
        "Total Potongan",
        "Daftar Permohonan",
      ],
    });

    // 5. Opsional: Mengatur lebar kolom agar rapi
    const wscols = [
      { wch: 15 }, // NIK
      { wch: 15 }, // NIP
      { wch: 30 }, // Nama Pegawai
      ...daysHeader.map(() => ({ wch: 4 })), // Tanggal 1-31
      { wch: 10 }, // Hadir s/d Potongan...
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 40 }, // Daftar Permohonan
    ];
    ws["!cols"] = wscols;

    const wb = { Sheets: { Laporan: ws }, SheetNames: ["Laporan"] };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], { type: fileType });
    saveAs(dataBlob, `Report_Absensi_${month}${fileExtension}`);
  };

  // --- Helper Kalkulasi ---
  // const calculateTotalDeduction = (user: IUser) => {
  //   const late =
  //     user.Absence?.reduce(
  //       (acc, curr) => acc + (curr.late_deduction || 0),
  //       0,
  //     ) || 0;
  //   const alpha =
  //     user.Absence?.reduce(
  //       (acc, curr) => acc + (curr.alpha_deduction || 0),
  //       0,
  //     ) || 0;
  //   const fastLeave =
  //     user.Absence?.reduce(
  //       (acc, curr) => acc + (curr.fast_leave_deduction || 0),
  //       0,
  //     ) || 0;
  //   return late + alpha + fastLeave;
  // };

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
    (async () => {
      fetchHolidays();
      fetchData();
    })();
  }, [month, search, page, limit]);

  const daysHeader = useMemo(() => {
    const daysInMonth = moment(month).daysInMonth();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = moment(month).date(day).format("YYYY-MM-DD");
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
      <div className="p-4 bg-gray-50 min-h-screen">
        <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" /> Laporan Absensi
          </h1>

          <div className="flex flex-wrap gap-2">
            <Button
              icon={<FileSpreadsheet size={16} />}
              className="bg-green-600 text-white hover:bg-green-700 flex items-center"
              onClick={exportToExcel}
            >
              Export Excel
            </Button>

            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-1 border rounded bg-white text-sm outline-none"
            />

            <Input.Search
              placeholder="Cari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 200 }}
              size="middle"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-3 sticky left-0 bg-gray-100 z-30 border-b text-left min-w-37.5 shadow-sm">
                    Pegawai
                  </th>
                  {daysHeader.map((item) => (
                    <th
                      key={item.day}
                      title={item.tooltip}
                      className={`px-1 py-3 border-b text-center min-w-8.75 ${
                        item.isRedDay
                          ? "text-red-600 bg-red-50 font-bold"
                          : "text-gray-500"
                      }`}
                    >
                      {item.day}
                    </th>
                  ))}
                  {/* Kolom Detail Baru di Ujung Kanan */}
                  <th className="px-4 py-3 sticky right-0 bg-gray-100 z-30 border-b border-l text-center min-w-30 font-bold text-blue-700">
                    Summary & Detail
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((user) => {
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-blue-50/20 transition-colors group"
                    >
                      <td className="px-3 py-2 sticky left-0 bg-white group-hover:bg-blue-50 border-r z-20 shadow-sm">
                        <div className="font-bold text-gray-700">
                          {user.fullname}
                        </div>
                        <div className="text-[9px] text-gray-400">
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
                            className={`px-0 py-2 text-center border-r border-b border-gray-100 ${item.isRedDay ? "bg-red-50/20" : ""}`}
                          >
                            {abs ? (
                              <div>
                                <StatusBadge status={abs.absence_status} />
                                <div
                                  className="text-xs opacity-80"
                                  style={{ fontSize: 10 }}
                                >
                                  {abs.check_in
                                    ? moment(abs.check_in).format("HH:mm")
                                    : "-"}
                                </div>
                                <div
                                  className="text-xs opacity-80"
                                  style={{ fontSize: 10 }}
                                >
                                  {abs.check_out
                                    ? moment(abs.check_out).format("HH:mm")
                                    : "-"}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-200">
                                {item.isRedDay ? "" : "•"}
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Content Kolom Detail di Ujung Kanan */}
                      <td className="px-2 py-2 sticky right-0 bg-white group-hover:bg-blue-50 border-l z-20 shadow-sm border-b">
                        <div className="flex flex-col gap-1 items-center">
                          <div className="flex gap-2 text-[10px]">
                            {/* <span
                              className="text-red-500 font-bold"
                              title="Total Potongan"
                            >
                              -{totalDeduction.toLocaleString()}
                            </span> */}
                            <span
                              className="text-blue-600 font-bold"
                              title="Total Permohonan"
                            >
                              ({user.PermitAbsence?.length || 0} P)
                            </span>
                          </div>
                          <Button
                            size="small"
                            type="primary"
                            ghost
                            icon={<Eye size={12} />}
                            className="text-[10px] h-6 px-2 flex items-center"
                            onClick={() => showDetail(user)} // Panggil fungsi showDetail
                          >
                            Detail
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center bg-white p-2 rounded border">
          <div className="text-xs text-gray-500 italic">* P = Permohonan</div>
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
          />
        </div>
      </div>
      <Modal
        title={`Detail Absensi - ${selectedUser?.fullname}`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalOpen(false)}>
            Tutup
          </Button>,
        ]}
        style={{ top: 20 }}
        width={600}
      >
        {selectedUser &&
          (() => {
            const s = getUserSummary(selectedUser);
            return (
              <div className="py-4">
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="Total Hari Kerja" span={2}>
                    {s.totalDaysInMonth} Hari
                  </Descriptions.Item>

                  <Descriptions.Item label="Hadir">
                    <Tag color="green">{s.hadir} Hari</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Alpha">
                    <Tag color="red">{s.alpha} Hari</Tag>
                  </Descriptions.Item>

                  <Descriptions.Item label="Sakit">
                    <Tag color="warning">{s.sakit} Hari</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Cuti">
                    <Tag color="blue">{s.cuti} Hari</Tag>
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

                  <Descriptions.Item label="Lembur">
                    <Tag color="purple">{s.lembur.length} Kali</Tag>
                  </Descriptions.Item>
                  {/* <Descriptions.Item label="Potongan Gaji">
                    <span className="text-red-600 font-bold">
                      Rp{" "}
                      {calculateTotalDeduction(selectedUser).toLocaleString()}
                    </span>
                  </Descriptions.Item> */}
                </Descriptions>

                <Divider titlePlacement="left" className="text-xs">
                  Ringkasan Ketidakhadiran
                </Divider>

                <div className="bg-red-50 p-4 rounded-lg flex justify-between items-center">
                  <span className="text-gray-600">
                    Total Hari Tidak Masuk (Alpha+Sakit+Cuti):
                  </span>
                  <span className="text-2xl font-black text-red-600">
                    {s.totalTidakMasuk} Hari
                  </span>
                </div>

                {selectedUser.PermitAbsence &&
                  selectedUser.PermitAbsence.length > 0 && (
                    <>
                      <Divider titlePlacement="left" className="text-xs">
                        Permohonan Izin Aktif
                      </Divider>
                      <ul className="text-xs space-y-1">
                        {selectedUser.PermitAbsence.map((p, i) => (
                          <li
                            key={i}
                            className="flex justify-between border-b pb-1"
                          >
                            <span>
                              {p.type} - {moment(p.created_at).format("DD/MM")}
                            </span>
                            <Tag color="processing">{p.permit_status}</Tag>
                          </li>
                        ))}
                      </ul>
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
    HADIR: "bg-green-500 text-white",
    SAKIT: "bg-yellow-400 text-white",
    CUTI: "bg-blue-500 text-white",
    PERDIN: "bg-purple-500 text-white",
    ALPHA: "bg-red-500 text-white",
    LEMBUR: "bg-orange-500 text-white",
    PULANG_CEPAT: "bg-orange-600 text-white",
  };
  return (
    <div className="flex justify-center">
      <span
        className={`w-5 h-5 flex items-center justify-center rounded-sm text-[9px] font-black ${config[status] || "bg-gray-200"}`}
      >
        {status.charAt(0)}
      </span>
    </div>
  );
};

export default DailyReportAbsence;
