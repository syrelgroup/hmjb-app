import {
  App,
  Button,
  Input,
  Modal,
  Table,
  type TableProps,
  message as antdMessage,
  Upload,
  Tag,
} from "antd";
import { Import, Plus, Trash } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import type { IActionPage, IBilling, IPageProps } from "../../libs/interface";
import type { HookAPI } from "antd/es/modal/useModal";
import api from "../../libs/api";
import useContext from "../../libs/context";
import { IDRFormat } from "../utils/utilForm";
import moment from "moment";
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { ExportData } from "../../libs/helper";

export default function DataBilling() {
  const [loading, setLoading] = useState(false);
  const [pageprops, setPageprops] = useState<IPageProps<IBilling>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
    backdate: "",
  });
  const [action, setAction] = useState<IActionPage<IBilling>>({
    upsert: false,
    delete: false,
    process: false,
    record: undefined,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<IBilling[]>([]);
  const [showProcess, setShowProcess] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateRecord, setUpdateRecord] = useState<IBilling | undefined>();
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
    if (pageprops.backdate) {
      params.append("backdate", pageprops.backdate);
    }
    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/billing?${params.toString()}`,
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
  }, [pageprops.page, pageprops.limit, pageprops.search, pageprops.backdate]);

  const columns: TableProps<IBilling>["columns"] = [
    {
      title: "Select",
      key: "select",
      width: 50,
      align: "center",
      render(_value, _record) {
        return null; // Menggunakan default checkbox dari table selection
      },
    },
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
      title: "Nasabah",
      key: "name",
      dataIndex: "name",
    },
    {
      title: "Nominal",
      key: "value",
      dataIndex: "value",
      render(_value, record) {
        return (
          <div>
            <div>Tagihan : {IDRFormat(record.value)}</div>
            <div>Realisasi : {IDRFormat(record.realize_value)}</div>
          </div>
        );
      },
    },
    {
      title: "Tanggal",
      key: "tgl",
      dataIndex: "tgl",
      render(_value, record) {
        return (
          <div>
            <div>Tagihan : {moment(record.bill_date).format("DD/MM/YYYY")}</div>
            <div>
              Realisasi :{" "}
              {record.paid_date
                ? moment(record.paid_date).format("DD/MM/YYYY")
                : "-"}
            </div>
          </div>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "status",
      render(_value, record) {
        return (
          <div className="flex justify-center">
            <Tag
              color={
                record.bill_status === "BAYAR"
                  ? "green"
                  : record.bill_status === "BELUMBAYAR"
                    ? "red"
                    : "cyan"
              }
              variant="solid"
            >
              {record.bill_status}
            </Tag>
          </div>
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
            {hasAccess(window.location.pathname, "write") && (
              <Button
                icon={<Plus size={15} />}
                size="small"
                type="primary"
                ghost
                onClick={() => {
                  setUpdateRecord(record);
                  setShowUpdate(true);
                }}
              >
                Edit
              </Button>
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
            Data Tagihan
          </h1>
        </div>
      </div>

      {/* --- FILTER & SEARCH --- */}
      <div className="bg-white p-2">
        <div className="bg-white  flex flex-wrap items-center gap-4 mb-2">
          <div className="flex-1 flex gap-2">
            {hasAccess(window.location.pathname, "write") && (
              <>
                <Button
                  onClick={() => setAction({ ...action, upsert: true })}
                  icon={<Import size={15} />}
                  type="primary"
                  size="small"
                >
                  Import
                </Button>
                {selectedRowKeys.length > 0 && (
                  <>
                    <Button
                      onClick={() => {
                        if (selectedRowKeys.length === pageprops.data.length) {
                          setSelectedRowKeys([]);
                          setSelectedRows([]);
                        } else {
                          setSelectedRowKeys(pageprops.data.map((d) => d.id));
                          setSelectedRows(pageprops.data);
                        }
                      }}
                      type="default"
                      size="small"
                    >
                      {selectedRowKeys.length === pageprops.data.length
                        ? "Batal Select All"
                        : "Select All"}
                    </Button>
                    <Button
                      onClick={() => setShowProcess(true)}
                      type="primary"
                      danger
                      size="small"
                    >
                      Proses ({selectedRowKeys.length})
                    </Button>
                  </>
                )}
              </>
            )}
            <Button
              onClick={() =>
                ExportData(
                  pageprops.data.map((d) => ({
                    name: d.name,
                    nominal_tagihan: d.value,
                    nominal_realisasi: d.realize_value,
                    tanggal_tagih: moment(d.bill_date).format("DD/MM/YYYY"),
                    tanggal_tertagih: d.paid_date
                      ? moment(d.paid_date).format("DD/MM/YYYY")
                      : "-",
                    status: d.bill_status,
                  })),
                  "data_tagihan",
                )
              }
              icon={<DownloadOutlined size={15} />}
              size="small"
            >
              Export
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-end gap-2">
            <Input.Search
              type="text"
              placeholder="Cari Nama Kategori/ID..."
              className="w-full transition-all"
              size="small"
              width={200}
              style={{ width: 200 }}
              onChange={(e) =>
                setPageprops({ ...pageprops, search: e.target.value })
              }
            />
            {/* <Button size="small">
              <Filter size={14} /> Filter
            </Button> */}
          </div>
        </div>

        <Table
          size="small"
          loading={loading}
          rowKey={"id"}
          bordered
          rowSelection={{
            selectedRowKeys: selectedRowKeys,
            onChange: (keys, rows) => {
              setSelectedRowKeys(keys);
              setSelectedRows(rows);
            },
          }}
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
              setSelectedRowKeys([]);
              setSelectedRows([]);
            },
            pageSizeOptions: [50, 100, 500, 1000, 10000],
            size: "small",
          }}
        />
      </div>
      <UpsertData
        open={action.upsert}
        setOpen={(val: boolean) =>
          setAction({ ...action, upsert: val, record: undefined })
        }
        getData={getData}
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
      {showProcess && (
        <ProcessData
          open={showProcess}
          setOpen={setShowProcess}
          selectedRows={selectedRows}
          getData={getData}
          hook={modal}
          onSuccess={() => {
            setSelectedRowKeys([]);
            setSelectedRows([]);
          }}
        />
      )}
      {showUpdate && updateRecord && (
        <UpdateData
          open={showUpdate}
          setOpen={setShowUpdate}
          record={updateRecord}
          getData={getData}
          hook={modal}
        />
      )}
    </div>
  );
}

const UpsertData = ({
  open,
  setOpen,
  getData,
}: {
  open: boolean;
  setOpen: Function;
  getData: Function;
}) => {
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  const handleFileChange = ({ fileList: newFileList }: any) => {
    // Membatasi hanya 1 file saja yang aktif di list
    setFileList(newFileList.slice(-1));
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (fileList.length === 0) {
      antdMessage.warning("Pilih file terlebih dahulu!");
      return;
    }

    const formData = new FormData();
    // fileList[0].originFileObj berisi file mentah yang dibutuhkan backend
    formData.append("file", fileList[0].originFileObj);

    setLoading(true);
    setMessage("");

    try {
      // PERBAIKAN: Di Axios, formData dikirim langsung sebagai argumen kedua
      const response = await api.post("/billing", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        // Menyesuaikan struktur response data dari backend Anda
        const resData = response.data;
        antdMessage.success("Data berhasil diimport!");
        setMessage(
          `Sukses: ${resData.message || "Berhasil"} (${resData.total_data || 0} data diproses)`,
        );
        setFileList([]); // Reset file list setelah sukses
        await getData();
      } else {
        setMessage(`Gagal: ${response.data?.message || "Terjadi kesalahan"}`);
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      const errorMsg =
        error.response?.data?.message || "Terjadi kesalahan koneksi ke server.";
      antdMessage.error(errorMsg);
      setMessage(`Gagal: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => {
        setOpen(false);
        setMessage("");
        setFileList([]);
      }}
      footer={null} // Menyembunyikan tombol bawaan modal agar serasi dengan form di dalam
      centered
      destroyOnHidden
      style={{ top: 20 }}
    >
      <div className="p-6 text-center">
        {/* Judul & Deskripsi */}
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Import Data</h2>
        <p className="text-gray-500 text-sm mb-6">
          Unggah file Excel Anda untuk menambah data ke sistem.
        </p>

        {/* Banner Download Format Template */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between text-left">
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-0.5">
              Belum punya formatnya?
            </p>
            <p className="text-xs text-blue-700 m-0">
              Gunakan template standar agar tidak terjadi galat data.
            </p>
          </div>
          <a
            href="/upload-tagihan-example.xlsx"
            download="upload-tagihan-example.xlsx"
            className="no-underline"
          >
            <Button
              type="primary"
              ghost
              icon={<DownloadOutlined />}
              size="small"
            >
              Template
            </Button>
          </a>
        </div>

        {/* Form Utama */}
        <form onSubmit={handleUpload} className="space-y-4">
          <Upload
            beforeUpload={() => false} // Menahan auto-upload bawaan Antd
            fileList={fileList}
            onChange={handleFileChange}
            accept=".xlsx, .xls"
            maxCount={1}
            className="w-full block"
          >
            <Button
              icon={<UploadOutlined />}
              className="w-full h-11 border-dashed text-gray-600 hover:text-blue-500 hover:border-blue-500"
            >
              {fileList.length > 0 ? "Ganti File" : "Pilih File Excel / CSV"}
            </Button>
          </Upload>

          {/* Kotak Pesan Status */}
          {message && (
            <div
              className={`p-3 rounded-md text-sm font-medium ${message.startsWith("Gagal") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
            >
              {message}
            </div>
          )}

          {/* Tombol Aksi di dalam Modal */}
          <div className="flex gap-3 pt-2">
            <Button
              className="w-full h-10 border-gray-300 text-gray-600"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full h-10 bg-blue-600 hover:bg-blue-500 flex items-center justify-center"
            >
              {loading ? "Mengimport..." : "Upload & Import"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
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
  record: IBilling;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await api
      .request({
        url: import.meta.env.VITE_API_URL + "/billing?id=" + record?.id,
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

const ProcessData = ({
  open,
  setOpen,
  selectedRows,
  getData,
  hook,
  onSuccess,
}: {
  open: boolean;
  setOpen: Function;
  selectedRows: IBilling[];
  getData: Function;
  hook: HookAPI;
  onSuccess: Function;
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (selectedRows.length === 0) {
      hook.warning({
        title: "Peringatan",
        content: "Pilih minimal 1 data untuk diproses",
      });
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const updatePromises = selectedRows.map((record) =>
        api.request({
          url: `${import.meta.env.VITE_API_URL}/billing/${record.id}`,
          method: "PUT",
          data: {
            paid_date: new Date(today),
            realize_value: record.value,
            bill_status: "BAYAR",
          },
          headers: { "Content-Type": "Application/json" },
        }),
      );

      const results = await Promise.all(updatePromises);
      const allSuccess = results.every(
        (res) => res.status === 200 || res.status === 201,
      );

      if (allSuccess) {
        hook.success({
          title: "BERHASIL",
          content: `${selectedRows.length} data tagihan berhasil diproses`,
        });
        setOpen(false);
        onSuccess && (await onSuccess());
        getData && (await getData());
      } else {
        hook.error({
          title: "ERROR",
          content: "Beberapa data gagal diproses",
        });
      }
    } catch (err: any) {
      console.log(err);
      hook.error({
        title: "ERROR",
        content: err.message || "Internal Server Error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Konfirmasi Proses Data"
      onCancel={() => setOpen(false)}
      onOk={handleSubmit}
      okButtonProps={{ loading: loading }}
      okText="Proses"
      cancelText="Batal"
    >
      <div className="p-5 space-y-4">
        <p className="text-sm">
          Anda akan memproses{" "}
          <strong>{selectedRows.length} data tagihan</strong>.
        </p>
        <p className="text-sm">Data akan diupdate dengan:</p>
        <ul className="text-sm space-y-2 ml-4 list-disc">
          <li>Tanggal Pembayaran: Hari ini</li>
          <li>Nilai Realisasi: Sesuai nilai tagihan</li>
          <li>Status: BAYAR</li>
        </ul>
        <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-700 border border-yellow-200">
          <strong>Perhatian:</strong> Proses ini tidak dapat dibatalkan setelah
          dikonfirmasi.
        </div>
      </div>
    </Modal>
  );
};

const UpdateData = ({
  open,
  setOpen,
  record,
  getData,
  hook,
}: {
  open: boolean;
  setOpen: Function;
  record: IBilling;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: record.name,
    value: record.value || 0,
    realize_value: record.realize_value || 0,
    bill_date: record.bill_date ? moment(record.bill_date) : moment(),
    paid_date: record.paid_date ? moment(record.paid_date) : undefined,
    bill_status: record.bill_status || "BELUMBAYAR",
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await api.request({
        url: `${import.meta.env.VITE_API_URL}/billing/${record.id}`,
        method: "PUT",
        data: {
          name: formData.name,
          value: formData.value,
          realize_value: formData.realize_value,
          bill_date: formData.bill_date.toISOString(),
          paid_date: formData.paid_date
            ? formData.paid_date.toISOString()
            : null,
          bill_status: formData.bill_status,
        },
        headers: { "Content-Type": "Application/json" },
      });

      if (response.status === 200 || response.status === 201) {
        hook.success({
          title: "BERHASIL",
          content: "Data tagihan berhasil diupdate",
        });
        setOpen(false);
        getData && (await getData());
      } else {
        hook.error({
          title: "ERROR",
          content: response.data.msg || "Gagal mengupdate data",
        });
      }
    } catch (err: any) {
      console.log(err);
      hook.error({
        title: "ERROR",
        content: err.message || "Internal Server Error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Update Data Tagihan"
      onCancel={() => setOpen(false)}
      onOk={handleSubmit}
      okButtonProps={{ loading: loading }}
      okText="Simpan"
      cancelText="Batal"
      width={500}
    >
      <div className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nama Nasabah</label>
          <Input
            type="number"
            value={formData.name || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value,
              })
            }
            placeholder="Masukkan nama nasabah"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Nominal Tagihan
          </label>
          <Input
            type="number"
            value={formData.value}
            onChange={(e) =>
              setFormData({
                ...formData,
                value: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="Masukkan nominal tagihan"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Nilai Realisasi
          </label>
          <Input
            type="number"
            value={formData.realize_value}
            onChange={(e) =>
              setFormData({
                ...formData,
                realize_value: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="Masukkan nilai realisasi"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Tanggal Tagihan
          </label>
          <input
            type="date"
            value={formData.bill_date.format("YYYY-MM-DD")}
            onChange={(e) =>
              setFormData({
                ...formData,
                bill_date: moment(e.target.value),
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Tanggal Pembayaran
          </label>
          <input
            type="date"
            value={
              formData.paid_date ? formData.paid_date.format("YYYY-MM-DD") : ""
            }
            onChange={(e) =>
              setFormData({
                ...formData,
                paid_date: e.target.value ? moment(e.target.value) : undefined,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={formData.bill_status}
            onChange={(e) =>
              setFormData({ ...formData, bill_status: e.target.value as any })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded"
          >
            <option value="BELUMBAYAR">Belum Bayar</option>
            <option value="PARTIAL">Partial</option>
            <option value="BAYAR">Bayar</option>
          </select>
        </div>
      </div>
    </Modal>
  );
};
