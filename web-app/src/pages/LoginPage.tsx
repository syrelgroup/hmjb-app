import { useEffect, useState } from "react";
import { LogIn, KeyRound, EyeOff, Eye, LoaderPinwheel } from "lucide-react";
import { apps, type AppType } from "../libs/list_app";
import api from "../libs/api";
import useContext from "../libs/context";
import { useNavigate } from "react-router-dom";

const APP_COLOR = import.meta.env.VITE_APP_COLOR || "#F58220";

function LoginPage() {
  const [selectedApp, setSelectedApp] = useState<AppType>("earsip");
  const [credential, setCredential] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const { user, login } = useContext((state) => state);
  const selectedAppConfig = apps.find((app) => app.id === selectedApp)!;
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    await api
      .request({
        method: "POST",
        data: credential,
        headers: { "Content-Type": "Application/json" },
        url: import.meta.env.VITE_API_URL + "/auth",
      })
      .then((res) => {
        if (res.status === 200) {
          login(res.data.data, res.data.token);
          navigate("/app");
        } else {
          setErr(res.data.msg);
        }
      })
      .catch((err) => {
        setErr(
          err.response?.data?.msg || err.message || "Internal Server Error",
        );
      });
    setLoading(false);
  };

  useEffect(() => {
    setErr("");
  }, [credential]);

  useEffect(() => {
    if (user) {
      navigate("/app");
    }
  }, [user]);

  return (
    <div
      className="min-h-screen bg-gray-50 flex items-center justify-center"
      style={{
        backgroundImage: "url(/assets/build.jpeg)",
        backgroundSize: "contain",
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden border border-gray-100 ">
        {/* --- Bagian Kiri: Pilihan Aplikasi --- */}
        <div
          style={{ backgroundColor: APP_COLOR }}
          className="w-full md:w-2/5 p-8 text-white flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              {/* <Building2 className="w-9 h-9" />
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold leading-tight">
                  BPR HASAMITRA
                </h1>
                <p className="text-xs font-light tracking-widest uppercase opacity-80">
                  Jawa Barat
                </p>
              </div> */}
              <img src="/assets/logo.png" width={"50%"} />
            </div>

            {/* <h2 className="text-3xl font-extrabold mb-10 leading-snug">
              Sistem Informasi <br />
              Internal Terpadu
            </h2> */}

            <div className="space-y-3">
              {/* <p className="text-sm font-medium text-orange-100 mb-2">
                PILIH APLIKASI UNTUK MASUK:
              </p> */}
              {apps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => setSelectedApp(app.id)}
                  className={`w-full p-4 rounded-xl flex items-center gap-4 text-left transition-all border ${
                    selectedApp === app.id
                      ? "bg-white text-gray-900 shadow-md border-white"
                      : "bg-white/10 text-white border-transparent hover:bg-white/20"
                  }`}
                >
                  <app.icon
                    className={`w-8 h-8 p-1.5 rounded-lg ${selectedApp === app.id ? `bg-orange-100 text-[${APP_COLOR}]` : "bg-white/10"}`}
                  />
                  <div>
                    <div className="font-bold text-lg">{app.title}</div>
                    <div
                      className={`text-xs ${selectedApp === app.id ? "text-gray-600" : "text-orange-100"}`}
                    >
                      {app.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* <div className="text-center md:text-left">
            <p className="text-xs text-orange-100/70">
              &copy; 2026 PT BPR Hasamitra Jawa Barat. <br /> Seluruh hak cipta
              dilindungi.
            </p>
          </div> */}
        </div>

        {/* --- Bagian Kanan: Form Login --- */}
        <div className="w-full md:w-3/5 p-6 md:p-6 flex flex-col justify-center">
          <div className="mb-8 text-center md:text-left">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Login
            </h3>
            <h2 className="text-3xl font-bold text-gray-900">
              Masuk ke{" "}
              <span style={{ color: APP_COLOR }}>
                {selectedAppConfig.title}
              </span>
            </h2>
            <p className="text-gray-600 mt-2">
              Gunakan kredensial internal Anda untuk mengakses sistem.
            </p>
          </div>

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Username / NIK
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Masukkan username Anda"
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:border-orange-500 focus:ring-orange-200 transition"
                  style={
                    {
                      "--tw-ring-color": `${APP_COLOR}33`,
                      "--tw-border-opacity": 1,
                    } as React.CSSProperties
                  } // Menyesuaikan ring focus warna oranye
                  value={credential.username}
                  onChange={(e) =>
                    setCredential({ ...credential, username: e.target.value })
                  }
                />
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                {/* Ikon Gembok di Kiri */}
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                <input
                  type={showPassword ? "text" : "password"} // Logika ganti tipe input
                  required
                  placeholder="••••••••••"
                  className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:border-orange-500 focus:ring-orange-200 transition"
                  style={{ outlineColor: APP_COLOR }}
                  value={credential.password}
                  onChange={(e) =>
                    setCredential({ ...credential, password: e.target.value })
                  }
                />

                {/* Tombol Toggle Mata di Kanan */}
                <button
                  type="button" // Penting: agar tidak dianggap submit form
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" /> // Ikon mata dicoret
                  ) : (
                    <Eye className="w-5 h-5" /> // Ikon mata terbuka
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300"
                />
                <label htmlFor="remember" className="text-sm text-gray-700">
                  Ingat Saya
                </label>
              </div>
              <a
                href="#"
                className="text-sm font-medium hover:underline"
                style={{ color: APP_COLOR }}
              >
                Lupa Password?
              </a>
            </div>

            {err && (
              <div className="italic text-red-500">
                <p>{err}</p>
              </div>
            )}

            <button
              type="submit"
              style={{ backgroundColor: APP_COLOR }}
              className="w-full text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition shadow-md shadow-orange-500/20 cursor-pointer"
              disabled={loading}
              onSubmit={() => handleLogin()}
              onClick={() => handleLogin()}
            >
              <LogIn className="w-5 h-5" />
              Masuk Sekarang{" "}
              {loading && <LoaderPinwheel className="animate-spin" />}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100 text-right text-sm text-gray-500">
            <div>Version 1.00</div>
            <div>Registered to:</div>
            <div>PT. BPR Hasamitra Jawa Barat</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
