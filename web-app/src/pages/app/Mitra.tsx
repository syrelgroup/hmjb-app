import {
  App,
  Button,
  Divider,
  Input,
  Modal,
  Table,
  Tag,
  Tooltip,
  type TableProps,
} from "antd";
import {
  Plus,
  Edit,
  Trash,
  FileText,
  ExternalLink,
  PlusCircle,
  X,
  Building2,
  Phone,
  FileArchive,
  Handshake,
  Upload,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { IActionPage, IMitra, IPageProps } from "../../libs/interface";
import type { HookAPI } from "antd/es/modal/useModal";
import api from "../../libs/api";
import useContext from "../../libs/context";
import {
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { CollapseText } from "../utils/utilComp";
import { InputFileUploadVisit, InputUtil } from "../utils/utilForm";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FileEntry {
  name: string;
  url: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const parseFiles = (raw: string | null | undefined): FileEntry[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as FileEntry[];
    return [];
  } catch {
    return [{ name: "File", url: raw }];
  }
};

const serializeFiles = (files: FileEntry[]): string => {
  const valid = files.filter((f) => f.url);
  return valid.length ? JSON.stringify(valid) : "";
};

// ─── Section Header ──────────────────────────────────────────────────────────

const SectionHeader = ({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) => (
  <div className="flex items-center gap-2 mb-3">
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        background: "linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%)",
        border: "1px solid #c7d2fe",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#4f46e5",
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div>
      <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "#1e293b" }}>
        {title}
      </p>
      {subtitle && (
        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{subtitle}</p>
      )}
    </div>
  </div>
);

// ─── File Card ───────────────────────────────────────────────────────────────

const FileCard = ({
  file,
  index,
  onUpdate,
  onRemove,
}: {
  file: FileEntry;
  index: number;
  onUpdate: (patch: Partial<FileEntry>) => void;
  onRemove: () => void;
}) => {
  const hasFile = !!file.url;

  return (
    <div
      style={{
        border: `1.5px solid ${hasFile ? "#bbf7d0" : "#e2e8f0"}`,
        borderRadius: 10,
        background: hasFile ? "#f0fdf4" : "#fafafa",
        padding: "10px 12px",
        transition: "all 0.2s",
      }}
    >
      {/* Header baris */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: hasFile ? "#dcfce7" : "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {hasFile ? (
              <CheckCircle2 size={13} color="#16a34a" />
            ) : (
              <Clock size={13} color="#94a3b8" />
            )}
          </div>
          <span
            style={{ fontSize: 11, color: hasFile ? "#16a34a" : "#94a3b8" }}
          >
            {hasFile ? "Berkas tersedia" : "Belum diunggah"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {hasFile && (
            <Tooltip title="Buka file">
              <a href={file.url} target="_blank" rel="noreferrer">
                <Button
                  size="small"
                  icon={<ExternalLink size={12} />}
                  style={{ height: 24, padding: "0 6px", fontSize: 11 }}
                >
                  Lihat
                </Button>
              </a>
            </Tooltip>
          )}
          <Tooltip title="Hapus berkas ini">
            <Button
              size="small"
              danger
              type="text"
              icon={<X size={13} />}
              onClick={onRemove}
              style={{ height: 24, width: 24, padding: 0 }}
            />
          </Tooltip>
        </div>
      </div>

      {/* Input nama */}
      <div style={{ marginBottom: 8 }}>
        <label
          style={{
            fontSize: 11,
            color: "#64748b",
            fontWeight: 500,
            display: "block",
            marginBottom: 3,
          }}
        >
          Nama Dokumen
        </label>
        <Input
          size="small"
          placeholder="mis. PKS, BPKB, SK Pensiun..."
          value={file.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          prefix={<FileText size={11} color="#94a3b8" />}
          style={{ fontSize: 12 }}
        />
      </div>

      {/* Upload widget */}
      <div>
        <label
          style={{
            fontSize: 11,
            color: "#64748b",
            fontWeight: 500,
            display: "block",
            marginBottom: 3,
          }}
        >
          File (PDF / Gambar)
        </label>
        <InputFileUploadVisit
          filetype="application/pdf, image/*"
          record={{ name: file.name || `Berkas ${index + 1}`, url: file.url }}
          ondelete={() => onUpdate({ url: "" })}
          onchange={(e: { name: string; url: string | null }) =>
            onUpdate({ url: e.url ?? "" })
          }
          noname
        />
      </div>
    </div>
  );
};

// ─── FileList Editor ─────────────────────────────────────────────────────────

const FileListEditor = ({
  files,
  onChange,
}: {
  files: FileEntry[];
  onChange: (files: FileEntry[]) => void;
}) => {
  const update = (index: number, patch: Partial<FileEntry>) =>
    onChange(files.map((f, i) => (i === index ? { ...f, ...patch } : f)));

  const remove = (index: number) =>
    onChange(files.filter((_, i) => i !== index));

  const add = () => onChange([...files, { name: "", url: "" }]);

  const uploadedCount = files.filter((f) => f.url).length;

  return (
    <div>
      <SectionHeader
        icon={<FileArchive size={15} />}
        title="Berkas Dokumen"
        subtitle={
          files.length
            ? `${uploadedCount} dari ${files.length} berkas tersedia`
            : "Belum ada berkas"
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {files.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "20px 16px",
              border: "1.5px dashed #e2e8f0",
              borderRadius: 10,
              color: "#94a3b8",
            }}
          >
            <Upload size={22} style={{ marginBottom: 6, opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: 12 }}>
              Klik <strong>Tambah Berkas</strong> untuk melampirkan dokumen
            </p>
          </div>
        )}

        {files.map((file, i) => (
          <FileCard
            key={i}
            file={file}
            index={i}
            onUpdate={(patch) => update(i, patch)}
            onRemove={() => remove(i)}
          />
        ))}
      </div>

      <Button
        size="small"
        type="dashed"
        icon={<PlusCircle size={13} />}
        onClick={add}
        style={{ marginTop: 10, width: "100%", height: 32, fontSize: 12 }}
      >
        Tambah Berkas
      </Button>
    </div>
  );
};

