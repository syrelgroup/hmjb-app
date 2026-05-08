import moment from "moment";
import useContext from "../../libs/context";
import { App, Button, Card, Divider, Tag } from "antd";
import { IDRFormat, IDRToNumber, InputUtil } from "../utils/utilForm";
import { useEffect, useState } from "react";
import type { IAbsenceConfig } from "../../libs/interface";
import {
  EnvironmentFilled,
  SaveFilled,
  SettingOutlined,
} from "@ant-design/icons";
import api from "../../libs/api";

export default function AbsenceConfig() {
  const { absence_config, updateconfig, hasAccess } = useContext(
    (state) => state,
  );
  const [data, setData] = useState<IAbsenceConfig>(
    absence_config as IAbsenceConfig,
  );
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const { message } = App.useApp();

  const getAddress = async (lat: number, lon: number) => {
    setLoading(true);
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
    const response = await fetch(url, {
      headers: {
        "Accept-Language": "id", // Menampilkan hasil dalam bahasa Indonesia
      },
    });
    const data = await response.json();
    setAddress(data.display_name);
    setLoading(false);
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      message.error("Browser Anda tidak mendukung Geolocation.");
      return;
    }
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setData({
          ...data,
          geo_location: `${position.coords.latitude}, ${position.coords.longitude}`,
        });
        await getAddress(position.coords.latitude, position.coords.longitude);
        setLoading(false);
      },
      (err) => {
        message.error(`Gagal mengambil lokasi: ${err.message}`);
        setLoading(false);
      },
      {
        enableHighAccuracy: true, // Memaksa penggunaan GPS jika tersedia
        timeout: 5000, // Waktu tunggu maksimal 5 detik
        maximumAge: 0, // Jangan gunakan data cache
      },
    );
    setLoading(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    await api
      .request({
        method: "PUT",
        url:
          import.meta.env.VITE_API_URL +
          "/absence_config?id=" +
          absence_config?.id,
        data: data,
      })
      .then(() => {
        message.success("Update konfigurasi berhasil");
        updateconfig();
      })
      .catch((err) => {
        console.log(err);
        message.error(err.response.data.msg || "Internal Server Error");
      });
    setLoading(false);
  };

  useEffect(() => {
    if (
      absence_config &&
      absence_config.geo_status &&
      absence_config.geo_location
    ) {
      (async () => {
        const lat = parseFloat(
          absence_config.geo_location?.split(",")[0] || "0",
        );
        const lon = parseFloat(
          absence_config.geo_location?.split(",")[1] || "0",
        );
        await getAddress(lat, lon);
      })();
    }
  }, [absence_config?.geo_status, absence_config?.geo_location]);

  return (
    <div className="space-y-2">
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Konfigurasi Absensi
          </h1>
          <p className="text-slate-500 text-sm">
            Last Update :{" "}
            {moment(absence_config?.updated_at).format("DD/MM/YYYY HH:mm")}
          </p>
        </div>
      </div>
      <div className="flex gap-6 flex-col sm:flex-row">
        <Card
          style={{ flex: 1 }}
          styles={{
            body: { display: "flex", flexDirection: "column", gap: 2 },
          }}
        >
          <InputUtil
            type="option"
            label="Status Geo Location"
            options={[
              { label: "Dengan Geo Location", value: true },
              { label: "Tanpa Geo Location", value: false },
            ]}
            disabled={!hasAccess("/app/absensi/config", "update")}
            value={data.geo_status}
            onchage={(e: boolean) => setData({ ...data, geo_status: e })}
          />
          {data.geo_status && (
            <InputUtil
              type="text"
              label="Geo Location"
              disabled={!hasAccess("/app/absensi/config", "update")}
              value={data.geo_location}
              suffix={
                <Button
                  size="small"
                  icon={<SettingOutlined />}
                  type="primary"
                  onClick={() => handleGetLocation()}
                  loading={loading}
                ></Button>
              }
            />
          )}
          {address && (
            <div className="flex gap-4 opacity-70 text-xs">
              <div>
                <EnvironmentFilled />
              </div>
              <div>{address}</div>
            </div>
          )}
          <InputUtil
            type="number"
            label="Toleransi Radius (Meter)"
            disabled={!hasAccess("/app/absensi/config", "update")}
            value={data.meter_tolerance}
            onchage={(e: number) => setData({ ...data, meter_tolerance: e })}
          />
          <Divider>Pengaturan Shift</Divider>
          <InputUtil
            type="number"
            label="Jam Masuk"
            disabled={!hasAccess("/app/absensi/config", "update")}
            value={data.shift_start}
            onchage={(e: number) => setData({ ...data, shift_start: e })}
          />
          <InputUtil
            type="number"
            label="Toleransi Jam Masuk (Menit)"
            disabled={!hasAccess("/app/absensi/config", "update")}
            value={data.shift_tolerance}
            onchage={(e: number) => setData({ ...data, meter_tolerance: e })}
          />
          <InputUtil
            type="number"
            label="Akhir Jam Masuk (Jam)"
            disabled={!hasAccess("/app/absensi/config", "update")}
            value={data.last_shift}
            onchage={(e: number) => setData({ ...data, last_shift: e })}
          />
          <InputUtil
            type="number"
            label="Jam Pulang"
            disabled={!hasAccess("/app/absensi/config", "update")}
            value={data.shift_end}
            onchage={(e: number) => setData({ ...data, shift_end: e })}
          />
          <Divider>Pengaturan Potongan</Divider>
          <InputUtil
            type="text"
            label="Potongan Alpha"
            disabled={!hasAccess("/app/absensi/config", "update")}
            value={IDRFormat(data.alpha_deduction)}
            onchage={(e: string) =>
              setData({ ...data, alpha_deduction: IDRToNumber(e || "0") })
            }
          />
          <InputUtil
            type="text"
            label="Potongan Telat"
            disabled={!hasAccess("/app/absensi/config", "update")}
            value={IDRFormat(data.late_deduction)}
            onchage={(e: string) =>
              setData({ ...data, late_deduction: IDRToNumber(e || "0") })
            }
          />
          <InputUtil
            type="text"
            label="Potongan Pulang Lebih Awal"
            disabled={!hasAccess("/app/absensi/config", "update")}
            value={IDRFormat(data.fast_leave_deduction)}
            onchage={(e: string) =>
              setData({ ...data, fast_leave_deduction: IDRToNumber(e || "0") })
            }
          />
          <Button
            icon={<SaveFilled />}
            type="primary"
            style={{ marginTop: 10 }}
            onClick={() => handleSubmit()}
            disabled={!hasAccess("/app/absensi/config", "update")}
          >
            Submit
          </Button>
        </Card>
        <Card style={{ flex: 1 }}>
          <p className="text-xl font-semibold">Informasi Tambahan</p>
          <Divider />
          <ul className="list-disc list-outside">
            <li>
              Jika Status Geo Location diisi <Tag>Dengan Geo Location</Tag>,
              maka setiap user yang absen harus dalam radius koordinat kantor;
            </li>
            <li>
              <Tag>Toleransi Meter</Tag>, adalah toleransi jarak dalam radius
              meter berdasarkan koordinat kantor;
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
