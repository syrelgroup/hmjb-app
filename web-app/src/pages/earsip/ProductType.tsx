import {
  App,
  Button,
  Card,
  Divider,
  Empty,
  Input,
  List,
  Modal,
  Pagination,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { Plus, Eye, Edit2, Delete, Hash, VideoIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  IActionPage,
  IPageProps,
  IProductType,
} from "../../libs/interface";
import type { HookAPI } from "antd/es/modal/useModal";
import api from "../../libs/api";
import useContext from "../../libs/context";
import {
  FileOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  DoubleRightOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
const { Text, Title } = Typography;

export default function DataProductType() {
  const [loading, setLoading] = useState(false);
  const [pageprops, setPageprops] = useState<IPageProps<IProductType>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
  });
  const [action, setAction] = useState<IActionPage<IProductType>>({
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
    if (pageprops.search) {
      params.append("search", pageprops.search);
    }
    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/producttype?${params.toString()}`,
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
  }, [pageprops.page, pageprops.limit, pageprops.search]);

  return (
    <div className="space-y-2">
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Data Kategori Berkas
          </h1>
          <p className="text-slate-500 text-sm">Manajemen kategori berkas.</p>
        </div>
      </div>

      {/* --- FILTER & SEARCH --- */}
      <div className="bg-white p-2">
        <div className="bg-white  flex flex-wrap items-center gap-4 mb-2">
          <div className="flex-1 flex">
            {hasAccess(window.location.pathname, "write") && (
              <Link to={"/app/earsip/product_type/upsert"}>
                <Button
                  // onClick={() => setAction({ ...action, upsert: true })}
                  icon={<Plus size={15} />}
                  type="primary"
                  size="small"
                >
                  New
                </Button>
              </Link>
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
          </div>
        </div>

        <Spin spinning={loading}>
          <div className="flex gap-4 flex-wrap my-5 justify-evenly">
            {pageprops.data.map((d) => (
              <ProductTypeCard
                record={d}
                key={d.id}
                setAction={setAction}
                hasupdate={hasAccess(window.location.pathname, "update")}
                hasdelete={hasAccess(window.location.pathname, "delete")}
              />
            ))}
          </div>
          {pageprops.data.length === 0 && (
            <div className="py-20 flex flex-col gap-4 items-center justify-center">
              <div className="text-center text-2xl font-bold">
                <Empty description="Tidak ada data yang ditemukan" />
              </div>
            </div>
          )}
        </Spin>

        <div className="flex justify-end">
          <Pagination
            current={pageprops.page}
            pageSize={pageprops.limit}
            total={pageprops.total}
            pageSizeOptions={[50, 100, 500, 1000]}
            size="small"
            onChange={(page, pageSize) =>
              setPageprops({ ...pageprops, page, limit: pageSize })
            }
          />
        </div>
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
  record: IProductType;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await api
      .request({
        url: import.meta.env.VITE_API_URL + "/producttype?id=" + record?.id,
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
        <p>Konfirmasi hapus data *{record.name}*?</p>
      </div>
    </Modal>
  );
};

const ProductTypeCard = ({
  record,
  setAction,
  hasupdate,
  hasdelete,
}: {
  record: IProductType;
  setAction: Function;
  hasupdate: boolean;
  hasdelete: boolean;
}) => {
  const [open, setOpen] = useState(false);

  const getFileIcon = (type: string) => {
    if (type.includes("pdf"))
      return <FilePdfOutlined style={{ color: "#ff4d4f" }} />;
    if (type.includes("image") || type.includes("png") || type.includes("jpg"))
      return <FileImageOutlined style={{ color: "#52c41a" }} />;
    return <VideoIcon size={15} style={{ color: "#1890ff" }} />;
  };

  return (
    <Card
      hoverable
      style={{
        width: 300,
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "2px 2px 2px #eee",
      }}
      actions={[
        <Tooltip title="Lihat Detail">
          <Button
            type="text"
            icon={<Eye size={15} />}
            onClick={() => setOpen(true)}
          />
        </Tooltip>,
        <Tooltip title="Lihat Arsip">
          <Link to={"/app/earsip/product_type/detail/" + record.id}>
            <Button type="text" icon={<DoubleRightOutlined />} />
          </Link>
        </Tooltip>,
        <Tooltip title="Edit Tipe">
          <Link to={"/app/earsip/product_type/upsert/" + record.id}>
            <Button
              type="text"
              icon={<Edit2 style={{ color: "#1890ff" }} size={15} />}
              disabled={!hasupdate}
            />
          </Link>
        </Tooltip>,
        <Tooltip title="Hapus">
          <Button
            type="text"
            danger
            icon={<Delete size={15} />}
            onClick={() =>
              setAction((prev: any) => ({ ...prev, record, delete: true }))
            }
            disabled={!hasdelete}
          />
        </Tooltip>,
      ]}
    >
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}
      >
        <div
          style={{
            background: "#f0f5ff",
            padding: "10px",
            borderRadius: "8px",
            marginRight: "12px",
          }}
        >
          <Hash size={15} style={{ fontSize: "24px", color: "#1890ff" }} />
        </div>
        <div>
          <Title level={5} style={{ margin: 0 }}>
            ({record.id}) {record.name}
          </Title>
          <div className="flex justify-evenly gap-4">
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.ProductTypeFile.filter((d) => d.status).length} Files
            </Text>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.Product.filter((d) => d.status).length} Produk
            </Text>
          </div>
        </div>
      </div>

      <Text type="secondary" style={{ display: "block", marginBottom: "12px" }}>
        {record.description}
      </Text>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={[
          <Button key="close" onClick={() => setOpen(false)}>
            Tutup
          </Button>,
        ]}
        title={
          <Space>
            <FileOutlined />
            <span>Detail Katagori Berkas {record?.name}</span>
          </Space>
        }
        width={1000}
        style={{ top: 20 }}
      >
        <div className="flex flex-col sm:flex-row gap-8">
          <div className="flex-1">
            <Divider titlePlacement="center">Daftar Berkas</Divider>
            <List
              itemLayout="horizontal"
              dataSource={record?.ProductTypeFile.filter((f) => f.status) || []} // Asumsi data file ada di dalam record
              locale={{ emptyText: "Belum ada list file!" }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <div style={{ fontSize: "15px", paddingTop: "4px" }}>
                        {getFileIcon(item.type)}
                      </div>
                    }
                    title={<Text strong>{item.name}</Text>}
                    description={
                      <Space orientation="horizontal" size={5}>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          ID: <Tag>{item.id}</Tag>
                        </Text>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          Tipe: <Tag>{item.type.toUpperCase()}</Tag>
                        </Text>
                      </Space>
                    }
                  />
                  <div>
                    <Tag color={item.status ? "green" : "red"}>
                      {item.status ? "Aktif" : "Non-aktif"}
                    </Tag>
                  </div>
                </List.Item>
              )}
            />
          </div>
          <div className="flex-1">
            <Divider titlePlacement="center">Daftar Produk</Divider>
            <List
              itemLayout="horizontal"
              dataSource={record?.Product.filter((f) => f.status) || []} // Asumsi data file ada di dalam record
              locale={{ emptyText: "Belum ada list produk!" }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text strong>{item.name}</Text>}
                    description={
                      <Space orientation="horizontal" size={5}>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          ID: <Tag>{item.id}</Tag>
                        </Text>
                      </Space>
                    }
                  />
                  <div>
                    <Tag color={item.status ? "green" : "red"}>
                      {item.status ? "Aktif" : "Non-aktif"}
                    </Tag>
                  </div>
                </List.Item>
              )}
            />
          </div>
        </div>
      </Modal>
    </Card>
  );
};
