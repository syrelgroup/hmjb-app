import { App, Button, Input, Modal, Table, type TableProps } from "antd";
import { Plus, Edit, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import type { IActionPage, IMitra, IPageProps } from "../../libs/interface";
import type { HookAPI } from "antd/es/modal/useModal";
import api from "../../libs/api";
import useContext from "../../libs/context";
import {
  EnvironmentOutlined,
  FileFilled,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { CollapseText } from "../utils/utilComp";
import { InputFileUploadVisit, InputUtil } from "../utils/utilForm";

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
        url: `${import.meta.env.VITE_API_URL}/mitra?${params.toString()}`,
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

  const columns: TableProps<IMitra>["columns"] = [
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
      title: "Nama Mitra",
      key: "name",
      dataIndex: "name",
      render(_value, record) {
        return (
          <>
            <div>{record.name}</div>
            <div className="text-xs opacity-80">@{record.code}</div>
          </>
        );
      },
    },
    {
      title: "Kontak",
      key: "contact",
      dataIndex: "name",
      render(_value, record) {
        return (
          <>
            <div className="text-xs opacity-80">
              <PhoneOutlined /> {record.phone}
            </div>
            <div className="text-xs opacity-80">
              <MailOutlined /> {record.email}
            </div>
            <div className="text-xs opacity-80">
              <EnvironmentOutlined /> {record.address}
            </div>
            <div className="text-xs opacity-80">
              <UserOutlined /> {record.pic}
            </div>
          </>
        );
      },
    },
    {
      title: "Kerjasama",
      key: "contract",
      dataIndex: "name",
      render(_value, record) {
        return (
          <>
            <div>Nomor: {record.no_contract}</div>
            <div className="text-xs opacity-80">
              File : {record.drawer_code}{" "}
              {record.file && (
                <a
                  href={record.file}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative aspect-square rounded-xl bg-gray-200 overflow-hidden border-2 border-gray-100 hover:border-purple-500 transition-all hover:shadow-lg"
                >
                  <Button size="small">
                    <FileFilled />
                  </Button>
                </a>
              )}
            </div>
          </>
        );
      },
    },
    {
      title: "Keterangan",
      key: "desc",
      dataIndex: "desc",
      render(_value, record) {
        return <CollapseText text={record.description || ""} />;
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
                icon={<Edit size={15} />}
                size="small"
                type="primary"
                onClick={() => setAction({ ...action, upsert: true, record })}
              ></Button>
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

  return (
    <div className="space-y-2">
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Data Mitra
          </h1>
          <p className="text-slate-500 text-sm">Manajemen data mitra.</p>
        </div>
      </div>

      {/* --- FILTER & SEARCH --- */}
      <div className="bg-white p-2">
        <div className="bg-white  flex flex-wrap items-center gap-4 mb-2">
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
          <div className="flex-1 flex items-center justify-end gap-2">
            <Input.Search
              type="text"
              placeholder="Cari mitra..."
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
      <UpsertData
        open={action.upsert}
        setOpen={(val: boolean) =>
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

const UpsertData = ({
  open,
  setOpen,
  record,
  getData,
  hook,
}: {
  open: boolean;
  setOpen: Function;
  record?: IMitra;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IMitra>(record || defaultData);

  const handleSubmit = async () => {
    if (!data.name) {
      hook.error({
        title: "ERROR",
        content: "Mohon lengkapi data terlebih dahulu!",
      });
      return;
    }
    setLoading(true);
    await api
      .request({
        url: import.meta.env.VITE_API_URL + "/mitra?id=" + record?.id,
        method: record ? "PUT" : "POST",
        data: data,
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
      onCancel={() => setOpen(false)}
      title={`Upsert Data ${record ? record.name : ""}`}
      style={{ top: 10 }}
      width={800}
      onOk={handleSubmit}
      okButtonProps={{ loading: loading, disabled: !data.name }}
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <InputUtil
            label="ID"
            type="text"
            value={record?.id}
            placeholder="Kosongkan untuk otomatis"
            onchage={(e: string) => setData({ ...data, id: e || "" })}
          />
          <InputUtil
            label="Nama Mitra"
            type="text"
            value={record?.name}
            required
            onchage={(e: string) => setData({ ...data, name: e || "" })}
          />
          <InputUtil
            label="Kode Mitra"
            type="text"
            value={record?.code}
            required
            onchage={(e: string) => setData({ ...data, code: e || "" })}
          />
          <InputUtil
            label="PIC"
            type="text"
            value={record?.pic}
            onchage={(e: string) => setData({ ...data, pic: e || "" })}
          />
          <InputUtil
            label="Keterangan"
            type="area"
            value={record?.description}
            onchage={(e: string) => setData({ ...data, description: e || "" })}
          />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <InputUtil
            label="Email"
            type="text"
            value={record?.email}
            onchage={(e: string) => setData({ ...data, email: e || "" })}
          />
          <InputUtil
            label="No Telepon"
            type="text"
            value={record?.phone}
            onchage={(e: string) => setData({ ...data, phone: e || "" })}
          />
          <InputUtil
            label="Alamat"
            type="area"
            value={record?.address}
            onchage={(e: string) => setData({ ...data, address: e || "" })}
          />
          <InputUtil
            label="No Kerjasama"
            type="text"
            value={record?.no_contract}
            onchage={(e: string) => setData({ ...data, no_contract: e || "" })}
          />
          <InputUtil
            label="No Lemari"
            type="text"
            value={record?.drawer_code}
            onchage={(e: string) => setData({ ...data, drawer_code: e || "" })}
          />
          <div className="flex justify-between gap-4">
            <p>Berkas</p>
            <InputFileUploadVisit
              filetype="application/pdf, image/*"
              record={{
                name: "File",
                url: data.file || "",
              }}
              ondelete={() => setData({ ...data, file: null })}
              onchange={(e: { name: string; url: string | null }) =>
                setData({ ...data, file: e.url })
              }
              noname
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

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

const DeleteData = ({
  open,
  setOpen,
  record,
  getData,
  hook,
}: {
  open: boolean;
  setOpen: Function;
  record: IMitra;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await api
      .request({
        url: import.meta.env.VITE_API_URL + "/mitra?id=" + record?.id,
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
