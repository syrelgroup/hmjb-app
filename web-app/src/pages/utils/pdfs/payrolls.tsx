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
          size: A4;
          margin: 15mm;
        }

        html, body {
          height: 100%;
          font-family: Cambria, Georgia, 'Times New Roman', Times, serif;
          font-size: 14px;
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
      <h1 class="text-center font-bold">REKAP GAJI BULANAN</h1>
      
      <div class="my-4">
        <div class="flex flex-wrap gap-4 justify-center">
          <div class="min-w-40 border p-8 border-gray-400 rounded-2xl">
            <div>Total User</div>
            <div class="font-bold">${record.length} User</div>
          </div>
          <div class="min-w-40 border p-8 border-gray-400 rounded-2xl">
            <div>Total User</div>
            <div class="font-bold">Rp. ${IDRFormat(temp.reduce((acc, curr) => acc + curr.payroll.takeHome, 0))};-</div>
          </div>
        </div>
      </div>

      <div class="mt-20">
        <table class="w-full border-collapse border border-gray-400 border-dashed text-sm mb-4">
          <thead>
            <tr class="bg-gray-200">
              <th class="border border-gray-400 border-dashed p-1">NO</th>
              <th class="border border-gray-400 border-dashed p-1">User</th>
              <th class="border border-gray-400 border-dashed p-1">Kehadiran</th>
              <th class="border border-gray-400 border-dashed p-1">Kehadiran 1</th>
              <th class="border border-gray-400 border-dashed p-1">Kehadiran 2</th>
              <th class="border border-gray-400 border-dashed p-1">Insentif/Bonus</th>
              <th class="border border-gray-400 border-dashed p-1">PPh21</th>
              <th class="border border-gray-400 border-dashed p-1">Takehomepay</th>
            </tr>
          </thead>
          <tbody>
            ${temp
              .map(
                (r, i) => `
              <tr>
                <td class="border border-gray-400 border-dashed p-1 text-center">${i + 1}</td>
                <td class="border border-gray-400 border-dashed p-1">
                  <div>
                    ${r.fullname}
                  </div>
                  <div class="text-xs opacity-70">
                    ${r.nik}
                  </div>
                </td>
                <td class="border border-gray-400 border-dashed p-1">
                  <div>
                    <div className="opacity-80 text-xs flex justify-between">
                      <span className="w-14">Hadir</span> <span className="w-4">:</span>
                      <span className="flex- justify-end">${r.payroll.hadir.length}</span>
                    </div>
                    <div className="opacity-80 text-xs flex justify-between">
                      <span className="w-14">Alpha</span> <span className="w-4">:</span>
                      <span className="flex- justify-end">${r.payroll.alpha.length}</span>
                    </div>
                    <div className="opacity-80 text-xs flex justify-between">
                      <span className="w-14">Cuti</span> <span className="w-4">:</span>
                      <span className="flex- justify-end">${r.payroll.cuti.length}</span>
                    </div>
                    <div className="opacity-80 text-xs flex justify-between">
                      <span className="w-14">Sakit</span> <span className="w-4">:</span>
                      <span className="flex- justify-end">${r.payroll.sakit.length}</span>
                    </div>
                  </div>
                </td>
                <td class="border border-gray-400 border-dashed p-1">
                  <div>
                  <div className="opacity-80 text-xs flex justify-between">
                    <span className="w-18">Perdin</span>
                    <span className="w-4">:</span>
                    <span className="flex- justify-end">${r.payroll.perdin.length}</span>
                  </div>
                  <div className="opacity-80 text-xs flex justify-between">
                    <span className="w-18">Terlambat</span>
                    <span className="w-4">:</span>
                    <span className="flex- justify-end">${r.payroll.late.length}</span>
                  </div>
                  <div className="opacity-80 text-xs flex justify-between">
                    <span className="w-18">Pulang Awal</span>
                    <span className="w-4">:</span>
                    <span className="flex- justify-end">${r.payroll.fastleave.length}</span>
                  </div>
                  <div className="opacity-80 text-xs flex justify-between">
                    <span className="w-18">Lembur</span>
                    <span className="w-4">:</span>
                    <span className="flex- justify-end">${r.payroll.lembur.length}</span>
                  </div>
                </div>
                </td>
                <td class="border border-gray-400 border-dashed p-1">
                  <div>
                    <div className="opacity-80 text-xs flex justify-between">
                      <span className="w-20">Alpa</span> <span className="w-4">:</span>
                      <span className="flex- justify-end">
                        ${IDRFormat(r.payroll.alphaPay)}
                      </span>
                    </div>
                    <div className="opacity-80 text-xs flex justify-between">
                      <span className="w-20">Terlambat</span>
                      <span className="w-4">:</span>
                      <span className="flex- justify-end">
                        ${IDRFormat(r.payroll.latePay)}
                      </span>
                    </div>
                    <div className="opacity-80 text-xs flex justify-between">
                      <span className="w-20">Pulang Awal</span>
                      <span className="w-4">:</span>
                      <span className="flex- justify-end">
                        ${IDRFormat(r.payroll.fastLeaveDeduction)}
                      </span>
                    </div>
                    <div className="opacity-80 text-xs flex justify-between">
                      <span className="w-20">Lembur</span>
                      <span className="w-4">:</span>
                      <span className="flex- justify-end">
                        ${IDRFormat(r.payroll.lemburPay)}
                      </span>
                    </div>
                  </div>
                </td>
                <td class="border border-gray-400 border-dashed p-1 t">
                  ${IDRFormat(r.payroll.insentifPay)}
                </td>
                <td class="border border-gray-400 border-dashed p-1 t">
                  ${IDRFormat(r.payroll.pph)}
                </td>
                <td class="border border-gray-400 border-dashed p-1 t">
                  ${IDRFormat(r.payroll.takeHome)}
                </td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr class="bg-gray-100 font-semibold italic">
              <td
                colspan="2"
                class="border border-gray-400 p-2 text-center border-dashed"
              >
                JUMLAH
              </td>
              <td
                colspan="3"
                class="border border-gray-400 p-2 text-center border-dashed"
              >
                
              </td>
              <td
                colspan="1"
                class="border border-gray-400 p-2 text-center border-dashed"
              >
                ${IDRFormat(temp.reduce((acc, curr) => acc + curr.payroll.insentifPay, 0))}
              </td>
              <td
                colspan="1"
                class="border border-gray-400 p-2 text-center border-dashed"
              >
                ${IDRFormat(temp.reduce((acc, curr) => acc + curr.payroll.pph, 0))}
              </td>
              <td
                colspan="1"
                class="border border-gray-400 p-2 text-center border-dashed"
              >
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
    }, 200);
  };
};
