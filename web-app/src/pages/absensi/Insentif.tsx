import {
  Alert,
  App,
  Button,
  DatePicker,
  Input,
  Modal,
  Popconfirm,
  Popover,
  Radio,
  Select,
  Table,
  type TableProps,
} from "antd";
import { Plus, Edit, Trash, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  IActionPage,
  IInsentif,
  IPageProps,
  IUser,
} from "../../libs/interface";
import useContext from "../../libs/context";
import { CollapseText } from "../utils/utilComp";
import moment from "moment";
import dayjs from "dayjs";
import { CloseOutlined, EditOutlined, FileFilled } from "@ant-design/icons";
import api from "../../libs/api";
import { IDRFormat, IDRToNumber, InputUtil } from "../utils/utilForm";
import type { HookAPI } from "antd/es/modal/useModal";
const { RangePicker } = DatePicker;

export default function InsentifPage() {
  const [loading, setLoading] = useState(false);
  const [pageprops, setPageprops] = useState<IPageProps<IInsentif>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
    approve_status: "",
    backdate: "",
  });
  const user = useContext((state: any) => state.user);
  const { modal } = App.useApp();

  const [action, setAction] = useState<IActionPage<IInsentif>>({
    upsert: false,
    delete: false,
    process: false,
    record: undefined,
  });
  const { hasAccess } = useContext((state: any) => state);

  const getData = async () => {
    setLoading(true);

    await api
      .request({
        url: "/insentif",
        method: "GET",
        params: {
          page: pageprops.page,
          limit: pageprops.limit,
          search: pageprops.search,
          approve_status: pageprops.approve_status,
          backdate: pageprops.backdate.toString(),
        },
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
    const timeout = setTimeout(async () => {
      await getData();
    }, 200);
    return () => clearTimeout(timeout);
  }, [
    pageprops.page,
    pageprops.limit,
    pageprops.search,
    pageprops.approve_status,
    pageprops.backdate,
  ]);

  const columns: TableProps<IInsentif>["columns"] = [
    {
      title: "ID",
      key: "id",
      dataIndex: "id",
      fixed: window.innerWidth > 600 ? "left" : undefined,
      render(value, _record, index) {
        return (
          <>
            <div>{(pageprops.page - 1) * pageprops.limit + index + 1}</div>
            <div className="text-xs opacity-80">{value}</div>
          </>
        );
      },
    },
    {
      title: "Pemohon",
      key: "pemohon",
      dataIndex: ["User", "fullname"],
      fixed: window.innerWidth > 600 ? "left" : undefined,
      render(value, record, _index) {
        return (
          <div>
            <div>{value}</div>
            <div className="text-xs opacity-80">@{record.User?.nik}</div>
          </div>
        );
      },
    },
    {
      title: "Permohonan",
      key: "permohonan",
      dataIndex: "name",
      render(value, _record, _index) {
        return (
          <div>
            <div className="font-semibold">{value}</div>
            <div>
              <span>{_record.nominal_type}</span> : {IDRFormat(_record.nominal)}{" "}
              {_record.nominal_type === "PERCENT" &&
                `(${IDRFormat(_record.User.salary * (_record.nominal / 100))})`}
            </div>
          </div>
        );
      },
    },
    {
      title: "Keterangan",
      key: "description",
      dataIndex: "description",
      render(value, _record, _index) {
        return <CollapseText text={value || "-"} maxLength={100} />;
      },
    },
    {
      title: "Berkas",
      key: "supporting_documents",
      dataIndex: "supporting_documents",
      render(_value, record, _index) {
        return (
          <a href={record.file || ""} target="_blank" rel="noopener noreferrer">
            <Button
              size="small"
              icon={<FileFilled />}
              disabled={!record.file}
            ></Button>
          </a>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "status",
      render(_value, record, _index) {
        return (
          <div>
            <div
              className={`px-2 py-1 rounded text-xs font-semibold w-max ${
                record.approve_status === "DISETUJUI"
                  ? "bg-green-100 text-green-800"
                  : record.approve_status === "DITOLAK"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {record.approve_status}
            </div>
          </div>
        );
      },
    },
    {
      title: "LastUpdate",
      key: "created_at",
      dataIndex: "created_at",
      render(_value, record, _index) {
        return (
          <div>
            <div>{moment(record.created_at).format("DD/MM/YY HH:mm")}</div>
            <div className="text-xs opacity-80">
              {moment(record.updated_at).format("DD/MM/YY HH:mm")}
            </div>
          </div>
        );
      },
    },
    {
      title: "Aksi",
      key: "action",
      dataIndex: "action",
      render(_value, record, _index) {
        return (
          <div className="flex items-center gap-1">
            {hasAccess(window.location.pathname, "update") && (
              <Button
                icon={<EditOutlined size={15} />}
                size="small"
                type="primary"
                onClick={() => setAction({ ...action, upsert: true, record })}
                disabled={record.approve_status !== "PENDING"}
              ></Button>
            )}
            {hasAccess(window.location.pathname, "proses") && (
              <Button
                icon={<Edit size={15} />}
                size="small"
                type="primary"
                onClick={() => setAction({ ...action, process: true, record })}
                disabled={record.approve_status !== "PENDING"}
              ></Button>
            )}
            {hasAccess(window.location.pathname, "delete") && (
              <Popconfirm
                onConfirm={() => handleDelete(record.id)}
                title="Apakah Anda yakin ingin menghapus data ini?"
              >
                <Button
                  icon={<Trash size={15} />}
                  size="small"
                  danger
                  disabled={record.approve_status !== "PENDING"}
                ></Button>
              </Popconfirm>
            )}
          </div>
        );
      },
    },
  ];

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await api
        .request({
          url: "/insentif?id=" + id,
          method: "DELETE",
        })
        .then((res) => {
          modal.success({
            title: "Berhasil",
            content: res.data.msg || "Data berhasil dihapus",
          });
          getData();
        });
      setLoading(false);
    } catch (err) {
      modal.error({
        title: "Gagal menghapus data",
        content:
          (err as any).response.data.msg ||
          "Terjadi kesalahan saat menghapus data",
      });
      console.log(err);
      setLoading(false);
    }
  };

  const content = (
    <div className="p-2 w-96 max-h-72 overflow-y-auto">
      <div className="flex flex-col w-full">
        <label className="mb-1 font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Status Permohonan
        </label>
        <Select
          placeholder="Pilih status permohonan..."
          className="w-full"
          options={["DISETUJUI", "DITOLAK", "PENDING"].map((t) => ({
            label: t,
            value: t,
          }))}
          onChange={(val) =>
            setPageprops({ ...pageprops, approve_status: val })
          }
          allowClear
          value={pageprops.approve_status}
          optionFilterProp={"label"}
          showSearch
          size="small"
        />
      </div>
      <div className="flex flex-col w-full">
        <label className="mb-1 font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
          Periode Tanggal
        </label>
        <RangePicker
          value={
            pageprops.backdate && [
              dayjs(pageprops.backdate[0]),
              dayjs(pageprops.backdate[1]),
            ]
          }
          onChange={(_date, datestr) =>
            setPageprops({ ...pageprops, backdate: datestr })
          }
          size="small"
          style={{ width: "100%" }}
        />
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          size="small"
          danger
          icon={<CloseOutlined />}
          onClick={() =>
            setPageprops({
              ...pageprops,
              backdate: "",
              permit_status: "",
            })
          }
        >
          Reset Filter
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Data Insentif
          </h1>
          <p className="text-slate-500 text-sm">
            Kelola data insentif karyawan dengan mudah dan efisien
          </p>
        </div>
      </div>

      {/* --- FILTER & SEARCH --- */}
      <div className="bg-white p-2 rounded-lg shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <div className="flex gap-2">
            {hasAccess(window.location.pathname, "write") && (
              <Button
                icon={<Plus size={14} />}
                type="primary"
                size="small"
                className="flex items-center gap-1 text-sm"
                onClick={() =>
                  setAction({ ...action, upsert: true, record: undefined })
                }
              >
                Tambah
              </Button>
            )}{" "}
          </div>
          <div className="flex-1 flex items-center gap-2 justify-end flex-wrap">
            <Input.Search
              type="text"
              placeholder="Cari nama/ID/NIK..."
              className="transition-all"
              size="small"
              style={{ width: "auto", minWidth: 180 }}
              onChange={(e) =>
                setPageprops({ ...pageprops, search: e.target.value })
              }
            />
            <Popover
              content={content}
              title="⚙️ Filter Data"
              trigger="click"
              placement="topRight"
            >
              <Button
                size="small"
                type={
                  pageprops.approve_status || pageprops.backdate
                    ? "primary"
                    : "default"
                }
                icon={<Filter size={14} />}
                className="flex items-center gap-1 text-sm"
              >
                Filter
              </Button>
            </Popover>
          </div>
        </div>

        <Table
          size="small"
          loading={loading}
          rowKey={"id"}
          scroll={{
            x: "max-content",
            y: window.innerWidth > 600 ? "53vh" : "65vh",
          }}
          columns={columns}
          dataSource={pageprops.data}
          className="rounded-lg overflow-hidden"
          pagination={{
            current: pageprops.page,
            pageSize: pageprops.limit,
            total: pageprops.total,
            onChange: (page, pageSize) => {
              setPageprops((prev) => ({
                ...prev,
                page,
                limit: pageSize,
              }));
            },
            pageSizeOptions: [50, 100, 500, 1000],
            size: "small",
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </div>
      <UpsertData
        key={action.record ? "upsert" + action.record.id : "create"}
        record={action.record}
        open={action.upsert}
        setOpen={(open) => setAction({ ...action, upsert: open })}
        getData={getData}
        user={user}
        hook={modal}
      />
      {action.record && action.process && (
        <ProsesData
          key={"process" + action.record.id}
          record={action.record}
          open={action.process}
          setOpen={(open) => setAction({ ...action, process: open })}
          getData={getData}
          user={user}
          hook={modal}
        />
      )}
    </div>
  );
}

const UpsertData = ({
  record,
  open,
  setOpen,
  getData,
  user,
  hook,
}: {
  record?: IInsentif;
  open: boolean;
  setOpen: (open: boolean) => void;
  getData: () => void;
  user: IUser;
  hook: HookAPI;
}) => {
  const [data, setData] = useState<IInsentif>(
    record || {
      ...defaultData,
      User: user,
      userId: user.id,
    },
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api
        .request({
          url: "/insentif",
          method: record ? "PUT" : "POST",
          data: data,
        })
        .then((res) => {
          hook.success({
            title: "Berhasil",
            content: res.data.msg || "Data berhasil disimpan",
          });
          setOpen(false);
          getData();
        });
      setLoading(false);
    } catch (err) {
      hook.error({
        title: "Gagal menyimpan data",
        content:
          (err as any).response.data.msg ||
          "Terjadi kesalahan saat menyimpan data",
      });
      console.log(err);
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        record ? "Edit Permohonan Insentif" : "Tambah Permohonan Insentif baru"
      }
      onCancel={() => setOpen(false)}
      onOk={handleSubmit}
      style={{ top: 10 }}
      confirmLoading={loading}
    >
      <div className="flex flex-col gap-4">
        <InputUtil
          type="date"
          value={moment(data.created_at).format("YYYY-MM-DD")}
          label="Tanggal Permohonan"
          required
          layout="horizontal"
          onchage={(e: string) => setData({ ...data, created_at: new Date(e) })}
        />
        <InputUtil
          type="text"
          value={data.User.fullname}
          disabled
          label="Pemohon"
          required
          layout="horizontal"
        />
        <InputUtil
          type="text"
          value={data.name}
          label="Nama Permohonan"
          required
          layout="horizontal"
          onchage={(e: string) => setData({ ...data, name: e })}
        />
        <InputUtil
          type="area"
          value={data.description}
          label="Keterangan"
          layout="horizontal"
          onchage={(e: string) => setData({ ...data, description: e })}
        />
        <InputUtil
          type="option"
          value={data.nominal_type}
          label="Jenis Nominal"
          layout="horizontal"
          options={[
            { label: "RUPIAH", value: "RUPIAH" },
            { label: "PERCENT", value: "PERCENT" },
          ]}
          onchage={(e: string) =>
            setData({ ...data, nominal_type: e as "RUPIAH" | "PERCENT" })
          }
          required
        />
        <InputUtil
          type={data.nominal_type === "RUPIAH" ? "text" : "number"}
          value={
            data.nominal_type === "RUPIAH"
              ? IDRFormat(data.nominal)
              : data.nominal
          }
          onchage={(e: string) =>
            setData({
              ...data,
              nominal:
                data.nominal_type === "RUPIAH"
                  ? IDRToNumber(e || "0")
                  : parseFloat(e || "0"),
            })
          }
          label="Nominal"
          layout="horizontal"
          required
        />
        <InputUtil
          type="upload"
          value={data.file}
          label="File Pendukung"
          layout="horizontal"
          onchage={(e: string | null) => setData({ ...data, file: e })}
        />
      </div>
      <div className="mt-4 italic text-xs text-yellow-500">
        Tanggal mulai & tanggal selesai bisa dikosongkan jika hanya satu hari
      </div>
    </Modal>
  );
};

const ProsesData = ({
  record,
  open,
  setOpen,
  getData,
  user,
  hook,
}: {
  record: IInsentif;
  open: boolean;
  setOpen: (open: boolean) => void;
  getData: () => void;
  user: IUser;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IInsentif>({
    ...record,
    approve_status: "DISETUJUI",
  });
  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api
        .request({
          url: "/insentif?id=" + record.id,
          method: "PUT",
          data: { ...data, approverById: user.id },
        })
        .then((res) => {
          hook.success({
            title: "Berhasil",
            content: res.data.msg || "Data berhasil diproses",
          });
          setOpen(false);
          getData();
        });
      setLoading(false);
    } catch (err) {
      hook.error({
        title: "Gagal memproses data",
        content:
          (err as any).response.data.msg ||
          "Terjadi kesalahan saat memproses data",
      });
      console.log(err);
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Verifikasi Permohonan Insentif"
      onCancel={() => !loading && setOpen(false)}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Konfirmasi"
      okButtonProps={{
        // Warna tombol mengikuti status yang dipilih
        danger: status === "DITOLAK",
        className:
          status === "DISETUJUI" ? "bg-green-600 hover:bg-green-500" : "",
      }}
      style={{ top: 20 }}
    >
      <div className="flex flex-col gap-5 py-4">
        {/* Ringkasan Karyawan */}
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
          <p className="text-[10px] text-gray-500 uppercase font-bold">
            Nama Karyawan
          </p>
          <p className="text-sm font-semibold text-gray-800">
            {data?.User?.fullname}
          </p>
        </div>

        {/* Pemilihan Status */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-600 uppercase">
            Keputusan
          </label>
          <Radio.Group
            block
            options={[
              { label: "Setujui", value: "DISETUJUI" },
              { label: "Tolak", value: "DITOLAK" },
            ]}
            value={data.approve_status}
            onChange={(e) =>
              setData({ ...data, approve_status: e.target.value })
            }
            optionType="button"
            buttonStyle="solid"
          />
        </div>

        {/* Panel Pengaturan Nominal (Hanya muncul jika DISETUJUI) */}
        <div className="border rounded-lg p-4 bg-white shadow-sm flex flex-col gap-4">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-tight">
            Penyesuaian Insentif
          </p>

          {data.nominal_type === "RUPIAH" && (
            <InputUtil
              label="Nominal Insentif"
              type="text"
              required
              value={IDRFormat(data.nominal)}
              onchage={(e: string) =>
                setData({ ...data, nominal: IDRToNumber(e || "0") })
              }
            />
          )}

          {data.nominal_type === "PERCENT" && (
            <div className="flex flex-col gap-4">
              <InputUtil
                label="Nominal Insentif (%)"
                type="number"
                required
                value={data.nominal}
                onchage={(e: string) =>
                  setData({ ...data, nominal: parseFloat(e || "0") })
                }
              />
              <InputUtil
                label="Nominal Insentif (Rp)"
                type="text"
                required
                value={IDRFormat(
                  (data.User.salary || 0) * (data.nominal / 100),
                )}
                disabled
              />
            </div>
          )}
        </div>

        <Alert
          message={
            data.approve_status === "DISETUJUI"
              ? "Sistem akan memperbarui data absensi dan payroll sesuai nominal di atas."
              : "Permohonan akan dibatalkan tanpa mengubah data payroll."
          }
          type={data.approve_status === "DISETUJUI" ? "info" : "error"}
          showIcon
        />
      </div>
    </Modal>
  );
};

const defaultData: IInsentif = {
  id: "",
  name: "",
  nominal_type: "RUPIAH",
  nominal: 0,
  description: null,
  approve_status: "PENDING",
  file: null,
  status: true,
  created_at: new Date(),
  updated_at: new Date(),
  userId: "",
  User: {} as IUser,
  ApproverBy: {} as IUser,
  approverById: null,
};
