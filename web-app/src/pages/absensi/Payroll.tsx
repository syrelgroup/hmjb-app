import { useEffect, useState } from "react";
import { Button, Card, Input, message, Spin, Table } from "antd";
import {
  CalendarDays,
  FileSpreadsheet,
  FileText,
  Printer,
  Search,
} from "lucide-react";
import * as XLSX from "xlsx";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { saveAs } from "file-saver";
import moment from "moment";
import api from "../../libs/api";
import { IDRFormat } from "../utils/utilForm";
import type { IUser } from "../../libs/interface";
import type { ColumnsType } from "antd/es/table";

const PTKP_ANNUAL = 54000000;
const PTKP_MONTHLY = PTKP_ANNUAL / 12;

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
    const userCosts = user.UserCost || [];

    const lateMinutes = absences.reduce(
      (acc, curr) => acc + (curr.late_deduction || 0),
      0,
    );
    const alphaCount = absences.filter(
      (a) => a.absence_status === "ALPHA",
    ).length;
    const overtimeCount = absences.filter(
      (a) => a.absence_status === "LEMBUR",
    ).length;
    const hadirCount = absences.filter(
      (a) => a.absence_status === "HADIR",
    ).length;
    const sakitCount = absences.filter(
      (a) => a.absence_status === "SAKIT",
    ).length;
    const cutiCount = absences.filter(
      (a) => a.absence_status === "CUTI",
    ).length;
    const perdinCount = absences.filter(
      (a) => a.absence_status === "PERDIN",
    ).length;

    const overtimePay = Math.round((salary / 173) * overtimeCount);
    const lateDeduction = Math.round((salary / 173 / 60) * lateMinutes);
    const alphaDeduction = Math.round((salary / 30) * alphaCount);
    const totalDeduction = lateDeduction + alphaDeduction;

    // Calculate user costs (allowances and deductions)
    const totalAllowance = userCosts
      .filter((cost) => cost.type === "PENAMBAHAN")
      .reduce((acc, cost) => {
        const nominal =
          cost.nominal_type === "PERCENT"
            ? (salary * cost.nominal) / 100
            : cost.nominal;
        return acc + nominal;
      }, 0);

    const totalDeductionUserCost = userCosts
      .filter((cost) => cost.type === "PENGURANGAN")
      .reduce((acc, cost) => {
        const nominal =
          cost.nominal_type === "PERCENT"
            ? (salary * cost.nominal) / 100
            : cost.nominal;
        return acc + nominal;
      }, 0);

    const grossSalary = salary + overtimePay + totalAllowance;
    const netBeforeTax = Math.max(
      0,
      grossSalary - totalDeduction - totalDeductionUserCost,
    );
    const taxableIncome = Math.max(0, netBeforeTax - PTKP_MONTHLY);
    const pph = Math.round(taxableIncome * 0.05);
    const takeHome = Math.max(0, netBeforeTax - pph);

    return {
      salary,
      lateMinutes,
      alphaCount,
      overtimeCount,
      hadirCount,
      sakitCount,
      cutiCount,
      perdinCount,
      overtimePay,
      lateDeduction,
      alphaDeduction,
      totalDeduction,
      totalAllowance,
      totalDeductionUserCost,
      grossSalary,
      netBeforeTax,
      taxableIncome,
      pph,
      takeHome,
      permitCount: permit.length,
      permitApproved: permit.filter((p) => p.permit_status === "DISETUJUI")
        .length,
      permitPending: permit.filter((p) => p.permit_status === "PENDING").length,
    };
  };

  const exportToExcel = () => {
    const fileExtension = ".xlsx";
    const excelData = data.map((user) => {
      const payroll = calculatePayroll(user);
      return {
        NIK: user.nik,
        NIP: user.nip,
        Nama: user.fullname,
        Jabatan: user.Position?.name || "-",
        "Gaji Pokok": payroll.salary,
        "Tunjangan (Rp)": payroll.totalAllowance,
        "Potongan UserCost (Rp)": payroll.totalDeductionUserCost,
        Hadir: payroll.hadirCount,
        Alpha: payroll.alphaCount,
        Sakit: payroll.sakitCount,
        Cuti: payroll.cutiCount,
        Perdin: payroll.perdinCount,
        Lembur: payroll.overtimeCount,
        "Potongan Terlambat (Rp)": payroll.lateDeduction,
        "Potongan Alpha (Rp)": payroll.alphaDeduction,
        "Total Potongan (Rp)":
          payroll.totalDeduction + payroll.totalDeductionUserCost,
        "Gaji Kotor (Rp)": payroll.grossSalary,
        "Penghasilan Kena Pajak (Rp)": payroll.taxableIncome,
        "PPh 5% (Rp)": payroll.pph,
        "Take Home Pay (Rp)": payroll.takeHome,
        "Permohonan Izin": payroll.permitCount,
        "Izin Disetujui": payroll.permitApproved,
        "Izin Pending": payroll.permitPending,
      };
    });

    const ws = XLSX.utils.json_to_sheet(excelData, {
      header: [
        "NIK",
        "NIP",
        "Nama",
        "Jabatan",
        "Gaji Pokok",
        "Tunjangan (Rp)",
        "Potongan UserCost (Rp)",
        "Hadir",
        "Alpha",
        "Sakit",
        "Cuti",
        "Perdin",
        "Lembur",
        "Potongan Terlambat (Rp)",
        "Potongan Alpha (Rp)",
        "Total Potongan (Rp)",
        "Gaji Kotor (Rp)",
        "Penghasilan Kena Pajak (Rp)",
        "PPh 5% (Rp)",
        "Take Home Pay (Rp)",
        "Permohonan Izin",
        "Izin Disetujui",
        "Izin Pending",
      ],
    });

    ws["!cols"] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 10 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 20 },
      { wch: 15 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
    ];

    const wb = { Sheets: { Payroll: ws }, SheetNames: ["Payroll"] };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(dataBlob, `Rekap_Payroll_${month}${fileExtension}`);
  };

  const exportAllPdf = async () => {
    if (!data.length) {
      return message.warning("Tidak ada data untuk dicetak PDF");
    }

    setLoading(true);
    try {
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      let page = doc.addPage([595, 842]);
      const { height } = page.getSize();
      const lineHeight = 16;
      let cursorY = height - 60;

      page.drawText("Rekap Payroll Bulanan", {
        x: 40,
        y: cursorY,
        size: 16,
        font,
        color: rgb(0.05, 0.05, 0.05),
      });
      page.drawText(`Bulan: ${moment(month).format("MMMM YYYY")}`, {
        x: 40,
        y: cursorY - 20,
        size: 11,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      cursorY -= 45;

      const header = [
        "No",
        "NIK",
        "Nama",
        "Gaji Pokok",
        "Tunjangan",
        "Potongan",
        "PPh",
        "Take Home",
      ];
      const columnX = [40, 80, 140, 280, 340, 400, 460, 520];

      const drawHeader = () => {
        header.forEach((text, index) => {
          page.drawText(text, {
            x: columnX[index],
            y: cursorY,
            size: 10,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });
        });
        cursorY -= lineHeight;
      };

      drawHeader();

      data.forEach((user, index) => {
        const payroll = calculatePayroll(user);
        if (cursorY < 80) {
          page = doc.addPage([595, 842]);
          cursorY = height - 60;
          drawHeader();
        }

        page.drawText((index + 1).toString(), {
          x: columnX[0],
          y: cursorY,
          size: 10,
          font,
        });
        page.drawText(user.nik || "-", {
          x: columnX[1],
          y: cursorY,
          size: 10,
          font,
        });
        page.drawText(user.fullname || "-", {
          x: columnX[2],
          y: cursorY,
          size: 10,
          font,
        });
        page.drawText(IDRFormat(payroll.salary), {
          x: columnX[3],
          y: cursorY,
          size: 10,
          font,
        });
        page.drawText(IDRFormat(payroll.totalAllowance), {
          x: columnX[4],
          y: cursorY,
          size: 10,
          font,
        });
        page.drawText(
          IDRFormat(payroll.totalDeduction + payroll.totalDeductionUserCost),
          {
            x: columnX[5],
            y: cursorY,
            size: 10,
            font,
          },
        );
        page.drawText(IDRFormat(payroll.pph), {
          x: columnX[6],
          y: cursorY,
          size: 10,
          font,
        });
        page.drawText(IDRFormat(payroll.takeHome), {
          x: columnX[7],
          y: cursorY,
          size: 10,
          font,
        });
        cursorY -= lineHeight;
      });

      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      saveAs(blob, `Rekap_Payroll_All_${month}.pdf`);
    } catch (error) {
      console.error(error);
      message.error("Gagal membuat PDF semua payroll");
    } finally {
      setLoading(false);
    }
  };

  const exportIndividualPdf = async (user: IUser) => {
    setLoading(true);
    try {
      const payroll = calculatePayroll(user);
      const doc = await PDFDocument.create();
      const helvetica = await doc.embedFont(StandardFonts.Helvetica);
      const page = doc.addPage([595, 842]);
      const { height } = page.getSize();
      const lineHeight = 18;
      let cursorY = height - 60;

      page.drawText("Slip Payroll Perorangan", {
        x: 40,
        y: cursorY,
        size: 18,
        font: helvetica,
        color: rgb(0.05, 0.05, 0.05),
      });
      page.drawText(`Bulan: ${moment(month).format("MMMM YYYY")}`, {
        x: 40,
        y: cursorY - 24,
        size: 12,
        font: helvetica,
        color: rgb(0.2, 0.2, 0.2),
      });

      cursorY -= 50;
      const drawLine = (label: string, value: string) => {
        page.drawText(label, {
          x: 40,
          y: cursorY,
          size: 11,
          font: helvetica,
          color: rgb(0.1, 0.1, 0.1),
        });
        page.drawText(value, {
          x: 360,
          y: cursorY,
          size: 11,
          font: helvetica,
          color: rgb(0.1, 0.1, 0.1),
        });
        cursorY -= lineHeight;
      };

      drawLine("Nama", user.fullname || "-");
      drawLine("NIK", user.nik || "-");
      drawLine("NIP", user.nip || "-");
      drawLine("Jabatan", user.Position?.name || "-");
      cursorY -= 10;
      page.drawText("Rincian Payroll:", {
        x: 40,
        y: cursorY,
        size: 12,
        font: helvetica,
        color: rgb(0.05, 0.05, 0.05),
      });
      cursorY -= lineHeight;
      drawLine("Gaji Pokok", IDRFormat(payroll.salary));
      drawLine("Tunjangan", IDRFormat(payroll.totalAllowance));
      drawLine("Lembur (Rp)", IDRFormat(payroll.overtimePay));
      drawLine("Potongan Terlambat", IDRFormat(payroll.lateDeduction));
      drawLine("Potongan Alpha", IDRFormat(payroll.alphaDeduction));
      drawLine("Potongan UserCost", IDRFormat(payroll.totalDeductionUserCost));
      drawLine(
        "Total Deduction",
        IDRFormat(payroll.totalDeduction + payroll.totalDeductionUserCost),
      );
      drawLine("Gaji Bersih Sebelum Pajak", IDRFormat(payroll.netBeforeTax));
      cursorY -= 10;

      page.drawText("Perhitungan PPh:", {
        x: 40,
        y: cursorY,
        size: 12,
        font: helvetica,
        color: rgb(0.05, 0.05, 0.05),
      });
      cursorY -= lineHeight;

      page.drawText(`1. PTKP Bulanan = ${IDRFormat(PTKP_MONTHLY)}`, {
        x: 40,
        y: cursorY,
        size: 11,
        font: helvetica,
      });
      cursorY -= lineHeight;
      page.drawText(
        `2. Penghasilan Kena Pajak = Gaji Bersih Sebelum Pajak - PTKP Bulanan`,
        {
          x: 40,
          y: cursorY,
          size: 11,
          font: helvetica,
        },
      );
      cursorY -= lineHeight;
      page.drawText(
        `   = ${IDRFormat(payroll.netBeforeTax)} - ${IDRFormat(PTKP_MONTHLY)} = ${IDRFormat(payroll.taxableIncome)}`,
        {
          x: 40,
          y: cursorY,
          size: 11,
          font: helvetica,
        },
      );
      cursorY -= lineHeight;
      page.drawText(`3. Tarif PPh = 5%`, {
        x: 40,
        y: cursorY,
        size: 11,
        font: helvetica,
      });
      cursorY -= lineHeight;
      page.drawText(
        `4. PPh = Penghasilan Kena Pajak x 5% = ${IDRFormat(payroll.pph)}`,
        {
          x: 40,
          y: cursorY,
          size: 11,
          font: helvetica,
        },
      );
      cursorY -= lineHeight * 2;

      page.drawText("Hasil Akhir:", {
        x: 40,
        y: cursorY,
        size: 12,
        font: helvetica,
        color: rgb(0.05, 0.05, 0.05),
      });
      cursorY -= lineHeight;
      drawLine("PPh 5%", IDRFormat(payroll.pph));
      drawLine("Take Home Pay", IDRFormat(payroll.takeHome));

      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      saveAs(
        blob,
        `Payroll_${user.fullname || user.nik || "pegawai"}_${month}.pdf`,
      );
    } catch (error) {
      console.error(error);
      message.error("Gagal membuat PDF perorangan");
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<IUser> = [
    {
      title: "NIK",
      dataIndex: "nik",
      key: "nik",
      width: 120,
    },
    {
      title: "Nama",
      dataIndex: "fullname",
      key: "fullname",
      render: (value) => <span className="font-semibold">{value}</span>,
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
      title: "Tunjangan",
      key: "allowance",
      render: (_value, record) =>
        IDRFormat(calculatePayroll(record).totalAllowance),
      align: "right",
    },
    {
      title: "Potongan UserCost",
      key: "deductionUserCost",
      render: (_value, record) =>
        IDRFormat(calculatePayroll(record).totalDeductionUserCost),
      align: "right",
    },
    {
      title: "Total Potongan",
      key: "deduction",
      render: (_value, record) =>
        IDRFormat(
          calculatePayroll(record).totalDeduction +
            calculatePayroll(record).totalDeductionUserCost,
        ),
      align: "right",
    },
    {
      title: "PPh 5%",
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
      title: "Aksi",
      key: "action",
      render: (_value, record) => (
        <Button
          type="primary"
          icon={<Printer size={16} />}
          size="small"
          onClick={() => exportIndividualPdf(record)}
        >
          Cetak PDF
        </Button>
      ),
      width: 140,
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
            scroll={{ x: 1000 }}
          />
        </Card>
      </div>
    </Spin>
  );
};

export default PayrollPage;
