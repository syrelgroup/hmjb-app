import {
  Calendar,
  User,
  MapPin,
  FileText,
  Clock,
  FileIcon,
  ExternalLink,
  Download,
  Share2,
  MessageSquare,
  Contact,
} from "lucide-react";
import type { IVisit } from "../../libs/interface";
import { Button, Divider, Tag, Tooltip, message } from "antd";
import {
  ArrowLeftOutlined,
  EnvironmentFilled,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import moment from "moment";

// Props menggunakan interface IVisit yang Anda berikan

export default function DetailCallReport({ data }: { data: IVisit }) {
  const [messageApi, contextHolder] = message.useMessage();

  // const handlePrint = () => {
  //   window.print();
  // };

  const handleShare = async () => {
    const url = window.location.href;
    const title = `Detail Kunjungan - ${data.Debitur?.fullname || "Kunjungan"}`;
    const text = `Ringkasan: ${data.summary?.substring(0, 100) || "Lihat detail kunjungan"}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text,
          url,
        });
      } else {
        // Fallback: copy URL to clipboard
        await navigator.clipboard.writeText(url);
        messageApi.success("Link disalin ke clipboard!");
      }
    } catch (err) {
      if (err instanceof Error && err.message !== "AbortError") {
        messageApi.error("Gagal membagikan konten");
      }
    }
  };

  // Safety check untuk data
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-500">Data tidak ditemukan</p>
      </div>
    );
  }

  // Helper untuk format Geo (lat, lng) ke Google Maps Embed
  const getMapUrl = (geoString?: string) => {
    if (!geoString) return null;
    return `https://maps.google.com/maps?q=${geoString}&z=15&output=embed`;
  };

  // Helper untuk mendapatkan warna berdasarkan status approve
  const getStatusColors = {
    headerGradient: "from-blue-600 to-blue-700",
    buttonText: "text-blue-600",
    buttonHover: "hover:bg-blue-50",
    textColor: "text-blue-100",
  };

  return (
    <>
      {contextHolder}
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Link to="/app/callreport/visit">
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                className="text-gray-600"
              >
                Kembali
              </Button>
            </Link>
            <div className="flex gap-2">
              {/* <Tooltip title="Print">
                <Button
                  icon={<Printer size={16} />}
                  type="text"
                  onClick={handlePrint}
                />
              </Tooltip> */}
              <Tooltip title="Share">
                <Button
                  icon={<Share2 size={16} />}
                  type="text"
                  onClick={handleShare}
                />
              </Tooltip>
            </div>
          </div>

          {/* Header Card with Status */}
          <div
            className={`bg-linear-to-r ${getStatusColors.headerGradient} rounded-3xl p-8 text-white shadow-lg`}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Detail Kunjungan
                </h1>
                <p className={getStatusColors.textColor}>
                  ID Kunjungan: {data.id}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Primary Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-800">
                    Informasi Utama
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  {/* Row 1: Debitur Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        <User size={14} className="inline mr-1" />
                        Nama Debitur
                      </label>
                      <p className="text-lg font-bold text-gray-900">
                        {data.Debitur?.fullname?.toUpperCase() || "N/A"}
                      </p>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          NIK:{" "}
                          <span className="font-semibold">
                            {data.Debitur?.nik}
                          </span>
                        </p>
                        <p>
                          CIF:{" "}
                          <span className="font-semibold">
                            {data.Debitur?.cif}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex flex-col">
                        Jenis Pemohon
                      </label>
                      <Tag color="blue" className="text-sm py-1.5 px-3">
                        {data.Debitur?.SubmissionType?.name || "N/A"}
                      </Tag>
                    </div>
                  </div>

                  <Divider className="my-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        <EnvironmentFilled className="inline mr-1" />
                        Rencana Kunjungan
                      </label>
                      <p className="text-base font-semibold text-gray-800">
                        {data.Debitur.address}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        <Contact size={14} className="inline mr-1" />
                        Informasi Kontak
                      </label>
                      <div className="text-xs font-semibold text-gray-900">
                        <div>
                          <PhoneOutlined /> {data.Debitur.phone}
                        </div>
                        <div>
                          <MailOutlined /> {data.Debitur.email}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Divider className="my-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        <Calendar size={14} className="inline mr-1" />
                        Rencana Kunjungan
                      </label>
                      <p className="text-base font-semibold text-gray-900">
                        {data.date_plan
                          ? moment(data.date_plan).format("DD MMMM YYYY")
                          : "N/A"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        <Clock size={14} className="inline mr-1" />
                        Waktu Kunjungan Aktual
                      </label>
                      <p className="text-base font-semibold text-gray-900">
                        {data.date_action
                          ? moment(data.date_action).format(
                              "DD MMMM YYYY HH:mm",
                            )
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <Divider className="my-4" />

                  {/* Row 3: Visit Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex flex-col">
                        Kategori Kunjungan
                      </label>
                      <Tag color="cyan" className="text-sm py-1.5">
                        {data.VisitCategory?.name || "N/A"}
                      </Tag>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex flex-col">
                        Tujuan Kunjungan
                      </label>
                      <Tag color="purple" className="text-sm py-1.5">
                        {data.VisitPurpose?.name || "N/A"}
                      </Tag>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary & Results */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-linear-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-800">
                    Hasil Kunjungan
                  </h2>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      <FileText size={14} className="inline mr-1" />
                      Ringkasan
                    </label>
                    <div className="bg-gray-50 p-4 rounded-xl text-gray-700 leading-relaxed border border-gray-200 whitespace-pre-wrap">
                      {data.summary || "Tidak ada ringkasan"}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-green-50 border-l-4 border-green-500">
                      <label className="text-xs font-bold text-green-600 uppercase mb-1 block">
                        Status Kunjungan
                      </label>
                      <p className="text-lg font-semibold text-green-700">
                        {data.VisitStatus?.name || "N/A"}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-orange-50 border-l-4 border-orange-500">
                      <label className="text-xs font-bold text-orange-600 uppercase mb-1 block">
                        Rencana Tindak Lanjut
                      </label>
                      <p className="text-base font-medium text-orange-700">
                        {data.next_action || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Value / Plafond Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-linear-to-r from-indigo-50 to-blue-50 p-6 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-800">
                    Nilai Tagihan
                  </h2>
                </div>

                <div className="flex gap-4 items-center justify-evenly">
                  <div className="p-6">
                    <div className="flex items-end justify-between">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">
                          Nilai Tagihan
                        </label>
                        <p className="text-xl md:text-2xl font-bold text-indigo-600">
                          Rp.{" "}
                          {data.value
                            ? new Intl.NumberFormat("id-ID").format(data.value)
                            : "0"}
                        </p>
                      </div>
                      <div className="text-2xl text-indigo-200">💰</div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-end justify-between">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">
                          Realisasi
                        </label>
                        <p className="text-xl md:text-2xl font-bold text-indigo-600">
                          Rp.{" "}
                          {data.realize_value
                            ? new Intl.NumberFormat("id-ID").format(
                                data.realize_value,
                              )
                            : "0"}
                        </p>
                      </div>
                      <div className="text-2xl text-indigo-200">💰</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              {data.coments && data.coments.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-linear-to-r from-yellow-50 to-amber-50 p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <MessageSquare size={20} className="text-yellow-600" />
                      Komentar ({data.coments.length})
                    </h2>
                  </div>

                  <div className="p-6 space-y-4">
                    {data.coments.map((comment, index) => (
                      <div
                        key={index}
                        className="border-l-4 border-yellow-400 pl-4 py-2"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {comment.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {comment.date
                                ? moment(comment.date).format(
                                    "DD MMMM YYYY HH:mm",
                                  )
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                          {comment.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {data.files && data.files.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-linear-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <FileIcon size={20} className="text-purple-600" />
                      Foto Kunjungan ({data.files.length})
                    </h2>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {data.files.map((file, index) => (
                        <Tooltip key={index} title={file.name}>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="group relative aspect-square rounded-xl bg-gray-200 overflow-hidden border-2 border-gray-100 hover:border-purple-500 transition-all hover:shadow-lg"
                          >
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
                              <ExternalLink className="text-white" size={20} />
                              <Download className="text-white" size={20} />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-2">
                              <p className="text-xs text-white font-semibold truncate">
                                {file.name}
                              </p>
                            </div>
                          </a>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
              {/* Location Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-linear-to-r from-red-50 to-rose-50 p-4 border-b border-gray-100 flex items-center gap-2">
                  <MapPin size={18} className="text-red-600" />
                  <h3 className="font-bold text-gray-800">Lokasi Kunjungan</h3>
                </div>
                {data.geo ? (
                  <>
                    <div className="h-64 border-t border-gray-100">
                      <iframe
                        title="visit-location"
                        width="100%"
                        height="100%"
                        src={getMapUrl(data.geo)!}
                        className="border-0"
                        loading="lazy"
                      ></iframe>
                    </div>
                    <div className="p-3 bg-gray-50 border-t border-gray-100">
                      <p className="text-xs text-gray-500 break-all font-mono">
                        {data.geo}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                    <MapPin size={40} className="mb-2 opacity-20" />
                    <p className="text-sm">Data lokasi tidak tersedia</p>
                  </div>
                )}
              </div>

              {/* Officer Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 block">
                  <User size={14} className="inline mr-1" />
                  Petugas Laporan
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {data.User?.fullname?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">
                      {data.User?.fullname}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ID: {data.userId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 block">
                  <Clock size={14} className="inline mr-1" />
                  Timeline
                </label>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <div className="w-0.5 h-12 bg-gray-200"></div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600">
                        DIBUAT
                      </p>
                      <p className="text-sm text-gray-900 font-medium">
                        {data.created_at
                          ? moment(data.created_at).format("DD MMM YYYY HH:mm")
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <div className="w-0.5 h-12 bg-gray-200"></div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600">
                        RENCANA PELAKSANAAN
                      </p>
                      <p className="text-sm text-gray-900 font-medium">
                        {data.date_plan
                          ? moment(data.date_plan).format("DD MMM YYYY")
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600">
                        TANGGAL PELAKSANAAN
                      </p>
                      <p className="text-sm text-gray-900 font-medium">
                        {data.date_action
                          ? moment(data.date_action).format("DD MMM YYYY HH:mm")
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
