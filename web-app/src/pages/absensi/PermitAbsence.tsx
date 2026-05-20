import {
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
import {
  Plus,
  Edit,
  Trash,
  Filter,
  CalendarArrowUp,
  CalendarArrowDownIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import type {
  IAbsence,
  IActionPage,
  IPageProps,
  IPermitAbsence,
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

export default function PermitAbsence() {
  const [loading, setLoading] = useState(false);
  const [pageprops, setPageprops] = useState<IPageProps<IPermitAbsence>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
    type: "",
    permit_status: "",
    backdate: "",
  });
  const user = useContext((state: any) => state.user);
  const { modal } = App.useApp();

  const [action, setAction] = useState<IActionPage<IPermitAbsence>>({
    upsert: false,
    delete: false,
    process: false,
    record: undefined,
  });
  const { hasAccess } = useContext((state: any) => state);

  const getData = async () => {
    setLoading(true);
    // const params = new URLSearchParams();
    // params.append("page", pageprops.page.toString());
    // params.append("limit", pageprops.limit.toString());
    // if (pageprops.search) params.append("search", pageprops.search);
    // if (pageprops.permit_status)
    //   params.append("permit_status", pageprops.permit_status);
    // if (pageprops.backdate) params.append("backdate", pageprops.backdate);
    // if (pageprops.type) params.append("type", pageprops.type);

    await api
      .request({
        url: "/permit_absence",
        method: "GET",
        params: {
          page: pageprops.page,
          limit: pageprops.limit,
          search: pageprops.search,
          type: pageprops.type,
          permit_status: pageprops.permit_status,
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
    pageprops.type,
    pageprops.permit_status,
    pageprops.backdate,
  ]);

  const columns: TableProps<IPermitAbsence>["columns"] = [
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
      dataIndex: "type",
      render(value, _record, _index) {
        let color = "gray";
        switch (value) {
          case "TERLAMBAT":
            color = "orange";
            break;
          case "CUTI":
            color = "blue";
            break;
          case "SAKIT":
            color = "red";
            break;
          case "LEMBUR":
            color = "green";
            break;
          case "PERDIN":
            color = "indigo";
            break;
        }
        return (
          <div
            className={`px-2 py-1 rounded text-xs font-semibold w-max bg-${color}-100 text-${color}-800`}
          >
            {value}
          </div>
        );
      },
    },
    {
      title: "Keterangan",
      key: "keterangan",
      dataIndex: "description",
      render(value, _record, _index) {
        return <CollapseText text={value || "-"} maxLength={100} />;
      },
    },
    {
      title: "Tanggal Diminta",
      key: "date",
      dataIndex: "start_date",
      render(_value, record, _index) {
        return (
          <div>
            <div className="flex gap-2 items-center">
              <CalendarArrowUp size={10} />{" "}
              {moment(record.start_date).format("DD/MM/YYYY")}
            </div>
            <div className="text-xs opacity-80 flex gap-2 items-center">
              <CalendarArrowDownIcon size={10} />{" "}
              {moment(record.end_date).format("DD/MM/YYYY")}
            </div>
          </div>
        );
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
                record.permit_status === "DISETUJUI"
                  ? "bg-green-100 text-green-800"
                  : record.permit_status === "DITOLAK"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {record.permit_status}
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
                disabled={record.permit_status !== "PENDING"}
              ></Button>
            )}
            {hasAccess(window.location.pathname, "proses") && (
              <Button
                icon={<Edit size={15} />}
                size="small"
                type="primary"
                onClick={() => setAction({ ...action, process: true, record })}
                // disabled={record.permit_status !== "PENDING"}
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
                  disabled={record.permit_status !== "PENDING"}
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
          url: "/permit_absence?id=" + id,
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
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          Tipe Permohonan
        </label>
        <Select
          placeholder="Pilih tipe permohonan..."
          className="w-full"
          options={[
            "TERLAMBAT",
            "CUTI",
            "SAKIT",
            "LEMBUR",
            "PERDIN",
            "PULANG_CEPAT",
          ].map((t) => ({ label: t, value: t }))}
          onChange={(val) => setPageprops({ ...pageprops, type: val })}
          allowClear
          value={pageprops.type}
          optionFilterProp={"label"}
          showSearch
          size="small"
        />
      </div>
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
          onChange={(val) => setPageprops({ ...pageprops, permit_status: val })}
          allowClear
          value={pageprops.permit_status}
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
              type: "",
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
            Data Permohonan Absen
          </h1>
          <p className="text-slate-500 text-sm">
            Monitoring data permohonan absen karyawan HMJB, termasuk cuti,
            sakit, terlambat, lembur, dan perjalanan dinas.
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
            )}
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
                  pageprops.type ||
                  pageprops.permit_status ||
                  pageprops.backdate
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
            // y: window.innerWidth > 600 ? "53vh" : "65vh",
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
          hasAccess={hasAccess(window.location.pathname, "proses")}
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
  record?: IPermitAbsence;
  open: boolean;
  setOpen: (open: boolean) => void;
  getData: () => void;
  user: IUser;
  hook: HookAPI;
}) => {
  const [data, setData] = useState<IPermitAbsence>(
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
          url: "/permit_absence",
          method: record ? "PUT" : "POST",
          data: {
            ...data,
            ...(record && { Absence: { ...user.Absence[0], userId: user.id } }),
          },
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
      title={record ? "Edit Permohonan Absen" : "Tambah Permohonan Absen"}
      onCancel={() => setOpen(false)}
      onOk={handleSubmit}
      style={{ top: 10 }}
      confirmLoading={loading}
    >
      <div className="flex flex-col gap-4">
        <InputUtil
          type="text"
          value={data.User.fullname}
          disabled
          label="Pemohon"
          required
          layout="horizontal"
        />
        <InputUtil
          type="option"
          value={data.type}
          label="Permohonan Izin"
          required
          options={[
            "TERLAMBAT",
            "CUTI",
            "SAKIT",
            "LEMBUR",
            "PERDIN",
            "PULANG_CEPAT",
          ].map((t) => ({ label: t, value: t }))}
          layout="horizontal"
          onchage={(e: string) => setData({ ...data, type: e as any })}
        />
        <InputUtil
          type="area"
          value={data.description}
          label="Keterangan"
          layout="horizontal"
          onchage={(e: string) => setData({ ...data, description: e })}
        />
        <InputUtil
          type="date"
          value={
            moment(data.start_date).isValid()
              ? moment(data.start_date).format("YYYY-MM-DD")
              : null
          }
          label="Tanggal Mulai"
          layout="horizontal"
          onchage={(e: string | null) =>
            setData({ ...data, start_date: e ? new Date(e) : null })
          }
        />
        <InputUtil
          type="date"
          value={
            moment(data.end_date).isValid()
              ? moment(data.end_date).format("YYYY-MM-DD")
              : null
          }
          label="Tanggal Selesai"
          layout="horizontal"
          onchage={(e: string | null) =>
            setData({ ...data, end_date: e ? new Date(e) : null })
          }
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
  hasAccess,
}: {
  record: IPermitAbsence;
  open: boolean;
  setOpen: (open: boolean) => void;
  getData: () => void;
  user: IUser;
  hook: HookAPI;
  hasAccess: boolean;
}) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"DISETUJUI" | "DITOLAK">("DISETUJUI");
  const [absence, setAbsence] = useState<IAbsence>(
    record.start_date
      ? moment(record.start_date).isSame(moment(), "day")
        ? user.Absence[0]
        : defaultAbsence
      : user.Absence[0] || defaultAbsence,
  );

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api
        .request({
          url: "/permit_absence?id=" + record.id,
          method: "PUT",
          data: {
            id: record.id,
            start_date: record.start_date,
            end_date: record.end_date,
            permit_status: status,
            approverById: user.id,
            userId: record.userId,
            Absence: {
              ...absence,
              absence_status: ["TERLAMBAT", "PULANG_CEPAT"].includes(
                record.type,
              )
                ? "HADIR"
                : record.type,
              ...(user.Absence[0] && {
                description: user.Absence[0].description?.includes(record.type)
                  ? user.Absence[0].description
                  : user.Absence[0]?.description?.split(",").length !== 0
                    ? user.Absence[0].description + "," + record.type
                    : record.type,
              }),
            },
          },
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
      title="Verifikasi Permohonan Absen"
      onCancel={() => !loading && setOpen(false)}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Konfirmasi"
      okButtonProps={{
        // Warna tombol mengikuti status yang dipilih
        danger: status === "DITOLAK",
        disabled: !hasAccess || record.permit_status !== "PENDING",
        className:
          status === "DISETUJUI" ? "bg-green-600 hover:bg-green-500" : "",
      }}
      style={{ top: 20 }}
      width={1000}
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex flex-col gap-5 py-4">
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
            <p className="text-[10px] text-gray-500 uppercase font-bold">
              Nama Karyawan
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {record?.User?.fullname}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                Tipe Permohonan
              </p>
              <div className="mt-1">
                <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-blue-100 text-blue-700">
                  {record?.type}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                Tanggal
              </p>
              <p className="text-sm font-semibold text-gray-800">
                {record.start_date && record.end_date ? (
                  <div className="flex gap- 4">
                    <span>
                      {moment(record?.start_date).format("DD/MM/YYYY") || "-"}
                    </span>
                    <span>-</span>
                    <span>
                      {moment(record?.end_date).format("DD/MM/YYYY") || "-"}
                    </span>
                  </div>
                ) : (
                  <div>{moment(record?.created_at).format("DD/MM/YYYY")}</div>
                )}
              </p>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200 flex-1">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
              Alasan / Keterangan
            </p>
            <p className="text-sm text-gray-700 mt-1 italic">
              "{record?.description || "Tidak ada keterangan"}"
            </p>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-5 py-4">
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
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            />
          </div>
          <div className="border rounded-lg p-4 bg-white shadow-sm flex flex-col gap-4">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-tight">
              Penyesuaian Payroll (Rp)
            </p>

            <InputUtil
              label="Potongan Terlambat"
              type="text"
              required
              value={IDRFormat(absence.late_deduction)}
              onchage={(e: string) =>
                setAbsence({
                  ...absence,
                  late_deduction: IDRToNumber(e || "0"),
                })
              }
              disabled={record.type !== "TERLAMBAT"}
            />
            <InputUtil
              label="Potongan Cepat Pulang"
              type="text"
              required
              value={IDRFormat(absence.fast_leave_deduction)}
              onchage={(e: string) =>
                setAbsence({
                  ...absence,
                  fast_leave_deduction: IDRToNumber(e || "0"),
                })
              }
              disabled={record.type !== "PULANG_CEPAT"}
            />
            <InputUtil
              label="Potongan Alpha"
              type="text"
              required
              value={IDRFormat(absence.alpha_deduction)}
              onchage={(e: string) =>
                setAbsence({
                  ...absence,
                  alpha_deduction: IDRToNumber(e || "0"),
                })
              }
              disabled={record.type !== "CUTI" && record.type !== "SAKIT"}
            />
            <InputUtil
              label="Uang Lemburan"
              type="text"
              required
              value={IDRFormat(absence.lemburan)}
              onchage={(e: string) =>
                setAbsence({ ...absence, lemburan: IDRToNumber(e || "0") })
              }
              disabled={record.type !== "LEMBUR"}
            />
          </div>

          {/* <Alert
            message={
              status === "DISETUJUI"
                ? "Sistem akan memperbarui data absensi dan payroll sesuai nominal di atas."
                : "Permohonan akan dibatalkan tanpa mengubah data payroll."
            }
            type={status === "DISETUJUI" ? "info" : "error"}
            showIcon
          /> */}
        </div>
      </div>
    </Modal>
  );
};

const defaultData: IPermitAbsence = {
  id: "",
  type: "TERLAMBAT",
  start_date: null,
  end_date: null,
  description: null,
  permit_status: "PENDING",
  file: null,
  status: true,
  created_at: new Date(),
  updated_at: new Date(),
  userId: "",
  User: {} as IUser,
  ApproverBy: {} as IUser,
  approverById: null,
};

const defaultAbsence: IAbsence = {
  id: "",
  method: "PERMIT",
  check_in: new Date(),
  check_out: null,
  absence_status: "HADIR",
  late_deduction: 0,
  fast_leave_deduction: 0,
  lemburan: 0,
  alpha_deduction: 0,
  description: null,
  status: false,
  created_at: new Date(),
  updated_at: new Date(),
  userId: "",
  User: {} as IUser,
};
