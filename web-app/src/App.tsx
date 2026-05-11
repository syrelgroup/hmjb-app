import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import MainLayout from "./pages";
import { ConfigProvider, App as ANTDApp, Button } from "antd";
import useContext from "./libs/context";
import { useEffect } from "react";

export default function App() {
  const { user, updatetoken, updateconfig } = useContext((state) => state);

  useEffect(() => {
    (async () => {
      updatetoken();
      updateconfig();
    })();
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          // Sesuaikan dengan font-family yang Anda gunakan di Tailwind
          // Biasanya: ui-sans-serif, system-ui, -apple-system, sans-serif
          fontFamily:
            'Cambria, Cochin, Georgia, Times, "Times New Roman", serif',

          // Opsional: Anda juga bisa menyamakan warna utama (Orange Hasamitra)
          colorPrimary: "#F58220",
          borderRadius: 8, // Agar roundness-nya senada dengan rounded-xl
        },
      }}
    >
      <ANTDApp>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />

            {user && <Route path="/app/*" element={<MainLayout />} />}

            {/*  */}
            <Route
              path="*"
              element={
                <div className="py-20 flex flex-col gap-4 items-center justify-center">
                  <div className="text-center text-2xl font-bold">
                    404 - Halaman Tidak Ditemukan
                  </div>
                  <Link to="/">
                    <Button type="primary">Back</Button>
                  </Link>
                </div>
              }
            />
            {/*  */}
          </Routes>
        </BrowserRouter>
      </ANTDApp>
    </ConfigProvider>
  );
}
