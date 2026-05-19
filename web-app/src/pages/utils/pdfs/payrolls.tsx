// import moment from "moment";
// import type { IUser } from "../../../libs/interface";
// import { calculatePayroll } from "../libs";
// import { IDRFormat } from "../utilForm";

// moment.locale("id");

// const generate = (record: IUser[]) => {
//   const temp = record.map((d) => ({ ...d, payroll: calculatePayroll(d) }));

//   const html = `
//   <!doctype html>
//   <html>
//     <head>
//       <meta charset="utf-8" />
//       <meta name="viewport" content="width=device-width,initial-scale=1" />
//       <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
//       <style>
//         @page landscapePage {
//           size: A4 landscape;
//           margin: 10mm;
//         }

//         html, body {
//           height: 100%;
//           font-family: Cambria, Georgia, 'Times New Roman', Times, serif;
//           font-size: 14px;
//           text-align: justify;
//         }

//         .landscape {
//           page: landscapePage;
//         }

//         /* Pemisah halaman */
//         .page-break {
//           page-break-before: always;
//           break-before: page;
//           display: block;
//           height: 0;
//           border: none;
//         }
//           @media print {
//             .page {
//               position: relative;
//               min-height: 95vh;    /* atau height A4 jika untuk print */
//               padding-top: 20px;    /* ruang untuk header */
//               page-break-after: always;
//             }

//             .page .page-header {
//               position: absolute;
//               top: 0;
//               left: 0;
//               right: 0;
//               padding: 10px;
//               text-align: center;
//               background: white;
//               border-bottom: 1px solid #ccc;
//             }
//           }
//       </style>
//     </head>
//     <body class="page landscape text-gray-800 leading-relaxed">

//     <div class="page">
//       <h1 class="text-center font-bold">REKAP GAJI BULANAN</h1>

//       <div class="my-4">
//         <div class="flex flex-wrap gap-4 justify-center">
//           <div class="min-w-40 border p-8 border-gray-400 rounded-2xl">
//             <div>Total User</div>
//             <div class="font-bold">${record.length} User</div>
//           </div>
//           <div class="min-w-40 border p-8 border-gray-400 rounded-2xl">
//             <div>Total User</div>
//             <div class="font-bold">Rp. ${IDRFormat(temp.reduce((acc, curr) => acc + curr.payroll.takeHome, 0))};-</div>
//           </div>
//         </div>
//       </div>

