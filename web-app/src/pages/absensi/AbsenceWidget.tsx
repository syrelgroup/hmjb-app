import { App, Button, Card, Divider, Drawer, Modal, Tag } from "antd";
import type { IAbsence, IAbsenceConfig, IUser } from "../../libs/interface";
import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Calendar } from "lucide-react";
import api from "../../libs/api";
import {
  AimOutlined,
  CheckOutlined,
  CompassOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import moment from "moment";
import Text from "antd/es/typography/Text";
import { IDRFormat } from "../utils/utilForm";

export default function AbsenceWidget({
  open,
  setOpen,
  user,
  config,
}: {
  open: boolean;
  setOpen: (v: any) => void;
  user: IUser;
  config: IAbsenceConfig;
}) {
  const [modelLoad, setModelLoad] = useState(false);
  const [coords, setCoords] = useState<{
    lat: number;
    lon: number;
    acc: number;
    address: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [disable, setDisable] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [openFace, setOpenFace] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    const MODEL_URL = "/models";
    (async () => {
      setLoading(true);
      setModelLoad(true);
      setDisable(true);
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      ]);
      setDisable(false);
      setLoading(false);
      setModelLoad(false);
    })();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.style.transform = "scaleX(-1)";
      }
    } catch (err) {
      message.error(
        "Saat ini kamera tidak diizinkan!. Mohon perbaharui pengaturan ponsel/browser agar mengizinkan akses kamera",
      );
      console.error(err);
    }
  };
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureAndVerify = async () => {
    if (!videoRef.current) return;
    setLoading(true);
    try {
      // Ambil frame dari video
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");

      if (ctx && videoRef.current) {
        // Mirroring canvas agar sama dengan tampilan video
        ctx.translate(640, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, 640, 480);

        const dataUrl = canvas.toDataURL("image/jpeg");

        // Buat HTMLImageElement dari data URL
        const img = new Image();
        img.src = dataUrl;

        // Tunggu sampai image load
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
        });
        const imageData = await extractFaceDescriptor(img);
        if (user.face) {
          const referenceDescriptor = new Float32Array(
            Object.values(JSON.parse(user.face)),
          );
          const verify = compareFaces(imageData, referenceDescriptor);
          if (!verify) {
            message.error("Verifikasi wajah gagal!");
            return;
          }
          await handleSaveAbsence();
          stopCamera();
        } else {
          await api
            .request({
              method: "PUT",
              url: import.meta.env.VITE_API_URL + "/user?id=" + user.id,
              data: { ...user, face: JSON.stringify(imageData) },
            })
            .then(() => {
              message.success("Berhasil mendaftarkan wajah. mohon absen ulang");
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            })
            .catch((err) => {
              console.log(err);
              message.error(err.response.data.msg || "Internal Server Error");
            });
          stopCamera();
        }
      }
    } catch (err) {
      message.error("Verification failed");
      console.error(err);
    }
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
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.coords.latitude}&lon=${position.coords.longitude}`;
        const response = await fetch(url, {
          headers: {
            "Accept-Language": "id", // Menampilkan hasil dalam bahasa Indonesia
          },
        });
        const data = await response.json();
        setCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          acc: position.coords.accuracy,
          address: data.display_name || null,
        });
        if (config.geo_status && config.geo_location) {
          const compLat = parseFloat(config.geo_location.split(",")[0]);
          const compLong = parseFloat(config.geo_location.split(",")[1]);
          const distance = CalculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            compLat,
            compLong,
          );
          if (distance > (config.meter_tolerance || 0)) {
            setDisable(true);
            message.error(
              "Maaf anda tidak berada dalam radius toleransi absen lokasi kantor!",
            );
          }
        }
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

  const handleSaveAbsence = async () => {
    setLoading(true);
    const data: IAbsence =
      user.Absence.length === 0
        ? {
            ...defaultData,
            check_in: new Date(),
            geo_in_lat: coords?.lat,
            geo_in_long: coords?.lon,
            method: user.absen_method,
            alpha_deduction: 0,
            late_deduction: moment(new Date()).isAfter(
              moment()
                .set("hour", config.shift_start)
                .set("minute", config.shift_tolerance),
              "minute",
            )
              ? config.late_deduction
              : 0,
            absence_status: "HADIR",
            description: moment(new Date()).isAfter(
              moment()
                .set("hour", config.shift_start)
                .set("minute", config.shift_tolerance),
              "minute",
            )
              ? "TERLAMBAT"
              : "",
            userId: user.id,
          }
        : {
            ...user.Absence[0],
            check_out: new Date(),
            geo_out_lat: coords?.lat,
            geo_out_long: coords?.lon,
            fast_leave_deduction: moment(new Date()).isBefore(
              moment().set("hour", config.shift_end).set("minute", 0),
              "minute",
            )
              ? config.fast_leave_deduction
              : 0,
            description: user.Absence[0].description?.includes("PULANG_CEPAT")
              ? user.Absence[0].description
              : user.Absence[0].description + ",PULANG_CEPAT",
            userId: user.id,
          };
    await api
      .request({
        method: user.Absence.length === 0 ? "POST" : "PUT",
        url:
          import.meta.env.VITE_API_URL + "/absence?id=" + user.Absence[0]?.id,
        data: data,
      })
      .then(() => {
        message.success(
          `Absen berhasil at ${moment().format("DD-MM-YYYY HH:mm:dd")}`,
        );
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      })
      .catch((err) => {
        console.log(err);
        message.error(err.response.data.msg || "Internal Server Error");
      });
    setLoading(false);
  };

  const handleAbsenceClicked = async () => {
    if (
      user.Absence.length === 0 &&
      moment(new Date()).isAfter(
        moment().set("hour", config.last_shift),
        "minute",
      )
    ) {
      message.error("Maaf kamu telah melewati waktu akhir absen!");
      return;
    }
    if (
      moment(new Date()).isBefore(
        moment().set("hour", config.shift_start - 1),
        "minute",
      )
    ) {
      message.error("Maaf belum masuk waktu absen!");
      return;
    }

    setLoading(true);
    if (user.absen_method === "BUTTON") {
      await handleSaveAbsence();
    } else {
      startCamera();
      setOpenFace(true);
    }
    setLoading(false);
  };
  useEffect(() => {
    if (!coords) {
      (async () => {
        await handleGetLocation();
      })();
    }
  }, [coords]);

  return (
    <Drawer
      title="Absensi"
      placement="right"
      open={open}
      onClose={() => setOpen(false)}
    >
      {user.Absence.length === 0 ? (
        <Button
          icon={<Calendar size={14} />}
          onClick={() => handleAbsenceClicked()}
          loading={loading}
          disabled={disable || loading}
          type="primary"
        >
          {modelLoad ? "Load Models ..." : "Absen Masuk Sekarang"}
        </Button>
      ) : (
        <div>
          <div className="p-2 bg-green-500 text-white rounded my-2">
            <CheckOutlined /> Sudah Masuk
          </div>
          {user.Absence[0].check_out ? (
            <div className="p-2 bg-green-500 text-white rounded my-2">
              <CheckOutlined /> Sudah Pulang
            </div>
          ) : (
            <Button
              icon={<Calendar size={14} />}
              onClick={() => handleAbsenceClicked()}
              disabled={disable}
              loading={!coords || loading}
            >
              {modelLoad ? "Load Models ..." : "Absen Pulang Sekarang"}
            </Button>
          )}
        </div>
      )}
      {coords && (
        <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <EnvironmentOutlined className="text-blue-500 text-lg" />
              <Text strong className="text-blue-700">
                Lokasi Terdeteksi
              </Text>
            </div>

            <div className="space-y-3">
              {/* Alamat Utama */}
              <div className="bg-white p-3 rounded-lg border border-blue-50">
                <Text
                  type="secondary"
                  className="text-[10px] uppercase tracking-wider block mb-1"
                >
                  Alamat Lengkap
                </Text>
                <Text className="text-sm leading-relaxed">
                  {coords.address || "Mencari alamat..."}
                </Text>
              </div>

              {/* Baris Koordinat */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/50 p-2 rounded-lg border border-blue-50 flex items-center gap-2">
                  <CompassOutlined className="text-gray-400" />
                  <div>
                    <div className="text-[9px] text-gray-400 uppercase">
                      Lat
                    </div>
                    <div className="text-xs font-mono">
                      {coords.lat.toFixed(6)}
                    </div>
                  </div>
                </div>
                <div className="bg-white/50 p-2 rounded-lg border border-blue-50 flex items-center gap-2">
                  <AimOutlined className="text-gray-400" />
                  <div>
                    <div className="text-[9px] text-gray-400 uppercase">
                      Lon
                    </div>
                    <div className="text-xs font-mono">
                      {coords.lon.toFixed(6)}
                    </div>
                  </div>
                </div>
              </div>
              {/* Tag Akurasi */}
              {coords.acc && (
                <div className="flex justify-end">
                  <Tag
                    color={coords.acc < 50 ? "green" : "orange"}
                    className="mr-0 rounded-full"
                  >
                    Akurasi: ±{Math.round(coords.acc)}m
                  </Tag>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <Divider></Divider>
      <div>
        {user.Absence.length !== 0 && (
          <div>
            <Card
              title="Absen Masuk"
              size="small"
              styles={{ body: { fontSize: 12 } }}
            >
              <ul className="list-disc list-inside">
                <li>
                  Waktu :{" "}
                  {moment(user.Absence[0].check_in).format("DD/MM/YYYY HH:mm")}
                </li>
                {user.Absence[0].late_deduction ? (
                  <li>
                    Potongan Terlambat : Rp.{" "}
                    {IDRFormat(user.Absence[0].late_deduction)}
                  </li>
                ) : (
                  ""
                )}
                <li>
                  Geo Location : {user.Absence[0].geo_in_lat},{" "}
                  {user.Absence[0].geo_in_long}
                </li>
              </ul>
            </Card>
            {user.Absence[0].check_out && (
              <Card
                title="Absen Pulang"
                size="small"
                styles={{ body: { fontSize: 12 } }}
                style={{ marginTop: 10 }}
              >
                <ul className="list-disc list-inside">
                  <li>
                    Waktu :{" "}
                    {moment(user.Absence[0].check_out).format(
                      "DD/MM/YYYY HH:mm",
                    )}
                  </li>
                  {user.Absence[0].fast_leave_deduction ? (
                    <li>
                      Potongan Pulagn Lebih Awal : Rp.{" "}
                      {IDRFormat(user.Absence[0].fast_leave_deduction)}
                    </li>
                  ) : (
                    ""
                  )}
                  <li>
                    Geo Location : {user.Absence[0].geo_out_lat},{" "}
                    {user.Absence[0].geo_out_long}
                  </li>
                </ul>
              </Card>
            )}
          </div>
        )}
      </div>
      <Modal
        width={700}
        title="Verifikasi Wajah"
        open={openFace}
        onCancel={() => setOpenFace(!openFace)}
        style={{ top: 0 }}
        footer={[]}
        centered
        destroyOnHidden
      >
        {/* <div className="flex flex-col items-center p-8">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="border border-gray-300 rounded-lg mb-4"
            width="640"
            height="480"
          />

          <div className="flex gap-4 mb-4">
            <button
              onClick={captureAndVerify}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              Verify Face
            </button>
          </div>
        </div> */}
        <div className="flex flex-col items-center py-4">
          <div className="relative overflow-hidden rounded-2xl border-4 border-gray-100 shadow-xl bg-black">
            {/* Container Video */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-auto max-w-160"
              style={{ transform: "scaleX(-1)" }} // Mirror effect
            />

            {/* Overlay Frame Scanner */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-dashed border-blue-400 rounded-full opacity-50 animate-pulse"></div>
              {/* Garis scanning */}
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan"></div>
            </div>

            {/* Label Instruksi */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <span className="bg-black/50 text-white px-4 py-1 rounded-full text-sm">
                Posisikan wajah Anda di tengah lingkaran
              </span>
            </div>
          </div>

          <div className="mt-8 w-full max-w-100">
            <Button
              type="primary"
              size="large"
              block
              icon={<Calendar size={18} />}
              onClick={captureAndVerify}
              loading={loading}
              className="h-12 font-semibold rounded-lg shadow-md hover:scale-[1.02] transition-transform"
            >
              {loading
                ? "Memproses Verifikasi..."
                : "Verifikasi & Absen Sekarang"}
            </Button>
            <p className="text-center text-gray-400 mt-4 text-xs">
              Pastikan Anda berada di tempat dengan pencahayaan yang cukup.
            </p>
          </div>
        </div>
      </Modal>
    </Drawer>
  );
}

const defaultData: IAbsence = {
  id: "",
  check_in: new Date(),
  check_out: null,
  geo_in_lat: 0,
  geo_in_long: 0,
  geo_out_lat: null,
  geo_out_long: null,
  method: "BUTTON",
  absence_status: "HADIR",
  late_deduction: 0,
  fast_leave_deduction: 0,
  alpha_deduction: 0,
  lemburan: 0,
  userId: "",
  description: null,

  status: false,
  created_at: new Date(),
  updated_at: new Date(),
};

const CalculateDistance = (
  latIn: number,
  lonIn: number,
  complat: number,
  complon: number,
) => {
  const R = 6371e3; // Jari-jari bumi dalam meter
  const φ1 = (latIn * Math.PI) / 180;
  const φ2 = (complat * Math.PI) / 180;
  const Δφ = ((complat - latIn) * Math.PI) / 180;
  const Δλ = ((complon - lonIn) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Hasil dalam meter
};

async function extractFaceDescriptor(image: HTMLImageElement) {
  const detections = await faceapi
    .detectSingleFace(
      image,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 416 }),
    )
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detections) {
    throw new Error("No face detected");
  }

  return detections.descriptor;
}

// Bandingkan dua face descriptor
function compareFaces(
  captured: Float32Array,
  refference: Float32Array,
  distanceThreshold = 0.5,
) {
  const distance = faceapi.euclideanDistance(captured, refference);
  return distance < distanceThreshold;
}
