import { Button, Modal, Upload, message as antdMessage } from "antd";
import { useState, type FormEvent } from "react";
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import api from "../../libs/api";
import type { ISubmission } from "../../libs/interface";
import { Import, Download } from "lucide-react";
import { ExportData } from "../../libs/helper";
import moment from "moment";

export const ExportImport = ({ data }: { data: ISubmission[] }) => {
  const [open, setOpen] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Menangani perubahan file lewat Antd Upload
  const handleFileChange = ({ fileList: newFileList }: any) => {
    // Membatasi hanya 1 file saja yang aktif di list
    setFileList(newFileList.slice(-1));
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (fileList.length === 0) {
      antdMessage.warning("Pilih file terlebih dahulu!");
      return;
    }

    const formData = new FormData();
    // fileList[0].originFileObj berisi file mentah yang dibutuhkan backend
    formData.append("file", fileList[0].originFileObj);

    setLoading(true);
    setMessage("");

    try {
      // PERBAIKAN: Di Axios, formData dikirim langsung sebagai argumen kedua
      const response = await api.post("/submission/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        // Menyesuaikan struktur response data dari backend Anda
        const resData = response.data;
        antdMessage.success("Data berhasil diimport!");
        setMessage(
          `Sukses: ${resData.message || "Berhasil"} (${resData.total_data || 0} data diproses)`,
        );
        setFileList([]); // Reset file list setelah sukses
      } else {
        setMessage(`Gagal: ${response.data?.message || "Terjadi kesalahan"}`);
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      const errorMsg =
        error.response?.data?.message || "Terjadi kesalahan koneksi ke server.";
      antdMessage.error(errorMsg);
      setMessage(`Gagal: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2 items-center">
        <Button
          icon={<Download size={14} />}
          size="small"
          onClick={() =>
            ExportData(
              data
                ? data.map((d) => ({
                    cif: d.Debitur.cif,
                    nik: d.Debitur.nik,
                    nama: d.Debitur.fullname,
                    tempat_lahir: d.Debitur.birthplace,
                    tanggal_lahir: moment(d.Debitur.birthdate).format(
                      "DD/MM/YYYY",
                    ),
                    alamat: d.Debitur.address,
                    no_telepon: d.Debitur.phone,
                    email: d.Debitur.email,
                    jenis_pemohon: d.Debitur.SubmissionType.name,
                    tanggal_dibuat: moment(d.created_at).format("DD/MM/YYYY"),
                    tipe_produk: d.Product.ProductType?.name,
                    produk: d.Product.name,
                    nilai: d.value,
                    tenor: d.tenor,
                    no_rekening: d.account_number,
                    tujuan_penggunaan: d.purpose,
                    status_nasabah: d.approve_status,
                    status_dokumen: d.doc_status,
                    status_jaminan: d.guarantee_status,
                    status_flagging: d.flagging_status,
                    asuransi: d.Insurance?.name,
                    no_lemari: d.drawer_code,
                    nama_mitra: d.Mitra?.name,
                    kantor_bayar: d.PayOffice?.name,
                    nip_petugas: d.User.nip,
                    nama_petugas: d.User.fullname,
                    berkas: d.Files.map((f) => `${f.name}: ${f.url}`).join(","),
                  }))
                : [],
              "rekening",
            )
          }
        >
          Export
        </Button>
        <Button
          icon={<Import size={14} />}
          size="small"
          onClick={() => setOpen(true)}
        >
          Import
        </Button>
      </div>

      <Modal
        open={open}
        onCancel={() => {
          setOpen(false);
          setMessage("");
          setFileList([]);
        }}
        footer={null} // Menyembunyikan tombol bawaan modal agar serasi dengan form di dalam
        centered
        destroyOnHidden
        style={{ top: 20 }}
      >
        <div className="p-6 text-center">
          {/* Judul & Deskripsi */}
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Import Data</h2>
          <p className="text-gray-500 text-sm mb-6">
            Unggah file Excel Anda untuk menambah data ke sistem.
          </p>

          {/* Banner Download Format Template */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between text-left">
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-0.5">
                Belum punya formatnya?
              </p>
              <p className="text-xs text-blue-700 m-0">
                Gunakan template standar agar tidak terjadi galat data.
              </p>
            </div>
            <a
              href="/upload-example.xlsx"
              download="upload-example.xlsx"
              className="no-underline"
            >
              <Button
                type="primary"
                ghost
                icon={<DownloadOutlined />}
                size="small"
              >
                Template
              </Button>
            </a>
          </div>

          {/* Form Utama */}
          <form onSubmit={handleUpload} className="space-y-4">
            <Upload
              beforeUpload={() => false} // Menahan auto-upload bawaan Antd
              fileList={fileList}
              onChange={handleFileChange}
              accept=".xlsx, .xls"
              maxCount={1}
              className="w-full block"
            >
              <Button
                icon={<UploadOutlined />}
                className="w-full h-11 border-dashed text-gray-600 hover:text-blue-500 hover:border-blue-500"
              >
                {fileList.length > 0 ? "Ganti File" : "Pilih File Excel / CSV"}
              </Button>
            </Upload>

            {/* Kotak Pesan Status */}
            {message && (
              <div
                className={`p-3 rounded-md text-sm font-medium ${message.startsWith("Gagal") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
              >
                {message}
              </div>
            )}

            {/* Tombol Aksi di dalam Modal */}
            <div className="flex gap-3 pt-2">
              <Button
                className="w-full h-10 border-gray-300 text-gray-600"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full h-10 bg-blue-600 hover:bg-blue-500 flex items-center justify-center"
              >
                {loading ? "Mengimport..." : "Upload & Import"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
