import {
  FileText,
  PhoneCall,
  UserCheck,
  Code,
  FolderArchive,
  FormInput,
  ClipboardPlus,
  Hash,
  Calendars,
  Key,
  SquareDashedKanbanIcon,
  Users,
  User,
  BriefcaseBusiness,
  ChartBarBig,
  Gift,
  FormInputIcon,
  Calendar,
} from "lucide-react";
import type { IMenu } from "./interface";
import {
  BankOutlined,
  BranchesOutlined,
  DollarCircleOutlined,
  SecurityScanOutlined,
} from "@ant-design/icons";

export type AppType = "earsip" | "callreport" | "absensi" | "guestbook" | "all";

export interface AppConfig {
  id: AppType;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  redirect_url: string;
}

export const apps: AppConfig[] = [
  {
    id: "earsip",
    title: "E-Arsip",
    icon: FileText,
    description: "Manajemen dokumen elektronik",
    redirect_url: "/earsip",
  },
  {
    id: "callreport",
    title: "Call Report",
    icon: PhoneCall,
    description: "Laporan aktivitas harian & nasabah",
    redirect_url: "/creport",
  },
  {
    id: "absensi",
    title: "Absensi",
    icon: UserCheck,
    description: "Pencatatan kehadiran karyawan",
    redirect_url: "/absensi",
  },
  {
    id: "guestbook",
    title: "Buku Tamu",
    icon: FileText,
    description: "Manajemen tamu dan kunjungan",
    redirect_url: "/guestbook",
  },
  {
    id: "all",
    title: "All App",
    icon: Code,
    description: "All In One App",
    redirect_url: "/app",
  },
];

