import { App, Button, Input, Modal, Table, type TableProps } from "antd";
import { Plus, Edit, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import type { IActionPage, IPageProps, IPayOffice } from "../../libs/interface";
import type { HookAPI } from "antd/es/modal/useModal";
import api from "../../libs/api";
import useContext from "../../libs/context";
import { CollapseText } from "../utils/utilComp";
import { InputUtil } from "../utils/utilForm";

export default function DataPayOffice() {
  const [loading, setLoading] = useState(false);
  const [pageprops, setPageprops] = useState<IPageProps<IPayOffice>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
  });
  const [action, setAction] = useState<IActionPage<IPayOffice>>({
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
        url: `${import.meta.env.VITE_API_URL}/pay_office?${params.toString()}`,
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

  const columns: TableProps<IPayOffice>["columns"] = [
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
            Data Kantor Bayar
          </h1>
          <p className="text-slate-500 text-sm">
            Manajemen data kantor bayar gaji.
          </p>
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
            y: window.innerWidth > 600 ? "53vh" : "65vh",
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
  record?: IPayOffice;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IPayOffice>(record || defaultData);

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
        url: import.meta.env.VITE_API_URL + "/pay_office?id=" + record?.id,
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
      <div className="flex flex-col gap-2">
        <InputUtil
          label="ID"
          type="text"
          value={record?.id}
          placeholder="Kosongkan untuk otomatis"
          onchage={(e: string) => setData({ ...data, id: e || "" })}
        />
        <InputUtil
          label="Kantor Bayar"
          type="text"
          value={record?.name}
          required
          onchage={(e: string) => setData({ ...data, name: e || "" })}
        />
        <InputUtil
          label="Keterangan"
          type="area"
          value={record?.description}
          onchage={(e: string) => setData({ ...data, description: e || "" })}
        />
      </div>
    </Modal>
  );
};

const defaultData: IPayOffice = {
  id: "",
  name: "",
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
  record: IPayOffice;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await api
      .request({
        url: import.meta.env.VITE_API_URL + "/pay_office?id=" + record?.id,
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
