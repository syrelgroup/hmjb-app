import moment from "moment";
import type { IUser } from "../../../libs/interface";
import { calculatePayroll } from "../libs";
import { IDRFormat } from "../utilForm";

moment.locale("id");

const generate = (record: IUser) => {
  const temp = calculatePayroll(record);

  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }

        html, body {
          height: 100%;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 13px;
          color: #333333;
        }

        .slip-container {
          border: 1px solid #e2e8f0;
          padding: 24px;
          border-radius: 8px;
          max-width: 800px;
          margin: 0 auto;
        }

        /* Pemisah halaman jika dicetak banyak */
        .page-break {
          page-break-before: always;
          break-before: page;
          display: block;
          height: 0;
          border: none;
        }
      </style>
    </head>
    <body class="bg-gray-50 py-8 px-4">

    <div class="slip-container bg-white shadow-sm">
      <!-- HEADER SLIP -->
      <div class="text-center border-b-2 border-gray-800 pb-4 mb-6">
        <h1 class="text-xl font-bold tracking-wide text-gray-900">REKAP GAJI BULANAN</h1>
        <p class="text-sm text-gray-600 mt-1 uppercase font-semibold">Periode: ${moment().format("MMMM YYYY")}</p>
      </div>

      <!-- INFORMASI KARYAWAN -->
      <div class="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
        <div class="space-y-1">
          <div class="flex"><span class="w-28 text-gray-500">Nama Lengkap</span><span class="mr-2">:</span><span class="font-medium text-gray-800">${record.fullname}</span></div>
          <div class="flex"><span class="w-28 text-gray-500">NIP</span><span class="mr-2">:</span><span class="text-gray-800">${record.nip}</span></div>
        </div>
        <div class="space-y-1">
          <div class="flex"><span class="w-28 text-gray-500">Jabatan</span><span class="mr-2">:</span><span class="text-gray-800">${record.Position.name}</span></div>
          <div class="flex"><span class="w-28 text-gray-500">Status PTKP</span><span class="mr-2">:</span><span class="text-gray-800 font-semibold">${record.ptkp}</span></div>
        </div>
      </div>
      
      <!-- RINCIAN PENDAPATAN & POTONGAN -->
      <div class="grid grid-cols-2 gap-6 items-start mb-6">
        
  <!-- KOLOM PENDAPATAN -->
  <div class="border border-gray-200 rounded-md overflow-hidden">
    <div class="bg-green-600 text-white px-3 py-2 font-bold text-sm">PENDAPATAN (EARNINGS)</div>
      <div class="p-3 space-y-2">
        <div class="flex justify-between"><span>Gaji Pokok</span><span class="font-medium">${IDRFormat(temp.salary)}</span></div>
        
        ${temp.allowance
          .map(
            (a) => `
            <div class="flex justify-between">
              <span class="text-gray-600">${a.name}</span>
              <span>${IDRFormat(a.nominal_type === "RUPIAH" ? a.nominal : record.salary * (a.nominal / 100))}</span>
            </div>
          `,
          )
          .join("")}

        ${temp.insentif
          .map(
            (a) => `
            <div class="flex justify-between">
              <span class="text-gray-600">${a.name}</span>
              <span>${IDRFormat(a.nominal_type === "RUPIAH" ? a.nominal : record.salary * (a.nominal / 100))}</span>
            </div>
          `,
          )
          .join("")}

        <div class="flex justify-between">
          <span class="text-gray-600">Lemburan</span>
          <span>${IDRFormat(temp.lemburPay)}</span>
        </div>

        <!-- TOTAL PENDAPATAN -->
        <div class="flex justify-between border-t pt-1.5 mt-2 font-bold text-gray-800">
          <span>Total Pendapatan</span>
          <span>${IDRFormat(temp.grossSalary)}</span>
        </div>
      </div>
    </div>

    <!-- KOLOM POTONGAN -->
    <div class="border border-gray-200 rounded-md overflow-hidden">
      <div class="bg-red-600 text-white px-3 py-2 font-bold text-sm">POTONGAN (DEDUCTIONS)</div>
        <div class="p-3 space-y-2">
          ${temp.deduction
            .map(
              (a) => `
              <div class="flex justify-between">
                <span class="text-gray-600">${a.name}</span>
                <span class="text-red-600">-${IDRFormat(a.nominal_type === "RUPIAH" ? a.nominal : record.salary * (a.nominal / 100))}</span>
              </div>
            `,
            )
            .join("")}

            ${temp.tt_deduction
              .map(
                (a) => `
            <div class="flex justify-between">
              <span class="text-gray-600">${a.name}</span>
              <span class="text-red-600">-${IDRFormat(a.nominal_type === "RUPIAH" ? a.nominal : record.salary * (a.nominal / 100))}</span>
            </div>
          `,
              )
              .join("")}

          <div class="flex justify-between">
            <span class="text-gray-600">Pot. Alpha</span>
            <span class="text-red-600">-${IDRFormat(temp.alphaPay)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Terlambat</span>
            <span class="text-red-600">-${IDRFormat(temp.latePay)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Pulang Awal</span>
            <span class="text-red-600">-${IDRFormat(temp.fastLeaveDeduction)}</span>
          </div>
          <div class="flex justify-between border-b pb-1.5 mb-1">
            <span class="text-gray-600">PPh21</span>
            <span class="text-red-600">-${IDRFormat(temp.pph)}</span>
          </div>

          <!-- TOTAL POTONGAN -->
          <div class="flex justify-between font-bold text-red-700 mt-2">
            <span>Total Potongan</span>
            <span>-${IDRFormat(temp.deductionPay + temp.alphaPay + temp.latePay + temp.fastLeaveDeduction + temp.pph + temp.tt_deductionPay)}</span>
          </div>
        </div>
      </div>
    </div>

      <!-- TAKE HOME PAY -->
      <div class="bg-gray-800 text-white rounded-md p-4 flex justify-between items-center mb-8 shadow-inner">
        <span class="text-sm font-bold uppercase tracking-wider">Total Gaji Diterima (Take Home Pay)</span>
        <span class="text-xl font-extrabold text-yellow-400">${IDRFormat(temp.takeHome)}</span>
      </div>

      <!-- DETAIL PERHITUNGAN PPH 21 (MENGGUNAKAN SKEMA TER BULANAN) -->
      <div class="border border-gray-300 rounded-md bg-gray-50 p-4">
        <h3 class="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 border-b pb-1">Lampiran: Analisis Potongan PPh 21 (Metode TER)</h3>
        <div class="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs text-gray-600">
          
          <div class="flex justify-between"><span>Total Penghasilan Bruto Bulan Ini</span><span class="font-medium text-gray-800">${IDRFormat(temp.bruto || 0)}</span></div>
          <div class="flex justify-between"><span>Status Kebijakan PTKP</span><span class="font-medium text-gray-800">${record.ptkp}</span></div>
          
          <div class="flex justify-between"><span>Kategori Tabel TER DJP</span><span class="font-bold text-blue-600">Kategori ${temp.kategoriTER || "A"}</span></div>
          <div class="flex justify-between"><span>Persentase Tarif Efektif yang Berlaku</span><span class="font-bold text-gray-800">${temp.tarifTER || "0.00%"}</span></div>
          
          <div class="flex justify-between border-t pt-1 col-span-2 my-1"></div>
          
          <div class="flex justify-between col-span-2 bg-yellow-50 p-2 rounded border border-yellow-200">
            <span class="font-semibold text-gray-700">Formula Pemotongan PPh 21 Masa</span>
            <span class="font-bold text-gray-950">${IDRFormat(temp.bruto || 0)} &times; ${temp.tarifTER || "0%"} = <span class="text-red-600">${IDRFormat(temp.pph)}</span></span>
          </div>
        </div>
      </div>

      <!-- TANDA TANGAN / VALIDASI PRINT -->
      <div class="mt-8 flex justify-end text-center text-xs text-gray-500">
        <div>
          <p>${moment().format("DD MMMM YYYY")}</p>
          <p class="mt-16 border-t border-gray-400 pt-1 w-40 mx-auto font-medium text-gray-700">Tim Pengelola Payroll</p>
        </div>
      </div>

    </div>
    </body>
  </html>
  `;

  return html;
};

export const printPayrol = (record: IUser) => {
  const htmlContent = generate(record);

  const w = window.open("", "_blank");
  if (!w) {
    alert("Popup diblokir. Mohon izinkan popup dari situs ini.");
    return;
  }

  w.document.open();
  w.document.write(htmlContent);
  w.document.close();
  w.onload = function () {
    setTimeout(() => {
      w.print();
    }, 200);
  };
};
