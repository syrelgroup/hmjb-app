import { useEffect, useState } from "react";
import {
  Table,
  Empty,
  Button,
  Space,
  Modal,
  message,
  Tag,
  Input,
  Popover,
  Select,
  DatePicker,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CloseOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import api from "../../libs/api";
import type { ICollateralLending, IPageProps } from "../../libs/interface";
import moment from "moment";
import { CollapseText } from "../utils/utilComp";
import { Download, Filter } from "lucide-react";
import dayjs from "dayjs";
import useContext from "../../libs/context";
import { ExportData } from "../../libs/helper";
const { RangePicker } = DatePicker;

const CollateralLending = () => {
  const [data, setData] = useState<IPageProps<ICollateralLending>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
    status: "",
    backdate: "",
  });
  const [loading, setLoading] = useState(false);
  const [viewRecord, setViewRecord] = useState<ICollateralLending | null>(null);
  const { hasAccess } = useContext();

  useEffect(() => {
    fetchData();
  }, [data.page, data.limit, data.search, data.status, data.backdate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.request({
        url: "/collateral_lending",
        method: "GET",
        params: {
          page: data.page,
          limit: data.limit,
          search: data.search,
          status: data.status,
          backdate: data.backdate,
        },
      });
      setData((prev) => ({ ...prev, data: res.data.data }));
    } catch (error) {
      message.error("Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Hapus Peminjaman Jaminan",
      content: "Apakah Anda yakin ingin menghapus data ini?",
      okText: "Ya",
      cancelText: "Tidak",
      onOk: async () => {
        try {
          await api.request({
            url: "/collateral_lending",
            method: "DELETE",
            params: { id },
          });
          message.success("Data berhasil dihapus");
          fetchData();
        } catch (error) {
          message.error("Gagal menghapus data");
        }
      },
    });
  };

  const columns: ColumnsType<ICollateralLending> = [
    {
      title: "No",
      render: (_, __, index) => (data.page - 1) * data.limit + index + 1,
      width: 50,
    },
    {
      title: "Nasabah",
      dataIndex: ["Submission", "Debitur", "fullname"],
      key: "nasabah",
      render(_value, record, _index) {
        return (
          <div>
            <div>{record.Submission.Debitur.fullname}</div>
            <div className="text-xs opacity-80">
              @{record.Submission.Debitur.nik}
            </div>
          </div>
        );
      },
    },
    {
      title: "Rekening",
      dataIndex: ["Submission", "Debitur", "nik"],
      key: "nik",
      render(_value, record, _index) {
        return (
          <div>
            <div>ID {record.Submission.id}</div>
            <div className="text-xs opacity-80">
              {record.Submission.Product.name} (
              {record.Submission.Product.ProductType?.name})
            </div>
          </div>
        );
      },
    },
    {
      title: "Mitra",
      dataIndex: ["Submission", "Mitra", "name"],
      key: "mitra",
    },
    {
      title: "Tanggal Rencana",
      dataIndex: "start_at",
      key: "start_at",
      render(_value, record, _index) {
        return (
          <div className="text-xs">
            <div>Pinjam: {moment(record.start_at).format("DD-MM-YYYY")}</div>
            <div>Kembali: {moment(record.end_at).format("DD-MM-YYYY")}</div>
          </div>
        );
      },
    },
    {
      title: "Tanggal Kembali",
      dataIndex: "start_at",
      key: "start_at",
      render(_value, record, _index) {
        return <div>{moment(record.return_at).format("DD-MM-YYYY")}</div>;
      },
    },
    {
      title: "Status",
      dataIndex: "return_at",
      key: "return_at",
      render(_value, record, _index) {
        return (
          <div className="flex justify-center">
            <Tag
              style={{ width: 80, textAlign: "center" }}
              color={record.return_at ? "green" : "orange"}
              variant="solid"
            >
              {record.return_at ? "KEMBALI" : "DIPINJAM"}
            </Tag>
          </div>
        );
      },
    },
    {
      title: "Keterangan",
      key: "desc",
      dataIndex: "description",
      width: 250,
      render(_value, record, _index) {
        return (
          <div className="text-xs opacity-80">
            <CollapseText text={record.description || ""} maxLength={40} />
          </div>
        );
      },
    },
    {
      title: "Aksi",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setViewRecord(record)}
          />
          {hasAccess(window.location.pathname, "update") && (
            <Button
              type="default"
              size="small"
              icon={<EditOutlined />}
              onClick={() =>
                (window.location.href =
                  "/app/earsip/collateral_lending/upsert/" + record.id)
              }
            />
          )}
          {hasAccess(window.location.pathname, "delete") && (
            <Button
              danger
              size="small"
              disabled={record.return_at ? true : false}
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          )}
        </Space>
      ),
    },
  ];

  const content = (
    <div className="p-2 w-80">
      <div className="flex flex-col w-full">
        <p className="mb-1">Status Jaminan</p>
        <Select
          placeholder="Pilih status jaminan.."
          className="w-full"
          options={[
            { label: "DIPINJAM", value: "DIPINJAM" },
            { label: "DIKEMBALIKAN", value: "DIKEMBALIKAN" },
          ]}
          onChange={(val) => setData({ ...data, status: val })}
          allowClear
          value={data.status}
          optionFilterProp={"label"}
          showSearch
          size="small"
        />
      </div>

      <div className="flex flex-col w-full">
        <p className="mb-1">Periode</p>
        <RangePicker
          value={
            data.backdate && [dayjs(data.backdate[0]), dayjs(data.backdate[1])]
          }
          onChange={(_date, datestr) => setData({ ...data, backdate: datestr })}
          size="small"
        />
      </div>
      <div className="flex justify-end mt-4">
        <Button
          size="small"
          danger
          icon={<CloseOutlined />}
          onClick={() =>
            setData({
              ...data,
              backdate: "",
              status: "",
            })
          }
        >
          Clear Filter
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Peminjaman Jaminan</h1>
      </div>

      <div className="flex flex-wrap gap-2 justify-between bg-white p-2 rounded-lg">
        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            size="small"
            onClick={() =>
              (window.location.href = "/app/earsip/collateral_lending/upsert")
            }
          >
            Tambah
          </Button>
          <Button
            size="small"
            icon={<Download size={14} />}
            onClick={() =>
              ExportData(
                data.data.map((d) => ({
                  nasabah: d.Submission.Debitur.fullname,
                  tipe_produk: d.Submission.Product.ProductType?.name,
                  produk: d.Submission.Product.name,
                  mitra: d.Submission.Mitra?.name || "-",
                  tanggal_pinjam: moment(d.start_at).format("DD/MM/YYYY"),
                  rencana_pengambalian: moment(d.end_at).format("DD/MM/YYYY"),
                  status: d.return_at ? "KEMBALI" : "DIPINJAM",
                  tanggal_kembali_aktual: d.return_at
                    ? moment(d.return_at).format("DD/MM/YYYY")
                    : "-",
                })),
                "peminjaman_jaminan",
              )
            }
          >
            Export
          </Button>
        </div>
        <div className="flex items-center justify-end gap-2 mb-2">
          <Input.Search
            type="text"
            placeholder="Cari Nama, NIK, atau ID Debitur..."
            className="w-full transition-all"
            size="small"
            width={200}
            style={{ width: 200 }}
            onChange={(e) => setData({ ...data, search: e.target.value })}
          />
          <Popover
            content={content}
            title="Filter Data"
            trigger="click"
            placement="left"
          >
            <Button
              size="small"
              type={data.status || data.backdate ? "primary" : undefined}
            >
              <Filter size={14} /> Filter
            </Button>
          </Popover>
        </div>

        <Table
          columns={columns}
          dataSource={data.data}
          loading={loading}
          size="small"
          pagination={{
            total: data.total,
            pageSize: data.limit,
            current: data.page,
            onChange: (newPage, newSize) =>
              setData((prev) => ({ ...prev, page: newPage, limit: newSize })),
          }}
          locale={{
            emptyText: <Empty description="Tidak ada data" />,
          }}
          scroll={{
            x: "max-content",
            // y: window.innerWidth > 600 ? "53vh" : "65vh",
          }}
        />
      </div>

      {/* Detail Modal */}
      <Modal
        title="Detail Peminjaman Jaminan"
        open={!!viewRecord}
        onCancel={() => setViewRecord(null)}
        footer={null}
        width={600}
      >
        {viewRecord && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Nasabah</p>
                <p className="font-semibold">
                  {viewRecord.Submission.Debitur.fullname}
                </p>
                <p className="text-xs text-slate-500">
                  @{viewRecord.Submission.Debitur.nik}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">ID Permohonan</p>
                <p className="font-semibold">{viewRecord.Submission.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Produk</p>
                <p className="font-semibold">
                  {viewRecord.Submission.Product.name}
                </p>
                <p className="text-xs text-slate-500">
                  {viewRecord.Submission.Product.ProductType?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <Tag
                  color={viewRecord.return_at ? "green" : "orange"}
                  variant="solid"
                >
                  {viewRecord.return_at ? "KEMBALI" : "DIPINJAM"}
                </Tag>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-500">Tanggal Pinjam</p>
                <p className="font-semibold">
                  {moment(viewRecord.start_at).format("DD-MM-YYYY")}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Rencana Kembali</p>
                <p className="font-semibold">
                  {moment(viewRecord.end_at).format("DD-MM-YYYY")}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Kembali Aktual</p>
                <p className="font-semibold">
                  {viewRecord.return_at
                    ? moment(viewRecord.return_at).format("DD-MM-YYYY")
                    : "-"}
                </p>
              </div>
            </div>

            {viewRecord.description && (
              <div>
                <p className="text-sm text-slate-500">Keterangan</p>
                <p className="text-sm">{viewRecord.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CollateralLending;
