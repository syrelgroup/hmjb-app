import { useEffect, useState } from "react";
import {
  Table,
  Empty,
  Button,
  Space,
  Modal,
  message,
  Input,
  Popover,
  Select,
  DatePicker,
  Tag,
  App,
  Row,
  Col,
  Card,
  Avatar,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CloseOutlined,
  FormOutlined,
  FilePdfOutlined,
  EyeOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import api from "../../libs/api";
import type {
  IActionPage,
  IFile,
  IPageProps,
  IPermitFile,
  IPermitFileDetail,
  ISubmission,
  IUser,
} from "../../libs/interface";
import { Filter } from "lucide-react";
import dayjs from "dayjs";
import useContext from "../../libs/context";
import moment from "moment";
import type { HookAPI } from "antd/es/modal/useModal";
import { CollapseText } from "../utils/utilComp";
import { InputUtil } from "../utils/utilForm";
import Text from "antd/es/typography/Text";
const { RangePicker } = DatePicker;

const PermitDownload = () => {
  const [data, setData] = useState<IPageProps<IPermitFile>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
    permit_status: "",
    backdate: "",
  });
  const [pageaction, setPageaction] = useState<IActionPage<IPermitFile>>({
    upsert: false,
    delete: false,
    process: false,
    record: undefined,
  });
  const [submissions, setSubmissions] = useState<ISubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const { hasAccess, user } = useContext();
  const { modal } = App.useApp();

  useEffect(() => {
    (async () => {
      await api
        .get(import.meta.env.VITE_API_URL + "/submission?limit=10000")
        .then((res) => setSubmissions(res.data.data));
    })();
  }, []);

  useEffect(() => {
    fetchData();
  }, [data.page, data.limit, data.search, data.permit_status, data.backdate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.request({
        url: "/permit_download",
        method: "GET",
        params: {
          page: data.page,
          limit: data.limit,
          search: data.search,
          permit_status: data.permit_status,
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
      title: "Hapus Permohonan Download",
      content: "Apakah Anda yakin ingin menghapus data ini?",
      okText: "Ya",
      cancelText: "Tidak",
      onOk: async () => {
        try {
          await api.request({
            url: import.meta.env.VITE_API_URL + "/permit_download",
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

  const columns: ColumnsType<IPermitFile> = [
    {
      title: "ID",
      key: "id",
      dataIndex: "id",
      fixed: window.innerWidth > 600 ? "left" : undefined,
      render(value, _record, index) {
        return (
          <>
            <div>{(data.page - 1) * data.limit + index + 1}</div>
            <div className="text-xs opacity-80">{value}</div>
          </>
        );
      },
    },
    {
      title: "Pemohon",
      dataIndex: ["Requester", "fullname"],
      key: "nasabah",
    },
    {
      title: "Permohonan",
      dataIndex: ["Submission"],
      key: "nik",
      render(_value, record, _index) {
        return (
          <div>
            {record.PermitFileDetail.map((d) => (
              <div key={d.id}>
                {d.Submission?.id} :{" "}
                <span className="text-xs opacity-80">
                  ({d.Files.map((f) => f.name).join(", ")})
                </span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: "Keterangan",
      dataIndex: "description",
      key: "desc",
      render(_value, record, _index) {
        return <CollapseText text={record.description || ""} />;
      },
    },
    {
      title: "Status",
      dataIndex: "permit_status",
      key: "permit_status",
      render(_value, record, _index) {
        return (
          <div>
            <Tag
              style={{ width: 100, textAlign: "center" }}
              color={
                record.permit_status === "DITOLAK"
                  ? "red"
                  : record.permit_status === "PENDING"
                    ? "orange"
                    : "green"
              }
              variant="solid"
            >
              {record.permit_status}
            </Tag>
            <div className="text-xs opacity-80">
              {record.Approver?.fullname}{" "}
              {record.Approver &&
                `(at ${moment(record.process_at).format("DD-MM-YYYY")})`}
            </div>
          </div>
        );
      },
    },
    {
      title: "Tanggal",
      dataIndex: "tanggal",
      key: "tanggal",
      render(_value, record, _index) {
        return (
          <div>
            <div>{moment(record.created_at).format("DD-MM-YYYY")}</div>
            <div className="text-xs opacity-80">
              {moment(record.updated_at).format("DD-MM-YYYY")}
            </div>
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
            icon={<FormOutlined />}
            onClick={() =>
              setPageaction({ ...pageaction, process: true, record })
            }
          />
          {hasAccess(window.location.pathname, "update") && (
            <Button
              type="default"
              size="small"
              icon={<EditOutlined />}
              onClick={() =>
                setPageaction({ ...pageaction, upsert: true, record })
              }
              disabled={record.permit_status === "DISETUJUI"}
            />
          )}
          {hasAccess(window.location.pathname, "delete") && (
            <Button
              danger
              size="small"
              disabled={record.permit_status === "DISETUJUI" ? true : false}
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
        <p className="mb-1">Status Permohonan</p>
        <Select
          placeholder="Pilih status permohonan.."
          className="w-full"
          options={[
            { label: "DISETUJUI", value: "DISETUJUI" },
            { label: "DITOLAK", value: "DITOLAK" },
            { label: "PENDING", value: "PENDING" },
          ]}
          onChange={(val) => setData({ ...data, permit_status: val })}
          allowClear
          value={data.permit_status}
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
              permit_status: "",
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
        <h1 className="text-2xl font-bold">Permohonan Download Berkas</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() =>
            setPageaction({ ...pageaction, upsert: true, record: undefined })
          }
        >
          Tambah
        </Button>
      </div>

      <div className="bg-white p-2 rounded-lg">
        <div className="flex-1 flex items-center justify-end gap-2 mb-2">
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
              type={data.permit_status || data.backdate ? "primary" : undefined}
            >
              <Filter size={14} /> Filter
            </Button>
          </Popover>
        </div>

        <Table
          columns={columns}
          dataSource={data.data}
          loading={loading}
          rowKey={"id"}
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
            y: window.innerWidth > 600 ? "53vh" : "65vh",
          }}
        />
      </div>

      <UpsertData
        open={pageaction.upsert}
        setOpen={() => setPageaction({ ...pageaction, upsert: false })}
        submissions={submissions}
        getData={fetchData}
        hook={modal}
        key={pageaction.record ? "upsert" + pageaction.record.id : "create"}
        record={pageaction.record}
      />
      {pageaction.record && (
        <ProsesPermohonan
          open={pageaction.process}
          setOpen={() => setPageaction({ ...pageaction, process: false })}
          getData={fetchData}
          hook={modal}
          key={pageaction.record.id}
          record={pageaction.record}
          user={user as IUser}
          hasAccess={hasAccess}
        />
      )}
    </div>
  );
};

export default PermitDownload;

const UpsertData = ({
  open,
  setOpen,
  getData,
  hook,
  record,
  submissions,
}: {
  open: boolean;
  setOpen: Function;
  getData: Function;
  record?: IPermitFile;
  hook: HookAPI;
  submissions: ISubmission[];
}) => {
  const [data, setData] = useState(record || defaultData);
  const [loading, setloading] = useState(false);

  const handleSubmit = async () => {
    setloading(true);
    await api
      .request({
        url: import.meta.env.VITE_API_URL + "/permit_download",
        method: record ? "PUT" : "POST",
        data: data,
      })
      .then((res) => {
        if (res.status === 200) {
          hook.success({
            title: "Berhasil",
            content: record
              ? "Data berhasil diperbarui"
              : "Data berhasil ditambahkan",
          });
          setOpen(false);
          getData();
        } else {
          hook.error({
            title: "Error",
            content: res.data.msg || "Internal Server Error",
          });
        }
      })
      .catch((err) => {
        console.log(err);
        hook.error({
          title: "Error",
          content: err.message || "Internal Server Error",
        });
      });
    setloading(false);
  };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      title="UPSERT PERMOHONAN DOWNLOAD"
      style={{ top: 20 }}
      width={1000}
      onOk={() => handleSubmit()}
      loading={loading}
      okButtonProps={{ disabled: data.PermitFileDetail.length === 0 }}
    >
      <InputUtil
        type="area"
        label="Keterangan"
        value={data.description}
        onchage={(e: string) => setData({ ...data, description: e })}
      />
      <div>
        {data?.PermitFileDetail?.map((d, i) => (
          <div
            className="my-2 flex flex-col gap-1 border border-dashed p-2 ml-4 rounded"
            key={i}
          >
            <div>
              <p>
                Data Permohonan <span className="text-red-500 text-xs">*</span>
              </p>
              <Select
                value={d.submissionId}
                options={submissions.map((s) => ({
                  label: `${s.Debitur.fullname} (${s.id})`,
                  value: s.id,
                }))}
                allowClear
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                showSearch
                style={{ width: "100%" }}
                onChange={(e) =>
                  setData({
                    ...data,
                    PermitFileDetail: data.PermitFileDetail.map((s, si) => ({
                      ...s,
                      ...(i === si && {
                        Submission: submissions.find((sf) => sf.id === e),
                        submissionId: e,
                      }),
                    })),
                  })
                }
              />
            </div>
            <div>
              <p>
                Daftar Berkas <span className="text-red-500 text-xs">*</span>
              </p>
              <Select
                mode="tags"
                value={d.Files.map((f) => f.id)}
                options={d.Submission?.Files?.map((f) => ({
                  label: f.name,
                  value: f.id,
                }))}
                onChange={(e) =>
                  setData({
                    ...data,
                    PermitFileDetail: data.PermitFileDetail.map((s, si) => ({
                      ...s,
                      ...(i === si && {
                        Files: d.Submission?.Files.filter((item) =>
                          e.includes(item.id),
                        ),
                      }),
                    })),
                  })
                }
                style={{ width: "100%" }}
                placeholder="Files"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="my-2">
        <Button
          onClick={() =>
            setData({
              ...data,
              PermitFileDetail: [...data.PermitFileDetail, defaultDetail],
            })
          }
          type="primary"
          size="small"
          block
        >
          Tambahkan detail
        </Button>
      </div>
    </Modal>
  );
};

const ProsesPermohonan = ({
  open,
  setOpen,
  getData,
  hook,
  record,
  user,
  hasAccess,
}: {
  open: boolean;
  setOpen: Function;
  getData: Function;
  record: IPermitFile;
  hook: HookAPI;
  user: IUser;
  hasAccess: Function;
}) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<IFile | null>(null);
  const [data, setData] = useState({
    approv_desc: "",
    permit_status: record.permit_status,
    process_at: record.process_at || new Date(),
  });

  const handleProses = async () => {
    setLoading(true);
    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/permit_download?id=${record.id}`,
        method: "PATCH",
        data: data,
      })
      .then(async (res) => {
        if (res.data.status === 200) {
          hook.success({
            title: "BERHASIL",
            content: "Data berhasil diproses!",
          });
          setOpen(false);
          await getData();
        } else {
          hook.error({ title: "GAGAL", content: "Data gagal diproses!" });
        }
      })
      .catch((err) => {
        console.log(err);
        hook.error({
          title: "GAGAL",
          content: err.message || "Internal Server Error",
        });
      });
    setLoading(false);
  };

  const handleDownload = async (
    url: string,
    fileName: string,
    fileId?: string,
    isOneTimeDownload?: boolean,
  ) => {
    try {
      // Membuat elemen link sementara untuk download
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Mark as downloaded (remove user from allow_download) jika one-time download
      if (isOneTimeDownload && fileId) {
        await api
          .request({
            url: `${import.meta.env.VITE_API_URL}/file?id=${fileId}`,
            method: "PATCH",
          })
          .then(() => {
            // Silently update - user sudah selesai download
            getData();
          })
          .catch((err) => {
            console.error("Failed to mark download:", err);
            // Continue anyway - download already happened
          });
      }
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        title="DETAIL PERMOHONAN DOWNLOAD"
        style={{ top: 20 }}
        width={1000}
        loading={loading}
        footer={[]}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <p className="border-b border-dashed mb-2">
              Detail Permohonan Download
            </p>
            <InputUtil
              disabled
              label="Pemohon"
              type="text"
              value={record.Requester?.fullname}
            />
            <InputUtil
              disabled
              label="Keterangan"
              type="area"
              value={record.description}
            />
            <div className="my-2 ml-4">
              {record.PermitFileDetail.map((d) => (
                <div key={d.id}>
                  <div className="flex gap-4">
                    <p style={{ width: 100 }}>Permohonan </p>
                    <p style={{ width: 5 }}>:</p>
                    <p className="flex-1">
                      {d.Submission?.Debitur.fullname} ({d.Submission?.id})
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <p style={{ width: 100 }}>Files</p>
                    <p style={{ width: 5 }}>:</p>
                    <div className="flex-1 flex gap-2">
                      <Row gutter={[12, 12]}>
                        {d.Files?.map((file: IFile) => (
                          <Col key={file.id} span={24}>
                            <Card
                              size="small"
                              hoverable
                              styles={{ body: { padding: 5 } }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    flex: 1,
                                    minWidth: 0,
                                  }}
                                >
                                  {/* Avatar / Icon */}
                                  <Avatar
                                    shape="square"
                                    icon={<FilePdfOutlined />}
                                    style={{
                                      backgroundColor: "#fff1f0",
                                      color: "#ff4d4f",
                                      marginRight: 12,
                                      flexShrink: 0,
                                    }}
                                  />

                                  {/* Nama File */}
                                  <Text
                                    ellipsis={{ tooltip: file.name }}
                                    style={{
                                      fontSize: "13px",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {file.name}
                                  </Text>
                                </div>

                                <div className="flex gap-1">
                                  <Tooltip title="Preview PDF">
                                    <Button
                                      size="small"
                                      icon={<EyeOutlined />}
                                      onClick={() => setPreview(file)}
                                    ></Button>
                                  </Tooltip>
                                  <Tooltip
                                    title={
                                      user &&
                                      (file.allow_download
                                        .split(",")
                                        .includes(user.id) ||
                                        hasAccess(
                                          "/app/earsip/permit_download",
                                          "download",
                                        ) ||
                                        hasAccess(
                                          "/app/earsip/permit_download",
                                          "proses",
                                        ) ||
                                        record.requesterId === user.id)
                                        ? "Download PDF"
                                        : "Anda tidak memiliki akses untuk download file ini"
                                    }
                                  >
                                    <Button
                                      size="small"
                                      icon={<PrinterOutlined />}
                                      onClick={() => {
                                        // Determine if this is a one-time download (from permit)
                                        const isOneTimeDownload =
                                          file.allow_download
                                            .split(",")
                                            .includes(user?.id || "") &&
                                          record.requesterId !== user?.id &&
                                          !hasAccess(
                                            "/app/earsip/permit_download",
                                            "download",
                                          ) &&
                                          !hasAccess(
                                            "/app/earsip/permit_download",
                                            "proses",
                                          );
                                        handleDownload(
                                          file.url,
                                          file.name,
                                          file.id,
                                          isOneTimeDownload,
                                        );
                                      }}
                                      disabled={
                                        !user ||
                                        (!file.allow_download
                                          .split(",")
                                          .includes(user.id) &&
                                          !hasAccess(
                                            "/app/earsip/permit_download",
                                            "download",
                                          ) &&
                                          !hasAccess(
                                            "/app/earsip/permit_download",
                                            "proses",
                                          ) &&
                                          record.requesterId !== user.id)
                                      }
                                    ></Button>
                                  </Tooltip>
                                </div>
                              </div>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <p className="border-b border-dashed mb-2">
              Proses Permohonan Download
            </p>
            <InputUtil
              label="Catatan"
              value={data.approv_desc}
              type="area"
              disabled={!hasAccess("/app/earsip/permit_download", "proses")}
              onchage={(e: string) => setData({ ...data, approv_desc: e })}
            />
            <div className="my-2 flex justify-end gap-4">
              <Button
                // Jika status 'APPROVED', beri warna hijau (success), jika tidak 'default'
                type={
                  data.permit_status === "DISETUJUI" ? "primary" : "default"
                }
                danger={false}
                style={{
                  backgroundColor:
                    data.permit_status === "DISETUJUI" ? "#52c41a" : "",
                  color: data.permit_status === "DITOLAK" ? "white" : "",
                }}
                onClick={() => setData({ ...data, permit_status: "DISETUJUI" })}
                disabled={record.permit_status !== "PENDING"}
              >
                SETUJU
              </Button>

              <Button
                // Jika status 'REJECTED', beri warna merah (danger)
                type={data.permit_status === "DITOLAK" ? "primary" : "default"}
                danger={data.permit_status === "DITOLAK"}
                onClick={() => setData({ ...data, permit_status: "DITOLAK" })}
                disabled={record.permit_status !== "PENDING"}
              >
                TOLAK
              </Button>
            </div>

            <Button
              type="primary"
              block
              style={{ marginTop: 10 }}
              onClick={() => handleProses()} // Hubungkan fungsi submit di sini
              loading={loading} // Pastikan loading state terpasang
              disabled={
                data.permit_status === "PENDING" ||
                !hasAccess("/app/earsip/permit_download", "proses")
              }
            >
              Submit
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        open={preview ? true : false}
        onCancel={() => setPreview(null)}
        footer={null}
        width="80%"
        style={{ top: 20 }}
        styles={{ body: { height: "80vh", padding: 0 } }}
        destroyOnHidden
      >
        {preview && (
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "#f0f0f0",
            }}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            onDragOver={(e) => e.preventDefault()}
          >
            {preview.url.match(/\.(mp4|webm|ogg)$/i) ? (
              <video
                controls
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#000",
                  userSelect: "none",
                }}
              >
                <source src={preview.url} type="video/mp4" />
                Browser Anda tidak mendukung tag video.
              </video>
            ) : preview.url.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
              <img
                src={preview.url}
                alt={preview.name}
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                onMouseDown={(e) => e.preventDefault()}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
            ) : (
              <iframe
                src={`${preview.url}#toolbar=0&navpanes=0&scrollbar=0`}
                width="100%"
                height="100%"
                style={{ border: "none" }}
                title="File Preview"
                onContextMenu={(e) => e.preventDefault()}
              />
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

const defaultData: IPermitFile = {
  id: "",
  action: "DOWNLOAD",
  permit_status: "PENDING",
  description: "",
  approv_desc: "",
  process_at: new Date(),
  PermitFileDetail: [],

  Requester: {} as IUser,
  requesterId: "",
  approverId: null,
  status: true,
  created_at: new Date(),
  updated_at: new Date(),
};

const defaultDetail: IPermitFileDetail = {
  id: "",
  submissionId: "",
  Files: [],
  permitFileId: "",
};
