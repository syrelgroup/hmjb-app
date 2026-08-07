import { App, Button, Card, Col, Divider, Row, Spin, Select } from "antd"; // Tambahkan Select
import type {
  IComments,
  IDebitur,
  IMitra,
  ISubmission,
  ISubType,
  IUser,
  IVisit,
  IVisitCategory,
  IVisitPurpose,
  IVisitStatus,
} from "../../libs/interface";
import { IDRFormat, IDRToNumber, InputUtil } from "../utils/utilForm";
import { InputFileUploadVisitAuto } from "../utils/InputFileUploadVisitAuto";
import { PlusCircleOutlined } from "@ant-design/icons";
import { BookPlus, FolderOpen, MessageCircle, User } from "lucide-react";
import { useEffect, useState, useRef } from "react"; // Tambahkan useRef
import moment from "moment";
import api from "../../libs/api";
import useContext from "../../libs/context";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function UpsertVisit({ record }: { record?: IVisit }) {
  const [loading, setLoading] = useState(false);
  const [visitCategories, setVisitCategories] = useState<IVisitCategory[]>([]);
  const [visitStatuses, setVisitStatuses] = useState<IVisitStatus[]>([]);
  const [visitPurposes, setVisitPurposes] = useState<IVisitPurpose[]>([]);
  const [Mitras, setMitras] = useState<IMitra[]>([]);
  const [submissions, setSubmissions] = useState<ISubmission[]>([]);
  const [subTypes, setSubTypes] = useState<ISubType[]>([]);
  const [debts, setDebts] = useState<IDebitur[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [dateErrors, setDateErrors] = useState<{ [key: string]: string }>({});

  const { user, hasAccess } = useContext((state: any) => state);
  const navigate = useNavigate();

  // Loading states untuk debounce search
  const [fetchingDebts, setFetchingDebts] = useState(false);
  const [fetchingMitras, setFetchingMitras] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  // Refs untuk debounce timeout
  const debounceDebt = useRef<NodeJS.Timeout | null>(null);
  const debounceMitra = useRef<NodeJS.Timeout | null>(null);
  const debounceUser = useRef<NodeJS.Timeout | null>(null);

  const [data, setData] = useState(
    record || {
      ...defaultData,
      userId: user.id,
      User: user,
    },
  );
  const { modal } = App.useApp();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await Promise.all([
          api
            .request({ method: "GET", url: "/submission" })
            .then((res) => setSubmissions(res.data.data)),
          api
            .request({ method: "GET", url: "/sub_type" })
            .then((res) => setSubTypes(res.data.data)),
          api
            .request({ method: "GET", url: "/visit_category" })
            .then((res) => setVisitCategories(res.data.data)),
          api
            .request({ method: "GET", url: "/visit_status" })
            .then((res) => setVisitStatuses(res.data.data)),
          api
            .request({ method: "GET", url: "/visit_purpose" })
            .then((res) => setVisitPurposes(res.data.data)),
        ]);

        // Panggil fetch awal dengan limit kecil
        fetchDebts("");
        fetchMitras("");
        fetchUsers("");

        // Injeksi data dari record jika sedang mode edit
        if (record) {
          if (record.Debitur) setDebts((prev) => [...prev, record.Debitur]);
          if (record.Mitra)
            setMitras((prev) => [...prev, record.Mitra as IMitra]);
          if (record.User) setUsers((prev) => [...prev, record.User]);
        }
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    })();

    // Cleanup debounce
    return () => {
      if (debounceDebt.current) clearTimeout(debounceDebt.current);
      if (debounceMitra.current) clearTimeout(debounceMitra.current);
      if (debounceUser.current) clearTimeout(debounceUser.current);
    };
  }, [record]);

  // --- FUNGSI FETCH DENGAN LIMIT KECIL & PENCARIAN ---
  const fetchDebts = async (search: string) => {
    setFetchingDebts(true);
    try {
      const res = await api.request({
        method: "GET",
        url: "/debitur",
        params: { limit: 20, search },
      });
      setDebts(res.data.data);
    } catch (e) {
    } finally {
      setFetchingDebts(false);
    }
  };

  const fetchMitras = async (search: string) => {
    setFetchingMitras(true);
    try {
      const res = await api.request({
        method: "GET",
        url: "/mitra",
        params: { limit: 20, search },
      });
      setMitras(res.data.data);
    } catch (e) {
    } finally {
      setFetchingMitras(false);
    }
  };

  const fetchUsers = async (search: string) => {
    setFetchingUsers(true);
    try {
      const res = await api.request({
        method: "GET",
        url: "/user",
        params: { limit: 20, search },
      });
      setUsers(res.data.data);
    } catch (e) {
    } finally {
      setFetchingUsers(false);
    }
  };

  // --- HANDLER PENCARIAN (DEBOUNCE) ---
  const onSearchDebt = (val: string) => {
    if (debounceDebt.current) clearTimeout(debounceDebt.current);
    debounceDebt.current = setTimeout(() => fetchDebts(val), 500);
  };

  const onSearchMitra = (val: string) => {
    if (debounceMitra.current) clearTimeout(debounceMitra.current);
    debounceMitra.current = setTimeout(() => fetchMitras(val), 500);
  };

  const onSearchUser = (val: string) => {
    if (debounceUser.current) clearTimeout(debounceUser.current);
    debounceUser.current = setTimeout(() => fetchUsers(val), 500);
  };

  const validateDates = () => {
    const errors: { [key: string]: string } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (data.date_action && data.date_plan) {
      const actionDate = new Date(data.date_action);
      const planDate = new Date(data.date_plan);
      actionDate.setHours(0, 0, 0, 0);
      planDate.setHours(0, 0, 0, 0);
      if (actionDate < planDate) {
        errors.date_action =
          "Tanggal aktual tidak boleh kurang dari tanggal rencana";
      }
    }

    setDateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (record && !record.date_action && !validateDates()) {
      return;
    }

    await api
      .request({
        url: "/visit",
        method: record ? "PUT" : "POST",
        params: record ? { id: record.id } : {},
        data: data,
      })
      .then(async (res) => {
        if (res.status === 201 || res.status === 200) {
          modal.success({
            title: "BERHASIL",
            content: res.data.msg,
            onOk: () => navigate("/dashboard"),
          });
        } else {
          modal.error({
            title: "ERROR",
            content: res.data.msg,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        modal.error({
          title: "ERROR",
          content:
            err.response?.data?.msg || err.message || "Internal Server Error",
        });
      });
    setLoading(false);
  };

  const getGeoLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setData((prev) => ({
          ...prev,
          geo: `${position.coords.latitude},${position.coords.longitude}`,
        }));
      },
      (err) => {
        alert("Izin lokasi ditolak atau terjadi kesalahan.");
        console.error(err);
      },
    );
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung geolokasi.");
      return;
    }
    if (!record) getGeoLocation();
  }, []);

  return (
    <Spin spinning={loading}>
      <div className="bg-white p-4 rounded">
        <p className="font-bold text-lg">
          {record ? "UPDATE" : "TAMBAH"} DATA KUNJUNGAN
        </p>
        <div className="ml-8 text-xs opacity-80 my-4">
          <ul className="list-disc">
            <li>Kosongkan ID Kunjungan untuk generate otomatis</li>
            <li>Kosongkan Komentar untuk menghapus</li>
          </ul>
        </div>
        <Divider />
        <Row gutter={[16, 16]}>
          {/* MENGGUNAKAN SELECT UNTUK NASABAH/DEBITUR */}
          <Col xs={12} md={8}>
            <div className="flex flex-col mb-4">
              <label className="mb-1 text-sm text-gray-600">Nasabah</label>
              <Select
                showSearch
                filterOption={false}
                loading={fetchingDebts}
                onSearch={onSearchDebt}
                value={data.debiturId || undefined}
                placeholder="Cari Nasabah..."
                options={debts.map((d) => ({
                  label: `${d.fullname} (${d.cif})`,
                  value: d.id,
                }))}
                onChange={(e) => {
                  const find = debts.find((d) => d.id === e);
                  setData({
                    ...data,
                    Debitur: find ? find : data.Debitur,
                    debiturId: e,
                    value: 0,
                    col: "",
                    submissionId: null,
                    mitraId: null,
                  });
                  if (find) {
                    setSubmissions(find.Submission || []);
                    setMitras(
                      find.Submission.flatMap((s) => s.Mitra) as IMitra[],
                    );
                  }
                }}
                className="w-full"
              />
            </div>
          </Col>

          {/* MENGGUNAKAN SELECT UNTUK MITRA */}
          <Col xs={12} md={8}>
            <div className="flex flex-col mb-4">
              <label className="mb-1 text-sm text-gray-600">Mitra</label>
              <Select
                showSearch
                filterOption={false}
                loading={fetchingMitras}
                onSearch={onSearchMitra}
                value={data.mitraId || undefined}
                placeholder="Cari Mitra..."
                options={Mitras.map((s) => ({ label: s.name, value: s.id }))}
                onChange={(e) => {
                  setData({
                    ...data,
                    mitraId: e,
                    Mitra: Mitras.find((m) => m.id === e) as IMitra,
                  });
                }}
                className="w-full"
              />
            </div>
          </Col>

          <Col xs={12} md={8}>
            <InputUtil
              label="CIF"
              value={data.Debitur?.cif}
              onchage={(e: string) =>
                setData({ ...data, Debitur: { ...data.Debitur, cif: e } })
              }
              type="text"
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="NIK"
              value={data.Debitur?.nik}
              required
              onchage={(e: string) =>
                setData({ ...data, Debitur: { ...data.Debitur, nik: e } })
              }
              type="text"
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="Nama Lengkap"
              required
              value={data.Debitur?.fullname}
              onchage={(e: string) =>
                setData({ ...data, Debitur: { ...data.Debitur, fullname: e } })
              }
              type="text"
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="Tempat Lahir"
              required
              value={data.Debitur?.birthplace}
              onchage={(e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, birthplace: e },
                })
              }
              type="text"
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="Tanggal Lahir"
              required
              value={
                data.Debitur?.birthdate
                  ? moment(data.Debitur?.birthdate).format("YYYY-MM-DD")
                  : ""
              }
              onchage={(e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, birthdate: new Date(e) },
                })
              }
              type="date"
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="Alamat"
              value={data.Debitur?.address}
              onchage={(e: string) =>
                setData({ ...data, Debitur: { ...data.Debitur, address: e } })
              }
              type="area"
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="No Telepon"
              value={data.Debitur?.phone}
              onchage={(e: string) =>
                setData({ ...data, Debitur: { ...data.Debitur, phone: e } })
              }
              type="text"
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="Email"
              value={data.Debitur?.email}
              onchage={(e: string) =>
                setData({ ...data, Debitur: { ...data.Debitur, email: e } })
              }
              type="text"
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="Jenis Pemohon"
              required
              value={data.Debitur?.submissionTypeId}
              onchage={(e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, submissionTypeId: e },
                })
              }
              type="option"
              options={subTypes.map((s) => ({ label: s.name, value: s.id }))}
            />
          </Col>
          {submissions.length !== 0 && (
            <Col xs={12} md={8}>
              <InputUtil
                label="Data Rekening"
                value={data.submissionId}
                options={submissions.map((s) => ({
                  label: `${s.id} (${s.Product?.name || ""}-${s.Product?.ProductType?.name || ""})`,
                  value: s.id,
                }))}
                onchage={(e: string) => {
                  const find = submissions.find((s) => s.id === e);
                  setData({
                    ...data,
                    submissionId: e,
                    ...(find && {
                      col: find.Billing?.[0]?.col || "",
                      value: Number(find.Billing?.[0]?.value || 0),
                    }),
                  });
                }}
                type="option"
              />
            </Col>
          )}
          <Col xs={12} md={8}>
            <InputUtil
              label="Kolektibilitas"
              value={data.col}
              onchage={(e: string) => setData({ ...data, col: e })}
              type="text"
            />
          </Col>
        </Row>

        <Card
          title={
            <div className="flex gap-2 items-center">
              <BookPlus size={18} /> Data Kunjungan
            </div>
          }
          style={{ marginTop: 15, marginBottom: 15 }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={12} md={8}>
              <InputUtil
                label="ID Kunjungan"
                value={data.id}
                onchage={(e: string) => setData({ ...data, id: e })}
                type="text"
              />
            </Col>
            <Col xs={12} md={8}>
              <div>
                <InputUtil
                  label="Tanggal Rencana Kunjungan"
                  required
                  value={
                    data.date_plan
                      ? moment(data.date_plan).format("YYYY-MM-DD")
                      : ""
                  }
                  onchage={(e: string) => {
                    setData({ ...data, date_plan: new Date(e) });
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const planDate = new Date(e);
                    planDate.setHours(0, 0, 0, 0);
                    if (planDate < today) {
                      setDateErrors((prev) => ({
                        ...prev,
                        date_plan:
                          "Tanggal rencana tidak boleh kurang dari hari ini",
                      }));
                    } else {
                      setDateErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.date_plan;
                        return newErrors;
                      });
                    }
                  }}
                  type="date"
                />
                {dateErrors.date_plan && (
                  <p className="text-red-500 text-xs mt-1">
                    {dateErrors.date_plan}
                  </p>
                )}
              </div>
            </Col>
            <Col xs={12} md={8}>
              <div>
                <InputUtil
                  label="Tanggal Pelaksanaan Kunjungan"
                  value={
                    data.date_action
                      ? moment(data.date_action).format("YYYY-MM-DD")
                      : ""
                  }
                  onchage={(e: string) => {
                    setData({ ...data, date_action: new Date(e) });
                    if (data.date_plan && e) {
                      const actionDate = new Date(e);
                      const planDate = new Date(data.date_plan);
                      actionDate.setHours(0, 0, 0, 0);
                      planDate.setHours(0, 0, 0, 0);
                      if (actionDate < planDate) {
                        setDateErrors((prev) => ({
                          ...prev,
                          date_action:
                            "Tanggal aktual tidak boleh kurang dari tanggal rencana",
                        }));
                      } else {
                        setDateErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.date_action;
                          return newErrors;
                        });
                      }
                    }
                  }}
                  type="date"
                />
                {dateErrors.date_action && (
                  <p className="text-red-500 text-xs mt-1">
                    {dateErrors.date_action}
                  </p>
                )}
              </div>
            </Col>
            <Col xs={12} md={8}>
              <InputUtil
                label="Jenis Kunjungan"
                required
                value={data.VisitCategory?.id}
                onchage={(e: string) => {
                  const find = visitCategories.find((u) => u.id === e);
                  setData({
                    ...data,
                    VisitCategory: find as IVisitCategory,
                    visitCategoryId: e,
                  });
                }}
                options={visitCategories.map((s) => ({
                  label: s.name,
                  value: s.id,
                }))}
                type="option"
              />
            </Col>
            <Col xs={12} md={8}>
              <InputUtil
                label="Tujuan Kunjungan"
                required
                value={data.VisitPurpose?.id}
                onchage={(e: string) => {
                  const find = visitPurposes.find((u) => u.id === e);
                  setData({
                    ...data,
                    VisitPurpose: find as IVisitPurpose,
                    visitPurposeId: e,
                  });
                }}
                options={visitPurposes.map((s) => ({
                  label: s.name,
                  value: s.id,
                }))}
                type="option"
              />
            </Col>
            <Col xs={12} md={8}>
              <InputUtil
                label="Nilai Tagihan"
                value={IDRFormat(data.value)}
                onchage={(e: string) =>
                  setData({ ...data, value: IDRToNumber(e) })
                }
                type="text"
              />
            </Col>
            <Col xs={12} md={8}>
              <InputUtil
                label="Realisasi Tagihan"
                value={IDRFormat(data.realize_value)}
                onchage={(e: string) =>
                  setData({ ...data, realize_value: IDRToNumber(e) })
                }
                type="text"
              />
            </Col>
            <Col xs={12} md={8}>
              <InputUtil
                label="Hasil Kunjungan"
                required
                value={data.VisitStatus?.id}
                onchage={(e: string) => {
                  const find = visitStatuses.find((u) => u.id === e);
                  setData({
                    ...data,
                    VisitStatus: find as IVisitStatus,
                    visitStatusId: e,
                  });
                }}
                options={visitStatuses.map((s) => ({
                  label: s.name,
                  value: s.id,
                }))}
                type="option"
              />
            </Col>
            <Col xs={24} md={24}>
              <InputUtil
                label="Ringkasan Pembicaraan"
                value={data.summary}
                onchage={(e: string) => setData({ ...data, summary: e })}
                type="area"
              />
            </Col>
            <Col xs={24} md={24}>
              <InputUtil
                label="Tindak Lanjut"
                value={data.next_action}
                onchage={(e: string) => setData({ ...data, next_action: e })}
                type="area"
              />
            </Col>
          </Row>
        </Card>

        <Card
          title={
            <div className="flex gap-2 items-center">
              <User size={18} /> Data Petugas
            </div>
          }
          style={{ marginTop: 15, marginBottom: 15 }}
        >
          <Row gutter={[16, 16]}>
            {/* MENGGUNAKAN SELECT UNTUK PETUGAS (USER) */}
            <Col xs={12} md={8}>
              <div className="flex flex-col mb-4">
                <label className="mb-1 text-sm text-gray-600">
                  Petugas <span className="text-red-500">*</span>
                </label>
                <Select
                  showSearch
                  filterOption={false}
                  loading={fetchingUsers}
                  onSearch={onSearchUser}
                  disabled={!hasAccess("/app/callreport/visit", "proses")}
                  value={data.userId || undefined}
                  placeholder="Cari Petugas..."
                  options={users.map((s) => ({
                    label: `${s.fullname} (${s.nik})`,
                    value: s.id,
                  }))}
                  onChange={(e) => {
                    const find = users.find((u) => u.id === e);
                    setData({
                      ...data,
                      userId: e,
                      User: find as IUser,
                    });
                  }}
                  className="w-full"
                />
              </div>
            </Col>

            <Col xs={12} md={8}>
              <InputUtil
                label="NIP"
                value={data.User?.nip}
                type="text"
                disabled
              />
            </Col>
            <Col xs={12} md={8}>
              <InputUtil
                label="Posisi"
                value={data.User?.Position?.name}
                type="text"
                disabled
              />
            </Col>
            <Col xs={12} md={8}>
              <InputUtil
                label="No Telepon"
                value={data.User?.phone}
                type="text"
                disabled
              />
            </Col>
            <Col xs={12} md={8}>
              <InputUtil
                label="Email"
                value={data.User?.email}
                type="text"
                disabled
              />
            </Col>
          </Row>
        </Card>

        <Card
          title={
            <div className="flex gap-2 items-center">
              <MessageCircle size={18} /> Komentar
            </div>
          }
          style={{ marginTop: 15, marginBottom: 15 }}
        >
          <Row gutter={[16, 16]}>
            {data.coments?.map((c, i) => (
              <Col xs={12} md={8} key={i}>
                <InputUtil
                  type="area"
                  value={c.comment}
                  label={`${c.name} (${moment(c.date).format("DD/MM/YY HH:mm")})`}
                  onchage={(e: string) => {
                    setData({
                      ...data,
                      coments: data.coments?.map((dc, idc) => ({
                        ...dc,
                        ...(idc === i && { comment: e, name: user.fullname }),
                      })),
                    });
                  }}
                  disabled={user.fullname !== c.name}
                />
              </Col>
            ))}
          </Row>
          <div className="flex justify-center my-4">
            <Button
              icon={<PlusCircleOutlined />}
              type="primary"
              onClick={() =>
                setData({
                  ...data,
                  coments: data.coments
                    ? [
                        ...data.coments,
                        {
                          ...defaultComment,
                          name: user.fullname,
                          date: new Date(),
                        },
                      ]
                    : [],
                })
              }
            >
              Tambahkan Komentar
            </Button>
          </div>
        </Card>

        <Card
          title={
            <div className="flex gap-2 items-center">
              <FolderOpen size={18} /> Lokasi dan Berkas
            </div>
          }
          style={{ marginTop: 15, marginBottom: 15 }}
        >
          <Col xs={24} md={24} style={{ marginTop: 20, marginBottom: 20 }}>
            <InputFileUploadVisitAuto
              files={data.files || []}
              onFilesChange={(updatedFiles) =>
                setData({ ...data, files: updatedFiles })
              }
              filetype="image/*"
            />
          </Col>
          <Col xs={24} md={24} className="border rounded border-slate-300 p-1">
            <div className="flex justify-end p-2">
              <Button type="primary" onClick={() => getGeoLocation()}>
                Refresh Maps
              </Button>
            </div>
            <section className="h-96 w-full bg-slate-200 overflow-hidden rounded-xl shadow-inner">
              <iframe
                title="Lokasi Kantor"
                /* Menggunakan URL Embed Google Maps yang benar agar tidak error */
                src={`https://maps.google.com/maps?q=${data.geo}&z=17&output=embed`}
                className="w-full h-full border-0 transition-all duration-700"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </section>
          </Col>
        </Card>

        <div className="flex gap-4 justify-end">
          <Link to={"/app/callreport/visit"}>
            <Button danger>Cancel</Button>
          </Link>
          <Button
            type="primary"
            onClick={() => handleSubmit()}
            loading={loading}
            disabled={!data.date_action}
          >
            Submit
          </Button>
        </div>
      </div>
    </Spin>
  );
}

const defaultData: IVisit = {
  id: "",
  value: 0,
  realize_value: 0,
  date_plan: new Date(),
  summary: "",
  date_action: new Date(),
  geo: "",
  files: [],
  next_action: "",
  coments: [],
  status: true,
  created_at: new Date(),
  updated_at: new Date(),
  debiturId: "",
  userId: "",
  Debitur: {} as IDebitur,
  User: {} as IUser,
  VisitCategory: {} as IVisitCategory,
  VisitPurpose: {} as IVisitPurpose,
  VisitStatus: {} as IVisitStatus,
  Mitra: null,
  visitCategoryId: "",
  visitStatusId: "",
  visitPurposeId: "",
  mitraId: null,
};

const defaultComment: IComments = {
  date: new Date(),
  name: "",
  comment: "",
};
