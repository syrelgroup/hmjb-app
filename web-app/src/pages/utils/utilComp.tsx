import React, { useState } from "react";
import type {
  IFile,
  IProductTypeFile,
  ISubmission,
} from "../../libs/interface";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Collapse,
  Descriptions,
  Divider,
  Empty,
  Modal,
  Row,
  Col,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  CloseCircleOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FolderOpenFilled,
  HistoryOutlined,
  PrinterOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { IDRFormat } from "./utilForm";
import moment from "moment";
import { BookPlus, MessageSquare } from "lucide-react";
import Title from "antd/es/typography/Title";
const { Text } = Typography;
import { PDFDocument } from "pdf-lib";
import useContext from "../../libs/context";
import api from "../../libs/api";

export const CollapseText = ({
  text,
  maxLength = 100,
}: {
  text: string;
  maxLength?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Jika teks lebih pendek dari batas, tampilkan langsung tanpa tombol
  if (text.length <= maxLength) {
    return <p>{text}</p>;
  }

  return (
    <div>
      <p style={{ lineHeight: "1.3", color: "#333" }}>
        {isExpanded ? text : `${text.substring(0, maxLength)}...`}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: "none",
            border: "none",
            color: "#007bff",
            cursor: "pointer",
            paddingLeft: "5px",
            fontWeight: "bold",
          }}
        >
          {isExpanded ? "Lihat Sedikit" : "Selengkapnya"}
        </button>
      </p>
    </div>
  );
};
export const CollapseList = ({
  items,
  initialVisible = 2,
}: {
  items: string[] | React.ReactNode[];
  initialVisible?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Tentukan item mana saja yang akan ditampilkan
  const visibleItems = isExpanded ? items : items.slice(0, initialVisible);

  return (
    <div
      style={{ padding: "5px", borderRadius: "8px", maxWidth: 300 }}
      className="text-xs"
    >
      <ul className="list-disc list-inside">
        {visibleItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      {/* Tampilkan tombol hanya jika jumlah item lebih dari batas awal */}
      {items.length > initialVisible && (
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ fontSize: 10 }}
          className="text-blue-400 cursor-pointer"
        >
          ... {isExpanded ? "show less" : `show all (${items.length})`}
        </div>
      )}
    </div>
  );
};

