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
          font-family: Cambria, Georgia, 'Times New Roman', Times, serif;
          font-size: 15px;
          text-align: justify;
        }

        /* Pemisah halaman */
        .page-break {
          page-break-before: always;
          break-before: page;
          display: block;
          height: 0;
          border: none;
        }
          @media print {
            .page {
              position: relative;
              min-height: 95vh;    /* atau height A4 jika untuk print */
              padding-top: 20px;    /* ruang untuk header */
              page-break-after: always;
            }
    
            .page .page-header {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              padding: 10px;
              text-align: center;
              background: white;
              border-bottom: 1px solid #ccc;
            }
          }
      </style>
    </head>
    <body class="bg-white text-gray-800 leading-relaxed">

    <div class="page" style="font-size: 12px;">
      <h1 class="text-center font-bold class="my-8"">REKAP GAJI BULANAN ${record.fullname.toUpperCase()}</h1>

      <div class="my-10 flex flex-col gap-2">
        <div class="flex gap-4">
          <p class="w-24">Nama Lengkap</p>
          <p class="w-4">:</p>
          <p class="w-4">${record.fullname}</p>
        </div>
        <div class="flex gap-4">
          <p class="w-24">NIK</p>
          <p class="w-4">:</p>
          <p class="w-4">${record.nik}</p>
        </div>
        <div class="flex gap-4">
          <p class="w-24">NIP</p>
          <p class="w-4">:</p>
          <p class="w-4">${record.nip}</p>
        </div>
        <div class="flex gap-4">
          <p class="w-24">Jabatan</p>
          <p class="w-4">:</p>
          <p class="w-4">${record.Position.name}</p>
        </div>
        <div class="flex gap-4">
          <p class="w-24">Status PTKP</p>
          <p class="w-4">:</p>
          <p class="w-4">${record.ptkp}</p>
        </div>
      </div>
      
      <div class="flex gap-4 justify-between my-8">
        <div class="flex-1 p-2">
          <div class="flex gap-4">
            <p class="w-24">Gaji Pokok</p>
            <p class="w-4">:</p>
            <p class="flex-1">${IDRFormat(temp.salary)}</p>
          </div>
          ${temp.allowance
            .map(
              (a) => `<div class="flex gap-4">
            <p class="w-24">${a.name}</p>
            <p class="w-4">:</p>
            <p class="flex-1">${IDRFormat(a.nominal_type === "RUPIAH" ? a.nominal : record.salary * (a.nominal / 100))}</p>
          </div>`,
            )
            .join("")}
          ${temp.insentif
            .map(
              (a) => `<div class="flex gap-4">
            <p class="w-24">${a.name}</p>
            <p class="w-4">:</p>
            <p class="flex-1">${IDRFormat(a.nominal_type === "RUPIAH" ? a.nominal : record.salary * (a.nominal / 100))}</p>
          </div>`,
            )
            .join("")}
          <div class="flex gap-4">
            <p class="w-24">Lemburan</p>
            <p class="w-4">:</p>
            <p class="flex-1">${IDRFormat(temp.lemburPay)}</p>
          </div>
        </div>
        <div class="flex-1 p-2">
          ${temp.deduction
            .map(
              (a) => `<div class="flex gap-4">
            <p class="w-24">${a.name}</p>
            <p class="w-4">:</p>
            <p class="flex-1">${IDRFormat(a.nominal_type === "RUPIAH" ? a.nominal : record.salary * (a.nominal / 100))}</p>
          </div>`,
            )
            .join("")}
          <div class="flex gap-4">
            <p class="w-24">Pot. Alpha</p>
            <p class="w-4">:</p>
            <p class="flex-1">${IDRFormat(temp.alphaPay)}</p>
          </div>
          <div class="flex gap-4">
            <p class="w-24">Terlambat</p>
            <p class="w-4">:</p>
            <p class="flex-1">${IDRFormat(temp.latePay)}</p>
          </div>
          <div class="flex gap-4">
            <p class="w-24">Pulang Awal</p>
            <p class="w-4">:</p>
            <p class="flex-1">${IDRFormat(temp.fastLeaveDeduction)}</p>
          </div>
          <div class="flex gap-4">
            <p class="w-24">PPh21</p>
            <p class="w-4">:</p>
            <p class="flex-1">${IDRFormat(temp.pph)}</p>
          </div>
        </div>
      </div>

      <div class="my-4 text-center font-bold p-4 border-t border-gray-400 border-dashed">
        ${IDRFormat(temp.takeHome)}
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
