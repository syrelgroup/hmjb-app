import { useState, useEffect } from "react";
import {
  DatePicker,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Typography,
  Spin,
  message,
  Space,
  Progress,
  Tabs,
  Button,
} from "antd";
import {
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  AppstoreOutlined,
  TeamOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FileExcelOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import api from "../../libs/api";
import ExcelJS from "exceljs";
import moment from "moment";
import { printKredit } from "../utils/pdfs/kredit";

const { Title, Text } = Typography;

export default function LaporanKredit() {
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalPlafond: 0,
    totalValue: 0,
    totalRealize: 0,
    totalTunggakan: 0,
    nplPercentage: 0,
    collectionRate: 0,
  });

  // Fetch data dari API berdasarkan bulan yang dipilih
  const fetchData = async () => {
    setLoading(true);
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/billing/laporan${selectedMonth ? `?month=${selectedMonth}` : ""}`;
      const response = await api.get(apiUrl);

      if (response.status === 200) {
        const data = response.data.data;
        setDashboardData(data);
        calculateSummary(data);
      }
    } catch (error) {
      console.error(error);
      message.error("Gagal mengambil data laporan billing.");
    } finally {
      setLoading(false);
    }
  };

  // Hitung agregasi data untuk komponen Summary Cards
  const calculateSummary = (data: any[]) => {
    let plafond = 0;
    let value = 0;
    let realize = 0;
    let tunggakanPokok = 0;
    let totalTunggakan = 0;

    data.forEach((mitra) => {
      mitra.Billing?.forEach((bill: any) => {
        plafond += bill.plafond || 0;
        value += bill.value || 0;
        realize += bill.realize_value || 0;
        tunggakanPokok += bill.tung_pkk || 0;
        totalTunggakan += (bill.tung_pkk || 0) + (bill.tung_bga || 0);
      });
    });

    const npl = plafond > 0 ? (tunggakanPokok / plafond) * 100 : 0;
    const collection = value > 0 ? (realize / value) * 100 : 0;

    setSummary({
      totalPlafond: plafond,
      totalValue: value,
      totalRealize: realize,
      totalTunggakan: totalTunggakan,
      nplPercentage: parseFloat(npl.toFixed(2)),
      collectionRate: parseFloat(collection.toFixed(2)),
    });
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  // Format Mata Uang Rupiah
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // ==========================================
  // DATA PREPARATION FOR TABLES & EXCEL
  // ==========================================
  const getInstansiBaseData = () => {
    return dashboardData.map((mitra, index) => {
      let deb = 0;
      let sisaPokok = 0;
      let angsuran = 0;
      let tunggakanPokok = 0;
      let totalTunggakan = 0;

      mitra.Billing?.forEach((bill: any) => {
        deb += 1;
        sisaPokok += bill.plafond || 0;
        angsuran += bill.value || 0;
        tunggakanPokok += bill.tung_pkk || 0;
        totalTunggakan += (bill.tung_pkk || 0) + (bill.tung_bga || 0);
      });

      const nplGross = sisaPokok > 0 ? (tunggakanPokok / sisaPokok) * 100 : 0;
      const nplInstansi =
        sisaPokok > 0 ? (totalTunggakan / sisaPokok) * 100 : 0;

      return {
        no: index + 1,
        instansi: mitra.name || "Tanpa Nama",
        code: mitra.code || "-",
        deb,
        sisaPokok,
        angsuran,
        realisasi:
          mitra.Billing?.reduce(
            (acc: number, b: any) => acc + (b.realize_value || 0),
            0,
          ) || 0,
        tunggakanPokok, // ditambahkan agar bisa diakumulasi di grand total
        totalTunggakan, // ditambahkan agar bisa diakumulasi di grand total
        nplGross: parseFloat(nplGross.toFixed(2)),
        nplInstansi: parseFloat(nplInstansi.toFixed(2)),
      };
    });
  };

  const getSegmentasiBaseData = () => {
    const segmentMap: { [key: string]: any } = {};
    let noIdx = 1;

    dashboardData.forEach((mitra) => {
      mitra.Billing?.forEach((bill: any) => {
        const segName = bill.Submission?.Product?.name || "Non Keagenan";
        if (!segmentMap[segName]) {
          segmentMap[segName] = {
            no: noIdx++,
            segmen: segName,
            deb: 0,
            sisaPokok: 0,
            angsuran: 0,
            tunggakanPokok: 0,
            totalTunggakan: 0,
          };
        }
        segmentMap[segName].deb += 1;
        segmentMap[segName].sisaPokok += bill.plafond || 0;
        segmentMap[segName].angsuran += bill.value || 0;
        segmentMap[segName].tunggakanPokok += bill.tung_pkk || 0;
        segmentMap[segName].totalTunggakan +=
          (bill.tung_pkk || 0) + (bill.tung_bga || 0);
      });
    });

    return Object.values(segmentMap).map((item: any) => {
      const nplGross =
        item.sisaPokok > 0 ? (item.tunggakanPokok / item.sisaPokok) * 100 : 0;
      const nplSegmen =
        item.sisaPokok > 0 ? (item.totalTunggakan / item.sisaPokok) * 100 : 0;
      return {
        ...item,
        nplGross: parseFloat(nplGross.toFixed(2)),
        nplSegmen: parseFloat(nplSegmen.toFixed(2)),
      };
    });
  };

  // ==========================================
  // EXPORT 5 SHEETS DENGAN EXCELJS
  // ==========================================
  const handleExportExcel5Sheets = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const instansiData = getInstansiBaseData();
      const segmentData = getSegmentasiBaseData();
      const periodeTeks = selectedMonth
        ? moment(selectedMonth).format("MMM-YY")
        : "SEMUA DATA";

      // ==========================================
      // REUSABLE ADVANCED STYLES & PALETTES
      // ==========================================
      const PALETTE = {
        primaryDark: "1F4E78", // Biru Navy khas Corporate Bank
        primaryLight: "D9E1F2", // Biru Muda Header Sekunder
        zebraEven: "F2F2F2", // Abu-abu tipis untuk selang-seling baris
        accentTotal: "FFF2CC", // Kuning pastel premium untuk Grand Total
        borderLight: "D9D9D9", // Border abu-abu halus agar tidak kaku
      };

      const applyWorksheetConfig = (ws: ExcelJS.Worksheet) => {
        ws.views = [{ showGridLines: true }];
      };

      const applyCellBorders = (
        ws: ExcelJS.Worksheet,
        startRow: number,
        endRow: number,
        endCol: number,
      ) => {
        for (let r = startRow; r <= endRow; r++) {
          const row = ws.getRow(r);
          for (let c = 1; c <= endCol; c++) {
            row.getCell(c).border = {
              top: { style: "thin", color: { argb: PALETTE.borderLight } },
              left: { style: "thin", color: { argb: PALETTE.borderLight } },
              bottom: { style: "thin", color: { argb: PALETTE.borderLight } },
              right: { style: "thin", color: { argb: PALETTE.borderLight } },
            };
          }
        }
      };

      const addBprHeader = (
        ws: ExcelJS.Worksheet,
        titleText: string,
        maxCol: number,
      ) => {
        ws.mergeCells(1, 1, 1, maxCol);
        ws.mergeCells(2, 1, 2, maxCol);
        ws.mergeCells(3, 1, 3, maxCol);

        ws.getCell("A1").value = "PT BPR HASAMITRA JAWA BARAT";
        ws.getCell("A2").value = titleText.toUpperCase();
        ws.getCell("A3").value =
          `PERIODE LAPORAN: ${periodeTeks.toUpperCase()}`;

        [1, 2, 3].forEach((rowNum) => {
          const row = ws.getRow(rowNum);
          row.alignment = { horizontal: "left", vertical: "middle" };
          row.font = { name: "Segoe UI", size: 10, color: { argb: "595959" } };
        });

        ws.getRow(1).font = {
          name: "Segoe UI",
          size: 12,
          bold: true,
          color: { argb: PALETTE.primaryDark },
        };
        ws.getRow(2).font = {
          name: "Segoe UI",
          size: 14,
          bold: true,
          color: { argb: "000000" },
        };
        ws.getRow(3).font = {
          name: "Segoe UI",
          size: 10,
          italic: true,
          color: { argb: "7F7F7F" },
        };

        ws.addRow([]); // Jarak baris 4 kosong
      };

      const addSignatures = (ws: ExcelJS.Worksheet, startRow: number) => {
        ws.addRow([]);
        const cleanStart = startRow + 1;

        ws.getCell(`A${cleanStart}`).value =
          `Depok, ${moment().format("DD MMMM YYYY")}`;
        ws.getCell(`A${cleanStart}`).font = {
          name: "Segoe UI",
          size: 10,
          italic: true,
          color: { argb: "595959" },
        };

        ws.getCell(`A${cleanStart + 1}`).value = "Disiapkan Oleh,";
        ws.getCell(`D${cleanStart + 1}`).value = "Diperiksa Oleh,";
        ws.getCell(`F${cleanStart + 1}`).value = "Disetujui Oleh,";

        const signHeaderRow = ws.getRow(cleanStart + 1);
        signHeaderRow.font = {
          name: "Segoe UI",
          size: 10,
          bold: true,
          color: { argb: "333333" },
        };

        ws.getCell(`A${cleanStart + 5}`).value = "Leony";
        ws.getCell(`A${cleanStart + 6}`).value = "Admin Kredit";
        ws.getCell(`D${cleanStart + 5}`).value = "Komang Gd Ariawan";
        ws.getCell(`D${cleanStart + 6}`).value = "Head Bisnis";
        ws.getCell(`F${cleanStart + 5}`).value = "Ketut Sugiata";
        ws.getCell(`F${cleanStart + 6}`).value = "Direktur Utama";

        for (let i = 5; i <= 6; i++) {
          const r = ws.getRow(cleanStart + i);
          r.font = { name: "Segoe UI", size: 10, bold: i === 5 };
          if (i === 5) r.font.underline = true;
        }
      };

      const autoFitColumns = (ws: ExcelJS.Worksheet) => {
        ws.columns.forEach((column) => {
          let maxLen = 14;
          column.eachCell?.({ includeEmpty: true }, (cell) => {
            if (Number(cell.row) > 4 && cell.value) {
              const len = cell.value.toString().length;
              if (len > maxLen) maxLen = len;
            }
          });
          column.width = maxLen + 5;
        });
      };

      // ==========================================
      // SHEET 1: KOLEKTIBILITAS BERDASARKAN INSTANSI
      // ==========================================
      const ws1 = workbook.addWorksheet("NPL Instansi");
      applyWorksheetConfig(ws1);
      addBprHeader(ws1, "LAPORAN POSISI KOLEKTIBILITAS PINJAMAN", 7);

      ws1.getCell("A5").value = "I. KOLEKTIBILITAS BERDASARKAN INSTANSI";
      ws1.getCell("A5").font = {
        name: "Segoe UI",
        size: 11,
        bold: true,
        color: { argb: PALETTE.primaryDark },
      };

      const hRow1 = ws1.getRow(6);
      hRow1.values = [
        "No",
        "Instansi / Mitra Kerja",
        "Kol",
        "Debitur",
        "Sisa Pokok (OS)",
        "Angsuran Wajib",
        "NPL Gross",
      ];
      hRow1.font = {
        name: "Segoe UI",
        size: 10,
        bold: true,
        color: { argb: "FFFFFF" },
      };
      hRow1.alignment = { horizontal: "center", vertical: "middle" };
      hRow1.eachCell(
        (c) =>
          (c.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: PALETTE.primaryDark },
          }),
      );

      let currentRow = 7;
      let tDeb1 = 0,
        tSisa1 = 0,
        tAngs1 = 0,
        tTunggakanPkk1 = 0;

      instansiData.forEach((d, idx) => {
        const r = ws1.addRow([
          d.no,
          d.instansi,
          1,
          d.deb,
          d.sisaPokok,
          d.angsuran,
          d.nplGross / 100,
        ]);
        r.height = 20;
        r.alignment = { vertical: "middle" };
        r.getCell(1).alignment = { horizontal: "center" };
        r.getCell(3).alignment = { horizontal: "center" };
        r.getCell(4).alignment = { horizontal: "center" };
        r.getCell(5).numFmt = "#,##0";
        r.getCell(6).numFmt = "#,##0";
        r.getCell(7).numFmt = "0.00%";

        if (idx % 2 === 1) {
          r.eachCell(
            (c) =>
              (c.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: PALETTE.zebraEven },
              }),
          );
        }

        if (d.nplGross > 5) {
          r.getCell(7).font = { color: { argb: "9C0006" }, bold: true };
        }

        tDeb1 += d.deb;
        tSisa1 += d.sisaPokok;
        tAngs1 += d.angsuran;
        tTunggakanPkk1 += d.tunggakanPokok;
        currentRow++;
      });

      const globalNplGross1 = tSisa1 > 0 ? tTunggakanPkk1 / tSisa1 : 0;

      const totalRow1 = ws1.addRow([
        "GRAND TOTAL KONSOLIDASI",
        "",
        "",
        tDeb1,
        tSisa1,
        tAngs1,
        globalNplGross1,
      ]);
      ws1.mergeCells(currentRow, 1, currentRow, 3);
      totalRow1.height = 22;
      totalRow1.font = { name: "Segoe UI", size: 10, bold: true };
      totalRow1.alignment = { vertical: "middle" };
      totalRow1.getCell(4).alignment = { horizontal: "center" };
      totalRow1.getCell(5).numFmt = "#,##0";
      totalRow1.getCell(6).numFmt = "#,##0";
      totalRow1.getCell(7).numFmt = "0.00%";
      totalRow1.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: PALETTE.accentTotal },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "000000" } },
          bottom: { style: "double", color: { argb: "000000" } },
        };
      });

      applyCellBorders(ws1, 6, currentRow - 1, 7);
      autoFitColumns(ws1);
      addSignatures(ws1, currentRow + 1);

      // ==========================================
      // SHEET 2: KOLEKTIBILITAS BERDASARKAN SEGMENTASI
      // ==========================================
      const ws2 = workbook.addWorksheet("NPL Segmentasi");
      applyWorksheetConfig(ws2);
      addBprHeader(ws2, "LAPORAN POSISI KOLEKTIBILITAS PINJAMAN", 7);

      ws2.getCell("A5").value =
        "II. KOLEKTIBILITAS BERDASARKAN SEGMENTASI KREDIT";
      ws2.getCell("A5").font = {
        name: "Segoe UI",
        size: 11,
        bold: true,
        color: { argb: PALETTE.primaryDark },
      };

      const hRow2 = ws2.getRow(6);
      hRow2.values = [
        "No",
        "Segmen / Skema Kredit",
        "Kol",
        "Debitur",
        "Sisa Pokok (OS)",
        "Angsuran Wajib",
        "NPL Gross",
      ];
      hRow2.font = {
        name: "Segoe UI",
        size: 10,
        bold: true,
        color: { argb: "FFFFFF" },
      };
      hRow2.alignment = { horizontal: "center", vertical: "middle" };
      hRow2.eachCell(
        (c) =>
          (c.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: PALETTE.primaryDark },
          }),
      );

      currentRow = 7;
      let tDeb2 = 0,
        tSisa2 = 0,
        tAngs2 = 0,
        tTunggakanPkk2 = 0;

      segmentData.forEach((d, idx) => {
        const r = ws2.addRow([
          d.no,
          d.segmen,
          1,
          d.deb,
          d.sisaPokok,
          d.angsuran,
          d.nplGross / 100,
        ]);
        r.height = 20;
        r.alignment = { vertical: "middle" };
        r.getCell(1).alignment = { horizontal: "center" };
        r.getCell(3).alignment = { horizontal: "center" };
        r.getCell(4).alignment = { horizontal: "center" };
        r.getCell(5).numFmt = "#,##0";
        r.getCell(6).numFmt = "#,##0";
        r.getCell(7).numFmt = "0.00%";

        if (idx % 2 === 1)
          r.eachCell(
            (c) =>
              (c.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: PALETTE.zebraEven },
              }),
          );

        tDeb2 += d.deb;
        tSisa2 += d.sisaPokok;
        tAngs2 += d.angsuran;
        tTunggakanPkk2 += d.tunggakanPokok;
        currentRow++;
      });

      const globalNplGross2 = tSisa2 > 0 ? tTunggakanPkk2 / tSisa2 : 0;

      const totalRow2 = ws2.addRow([
        "GRAND TOTAL KONSOLIDASI",
        "",
        "",
        tDeb2,
        tSisa2,
        tAngs2,
        globalNplGross2,
      ]);
      ws2.mergeCells(currentRow, 1, currentRow, 3);
      totalRow2.height = 22;
      totalRow2.font = { name: "Segoe UI", size: 10, bold: true };
      totalRow2.getCell(4).alignment = { horizontal: "center" };
      totalRow2.getCell(5).numFmt = "#,##0";
      totalRow2.getCell(6).numFmt = "#,##0";
      totalRow2.getCell(7).numFmt = "0.00%";
      totalRow2.eachCell((c) => {
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: PALETTE.accentTotal },
        };
        c.border = {
          top: { style: "thin", color: { argb: "000000" } },
          bottom: { style: "double", color: { argb: "000000" } },
        };
      });

      applyCellBorders(ws2, 6, currentRow - 1, 7);
      autoFitColumns(ws2);
      addSignatures(ws2, currentRow + 1);

      // ==========================================
      // SHEET 3: POSISI KREDIT BERDASARKAN INSTANSI (PKS)
      // ==========================================
      const ws3 = workbook.addWorksheet("Posisi Instansi");
      applyWorksheetConfig(ws3);
      addBprHeader(ws3, "LAPORAN POSISI SALDO OUTSTANDING KREDIT", 6);

      ws3.getCell("A5").value = "III. POSISI KREDIT BERDASARKAN INSTANSI (PKS)";
      ws3.getCell("A5").font = {
        name: "Segoe UI",
        size: 11,
        bold: true,
        color: { argb: PALETTE.primaryDark },
      };

      const hRow3 = ws3.getRow(6);
      hRow3.values = [
        "No",
        "NAMA MITRA INSTANSI",
        "TOTAL DEB",
        "SISA POKOK (OS)",
        "ANGSURAN BULANAN",
        "MARKET SHARE (%)",
      ];
      hRow3.font = {
        name: "Segoe UI",
        size: 10,
        bold: true,
        color: { argb: "FFFFFF" },
      };
      hRow3.alignment = { horizontal: "center", vertical: "middle" };
      hRow3.eachCell(
        (c) =>
          (c.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "4F81BD" },
          }),
      );

      currentRow = 7;
      instansiData.forEach((d, idx) => {
        const share = tSisa1 > 0 ? d.sisaPokok / tSisa1 : 0;
        const r = ws3.addRow([
          d.no,
          d.instansi,
          d.deb,
          d.sisaPokok,
          d.angsuran,
          share,
        ]);
        r.height = 20;
        r.alignment = { vertical: "middle" };
        r.getCell(1).alignment = { horizontal: "center" };
        r.getCell(3).alignment = { horizontal: "center" };
        r.getCell(4).numFmt = "#,##0";
        r.getCell(5).numFmt = "#,##0";
        r.getCell(6).numFmt = "0.00%";
        if (idx % 2 === 1)
          r.eachCell(
            (c) =>
              (c.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: PALETTE.zebraEven },
              }),
          );
        currentRow++;
      });

      const totalRow3 = ws3.addRow([
        "TOTAL PORTOFOLIO",
        "",
        tDeb1,
        tSisa1,
        tAngs1,
        1.0,
      ]);
      ws3.mergeCells(currentRow, 1, currentRow, 2);
      totalRow3.font = { name: "Segoe UI", size: 10, bold: true };
      totalRow3.getCell(3).alignment = { horizontal: "center" };
      totalRow3.getCell(4).numFmt = "#,##0";
      totalRow3.getCell(5).numFmt = "#,##0";
      totalRow3.getCell(6).numFmt = "0.00%";
      totalRow3.eachCell((c) => {
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "DCE6F1" },
        };
        c.border = {
          top: { style: "thin", color: { argb: "000000" } },
          bottom: { style: "double", color: { argb: "000000" } },
        };
      });

      applyCellBorders(ws3, 6, currentRow - 1, 6);
      autoFitColumns(ws3);
      addSignatures(ws3, currentRow + 1);

      // ==========================================
      // SHEET 4: POSISI KREDIT BERDASARKAN SEGMEN PEMASARAN
      // ==========================================
      const ws4 = workbook.addWorksheet("Posisi Segmentasi");
      applyWorksheetConfig(ws4);
      addBprHeader(ws4, "LAPORAN SEGMEN DISTRIBUSI PEMASARAN", 6);

      ws4.getCell("A5").value =
        "IV. POSISI KREDIT BERDASARKAN SEGMEN PEMASARAN";
      ws4.getCell("A5").font = {
        name: "Segoe UI",
        size: 11,
        bold: true,
        color: { argb: PALETTE.primaryDark },
      };

      const hRow4 = ws4.getRow(6);
      hRow4.values = [
        "No",
        "SEGMEN PRODUK",
        "TOTAL DEB",
        "OS PINJAMAN",
        "BEBAN ANGSURAN",
        "SHARE (%)",
      ];
      hRow4.font = {
        name: "Segoe UI",
        size: 10,
        bold: true,
        color: { argb: "FFFFFF" },
      };
      hRow4.alignment = { horizontal: "center", vertical: "middle" };
      hRow4.eachCell(
        (c) =>
          (c.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "4F81BD" },
          }),
      );

      currentRow = 7;
      segmentData.forEach((d, idx) => {
        const share = tSisa2 > 0 ? d.sisaPokok / tSisa2 : 0;
        const r = ws4.addRow([
          d.no,
          d.segmen,
          d.deb,
          d.sisaPokok,
          d.angsuran,
          share,
        ]);
        r.height = 20;
        r.alignment = { vertical: "middle" };
        r.getCell(1).alignment = { horizontal: "center" };
        r.getCell(3).alignment = { horizontal: "center" };
        r.getCell(4).numFmt = "#,##0";
        r.getCell(5).numFmt = "#,##0";
        r.getCell(6).numFmt = "0.00%";
        if (idx % 2 === 1)
          r.eachCell(
            (c) =>
              (c.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: PALETTE.zebraEven },
              }),
          );
        currentRow++;
      });

      const totalRow4 = ws4.addRow([
        "TOTAL PORTOFOLIO",
        "",
        tDeb2,
        tSisa2,
        tAngs2,
        1.0,
      ]);
      ws4.mergeCells(currentRow, 1, currentRow, 2);
      totalRow4.font = { name: "Segoe UI", size: 10, bold: true };
      totalRow4.getCell(3).alignment = { horizontal: "center" };
      totalRow4.getCell(4).numFmt = "#,##0";
      totalRow4.getCell(5).numFmt = "#,##0";
      totalRow4.getCell(6).numFmt = "0.00%";
      totalRow4.eachCell((c) => {
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "DCE6F1" },
        };
        c.border = {
          top: { style: "thin", color: { argb: "000000" } },
          bottom: { style: "double", color: { argb: "000000" } },
        };
      });

      applyCellBorders(ws4, 6, currentRow - 1, 6);
      autoFitColumns(ws4);
      addSignatures(ws4, currentRow + 1);

      // ==========================================
      // SHEET 5: POSISI TAGIHAN & SISA TAGIHAN
      // ==========================================
      const ws5 = workbook.addWorksheet("Lap Rekap Tagihan");
      applyWorksheetConfig(ws5);
      addBprHeader(ws5, "LAPORAN POSISI KREDIT", 11);

      ws5.getCell("A5").value = "V. POSISI TAGIHAN BERDASARKAN INSTANSI";
      ws5.getCell("A5").font = {
        name: "Segoe UI",
        size: 11,
        bold: true,
        color: { argb: PALETTE.primaryDark },
      };

      ws5.mergeCells(6, 1, 7, 1);
      ws5.getCell("A6").value = "No";
      ws5.mergeCells(6, 2, 7, 2);
      ws5.getCell("B6").value = "INSTANSI / MITRA";
      ws5.mergeCells(6, 3, 7, 3);
      ws5.getCell("C6").value = "DEB";
      ws5.mergeCells(6, 4, 7, 4);
      ws5.getCell("D6").value = "SISA POKOK";
      ws5.mergeCells(6, 5, 7, 5);
      ws5.getCell("E6").value = "TAGIHAN TARGET";

      ws5.mergeCells(6, 6, 6, 8);
      ws5.getCell("F6").value = "REALISASI BAYAR";
      ws5.getCell("F7").value = "DEB";
      ws5.getCell("G7").value = "NOMINAL";
      ws5.getCell("H7").value = "% / EFF";

      ws5.mergeCells(6, 9, 6, 11);
      ws5.getCell("I6").value = "SISA TUNGGAKAN";
      ws5.getCell("I7").value = "DEB";
      ws5.getCell("J7").value = "NOMINAL";
      ws5.getCell("K7").value = "% OB";

      [6, 7].forEach((rowNum) => {
        const row = ws5.getRow(rowNum);
        row.font = {
          name: "Segoe UI",
          size: 9,
          bold: true,
          color: { argb: "FFFFFF" },
        };
        row.alignment = { horizontal: "center", vertical: "middle" };
        for (let c = 1; c <= 11; c++) {
          row.getCell(c).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: PALETTE.primaryDark },
          };
        }
      });
      for (let c = 1; c <= 11; c++) {
        ws5.getCell(7, c).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "2F5597" },
        };
      }

      currentRow = 8;
      let tRealizTotal = 0;

      instansiData.forEach((d, idx) => {
        const sisaTunggakan = d.angsuran - d.realisasi;
        const pctBayar = d.angsuran > 0 ? d.realisasi / d.angsuran : 0;
        const pctSisa = d.angsuran > 0 ? sisaTunggakan / d.angsuran : 0;
        tRealizTotal += d.realisasi;

        const r = ws5.addRow([
          d.no,
          d.instansi,
          d.deb,
          d.sisaPokok,
          d.angsuran,
          d.realisasi > 0 ? d.deb : 0,
          d.realisasi,
          pctBayar,
          sisaTunggakan > 0 ? d.deb : 0,
          sisaTunggakan,
          pctSisa,
        ]);
        r.height = 20;
        r.alignment = { vertical: "middle" };
        r.getCell(1).alignment = { horizontal: "center" };
        r.getCell(3).alignment = { horizontal: "center" };
        r.getCell(6).alignment = { horizontal: "center" };
        r.getCell(9).alignment = { horizontal: "center" };
        [4, 5, 7, 10].forEach((idx) => (r.getCell(idx).numFmt = "#,##0"));
        [8, 11].forEach((idx) => (r.getCell(idx).numFmt = "0.00%"));

        if (idx % 2 === 1)
          r.eachCell(
            (c) =>
              (c.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: PALETTE.zebraEven },
              }),
          );
        currentRow++;
      });

      const totalSisaPokokSemua = tAngs1 - tRealizTotal;
      const totalRow5 = ws5.addRow([
        "TOTAL KONSOLIDASI TAGIHAN",
        "",
        tDeb1,
        tSisa1,
        tAngs1,
        tDeb1,
        tRealizTotal,
        tAngs1 > 0 ? tRealizTotal / tAngs1 : 0,
        tDeb1,
        totalSisaPokokSemua,
        tAngs1 > 0 ? totalSisaPokokSemua / tAngs1 : 0,
      ]);
      ws5.mergeCells(currentRow, 1, currentRow, 2);
      totalRow5.height = 22;
      totalRow5.font = { name: "Segoe UI", size: 10, bold: true };
      [4, 5, 7, 10].forEach((idx) => (totalRow5.getCell(idx).numFmt = "#,##0"));
      [8, 11].forEach((idx) => (totalRow5.getCell(idx).numFmt = "0.00%"));
      totalRow5.eachCell((c) => {
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: PALETTE.accentTotal },
        };
        c.border = {
          top: { style: "thin", color: { argb: "000000" } },
          bottom: { style: "double", color: { argb: "000000" } },
        };
      });

      applyCellBorders(ws5, 6, currentRow - 1, 11);
      autoFitColumns(ws5);
      addSignatures(ws5, currentRow + 1);

      // ==========================================
      // DISPATCHING FILES VIA BROWSER
      // ==========================================
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Laporan_Eksekutif_Kolektibilitas_Kredit_${periodeTeks}.xlsx`;

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      message.success("Berkas Excel Premium BPR Hasamitra siap dibuka!");
    } catch (err) {
      console.error(err);
      message.error("Gagal menyusun workbook internal ExcelJS.");
    }
  };

  // 1. Pemetaan Data Tabel Berdasarkan Segmentasi Produk
  const getSegmentasiProdukData = () => {
    const produkMap: { [key: string]: any } = {};

    dashboardData.forEach((mitra) => {
      mitra.Billing?.forEach((bill: any) => {
        const productName =
          bill.Submission?.Product?.name || "Produk Tidak Diketahui";

        if (!produkMap[productName]) {
          produkMap[productName] = {
            key: productName,
            productName: productName,
            totalPlafond: 0,
            totalTagihan: 0,
            totalRealisasi: 0,
            totalTunggakan: 0,
            countTransaksi: 0,
          };
        }

        produkMap[productName].totalPlafond += bill.plafond || 0;
        produkMap[productName].totalTagihan += bill.value || 0;
        produkMap[productName].totalRealisasi += bill.realize_value || 0;
        produkMap[productName].totalTunggakan +=
          (bill.tung_pkk || 0) + (bill.tung_bga || 0);
        produkMap[productName].countTransaksi += 1;
      });
    });

    return Object.values(produkMap);
  };

  // 2. Pemetaan Data Tabel Berdasarkan Analisis Mitra (Fitur Baru)
  const getAnalisisMitraData = () => {
    return dashboardData.map((mitra) => {
      let totalPlafond = 0;
      let totalTagihan = 0;
      let totalRealisasi = 0;
      let totalTunggakanPokok = 0;
      let totalTunggakan = 0;
      let countTransaksi = 0;

      mitra.Billing?.forEach((bill: any) => {
        totalPlafond += bill.plafond || 0;
        totalTagihan += bill.value || 0;
        totalRealisasi += bill.realize_value || 0;
        totalTunggakanPokok += bill.tung_pkk || 0;
        totalTunggakan += (bill.tung_pkk || 0) + (bill.tung_bga || 0);
        countTransaksi += 1;
      });

      const nplMitra =
        totalPlafond > 0 ? (totalTunggakanPokok / totalPlafond) * 100 : 0;

      return {
        key: mitra.id,
        mitraName: mitra.name || "Tanpa Nama",
        code: mitra.code || "-",
        countTransaksi,
        totalPlafond,
        totalTagihan,
        totalRealisasi,
        totalTunggakan,
        nplMitra: parseFloat(nplMitra.toFixed(2)),
      };
    });
  };

  // Kolom Tabel Segmentasi Produk
  const productColumns = [
    {
      title: "Nama Produk Kredit",
      dataIndex: "productName",
      key: "productName",
      render: (text: string) => (
        <Text strong>
          <AppstoreOutlined /> {text}
        </Text>
      ),
    },
    {
      title: "Volume",
      dataIndex: "countTransaksi",
      key: "countTransaksi",
      align: "center" as const,
      render: (val: number) => <Tag color="blue">{val} Kontrak</Tag>,
    },
    {
      title: "Total Plafond",
      dataIndex: "totalPlafond",
      key: "totalPlafond",
      render: formatRupiah,
    },
    {
      title: "Total Tagihan",
      dataIndex: "totalTagihan",
      key: "totalTagihan",
      render: formatRupiah,
    },
    {
      title: "Total Realisasi",
      dataIndex: "totalRealisasi",
      key: "totalRealisasi",
      render: formatRupiah,
    },
    {
      title: "Total Tunggakan",
      dataIndex: "totalTunggakan",
      key: "totalTunggakan",
      render: (val: number) => (
        <Text type={val > 0 ? "danger" : "secondary"} strong>
          {formatRupiah(val)}
        </Text>
      ),
    },
    {
      title: "Collection Rate",
      key: "rate",
      align: "center" as const,
      render: (record: any) => {
        const rate =
          record.totalTagihan > 0
            ? (record.totalRealisasi / record.totalTagihan) * 100
            : 0;
        return (
          <Progress
            percent={parseFloat(rate.toFixed(1))}
            size="small"
            status={
              rate >= 90 ? "success" : rate >= 75 ? "normal" : "exception"
            }
          />
        );
      },
    },
  ];

  // Kolom Tabel Segmentasi Mitra (Fitur Baru)
  const mitraColumns = [
    {
      title: "Nama Mitra",
      key: "mitraName",
      render: (record: any) => (
        <div>
          <Text strong>
            <TeamOutlined /> {record.mitraName}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Kode: {record.code}
          </Text>
        </div>
      ),
    },
    {
      title: "Volume Transaksi",
      dataIndex: "countTransaksi",
      key: "countTransaksi",
      align: "center" as const,
      render: (val: number) => <Tag color="purple">{val} Transaksi</Tag>,
    },
    {
      title: "Plafond Disalurkan",
      dataIndex: "totalPlafond",
      key: "totalPlafond",
      render: formatRupiah,
    },
    {
      title: "Target Tagihan",
      dataIndex: "totalTagihan",
      key: "totalTagihan",
      render: formatRupiah,
    },
    {
      title: "Jumlah Realisasi",
      dataIndex: "totalRealisasi",
      key: "totalRealisasi",
      render: formatRupiah,
    },
    {
      title: "Total Tunggakan",
      dataIndex: "totalTunggakan",
      key: "totalTunggakan",
      render: (val: number) => (
        <Text type={val > 0 ? "danger" : "secondary"} strong>
          {formatRupiah(val)}
        </Text>
      ),
    },
    {
      title: "Rasio NPL Mitra",
      dataIndex: "nplMitra",
      key: "nplMitra",
      align: "center" as const,
      sorter: (a: any, b: any) => a.nplMitra - b.nplMitra,
      render: (npl: number) => {
        let color = "green";
        if (npl >= 2 && npl <= 5) color = "orange";
        if (npl > 5) color = "red";
        return (
          <Tag color={color} style={{ fontWeight: "bold" }}>
            {npl}% NPL
          </Tag>
        );
      },
    },
    {
      title: "Efektivitas Setoran",
      key: "mitraRate",
      width: 150,
      render: (record: any) => {
        const rate =
          record.totalTagihan > 0
            ? (record.totalRealisasi / record.totalTagihan) * 100
            : 0;
        return (
          <Space direction="vertical" size={0} style={{ width: "100%" }}>
            <Progress
              percent={parseFloat(rate.toFixed(1))}
              size="small"
              status={rate >= 90 ? "success" : "normal"}
            />
          </Space>
        );
      },
    },
  ];

  const getNplColor = (npl: number) => {
    if (npl < 2) return "#52c41a";
    if (npl <= 5) return "#faad14";
    return "#f5222d";
  };

  return (
    <div style={{ background: "#f5f7fa", minHeight: "100vh" }}>
      {/* Header Dashboard */}
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: "24px" }}
      >
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            💼 Dashboard Eksekutif Portofolio Kredit
          </Title>
          <Text type="secondary">
            Kombinasi data efektivitas billing dan matriks risiko mitra tanpa
            grafik kompleks.
          </Text>
        </Col>
        <Col>
          {/* <Space direction="vertical" size={2}>
            <Text strong>Pilih Periode Laporan:</Text>
            <DatePicker
              picker="month"
              onChange={(_date, datestr) => setSelectedMonth(datestr as string)}
              allowClear={true}
              placeholder="Semua Periode"
              style={{ width: 200 }}
            />
          </Space> */}
          <Space size={12}>
            <DatePicker
              picker="month"
              onChange={(_date, datestr) => setSelectedMonth(datestr as string)}
              allowClear={true}
              placeholder="Pilih Periode"
              style={{ width: 160 }}
            />
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={handleExportExcel5Sheets}
              style={{ backgroundColor: "#217346", borderColor: "#217346" }}
            >
              Export ExcelJS (5 Sheet)
            </Button>
            <Button
              type="default"
              icon={<PrinterOutlined />}
              onClick={() =>
                printKredit(
                  {
                    instansiData: getInstansiBaseData(),
                    segmentData: getSegmentasiBaseData(),
                  },
                  selectedMonth,
                )
              }
            >
              Cetak PDF / Print
            </Button>
          </Space>
        </Col>
      </Row>

      <Spin spinning={loading} tip="Memuat Analisis Laporan...">
        {/* Row 1: KPI Angka Utama */}
        <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderTop: "4px solid #1890ff" }}>
              <Statistic
                title="Total Plafond Kredit"
                value={summary.totalPlafond}
                formatter={(v) => formatRupiah(v as number)}
                prefix={<DollarOutlined style={{ color: "#1890ff" }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderTop: "4px solid #faad14" }}>
              <Statistic
                title="Total Nilai Tagihan"
                value={summary.totalValue}
                formatter={(v) => formatRupiah(v as number)}
                prefix={<FileTextOutlined style={{ color: "#faad14" }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderTop: "4px solid #52c41a" }}>
              <Statistic
                title="Total Realisasi Penagihan"
                value={summary.totalRealize}
                formatter={(v) => formatRupiah(v as number)}
                prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderTop: "4px solid #f5222d" }}>
              <Statistic
                title="Total Nilai Tunggakan"
                value={summary.totalTunggakan}
                formatter={(v) => formatRupiah(v as number)}
                prefix={<WarningOutlined style={{ color: "#f5222d" }} />}
              />
            </Card>
          </Col>
        </Row>

        {/* Row 2: Visual Lingkaran Efektivitas */}
        <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
          <Col xs={24} md={12}>
            <Card
              title="🎯 Rasio Efektivitas Penagihan (Collection Rate)"
              bordered={false}
            >
              <Row align="middle" justify="space-around">
                <Col>
                  <Progress
                    type="dashboard"
                    percent={summary.collectionRate}
                    strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }}
                    width={120}
                  />
                </Col>
                <Col>
                  <div style={{ maxWidth: 220 }}>
                    <Statistic
                      title="Berhasil Direalisasi"
                      value={summary.collectionRate}
                      precision={2}
                      suffix="%"
                      valueStyle={{ color: "#3f8600" }}
                      prefix={<ArrowUpOutlined />}
                    />
                    <p
                      style={{
                        marginTop: 8,
                        color: "#8c8c8c",
                        fontSize: "12px",
                      }}
                    >
                      Persentase dana tagihan aktif yang sukses disetor kembali
                      oleh seluruh mitra.
                    </p>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              title="⚠️ Analisis Tingkat Risiko Kredit (NPL Gross)"
              bordered={false}
            >
              <Row align="middle" justify="space-around">
                <Col>
                  <Progress
                    type="dashboard"
                    percent={summary.nplPercentage}
                    status={summary.nplPercentage > 5 ? "exception" : "normal"}
                    strokeColor={getNplColor(summary.nplPercentage)}
                    width={120}
                  />
                </Col>
                <Col>
                  <div style={{ maxWidth: 220 }}>
                    <Statistic
                      title="Rasio NPL Saat Ini"
                      value={summary.nplPercentage}
                      precision={2}
                      suffix="%"
                      valueStyle={{ color: getNplColor(summary.nplPercentage) }}
                      prefix={
                        summary.nplPercentage > 5 ? (
                          <ArrowUpOutlined />
                        ) : (
                          <ArrowDownOutlined />
                        )
                      }
                    />
                    <div style={{ marginTop: 4 }}>
                      {summary.nplPercentage < 2 && (
                        <Tag color="green">AMAN (SEHAT)</Tag>
                      )}
                      {summary.nplPercentage >= 2 &&
                        summary.nplPercentage <= 5 && (
                          <Tag color="warning">WASWADA</Tag>
                        )}
                      {summary.nplPercentage > 5 && (
                        <Tag color="error">CRITICAL</Tag>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Row 3: Pengganti Chart Utama dengan Sistem Tab Konten Komparasi Data */}
        <Card bordered={false} style={{ padding: "4px" }}>
          <Tabs defaultActiveKey="1" type="card">
            <Tabs.TabPane
              tab={
                <span>
                  <TeamOutlined /> Analisis Performa Per Mitra
                </span>
              }
              key="1"
            >
              <div style={{ padding: "8px 0" }}>
                <Table
                  dataSource={getAnalisisMitraData()}
                  columns={mitraColumns}
                  // pagination={{ pageSize: 5 }}
                  scroll={{ x: 1000 }}
                  size="small"
                />
              </div>
            </Tabs.TabPane>

            <Tabs.TabPane
              tab={
                <span>
                  <AppstoreOutlined /> Segmentasi Per Jenis Produk
                </span>
              }
              key="2"
            >
              <div style={{ padding: "8px 0" }}>
                <Table
                  dataSource={getSegmentasiProdukData()}
                  columns={productColumns}
                  // pagination={{ pageSize: 5 }}
                  scroll={{ x: 1000 }}
                  size="small"
                />
              </div>
            </Tabs.TabPane>
          </Tabs>
        </Card>
      </Spin>
    </div>
  );
}
