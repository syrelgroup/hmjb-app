import {
  Button,
  Input,
  Popover,
  Select,
  Table,
  type TableProps,
  Tag,
  Popconfirm,
  Modal,
  App,
  Divider,
} from "antd";
import { Plus, Filter, Phone, Mail, Edit2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  type IPageProps,
  type IUser,
  type IRole,
  type IPosition,
  type IActionPage,
  PTKPDetail,
  type IUserCost,
} from "../../libs/interface";
import useContext from "../../libs/context";
import {
  CloseOutlined,
  DeleteOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import api from "../../libs/api";
import { IDRFormat, IDRToNumber, InputUtil } from "../utils/utilForm";

export default function UserManagement() {
  const [loading, setLoading] = useState(false);
  const [pageprops, setPageprops] = useState<IPageProps<IUser>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
    roleId: "",
    positionId: "",
  });
  const [action, setAction] = useState<IActionPage<IUser>>({
    record: undefined,
    upsert: false,
    delete: false,
    process: false,
  });
  const { hasAccess } = useContext((state: any) => state);
  const [roles, setRoles] = useState<IRole[]>([]);
  const [positions, setPositions] = useState<IPosition[]>([]);
  const { message } = App.useApp();

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageprops.page.toString());
    params.append("limit", pageprops.limit.toString());
    if (pageprops.search) params.append("search", pageprops.search);
    if (pageprops.roleId) params.append("roleId", pageprops.roleId);
    if (pageprops.positionId) params.append("positionId", pageprops.positionId);

    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/user?${params.toString()}`,
        method: "GET",
      })
      .then((res) =>
        setPageprops((prev) => ({
          ...prev,
          data: res.data.data,
          total: res.data.total,
        })),
      )
      .catch(() => console.log("Error fetching users"));
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      try {
        const [rolesRes, positionsRes] = await Promise.all([
          api.request({
            method: "GET",
            url: `${import.meta.env.VITE_API_URL}/role`,
          }),
          api.request({
            method: "GET",
            url: `${import.meta.env.VITE_API_URL}/position`,
          }),
        ]);
        setRoles(rolesRes.data.data);
        setPositions(positionsRes.data.data);
      } catch (err) {
        console.log("Error fetching roles/positions");
      }
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
    pageprops.roleId,
    pageprops.positionId,
  ]);

  const handleDelete = async (id: string) => {
    setLoading(true);
    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/user?id=${id}`,
        method: "DELETE",
      })
      .then(() => {
        message.success("User berhasil dihapus");
        getData();
      })
      .catch(() => {
        message.error("Gagal menghapus user");
      });
    setLoading(false);
  };

  const columns: TableProps<IUser>["columns"] = [
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
      title: "Nama User",
      key: "fullname",
      dataIndex: "fullname",
      fixed: window.innerWidth > 600 ? "left" : undefined,
      render(value, record, _index) {
        return (
          <div>
            <div className="font-semibold">{value}</div>
            <div className="text-xs opacity-80">@{record.username}</div>
          </div>
        );
      },
    },
    {
      title: "NIK/NIP",
      key: "nik",
      dataIndex: "nik",
      render(_value, record, _index) {
        return (
          <div className="text-xs">
            <div>NIK: {record.nik || "-"}</div>
            <div>NIP: {record.nip || "-"}</div>
          </div>
        );
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
              {record.phone || "-"}
            </div>
            <div className="text-xs flex items-center gap-1">
              <Mail size={12} />
              {record.email || "-"}
            </div>
          </div>
        );
      },
    },
    {
      title: "Jabatan",
      key: "position",
      dataIndex: ["Position", "name"],
      render(value, record) {
        return (
          <div className="text-xs flex flex-col gap-1">
            <Tag color="cyan">{value}</Tag>
            <Tag color="blue">{record.Role?.name || "N/A"}</Tag>
          </div>
        );
      },
    },
    {
      title: "Metode Absensi",
      key: "absen_method",
      dataIndex: "absen_method",
      render(value) {
        return (
          <Tag
            color={value === "FACE" ? "purple" : "green"}
            className="text-xs"
          >
            {value === "FACE" ? "👤 Face Recognition" : "🔘 Button"}
          </Tag>
        );
      },
    },
    {
      title: "Aksi",
      key: "action",
      fixed: "right",
      width: 100,
      render(_value, record, _index) {
        return (
          <div className="flex items-center gap-1">
            {hasAccess(window.location.pathname, "write") && (
              <>
                <Button
                  type="text"
                  size="small"
                  icon={<Edit2 size={14} />}
                  onClick={() => setAction({ ...action, upsert: true, record })}
                  className="text-blue-500 hover:text-blue-700"
                />
                <Popconfirm
                  title="Hapus User"
                  description="Apakah Anda yakin ingin menghapus user ini?"
                  okText="Ya"
                  cancelText="Tidak"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleDelete(record.id)}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<Trash2 size={14} />}
                    className="text-red-500 hover:text-red-700"
                  />
                </Popconfirm>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const content = (
    <div className="p-4 w-96 max-h-96 overflow-y-auto space-y-4">
      <div className="flex flex-col w-full">
        <label className="mb-2 font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          Role
        </label>
        <Select
          placeholder="Pilih role..."
          className="w-full"
          options={roles.map((r) => ({ label: r.name, value: r.id }))}
          onChange={(val) => setPageprops({ ...pageprops, roleId: val })}
          value={pageprops.roleId}
          allowClear
          optionFilterProp={"label"}
          showSearch
          size="small"
        />
      </div>
      <div className="flex flex-col w-full">
        <label className="mb-2 font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Jabatan
        </label>
        <Select
          placeholder="Pilih jabatan..."
          className="w-full"
          options={positions.map((p) => ({ label: p.name, value: p.id }))}
          onChange={(val) => setPageprops({ ...pageprops, positionId: val })}
          value={pageprops.positionId}
          allowClear
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
              roleId: "",
              positionId: "",
            })
          }
        >
          Reset Filter
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3 min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 p-3 md:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Data Pengguna
          </h1>
          <p className="text-slate-500 text-sm">Manajemen Pengguna Sistem.</p>
        </div>
      </div>

      {/* --- FILTER & SEARCH --- */}
      <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
        <div className="flex flex-wrap items-center gap-2 mb-4">
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
              placeholder="Cari nama/username/email..."
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
                type="default"
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
            showQuickJumper: true,
          }}
        />
      </div>
      <UpsertData
        open={action.upsert}
        setOpen={(open) => setAction({ ...action, upsert: open })}
        record={action.record}
        message={message}
        getData={getData}
        roles={roles}
        positions={positions}
        key={action.record ? "upset" + action.record.id : "create"}
      />
    </div>
  );
}

