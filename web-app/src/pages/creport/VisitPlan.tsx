import {
  App,
  Button,
  DatePicker,
  Input,
  Modal,
  Popover,
  Select,
  Table,
  Tooltip,
  type TableProps,
} from "antd";
import { Plus, Trash, Filter, CalendarArrowUp } from "lucide-react";
import { useEffect, useState, useMemo } from "react"; // Tambahkan useMemo
import type {
  IActionPage,
  IPageProps,
  ISubType,
  IVisit,
  IVisitCategory,
  IVisitPurpose,
  IVisitStatus,
} from "../../libs/interface";
import useContext from "../../libs/context";
import { CollapseList } from "../utils/utilComp";
import moment from "moment";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import {
  CloseOutlined,
  EditOutlined,
  FolderOutlined,
  SendOutlined,
} from "@ant-design/icons";
import api from "../../libs/api";
import { IDRFormat } from "../utils/utilForm";
const { RangePicker } = DatePicker;

export default function DataVisitPlan() {
  const [loading, setLoading] = useState(false);
  const [pageprops, setPageprops] = useState<IPageProps<IVisit>>({
    page: 1,
    limit: 10,
    data: [],
    total: 0,
    search: "",
    visitCategoryId: "",
    visitStatusId: "",
    visitPurposeId: "",
    submissionTypeId: "",
    backdate: "",
  });

  const [action, setAction] = useState<IActionPage<IVisit>>({
    upsert: false,
    delete: false,
    process: false,
    record: undefined,
  });
  const { modal } = App.useApp();
  const { hasAccess } = useContext((state: any) => state);

  const [subTypes, setSubTypes] = useState<ISubType[]>([]);
  const [visitStatuses, setVisitStatuses] = useState<IVisitStatus[]>([]);
  const [visitPurposes, setVisitPurposes] = useState<IVisitPurpose[]>([]);
  const [visitCategories, setVisitCategories] = useState<IVisitCategory[]>([]);

  const getData = async () => {
    setLoading(true);
    try {
      const res = await api.request({
        url: "/visit",
        method: "GET",
        params: {
          page: pageprops.page,
          limit: pageprops.limit,
          search: pageprops.search,
          visitCategoryId: pageprops.visitCategoryId,
          visitStatusId: pageprops.visitStatusId,
          visitPurposeId: pageprops.visitPurposeId,
          backdate: pageprops.backdate,
          submissionTypeId: pageprops.submissionTypeId,
          plan: "plan",
        },
      });
      setPageprops((prev) => ({
        ...prev,
        data: res.data.data,
        total: res.data.total,
      }));
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      await Promise.all([
        api
          .request({ method: "GET", url: "/visit_category" })
          .then((res) => setVisitCategories(res.data.data)),
        api
          .request({ method: "GET", url: "/visit_status" })
          .then((res) => setVisitStatuses(res.data.data)),
        api
          .request({ method: "GET", url: "/visit_purpose" })
          .then((res) => setVisitPurposes(res.data.data)),
        api
          .request({ method: "GET", url: "/sub_type" })
          .then((res) => setSubTypes(res.data.data)),
      ]);
    })();
  }, []);

  // OPTIMASI: Tambah jeda waktu menjadi 500ms agar server tidak berat saat mencari nama
  useEffect(() => {
    const timeout = setTimeout(() => {
      getData();
    }, 500);
    return () => clearTimeout(timeout);
  }, [
    pageprops.page,
    pageprops.limit,
    pageprops.search,
    pageprops.visitCategoryId,
    pageprops.visitStatusId,
    pageprops.visitPurposeId,
    pageprops.submissionTypeId,
    pageprops.backdate,
  ]);

  // OPTIMASI: Bungkus columns dengan useMemo agar tidak di-render ulang setiap mengetik pencarian
  const columns: TableProps<IVisit>["columns"] = useMemo(
    () => [
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
        dataIndex: ["Debitur", "fullname"],
        fixed: window.innerWidth > 600 ? "left" : undefined,
        render(value, record) {
          return (
            <div>
              <div>{value}</div>
              <div className="text-xs opacity-80">@{record.Debitur?.nik}</div>
            </div>
          );
        },
      },
      {
        title: "CIF",
        key: "cif",
        dataIndex: ["Debitur", "cif"],
      },
      {
        title: "Jenis Pemohon",
        key: "subType",
        dataIndex: ["Debitur", "SubmissionType", "name"],
      },
      {
        title: "Jenis & Tujuan",
        key: "purpose",
        dataIndex: "purpose",
        render(_value, record) {
          return (
            <div>
              <div>{record.VisitCategory?.name}</div>
              <div className="text-xs opacity-80">
                @{record.VisitPurpose?.name}
              </div>
            </div>
          );
        },
      },
      {
        title: "Tanggal",
        key: "created_at",
        dataIndex: "created_at",
        render(_value, record) {
          return (
            <div className="flex gap-2 items-center">
              <CalendarArrowUp size={10} />
              {moment(record.date_plan).format("DD/MM/YY HH:mm")}
            </div>
          );
        },
      },
      {
        title: "Nilai",
        key: "nilai",
        dataIndex: "nilai",
        render(_value, record) {
          return (
            <div className="text-xs opacity-70">
              <div>Nilai : {IDRFormat(record.value)}</div>
              <div>Realisasi : {IDRFormat(record.realize_value)}</div>
            </div>
          );
        },
      },
      {
        title: "Komentar",
        key: "komentar",
        dataIndex: "coments",
        render(_value, record) {
          return (
            <CollapseList
              items={
                record.coments?.map(
                  (c) =>
                    `${c.name} as ${moment(c.date).format("YYYY/MM/DD HH:mm")}: ${c.comment}`,
                ) || []
              }
            />
          );
        },
      },
      {
        title: "Petugas",
        key: "user",
        dataIndex: "user",
        render(_value, record) {
          return (
            <div>
              <div>{record.User?.fullname}</div>
              <div className="text-xs opacity-80">@{record.User?.username}</div>
            </div>
          );
        },
      },
      {
        title: "LastUpdate",
        key: "created_at",
        dataIndex: "created_at",
        render(_value, record) {
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
        render(_value, record) {
          return (
            <div className="flex items-center gap-1">
              <Link to={"/app/callreport/visit/" + record.id}>
                <Button
                  icon={<FolderOutlined size={15} />}
                  size="small"
                  type="primary"
                ></Button>
              </Link>
              {hasAccess(window.location.pathname, "update") && (
                <Tooltip title="Edit Rencana kunjungan">
                  <Link to={"/app/callreport/visit_plan/upsert/" + record.id}>
                    <Button
                      icon={<EditOutlined />}
                      size="small"
                      type="primary"
                    ></Button>
                  </Link>
                </Tooltip>
              )}
              {hasAccess(window.location.pathname, "update") && (
                <Tooltip title="Update hasil kunjungan">
                  <Link to={"/app/callreport/visit/upsert/" + record.id}>
                    <Button
                      icon={<SendOutlined size={15} />}
                      size="small"
                      type="primary"
                    ></Button>
                  </Link>
                </Tooltip>
              )}
              {hasAccess(window.location.pathname, "delete") && (
                <Button
                  icon={<Trash size={15} />}
                  size="small"
                  danger
                  onClick={() =>
                    setAction((prev) => ({ ...prev, delete: true, record }))
                  }
                ></Button>
              )}
            </div>
          );
        },
      },
    ],
    [pageprops.page, pageprops.limit, action, hasAccess],
  );

  // OPTIMASI: Bungkus Filter Content di dalam useMemo dan atur agar perubahan filter mengubah page kembali ke 1.
  const content = useMemo(
    () => (
      <div className="p-2 w-96 max-h-72 overflow-y-auto">
        <div className="flex flex-col w-full">
          <label className="mb-1 font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Jenis Pemohon
          </label>
          <Select
            placeholder="Pilih jenis pemohon..."
            className="w-full"
            options={subTypes.map((t) => ({ label: t.name, value: t.id }))}
            onChange={(val) =>
              setPageprops((prev) => ({
                ...prev,
                submissionTypeId: val,
                page: 1,
              }))
            } // Reset page ke 1
            allowClear
            value={pageprops.submissionTypeId}
            optionFilterProp={"label"}
            showSearch
            size="small"
          />
        </div>
        <div className="flex flex-col w-full mt-2">
          <label className="mb-1 font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Kategori Kunjungan
          </label>
          <Select
            placeholder="Pilih kategori kunjungan..."
            className="w-full"
            options={visitCategories.map((t) => ({
              label: t.name,
              value: t.id,
            }))}
            onChange={(val) =>
              setPageprops((prev) => ({
                ...prev,
                visitCategoryId: val,
                page: 1,
              }))
            }
            allowClear
            value={pageprops.visitCategoryId}
            optionFilterProp={"label"}
            showSearch
            size="small"
          />
        </div>
        <div className="flex flex-col w-full mt-2">
          <label className="mb-1 font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            Tujuan Kunjungan
          </label>
          <Select
            placeholder="Pilih tujuan kunjungan..."
            className="w-full"
            options={visitPurposes.map((t) => ({ label: t.name, value: t.id }))}
            onChange={(val) =>
              setPageprops((prev) => ({
                ...prev,
                visitPurposeId: val,
                page: 1,
              }))
            }
            allowClear
            value={pageprops.visitPurposeId}
            optionFilterProp={"label"}
            showSearch
            size="small"
          />
        </div>
        <div className="flex flex-col w-full mt-2">
          <label className="mb-1 font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Hasil Kunjungan
          </label>
          <Select
            placeholder="Pilih hasil kunjungan..."
            className="w-full"
            options={visitStatuses.map((t) => ({ label: t.name, value: t.id }))}
            onChange={(val) =>
              setPageprops((prev) => ({ ...prev, visitStatusId: val, page: 1 }))
            }
            allowClear
            value={pageprops.visitStatusId}
            optionFilterProp={"label"}
            showSearch
            size="small"
          />
        </div>
        <div className="flex flex-col w-full mt-2">
          <label className="mb-1 font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            Periode Tanggal
          </label>
          <RangePicker
            value={
              pageprops.backdate
                ? [dayjs(pageprops.backdate[0]), dayjs(pageprops.backdate[1])]
                : undefined
            }
            onChange={(_date, datestr) =>
              setPageprops((prev) => ({ ...prev, backdate: datestr, page: 1 }))
            }
            size="small"
            style={{ width: "100%" }}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={() =>
              setPageprops((prev) => ({
                ...prev,
                visitCategoryId: "",
                visitStatusId: "",
                visitPurposeId: "",
                backdate: "",
                submissionTypeId: "",
                page: 1, // Reset page ke 1
              }))
            }
          >
            Reset Filter
          </Button>
        </div>
      </div>
    ),
    [
      subTypes,
      visitCategories,
      visitPurposes,
      visitStatuses,
      pageprops.submissionTypeId,
      pageprops.visitCategoryId,
      pageprops.visitPurposeId,
      pageprops.visitStatusId,
      pageprops.backdate,
    ],
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Data Rencana Kunjungan
          </h1>
          <p className="text-slate-500 text-sm">
            Buat Daftar rencana kunjungan
          </p>
        </div>
      </div>

      {/* --- FILTER & SEARCH --- */}
      <div className="bg-white p-2 rounded-lg shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <div className="flex gap-2">
            {hasAccess(window.location.pathname, "write") && (
              <Link to={"/app/callreport/visit_plan/upsert"}>
                <Button
                  icon={<Plus size={14} />}
                  type="primary"
                  size="small"
                  className="flex items-center gap-1 text-sm"
                >
                  Tambah
                </Button>
              </Link>
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
                setPageprops((prev) => ({
                  ...prev,
                  search: e.target.value,
                  page: 1,
                }))
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
                  pageprops.submissionTypeId ||
                  pageprops.visitCategoryId ||
                  pageprops.visitStatusId ||
                  pageprops.visitPurposeId ||
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
            y: window.innerWidth > 600 ? "53vh" : "65vh",
          }}
          columns={columns}
          dataSource={pageprops.data}
          className="rounded-lg overflow-hidden"
          pagination={{
            current: pageprops.page,
            pageSize: pageprops.limit,
            total: pageprops.total,
            onChange: (page, pageSize) =>
              setPageprops((prev) => ({ ...prev, page, limit: pageSize })),
            pageSizeOptions: [10, 25, 50, 100, 500, 1000, 10000],
            size: "small",
            showSizeChanger: true,
          }}
        />
      </div>
      {action.delete && action.record && (
        <DeleteData
          open={action.delete}
          setOpen={(val: boolean) =>
            setAction((prev) => ({ ...prev, delete: val, record: undefined }))
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

const DeleteData = ({ open, setOpen, record, getData, hook }: any) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.request({
        url: import.meta.env.VITE_API_URL + "/visit?id=" + record?.id,
        method: "DELETE",
        headers: { "Content-Type": "Application/json" },
      });

      if (res.status === 201 || res.status === 200) {
        hook.success({ title: "BERHASIL", content: res.data.msg });
        setOpen(false);
        getData && (await getData());
      } else {
        hook.error({ title: "ERROR", content: res.data.msg });
      }
    } catch (err: any) {
      console.log(err);
      hook.error({
        title: "ERROR",
        content: err.message || "Internal Server Error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Konfirmasi Hapus"
      onCancel={() => setOpen(false)}
      onOk={handleSubmit}
      okButtonProps={{ loading: loading, danger: true }} // Menambahkan danger (warna merah)
    >
      <div className="p-5">
        <p>
          Konfirmasi hapus data rencana kunjungan debitur{" "}
          <b>{record.Debitur?.fullname}</b>?
        </p>
      </div>
    </Modal>
  );
};
