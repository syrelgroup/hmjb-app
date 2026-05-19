import { Button, Input, Popover, Select, Table, type TableProps } from "antd";
import { Filter, ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  IActionPage,
  IDebitur,
  IPageProps,
  ISubType,
} from "../../libs/interface";
import api from "../../libs/api";
import { DetailSubmissionDebt, DetailVisitDebt } from "./DetailDebt";
import { CloseOutlined } from "@ant-design/icons";

export default function DataDebitur() {
  const [loading, setLoading] = useState(false);
  const [pageprops, setPageprops] = useState<IPageProps<IDebitur>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
    submissionTypeId: "",
  });
  const [action, setAction] = useState<IActionPage<IDebitur>>({
    upsert: false,
    delete: false,
    process: false,
    record: undefined,
  });
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
      title: "CIF",
      key: "cif",
      fixed: window.innerWidth > 600 ? "left" : undefined,
      dataIndex: "cif",
    },
    {
      title: "Debitur",
      fixed: window.innerWidth > 600 ? "left" : undefined,
      key: "fullname",
      dataIndex: "fullname",
      render(value, record, _index) {
        return (
          <div>
            <div>{value}</div>
            <div className="text-xs opacity-80">@{record.nik}</div>
          </div>
        );
      },
    },
    {
      title: "Jenis Pemohon",
      key: "jenis_pemohon",
      dataIndex: ["SubmissionType", "name"],
    },
    {
      title: "Jumlah Kunjungan",
      key: "jumlah_kunjungan",
      dataIndex: "jumlah_kunjungan",
      render(_value, record, _index) {
        return (
          <div className="flex gap-2 justify-center">
            <div>{record.Visit.length}</div>
            <Button
              icon={<ReceiptText size={15} />}
              size="small"
              disabled={record.Visit.length === 0}
              onClick={() =>
                setAction({ ...action, upsert: true, record: record })
              }
            ></Button>
          </div>
        );
      },
    },
    {
      title: "Jumlah Rekening",
      key: "jumlah_permohonan",
      dataIndex: "jumlah_permohonan",
      render(_value, record, _index) {
        return (
          <div className="flex gap-2 justify-center">
            <div>{record.Submission.length}</div>
            <Button
              icon={<ReceiptText size={15} />}
              size="small"
              disabled={record.Submission.length === 0}
              onClick={() =>
                setAction({ ...action, process: true, record: record })
              }
            ></Button>
          </div>
        );
      },
    },
  ];

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

  const content = (
    <div className="p-2 w-80">
      <div className="flex flex-col w-full">
        <p className="mb-1">Jenis Pemohon</p>
        <Select
          placeholder="Pilih jenis pemohon.."
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
      <div className="flex justify-end mt-4">
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
          Clear Filter
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Data Debitur
          </h1>
          <p className="text-slate-500 text-sm">Manajemen data debitur.</p>
        </div>
      </div>

      {/* --- FILTER & SEARCH --- */}
      <div className="bg-white p-2">
        <div className="bg-white  flex flex-wrap items-center gap-4 mb-2">
          <div className="flex-1 flex"></div>
          <div className="flex-1 flex items-center justify-end gap-2">
            <Input.Search
              type="text"
              placeholder="Cari Debitur/ID..."
              className="w-full transition-all"
              size="small"
              width={200}
              style={{ width: 200 }}
              onChange={(e) =>
                setPageprops({ ...pageprops, search: e.target.value })
              }
            />
            <Popover
              content={content}
              title="Filter Data"
              trigger="click"
              placement="left"
            >
              <Button
                size="small"
                type={
                  pageprops.productTypeId ||
                  pageprops.productId ||
                  pageprops.guarantee_status ||
                  pageprops.is_active ||
                  pageprops.backdate ||
                  pageprops.submissionTypeId
                    ? "primary"
                    : undefined
                }
              >
                <Filter size={14} /> Filter
              </Button>
            </Popover>
          </div>
        </div>

        <Table
          size="small"
          loading={loading}
          rowKey={"id"}
          bordered
          scroll={{
            x: "max-content",
            // y: window.innerWidth > 600 ? "53vh" : "65vh",
          }}
          columns={columns}
          dataSource={pageprops.data}
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
      <DetailVisitDebt
        record={action.record?.Visit}
        open={action.upsert}
        setOpen={(val) => setAction({ ...action, upsert: val })}
      />
      <DetailSubmissionDebt
        record={action.record?.Submission}
        open={action.process}
        setOpen={(val) => setAction({ ...action, process: val })}
      />
    </div>
  );
}
