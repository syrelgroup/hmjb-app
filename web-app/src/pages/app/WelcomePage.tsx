import { FolderLock, PhoneCall, UserCheck, Layout, Info } from "lucide-react";

export default function WelcomePage() {
  // Data statis informasi modul
  const modules = [
    {
      id: "e-arsip",
      name: "Elektronik Arsip",
      description:
        "Pusat penyimpanan dan manajemen dokumen digital perusahaan. Berfungsi untuk mengkategorikan, mengarsipkan, serta mengamankan berkas penting agar mudah ditelusuri kapan saja.",
      icon: <FolderLock className="w-8 h-8 text-amber-600" />, // Diubah ke amber-600 agar lebih kontras di background terang
      features: [
        "Pengarsipan Digital",
        "Kategorisasi Berkas",
        "Pencarian Dokumen Cepat",
      ],
    },
    {
      id: "call-report",
      name: "Call Report System",
      description:
        "Sistem pencatatan dan pelaporan hasil panggilan atau interaksi dengan klien. Memudahkan pemantauan riwayat komunikasi, tindak lanjut (follow-up), serta analisis aktivitas tim.",
      icon: <PhoneCall className="w-8 h-8 text-indigo-600" />, // Diubah ke indigo-600
      features: [
        "Log Aktivitas Panggilan",
        "Riwayat Komunikasi Klien",
        "Ringkasan & Analisis Laporan",
      ],
    },
    {
      id: "absensi",
      name: "Absensi & Kehadiran",
      description:
        "Modul pencatatan kehadiran karyawan secara real-time. Digunakan untuk mengelola waktu kerja, mencatat jam masuk/pulang, serta mempermudah pengajuan izin atau cuti.",
      icon: <UserCheck className="w-8 h-8 text-emerald-600" />, // Diubah ke emerald-600
      features: [
        "Pencatatan Jam Kerja",
        "Manajemen Izin & Cuti",
        "Rekapitulasi Kehadiran",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Glowing Ornaments (Disesuaikan opacity-nya agar soft di tema terang) */}
      <div className="absolute top-[-20%] left-[-15%] w-150 h-150 bg-indigo-400/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-175 h-175 bg-emerald-400/10 rounded-full blur-[180px] pointer-events-none" />

      {/* Header Aplikasi */}
      <header className="px-8 py-5 flex justify-between items-center border-b border-slate-200 bg-white/60 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="bg-linear-to-tr from-indigo-600 to-purple-600 p-2 rounded-xl text-white shadow-md shadow-indigo-600/20">
            <Layout size={20} />
          </div>
          <div>
            <span className="font-bold text-base tracking-wider text-slate-900 block leading-none">
              SYSTEM
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
              Informasi Ekosistem Aplikasi
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 shadow-sm">
          <Info size={14} className="text-indigo-600" />
          <span>Informasi Modul Aktif</span>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 max-w-6xl mx-auto z-10 w-full">
        {/* Teks Judul Utama */}
        <div className="text-center max-w-2xl mb-14">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
            Selamat Datang di <br />
            <span className="bg-linear-to-r from-indigo-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
              Portal Aplikasi Terintegrasi
            </span>
          </h1>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed">
            Platform ini mengintegrasikan seluruh operasional inti ke dalam satu
            kesatuan sistem. Berikut adalah 3 modul utama yang menggerakkan
            ekosistem kerja digital kita.
          </p>
        </div>

        {/* Grid 3 Modul */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {modules.map((module) => (
            <div
              key={module.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between shadow-md shadow-slate-200/50 hover:border-slate-300 hover:shadow-lg transition-all duration-200"
            >
              <div>
                {/* Bagian Icon Modul */}
                <div className="inline-flex p-3 bg-slate-50 border border-slate-100 rounded-xl mb-5">
                  {module.icon}
                </div>

                {/* Judul & Deskripsi Modul */}
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {module.name}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  {module.description}
                </p>
              </div>

              {/* Sub-fitur / Highlight Informasi tambahan di bagian bawah Card */}
              <div className="border-t border-slate-100 pt-4 mt-auto">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block mb-2">
                  Cakupan Fitur:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {module.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-400 bg-white/40 z-10">
        &copy; {new Date().getFullYear()} System &bull; Pusat Informasi &
        Ekosistem Internal Aplikasi
      </footer>
    </div>
  );
}