//       <div class="mt-20">
//         <table class="w-full border-collapse border border-gray-400 border-dashed text-sm mb-4">
//           <thead>
//             <tr class="bg-gray-200">
//               <th class="border border-gray-400 border-dashed p-1">NO</th>
//               <th class="border border-gray-400 border-dashed p-1">User</th>
//               <th class="border border-gray-400 border-dashed p-1">Tunj. & Pot. Tetap</th>
//               <th class="border border-gray-400 border-dashed p-1">Kehadiran</th>
//               <th class="border border-gray-400 border-dashed p-1">Kehadiran 1</th>
//               <th class="border border-gray-400 border-dashed p-1">Kehadiran 2</th>
//               <th class="border border-gray-400 border-dashed p-1">Insentif/Bonus</th>
//               <th class="border border-gray-400 border-dashed p-1">Pot. Tidak Tetap</th>
//               <th class="border border-gray-400 border-dashed p-1">PPh21</th>
//               <th class="border border-gray-400 border-dashed p-1">Takehomepay</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${temp
//               .map(
//                 (r, i) => `
//               <tr>
//                 <td class="border border-gray-400 border-dashed p-1 text-center">${i + 1}</td>
//                 <td class="border border-gray-400 border-dashed p-1">
//                   <div>
//                     ${r.fullname}
//                   </div>
//                   <div class="text-xs opacity-70">
//                     ${r.nik}
//                   </div>
//                   <div class="text-xs opacity-70">
//                     ${r.Position.name}
//                   </div>
//                 </td>
//                 <td class="border border-gray-400 border-dashed p-1 t">
//                   <div className="opacity-80 text-xs flex justify-between">
//                     Tunj : ${IDRFormat(r.payroll.allowancePay)}
//                   </div>
//                   <div className="opacity-80 text-xs flex justify-between">
//                     Pot : ${IDRFormat(r.payroll.deductionPay)}
//                   </div>
//                 </td>
//                 <td class="border border-gray-400 border-dashed p-1">
//                   <div>
//                     <div className="opacity-80 text-xs flex justify-between">
//                       <span className="w-14">Hadir</span> <span className="w-4">:</span>
//                       <span className="flex- justify-end">${r.payroll.hadir.length}</span>
//                     </div>
//                     <div className="opacity-80 text-xs flex justify-between">
//                       <span className="w-14">Alpha</span> <span className="w-4">:</span>
//                       <span className="flex- justify-end">${r.payroll.alpha.length}</span>
//                     </div>
//                     <div className="opacity-80 text-xs flex justify-between">
//                       <span className="w-14">Cuti</span> <span className="w-4">:</span>
//                       <span className="flex- justify-end">${r.payroll.cuti.length}</span>
//                     </div>
//                     <div className="opacity-80 text-xs flex justify-between">
//                       <span className="w-14">Sakit</span> <span className="w-4">:</span>
//                       <span className="flex- justify-end">${r.payroll.sakit.length}</span>
//                     </div>
//                   </div>
//                 </td>
//                 <td class="border border-gray-400 border-dashed p-1">
//                   <div>
//                   <div className="opacity-80 text-xs flex justify-between">
//                     <span className="w-18">Perdin</span>
//                     <span className="w-4">:</span>
//                     <span className="flex- justify-end">${r.payroll.perdin.length}</span>
//                   </div>
//                   <div className="opacity-80 text-xs flex justify-between">
//                     <span className="w-18">Terlambat</span>
//                     <span className="w-4">:</span>
//                     <span className="flex- justify-end">${r.payroll.late.length}</span>
//                   </div>
//                   <div className="opacity-80 text-xs flex justify-between">
//                     <span className="w-18">Pulang Awal</span>
//                     <span className="w-4">:</span>
//                     <span className="flex- justify-end">${r.payroll.fastleave.length}</span>
//                   </div>
//                   <div className="opacity-80 text-xs flex justify-between">
//                     <span className="w-18">Lembur</span>
//                     <span className="w-4">:</span>
//                     <span className="flex- justify-end">${r.payroll.lembur.length}</span>
//                   </div>
//                 </div>
//                 </td>
//                 <td class="border border-gray-400 border-dashed p-1">
//                   <div>
//                     <div className="opacity-80 text-xs flex justify-between">
//                       <span className="w-20">Alpa</span> <span className="w-4">:</span>
//                       <span className="flex- justify-end">
//                         ${IDRFormat(r.payroll.alphaPay)}
//                       </span>
//                     </div>
//                     <div className="opacity-80 text-xs flex justify-between">
//                       <span className="w-20">Terlambat</span>
//                       <span className="w-4">:</span>
//                       <span className="flex- justify-end">
//                         ${IDRFormat(r.payroll.latePay)}
//                       </span>
//                     </div>
//                     <div className="opacity-80 text-xs flex justify-between">
//                       <span className="w-20">Pulang Awal</span>
//                       <span className="w-4">:</span>
//                       <span className="flex- justify-end">
//                         ${IDRFormat(r.payroll.fastLeaveDeduction)}
//                       </span>
//                     </div>
//                     <div className="opacity-80 text-xs flex justify-between">
//                       <span className="w-20">Lembur</span>
//                       <span className="w-4">:</span>
//                       <span className="flex- justify-end">
//                         ${IDRFormat(r.payroll.lemburPay)}
//                       </span>
//                     </div>
//                   </div>
//                 </td>
//                 <td class="border border-gray-400 border-dashed p-1 t">
//                   ${r.payroll.insentif.map((ins) => `<div>${ins.name} : ${ins.nominal_type === "RUPIAH" ? IDRFormat(ins.nominal) : IDRFormat(r.salary * (ins.nominal / 100))}</div>`).join("")}
//                 </td>
//                 <td class="border border-gray-400 border-dashed p-1 t">
//                   ${r.payroll.tt_deduction.map((ins) => `<div>${ins.name} : ${ins.nominal_type === "RUPIAH" ? IDRFormat(ins.nominal) : IDRFormat(r.salary * (ins.nominal / 100))}</div>`).join("")}
//                 </td>
//                 <td class="border border-gray-400 border-dashed p-1 t">
//                   ${IDRFormat(r.payroll.pph)}
//                 </td>
//                 <td class="border border-gray-400 border-dashed p-1 t">
//                   ${IDRFormat(r.payroll.takeHome)}
//                 </td>
//               </tr>
//             `,
//               )
//               .join("")}
//           </tbody>
//           <tfoot>
//             <tr class="bg-gray-100 font-semibold italic">
//               <td
//                 colspan="2"
//                 class="border border-gray-400 p-2 text-center border-dashed"
//               >
//                 JUMLAH
//               </td>
//               <td
//                 colspan="4"
//                 class="border border-gray-400 p-2 text-center border-dashed"
//               >

