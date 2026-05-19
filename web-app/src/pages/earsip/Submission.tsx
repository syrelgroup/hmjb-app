import {
  App,
  Button,
  DatePicker,
  Input,
  Modal,
  Popover,
  Select,
  Table,
  Tag,
  type TableProps,
} from "antd";
import { Plus, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  IActionPage,
  ICollateralLending,
  IInsurance,
  IMitra,
  IPageProps,
  IPayOffice,
  IProduct,
  IProductType,
  ISubmission,
  ISubType,
  IVisit,
} from "../../libs/interface";
import type { HookAPI } from "antd/es/modal/useModal";
import api from "../../libs/api";
import useContext from "../../libs/context";
import { CollapseList, DetailSubmission } from "../utils/utilComp";
import {
  CloseOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  FormOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { Link } from "react-router-dom";
import { IDRFormat } from "../utils/utilForm";
const { RangePicker } = DatePicker;
import dayjs from "dayjs";
import { ExportImport } from "./exportimport";

export default function DataSubmission() {
  const [loading, setLoading] = useState(false);
  const [pageprops, setPageprops] = useState<IPageProps<ISubmission>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
    productId: "",
    productTypeId: "",
    backdate: "",
    approve_status: "",
    flagging_status: "",
    guarantee_status: "",
    doc_status: "",
    submissionTypeId: "",
    mitraId: "",
    payOfficeId: "",
    insuranceId: "",
  });
  const [action, setAction] = useState<IActionPage<ISubmission>>({
    upsert: false,
    delete: false,
    process: false,
    record: undefined,
  });
  const { modal } = App.useApp();
  const { hasAccess } = useContext((state: any) => state);
  const [subTypes, setSubTypes] = useState<ISubType[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [productTypes, setProductTypes] = useState<IProductType[]>([]);
  const [mitras, setMitras] = useState<IMitra[]>([]);
  const [pays, setPays] = useState<IPayOffice[]>([]);
  const [insc, setInsc] = useState<IInsurance[]>([]);

  const getData = async () => {
    setLoading(true);
    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/submission`,
        method: "GET",
        params: {
          limit: pageprops.limit,
          page: pageprops.page,
          search: pageprops.search,
          productTypeId: pageprops.productTypeId,
          productId: pageprops.productId,
          approve_status: pageprops.approve_status,
          doc_status: pageprops.doc_status,
          guarantee_status: pageprops.guarantee_status,
          flagging_status: pageprops.flagging_status,
          submissionTypeId: pageprops.submissionTypeId,
          mitraId: pageprops.mitraId,
          payOfficeId: pageprops.payOfficeId,
          insuranceId: pageprops.insuranceId,
          backdate: pageprops.backdate ? pageprops.backdate.toString() : "",
        },
      })
      .then((res) =>
        setPageprops((prev) => ({
          ...prev,
          data: res.data.data.map((d: ISubmission) => ({
            ...d,
            Product: {
              ...d.Product,
              ProductType: {
                ...d.Product.ProductType,
                ProductTypeFile: d.Product?.ProductType?.ProductTypeFile.map(
                  (ptf) => ({
                    ...ptf,
                    Files: d.Files.filter(
                      (f) =>
                        f.submissionId === d.id &&
                        f.productTypeFileId === ptf.id,
                    ),
                  }),
                ),
              },
            },
          })),
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
          url: `${import.meta.env.VITE_API_URL}/producttype`,
        })
        .then((res) => {
          setProductTypes(res.data.data);
          setProducts(res.data.data.flatMap((p: IProductType) => p.Product));
        });
      await api
        .request({
          method: "GET",
          url: `${import.meta.env.VITE_API_URL}/sub_type`,
        })
        .then((res) => setSubTypes(res.data.data));
      await api
        .request({
          method: "GET",
          url: `${import.meta.env.VITE_API_URL}/mitra`,
        })
        .then((res) => setMitras(res.data.data));
      await api
        .request({
          method: "GET",
          url: `${import.meta.env.VITE_API_URL}/pay_office`,
        })
        .then((res) => setPays(res.data.data));
      await api
        .request({
          method: "GET",
          url: `${import.meta.env.VITE_API_URL}/insurance`,
        })
        .then((res) => setInsc(res.data.data));
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
    pageprops.backdate,
    pageprops.productId,
    pageprops.productTypeId,
    pageprops.submissionTypeId,
    pageprops.approve_status,
    pageprops.flagging_status,
    pageprops.guarantee_status,
    pageprops.doc_status,
    pageprops.mitraId,
    pageprops.payOfficeId,
    pageprops.insuranceId,
  ]);

  const columns: TableProps<ISubmission>["columns"] = [
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
      title: "Nasabah",
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
      title: "CIF & Rekening",
      key: "cif",
      dataIndex: "cif",
      render(_value, record, _index) {
        return (
          <div>
            <div>CIF: {record.Debitur.cif}</div>
            <div className="text-xs opacity-80">
              REK: {record.account_number}
            </div>
          </div>
        );
      },
    },
    {
      title: "Jenis Pemohon",
      key: "subType",
      dataIndex: ["Debitur", "SubmissionType", "name"],
    },
    {
      title: "Produk",
      key: "product",
      dataIndex: "product",
      render(_value, record, _index) {
        return (
          <div>
            <div>{record.Product.name}</div>
            <div className="text-xs opacity-80">
              {record.Product.ProductType?.name}
            </div>
          </div>
        );
      },
    },
    {
      title: "Plafond/Nilai",
      key: "plafond",
      dataIndex: "plafond",
      render(_value, record, _index) {
        return (
          <div className="text-right">
            <div>Rp. {IDRFormat(record.value)}</div>
            <div className="text-xs opacity-80">{record.tenor} Bulan</div>
          </div>
        );
      },
    },
    {
      title: "Petugas",
      key: "petugas",
      dataIndex: "petugas",
      render(_value, record, _index) {
        return (
          <div>
            <div>{record.User.fullname}</div>
            <div className="text-xs opacity-80">@{record.User.nik}</div>
          </div>
        );
      },
    },
    {
      title: "No Lemari",
      key: "lemari",
      dataIndex: "lemari",
      render(_value, record, _index) {
        return (
          <div>
            <div>{record.drawer_code}</div>
          </div>
        );
      },
    },
    {
      title: "Mitra & Kantor Bayar",
      key: "mitra",
      dataIndex: "mitra",
      render(_value, record, _index) {
        return (
          <div>
            <div>{record.Mitra?.name}</div>
            <div className="opacity-80 text-xs">{record.PayOffice?.name}</div>
          </div>
        );
      },
    },
    {
      title: "Asuransi",
      key: "insurance",
      dataIndex: "insurance",
      render(_value, record, _index) {
        return (
          <div>
            <div>{record.Insurance?.name}</div>
          </div>
        );
      },
    },
    {
      title: "Files",
      key: "files",
      dataIndex: "files",
      render(_value, record, _index) {
        return (
          <div style={{ maxWidth: 300 }}>
            <CollapseList
              items={
                record.Product.ProductType
                  ? record.Product.ProductType?.ProductTypeFile.map(
                      (c) =>
                        `${c.name} (${c.Files.length}) {${c.Files.map((f) => f.name).join(", ")}}`,
                    )
                  : []
              }
              initialVisible={1}
            />
          </div>
        );
      },
    },
    {
      title: "Komentar",
      key: "comment",
      dataIndex: "comment",
      render(_value, record, _index) {
        return (
          <CollapseList
            items={record.coments.map(
              (c) =>
                `${c.name} at ${moment(c.date).format("DD/MM/YY HH:mm")} : ${c.comment}`,
            )}
          />
        );
      },
    },
    {
      title: "Status Arsip",
      key: "permohonan",
      dataIndex: "permohonan",
      render(_value, record, _index) {
        return (
          <div className="flex justify-center">
            <Tag
              style={{ width: 100, textAlign: "center" }}
              color={
                ["BREAK", "PASIF"].includes(record.approve_status)
                  ? "cyan"
                  : record.approve_status === "PENDING"
                    ? "orange"
                    : "green"
              }
              variant="solid"
            >
              {record.approve_status}
            </Tag>
          </div>
        );
      },
    },
    {
      title: "Status Jaminan",
      key: "jaminan",
      dataIndex: "jaminan",
      render(_value, record, _index) {
        return (
          <div className="flex justify-center">
            <Tag
              style={{ width: 100, textAlign: "center" }}
              color={
                record.guarantee_status === "DITERIMA"
                  ? "green"
                  : record.guarantee_status === "PENDING"
                    ? "orange"
                    : record.guarantee_status === "DIPINJAM"
                      ? "blue"
                      : "cyan"
              }
              variant="solid"
            >
              {record.guarantee_status}
            </Tag>
          </div>
        );
      },
    },
    {
      title: "Status Dokumen",
      key: "doc",
      dataIndex: "doc",
      render(_value, record, _index) {
        return (
          <div className="flex justify-center">
            <Tag
              style={{ width: 100, textAlign: "center" }}
              color={
                record.doc_status === "DITERIMA"
                  ? "green"
                  : record.doc_status === "PENDING"
                    ? "orange"
                    : record.doc_status === "DIPINJAM"
                      ? "blue"
                      : "cyan"
              }
              variant="solid"
            >
              {record.doc_status}
            </Tag>
          </div>
        );
      },
    },
    {
      title: "Status Flagging",
      key: "flagging",
      dataIndex: "flagging",
      render(_value, record, _index) {
        return (
          <div className="flex justify-center">
            <Tag
              style={{ width: 100, textAlign: "center" }}
              color={
                record.flagging_status === "PENDING"
                  ? "orange"
                  : record.flagging_status === "FLAGGING"
                    ? "green"
                    : "blue"
              }
              variant="solid"
            >
              {record.flagging_status}
            </Tag>
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
            <div>{moment(record.created_at).format("DD/MM/YY HH:mm")}</div>
            <div className="text-xs opacity-80">
              {moment(record.updated_at).format("DD/MM/YY HH:mm")}
            </div>
          </div>
        );
      },
    },
    {
      title: "Aktivitas",
      key: "activities",
      dataIndex: "activities",
      render(_value, record, _index) {
        return (
          <CollapseList
            items={record.activities.map(
              (c) =>
                `${c.name} at ${moment(c.date).format("DD/MM/YY HH:mm")} : ${c.activities}`,
            )}
          />
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
            <Button
              icon={<FolderOpenOutlined size={15} />}
              size="small"
              onClick={() => setAction({ ...action, process: true, record })}
            ></Button>
            {hasAccess(window.location.pathname, "update") && (
              <Link to={`/app/earsip/submission/upsert/${record.id}`}>
                <Button
                  icon={<FormOutlined size={15} />}
                  size="small"
                  type="primary"
                  onClick={() => setAction({ ...action, upsert: true, record })}
                ></Button>
              </Link>
            )}
            {hasAccess(window.location.pathname, "delete") && (
              <Button
                icon={<DeleteOutlined size={15} />}
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
    <div className="p-2 w-full max-w-3xl">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col">
          <p className="mb-1 text-xs">Jenis Pemohon</p>
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
        <div className="flex flex-col">
          <p className="mb-1 text-xs">Tipe Arsip</p>
          <Select
            placeholder="Pilih tipe produk.."
            className="w-full"
            options={productTypes.map((t) => ({ label: t.name, value: t.id }))}
            onChange={(val) =>
              setPageprops({
                ...pageprops,
                productTypeId: val,
                productId: null,
              })
            }
            allowClear
            value={pageprops.productTypeId}
            optionFilterProp={"label"}
            showSearch
            size="small"
          />
        </div>
        <div className="flex flex-col">
          <p className="mb-1 text-xs">Produk</p>
          <Select
            placeholder="Pilih produk.."
            className="w-full"
            options={products
              .filter((p) => p.productTypeId === pageprops.productTypeId)
              .map((t) => ({ label: t.name, value: t.id }))}
            onChange={(val) => setPageprops({ ...pageprops, productId: val })}
            allowClear
            value={pageprops.productId}
            optionFilterProp={"label"}
            showSearch
            size="small"
          />
        </div>
        <div className="flex flex-col">
          <p className="mb-1 text-xs">Mitra</p>
          <Select
            placeholder="Pilih mitra.."
            className="w-full"
            options={mitras.map((t) => ({ label: t.name, value: t.id }))}
            onChange={(val) => setPageprops({ ...pageprops, mitraId: val })}
            allowClear
            value={pageprops.mitraId}
            optionFilterProp={"label"}
            showSearch
            size="small"
          />
        </div>
        <div className="flex flex-col">
          <p className="mb-1 text-xs">Kantor Bayar</p>
          <Select
            placeholder="Pilih Kantor Bayar.."
            className="w-full"
            options={pays.map((t) => ({ label: t.name, value: t.id }))}
            onChange={(val) => setPageprops({ ...pageprops, payOfficeId: val })}
            allowClear
            value={pageprops.payOfficeId}
            optionFilterProp={"label"}
            showSearch
            size="small"
          />
        </div>
        <div className="flex flex-col">
          <p className="mb-1 text-xs">Asuransi</p>
          <Select
            placeholder="Pilih Asuransi.."
            className="w-full"
            options={insc.map((t) => ({ label: t.name, value: t.id }))}
            onChange={(val) => setPageprops({ ...pageprops, insuranceId: val })}
            allowClear
            value={pageprops.insuranceId}
            optionFilterProp={"label"}
            showSearch
            size="small"
          />
        </div>
        <div className="flex flex-col">
          <p className="mb-1 text-xs">Status Jaminan</p>
          <Select
            placeholder="Pilih status jaminan.."
            className="w-full"
            options={[
              { label: "PENDING", value: "PENDING" },
              { label: "DITERIMA", value: "DITERIMA" },
              { label: "DIPINJAM", value: "DIPINJAM" },
              { label: "DIKEMBALIKAN", value: "DIKEMBALIKAN" },
            ]}
            onChange={(val) =>
              setPageprops({ ...pageprops, guarantee_status: val })
            }
            allowClear
            value={pageprops.guarantee_status}
            optionFilterProp={"label"}
            showSearch
            size="small"
          />
        </div>
        <div className="flex flex-col">
          <p className="mb-1 text-xs">Status Dokumen</p>
          <Select
            placeholder="Pilih status doc.."
            className="w-full"
            options={[
              { label: "PENDING", value: "PENDING" },
              { label: "DITERIMA", value: "DITERIMA" },
              { label: "DIPINJAM", value: "DIPINJAM" },
              { label: "DIKEMBALIKAN", value: "DIKEMBALIKAN" },
            ]}
            onChange={(val) => setPageprops({ ...pageprops, doc_status: val })}
            allowClear
            value={pageprops.doc_status}
            optionFilterProp={"label"}
            showSearch
            size="small"
          />
        </div>
        <div className="flex flex-col">
          <p className="mb-1 text-xs">Status Nasabah</p>
          <Select
            placeholder="Pilih status nasabah.."
            className="w-full"
            options={[
              { label: "PENDING", value: "PENDING" },
              { label: "AKTIF", value: "AKTIF" },
              { label: "LUNAS", value: "LUNAS" },
              { label: "BREAK", value: "BREAK" },
              { label: "PASIF", value: "PASIF" },
            ]}
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
        <div className="flex flex-col">
          <p className="mb-1 text-xs">Status Flagging</p>
          <Select
            placeholder="Pilih status flagging.."
            className="w-full"
            options={[
              { label: "PENDING", value: "PENDING" },
              { label: "FLAGGING", value: "FLAGGING" },
              { label: "NON_PENSIUNAN", value: "NON_PENSIUNAN" },
            ]}
            onChange={(val) =>
              setPageprops({ ...pageprops, flagging_status: val })
            }
            allowClear
            value={pageprops.flagging_status}
            optionFilterProp={"label"}
            showSearch
            size="small"
          />
        </div>
        <div className="flex flex-col col-span-2">
          <p className="mb-1 text-xs">Periode</p>
          <RangePicker
            value={
              pageprops.backdate && [
                dayjs(pageprops.backdate[0]),
                dayjs(pageprops.backdate[1]),
              ]
            }
            onChange={
              (_date, datestr) =>
                setPageprops({ ...pageprops, backdate: datestr })
              // console.log({ _date, datestr })
            }
            size="small"
          />
        </div>
      </div>
      <div className="flex justify-end mt-3">
        <Button
          size="small"
          danger
          icon={<CloseOutlined />}
          onClick={() =>
            setPageprops({
              ...pageprops,
              productTypeId: "",
              productId: "",
              approve_status: "",
              flagging_status: "",
              guarantee_status: "",
              doc_status: "",
              backdate: "",
              submissionTypeId: "",
              mitraId: "",
              payOfficeId: "",
              insuranceId: "",
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
            Daftar Rekening
          </h1>
          <p className="text-slate-500 text-sm">Manajemen rekening nasabah.</p>
        </div>
      </div>

      {/* --- FILTER & SEARCH --- */}
      <div className="bg-white p-2">
        <div className="bg-white  flex flex-wrap items-center gap-4 mb-2">
          <div className="flex-1 flex gap-2">
            {hasAccess(window.location.pathname, "write") && (
              <a href="/app/earsip/submission/upsert">
                <Button
                  onClick={() => setAction({ ...action, upsert: true })}
                  icon={<Plus size={15} />}
                  type="primary"
                  size="small"
                >
                  New
                </Button>
              </a>
            )}
            {hasAccess(window.location.pathname, "write") && (
              <ExportImport data={pageprops.data} />
            )}
          </div>
          <div className="flex-1 flex items-center justify-end gap-2">
            <Input.Search
              type="text"
              placeholder="Cari Nama, NIK, atau ID Debitur..."
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
                  pageprops.approve_status ||
                  pageprops.mitraId ||
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
            // y: window.innerWidth > 600 ? "50vh" : "63vh",
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
          }}
          expandable={{
            expandedRowRender: (record) => (
              <TableJaminanKunjungan
                lendings={record.CollateralLending || []}
                visits={record.Visit || []}
              />
            ),
            rowExpandable: (record) =>
              record.CollateralLending?.length !== 0 &&
              record.Visit?.length !== 0,
          }}
          footer={() => (
            <div className="flex justify-end pr-4">
              <div className="text-right">
                <p className="text-sm font-semibold">
                  Total Plafond: Rp.{" "}
                  {IDRFormat(
                    pageprops.data.reduce(
                      (sum, item) => sum + (item.value || 0),
                      0,
                    ),
                  )}
                </p>
              </div>
            </div>
          )}
        />
      </div>
      {action.delete && action.record && (
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
      )}
      {action.process && action.record && (
        <DetailSubmission
          open={action.process}
          setOpen={(val: boolean) =>
            setAction({ ...action, process: val, record: undefined })
          }
          record={action.record}
          key={"detail" + action.record.id}
        />
      )}
    </div>
  );
}

const DeleteData = ({
  open,
  setOpen,
  record,
  getData,
  hook,
}: {
  open: boolean;
  setOpen: Function;
  record: ISubmission;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await api
      .request({
        url: import.meta.env.VITE_API_URL + "/submission?id=" + record?.id,
        method: "DELETE",
        headers: { "Content-Type": "Application/json" },
      })
      .then(async (res) => {
        if (res.status === 201 || res.status === 200) {
          hook.success({
            title: "BERHASIL",
            content: res.data.msg,
          });
          setOpen(false);
          getData && (await getData());
        } else {
          hook.error({
            title: "ERROR",
            content: res.data.msg,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        hook.error({
          title: "ERROR",
          content: err.message || "Internal Server Error",
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
      okButtonProps={{ loading: loading }}
    >
      <div className="p-5">
        <p>Konfirmasi hapus data *{record.id}*?</p>
      </div>
    </Modal>
  );
};

const TableJaminanKunjungan = ({
  lendings,
  visits,
}: {
  lendings: ICollateralLending[];
  visits: IVisit[];
}) => {
  interface IData {
    id: string;
    name: string;
    start_date: Date | null;
    end_date: Date | null;
    actual_date: Date | null;
    status: string;
  }
  const data: IData[] = [
    ...lendings.map((l) => ({
      id: l.id,
      name: "Peminjaman Jaminan",
      start_date: l.start_at,
      end_date: l.end_at,
      actual_date: l.return_at,
      status: l.return_at ? "SELESAI" : "PENDING",
    })),
    ...visits.map((p) => ({
      id: p.id,
      name: "Kunjungan",
      start_date: p.created_at,
      end_date: p.date_plan,
      actual_date: p.date_action || null,
      status: p.date_action ? "SELESAI" : "PENDING",
    })),
  ];

  const columns: TableProps<IData>["columns"] = [
    {
      title: "Kategori",
      key: "name",
      dataIndex: "name",
    },
    {
      title: "Tanggal Rencana",
      key: "date",
      dataIndex: "date",
      render(_value, record, _index) {
        return (
          <div className="text-xs">
            <div>Mulai: {moment(record.start_date).format("DD-MM-YYYY")}</div>
            <div>Selesai: {moment(record.end_date).format("DD-MM-YYYY")}</div>
          </div>
        );
      },
    },
    {
      title: "Tanggal Aktual",
      key: "date",
      dataIndex: "date",
      render(_value, record, _index) {
        return <div>{moment(record.actual_date).format("DD-MM-YYYY")}</div>;
      },
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "status",
      render(_value, record, _index) {
        return (
          <div className="flex justify-center">
            <Tag
              style={{ width: 80, textAlign: "center" }}
              color={record.status === "SELESAI" ? "green" : "orange"}
              variant="solid"
            >
              {record.status}
            </Tag>
          </div>
        );
      },
    },
  ];

  return (
    <div className="ml-8">
      <Table
        size="small"
        rowKey={"id"}
        bordered
        columns={columns}
        dataSource={data}
        pagination={false}
      />
    </div>
  );
};
