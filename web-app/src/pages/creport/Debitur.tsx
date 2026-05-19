import {
  Button,
  Input,
  Popover,
  Select,
  Table,
  type TableProps,
  Tag,
} from "antd";
import { Plus, Filter, Phone, Mail, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  IDebitur,
  IPageProps,
  ISubType,
  IVisit,
} from "../../libs/interface";
import useContext from "../../libs/context";
import moment from "moment";
import { Link } from "react-router-dom";
import { CloseOutlined } from "@ant-design/icons";
import api from "../../libs/api";
import { IDRFormat } from "../utils/utilForm";

export default function DebiturCallReport() {
  const [loading, setLoading] = useState(false);
  const [pageprops, setPageprops] = useState<IPageProps<IDebitur>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
    submissionTypeId: "",
  });
  const { hasAccess } = useContext((state: any) => state);
  const [subTypes, setSubTypes] = useState<ISubType[]>([]);

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageprops.page.toString());
    params.append("limit", pageprops.limit.toString());
    if (pageprops.search) params.append("search", pageprops.search);
    if (pageprops.submissionTypeId)
      params.append("submissionTypeId", pageprops.submissionTypeId);

    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/debitur?${params.toString()}`,
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
    (async () => {
      await api
        .request({
          method: "GET",
          url: `${import.meta.env.VITE_API_URL}/sub_type`,
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
    pageprops.submissionTypeId,
  ]);

  const columns: TableProps<IDebitur>["columns"] = [
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
      title: "Nama Debitur",
      key: "fullname",
      dataIndex: "fullname",
      fixed: window.innerWidth > 600 ? "left" : undefined,
      render(value, record, _index) {
        return (
          <div>
            <div className="font-semibold">{value}</div>
            <div className="text-xs opacity-80">CIF: {record.cif}</div>
          </div>
        );
      },
    },
    {
      title: "NIK",
      key: "nik",
      dataIndex: "nik",
    },
    {
      title: "Jenis Pemohon",
      key: "submissionType",
      dataIndex: ["SubmissionType", "name"],
      render(value) {
        return <Tag color="blue">{value}</Tag>;
      },
    },
    {
      title: "Kontak",
      key: "contact",
      dataIndex: "phone",
      render(_value, record, _index) {
        return (
          <div className="space-y-1">
            <div className="text-xs flex items-center gap-1">
              <Phone size={12} />
              {record.phone}
            </div>
            <div className="text-xs flex items-center gap-1">
              <Mail size={12} />
              {record.email}
            </div>
          </div>
        );
      },
    },
    {
      title: "Tempat/Tgl Lahir",
      key: "birthdate",
      dataIndex: "birthdate",
      render(_value, record, _index) {
        return (
          <div className="text-xs">
            <div>{record.birthplace}</div>
            <div className="opacity-80">
              {moment(record.birthdate).format("DD/MM/YYYY")}
            </div>
          </div>
        );
      },
    },
    {
      title: "Jumlah Kunjungan",
      key: "visitCount",
      dataIndex: "Visit",
      render(_value, record, _index) {
        const visitCount = record.Visit ? record.Visit.length : 0;
        return (
          <div className="flex items-center justify-center gap-1">
            <Calendar size={14} className="text-blue-600" />
            <span className="font-bold text-blue-600">{visitCount}</span>
          </div>
        );
      },
    },
    {
      title: "Terakhir Diupdate",
      key: "updated_at",
      dataIndex: "updated_at",
      render(_value, record, _index) {
        return (
          <div className="text-xs">
            <div>{moment(record.updated_at).format("DD/MM/YY HH:mm")}</div>
            <div className="opacity-80">
              {moment(record.updated_at).fromNow()}
            </div>
          </div>
        );
      },
    },
  ];

  // Nested visits columns
  const visitColumns: TableProps<IVisit>["columns"] = [
    {
      title: "ID Kunjungan",
      key: "id",
      dataIndex: "id",
      render(value) {
        return <span className="text-xs opacity-80">{value}</span>;
      },
    },
    {
      title: "Tanggal Rencana",
      key: "date",
      dataIndex: "date",
      render(value) {
        return (
          <div className="text-xs flex items-center gap-1">
            <Calendar size={12} />
            {moment(value).format("DD/MM/YYYY")}
          </div>
        );
      },
    },
    {
      title: "Tanggal Aktual",
      key: "date_action",
      dataIndex: "date_action",
      render(value) {
        return (
          <div className="text-xs flex items-center gap-1">
            <Calendar size={12} />
            {moment(value).format("DD/MM/YYYY")}
          </div>
        );
      },
    },
    {
      title: "Jenis/Tujuan Kunjungan",
      key: "purpose",
      dataIndex: "VisitCategory",
      render(_value, record) {
        return (
          <div className="text-xs">
            <div className="font-semibold">{record.VisitCategory?.name}</div>
            <div className="opacity-80">@{record.VisitPurpose?.name}</div>
          </div>
        );
      },
    },
    {
      title: "Status",
      key: "approve_status",
      dataIndex: "approve_status",
      render(_value, record) {
        return <span>{record.VisitStatus?.name}</span>;
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
      title: "Ringkasan",
      key: "summary",
      dataIndex: "summary",
      render(value) {
        const maxLength = 50;
        const text = value || "";
        return (
          <span className="text-xs opacity-80">
            {text.length > maxLength
              ? `${text.substring(0, maxLength)}...`
              : text}
          </span>
        );
      },
    },
  ];

  const content = (
    <div className="p-2 w-96 max-h-96 overflow-y-auto space-y-4">
      <div className="flex flex-col w-full">
        <label className="mb-2 font-semibold text-gray-700 flex items-center gap-2">
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
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          size="small"
          danger
          icon={<CloseOutlined />}
          onClick={() =>
            setPageprops({
              ...pageprops,
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
            Data Debitur Kunjungan
          </h1>
          <p className="text-slate-500 text-sm">Monitoring data debitur</p>
        </div>
      </div>

      {/* --- FILTER & SEARCH --- */}
      <div className="bg-white p-2 rounded-lg shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <div className="flex gap-2">
            {hasAccess(window.location.pathname, "write") && (
              <Link to={"/app/debitur"}>
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
              placeholder="Cari nama/NIK/CIF..."
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
                type={pageprops.submissionTypeId ? "primary" : "default"}
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
          expandable={{
            expandedRowRender: (record) => {
              const visits = record.Visit || [];
              if (visits.length === 0) {
                return (
                  <div className="p-4 text-center text-gray-500">
                    Tidak ada data kunjungan
                  </div>
                );
              }
              return (
                <div className="bg-gray-50 rounded-lg ml-14">
                  <h3 className="font-semibold text-gray-800 mb-3 text-sm">
                    📋 Daftar Kunjungan ({visits.length} kunjungan)
                  </h3>
                  <Table
                    size="small"
                    rowKey="id"
                    columns={visitColumns}
                    dataSource={visits}
                    pagination={false}
                    scroll={{ x: "max-content" }}
                    className="bg-white rounded"
                  />
                </div>
              );
            },
            rowExpandable(record) {
              return record.Visit && record.Visit.length > 0;
            },
          }}
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
          }}
        />
      </div>
    </div>
  );
}
