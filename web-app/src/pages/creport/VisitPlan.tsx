import {
  Button,
  DatePicker,
  Input,
  Popover,
  Select,
  Table,
  Tooltip,
  type TableProps,
} from "antd";
import { Plus, Trash, Filter, CalendarArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
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
    limit: 50,
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
  const { hasAccess } = useContext((state: any) => state);
  const [subTypes, setSubTypes] = useState<ISubType[]>([]);
  const [visitStatuses, setVisitStatuses] = useState<IVisitStatus[]>([]);
  const [visitPurposes, setVisitPurposes] = useState<IVisitPurpose[]>([]);
  const [visitCategories, setVisitCategories] = useState<IVisitCategory[]>([]);

  const getData = async () => {
    setLoading(true);

    await api
      .request({
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
    (async () => {
      await api
        .request({
          method: "GET",
          url: "/visit_category",
        })
        .then((res) => setVisitCategories(res.data.data));
      await api
        .request({
          method: "GET",
          url: "/visit_status",
        })
        .then((res) => setVisitStatuses(res.data.data));
      await api
        .request({
          method: "GET",
          url: "/visit_purpose",
        })
        .then((res) => setVisitPurposes(res.data.data));
      await api
        .request({
          method: "GET",
          url: "/sub_type",
        })
        .then((res) => setSubTypes(res.data.data));
    })();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await getData();
    }, 200);
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

  const columns: TableProps<IVisit>["columns"] = [
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
      render(value, record, _index) {
        return (
          <div>
            <div>{value}</div>
            <div className="text-xs opacity-80">@{record.Debitur.nik}</div>
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
      render(_value, record, _index) {
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
      render(_value, record, _index) {
        return (
          <div>
            <div className="flex gap-2 items-center">
              <CalendarArrowUp size={10} />{" "}
              {moment(record.date_plan).format("DD/MM/YY HH:mm")}
            </div>
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
      render(_value, record, _index) {
        return (
          <CollapseList
            items={
              record.coments
                ? record.coments.map(
                    (c) =>
                      `${c.name} as ${moment(c.date).format("YYYY/MM/DD HH:mm")}: ${c.comment}`,
                  )
                : []
            }
          />
        );
      },
    },
    {
      title: "Petugas",
      key: "user",
      dataIndex: "user",
      render(_value, record, _index) {
        return (
          <div>
            <div>{record.User.fullname}</div>
            <div className="text-xs opacity-80">@{record.User.username}</div>
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
                onClick={() => setAction({ ...action, delete: true, record })}
              ></Button>
            )}
          </div>
        );
      },
    },
  ];

  const content = (
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
            setPageprops({ ...pageprops, submissionTypeId: val })
          }
          allowClear
          value={pageprops.submissionTypeId}
          optionFilterProp={"label"}
          showSearch
          size="small"
        />
      </div>
      <div className="flex flex-col w-full">
        <label className="mb-1 font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Kategori Kunjungan
        </label>
        <Select
          placeholder="Pilih kategori kunjungan..."
          className="w-full"
          options={visitCategories.map((t) => ({ label: t.name, value: t.id }))}
          onChange={(val) =>
            setPageprops({ ...pageprops, visitCategoryId: val })
          }
          allowClear
          value={pageprops.visitCategoryId}
          optionFilterProp={"label"}
          showSearch
          size="small"
        />
      </div>
      <div className="flex flex-col w-full">
        <label className="mb-1 font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
          Tujuan Kunjungan
        </label>
        <Select
          placeholder="Pilih tujuan kunjungan..."
          className="w-full"
          options={visitPurposes.map((t) => ({ label: t.name, value: t.id }))}
          onChange={(val) =>
            setPageprops({ ...pageprops, visitPurposeId: val })
          }
          allowClear
          value={pageprops.visitPurposeId}
          optionFilterProp={"label"}
          showSearch
          size="small"
        />
      </div>
      <div className="flex flex-col w-full">
        <label className="mb-1 font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
          Hasil Kunjungan
        </label>
        <Select
          placeholder="Pilih hasil kunjungan..."
          className="w-full"
          options={visitStatuses.map((t) => ({ label: t.name, value: t.id }))}
          onChange={(val) => setPageprops({ ...pageprops, visitStatusId: val })}
          allowClear
          value={pageprops.visitStatusId}
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
              visitCategoryId: "",
              visitStatusId: "",
              visitPurposeId: "",
              backdate: "",
              submissionTypeId: "",
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
            pageSizeOptions: [50, 100, 500, 1000, 10000],
            size: "small",
            showSizeChanger: true,
          }}
        />
      </div>

      {/* {action.delete && action.record && (
        <DeleteData
          open={action.delete}
          setOpen={(val: boolean) =>
            setAction({ ...action, delete: val, record: undefined })
          }
          record={action.record}
          getData={getData}
          hook={modal}
          key={"delete" + action.record.id}
        />
      )} */}
    </div>
  );
}