//               </td>
//               <td
//                 colspan="1"
//                 class="border border-gray-400 p-2 text-center border-dashed"
//               >
//                 ${IDRFormat(temp.reduce((acc, curr) => acc + curr.payroll.insentifPay, 0))}
//               </td>
//               <td
//                 colspan="1"
//                 class="border border-gray-400 p-2 text-center border-dashed"
//               >
//                 ${IDRFormat(temp.reduce((acc, curr) => acc + curr.payroll.tt_deductionPay, 0))}
//               </td>
//               <td
//                 colspan="1"
//                 class="border border-gray-400 p-2 text-center border-dashed"
//               >
//                 ${IDRFormat(temp.reduce((acc, curr) => acc + curr.payroll.pph, 0))}
//               </td>
//               <td
//                 colspan="1"
//                 class="border border-gray-400 p-2 text-center border-dashed"
//               >
//                 ${IDRFormat(temp.reduce((acc, curr) => acc + curr.payroll.takeHome, 0))}
//               </td>
//             </tr>
//           </tfoot>
//         </table>
//       </div>

//     </div>
//     </body>
//   </html>
//   `;

//   return html;
// };

// export const printAllPayrol = (record: IUser[]) => {
//   const htmlContent = generate(record);

//   const w = window.open("", "_blank");
//   if (!w) {
//     alert("Popup diblokir. Mohon izinkan popup dari situs ini.");
//     return;
//   }

//   w.document.open();
//   w.document.write(htmlContent);
//   w.document.close();
//   w.onload = function () {
//     setTimeout(() => {
//       w.print();
//     }, 200);
//   };
// };

import moment from "moment";
import type { IUser } from "../../../libs/interface";
import { calculatePayroll } from "../libs";
import { IDRFormat } from "../utilForm";

moment.locale("id");

