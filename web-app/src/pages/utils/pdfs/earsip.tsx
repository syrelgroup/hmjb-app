import moment from "moment";
import type { IMitra, ISubmission } from "../../../libs/interface";

moment.locale("id");

const generate = (record: any, month: string | null) => {
  const semuaMitra = record.mitra as IMitra[];

  // 2. Inisialisasi struktur data penampung untuk tabel HTML
  const dataPensiunan: any[] = [];
  const dataNonPensiunan: any[] = [];

  // 3. Objek Totalizer awal
  const totalspensiun = {
    jumlahDebitur: 0,
    statusAktif: 0,
    statusLunas: 0,
    jaminanDiterima: 0,
    jaminanDipinjam: 0,
    jaminanPending: 0,
    fileDiterima: 0,
    fileDipinjam: 0,
    filePending: 0,
    flagging: 0,
    pendingFlagging: 0,
  };

  const totalsnonpensiun = {
    jumlahDebitur: 0,
    statusAktif: 0,
    statusLunas: 0,
    jaminanDiterima: 0,
    jaminanDipinjam: 0,
    jaminanPending: 0,
    fileDiterima: 0,
    fileDipinjam: 0,
    filePending: 0,
    flagging: 0,
    pendingFlagging: 0,
  };

  // 4. Proses pemisahan mutlak dalam satu kali perulangan (Single-pass)
  semuaMitra.forEach((mitra) => {
    const submissions = mitra.Submission || [];

    // Wadah temporary per-mitra untuk memisahkan submission
    const subPensiun: ISubmission[] = [];
    const subNonPensiun: ISubmission[] = [];

    // Filter di tingkat NASABAH (Submission), bukan Mitra
    for (const s of submissions) {
      if ((s as ISubmission).flagging_status === "NON_PENSIUNAN") {
        subNonPensiun.push(s);
      } else {
        subPensiun.push(s);
      }
    }

    // Jika mitra ini punya nasabah Pensiun, hitung dan masukkan ke kelompok Pensiun
    if (subPensiun.length > 0) {
      const rowPensiun = hitungStatusSubmissions(subPensiun, totalspensiun);
      dataPensiunan.push({
        ...mitra,
        Submission: subPensiun,
        rekap: rowPensiun,
      });
    }

    // Jika mitra ini punya nasabah Non-Pensiun, hitung dan masukkan ke kelompok Non-Pensiun
    if (subNonPensiun.length > 0) {
      const rowNonPensiun = hitungStatusSubmissions(
        subNonPensiun,
        totalsnonpensiun,
      );
      dataNonPensiunan.push({
        ...mitra,
        Submission: subNonPensiun,
        rekap: rowNonPensiun,
      });
    }
  });

  // Helper Function untuk menghitung sub-total baris & akumulasi grand-total sekaligus
  function hitungStatusSubmissions(subs: ISubmission[], grandTotal: any) {
    const row = {
      aktif: 0,
      lunas: 0,
      jamDiterima: 0,
      jamDipinjam: 0,
      jamPending: 0,
      fileDiterima: 0,
      fileDipinjam: 0,
      filePending: 0,
      flagging: 0,
      pendingFlagging: 0,
    };

    grandTotal.jumlahDebitur += subs.length;

    for (const s of subs) {
      if (s.approve_status === "AKTIF") {
        row.aktif++;
        grandTotal.statusAktif++;
      } else if (s.approve_status === "LUNAS") {
        row.lunas++;
        grandTotal.statusLunas++;
      }

      if (s.guarantee_status === "DITERIMA") {
        row.jamDiterima++;
        grandTotal.jaminanDiterima++;
      } else if (s.guarantee_status === "DIPINJAM") {
        row.jamDipinjam++;
        grandTotal.jaminanDipinjam++;
      } else if (s.guarantee_status === "PENDING") {
        row.jamPending++;
        grandTotal.jaminanPending++;
      }

      if (s.doc_status === "DITERIMA") {
        row.fileDiterima++;
        grandTotal.fileDiterima++;
      } else if (s.doc_status === "DIPINJAM") {
        row.fileDipinjam++;
        grandTotal.fileDipinjam++;
      } else if (s.doc_status === "PENDING") {
        row.filePending++;
        grandTotal.filePending++;
      }
      if (s.flagging_status === "PENDING") {
        row.pendingFlagging++;
        grandTotal.pendingFlagging++;
      } else if (s.flagging_status === "FLAGGING") {
        row.flagging++;
        grandTotal.flagging++;
      }
    }
    return row;
  }

  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <style>
  /* Standar Halaman Cetak (Default Portrait) */
  @page {
    size: A4 portrait;
    margin: 15mm;
  }

  /* Aturan Khusus untuk Halaman Landscape */
  @page landscape-layout {
    size: A4 landscape;
    margin: 10mm;
  }

  html, body {
    font-family: Cambria, Georgia, 'Times New Roman', Times, serif;
    font-size: 13px;
    background-color: #ffffff;
  }

  /* FIX: Hapus break-after dari sini agar tidak memicu halaman kosong di akhir */
  .page.landscape {
    page: landscape-layout;
  }

  /* Pemisah halaman manual yang aman */
  .page-break {
    page-break-before: always;
    break-before: page;
    display: block;
    height: 0;
    border: none;
    clear: both;
  }

  /* Warna Biru Excel Modifikasi */
  .bg-excel-blue {
    background-color: #b4c6e7 !important;
  }

  /* Border tegas standar laporan keuangan */
  table, th, td {
    border: 1px solid #2d3748 !important;
  }

  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      background-color: #ffffff;
    }
    .page.landscape {
      min-height: 100vh;
    }
  }
