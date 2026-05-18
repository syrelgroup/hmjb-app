// FUNCTION & UTILS
export interface IActionPage<T> {
  upsert: boolean;
  delete: boolean;
  process: boolean;
  record: T | undefined;
}

export interface IPageProps<T> {
  page: number;
  limit: number;
  search: string;
  total: number;
  data: T[];
  [key: string]: any;
}
export type EPermitStatus = "DISETUJUI" | "PENDING" | "DITOLAK";
export type EFlaggingStatus = "PENDING" | "FLAGGING" | "NON_PENSIUNAN";
export type EArsipStatus = "PENDING" | "AKTIF" | "LUNAS" | "PASIF" | "BREAK";
export type EDocStatus = "DITERIMA" | "PENDING" | "DIPINJAM" | "DIKEMBALIKAN";

export interface IMenu {
  path: string;
  name: string;
  icon?: string | React.ReactNode;
  need_access: boolean;
  can_access?: string[];
  children?: IMenu[];
}

// UTIL MODEL
export interface IPermission {
  path: string;
  name: string;
  access: string[];
  can_access?: string[];
}

export interface IComments {
  name: string;
  date: Date;
  comment: string;
}
export interface IActivities {
  date: Date;
  name: string;
  activities: string;
}
// MODEL

export interface IRole {
  id: string;
  name: string;
  data_status: "ALL" | "USER";
  permission: IPermission[];

  status: boolean;
  created_at: Date;
  updated_at: Date;
}
export interface IPosition {
  id: string;
  name: string;
  description: string;
  status: boolean;
  created_at: Date;
  updated_at: Date;
  User: IUser[];
}
export interface IUserCost {
  id: string;
  name: string;
  type: "PENAMBAHAN" | "PENGURANGAN";
  nominal: number;
  nominal_type: "RUPIAH" | "PERCENT";
  start_at: Date;
  end_at?: Date | null;
  userId: string;
  User?: IUser;
}
export interface IUser {
  updated_at: Date;
  created_at: Date;
  status: boolean;
  id: string;
  fullname: string;
  nik: string | null;
  nip: string | null;
  phone: string | null;
  email: string | null;
  username: string | null;
  password: string | null;
  salary: number;
  ptkp: string;
  absen_method: "BUTTON" | "FACE";
  face: string | null;
  photo: string | null;
  Role: IRole;
  Position: IPosition;
  Absence: IAbsence[];
  UserCost?: IUserCost[] | null;
  roleId: string;
  positionId: string | null;
  PermitAbsence: IPermitAbsence[] | null;
  Insentif: IInsentif[] | null;
}

export interface IAbsence {
  id: string;
  method: string;
  check_in: Date | null;
  check_out: Date | null;
  geo_in_lat?: number | null;
  geo_in_long?: number | null;
  geo_out_lat?: number | null;
  geo_out_long?: number | null;
  absence_status:
    | "HADIR"
    | "CUTI"
    | "PERDIN"
    | "SAKIT"
    | "LEMBUR"
    | "ALPHA"
    | "TERLAMBAT"
    | "PULANG_CEPAT";
  late_deduction: number;
  fast_leave_deduction: number;
  lemburan: number;
  alpha_deduction: number;
  description: string | null;

  status: boolean;
  created_at: Date;
  updated_at: Date;
  userId: string;
  User?: IUser;
}

export interface IAbsenceConfig {
  id: string;
  late_deduction: number;
  fast_leave_deduction: number;
  alpha_deduction: number;
  shift_start: number;
  shift_end: number;
  shift_tolerance: number;
  last_shift: number;
  geo_status: boolean;
  geo_location: string | null;
  meter_tolerance: number | null;
  updated_at: Date;
}

export interface IPermitAbsence {
  id: string;
  type: "TERLAMBAT" | "CUTI" | "PERDIN" | "SAKIT" | "LEMBUR" | "PULANG_CEPAT";
  description: string | null;
  file: string | null;
  start_date: Date | null;
  end_date: Date | null;
  permit_status: "DISETUJUI" | "DITOLAK" | "PENDING";

  status: boolean;
  created_at: Date;
  updated_at: Date;
  User: IUser;
  userId: string;
  ApproverBy: IUser | null;
  approverById: string | null;
}

export interface IInsentif {
  id: string;
  name: string;
  description: string | null;
  nominal: number;
  nominal_type: "RUPIAH" | "PERCENT";
  approve_status: EArsipStatus;
  file: string | null;
  status: boolean;
  created_at: Date;
  updated_at: Date;
  User: IUser;
  ApproverBy: IUser | null;
  userId: string;
  approverById: string | null;
}

export interface IGuestBookType {
  id: string;
  name: string;
  description: string;
  status: boolean;
  created_at: Date;
  updated_at: Date;
}
export interface IParticipant {
  id?: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  note?: string | null;
  guestBookId?: string;
}
export interface IGuestBook {
  id: string;
  name: string;
  date: Date | string;
  status_come: "AKANDATANG" | "TELAHDATANG";
  description: string | null;
  file: string | null;

  status: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  gBookTypeId: string;
  GBookType: IGuestBookType;
  Participant: IParticipant[];
}
export interface IPermitFileDetail {
  id: string;
  submissionId: string;
  permitFileId: string;
  Submission?: ISubmission;
  Files: IFile[];
}
export interface IPermitFile {
  id: string;
  action: "DOWNLOAD" | "DELETE";
  description: string | null;
  approv_desc: string | null;
  permit_status: EPermitStatus;
  process_at: Date | null;