// ─── FileList Display (kolom tabel) ──────────────────────────────────────────

const FileListDisplay = ({ raw }: { raw: string | null | undefined }) => {
  const files = parseFiles(raw);
  if (!files.length)
    return <span style={{ color: "#cbd5e1", fontSize: 11 }}>—</span>;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
      {files.map((f, i) => (
        <Tooltip key={i} title={f.url || "Belum ada URL"}>
          <a
            href={f.url || undefined}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => !f.url && e.preventDefault()}
          >
            <Tag
              icon={<FileText size={10} />}
              color={f.url ? "blue" : "default"}
              style={{
                cursor: f.url ? "pointer" : "default",
                fontSize: 10,
                margin: 0,
              }}
            >
              {f.name || `File ${i + 1}`}
            </Tag>
          </a>
        </Tooltip>
      ))}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DataMitra() {
  const [loading, setLoading] = useState(false);
  const [pageprops, setPageprops] = useState<IPageProps<IMitra>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
  });
  const [action, setAction] = useState<IActionPage<IMitra>>({
    upsert: false,
    delete: false,
    process: false,
    record: undefined,
  });
  const { modal } = App.useApp();
  const { hasAccess } = useContext((state: any) => state);

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageprops.page.toString());
    params.append("limit", pageprops.limit.toString());
    if (pageprops.search) params.append("search", pageprops.search);
    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/mitra?${params}`,
        method: "GET",
      })
      .then((res) =>
        setPageprops((prev) => ({
          ...prev,
          data: res.data.data,
          total: res.data.total,
        })),
      );
    setLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(getData, 200);
    return () => clearTimeout(t);
  }, [pageprops.page, pageprops.limit, pageprops.search]);

  const columns: TableProps<IMitra>["columns"] = [
    {
      title: "ID",
      key: "id",
      dataIndex: "id",
      render(value, _r, index) {
        return (
          <>
            <div>{(pageprops.page - 1) * pageprops.limit + index + 1}</div>
            <div className="text-xs opacity-60">{value}</div>
          </>
        );
      },
    },
    {
      title: "Nama Mitra",
      key: "name",
      render(_v, record) {
        return (
          <>
            <div className="font-medium">{record.name}</div>
            <div className="text-xs opacity-60">@{record.code}</div>
          </>
        );
      },
    },
    {
      title: "Kontak",
      key: "contact",
      render(_v, record) {
        return (
          <div className="flex flex-col gap-0.5 text-xs opacity-80">
            <span>
              <PhoneOutlined /> {record.phone || "—"}
            </span>
            <span>
              <MailOutlined /> {record.email || "—"}
            </span>
            <span>
              <EnvironmentOutlined /> {record.address || "—"}
            </span>
            <span>
              <UserOutlined /> {record.pic || "—"}
            </span>
          </div>
        );
      },
    },
    {
      title: "Kerjasama",
      key: "contract",
      render(_v, record) {
        return (
          <>
            <div className="text-sm">No: {record.no_contract || "—"}</div>
            <div className="text-xs opacity-60 mb-1">
              Lemari: {record.drawer_code || "—"}
            </div>
            <FileListDisplay raw={record.file} />
          </>
        );
      },
    },
    {
      title: "Keterangan",
      key: "desc",
      render(_v, record) {
        return <CollapseText text={record.description || ""} />;
      },
    },
    {
      title: "Aksi",
      key: "action",
      render(_v, record) {
        return (
          <div className="flex items-center gap-1">
            {hasAccess(window.location.pathname, "update") && (
              <Button
                icon={<Edit size={15} />}
                size="small"
                type="primary"
                onClick={() => setAction({ ...action, upsert: true, record })}
              />
            )}
            {hasAccess(window.location.pathname, "delete") && (
              <Button
                icon={<Trash size={15} />}
                size="small"
                danger
                onClick={() => setAction({ ...action, delete: true, record })}
              />
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          Data Mitra
        </h1>
        <p className="text-slate-500 text-sm">Manajemen data mitra.</p>
      </div>
      <div className="bg-white p-2">
        <div className="flex flex-wrap items-center gap-4 mb-2">
          <div className="flex-1 flex">
            {hasAccess(window.location.pathname, "write") && (
              <Button
                onClick={() => setAction({ ...action, upsert: true })}
                icon={<Plus size={15} />}
                type="primary"
                size="small"
              >
                New
              </Button>
            )}
          </div>
          <Input.Search
            placeholder="Cari mitra..."
            size="small"
            style={{ width: 200 }}
            onChange={(e) =>
              setPageprops({ ...pageprops, search: e.target.value })
            }
          />
        </div>
        <Table
          size="small"
          loading={loading}
          rowKey="id"
          bordered
          scroll={{ x: "max-content" }}
          columns={columns}
          dataSource={pageprops.data}
          pagination={{
            current: pageprops.page,
            pageSize: pageprops.limit,
            total: pageprops.total,
            onChange: (page, pageSize) =>
              setPageprops((p) => ({ ...p, page, limit: pageSize })),
            pageSizeOptions: [50, 100, 500, 1000],
            size: "small",
            showSizeChanger: true,
          }}
        />
      </div>
      <UpsertData
        open={action.upsert}
        setOpen={(val) =>
          setAction({ ...action, upsert: val, record: undefined })
        }
        record={action.record}
        getData={getData}
        hook={modal}
        key={action.record ? "upsert" + action.record.id : "upsert"}
      />
      {action.delete && action.record && (
        <DeleteData
          open={action.delete}
          setOpen={(val) =>
            setAction({ ...action, delete: val, record: undefined })
          }
          record={action.record}
          getData={getData}
          hook={modal}
          key={"delete" + action.record.id}
        />
      )}
    </div>
  );
}

// ─── UpsertData Modal ─────────────────────────────────────────────────────────

const FIELD_LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  color: "#64748b",
  fontWeight: 500,
  marginBottom: 2,
  display: "block",
};

const UpsertData = ({
  open,
  setOpen,
  record,
  getData,
  hook,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  record?: IMitra;
  getData: () => Promise<void>;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileEntry[]>(() =>
    parseFiles(record?.file),
  );
  const [data, setData] = useState<IMitra>(() => ({
    ...defaultData,
    ...record,
  }));

  const set = (patch: Partial<IMitra>) => setData((p) => ({ ...p, ...patch }));

  const handleSubmit = async () => {
    if (!data.name) {
      hook.error({ title: "ERROR", content: "Nama Mitra wajib diisi!" });
      return;
    }
    setLoading(true);
    const payload: IMitra = { ...data, file: serializeFiles(files) };
    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/mitra?id=${record?.id ?? ""}`,
        method: record ? "PUT" : "POST",
        data: payload,
        headers: { "Content-Type": "application/json" },
      })
      .then(async (res) => {
        if (res.status === 200 || res.status === 201) {
          hook.success({ title: "BERHASIL", content: res.data.msg });
          setOpen(false);
          await getData();
        } else {
          hook.error({ title: "ERROR", content: res.data.msg });
        }
      })
      .catch((err) => {
        console.log(err);
        hook.error({
          title: "ERROR",
          content: err.message ?? "Internal Server Error",
        });
      });
    setLoading(false);
  };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      title={null}
      style={{ top: 20 }}
      width={820}
      footer={null}
      styles={{ body: { padding: 0 } }}
    >
      {/* ── Modal Header ── */}
      <div
        style={{
          padding: "18px 24px 16px",
          background: "linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)",
          borderBottom: "1px solid #e8eeff",
          borderRadius: "8px 8px 0 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#4f46e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Building2 size={18} color="white" />
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontWeight: 700,
                fontSize: 15,
                color: "#1e293b",
              }}
            >
              {record ? "Edit Data Mitra" : "Tambah Mitra Baru"}
            </p>
            {record && (
              <p style={{ margin: 0, fontSize: 12, color: "#6366f1" }}>
                {record.name} · @{record.code}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal Body ── */}
      <div
        style={{ padding: "20px 24px", maxHeight: "70vh", overflowY: "auto" }}
      >
        {/* Seksi 1: Identitas */}
        <SectionHeader
          icon={<Building2 size={15} />}
          title="Identitas Mitra"
          subtitle="Informasi dasar mitra"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "12px 16px",
            marginBottom: 20,
          }}
        >
          <div>
            <label style={FIELD_LABEL_STYLE}>ID Mitra</label>
            <InputUtil
              label=""
              type="text"
              value={data.id}
              placeholder="Otomatis jika dikosongkan"
              onchage={(e: string) => set({ id: e })}
            />
          </div>
          <div>
            <label style={FIELD_LABEL_STYLE}>
              Nama Mitra <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <InputUtil
              label=""
              type="text"
              value={data.name}
              // required
              onchage={(e: string) => set({ name: e })}
            />
          </div>
          <div>
            <label style={FIELD_LABEL_STYLE}>
              Kode Mitra <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <InputUtil
              label=""
              type="text"
              value={data.code}
              // required
              onchage={(e: string) => set({ code: e })}
            />
          </div>
          <div>
            <label style={FIELD_LABEL_STYLE}>PIC</label>
            <InputUtil
              label=""
              type="text"
              value={data.pic}
              onchage={(e: string) => set({ pic: e })}
            />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={FIELD_LABEL_STYLE}>Keterangan</label>
            <InputUtil
              label=""
              type="area"
              value={data.description}
              onchage={(e: string) => set({ description: e })}
            />
          </div>
        </div>

        <Divider style={{ margin: "0 0 16px" }} />

        {/* Seksi 2: Kontak */}
        <SectionHeader
          icon={<Phone size={15} />}
          title="Informasi Kontak"
          subtitle="Alamat & cara menghubungi"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px 16px",
            marginBottom: 20,
          }}
        >
          <div>
            <label style={FIELD_LABEL_STYLE}>No Telepon</label>
            <InputUtil
              label=""
              type="text"
              value={data.phone}
              onchage={(e: string) => set({ phone: e })}
            />
          </div>
          <div>
            <label style={FIELD_LABEL_STYLE}>Email</label>
            <InputUtil
              label=""
              type="text"
              value={data.email}
              onchage={(e: string) => set({ email: e })}
            />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={FIELD_LABEL_STYLE}>Alamat</label>
            <InputUtil
              label=""
              type="area"
              value={data.address}
              onchage={(e: string) => set({ address: e })}
            />
          </div>
        </div>

        <Divider style={{ margin: "0 0 16px" }} />

        {/* Seksi 3: Kerjasama & Berkas */}
        <SectionHeader
          icon={<Handshake size={15} />}
          title="Kerjasama"
          subtitle="Nomor kontrak dan dokumen pendukung"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px 16px",
            marginBottom: 16,
          }}
        >
          <div>
            <label style={FIELD_LABEL_STYLE}>No Kerjasama</label>
            <InputUtil
              label=""
              type="text"
              value={data.no_contract}
              onchage={(e: string) => set({ no_contract: e })}
            />
          </div>
          <div>
            <label style={FIELD_LABEL_STYLE}>No Lemari</label>
            <InputUtil
              label=""
              type="text"
              value={data.drawer_code}
              onchage={(e: string) => set({ drawer_code: e })}
            />
          </div>
        </div>

        {/* Multi-file editor */}
        <div
          style={{
            border: "1.5px solid #e8eeff",
            borderRadius: 12,
            padding: 14,
            background: "#fafbff",
          }}
        >
          <FileListEditor files={files} onChange={setFiles} />
        </div>
      </div>

      {/* ── Modal Footer ── */}
      <div
        style={{
          padding: "14px 24px",
          borderTop: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          background: "#fafafa",
          borderRadius: "0 0 8px 8px",
        }}
      >
        <Button onClick={() => setOpen(false)}>Batal</Button>
        <Button
          type="primary"
          loading={loading}
          disabled={!data.name}
          onClick={handleSubmit}
          style={{ minWidth: 90 }}
        >
          Simpan
        </Button>
      </div>
    </Modal>
  );
};

