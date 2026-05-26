import { App, Button, Card, Col, Divider, Row, Spin } from "antd";
import type {
  IComments,
  IDebitur,
  IMitra,
  ISubmission,
  IUser,
  IVisit,
  IVisitCategory,
  IVisitPurpose,
} from "../../libs/interface";
import { IDRFormat, IDRToNumber, InputUtil } from "../utils/utilForm";
import { InputFileUploadVisitAuto } from "../utils/InputFileUploadVisitAuto";
import { PlusCircleOutlined } from "@ant-design/icons";
import { BookPlus, FolderOpen, MessageCircle, User } from "lucide-react";
import { useEffect, useState } from "react";
import moment from "moment";
import api from "../../libs/api";
import useContext from "../../libs/context";
import { Link } from "react-router-dom";

export default function UpsertVisitPlan({ record }: { record?: IVisit }) {
  const [loading, setLoading] = useState(false);
  const [visitCategories, setVisitCategories] = useState<IVisitCategory[]>([]);
  const [visitPurposes, setVisitPurposes] = useState<IVisitPurpose[]>([]);
  const [Mitras, setMitras] = useState<IMitra[]>([]);
  const [debts, setDebts] = useState<IDebitur[]>([]);
  const [submissions, setSubmissions] = useState<ISubmission[]>(
    record ? record.Debitur.Submission : [],
  );
  const [users, setUsers] = useState<IUser[]>([]);
  // const [search, setSearch] = useState("");
  const [dateErrors, setDateErrors] = useState<{ [key: string]: string }>({});
  const { user, hasAccess } = useContext((state: any) => state);
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
      await api
        .request({
          method: "GET",
          url: "/visit_category",
        })
        .then((res) => setVisitCategories(res.data.data));
      await api
        .request({
          method: "GET",
          url: "/visit_purpose",
        })
        .then((res) => setVisitPurposes(res.data.data));
      await api
        .request({
          method: "GET",
          url: "/user",
          params: { limit: 1000 },
        })
        .then((res) => setUsers(res.data.data));
      await api
        .request({
          method: "GET",
          url: "/mitra",
          params: { limit: 1000 },
        })
        .then((res) => setMitras(res.data.data));
      await api
        .request({
          method: "GET",
          url: "/debitur",
          params: { limit: 10000 },
        })
        .then((res) => setDebts(res.data.data));
      setLoading(false);
    })();
  }, []);

  const validateDates = () => {
    const errors: { [key: string]: string } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate date_plan >= today
    if (data.date_plan) {
      const planDate = new Date(data.date_plan);
      planDate.setHours(0, 0, 0, 0);
      if (planDate < today) {
        errors.date_plan = "Tanggal rencana tidak boleh kurang dari hari ini";
      }
    }

    // Validate date_action >= date_plan
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
    if (!validateDates()) {
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
          content: err.message || "Internal Server Error",
        });
      });
    setLoading(false);
  };

  // const handleSearch = async () => {
  //   setLoading(true);
  //   await api
  //     .request({
  //       url: "/debitur",
  //       method: "PATCH",
  //       params: { id: search },
  //     })
  //     .then((res) => {
  //       if (res.status === 200) {
  //         setData((prev) => ({
  //           ...prev,
  //           Debitur: res.data.data,
  //           debiturId: res.data.data.id,
  //         }));
  //         if (res.data.data.Submission.length > 0) {
  //           setSubmissions(res.data.data.Submission);
  //         }
  //       } else {
  //         message.error("Data tidak ditemukan");
  //       }
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //       message.error("Data tidak ditemukan");
  //     });
  //   setLoading(false);
  // };

  return (
    <Spin spinning={loading}>
      <div className="bg-white p-4 rounded">
        <p className="font-bold text-lg">
          {record ? "UPDATE" : "BUAT"} RENCANA KUNJUNGAN
        </p>
        <div className="ml-8 text-xs opacity-80 my-4">
          <ul className="list-disc">
            <li>Kosongkan ID Kunjungan untuk generate otomatis</li>
            <li>Kosongkan Komentar untuk menghapus</li>
          </ul>
        </div>
        <Divider />
        <Row gutter={[16, 16]}>
          <Col xs={12} md={8}>
            <InputUtil
              label="Nasabah"
              type="option"
              value={data.debiturId}
              options={debts.map((d) => ({
                label: `${d.fullname} (${d.cif})`,
                value: d.id,
              }))}
              onchage={(e: string) => {
                const find = debts.find((d) => d.id === e);
                setData({
                  ...data,
                  Debitur: find ? find : data.Debitur,
                  debiturId: e,
                });
                if (find) {
                  setSubmissions(find.Submission);
                  setMitras(
                    find.Submission.flatMap((s) => s.Mitra) as IMitra[],
                  );
                }
              }}
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="Mitra"
              required
              value={data.mitraId}
              onchage={(e: string) => {
                setData({
                  ...data,
                  mitraId: e,
                  Mitra: Mitras.find((m) => m.id === e) as IMitra,
                });
              }}
              type="option"
              options={Mitras.map((s) => ({ label: s.name, value: s.id }))}
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="CIF"
              value={data.Debitur?.cif}
              onchage={(e: string) => {
                setData({ ...data, Debitur: { ...data.Debitur, cif: e } });
              }}
              type="text"
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="NIK"
              value={data.Debitur?.nik}
              required
              onchage={(e: string) => {
                setData({ ...data, Debitur: { ...data.Debitur, nik: e } });
              }}
              type="text"
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="Nama Lengkap"
              required
              value={data.Debitur?.fullname}
              onchage={(e: string) => {
                setData({ ...data, Debitur: { ...data.Debitur, fullname: e } });
              }}
              type="text"
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="Tempat Lahir"
              required
              value={data.Debitur?.birthplace}
              onchage={(e: string) => {
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, birthplace: e },
                });
              }}
              type="text"
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="Tanggal Lahir"
              required
              value={moment(data.Debitur?.birthdate).format("YYYY-MM-DD")}
              onchage={(e: string) => {
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, birthdate: new Date(e) },
                });
              }}
              type="date"
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="Alamat"
              value={data.Debitur?.address}
              onchage={(e: string) => {
                setData({ ...data, Debitur: { ...data.Debitur, address: e } });
              }}
              type="area"
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="No Telepon"
              value={data.Debitur?.phone}
              onchage={(e: string) => {
                setData({ ...data, Debitur: { ...data.Debitur, phone: e } });
              }}
              type="text"
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="Email"
              value={data.Debitur?.email}
              onchage={(e: string) => {
                setData({ ...data, Debitur: { ...data.Debitur, email: e } });
              }}
              type="text"
            />
          </Col>
          <Col xs={12} md={8}>
            <InputUtil
              label="Kolektibilitas"
              value={data.col}
              onchage={(e: string) => {
                setData({ ...data, col: e });
              }}
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
                onchage={(e: string) => {
                  setData({ ...data, id: e });
                }}
                type="text"
              />
            </Col>
            <Col xs={12} md={8}>
              <div>
                <InputUtil
                  label="Tanggal Rencana Kunjungan"
                  required
                  value={moment(data.date_plan).format("YYYY-MM-DD")}
                  onchage={(e: string) => {
                    setData({
                      ...data,
                      date_plan: new Date(e),
                    });
                    // Validate date_plan
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
                onchage={(e: string) => {
                  setData({ ...data, value: IDRToNumber(e) });
                }}
                type="text"
              />
            </Col>
            {submissions.length !== 0 && (
              <Col xs={12} md={8}>
                <InputUtil
                  label="Data Rekening"
                  value={data.submissionId}
                  options={submissions.map((s) => ({
                    label: `${s.id} (${s.Product.name}-${s.Product.ProductType?.name})`,
                    value: s.id,
                  }))}
                  onchage={(e: string) => {
                    setData({ ...data, submissionId: e });
                  }}
                  type="option"
                />
              </Col>
            )}
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
            <Col xs={12} md={8}>
              <InputUtil
                label="Petugas"
                required
                value={data.userId}
                disabled={!hasAccess("/app/callreport/visit", "proses")}
                onchage={(e: string) => {
                  const find = users.find((u) => u.id === e);
                  setData({
                    ...data,
                    userId: e,
                    User: find as IUser,
                  });
                }}
                options={users.map((s) => ({
                  label: `${s.fullname} (${s.nik})`,
                  value: s.id,
                }))}
                type="option"
              />
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
            <Col xs={12} md={8}>
              <InputUtil
                label="Kolektibilitas"
                value={data.col}
                onchage={(e: string) => setData({ ...data, col: e })}
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
              <FolderOpen size={18} /> Berkas
            </div>
          }
          style={{ marginTop: 15, marginBottom: 15 }}
        >
          <Col xs={24} md={24} style={{ marginTop: 20, marginBottom: 20 }}>
            <InputFileUploadVisitAuto
              files={data.files || []}
              onFilesChange={(updatedFiles) =>
                setData({
                  ...data,
                  files: updatedFiles,
                })
              }
              filetype="image/*"
            />
          </Col>
        </Card>
        <div className="flex gap-4 justify-end">
          <Link to={"/app/callreport/visit_plan"}>
            <Button danger>Cancel</Button>
          </Link>
          <Button
            type="primary"
            onClick={() => handleSubmit()}
            loading={loading}
            disabled={
              !data.Debitur?.fullname ||
              !data.Debitur?.nik ||
              !data.Debitur?.submissionTypeId ||
              !data.Debitur?.birthdate ||
              !data.visitCategoryId ||
              !data.userId ||
              !data.mitraId
            }
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
  date_action: null,
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
  Mitra: {} as IMitra,
  mitraId: "",
  VisitPurpose: null,
  VisitStatus: null,
  visitCategoryId: "",
  visitStatusId: null,
  visitPurposeId: null,
  Submission: null,
};

const defaultComment: IComments = {
  date: new Date(),
  name: "",
  comment: "",
};