export const menus: IMenu[] = [
  {
    name: "Dashboard",
    path: "/app",
    icon: <SquareDashedKanbanIcon size={20} />,
    need_access: true,
  },
  {
    name: "Profile",
    path: "/app/profile",
    icon: <User size={20} />,
    need_access: false,
  },

  {
    name: "E-Arsip",
    path: "/app/earsip",
    icon: <FolderArchive size={20} />,
    need_access: true,
    children: [
      {
        name: "Dashboard",
        path: "/app/earsip",
        icon: <FolderArchive size={15} />,
        need_access: true,
        can_access: ["read"],
      },
      {
        name: "Data Nasabah",
        path: "/app/earsip/debitur",
        icon: <FolderArchive size={15} />,
        need_access: true,
        can_access: ["read", "write", "update", "delete"],
      },
      {
        name: "Kategori Arsip",
        path: "/app/earsip/product_type",
        icon: <Hash size={15} />,
        need_access: true,
        can_access: ["read", "write", "update", "delete"],
      },
      {
        name: "Daftar Rekening",
        path: "/app/earsip/submission",
        icon: <FormInput size={15} />,
        need_access: true,
        can_access: ["read", "write", "update", "delete", "download"],
      },
      {
        name: "Permohonan Download",
        path: "/app/earsip/permit_download",
        icon: <FormInput size={15} />,
        need_access: true,
        can_access: ["read", "write", "update", "delete", "proses"],
      },
      {
        name: "Permohonan Hapus",
        path: "/app/earsip/permit_delete",
        icon: <FormInput size={15} />,
        need_access: true,
        can_access: ["read", "write", "update", "delete", "proses"],
      },
      {
        name: "Peminjaman Jaminan",
        path: "/app/earsip/collateral_lending",
        icon: <FormInput size={15} />,
        need_access: true,
        can_access: ["read", "write", "update", "delete"],
      },
    ],
  },
  {
    name: "Call Report",
    path: "/app/callreport",
    icon: <ClipboardPlus size={20} />,
    need_access: true,
    children: [
      {
        name: "Dashboard",
        path: "/app/callreport",
        icon: <FolderArchive size={15} />,
        need_access: true,
        can_access: ["read"],
      },
      {
        name: "Jenis Kunjungan",
        path: "/app/callreport/category",
        icon: <Hash size={15} />,
        need_access: true,
        can_access: ["read", "write", "update", "delete"],
      },
      {
        name: "Tujuan Kunjungan",
        path: "/app/callreport/purpose",
        icon: <Hash size={15} />,
        need_access: true,
        can_access: ["read", "write", "update", "delete"],
      },
      {
        name: "Status Kunjungan",
        path: "/app/callreport/status",
        icon: <Hash size={15} />,
        need_access: true,
        can_access: ["read", "write", "update", "delete"],
      },
      {
        name: "Rencana Kunjungan",
        path: "/app/callreport/visit_plan",
        icon: <FormInput size={15} />,
        need_access: true,
        can_access: ["read", "write", "update", "delete"],
      },
      {
        name: "Hasil Kunjungan",
        path: "/app/callreport/visit",
        icon: <FormInput size={15} />,
        need_access: true,
        can_access: ["read", "write", "update", "delete", "download"],
      },
      {
        name: "Debitur",
        path: "/app/callreport/debitur",
        icon: <Calendars size={15} />,
        need_access: true,
        can_access: ["read", "write", "update", "delete"],
      },
    ],
  },
  {
    name: "Absensi",
    path: "/app/absensi",
    icon: <ClipboardPlus size={20} />,
    need_access: true,
    children: [
      {
        name: "Dashboard",
        path: "/app/absensi",
        icon: <FolderArchive size={15} />,
        need_access: true,
        can_access: ["read"],
      },
      {
        name: "Konfigurasi",
        path: "/app/absensi/config",
        icon: <Hash size={15} />,
        need_access: true,
        can_access: ["read", "update"],
      },
      {
        name: "Permohonan Izin",
        path: "/app/absensi/permit",
        icon: <FormInputIcon size={15} />,
        need_access: true,
        can_access: ["read", "write", "update", "delete", "proses"],
      },
      {
        name: "Laporan Absensi",
        path: "/app/absensi/report",
        icon: <Calendar size={15} />,
        need_access: true,
        can_access: ["read", "update", "delete"],
      },
      {
        name: "Insentif",
        path: "/app/absensi/insentif",
        icon: <Gift size={15} />,
        need_access: true,
        can_access: ["read", "write", "update", "delete", "proses"],
      },
      {
        name: "Rekap Gaji",
        path: "/app/absensi/payroll",
        icon: <DollarCircleOutlined />,
        need_access: true,
        can_access: ["read", "proses"],
      },
    ],
  },
  {
    name: "Buku Tamu",
    path: "/app/guestbook",
    icon: <UserCheck size={20} />,
    need_access: true,
    children: [
      {
        name: "Dashboard",
        path: "/app/guestbook",
        icon: <FolderArchive size={15} />,
        need_access: true,
        can_access: ["read"],
      },
      {
        name: "Tipe Tamu",
        path: "/app/guestbook/gbook_type",
        icon: <Hash size={15} />,
        need_access: true,
        can_access: ["read", "write", "update", "delete"],
      },
      {
        name: "Daftar Tamu",
        path: "/app/guestbook/guestbook",
        icon: <Hash size={15} />,
        need_access: true,
        can_access: ["read", "write", "update", "delete"],
      },
    ],
  },
  {
    name: "Jenis Pemohon",
    path: "/app/sub_type",
    icon: <ChartBarBig size={20} />,
    need_access: true,
    can_access: ["read", "write", "update", "delete"],
  },
  {
    name: "Debitur",
    path: "/app/debitur",
    icon: <Users size={20} />,
    need_access: true,
    can_access: ["read", "write", "update", "delete"],
  },
  {
    name: "Mitra",
    path: "/app/mitra",
    icon: <BranchesOutlined />,
    need_access: true,
    can_access: ["read", "write", "update", "delete"],
  },
  {
    name: "Kantor Bayar",
    path: "/app/pay_office",
    icon: <BankOutlined />,
    need_access: true,
    can_access: ["read", "write", "update", "delete"],
  },
  {
    name: "Asuransi",
    path: "/app/insurance",
    icon: <SecurityScanOutlined />,
    need_access: true,
    can_access: ["read", "write", "update", "delete"],
  },
  {
    name: "Role",
    path: "/app/role",
    icon: <Key size={20} />,
    need_access: true,
    can_access: ["read", "write", "update", "delete"],
  },
  {
    name: "Posisi",
    path: "/app/position",
    icon: <BriefcaseBusiness size={20} />,
    need_access: true,
    can_access: ["read", "write", "update", "delete"],
  },

  {
    name: "User",
    path: "/app/user",
    icon: <User size={20} />,
    need_access: true,
    can_access: ["read", "write", "update", "delete"],
  },
  {
    name: "Log Aktivitas",
    path: "/app/log-activities",
    icon: <FileText size={20} />,
    need_access: true,
    can_access: ["read"],
  },
];