</style>
    </head>
    <body class="text-gray-900 bg-white p-2">

      <div class="page landscape">
        <div class="mb-4 text-left">
          <p class="text-lg font-bold tracking-wide">REKAP BERDASARKAN MITRA KERJA PENSIUN</p>
          <p class="text-sm font-semibold text-gray-700">PT. BPR HASAMITRA JAWA BARAT</p>
          <p class="text-xs text-gray-500">Periode: ${month ? moment(month).format("MMMM YYYY").toUpperCase() : "SEMUA DATA"}</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse table-auto">
            <thead>
              <tr class="bg-excel-blue font-bold text-center text-xs uppercase">
                <th rowspan="2" class="p-2 w-12 text-center">No</th>
                <th rowspan="2" class="p-2 min-w-62.5 text-left px-4">Nama Mitra</th>
                <th rowspan="2" class="p-2 w-24 text-center">Jumlah Debitur</th>
                <th colspan="2" class="p-1">Status Nasabah</th>
                <th colspan="3" class="p-1">Jaminan Asli</th>
                <th colspan="3" class="p-1">File Kredit</th>
                <th colspan="3" class="p-1">Status Flagging</th>
              </tr>
              <tr class="bg-excel-blue font-bold text-center text-xs">
                <th class="p-1 w-20">Aktif</th>
                <th class="p-1 w-20">Lunas</th>
                <th class="p-1 w-20">Diterima</th>
                <th class="p-1 w-20">Dipinjam</th>
                <th class="p-1 w-20">Pending</th>
                <th class="p-1 w-20">Diterima</th>
                <th class="p-1 w-20">Dipinjam</th>
                <th class="p-1 w-20">Pending</th>
                <th class="p-1 w-20">Flagging</th>
                <th class="p-1 w-20">Pending</th>
              </tr>
            </thead>
            
            <tbody>
              ${
                dataPensiunan.length > 0
                  ? dataPensiunan
                      .map((row: any, index: number) => {
                        const submissions = row.Submission || [];
                        const totalDebitur = submissions.length;

                        let aktif = 0,
                          lunas = 0;
                        let jamDiterima = 0,
                          jamDipinjam = 0,
                          jamPending = 0;
                        let fileDiterima = 0,
                          fileDipinjam = 0,
                          filePending = 0;
                        let flagging = 0;
                        let pendingFlagging = 0;

                        for (const s of submissions) {
                          if (s.approve_status === "AKTIF") aktif++;
                          else if (s.approve_status === "LUNAS") lunas++;

                          if (s.guarantee_status === "DITERIMA") jamDiterima++;
                          else if (s.guarantee_status === "DIPINJAM")
                            jamDipinjam++;
                          else if (s.guarantee_status === "PENDING")
                            jamPending++;

                          if (s.doc_status === "DITERIMA") fileDiterima++;
                          else if (s.doc_status === "DIPINJAM") fileDipinjam++;
                          else if (s.doc_status === "PENDING") filePending++;
                          if (s.flagging_status === "FLAGGING") flagging++;
                          else if (s.flagging_status === "PENDING")
                            pendingFlagging++;
                        }

                        return `
                        <tr class="hover:bg-gray-50 text-xs">
                          <td class="p-1 text-center font-medium">${index + 1}</td>
                          <td class="p-1 px-4 uppercase text-left font-medium">${row.name || "-"}</td>
                          <td class="p-1 text-center font-semibold">${totalDebitur}</td>
                          <td class="p-1 text-center">${aktif}</td>
                          <td class="p-1 text-center">${lunas}</td>
                          <td class="p-1 text-center">${jamDiterima}</td>
                          <td class="p-1 text-center">${jamDipinjam}</td>
                          <td class="p-1 text-center">${jamPending}</td>
                          <td class="p-1 text-center">${fileDiterima}</td>
                          <td class="p-1 text-center">${fileDipinjam}</td>
                          <td class="p-1 text-center">${filePending}</td>
                          <td class="p-1 text-center">${flagging}</td>
                          <td class="p-1 text-center">${pendingFlagging}</td>
                        </tr>
                      `;
                      })
                      .join("")
                  : `
                    <tr>
                      <td colspan="11" class="p-4 text-center text-gray-500 italic">Tidak ada data mitra kerja tersedia.</td>
                    </tr>
                  `
              }
            </tbody>

            <tfoot>
              <tr class="bg-excel-blue font-bold text-xs text-center">
                <td colspan="2" class="p-1.5 text-right pr-4 uppercase">Total</td>
                <td class="p-1.5">${totalspensiun.jumlahDebitur}</td>
                <td class="p-1.5">${totalspensiun.statusAktif}</td>
                <td class="p-1.5">${totalspensiun.statusLunas}</td>
                <td class="p-1.5">${totalspensiun.jaminanDiterima}</td>
                <td class="p-1.5">${totalspensiun.jaminanDipinjam}</td>
                <td class="p-1.5">${totalspensiun.jaminanPending}</td>
                <td class="p-1.5">${totalspensiun.fileDiterima}</td>
                <td class="p-1.5">${totalspensiun.fileDipinjam}</td>
                <td class="p-1.5">${totalspensiun.filePending}</td>
                <td class="p-1.5">${totalspensiun.flagging}</td>
                <td class="p-1.5">${totalspensiun.pendingFlagging}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="mt-8 my-4 flex justify-evenly gap-8 items-end">
          <div class="w-42 text-center">
            <p>Disiapkan Oleh,</p>
            <div class="h-28"></div>
            <div>
              <p class="font-bold underline">Leony</p>
              <p>Admin Kredit</p>
            </div>
          </div>
          <div class="w-42 text-center">
            <p>Diperiksa Oleh,</p>
            <div class="h-28"></div>
            <div>
              <p class="font-bold underline">Komang Gd Ariawan</p>
              <p>Head Bisnis</p>
            </div>
          </div>
          <div class="w-42 text-center">
            <p>Depok, ${moment().format("DD MMMM YYYY")}</p>
            <p>Disetujui Oleh,</p>
            <div class="h-28"></div>
            <div>
              <p class="font-bold underline">Ketut Sugiata</p>
              <p>Direktur Utama</p>
            </div>
          </div>
        </div>
      </div>


      <div class="page landscape">
        <div class="mb-4 text-left">
          <p class="text-lg font-bold tracking-wide">REKAP BERDASARKAN MITRA KERJA NON PENSIUN</p>
          <p class="text-sm font-semibold text-gray-700">PT. BPR HASAMITRA JAWA BARAT</p>
          <p class="text-xs text-gray-500">Periode: ${month ? moment(month).format("MMMM YYYY").toUpperCase() : "SEMUA DATA"}</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse table-auto">
            <thead>
              <tr class="bg-excel-blue font-bold text-center text-xs uppercase">
                <th rowspan="2" class="p-2 w-12 text-center">No</th>
                <th rowspan="2" class="p-2 min-w-62.5 text-left px-4">Nama Mitra</th>
                <th rowspan="2" class="p-2 w-24 text-center">Jumlah Debitur</th>
                <th colspan="2" class="p-1">Status Nasabah</th>
                <th colspan="3" class="p-1">Jaminan Asli</th>
                <th colspan="3" class="p-1">File Kredit</th>
              </tr>
              <tr class="bg-excel-blue font-bold text-center text-xs">
                <th class="p-1 w-20">Aktif</th>
                <th class="p-1 w-20">Lunas</th>
                <th class="p-1 w-20">Diterima</th>
                <th class="p-1 w-20">Dipinjam</th>
                <th class="p-1 w-20">Pending</th>
                <th class="p-1 w-20">Diterima</th>
                <th class="p-1 w-20">Dipinjam</th>
                <th class="p-1 w-20">Pending</th>
              </tr>
            </thead>
            
            <tbody>
              ${
                dataNonPensiunan.length > 0
                  ? dataNonPensiunan
                      .map((row: any, index: number) => {
                        const submissions = row.Submission || [];
                        const totalDebitur = submissions.length;

                        let aktif = 0,
                          lunas = 0;
                        let jamDiterima = 0,
                          jamDipinjam = 0,
                          jamPending = 0;
                        let fileDiterima = 0,
                          fileDipinjam = 0,
                          filePending = 0;

                        for (const s of submissions) {
                          if (s.approve_status === "AKTIF") aktif++;
                          else if (s.approve_status === "LUNAS") lunas++;

                          if (s.guarantee_status === "DITERIMA") jamDiterima++;
                          else if (s.guarantee_status === "DIPINJAM")
                            jamDipinjam++;
                          else if (s.guarantee_status === "PENDING")
                            jamPending++;

                          if (s.doc_status === "DITERIMA") fileDiterima++;
                          else if (s.doc_status === "DIPINJAM") fileDipinjam++;
                          else if (s.doc_status === "PENDING") filePending++;
                        }

                        return `
                        <tr class="hover:bg-gray-50 text-xs">
                          <td class="p-1 text-center font-medium">${index + 1}</td>
                          <td class="p-1 px-4 uppercase text-left font-medium">${row.name || "-"}</td>
                          <td class="p-1 text-center font-semibold">${totalDebitur}</td>
                          <td class="p-1 text-center">${aktif}</td>
                          <td class="p-1 text-center">${lunas}</td>
                          <td class="p-1 text-center">${jamDiterima}</td>
                          <td class="p-1 text-center">${jamDipinjam}</td>
                          <td class="p-1 text-center">${jamPending}</td>
                          <td class="p-1 text-center">${fileDiterima}</td>
                          <td class="p-1 text-center">${fileDipinjam}</td>
                          <td class="p-1 text-center">${filePending}</td>
                        </tr>
                      `;
                      })
                      .join("")
                  : `
                    <tr>
                      <td colspan="11" class="p-4 text-center text-gray-500 italic">Tidak ada data mitra kerja tersedia.</td>
                    </tr>
                  `
              }
            </tbody>

            <tfoot>
              <tr class="bg-excel-blue font-bold text-xs text-center">
                <td colspan="2" class="p-1.5 text-right pr-4 uppercase">Total</td>
                <td class="p-1.5">${totalsnonpensiun.jumlahDebitur}</td>
                <td class="p-1.5">${totalsnonpensiun.statusAktif}</td>
                <td class="p-1.5">${totalsnonpensiun.statusLunas}</td>
                <td class="p-1.5">${totalsnonpensiun.jaminanDiterima}</td>
                <td class="p-1.5">${totalsnonpensiun.jaminanDipinjam}</td>
                <td class="p-1.5">${totalsnonpensiun.jaminanPending}</td>
                <td class="p-1.5">${totalsnonpensiun.fileDiterima}</td>
                <td class="p-1.5">${totalsnonpensiun.fileDipinjam}</td>
                <td class="p-1.5">${totalsnonpensiun.filePending}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div class="mt-8 my-4 flex justify-evenly gap-8 items-end">
          <div class="w-42 text-center">
            <p>Disiapkan Oleh,</p>
            <div class="h-28"></div>
            <div>
              <p class="font-bold underline">Leony</p>
              <p>Admin Kredit</p>
            </div>
          </div>
          <div class="w-42 text-center">
            <p>Diperiksa Oleh,</p>
            <div class="h-28"></div>
            <div>
              <p class="font-bold underline">Komang Gd Ariawan</p>
              <p>Head Bisnis</p>
            </div>
          </div>
          <div class="w-42 text-center">
            <p>Depok, ${moment().format("DD MMMM YYYY")}</p>
            <p>Disetujui Oleh,</p>
            <div class="h-28"></div>
            <div>
              <p class="font-bold underline">Ketut Sugiata</p>
              <p>Direktur Utama</p>
            </div>
          </div>
        </div>
      </div>
    
    </body>
  </html>
  `;

  return html;
};

export const printEarsip = (record: any, month: string | null) => {
  const htmlContent = generate(record, month);

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
    }, 500); // Penambahan waktu tunggu render CSS Tailwind sebelum dialog cetak terbuka
  };
};