const UpsertData = ({
  open,
  setOpen,
  record,
  message,
  getData,
  roles,
  positions,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  record?: IUser;
  message: any;
  getData: () => void;
  roles: IRole[];
  positions: IPosition[];
}) => {
  const [data, setData] = useState<IUser>(record || defaultData);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    // Filter UserCost: hanya kirim yang belum di-hapus (end_at kosong)
    const filteredData = {
      ...data,
      UserCost: data.UserCost?.filter((uc) => !uc.end_at) || [],
    };

    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/user?id=` + record?.id,
        method: record ? "PUT" : "POST",
        data: filteredData,
      })
      .then((res) => {
        if (res.data.status === 200) {
          message.success("Upsert data user berhasil");
          setOpen(false);
          getData();
        } else {
          message.error(res.data.msg || "Upsert data user gagal");
        }
      })
      .catch((err) => {
        console.log(err);
        message.error("Internal Server Error");
      });
    setLoading(false);
  };

  const AddButton = (type: "PENAMBAHAN" | "PENGURANGAN") => (
    <Button
      icon={<PlusCircleOutlined />}
      size="small"
      block
      type="primary"
      onClick={() =>
        setData({
          ...data,
          UserCost: data.UserCost
            ? [...data.UserCost, { ...defaultCost, type }]
            : [{ ...defaultCost, type }],
        })
      }
    >
      Tambah Data
    </Button>
  );

  return (
    <Modal
      title="Upsert Data User"
      open={open}
      onCancel={() => setOpen(false)}
      width={1000}
      style={{ top: 10 }}
      loading={loading}
      onOk={() => handleSubmit()}
    >
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="flex-1 flex flex-col gap-2">
          <InputUtil
            label="ID"
            value={data.id}
            placeholder="Kosongkan untuk otomatis"
            type="text"
            layout="horizontal"
            onchage={(value: string) => setData({ ...data, id: value })}
          />
          <InputUtil
            label="Nama Lengkap"
            value={data.fullname}
            required
            type="text"
            layout="horizontal"
            onchage={(value: string) => setData({ ...data, fullname: value })}
          />
          <InputUtil
            label="NIK"
            value={data.nik || ""}
            required
            type="text"
            layout="horizontal"
            onchage={(value: string) => setData({ ...data, nik: value })}
          />
          <InputUtil
            label="NIP"
            value={data.nip || ""}
            required
            type="text"
            layout="horizontal"
            onchage={(value: string) => setData({ ...data, nip: value })}
          />
          <InputUtil
            label="Username"
            value={data.username}
            required
            type="text"
            layout="horizontal"
            onchage={(value: string) => setData({ ...data, username: value })}
          />
          <InputUtil
            label="Email"
            value={data.email || ""}
            required
            type="text"
            layout="horizontal"
            onchage={(value: string) => setData({ ...data, email: value })}
          />
          <InputUtil
            label="No Telepon"
            value={data.phone || ""}
            required
            type="text"
            layout="horizontal"
            onchage={(value: string) => setData({ ...data, phone: value })}
          />
          {!record && (
            <InputUtil
              label="Password"
              value={data.password}
              required
              type="password"
              layout="horizontal"
              onchage={(value: string) => setData({ ...data, password: value })}
            />
          )}
          <InputUtil
            label="Gaji Pokok"
            value={IDRFormat(data.salary)}
            required
            type="text"
            layout="horizontal"
            onchage={(value: string) =>
              setData({ ...data, salary: IDRToNumber(value) })
            }
          />
          <InputUtil
            label="Status PTKP"
            value={data.ptkp}
            type="option"
            options={PTKPDetail.map((p) => ({
              label: `${p.name} - ${p.desc}`,
              value: p.name,
            }))}
            layout="horizontal"
            onchage={(value: string) => setData({ ...data, ptkp: value })}
          />
          <InputUtil
            label="Jabatan"
            value={data.positionId || ""}
            type="option"
            options={positions.map((p) => ({ label: p.name, value: p.id }))}
            layout="horizontal"
            onchage={(value: string) => setData({ ...data, positionId: value })}
          />
          <InputUtil
            label="Role"
            value={data.roleId || ""}
            type="option"
            options={roles.map((p) => ({ label: p.name, value: p.id }))}
            layout="horizontal"
            onchage={(value: string) => setData({ ...data, roleId: value })}
          />
          <InputUtil
            label="Metode Absen"
            value={data.absen_method}
            type="option"
            options={[
              { label: "BUTTON", value: "BUTTON" },
              { label: "FACE", value: "FACE" },
            ]}
            layout="horizontal"
            onchage={(value: string) =>
              setData({ ...data, absen_method: value as any })
            }
          />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <Divider style={{ margin: 5 }}>Tunjangan & Potongan</Divider>
          <div className="flex flex-col gap-2">
            {data.UserCost?.filter((u) => !u.end_at).map((uc, uci) => (
              <div
                key={"allowance" + uci}
                className="flex gap-2 flex-wrap justify-between items-center"
              >
                <div className="flex-1">
                  <Select
                    style={{ width: "100%" }}
                    value={uc.type}
                    options={[
                      { label: "Tunjangan", value: "PENAMBAHAN" },
                      { label: "Potongan", value: "PENGURANGAN" },
                    ]}
                    onChange={(e) =>
                      setData({
                        ...data,
                        UserCost: data.UserCost?.map((u, i) => ({
                          ...u,
                          ...(uci === i && { type: e }),
                        })),
                      })
                    }
                  />
                </div>
                <div className="flex-1">
                  <Input
                    width={"100%"}
                    placeholder="Nama"
                    value={uc.name}
                    onChange={(e) =>
                      setData({
                        ...data,
                        UserCost: data.UserCost?.map((u, i) => ({
                          ...u,
                          ...(uci === i && { name: e.target.value }),
                        })),
                      })
                    }
                  />
                </div>
                <div className="flex-1">
                  <Select
                    style={{ width: "100%" }}
                    value={uc.nominal_type}
                    options={[
                      { label: "Rupiah", value: "RUPIAH" },
                      { label: "Persentase", value: "PERCENT" },
                    ]}
                    onChange={(e) =>
                      setData({
                        ...data,
                        UserCost: data.UserCost?.map((u, i) => ({
                          ...u,
                          ...(uci === i && { nominal_type: e }),
                        })),
                      })
                    }
                  />
                </div>
                <div className="flex-1">
                  <Input
                    width={"100%"}
                    placeholder="Nominal"
                    type={"text"}
                    value={
                      uc.nominal_type === "RUPIAH"
                        ? IDRFormat(uc.nominal)
                        : uc.nominal
                    }
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      // Ganti koma ke titik untuk parsing
                      const normalizedValue = inputValue.replace(",", ".");

                      setData({
                        ...data,
                        UserCost: data.UserCost?.map((u, i) => {
                          if (uci === i) {
                            if (u.nominal_type === "RUPIAH") {
                              return {
                                ...u,
                                nominal: Number(IDRToNumber(inputValue || "0")), // Pastikan Number
                              };
                            } else {
                              // Regex untuk mengizinkan angka dan satu titik/koma desimal
                              if (
                                /^-?\d*[.,]?\d*$/.test(inputValue) ||
                                inputValue === ""
                              ) {
                                return {
                                  ...u,
                                  // Gunakan Number() atau parseFloat()
                                  // Jika input kosong, set ke 0
                                  nominal:
                                    inputValue === ""
                                      ? 0
                                      : Number(normalizedValue),
                                };
                              }
                            }
                          }
                          return u;
                        }),
                      });
                    }}
                  />
                </div>
                <div>
                  <Button
                    size="small"
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => {
                      // Langsung hapus dari array, baik item baru maupun yang sudah ada
                      setData({
                        ...data,
                        UserCost: data.UserCost?.filter((_, i) => i !== uci),
                      });
                    }}
                  ></Button>
                </div>
              </div>
            ))}
            {AddButton("PENAMBAHAN")}
          </div>
        </div>
      </div>
    </Modal>
  );
};

const defaultData: IUser = {
  id: "",
  fullname: "",
  username: "",
  email: "",
  phone: "",
  password: "",
  nik: "",
  nip: "",
  status: true,
  created_at: new Date(),
  updated_at: new Date(),
  Position: {} as IPosition,
  Role: {} as IRole,
  salary: 0,
  ptkp: "TK/0",
  absen_method: "BUTTON",
  face: null,
  photo: null,
  roleId: "",
  positionId: "",
  Absence: [],
  UserCost: [],
  PermitAbsence: [],
  Insentif: [],
};

const defaultCost: IUserCost = {
  id: "",
  name: "",
  type: "PENAMBAHAN",
  nominal: 0,
  nominal_type: "RUPIAH",
  start_at: new Date(),
  userId: "",
  User: undefined,
};
