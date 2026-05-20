import moment from "moment";
import prisma from "../libs/prisma.js";

export const AlphaDaily = async () => {
  try {
    const hariIni = moment();

    // 1. Validasi Hari Minggu (0 = Minggu, 6 = Sabtu)
    if (hariIni.day() === 0) {
      console.log("Hari ini adalah hari Minggu. Proses AlphaDaily dibatalkan.");
      return;
    }

    // 2. Validasi Hari Libur Nasional
    const tanggalLibur = await getHoliday();
    const formatHariIni = hariIni.format("YYYY-MM-DD");

    if (tanggalLibur.includes(formatHariIni)) {
      console.log(
        `Hari ini (${formatHariIni}) adalah Hari Libur Nasional. Proses AlphaDaily dibatalkan.`,
      );
      return;
    }
    const users = await prisma.user.findMany({
      where: {
        status: true,
        Absence: {
          none: {
            created_at: {
              gte: moment().startOf("day").toDate(),
              lte: moment().endOf("day").toDate(),
            },
          },
        },
      },
    });
    const configAbsence = await prisma.absenceConfig.findFirst();
    await prisma.$transaction(
      users.map((u) =>
        prisma.absence.create({
          data: {
            absence_status: "ALPHA",
            alpha_deduction: configAbsence?.alpha_deduction || 0,
            userId: u.id,
            geo_in_lat: 0,
            geo_in_long: 0,
            geo_out_lat: 0,
            geo_out_long: 0,
            check_in: new Date(),
            check_out: new Date(),
            method: "BUTTON",
          },
        }),
      ),
    );
    console.log("success..");
  } catch (err) {
    console.log(err);
  }
};

export const getHoliday = async () => {
  const responseApi = await fetch(
    `https://api-hari-libur.vercel.app/api?year=${moment().year()}`,
  );
  const { data } = await responseApi.json();
  return data.map((d: any) => d.date);
};
