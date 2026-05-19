import { Modal, Tag } from "antd";
import type { ISubmission, IVisit } from "../../libs/interface";
import { IDRFormat } from "../utils/utilForm";

export const DetailVisitDebt = ({
  record,
  open,
  setOpen,
}: {
  record?: IVisit[];
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  return (
    <Modal
      title="Detail Kunjungan"
      open={open}
      onCancel={() => setOpen(false)}
      onOk={() => setOpen(false)}
      width={1000}
      style={{ top: 20 }}
    >
      <div className="flex justify-evenly gap-4">
        {record?.map((visit) => (
          <div key={visit.id} className="p-4 border rounded">
            <div className="font-bold text-center mb-4 border-b border-slate-200">
              ID : {visit.id}
            </div>
            <div className="flex gap-2">
              <p className="w-52">Tanggal Kunjungan</p>
              <p className="w-4">:</p>
              <p className="flex-1">
                {visit.date_action
                  ? new Date(visit.date_action).toLocaleDateString()
                  : "-"}
              </p>
            </div>
            <div className="flex gap-2">
              <p className="w-52">Tujuan Kunjungan</p>
              <p className="w-4">:</p>
              <p className="flex-1">{visit.VisitPurpose?.name}</p>
            </div>
            <div className="flex gap-2">
              <p className="w-52">Hasil Kunjungan</p>
              <p className="w-4">:</p>
              <p className="flex-1">{visit.VisitStatus?.name}</p>
            </div>
            <div className="flex gap-2">
              <p className="w-52">Nilai</p>
              <p className="w-4">:</p>
              <p className="flex-1">{IDRFormat(visit.value)}</p>
            </div>
            <div className="flex gap-2">
              <p className="w-52">Realisasi</p>
              <p className="w-4">:</p>
              <p className="flex-1">{IDRFormat(visit.realize_value)}</p>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export const DetailSubmissionDebt = ({
  record,
  open,
  setOpen,
}: {
  record?: ISubmission[];
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  return (
    <Modal
      title="Detail Rekening"
      open={open}
      onCancel={() => setOpen(false)}
      onOk={() => setOpen(false)}
      width={1000}
      style={{ top: 20 }}
    >
      <div className="flex justify-evenly gap-4">
        {record?.map((submission) => (
          <div key={submission.id} className="p-4 border rounded">
            <div className="font-bold text-center mb-4 border-b border-slate-200">
              ID : {submission.id}
            </div>
            <div className="flex gap-2">
              <p className="w-52">Tanggal Permohonan</p>
              <p className="w-4">:</p>
              <p className="flex-1">
                {new Date(submission.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <p className="w-52">Nilai/Plafond</p>
              <p className="w-4">:</p>
              <p className="flex-1">Rp. {IDRFormat(submission.value)}</p>
            </div>
            <div className="flex gap-2">
              <p className="w-52">Jenis Rekening</p>
              <p className="w-4">:</p>
              <p className="flex-1">
                {submission.Product.name} (
                {submission.Product.ProductType?.name})
              </p>
            </div>
            <div className="flex gap-2">
              <p className="w-52">Status</p>
              <p className="w-4">:</p>
              <p className="flex-1">
                <Tag
                  color={
                    ["AKTIF", "LUNAS"].includes(submission.approve_status)
                      ? "green"
                      : submission.approve_status === "PENDING"
                        ? "green"
                        : "cyan"
                  }
                  variant="solid"
                >
                  {submission.approve_status}
                </Tag>
              </p>
            </div>
            <div className="flex gap-2">
              <p className="w-52">Status Jaminan</p>
              <p className="w-4">:</p>
              <p className="flex-1">
                <Tag
                  color={
                    submission.guarantee_status === "DITERIMA"
                      ? "green"
                      : submission.guarantee_status === "DIKEMBALIKAN"
                        ? "cyan"
                        : "red"
                  }
                  variant="solid"
                >
                  {submission.guarantee_status}
                </Tag>
              </p>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
