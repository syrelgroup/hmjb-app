import moment from "moment";
import type { IVisit } from "../../../libs/interface";
import { IDRFormat } from "../utilForm";

moment.locale("id");

const generate = (records: IVisit[], period: string, stats: any) => {
  const tableRows = records
    .map(
      (d, idx) => `
    <tr class="border-b border-gray-300">
      <td class="border border-gray-300 p-2 text-center">${idx + 1}</td>
      <td class="border border-gray-300 p-2">${moment(d.date_action || d.date_plan).format("DD/MM/YYYY")}</td>
      <td class="border border-gray-300 p-2">${d.Debitur?.fullname || "-"}</td>
      <td class="border border-gray-300 p-2 text-right">${IDRFormat(d.value || 0)}</td>
      <td class="border border-gray-300 p-2 text-right">${IDRFormat(d.realize_value || 0)}</td>
      <td class="border border-gray-300 p-2">${d.VisitStatus?.name || "-"}</td>
      <td class="border border-gray-300 p-2">${d.VisitPurpose?.name || "-"}</td>
      <td class="border border-gray-300 p-2">${d.VisitCategory?.name || "-"}</td>
      <td class="border border-gray-300 p-2">${d.Submission?.Mitra?.name || "-"}</td>
      <td class="border border-gray-300 p-2">${d.User?.fullname || "-"}</td>
    </tr>
  `,
    )
    .join("");

  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Laporan Kunjungan Kredit</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 10mm;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 11px;
          color: #333;
          margin: 0;
          padding: 0;
        }

        .container {
          width: 100%;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }

        .header h1 {
          margin: 0;
          font-size: 16px;
          font-weight: bold;
        }

        .header p {
          margin: 5px 0 0 0;
          font-size: 11px;
          color: #666;
        }

        .info-box {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          font-size: 10px;
        }

        .info-item {
          flex: 1;
        }

        .info-label {
          font-weight: bold;
          color: #555;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }

        th {
          background-color: #4472c4;
          color: white;
          padding: 8px;
          text-align: left;
          font-weight: bold;
          border: 1px solid #333;
          font-size: 10px;
        }

        td {
          padding: 6px 8px;
          border: 1px solid #999;
        }

        tr:nth-child(even) {
          background-color: #f9f9f9;
        }

        .text-right {
          text-align: right;
        }

        .text-center {
          text-align: center;
        }

        .summary {
          margin: 20px 0;
          page-break-inside: avoid;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }

        .summary-item {
          padding: 10px;
          border: 1px solid #ddd;
          background-color: #f5f5f5;
          border-radius: 4px;
        }

        .summary-label {
          font-size: 10px;
          color: #666;
          margin-bottom: 5px;
        }

        .summary-value {
          font-size: 14px;
          font-weight: bold;
          color: #000;
        }

        .footer {
          margin-top: 30px;
          display: flex;
          justify-content: flex-end;
          font-size: 10px;
          text-align: center;
        }

        .signature {
          width: 150px;
        }

        .signature-line {
          border-top: 1px solid #000;
          margin-top: 40px;
          padding-top: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        {/* Header */}
        <div class="header">
          <h1>LAPORAN KUNJUNGAN KREDIT</h1>
          <p>Periode: ${period}</p>
          <p>Tanggal Cetak: ${moment().format("DD MMMM YYYY HH:mm")}</p>
        </div>

        {/* Summary Statistics */}
        <div class="summary">
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Total Kunjungan</div>
              <div class="summary-value">${stats.totalKunjungan}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Nominal Tagihan</div>
              <div class="summary-value">Rp ${IDRFormat(stats.totalNominal)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Tertagih</div>
              <div class="summary-value">Rp ${IDRFormat(stats.totalTertagih)}</div>
            </div>
          </div>
        </div>

        {/* Detail Table */}
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">No</th>
              <th style="width: 8%;">Tanggal</th>
              <th style="width: 12%;">Debitur</th>
              <th style="width: 10%;">Nominal Tagihan</th>
              <th style="width: 10%;">Tertagih</th>
              <th style="width: 8%;">Status</th>
              <th style="width: 8%;">Tujuan</th>
              <th style="width: 8%;">Kategori</th>
              <th style="width: 10%;">Mitra</th>
              <th style="width: 15%;">Petugas</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
          <tfoot>
            <tr style="background-color: #e7e6e6; font-weight: bold;">
              <td colspan="3" class="text-right">TOTAL</td>
              <td class="text-right">Rp ${IDRFormat(stats.totalNominal)}</td>
              <td class="text-right">Rp ${IDRFormat(stats.totalTertagih)}</td>
              <td colspan="5"></td>
            </tr>
          </tfoot>
        </table>

        {/* Footer */}
        <div class="footer">
          <div class="signature">
            <p>Dikeluarkan oleh:</p>
            <div class="signature-line">Pengelola Sistem</div>
          </div>
        </div>
      </div>
    </body>
  </html>
  `;

  return html;
};

export const generateCallreportPDF = (
  records: IVisit[],
  period: string,
  stats: any,
) => {
  const htmlContent = generate(records, period, stats);

  const w = window.open("", "_blank");
  if (!w) {
    alert("Popup diblokir. Mohon izinkan popup dari browser Anda.");
    return;
  }

  w.document.open();
  w.document.write(htmlContent);
  w.document.close();
  w.onload = function () {
    setTimeout(() => {
      w.print();
    }, 250);
  };
};
