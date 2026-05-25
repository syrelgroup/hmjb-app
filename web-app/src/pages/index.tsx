import { useState } from "react";
import {
  LogOut,
  Bell,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import AppRouter from "./AppRouter";
import { menus } from "../libs/list_app";
import useContext from "../libs/context";
import { Modal, Dropdown } from "antd";
import { Link, useNavigate } from "react-router-dom";
import AbsenceWidget from "./absensi/AbsenceWidget";
// import HeaderAbsenceButton from "../components/HeaderAbsenceButton";

export default function MainLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setCollapsed] = useState(false); // State untuk collapse di desktop
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [openLogout, setOpenLogout] = useState(false);
  const navigate = useNavigate();
  const { user, getMenu, logout, absence_config } = useContext(
    (state: any) => state,
  );
  const [openAbsen, setOpenAbse] = useState(false);

  const toggleSubMenu = (name: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [name]: !prev[name], // Sekarang TypeScript tahu ini boolean
    }));
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden">
      {/* --- MOBILE SIDEBAR OVERLAY --- */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside
        className={`
    fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transform transition-all duration-300 ease-in-out
    lg:relative lg:translate-x-0 flex flex-col h-full shrink-0
    ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
    ${isCollapsed ? "lg:w-20" : "lg:w-60"}
    h-full
  `}
      >
        {/* LOGO SECTION */}
        <div
          className={`p-6 flex items-center shrink-0 ${isCollapsed ? "justify-center" : "justify-between"}`}
        >
          <div className="flex items-center gap-3">
            {/* <div> */}
            {/* <ShieldCheck size={20} /> */}
            {/* </div> */}
            {!isCollapsed ? (
              // <span className="font-black text-lg tracking-tighter whitespace-nowrap">
              //   <span className="text-orange-500">HASA</span>
              //   <span className="text-green-600">MITRA</span>
              // </span>
              <img src="/assets/logo.png" width={150} />
            ) : (
              <img src="/assets/android-chrome-512x512.png" width={30} />
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            className="lg:hidden text-slate-400"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* DESKTOP COLLAPSE TOGGLE */}
        <button
          onClick={() => setCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-15 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-orange-500 shadow-sm z-50"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 mt-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menus &&
            getMenu().map((m: any, i: any) => {
              const hasChildren = m.children && m.children.length > 0;
              const isOpen = openMenus[m.name];

              return (
                <div key={i} className="w-full">
                  {/* Menu Utama atau Toggle Parent */}
                  <Link
                    to={hasChildren ? "#" : m.path}
                    onClick={(e) => {
                      if (hasChildren) {
                        e.preventDefault();
                        toggleSubMenu(m.name);
                      }
                    }}
                    className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all 
              text-slate-500! hover:bg-slate-50 hover:text-slate-800!
              ${isCollapsed ? "justify-center" : "justify-between"}
              ${!hasChildren && !isCollapsed ? "" : ""}
            `}
                  >
                    <div className="flex items-center gap-3">
                      <span className="shrink-0">{m.icon}</span>
                      {!isCollapsed && <span>{m.name}</span>}
                    </div>

                    {/* Icon Panah untuk Children */}
                    {hasChildren && !isCollapsed && (
                      <ChevronRight
                        size={14}
                        className={`transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                      />
                    )}
                  </Link>

                  {/* Rendering Sub-Menu (Children) */}
                  {hasChildren && isOpen && !isCollapsed && (
                    <div className="mt-1 ml-9 flex flex-col gap-1 border-l border-slate-100 pl-2">
                      {m.children &&
                        m.children.map((child: any, idx: number) => (
                          <Link
                            key={idx}
                            to={child.path}
                            className="px-3 py-2 text-xs font-semibold text-slate-400! hover:text-orange-500! transition-colors rounded-lg hover:bg-orange-50 flex gap-2 items-center"
                          >
                            {child.icon} <span>{child.name}</span>
                          </Link>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
        </nav>

        {/* LOGOUT BUTTON REMOVED - MOVED TO HEADER */}
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 h overflow-hidden">
        {/* HEADER */}
        <header className="h-16 bg-white border-b  border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            {/* SEARCH DIHAPUS - Area ini sekarang kosong atau bisa untuk Breadcrumbs */}
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <button
              className="relative p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl cursor-pointer"
              onClick={() => setOpenAbse(!openAbsen)}
            >
              <Calendar size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="relative p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl cursor-pointer">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            {/* <HeaderAbsenceButton /> */}
            <Dropdown
              menu={{
                items: [
                  {
                    label: (
                      <div>
                        <p className="font-bold text-slate-800">
                          {user && user.fullname}
                        </p>
                        <p className="text-xs text-slate-500">
                          {user && user.Position.name}
                        </p>
                      </div>
                    ),
                    disabled: true,
                    key: "profile-header",
                  },
                  {
                    type: "divider",
                  },
                  {
                    key: "edit-profile",
                    label: (
                      <span className="flex items-center gap-2">
                        <User size={16} /> Profil
                      </span>
                    ),
                    onClick: () => navigate("/app/profile"),
                  },
                  {
                    type: "divider",
                  },
                  {
                    key: "logout",
                    label: (
                      <span className="text-red-600 font-semibold flex items-center gap-2">
                        <LogOut size={16} /> Keluar
                      </span>
                    ),
                    onClick: () => setOpenLogout(true),
                  },
                ],
              }}
              placement="bottomRight"
            >
              <button className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-xl transition-colors border-l border-slate-200 pl-4 lg:pl-6 cursor-pointer">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-800 leading-none">
                    {user && user.fullname}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase">
                    {user && user.Position.name}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-200 transition-colors">
                  <User size={20} className="text-slate-400" />
                </div>
              </button>
            </Dropdown>
          </div>
        </header>

        {/* PAGE CONTENT SCROLLABLE AREA */}
        <main className="flex-1 overflow-y-auto min-h-0 bg-slate-50 p-3 lg:p-4">
          <div className="max-w-7xl mx-auto">
            {children}
            <AppRouter />
          </div>
        </main>
      </div>

      <Modal
        title="Konfirmasi Logout"
        open={openLogout}
        onCancel={() => setOpenLogout(false)}
        onOk={() => logout()}
      >
        <p>Apakah anda yakin untuk keluar?</p>
      </Modal>
      {user && (
        <AbsenceWidget
          open={openAbsen}
          setOpen={(v: boolean) => setOpenAbse(v)}
          user={user}
          config={absence_config}
        />
      )}
    </div>
  );
}
