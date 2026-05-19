import {
  App,
  Button,
  Input,
  Modal,
  Table,
  Typography,
  type TableProps,
  Row,
  Col,
  Card,
  Space,
  Tabs,
  Badge,
  Segmented,
} from "antd";
import { Plus, Edit, Trash, ArrowLeft, CheckCircle } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import type {
  IActionPage,
  IPageProps,
  IPermission,
  IRole,
} from "../../libs/interface";
import { menus } from "../../libs/list_app";
import type { HookAPI } from "antd/es/modal/useModal";
import api from "../../libs/api";
import useContext from "../../libs/context";
const { Text } = Typography;

export default function DataRole() {
  const [loading, setLoading] = useState(false);
  const [pageprops, setPageprops] = useState<IPageProps<IRole>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
  });
  const [showUpsert, setShowUpsert] = useState(false);
  const [editingRecord, setEditingRecord] = useState<IRole | undefined>();
  const [action, setAction] = useState<IActionPage<IRole>>({
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
        url: `${import.meta.env.VITE_API_URL}/role?${params.toString()}`,
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

  // If showing upsert, render as full page
  if (showUpsert) {
    return (
      <UpsertPage
        record={editingRecord}
        onBack={() => {
          setShowUpsert(false);
          setEditingRecord(undefined);
          getData();
        }}
      />
    );
  }

  // List view
  const columns: TableProps<IRole>["columns"] = [
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
      title: "Role",
      key: "name",
      dataIndex: "name",
    },
    {
      title: "Jumlah Menu",
      key: "permission",
      dataIndex: "permission",
      render(_value, record, _index) {
        return (
          <>
            {record.permission
              ? JSON.parse(String(record.permission) || "[]").length
              : "0"}
          </>
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
            {hasAccess(window.location.pathname, "update") && (
              <Button
                icon={<Edit size={15} />}
                size="small"
                type="primary"
                onClick={() => {
                  setEditingRecord(record);
                  setShowUpsert(true);
                }}
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
            Data Role
          </h1>
          <p className="text-slate-500 text-sm">Manajemen Peran Pengguna.</p>
        </div>
      </div>

      {/* --- FILTER & SEARCH --- */}
      <div className="bg-white p-2">
        <div className="bg-white  flex flex-wrap items-center gap-4 mb-2">
          <div className="flex-1 flex">
            {hasAccess(window.location.pathname, "write") && (
              <Button
                onClick={() => {
                  setEditingRecord(undefined);
                  setShowUpsert(true);
                }}
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

const UpsertPage = ({
  record,
  onBack,
}: {
  record?: IRole;
  onBack: () => void;
}) => {
  const { modal } = App.useApp();
  return <UpsertData record={record} onBack={onBack} hook={modal} />;
};

const UpsertData = ({
  record,
  onBack,
  hook,
}: {
  record?: IRole;
  onBack: () => void;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IRole>(record || defaultData);
  const [usermenu, setUsermenu] = useState<IPermission[]>(
    record
      ? (MergeMenu(
          defaultMenu,
          JSON.parse(String(record.permission) || "[]"),
        ) as IPermission[])
      : defaultMenu,
  );

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
        url: import.meta.env.VITE_API_URL + "/role?id=" + record?.id,
        method: record ? "PUT" : "POST",
        data: {
          ...data,
          permission: usermenu.filter((u) => u.access.length !== 0),
        },
        headers: { "Content-Type": "Application/json" },
      })
      .then(async (res) => {
        if (res.status === 201 || res.status === 200) {
          hook.success({
            title: "BERHASIL",
            content: res.data.msg,
          });
          onBack();
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

  // Get available permissions dari menu config
  const getAvailablePermissions = (path: string): string[] => {
    const menu = defaultMenu.find((m) => m.path === path);
    return (
      menu?.can_access || [
        "read",
        "write",
        "update",
        "delete",
        "proses",
        "download",
      ]
    );
  };

  // Group permissions by application
  const getGroupedPermissions = () => {
    const groups: {
      [key: string]: {
        title: string;
        color: string;
        icon: string;
        items: IPermission[];
      };
    } = {
      aplikasi: {
        title: "⚙️ Administrasi",
        color: "#fa541c",
        icon: "⚙️",
        items: [],
      },
      earsip: {
        title: "📁 E-Arsip",
        color: "#0958d9",
        icon: "📁",
        items: [],
      },
      callreport: {
        title: "📞 Call Report",
        color: "#13c2c2",
        icon: "📞",
        items: [],
      },
      absensi: {
        title: "📋 Absensi",
        color: "#52c41a",
        icon: "📋",
        items: [],
      },
      guestbook: {
        title: "👥 Buku Tamu",
        color: "#faad14",
        icon: "👥",
        items: [],
      },
    };

    usermenu.forEach((item) => {
      if (item.path.includes("earsip")) {
        groups.earsip.items.push(item);
      } else if (
        item.path.includes("callreport") ||
        item.path.includes("creport")
      ) {
        groups.callreport.items.push(item);
      } else if (
        item.path.includes("guestbook") ||
        item.path.includes("gbook_type")
      ) {
        groups.guestbook.items.push(item);
      } else if (
        item.path.includes("absence") ||
        item.path.includes("absensi") ||
        item.path.includes("absence_config") ||
        item.path.includes("attendance") ||
        item.path.includes("kiosk") ||
        item.path.includes("permit_absence") ||
        item.path.includes("payroll") ||
        item.path.includes("user_cost")
      ) {
        groups.absensi.items.push(item);
      } else {
        groups.aplikasi.items.push(item);
      }
    });

    return Object.entries(groups)
      .filter(([_, group]) => group.items.length > 0)
      .map(([key, group]) => ({
        key,
        ...group,
      }));
  };

  const groupedPermissions = getGroupedPermissions();

  // Function untuk toggle individual access
  const toggleAccess = useCallback((path: string, accessType: string) => {
    setUsermenu((prev) => {
      return prev.map((p) => {
        if (p.path === path) {
          const newAccess = p.access.includes(accessType)
            ? p.access.filter((a) => a !== accessType)
            : [...p.access, accessType];
          return { ...p, access: newAccess };
        }
        return p;
      });
    });
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        // maxHeight: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px",
          borderBottom: "1px solid #f0f0f0",
          background: "#fff",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: "700",
              color: "#0958d9",
            }}
          >
            {record ? `✎ ${record.name}` : "✚ Buat Role"}
          </h1>
          <p style={{ margin: "4px 0 0 0", color: "#999", fontSize: "12px" }}>
            {record ? "Edit hak akses" : "Tambah role baru"}
          </p>
        </div>
        <Space>
          <Button onClick={onBack} icon={<ArrowLeft size={16} />}>
            Kembali
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={!data.name}
            icon={<CheckCircle size={16} />}
          >
            Simpan
          </Button>
        </Space>
      </div>

      {/* Main Content - Scrollable */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Card
            size="small"
            style={{
              border: "1px solid #e8e8e8",
            }}
            title={
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#0958d9",
                }}
              >
                📋 Info Dasar
              </span>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div>
                  <Text
                    strong
                    style={{
                      fontSize: "12px",
                      display: "block",
                      marginBottom: "8px",
                      color: "#0958d9",
                    }}
                  >
                    ID Role
                  </Text>
                  <Input
                    placeholder="Auto"
                    value={data.id}
                    onChange={(e) => setData({ ...data, id: e.target.value })}
                    size="small"
                  />
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div>
                  <Text
                    strong
                    style={{
                      fontSize: "12px",
                      display: "block",
                      marginBottom: "8px",
                      color: "#0958d9",
                    }}
                  >
                    Nama Role <span style={{ color: "red" }}>*</span>
                  </Text>
                  <Input
                    placeholder="Misal: Admin, Manager"
                    value={data.name}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    size="small"
                    status={!data.name ? "warning" : ""}
                  />
                </div>
              </Col>
              <Col xs={24}>
                <div>
                  <Text
                    strong
                    style={{
                      fontSize: "12px",
                      display: "block",
                      marginBottom: "8px",
                      color: "#0958d9",
                    }}
                  >
                    🔐 Akses Data
                  </Text>
                  <Segmented
                    value={data.data_status || "ALL"}
                    onChange={(value) =>
                      setData({ ...data, data_status: value as "ALL" | "USER" })
                    }
                    options={[
                      { label: "Semua Data", value: "SEMUA" },
                      { label: "Data Pribadi", value: "USER" },
                    ]}
                    block
                  />
                </div>
              </Col>
            </Row>
          </Card>

          {/* Permission Card */}
          <Card
            size="small"
            style={{
              border: "1px solid #e8e8e8",
            }}
            title={
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#fa541c",
                }}
              >
                🔑 Hak Akses
              </span>
            }
          >
            <Tabs
              items={groupedPermissions.map((group) => ({
                key: group.key,
                label: (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>{group.title.split(" ")[0]}</span>
                    <Badge
                      count={
                        group.items.filter((i) => i.access.length > 0).length
                      }
                      style={{
                        backgroundColor: group.color,
                        fontSize: "10px",
                        fontWeight: 700,
                      }}
                    />
                  </span>
                ),
                children: (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      paddingTop: "8px",
                    }}
                  >
                    {group.items.map((item) => {
                      const availablePermissions = getAvailablePermissions(
                        item.path,
                      );
                      const allPermissions = [
                        { label: "Baca", value: "read", icon: "👁️" },
                        { label: "Tulis", value: "write", icon: "✍️" },
                        { label: "Update", value: "update", icon: "🔄" },
                        { label: "Hapus", value: "delete", icon: "🗑️" },
                        { label: "Proses", value: "proses", icon: "⚡" },
                        { label: "Download", value: "download", icon: "⬇️" },
                      ];
                      const filteredPermissions = allPermissions.filter((p) =>
                        availablePermissions.includes(p.value),
                      );

                      return (
                        <div
                          key={item.path}
                          style={{
                            padding: "12px",
                            background: "#fafafa",
                            border: "1px solid #eee",
                            borderRadius: "6px",
                            transition: "all 0.3s",
                            borderLeft: `4px solid ${group.color}`,
                          }}
                        >
                          <div
                            style={{
                              marginBottom: "10px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  color: "#1a1a1a",
                                  marginBottom: "4px",
                                }}
                              >
                                {item.name}
                              </div>
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "#999",
                                }}
                              >
                                {item.path}
                              </div>
                            </div>
                            {item.access.length > 0 && (
                              <Badge
                                count={item.access.length}
                                style={{
                                  backgroundColor: group.color,
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  padding: "0 6px",
                                }}
                              />
                            )}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "8px",
                            }}
                          >
                            {filteredPermissions.map((access) => (
                              <label
                                key={access.value}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "6px 10px",
                                  background: item.access.includes(access.value)
                                    ? group.color + "15"
                                    : "#fff",
                                  border: `1px solid ${
                                    item.access.includes(access.value)
                                      ? group.color
                                      : "#d9d9d9"
                                  }`,
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  userSelect: "none",
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  color: item.access.includes(access.value)
                                    ? group.color
                                    : "#666",
                                  transition: "all 0.2s",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={item.access.includes(access.value)}
                                  onChange={() =>
                                    toggleAccess(item.path, access.value)
                                  }
                                  style={{
                                    cursor: "pointer",
                                    accentColor: group.color,
                                  }}
                                />
                                <span>{access.icon}</span>
                                <span>{access.label}</span>
                              </label>
                            ))}
                          </div>

                          {filteredPermissions.length === 1 && (
                            <div
                              style={{
                                marginTop: "8px",
                                fontSize: "11px",
                                color: "#999",
                                fontStyle: "italic",
                              }}
                            >
                              ℹ️ Menu ini hanya memiliki akses{" "}
                              {filteredPermissions[0].label}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ),
              }))}
            />
          </Card>

          {/* Access Summary */}
          <Card
            size="small"
            style={{
              border: "1px solid #e8e8e8",
            }}
            title={
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#0958d9",
                }}
              >
                📊 Ringkasan
              </span>
            }
          >
            <Row gutter={[12, 12]}>
              {groupedPermissions.map((group) => {
                const accessCount = group.items.filter(
                  (i) => i.access.length > 0,
                ).length;
                const percentage = Math.round(
                  (accessCount / group.items.length) * 100,
                );
                return (
                  <Col key={group.key} xs={12} sm={6}>
                    <div
                      style={{
                        padding: "10px",
                        background: "#f9f9f9",
                        border: "1px solid #eee",
                        borderRadius: "4px",
                      }}
                    >
                      <div
                        style={{
                          color: group.color,
                          fontWeight: 700,
                          fontSize: "12px",
                          marginBottom: "4px",
                        }}
                      >
                        {group.title}
                      </div>
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: 700,
                          color: group.color,
                        }}
                      >
                        {accessCount}/{group.items.length}
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#999",
                          marginTop: "4px",
                        }}
                      >
                        {percentage}%
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card>
        </div>
      </div>
    </div>
  );
};

const defaultMenu: IPermission[] = menus
  .filter((u) => u.need_access)
  .flatMap((m) => {
    if (m.children && m.children.length > 0) {
      return m.children
        .filter((c) => c.need_access)
        .map((c) => ({
          ...c,
          access: [],
        }));
    } else {
      return {
        ...m,
        access: [],
      };
    }
  });
function MergeMenu(allmenus: IPermission[], usermenus: IPermission[]) {
  const mergedMenu = allmenus.map((item) => {
    const found = usermenus.find((r) => r.path === item.path);
    return {
      ...item,
      access: found ? found.access : [],
    };
  });
  return mergedMenu;
}

const defaultData: IRole = {
  id: "",
  name: "",
  status: true,
  created_at: new Date(),
  updated_at: new Date(),
  permission: [],
  data_status: "ALL",
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
  record: IRole;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await api
      .request({
        url: import.meta.env.VITE_API_URL + "/role?id=" + record?.id,
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
