import { useEffect, useState } from "react";
import { Button, Card, Input, message, Spin, Table } from "antd";
import {
  CalendarDays,
  FileSpreadsheet,
  FileText,
  Printer,
  Search,
} from "lucide-react";
import moment from "moment";
import api from "../../libs/api";
import { IDRFormat } from "../utils/utilForm";
import { PTKPDetail, type IPTKP, type IUser } from "../../libs/interface";
import type { ColumnsType } from "antd/es/table";
import { CollapseList } from "../utils/utilComp";
import { printAllPayrol } from "../utils/pdfs/payrolls";
import { printPayrol } from "../utils/pdfs/payroll";

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

  const calculatePayroll = (user: IUser) => {
    const salary = user.salary || 0;
    const absences = user.Absence || [];
    const permit = user.PermitAbsence || [];
    const insentif = user.Insentif || [];
    const userCosts = user.UserCost || [];

    const latededuction = absences.reduce(
      (acc, curr) => acc + (curr.late_deduction || 0),
      0,
    );
    const late = absences.filter((a) =>
      (a.description || "").split(",").includes("TERLAMBAT"),
    );

    const alpha = absences.filter((a) => a.absence_status === "ALPHA");
    const lembur = absences.filter((a) =>
      (a.description || "").split(",").includes("LEMBUR"),
    );
    const fastleave = absences.filter((a) =>
      (a.description || "").split(",").includes("PULANG_CEPAT"),
    );
    const hadir = absences.filter((a) => a.absence_status === "HADIR");
    const sakit = absences.filter((a) => a.absence_status === "SAKIT");
    const cuti = absences.filter((a) => a.absence_status === "CUTI");
    const perdin = absences.filter(
      (a) =>
        a.absence_status === "PERDIN" ||
        (a.description || "").split(",").includes("PERDIN"),
    );

    const lemburPay = absences.reduce((acc, curr) => acc + curr.lemburan, 0);
    const alphaDeduction = alpha.reduce(
      (acc, curr) => acc + curr.alpha_deduction,
      0,
    );
    const fastLeaveDeduction = fastleave.reduce(
      (acc, curr) => acc + curr.fast_leave_deduction,
      0,
    );
    const totalInsentifPay = insentif.reduce((acc, cost) => {
      const nominal =
        cost.nominal_type === "PERCENT"
          ? salary * (cost.nominal / 100)
          : cost.nominal;
      return acc + nominal;
    }, 0);

    // Calculate user costs (allowances and deductions)
    const totalAllowanceUserCost = userCosts
      .filter((cost) => cost.type === "PENAMBAHAN")
      .reduce((acc, cost) => {
        const nominal =
          cost.nominal_type === "PERCENT"
            ? salary * (cost.nominal / 100)
            : cost.nominal;
        return acc + nominal;
      }, 0);

    const totalDeductionUserCost = userCosts
      .filter((cost) => cost.type === "PENGURANGAN")
      .reduce((acc, cost) => {
        const nominal =
          cost.nominal_type === "PERCENT"
            ? salary * (cost.nominal / 100)
            : cost.nominal;
        return acc + nominal;
      }, 0);

    const grossSalary =
      salary + lemburPay + totalAllowanceUserCost + totalInsentifPay;
    const netBeforeTax = Math.max(
      0,
      grossSalary -
        latededuction -
        alphaDeduction -
        fastLeaveDeduction -
        totalDeductionUserCost,
    );
    const ptkp: IPTKP =
      PTKPDetail.find((tkp) => tkp.name === user.ptkp) || PTKPDetail[0];
    const taxableIncome = Math.max(0, netBeforeTax - ptkp.value / 12);
    const pph = Math.round(taxableIncome * 0.05);
    const takeHome = Math.max(0, netBeforeTax - pph);

    return {
      salary,
      late,
      latePay: latededuction,
      alpha,
      alphaPay: alphaDeduction,
      lembur,
      lemburPay: lemburPay,
      fastleave,
      fastLeaveDeduction,
      hadir,
      sakit,
      cuti,
      perdin,
      grossSalary,
      netBeforeTax,
      taxableIncome,
      pph,
      takeHome,
      permitCount: permit.length,
      permitApproved: permit.filter((p) => p.permit_status === "DISETUJUI")
        .length,
      permitPending: permit.filter((p) => p.permit_status === "PENDING").length,
      allowance: userCosts.filter((a) => a.type === "PENAMBAHAN"),
      allowancePay: totalAllowanceUserCost,
      deduction: userCosts.filter((a) => a.type === "PENAMBAHAN"),
      deductionPay: totalDeductionUserCost,
      insentif: insentif,
      insentifPay: totalInsentifPay,
    };
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
      title: "ID",
      key: "id",
      dataIndex: "id",
      fixed: window.innerWidth > 600 ? "left" : undefined,
      render(value, _record, index) {
        return (
          <>
            <div>{(page - 1) * limit + index + 1}</div>
            <div className="text-xs opacity-80">{value}</div>
          </>
        );
      },
    },
    {
      title: "Nama",
      dataIndex: "fullname",
      key: "fullname",
      render: (value, record) => (
        <div>
          <div className="font-semibold">{value}</div>
          <div className="opacity-80 text-xs">@{record.nik}</div>
        </div>
      ),
    },
    {
      title: "Jabatan",
      dataIndex: ["Position", "name"],
      key: "position",
    },
    {
      title: "Gaji Pokok",
      key: "salary",
      render: (_value, record) => IDRFormat(record.salary || 0),
      align: "right",
    },
    {
      title: "Tunjangan Bulanan",
      key: "allowance",
      render: (_value, record) =>
        IDRFormat(calculatePayroll(record).allowancePay),
      align: "right",
    },
    {
      title: "Potongan Bulanan",
      key: "deductionUserCost",
      render: (_value, record) =>
        IDRFormat(calculatePayroll(record).deductionPay),
      align: "right",
    },
    {
      title: "Kehadiran",
      key: "hadir",
      render: (_value, record) => {
        const temp = calculatePayroll(record);
        return (
          <div>
            <div className="opacity-80 text-xs flex justify-between">
              <span className="w-14">Hadir</span> <span className="w-4">:</span>
              <span className="flex- justify-end">{temp.hadir.length}</span>
            </div>
            <div className="opacity-80 text-xs flex justify-between">
              <span className="w-14">Alpha</span> <span className="w-4">:</span>
              <span className="flex- justify-end">{temp.alpha.length}</span>
            </div>
            <div className="opacity-80 text-xs flex justify-between">
              <span className="w-14">Cuti</span> <span className="w-4">:</span>
              <span className="flex- justify-end">{temp.cuti.length}</span>
            </div>
            <div className="opacity-80 text-xs flex justify-between">
              <span className="w-14">Sakit</span> <span className="w-4">:</span>
              <span className="flex- justify-end">{temp.sakit.length}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Detail Kehadiran 1",
      key: "detail_hadir",
      render: (_value, record) => {
        const temp = calculatePayroll(record);
        return (
          <div>
            <div className="opacity-80 text-xs flex justify-between">
              <span className="w-18">Perdin</span>{" "}
              <span className="w-4">:</span>
              <span className="flex- justify-end">{temp.perdin.length}</span>
            </div>
            <div className="opacity-80 text-xs flex justify-between">
              <span className="w-18">Terlambat</span>{" "}
              <span className="w-4">:</span>
              <span className="flex- justify-end">{temp.late.length}</span>
            </div>
            <div className="opacity-80 text-xs flex justify-between">
              <span className="w-18">Pulang Awal</span>{" "}
              <span className="w-4">:</span>
              <span className="flex- justify-end">{temp.fastleave.length}</span>
            </div>
            <div className="opacity-80 text-xs flex justify-between">
              <span className="w-18">Lembur</span>{" "}
              <span className="w-4">:</span>
              <span className="flex- justify-end">{temp.lembur.length}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Detail Kehadiran 2",
      key: "detail_cost",
      render: (_value, record) => {
        const temp = calculatePayroll(record);
        return (
          <div>
            <div className="opacity-80 text-xs flex justify-between">
              <span className="w-20">Alpa</span> <span className="w-4">:</span>
              <span className="flex- justify-end">
                {IDRFormat(temp.alphaPay)}
              </span>
            </div>
            <div className="opacity-80 text-xs flex justify-between">
              <span className="w-20">Terlambat</span>{" "}
              <span className="w-4">:</span>
              <span className="flex- justify-end">
                {IDRFormat(temp.latePay)}
              </span>
            </div>
            <div className="opacity-80 text-xs flex justify-between">
              <span className="w-20">Pulang Awal</span>{" "}
              <span className="w-4">:</span>
              <span className="flex- justify-end">
                {IDRFormat(temp.fastLeaveDeduction)}
              </span>
            </div>
            <div className="opacity-80 text-xs flex justify-between">
              <span className="w-20">Lembur</span>{" "}
              <span className="w-4">:</span>
              <span className="flex- justify-end">
                {IDRFormat(temp.lemburPay)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Insentif/Bonus",
      key: "insntif",
      render: (_value, record) => {
        const temp = calculatePayroll(record);
        return (
          <CollapseList
            items={temp.insentif.map(
              (i) =>
                `${i.name} : ${i.nominal_type === "RUPIAH" ? IDRFormat(i.nominal) : IDRFormat(record.salary * (i.nominal / 100))}`,
            )}
          />
        );
      },
    },
    {
      title: "PPh 21",
      key: "pph",
      render: (_value, record) => IDRFormat(calculatePayroll(record).pph),
      align: "right",
    },
    {
      title: "Take Home",
      key: "takeHome",
      render: (_value, record) => IDRFormat(calculatePayroll(record).takeHome),
      align: "right",
    },
    {
      title: "Cetak",
      key: "action",
      render: (_value, record) => (
        <Button
          type="primary"
          icon={<Printer size={14} />}
          size="small"
          onClick={() => exportIndividualPdf(record)}
        ></Button>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <div className="space-y-6 p-4 bg-slate-50 min-h-screen">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-7 h-7 text-slate-700" /> Rekap Payroll
            </h1>
            <p className="text-slate-500 mt-2">
              Cetak Excel dan PDF payroll bulanan, serta slip perorangan lengkap
              dengan perhitungan PPh.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="default"
              icon={<FileSpreadsheet size={16} />}
              onClick={exportToExcel}
            >
              Export Excel
            </Button>
            <Button
              type="default"
              icon={<FileText size={16} />}
              onClick={exportAllPdf}
            >
              Export PDF Semua
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="shadow-sm border border-slate-200">
            <div className="text-slate-500 text-sm mb-2">Bulan</div>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </Card>
          <Card className="shadow-sm border border-slate-200 lg:col-span-2">
            <div className="text-slate-500 text-sm mb-2">Cari Pegawai</div>
            <Input
              prefix={<Search size={16} />}
              placeholder="Cari nama, NIK, NIP"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Card>
        </div>

        <Card className="shadow-sm border border-slate-200">
          <Table
            rowKey={(record) => record.id}
            dataSource={data}
            columns={columns}
            bordered
            size="small"
            pagination={{
              current: page,
              pageSize: limit,
              total,
              showSizeChanger: true,
              onChange: (pageNo, pageSize) => {
                setPage(pageNo);
                setLimit(pageSize || 100);
              },
            }}
            scroll={{
              x: "max-content",
              // y: window.innerWidth > 600 ? "53vh" : "65vh",
            }}
          />
        </Card>
      </div>
    </Spin>
  );
};

export default PayrollPage;
