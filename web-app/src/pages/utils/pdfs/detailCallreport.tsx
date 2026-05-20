import moment from "moment";
import type { IVisit } from "../../../libs/interface";
import { IDRFormat } from "../utilForm";

moment.locale("id");

const generate = (record: IVisit) => {
  const safeStr = (str?: string | null) => str || "-";

  // Generate Comments HTML
  const commentsHtml = record.coments?.length
    ? `
      <div class="section">
        <div class="section-title">Komentar (${record.coments.length})</div>
        <div class="section-content">
          ${record.coments
            .map(
              (c) => `
            <div class="comment-item">
              <div class="comment-header">
                <strong>${safeStr(c.name)}</strong>
                <span class="text-muted">${moment(c.date).format("DD MMM YYYY HH:mm")}</span>
              </div>
              <div class="comment-body">${safeStr(c.comment)}</div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>`
    : "";

  // Generate Photos HTML
  const photosHtml = record.files?.length
    ? `
      <div class="section" style="page-break-inside: avoid;">
        <div class="section-title">Foto Kunjungan (${record.files.length})</div>
        <div class="section-content photo-grid">
          ${record.files
            .map(
              (f) => `
            <div class="photo-item">
              <img src="${f.url}" alt="${f.name}" />
              <div class="photo-name">${safeStr(f.name)}</div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>`
    : "";

  // Perbaikan Geo HTML menggunakan iframe
  const GeoHtml = record.geo
    ? `
      <div class="section" style="page-break-inside: avoid;">
        <div class="section-title">Lokasi Kunjungan (Maps)</div>
        <div class="section-content" style="padding: 0;">
          <iframe 
            width="100%" 
            height="250" 
            frameborder="0" 
            scrolling="no" 
            marginheight="0" 
            marginwidth="0" 
            src="https://maps.google.com/maps?q=${record.geo}&z=16&output=embed"
            style="border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; display: block;"
          ></iframe>
          <div style="padding: 8px 15px; background: #f8fafc; font-size: 11px; border-top: 1px solid #e5e7eb;">
            Titik Koordinat: <strong>${record.geo}</strong>
          </div>
        </div>
      </div>`
    : "";

  return `
  <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Detail Kunjungan - ${safeStr(record.Debitur?.fullname)}</title>
      <style>
        /* Base Print Styles */
        @page { size: A4 portrait; margin: 10mm 15mm; }
        body { 
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #1f2937; 
          line-height: 1.4; 
          font-size: 11px; 
          margin: 0; 
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        * { box-sizing: border-box; }
        
        /* Header */
        .header { 
          background-color: #1d4ed8; 
          color: white; 
          padding: 15px 20px; 
          border-radius: 8px; 
          margin-bottom: 15px; 
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
        .header-info { text-align: right; font-size: 11px; opacity: 0.9; }
        .header-info p { margin: 2px 0; }

        /* Grid Layouts */
        .grid { display: grid; gap: 12px; }
        .grid-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-4 { grid-template-columns: repeat(4, 1fr); }
        
        /* Sections */
        .section { 
          border: 1px solid #e5e7eb; 
          border-radius: 8px; 
          margin-bottom: 15px; 
          background: #fff;
          page-break-inside: avoid;
        }
        .section-title { 
          background-color: #f1f5f9; 
          font-weight: 600; 
          padding: 8px 15px; 
          border-bottom: 1px solid #e5e7eb; 
          color: #0f172a; 
          font-size: 12px;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }
        .section-content { padding: 12px 15px; }
        
        /* Typography & Fields */
        .field-label { 
          font-size: 9px; 
          text-transform: uppercase; 
          color: #64748b; 
          font-weight: 700; 
          margin-bottom: 2px; 
          display: block;
          letter-spacing: 0.5px;
        }
        .field-value { font-size: 12px; font-weight: 500; color: #0f172a; }
        .text-muted { color: #64748b; font-size: 10px; }
        
        /* Badges & Special Boxes */
        .badge { 
          display: inline-block; padding: 3px 6px; border-radius: 4px; 
          font-size: 10px; font-weight: 600; border: 1px solid #e5e7eb; background: #f8fafc;
        }
        .info-box {
          background-color: #f8fafc; padding: 10px; border-radius: 6px; 
          border: 1px solid #e2e8f0; white-space: pre-wrap; font-size: 11px;
        }
        .status-box { border-left: 4px solid #22c55e; background-color: #f0fdf4; }
        .action-box { border-left: 4px solid #f97316; background-color: #fff7ed; }
        .value-highlight { font-size: 15px; font-weight: 700; color: #4338ca; }

        /* Comments */
        .comment-item { 
          border-left: 3px solid #cbd5e1; padding-left: 10px; margin-bottom: 10px; 
        }
        .comment-item:last-child { margin-bottom: 0; }
        .comment-header { display: flex; justify-content: space-between; margin-bottom: 3px; }
        .comment-body { color: #334155; white-space: pre-wrap; }

        /* Photos Grid */
        .photo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .photo-item { border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px; text-align: center; }
        .photo-item img { width: 100%; height: 100px; object-fit: cover; border-radius: 4px; margin-bottom: 4px; }
        .photo-name { font-size: 9px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #475569;}
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Laporan Detail Kunjungan</h1>
        <div class="header-info">
          <p><strong>ID Kunjungan:</strong> ${safeStr(record.id?.toString())}</p>
          <p><strong>Dicetak:</strong> ${moment().format("DD MMM YYYY HH:mm")}</p>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Informasi Debitur & Kunjungan</div>
        <div class="section-content grid grid-2">
          <!-- Kolom Kiri -->
          <div class="grid grid-1" style="gap: 10px;">
            <div>
              <span class="field-label">Nama Debitur</span>
              <div class="field-value" style="font-size: 14px;">${safeStr(record.Debitur?.fullname?.toUpperCase())}</div>
              <div class="text-muted mt-1">NIK: ${safeStr(record.Debitur?.nik)} | CIF: ${safeStr(record.Debitur?.cif)}</div>
            </div>
            <div>
              <span class="field-label">Alamat Rencana Kunjungan</span>
              <div class="field-value">${safeStr(record.Debitur?.address)}</div>
            </div>
            <div class="grid grid-2">
              <div>
                <span class="field-label">Kategori / Tujuan</span>
                <span class="badge">${safeStr(record.VisitCategory?.name)}</span>
                <span class="badge">${safeStr(record.VisitPurpose?.name)}</span>
              </div>
              <div>
                <span class="field-label">Petugas Lapangan</span>
                <div class="field-value">${safeStr(record.User?.fullname)}</div>
              </div>
            </div>
          </div>
          
          <!-- Kolom Kanan -->
          <div class="grid grid-1" style="gap: 10px;">
            <div class="grid grid-2">
              <div>
                <span class="field-label">Tgl. Rencana</span>
                <div class="field-value">${moment(record.date_plan).format("DD MMM YYYY")}</div>
              </div>
              <div>
                <span class="field-label">Waktu Aktual</span>
                <div class="field-value">${moment(record.date_action).format("DD MMM YYYY HH:mm")}</div>
              </div>
            </div>
            <div class="grid grid-2">
              <div>
                <span class="field-label">Kontak Debitur</span>
                <div class="field-value">📞 ${safeStr(record.Debitur?.phone)}</div>
              </div>
              <div>
                <span class="field-label">Jenis Pemohon</span>
                <span class="badge">${safeStr(record.Debitur?.SubmissionType?.name)}</span>
              </div>
            </div>
            <div class="grid grid-2">
              <div>
                <span class="field-label">Nilai Tagihan</span>
                <div class="value-highlight">Rp. ${IDRFormat(record.value || 0)}</div>
              </div>
              <div>
                <span class="field-label">Nilai Realisasi</span>
                <div class="value-highlight" style="color: #15803d;">Rp. ${IDRFormat(record.realize_value || 0)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Hasil Laporan</div>
        <div class="section-content">
          <span class="field-label">Ringkasan Kunjungan</span>
          <div class="info-box" style="margin-bottom: 12px;">${safeStr(record.summary)}</div>
          
          <div class="grid grid-2">
            <div class="info-box status-box">
              <span class="field-label" style="color: #166534;">Status Kunjungan</span>
              <div class="field-value" style="color: #15803d; font-size: 14px;">${safeStr(record.VisitStatus?.name)}</div>
            </div>
            <div class="info-box action-box">
              <span class="field-label" style="color: #c2410c;">Rencana Tindak Lanjut</span>
              <div class="field-value" style="color: #b45309; font-size: 14px;">${safeStr(record.next_action)}</div>
            </div>
          </div>
        </div>
      </div>

      ${commentsHtml}
      
      <div class="grid grid-2">
        ${GeoHtml}
        ${photosHtml}
      </div>

    </body>
    </html>
  `;
};

export const printDetailVisit = (record: IVisit) => {
  const htmlContent = generate(record);

  const w = window.open("", "_blank");
  if (!w) {
    alert("Popup diblokir. Mohon izinkan popup dari browser Anda.");
    return;
  }

  w.document.open();
  w.document.write(htmlContent);
  w.document.close();

  // Beri waktu sedikit lebih lama (500ms) agar iframe Google Maps sempat ter-load sebelum print dialog muncul
  w.onload = function () {
    setTimeout(() => {
      w.print();
    }, 500);
  };
};