// ─── DeleteData Modal ─────────────────────────────────────────────────────────

const DeleteData = ({
  open,
  setOpen,
  record,
  getData,
  hook,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  record: IMitra;
  getData: () => Promise<void>;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/mitra?id=${record.id}`,
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })
      .then(async (res) => {
        if (res.status === 200 || res.status === 201) {
          hook.success({ title: "BERHASIL", content: res.data.msg });
          setOpen(false);
          await getData();
        } else {
          hook.error({ title: "ERROR", content: res.data.msg });
        }
      })
      .catch((err) => {
        console.log(err);
        hook.error({
          title: "ERROR",
          content: err.message ?? "Internal Server Error",
        });
      });
    setLoading(false);
  };

  return (
    <Modal
      open={open}
      title="Konfirmasi Hapus"
      onCancel={() => setOpen(false)}
      onOk={handleSubmit}
      okButtonProps={{ loading, danger: true }}
      okText="Hapus"
      cancelText="Batal"
    >
      <div className="p-4">
        <p>
          Konfirmasi hapus data mitra <strong>{record.name}</strong>?
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Semua berkas terkait juga akan dihapus dari catatan.
        </p>
      </div>
    </Modal>
  );
};

// ─── Default data ─────────────────────────────────────────────────────────────

const defaultData: IMitra = {
  id: "",
  name: "",
  code: "",
  email: "",
  phone: "",
  address: "",
  no_contract: "",
  drawer_code: "",
  file: "",
  pic: "",
  description: "",
  status: true,
  created_at: new Date(),
  updated_at: new Date(),
};