  requesterId: string;
  approverId: string | null;
  Requester?: IUser;
  Approver?: IUser;
  PermitFileDetail: IPermitFileDetail[];
  status: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IDebitur {
  id: string;
  fullname: string;
  nik: string;
  cif: string;
  birthplace: string;
  birthdate: Date;
  address: string;
  phone: string;
  email: string;
  status: boolean;
  created_at: Date;
  updated_at: Date;
  SubmissionType: ISubType;
  Visit: IVisit[];
  Submission: ISubmission[];
  submissionTypeId: string;
}
export interface ISubType {
  id: string;
  name: string;
  description: string;
  status: boolean;
  created_at: Date;
  updated_at: Date;
  Debitur: IDebitur[];
}
export interface IProductType {
  id: string;
  name: string;
  description: string;
  status: boolean;
  created_at: Date;
  updated_at: Date;
  ProductTypeFile: IProductTypeFile[];
  Product: IProduct[];
}
export interface IProductTypeFile {
  id: string;
  name: string;
  type: "image" | "video" | "pdf";
  status: boolean;
  created_at: Date;
  updated_at: Date;
  Files: IFile[];
  productTypeId: string;
}
export interface IFile {
  id: string;
  name: string;
  url: string;
  allow_download: string;
  submissionId: string | null;
  productTypeFileId: string | null;
  created_at: Date;
}
export interface IProduct {
  id: string;
  name: string;
  status: boolean;
  created_at: Date;
  updated_at: Date;
  ProductType?: IProductType | null;
  productTypeId: string;
  Submission?: ISubmission[];
}

export interface IMitra {
  id: string;
  name: string;
  code: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  pic: string | null;
  no_contract: string | null;
  drawer_code: string | null;
  description: string | null;
  file: string | null;

  status: boolean;
  created_at: Date;
  updated_at: Date;
  Submission?: [];
}
export interface IPayOffice {
  id: string;
  name: string;
  description: string | null;

  status: boolean;
  created_at: Date;
  updated_at: Date;
  Submission?: [];
}

export interface ISubmission {
  id: string;
  purpose: string | null;
  coments: IComments[];
  account_number: string | null;
  activities: IActivities[];
  value: number;
  tenor: number;
  guarantee_status: EDocStatus;
  doc_status: EDocStatus;
  approve_status: EArsipStatus;
  flagging_status: EFlaggingStatus;
  drawer_code: string;

  status: boolean;
  created_at: Date;
  updated_at: Date;
  Debitur: IDebitur;
  Product: IProduct;
  User: IUser;
  CreatedBy: IUser;
  Files: IFile[];
  Mitra?: IMitra | null;
  PayOffice?: IPayOffice | null;
  CollateralLending?: ICollateralLending[];
  Visit?: IVisit[];
  PermitFileDetail?: IPermitFileDetail[];
  debiturId: string;
  productId: string;
  userId: string;
  mitraId?: string | null;
  payOfficeId?: string | null;
  createdById: string;
}

export interface ICollateralLending {
  id: string;
  description: string | null;
  start_at: Date;
  end_at: Date;
  file: string | null;
  return_at: Date;

  status: boolean;
  created_at: Date;
  updated_at: Date;
  Submission: ISubmission;
  CreatedBy: IUser;
  ApproverBy?: IUser | null;
  approverById?: string | null;
  createdById: string;
  submissionId: string;
}

export interface IVisitCategory {
  id: string;
  name: string;
  description: string;
  status: boolean;
  created_at: Date;
  updated_at: Date;
  Visit: IVisit[];
}

export interface IVisitStatus {
  id: string;
  name: string;
  description: string;
  status: boolean;
  created_at: Date;
  updated_at: Date;
}
export interface IVisitPurpose {
  id: string;
  name: string;
  description: string;
  status: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IVisit {
  id: string;
  date_plan: Date;
  value: number;
  summary?: string | null;
  coments?: IComments[];
  date_action?: Date | null;
  geo?: string | null;
  files?: IFileVisit[];
  next_action?: string;

  status: boolean;
  created_at: Date;
  updated_at: Date;
  Debitur: IDebitur;
  User: IUser;
  VisitCategory: IVisitCategory;
  VisitStatus?: IVisitStatus | null; // Di schema Anda bernama 'Visit' (relation name)
  VisitPurpose?: IVisitPurpose | null; // Di schema Anda bernama 'Visit' (relation name)
  Submission?: ISubmission | null;
  debiturId: string;
  userId: string;
  visitCategoryId: string;
  visitStatusId: string | null;
  visitPurposeId: string | null;
  submissionId?: string | null;
}

export interface IFileVisit {
  name: string;
  url: string;
}

export interface IPTKP {
  name: string;
  desc: string;
  value: number;
}

export const PTKPDetail: IPTKP[] = [
  { name: "TK/0", desc: "Belum Menikah", value: 54000000 },
  { name: "TK/1", desc: "Belum Menikah", value: 58500000 },
  { name: "TK/2", desc: "Belum Menikah", value: 63000000 },
  { name: "TK/3", desc: "Belum Menikah", value: 67500000 },
  { name: "K/0", desc: "Menikah (0 Anak)", value: 58500000 },
  { name: "K/1", desc: "Menikah (1 Anak)", value: 63000000 },
  { name: "K/2", desc: "Menikah (2 Anak)", value: 67500000 },
  { name: "K/3", desc: "Menikah (3 Anak)", value: 72000000 },
  // { name: "KI/0", desc: "Kawin + Istri (0 Anak)", value: 112500000 },
  // { name: "KI/1", desc: "Kawin + Istri (1 Anak)", value: 117000000 },
  // { name: "KI/2", desc: "Kawin + Istri (2 Anak)", value: 121500000 },
  // { name: "KI/3+", desc: "Kawin + Istri (3 Anak)", value: 126000000 },
];