export const DetailSubmission = ({
  record,
  open,
  setOpen,
}: {
  record: ISubmission;
  open: boolean;
  setOpen: Function;
}) => {
  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      title={
        <Space>
          <FileTextOutlined style={{ color: "#1890ff" }} />
          <span>DETAIL REKENING #{record.id}</span>
        </Space>
      }
      width={1000}
      footer={[]}
      style={{ top: 10 }}
    >
      <div style={{ padding: "10px 0" }}>
        <div
          style={{
            display: "grid",
            // Menggunakan repeat autofill agar kolom turun ke bawah saat ruang tidak cukup
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          {/* CARD 1: Nilai Permohonan */}
          <Card
            size="small"
            className="bg-light"
            style={{ height: "100%" }} // Memastikan tinggi sama
          >
            <Text type="secondary">Total Nilai Permohonan (Value)</Text>
            <Title
              level={3}
              style={{
                margin: "4px 0",
                color: "#0958d9",
                fontSize: "clamp(18px, 5vw, 24px)",
              }}
            >
              Rp. {IDRFormat(record.value)}
            </Title>

            <Space
              orientation="vertical"
              size={4}
              style={{ width: "100%", marginTop: 8 }}
            >
              <Space wrap>
                <Tag color="blue">{record.Product?.ProductType?.name}</Tag>
                <Badge status="processing" text={record.Product?.name} />
              </Space>

              <Space wrap>
                <Tag color="blue">No Lemari/Laci : </Tag>
                <Badge status="processing" text={record.drawer_code || "-"} />
              </Space>
            </Space>
          </Card>

          {/* Wrapper untuk status agar di HP bisa bersebelahan atau menyesuaikan */}
          <div
            style={
              {
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                // Jika di layar sangat kecil (dibawah 400px), buat status jadi tumpuk atas bawah
                gridColumn: "span 1",
                "@media (maxWidth: 400px)": {
                  gridTemplateColumns: "1fr",
                },
              } as any
            }
          >
            {/* CARD 2: Status Permohonan */}
            <Card
              size="small"
              title="Status Permohonan"
              styles={{
                header: {
                  fontSize: "12px",
                  textAlign: "center",
                  background:
                    record.approve_status === "AKTIF" ||
                    record.approve_status === "LUNAS"
                      ? "#f6ffed"
                      : record.approve_status === "PENDING"
                        ? "#fff7e6"
                        : "#fff1f0",
                },
              }}
              style={{
                border:
                  record.approve_status === "AKTIF" ||
                  record.approve_status === "LUNAS"
                    ? "1px solid #b7eb8f"
                    : record.approve_status === "PENDING"
                      ? "1px solid #ffd591"
                      : "1px solid #ffa39e",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "8px 0",
                }}
              >
                {(() => {
                  switch (record.approve_status) {
                    case "AKTIF":
                    case "LUNAS":
                      return (
                        <Tag
                          color="success"
                          icon={<SafetyCertificateOutlined />}
                          style={{ margin: 0 }}
                        >
                          {record.approve_status}
                        </Tag>
                      );
                    case "PENDING":
                      return (
                        <Tag
                          color="warning"
                          icon={<HistoryOutlined />}
                          style={{ margin: 0 }}
                        >
                          PENDING
                        </Tag>
                      );
                    default:
                      return (
                        <Tag
                          color="error"
                          icon={<CloseCircleOutlined />}
                          style={{ margin: 0 }}
                        >
                          DITOLAK
                        </Tag>
                      );
                  }
                })()}
              </div>
            </Card>

            {/* CARD 3: Status Jaminan */}
            <Card
              size="small"
              title="Status Jaminan"
              styles={{
                header: {
                  fontSize: "12px",
                  textAlign: "center",
                  background:
                    record.guarantee_status === "DITERIMA" ||
                    record.guarantee_status === "DIKEMBALIKAN"
                      ? "#f6ffed"
                      : record.guarantee_status === "DIPINJAM"
                        ? "#e6f7ff" // Biru muda
                        : "#fff7e6",
                },
              }}
              style={{
                border:
                  record.guarantee_status === "DITERIMA" ||
                  record.guarantee_status === "DIKEMBALIKAN"
                    ? "1px solid #b7eb8f"
                    : record.guarantee_status === "DIPINJAM"
                      ? "1px solid #91d5ff"
                      : "1px solid #ffd591",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "8px 0",
                }}
              >
                {(() => {
                  switch (record.guarantee_status) {
                    case "DITERIMA":
                    case "DIKEMBALIKAN":
                      return (
                        <Tag
                          color="success"
                          icon={<SafetyCertificateOutlined />}
                          style={{ margin: 0 }}
                        >
                          {record.guarantee_status}
                        </Tag>
                      );
                    case "DIPINJAM":
                      return (
                        <Tag
                          color="processing"
                          icon={<SwapOutlined />}
                          style={{ margin: 0 }}
                        >
                          DIPINJAM
                        </Tag>
                      );
                    default:
                      return (
                        <Tag
                          color="warning"
                          icon={<HistoryOutlined />}
                          style={{ margin: 0 }}
                        >
                          PENDING
                        </Tag>
                      );
                  }
                })()}
              </div>
            </Card>
          </div>
        </div>

        {/* ROW 2: DETAIL DEBITUR & ACCOUNT */}
        <Divider titlePlacement="left" plain>
          <UserOutlined /> Data Debitur
        </Divider>
        <Descriptions bordered size="small" column={{ xl: 2, xs: 1 }}>
          <Descriptions.Item label="Nama Lengkap">
            **{record.Debitur?.fullname}**
          </Descriptions.Item>
          <Descriptions.Item label="NIK / KTP">
            {record.Debitur?.nik}
          </Descriptions.Item>
          <Descriptions.Item label="Nomor CIF">
            `{record.Debitur?.cif || "-"}`
          </Descriptions.Item>
          <Descriptions.Item label="Tempat, Tanggal Lahir">
            {`${record.Debitur.birthplace}, ${moment(record.Debitur.birthdate).format("DD-MM-YYYY")}`}
          </Descriptions.Item>
          <Descriptions.Item label="Alamat">
            {record.Debitur.address || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="No Telepon">
            {record.Debitur.phone || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {record.Debitur.email || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Jenis Pemohon">
            {record.Debitur.SubmissionType.name}
          </Descriptions.Item>
        </Descriptions>

        <Divider titlePlacement="left" plain>
          <div className="flex gap-2 items-center">
            <BookPlus size={15} /> Data Permohonan
          </div>
        </Divider>
        <Descriptions bordered size="small" column={{ xl: 2, xs: 1 }}>
          <Descriptions.Item label="Kategori Berkas">
            **{record.Product.ProductType?.name}**
          </Descriptions.Item>
          <Descriptions.Item label="Produk">
            {record.Product.name}
          </Descriptions.Item>
          <Descriptions.Item label="Tanggal Permohonan">
            `{moment(record.created_at).format("DD-MM-YYYY")}`
          </Descriptions.Item>
          <Descriptions.Item label="Nilai">
            Rp. {IDRFormat(record.value)}
          </Descriptions.Item>
          <Descriptions.Item label="Tenor">
            {record.tenor} Bulan
          </Descriptions.Item>
          <Descriptions.Item label="Tujuan Penggunaan">
            {record.purpose}
          </Descriptions.Item>
          <Descriptions.Item label="No Rekening">
            {record.account_number}
          </Descriptions.Item>
          <Descriptions.Item label="No Lemari">
            {record.drawer_code}
          </Descriptions.Item>
          <Descriptions.Item label="Mitra">
            {record.Mitra?.name}
          </Descriptions.Item>
          <Descriptions.Item label="Kantor Bayar">
            {record.PayOffice?.name}
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 16, textAlign: "right" }}>
          {record.coments && record.coments.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-linear-to-r from-yellow-50 to-amber-50 p-6 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <MessageSquare size={20} className="text-yellow-600" />
                  Komentar ({record.coments.length})
                </h2>
              </div>

              <div className="p-6 space-y-4">
                {record.coments.map((comment, index) => (
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
                            ? moment(comment.date).format("DD MMMM YYYY HH:mm")
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
        </div>

        {/* ROW 4: DAFTAR FILE DIGITAL */}
        <Divider titlePlacement="left" plain>
          <FilePdfOutlined /> Dokumen Elektronik (E-Files)
        </Divider>
        <FileArchiveSection record={record} />

        <div style={{ marginTop: 16, textAlign: "right" }}>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Petugas EArsip: **{record.User?.fullname}**
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export const FileArchiveSection = ({ record }: { record: any }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);
  const { user, hasAccess } = useContext((state: any) => state);

  // Prevent keyboard shortcuts when preview is open
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+S, Ctrl+Shift+S, Ctrl+Shift+I, Ctrl+Shift+C
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "s" ||
          e.key === "S" ||
          e.key === "i" ||
          e.key === "I" ||
          e.key === "c" ||
          e.key === "C")
      ) {
        e.preventDefault();
      }
    };

    if (previewOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [previewOpen]);

  // Fungsi untuk membuka preview PDF
  const handlePreview = async (
    url: string,
    name: string,
    type: string,
    ptypefile?: string,
  ) => {
    if (ptypefile) {
      const allFiles = await MergePDFs(
        record.Product?.ProductType?.ProductTypeFile.find(
          (t: IProductTypeFile) => t.id === ptypefile,
        )?.Files.map((f: IFile) => f.url),
      );
      setCurrentFile({ url: allFiles || "", name, type });
    } else {
      setCurrentFile({ url, name, type });
    }
    setPreviewOpen(true);
  };

  const handleDownload = async (
    url: string,
    fileName: string,
    fileId?: string,
    isOneTimeDownload?: boolean,
  ) => {
    try {
      // Membuat elemen link sementara untuk download
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Mark as downloaded (remove user from allow_download) jika one-time download
      if (isOneTimeDownload && fileId) {
        await api
          .request({
            url: `${import.meta.env.VITE_API_URL}/file?id=${fileId}`,
            method: "PATCH",
          })
          .then(() => {
            // Silently update - user sudah selesai download
          })
          .catch((err) => {
            console.error("Failed to mark download:", err);
            // Continue anyway - download already happened
          });
      }
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  const productFiles =
    record.Product?.ProductType?.ProductTypeFile.map((p: IProductTypeFile) => {
      return {
        ...p,
        ...(p.type === "pdf" &&
          p.Files.length !== 0 && {
            Files: p.Files &&
              p.Files.length !== 0 && [
                {
                  id: p.id + "1",
                  name: "Semua File",
                  allow_download: "",
                  url: "",
                },
                ...p.Files,
              ],
          }),
      };
    }) || [];

  if (productFiles.length === 0)
    return <Empty description="Tidak ada kategori dokumen" />;

  // Convert productFiles to Collapse items format
  const collapseItems = productFiles.map(
    (category: IProductTypeFile, idx: number) => ({
      key: idx.toString(),
      label: (
        <Space>
          <FolderOpenFilled style={{ color: "#faad14" }} />
          <Text strong>{category.name}</Text>
          <Badge
            count={category.Files?.length || 0}
            showZero
            color="#0958d9"
            size="small"
          />
        </Space>
      ),
      children: (
        <Row gutter={[12, 12]}>
          {category.Files?.map((file: IFile) => (
            <Col key={file.id} xs={24} sm={12}>
              <Card size="small" hoverable styles={{ body: { padding: 12 } }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {/* Avatar / Icon */}
                    <Avatar
                      shape="square"
                      icon={<FilePdfOutlined />}
                      style={{
                        backgroundColor: "#fff1f0",
                        color: "#ff4d4f",
                        marginRight: 12,
                        flexShrink: 0,
                      }}
                    />

                    {/* Nama File */}
                    <Text
                      ellipsis={{ tooltip: file.name }}
                      style={{ fontSize: "13px", fontWeight: 500 }}
                    >
                      {file.name}
                    </Text>
                  </div>

                  <div className="flex gap-1">
                    <Tooltip title="Preview PDF">
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() =>
                          handlePreview(
                            file.url,
                            file.name,
                            category.type,
                            file.name === "Semua File"
                              ? category.id
                              : undefined,
                          )
                        }
                      ></Button>
                    </Tooltip>
                    <Tooltip
                      title={
                        user &&
                        (file.allow_download.split(",").includes(user.id) ||
                          hasAccess("/app/earsip/submission", "download") ||
                          record.userId === user.id)
                          ? "Download PDF"
                          : "Anda tidak memiliki akses untuk download file ini"
                      }
                    >
                      <Button
                        size="small"
                        icon={<PrinterOutlined />}
                        onClick={() => {
                          // Determine if this is a one-time download (from permit)
                          const isOneTimeDownload =
                            file.allow_download
                              .split(",")
                              .includes(user?.id || "") &&
                            record.userId !== user?.id &&
                            !hasAccess("/app/earsip/submission", "download");
                          handleDownload(
                            file.url,
                            file.name,
                            file.id,
                            isOneTimeDownload,
                          );
                        }}
                        disabled={
                          !user ||
                          (!file.allow_download.split(",").includes(user.id) &&
                            !hasAccess("/app/earsip/submission", "download") &&
                            record.userId !== user.id)
                        }
                      ></Button>
                    </Tooltip>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ),
      style: {
        marginBottom: 10,
        background: "#fafafa",
        borderRadius: "8px",
      },
    }),
  );

  return (
    <div style={{ marginTop: 16 }}>
      <Collapse
        defaultActiveKey={["0"]}
        expandIconPlacement="start"
        ghost
        className="archive-collapse"
        items={collapseItems}
      />

      {/* Modal untuk Preview PDF */}
      <Modal
        title={currentFile?.name}
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width="80%"
        style={{ top: 20 }}
        styles={{ body: { height: "80vh", padding: 0 } }}
        destroyOnHidden
      >
        {currentFile && (
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "#f0f0f0",
            }}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            onDragOver={(e) => e.preventDefault()}
          >
            {currentFile.type === "video" ||
            currentFile.url.match(/\.(mp4|webm|ogg)$/i) ? (
              <video
                controls
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#000",
                  userSelect: "none",
                }}
              >
                <source src={currentFile.url} type="video/mp4" />
                Browser Anda tidak mendukung tag video.
              </video>
            ) : currentFile.type === "image" ||
              currentFile.url.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
              <img
                src={currentFile.url}
                alt={currentFile.name}
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                onMouseDown={(e) => e.preventDefault()}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
            ) : (
              <iframe
                src={`${currentFile.url}#toolbar=0&navpanes=0&scrollbar=0`}
                width="100%"
                height="100%"
                style={{ border: "none" }}
                title="File Preview"
                onContextMenu={(e) => e.preventDefault()}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export const MergePDFs = async (urls: string[]) => {
  if (!urls || urls.length === 0) return null;
  if (urls.length === 1) return urls[0];

  try {
    const mergedPdf = await PDFDocument.create();

    for (const url of urls) {
      // 1. Ambil data PDF dari URL
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Gagal mengambil PDF dari: ${url}`);

      const fileArrayBuffer = await response.arrayBuffer();

      // 2. Load dan copy halaman
      const pdf = await PDFDocument.load(fileArrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    // 3. Simpan dan buat Blob URL
    const pdfBytes = await mergedPdf.save();
    const pdfBuffer = new Uint8Array(pdfBytes); // Solusi error TypeScript sebelumnya
    const blob = new Blob([pdfBuffer], { type: "application/pdf" });

    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error merging PDFs:", error);
    return null;
  }
};
