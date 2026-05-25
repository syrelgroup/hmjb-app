import { useEffect, useState } from "react";
import { Button, Card, Input, message, Spin, Table, Tag, Tooltip } from "antd";
import {
  CalendarDays,
  FileSpreadsheet,
  FileText,
  Printer,
  Search,
  User,
} from "lucide-react";
import moment from "moment";
import api from "../../libs/api";
import { IDRFormat } from "../utils/utilForm";
import { type IUser } from "../../libs/interface";
import type { ColumnsType } from "antd/es/table";
import { CollapseList } from "../utils/utilComp";
import { printAllPayrol } from "../utils/pdfs/payrolls";
import { printPayrol } from "../utils/pdfs/payroll";
import { calculatePayroll } from "../utils/libs";

const PayrollPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IUser[]>([]);
  const [month, setMonth] = useState(moment().format("YYYY-MM"));
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchData();
  }, [month, search, page, limit]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/absence_report`, {
        params: {
          month,
          page,
          limit,
          search,
        },
      });
      setData(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error(error);
      message.error("Gagal memuat data payroll");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {};

  const exportAllPdf = async () => {
    if (!data.length) {
      return message.warning("Tidak ada data untuk dicetak PDF");
    }
    printAllPayrol(data);
  };

  const exportIndividualPdf = async (_user: IUser) => {
    setLoading(true);
    printPayrol(_user);
    setLoading(false);
  };

  const columns: ColumnsType<IUser> = [
    {
      title: "No",
      key: "id",
      dataIndex: "id",
      width: 70,
      fixed: window.innerWidth > 600 ? "left" : undefined,
      render(value, _record, index) {
        return (
          <div className="text-center">
            <div className="font-bold text-slate-700">
              {(page - 1) * limit + index + 1}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-12.5">
              {value.substring(0, 5)}...
            </div>
          </div>
        );
      },
    },
    {
      title: "Pegawai",
      dataIndex: "fullname",
      key: "fullname",
      fixed: window.innerWidth > 600 ? "left" : undefined,
      render: (value, record) => (
        <div className="flex items-center gap-2.5 py-0.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
            <User size={16} />
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-slate-800 text-sm">{value}</div>
            <div className="text-slate-400 text-xs font-mono mt-0.5">
              NIK: {record.nik || "-"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Jabatan",
      dataIndex: ["Position", "name"],
      key: "position",
      render: (value) => (
        <Tag color="blue" className="font-medium rounded m-0">
          {value || "-"}
        </Tag>
      ),
    },
    {
      title: "Gaji Pokok",
      key: "salary",
      dataIndex: "salary",
      render: (value) => (
        <span className="font-medium text-slate-700">
          {IDRFormat(value || 0)}
        </span>
      ),
      align: "right",
    },
    {
      title: "Tunj. & Pot. Tetap",
      key: "allowance",
      width: 170,
      render: (_value, record) => {
        const temp = calculatePayroll(record);
        return (
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center bg-emerald-50/50 px-2 py-0.5 rounded border border-emerald-100/50 text-emerald-700">
              <span>Tunjangan</span>
              <span className="font-semibold">
                {IDRFormat(temp.allowancePay)}
              </span>
            </div>
            <div className="flex justify-between items-center bg-rose-50/50 px-2 py-0.5 rounded border border-rose-100/50 text-rose-700">
              <span>Potongan</span>
              <span className="font-semibold">
                {IDRFormat(temp.deductionPay)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Absensi Utama",
      key: "hadir",
      width: 140,
      render: (_value, record) => {
        const temp = calculatePayroll(record);
        return (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                Hadir
              </span>
              <span className="text-slate-800 font-bold">
                {temp.hadir.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
                Alpha
              </span>
              <span className="text-slate-800 font-bold">
                {temp.alpha.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
                Cuti
              </span>
              <span className="text-slate-800 font-bold">
                {temp.cuti.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                Sakit
              </span>
              <span className="text-slate-800 font-bold">
                {temp.sakit.length}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Detail Kehadiran",
      key: "detail_hadir",
      width: 150,
      render: (_value, record) => {
        const temp = calculatePayroll(record);
        return (
          <div className="grid grid-cols-1 gap-0.5 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Perdin:</span>
              <span className="font-semibold text-slate-700">
                {temp.perdin.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Terlambat:</span>
              <span className="font-semibold text-amber-600">
                {temp.late.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Pulang Awal:</span>
              <span className="font-semibold text-orange-600">
                {temp.fastleave.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Lembur:</span>
              <span className="font-semibold text-indigo-600">
                {temp.lembur.length}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Denda & Lembur (Absensi)",
      key: "detail_cost",
      width: 200,
      render: (_value, record) => {
        const temp = calculatePayroll(record);
        return (
          <div className="space-y-0.5 text-[11px] text-slate-600">
            <div className="flex justify-between">
              <span>Denda Alpa:</span>
              <span className="text-rose-600 font-medium">
                -{IDRFormat(temp.alphaPay)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Denda Telat:</span>
              <span className="text-rose-600 font-medium">
                -{IDRFormat(temp.latePay)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Denda Plg Awal:</span>
              <span className="text-rose-600 font-medium">
                -{IDRFormat(temp.fastLeaveDeduction)}
              </span>
            </div>
            <div className="flex justify-between border-t border-dashed border-slate-200 mt-0.5 pt-0.5">
              <span>Upah Lembur:</span>
              <span className="text-emerald-600 font-semibold">
                +{IDRFormat(temp.lemburPay)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Insentif/Bonus",
      key: "insntif",
      width: 160,
      render: (_value, record) => {
        const temp = calculatePayroll(record);
        return (
          <CollapseList
            items={temp.insentif.map(
              (i) =>
                `${i.name}: ${i.nominal_type === "RUPIAH" ? IDRFormat(i.nominal) : IDRFormat(record.salary * (i.nominal / 100))}`,
            )}
          />
        );
      },
    },
    {
      title: "Pot. Tidak Tetap",
      key: "pot",
      width: 160,
      render: (_value, record) => {
        const temp = calculatePayroll(record);
        return (
          <CollapseList
            items={temp.tt_deduction.map(
              (i) =>
                `${i.name}: ${i.nominal_type === "RUPIAH" ? IDRFormat(i.nominal) : IDRFormat(record.salary * (i.nominal / 100))}`,
            )}
          />
        );
      },
    },
    {
      title: "PPh 21",
      key: "pph",
      render: (_value, record) => (
        <span className="text-rose-600 font-medium">
          {IDRFormat(calculatePayroll(record).pph)}
        </span>
      ),
      align: "right",
    },
    {
      title: "Take Home Pay",
      key: "takeHome",
      fixed: window.innerWidth > 600 ? "right" : undefined,
      render: (_value, record) => (
        <span className="font-bold text-slate-900 bg-slate-100 text-sm px-2 py-1 rounded block text-right border border-slate-200/60">
          {IDRFormat(calculatePayroll(record).takeHome)}
        </span>
      ),
      align: "right",
    },
    {
      title: "Aksi",
      key: "action",
      width: 60,
      align: "center",
      fixed: window.innerWidth > 600 ? "right" : undefined,
      render: (_value, record) => (
        <Tooltip title="Cetak Slip Gaji">
          <Button
            type="primary"
            icon={<Printer size={14} />}
            size="small"
            className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-500"
            onClick={() => exportIndividualPdf(record)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Spin spinning={loading} tip="Sedang memproses data payroll...">
      <div className="space-y-6 p-6 bg-slate-50/50 min-h-screen">
        {/* TOP HEADER HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2.5 tracking-tight">
              <CalendarDays className="w-6 h-6 text-indigo-600" /> Rekapitulasi
              & Payroll Bulanan
            </h1>
            <p className="text-slate-400 text-xs mt-1 font-medium">
              Manajemen berkas Excel, rekap PDF korporat, serta distribusi slip
              gaji perorangan dengan perhitungan PPh 21 otomatis.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              type="default"
              icon={<FileSpreadsheet size={15} className="text-emerald-600" />}
              onClick={exportToExcel}
              className="hover:border-emerald-500 font-medium text-slate-600"
            >
              Export Excel
            </Button>
            <Button
              type="primary"
              icon={<FileText size={15} />}
              onClick={exportAllPdf}
              className="bg-slate-800 hover:bg-slate-700 border-none font-medium"
            >
              Export PDF Semua
            </Button>
          </div>
        </div>

        {/* INPUT CONTROLS / FILTER ROW */}
        <Card className="shadow-sm border border-slate-200/80 body-p-4 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Periode Bulan
              </label>
              <Input
                type="month"
                className="w-full rounded-md border-slate-200 focus:border-indigo-500"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Pencarian Pegawai
              </label>
              <Input
                prefix={<Search size={15} className="text-slate-400 mr-1" />}
                placeholder="Cari berdasarkan nama lengkap, nomor NIK, atau NIP pegawai..."
                className="w-full rounded-md border-slate-200 focus:border-indigo-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
              />
            </div>
          </div>
        </Card>

        {/* MAIN DATA TABLE */}
        <Card className="shadow-sm border border-slate-200/80 rounded-xl overflow-hidden body-p-0">
          <Table
            rowKey={(record) => record.id}
            dataSource={data}
            columns={columns}
            bordered
            size="middle"
            className="custom-payroll-table"
            pagination={{
              current: page,
              pageSize: limit,
              total,
              showSizeChanger: true,
              pageSizeOptions: ["20", "50", "100", "200"],
              showTotal: (totalToken) => (
                <span className="text-slate-500 text-xs font-medium">
                  Total data: <b className="text-slate-700">{totalToken}</b>{" "}
                  pegawai
                </span>
              ),
              onChange: (pageNo, pageSize) => {
                setPage(pageNo);
                setLimit(pageSize || 100);
              },
            }}
            scroll={{
              x: "max-content",
            }}
          />
        </Card>
      </div>
    </Spin>
  );
};

export default PayrollPage;
