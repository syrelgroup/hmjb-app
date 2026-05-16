import { App, Button, Card, Divider, Drawer, Modal, Tag, Alert } from "antd";
import type { IAbsence, IAbsenceConfig, IUser } from "../../libs/interface";
import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Calendar } from "lucide-react";
import api from "../../libs/api";
import {
  AimOutlined,
  CheckCircleOutlined,
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
  const [scanStatus, setScanStatus] = useState<string>("Menunggu kamera...");
  const { message } = App.useApp();

  // Ref untuk melacak loop deteksi wajah otomatis
  const animationFrameRef = useRef<number | null>(null);
  const isVerifyingRef = useRef<boolean>(false);

  // Load Face-API models
  useEffect(() => {
    const MODEL_URL = "/models";
    (async () => {
      try {
        setLoading(true);
        setModelLoad(true);
        setDisable(true);
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        setDisable(false);
      } catch (err) {
        console.error("Gagal memuat model face-api", err);
        message.error("Gagal memuat sistem deteksi wajah.");
      } finally {
        setLoading(false);
        setModelLoad(false);
      }
    })();
  }, []);

  // Ambil lokasi otomatis saat widget terbuka
  useEffect(() => {
    if (open && !coords) {
      handleGetLocation();
    }
  }, [open, coords]);

  // Efek untuk mengontrol daur hidup kamera dan auto scan
  useEffect(() => {
    if (openFace) {
      isVerifyingRef.current = false;
      setScanStatus("Posisikan wajah Anda di dalam lingkaran...");
      startCamera().then(() => {
        // Mulai loop scan otomatis setelah kamera siap
        animationFrameRef.current = requestAnimationFrame(autoScanLoop);
      });
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [openFace]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      message.error(
        "Akses kamera ditolak! Periksa pengaturan izin browser Anda.",
      );
      setOpenFace(false);
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Loop deteksi wajah otomatis secara Real-time
  // const autoScanLoop = async () => {
  //   if (!videoRef.current || isVerifyingRef.current || !openFace) return;

  //   try {
  //     // Deteksi langsung dari elemen video (tanpa render ke canvas manual terlebih dahulu)
  //     const detection = await faceapi
  //       .detectSingleFace(
  //         videoRef.current,
  //         new faceapi.TinyFaceDetectorOptions({
  //           inputSize: 224,
  //           scoreThreshold: 0.6,
  //         }),
  //       )
  //       .withFaceLandmarks()
  //       .withFaceDescriptor();

  //     if (detection && !isVerifyingRef.current) {
  //       // Kunci proses agar tidak mendeteksi ganda secara bersamaan
  //       isVerifyingRef.current = true;
  //       setScanStatus("Wajah terdeteksi! Memverifikasi...");

  //       await processVerification(detection.descriptor);
  //     }
  //   } catch (error) {
  //     console.error("Kesalahan saat auto-scan:", error);
  //   }

  //   // Lanjutkan loop jika belum terverifikasi / modal masih terbuka
  //   if (!isVerifyingRef.current && openFace) {
  //     animationFrameRef.current = requestAnimationFrame(autoScanLoop);
  //   }
  // };
  const autoScanLoop = async () => {
    // Jika modal ditutup atau sedang dalam proses verifikasi API backend, hentikan loop
    if (!videoRef.current || isVerifyingRef.current || !openFace) return;

    try {
      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.5, // Sedikit diturunkan ke 0.5 agar mendeteksi lebih cepat
          }),
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection && !isVerifyingRef.current) {
        // Kunci proses agar tidak mendeteksi ganda
        isVerifyingRef.current = true;
        setScanStatus("Wajah terdeteksi! Memverifikasi...");

        await processVerification(detection.descriptor);
        return; // Keluar dari loop jika verifikasi sukses dijalankan
      }
    } catch (error) {
      console.error("Kesalahan saat auto-scan:", error);
    }

    // PERBAIKAN: Pindahkan ke sini!
    // Loop hanya akan memanggil frame berikutnya SETELAH faceapi selesai memproses frame saat ini
    if (!isVerifyingRef.current && openFace) {
      animationFrameRef.current = requestAnimationFrame(autoScanLoop);
    }
  };

  const processVerification = async (capturedDescriptor: Float32Array) => {
    setLoading(true);
    try {
      if (user.face) {
        const referenceDescriptor = new Float32Array(
          Object.values(JSON.parse(user.face)),
        );

        // Toleransi disesuaikan ke 0.45 agar lebih presisi
        const isMatch = compareFaces(
          capturedDescriptor,
          referenceDescriptor,
          0.6,
        );

        if (!isMatch) {
          message.error("Verifikasi wajah gagal! Wajah tidak cocok.");
          setScanStatus("Tidak cocok. Coba posisikan ulang wajah Anda.");
          // Beri jeda 2 detik sebelum mengizinkan scan ulang otomatis
          setTimeout(() => {
            isVerifyingRef.current = false;
            if (openFace)
              animationFrameRef.current = requestAnimationFrame(autoScanLoop);
          }, 2000);
          return;
        }

        setScanStatus("Verifikasi Berhasil! Menyimpan absensi...");
        await handleSaveAbsence();
        setOpenFace(false);
      } else {
        // Registrasi wajah baru jika data belum ada
        setScanStatus("Mendaftarkan wajah baru...");
        await api.request({
          method: "PUT",
          url: `${import.meta.env.VITE_API_URL}/user?id=${user.id}`,
          data: {
            ...user,
            face: JSON.stringify(Array.from(capturedDescriptor)),
          },
        });

        message.success(
          "Berhasil mendaftarkan wajah. Silakan lakukan absen ulang.",
        );
        setOpenFace(false);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err: any) {
      message.error("Proses verifikasi bermasalah.");
      console.error(err);
      isVerifyingRef.current = false;
      if (openFace)
        animationFrameRef.current = requestAnimationFrame(autoScanLoop);
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      message.error("Browser Anda tidak mendukung Geolocation.");
      return;
    }
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.coords.latitude}&lon=${position.coords.longitude}`;
          const response = await fetch(url, {
            headers: { "Accept-Language": "id" },
          });
          const data = await response.json();

          setCoords({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            acc: position.coords.accuracy,
            address: data.display_name || "Alamat tidak ditemukan",
          });

          if (config.geo_status && config.geo_location) {
            const [compLat, compLong] = config.geo_location
              .split(",")
              .map(Number);
            const distance = CalculateDistance(
              position.coords.latitude,
              position.coords.longitude,
              compLat,
              compLong,
            );

            if (distance > (config.meter_tolerance || 0)) {
              setDisable(true);
              message.error("Maaf, Anda berada di luar radius lokasi kantor!");
            }
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        message.error(`Gagal mengambil lokasi: ${err.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
    );
  };

  const handleSaveAbsence = async () => {
    setLoading(true);
    const isCheckIn = user.Absence.length === 0;

    const data: IAbsence = isCheckIn
      ? {
          ...defaultData,
          check_in: new Date(),
          geo_in_lat: coords?.lat,
          geo_in_long: coords?.lon,
          method: user.absen_method,
          alpha_deduction: 0,
          late_deduction: moment().isAfter(
            moment()
              .set("hour", config.shift_start)
              .set("minute", config.shift_tolerance),
            "minute",
          )
            ? config.late_deduction
            : 0,
          absence_status: "HADIR",
          description: moment().isAfter(
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
          fast_leave_deduction: moment().isBefore(
            moment().set("hour", config.shift_end).set("minute", 0),
            "minute",
          )
            ? config.fast_leave_deduction
            : 0,
          description: user.Absence[0].description?.includes("PULANG_CEPAT")
            ? user.Absence[0].description
            : user.Absence[0].description
              ? user.Absence[0].description + ",PULANG_CEPAT"
              : "PULANG_CEPAT",
          userId: user.id,
        };

    try {
      await api.request({
        method: isCheckIn ? "POST" : "PUT",
        url: `${import.meta.env.VITE_API_URL}/absence?id=${user.Absence[0]?.id || ""}`,
        data: data,
      });

      message.success(
        `Absen berhasil disimpan pada pukul ${moment().format("HH:mm:ss")}`,
      );
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.msg || "Terjadi kesalahan server.");
    } finally {
      setLoading(false);
    }
  };

  const handleAbsenceClicked = async () => {
    if (
      user.Absence.length === 0 &&
      moment().isAfter(moment().set("hour", config.last_shift), "minute")
    ) {
      message.error("Maaf, batas waktu absen masuk hari ini telah terlewat!");
      return;
    }
    if (
      moment().isBefore(moment().set("hour", config.shift_start - 1), "minute")
    ) {
      message.error("Belum memasuki waktu operasional absen.");
      return;
    }

    if (user.absen_method === "BUTTON") {
      await handleSaveAbsence();
    } else {
      setOpenFace(true);
    }
  };

  return (
    <Drawer
      title={<span className="font-semibold text-lg">Menu Absensi</span>}
      placement="right"
      open={open}
      onClose={() => setOpen(false)}
      width={380}
    >
      <div className="space-y-4">
        {user.Absence.length === 0 ? (
          <Button
            type="primary"
            size="large"
            block
            icon={<Calendar size={18} />}
            onClick={handleAbsenceClicked}
            loading={loading}
            disabled={disable || loading || modelLoad}
            className="h-12 text-base font-medium rounded-xl shadow-md bg-linear-to-r from-blue-600 to-indigo-600 border-none hover:opacity-90"
          >
            {modelLoad ? "Memuat Sistem Wajah..." : "Absen Masuk Sekarang"}
          </Button>
        ) : (
          <div className="space-y-2">
            <Alert
              message="Anda Sudah Absen Masuk"
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              className="rounded-lg font-medium"
            />
            {user.Absence[0].check_out ? (
              <Alert
                message="Anda Sudah Absen Pulang"
                type="info"
                showIcon
                className="rounded-lg font-medium"
              />
            ) : (
              <Button
                size="large"
                block
                danger
                type="primary"
                icon={<Calendar size={18} />}
                onClick={handleAbsenceClicked}
                disabled={disable || !coords || loading}
                className="h-12 text-base font-medium rounded-xl shadow-md border-none"
              >
                Absen Pulang Sekarang
              </Button>
            )}
          </div>
        )}

        {coords && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 shadow-sm transition-all">
            <div className="flex items-center gap-2 mb-3">
              <EnvironmentOutlined className="text-blue-500 text-lg animate-bounce" />
              <Text strong className="text-blue-800 text-sm">
                Lokasi Terdeteksi (GPS)
              </Text>
            </div>

            <div className="space-y-2">
              <div className="bg-white p-3 rounded-lg border border-blue-50">
                <Text
                  type="secondary"
                  className="text-[10px] uppercase tracking-wider block mb-1 font-semibold"
                >
                  Alamat Sekarang
                </Text>
                <Text className="text-xs text-gray-700 leading-relaxed block">
                  {coords.address || "Mencari alamat..."}
                </Text>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-2 rounded-lg border border-blue-50 flex items-center gap-2">
                  <CompassOutlined className="text-blue-400" />
                  <div>
                    <div className="text-[9px] text-gray-400 uppercase font-medium">
                      Latitude
                    </div>
                    <div className="text-xs font-mono font-semibold text-gray-700">
                      {coords.lat.toFixed(6)}
                    </div>
                  </div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-blue-50 flex items-center gap-2">
                  <AimOutlined className="text-blue-400" />
                  <div>
                    <div className="text-[9px] text-gray-400 uppercase font-medium">
                      Longitude
                    </div>
                    <div className="text-xs font-mono font-semibold text-gray-700">
                      {coords.lon.toFixed(6)}
                    </div>
                  </div>
                </div>
              </div>

              {coords.acc && (
                <div className="flex justify-end pt-1">
                  <Tag
                    color={coords.acc < 50 ? "success" : "warning"}
                    className="mr-0 rounded-full text-[10px]"
                  >
                    Akurasi: ±{Math.round(coords.acc)}m
                  </Tag>
                </div>
              )}
            </div>
          </div>
        )}

        <Divider className="my-2" />

        {user.Absence.length !== 0 && (
          <div className="space-y-3">
            <Card
              title={
                <span className="text-xs font-semibold text-gray-600">
                  Riwayat Masuk
                </span>
              }
              size="small"
              className="shadow-sm rounded-xl border-gray-100"
              styles={{ body: { fontSize: 12 } }}
            >
              <ul className="space-y-1 text-gray-600">
                <li>
                  <span className="font-medium">Waktu:</span>{" "}
                  {moment(user.Absence[0].check_in).format("DD/MM/YYYY HH:mm")}
                </li>
                {!!user.Absence[0].late_deduction && (
                  <li className="text-red-500 font-medium">
                    Potongan Terlambat:{" "}
                    {IDRFormat(user.Absence[0].late_deduction)}
                  </li>
                )}
                <li className="text-[11px] text-gray-400 font-mono">
                  GPS: {user.Absence[0].geo_in_lat},{" "}
                  {user.Absence[0].geo_in_long}
                </li>
              </ul>
            </Card>

            {user.Absence[0].check_out && (
              <Card
                title={
                  <span className="text-xs font-semibold text-gray-600">
                    Riwayat Pulang
                  </span>
                }
                size="small"
                className="shadow-sm rounded-xl border-gray-100"
                styles={{ body: { fontSize: 12 } }}
              >
                <ul className="space-y-1 text-gray-600">
                  <li>
                    <span className="font-medium">Waktu:</span>{" "}
                    {moment(user.Absence[0].check_out).format(
                      "DD/MM/YYYY HH:mm",
                    )}
                  </li>
                  {!!user.Absence[0].fast_leave_deduction && (
                    <li className="text-red-500 font-medium">
                      Potongan Pulang Cepat:{" "}
                      {IDRFormat(user.Absence[0].fast_leave_deduction)}
                    </li>
                  )}
                  <li className="text-[11px] text-gray-400 font-mono">
                    GPS: {user.Absence[0].geo_out_lat},{" "}
                    {user.Absence[0].geo_out_long}
                  </li>
                </ul>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Modal Face Scanner Otomatis */}
      <Modal
        width={500}
        title={
          <div className="text-center w-full font-bold text-base text-gray-800">
            Pemindaian Wajah Otomatis
          </div>
        }
        open={openFace}
        onCancel={() => setOpenFace(false)}
        footer={null}
        centered
        destroyOnClose
      >
        <div className="flex flex-col items-center py-4">
          <div className="relative overflow-hidden rounded-2xl border-4 border-slate-200 shadow-2xl bg-black aspect-4/3 w-full max-w-100">
            {/* Kamera Frame */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />

            {/* Animasi Bidikan Scanner / Scanner Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-56 border-4 border-dashed border-blue-500 rounded-full opacity-70 animate-[spin_20s_linear_infinite]"></div>
              <div className="absolute w-60 h-60 border-2 border-emerald-400 rounded-full opacity-40 animate-ping"></div>
              {/* Garis gerak scanning */}
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_12px_#3b82f6] animate-scan"></div>
            </div>
          </div>

          <div className="mt-6 w-full text-center px-4">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 shadow-inner">
              <p className="text-sm font-semibold text-blue-600 animate-pulse m-0">
                {scanStatus}
              </p>
            </div>
            <p className="text-gray-400 mt-3 text-xs">
              Hadapkan wajah langsung ke arah kamera dengan pencahayaan ruangan
              yang cukup bagus.
            </p>
          </div>
        </div>
      </Modal>
    </Drawer>
  );
}

// Global scope Helper functions
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
  const R = 6371e3;
  const φ1 = (latIn * Math.PI) / 180;
  const φ2 = (complat * Math.PI) / 180;
  const Δφ = ((complat - latIn) * Math.PI) / 180;
  const Δλ = ((complon - lonIn) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

function compareFaces(
  captured: Float32Array,
  refference: Float32Array,
  distanceThreshold = 0.6,
) {
  const distance = faceapi.euclideanDistance(captured, refference);
  return distance < distanceThreshold;
}