const generate = (record: IUser[]) => {
  const temp = record.map((d) => ({ ...d, payroll: calculatePayroll(d) }));

  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <style>
        @page {
          size: A4 landscape;
          margin: 15mm 10mm 15mm 10mm;
        }

        html, body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          font-size: 11px; /* Diperkecil sedikit agar pas landscape A4 */
          background-color: #ffffff;
        }

        /* Zebra striping untuk tabel agar mudah dibaca */
        tbody tr:nth-child(even) {
          background-color: #f9fafb;
        }

        /* Optimasi cetak */
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body class="text-gray-800 p-4">

    <div class="max-w-full mx-auto">
      <!-- HEADER -->
      <div class="text-center mb-6 border-b-2 border-gray-100 pb-4">
        <h1 class="text-2xl font-black tracking-wide text-gray-900 uppercase">Rekap Gaji Bulanan</h1>
        <p class="text-gray-500 text-xs mt-1 font-medium tracking-wider">Periode: ${moment().format("MMMM YYYY")}</p>
      </div>
      
      <!-- SUMMARY CARDS -->
      <div class="grid grid-cols-2 gap-4 max-w-xl mx-auto mb-8">
        <div class="bg-gray-50 border border-gray-200 p-4 rounded-xl text-center shadow-sm">
          <div class="text-xs font-semibold tracking-wider text-gray-500 uppercase">Total Karyawan</div>
          <div class="text-2xl font-extrabold text-indigo-600 mt-1">${record.length} <span class="text-xs font-normal text-gray-400">Orang</span></div>
        </div>
        <div class="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center shadow-sm">
          <div class="text-xs font-semibold tracking-wider text-emerald-700 uppercase">Total Gaji Dibayarkan</div>
          <div class="text-2xl font-extrabold text-emerald-600 mt-1">Rp ${IDRFormat(temp.reduce((acc, curr) => acc + curr.payroll.takeHome, 0))}</div>
        </div>
      </div>

      <!-- TABLE DATA -->
      <div class="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-800 text-white text-[10px] uppercase tracking-wider font-semibold">
              <th class="p-2 text-center border-b border-gray-300 w-8">NO</th>
              <th class="p-2 border-b border-gray-300 w-48">Karyawan</th>
              <th class="p-2 border-b border-gray-300">Tunj. & Pot. Tetap</th>
              <th class="p-2 border-b border-gray-300">Kehadiran</th>
              <th class="p-2 border-b border-gray-300">Detail Keadiran</th>
              <th class="p-2 border-b border-gray-300">Kalkulasi Kehadiran</th>
              <th class="p-2 border-b border-gray-300">Insentif / Bonus</th>
              <th class="p-2 border-b border-gray-300">Pot. Tidak Tetap</th>
              <th class="p-2 border-b border-gray-300 text-right">PPh21</th>
              <th class="p-2 border-b border-gray-300 text-right bg-gray-900">Take Home Pay</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 text-[11px]">
            ${temp
              .map(
                (r, i) => `
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="p-2 text-center font-medium text-gray-400">${i + 1}</td>
                <td class="p-2">
                  <div class="font-bold text-gray-900">${r.fullname}</div>
                  <div class="text-[10px] text-gray-500 font-mono">${r.nik}</div>
                  <div class="text-[10px] text-indigo-600 font-medium">${r.Position?.name || "-"}</div>
                </td>
                <td class="p-2 font-mono whitespace-nowrap">
                  <div class="text-gray-600 flex justify-between"><span>Tunj:</span> <span class="font-semibold text-emerald-600">${IDRFormat(r.payroll.allowancePay)}</span></div>
                  <div class="text-gray-600 flex justify-between"><span>Pot:</span> <span class="font-semibold text-red-600">${IDRFormat(r.payroll.deductionPay)}</span></div>
                </td>
                <td class="p-2 text-[10px] font-mono">
                  <div class="flex justify-between text-gray-600"><span>Hadir</span> <span>${r.payroll.hadir.length}</span></div>
                  <div class="flex justify-between text-red-500"><span>Alpha</span> <span>${r.payroll.alpha.length}</span></div>
                  <div class="flex justify-between text-amber-600"><span>Cuti</span> <span>${r.payroll.cuti.length}</span></div>
                  <div class="flex justify-between text-blue-500"><span>Sakit</span> <span>${r.payroll.sakit.length}</span></div>
                </td>
                <td class="p-2 text-[10px] font-mono">
                  <div class="flex justify-between text-gray-600"><span>Perdin</span> <span>${r.payroll.perdin.length}</span></div>
                  <div class="flex justify-between text-amber-500"><span>Terlambat</span> <span>${r.payroll.late.length}</span></div>
                  <div class="flex justify-between text-gray-500"><span>P.Awal</span> <span>${r.payroll.fastleave.length}</span></div>
                  <div class="flex justify-between text-emerald-600"><span>Lembur</span> <span>${r.payroll.lembur.length}</span></div>
                </td>
                <td class="p-2 text-[10px] font-mono whitespace-nowrap">
                  <div class="flex justify-between text-red-500"><span>Alpa:</span> <span>${IDRFormat(r.payroll.alphaPay)}</span></div>
                  <div class="flex justify-between text-amber-600"><span>Terlambat:</span> <span>${IDRFormat(r.payroll.latePay)}</span></div>
                  <div class="flex justify-between text-gray-500"><span>P.Awal:</span> <span>${IDRFormat(r.payroll.fastLeaveDeduction)}</span></div>
                  <div class="flex justify-between text-emerald-600"><span>Lembur:</span> <span>${IDRFormat(r.payroll.lemburPay)}</span></div>
                </td>
                <td class="p-2 text-gray-600 font-mono text-[10px]">
                  ${
                    r.payroll.insentif.length > 0
                      ? r.payroll.insentif
                          .map(
                            (ins) =>
                              `<div class="flex justify-between"><span>${ins.name}:</span> <span class="text-emerald-600">${ins.nominal_type === "RUPIAH" ? IDRFormat(ins.nominal) : IDRFormat(r.salary * (ins.nominal / 100))}</span></div>`,
                          )
                          .join("")
                      : `<span class="text-gray-300">-</span>`
                  }
                </td>
                <td class="p-2 text-gray-600 font-mono text-[10px]">
                  ${
                    r.payroll.tt_deduction.length > 0
                      ? r.payroll.tt_deduction
                          .map(
                            (ins) =>
                              `<div class="flex justify-between"><span class="truncate max-w-[60px]">${ins.name}:</span> <span class="text-red-500">${ins.nominal_type === "RUPIAH" ? IDRFormat(ins.nominal) : IDRFormat(r.salary * (ins.nominal / 100))}</span></div>`,
                          )
                          .join("")
                      : `<span class="text-gray-300">-</span>`
                  }
                </td>
                <td class="p-2 text-right font-mono text-red-500 font-medium">
                  ${IDRFormat(r.payroll.pph)}
                </td>
                <td class="p-2 text-right font-mono font-bold text-gray-900 bg-gray-50">
                  ${IDRFormat(r.payroll.takeHome)}
                </td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr class="bg-gray-800 text-white font-bold uppercase tracking-wider text-[10px]">
              <td colspan="2" class="p-3 text-center border-t-2 border-gray-900">JUMLAH REKAPITULASI</td>
              <td colspan="4" class="p-3 border-t-2 border-gray-900"></td>
              <td class="p-3 font-mono border-t-2 border-gray-900">
                ${IDRFormat(temp.reduce((acc, curr) => acc + curr.payroll.insentifPay, 0))}
              </td>
              <td class="p-3 font-mono border-t-2 border-gray-900">
                ${IDRFormat(temp.reduce((acc, curr) => acc + curr.payroll.tt_deductionPay, 0))}
              </td>
              <td class="p-3 font-mono text-right text-red-300 border-t-2 border-gray-900">
                ${IDRFormat(temp.reduce((acc, curr) => acc + curr.payroll.pph, 0))}
              </td>
              <td class="p-3 font-mono text-right text-emerald-300 bg-gray-900 border-t-2 border-gray-900">
                ${IDRFormat(temp.reduce((acc, curr) => acc + curr.payroll.takeHome, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    </body>
  </html>
  `;

  return html;
};

export const printAllPayrol = (record: IUser[]) => {
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
    }, 300); // Ditambah sedikit delay memastikan Tailwind loaded sempurna sebelum print dialog
  };
};
