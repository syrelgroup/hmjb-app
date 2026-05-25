import type { EBill, Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import moment from "moment";
import prisma from "../../libs/prisma.js";
import { ResponseServer } from "../../libs/util.js";
import xlsx from "xlsx";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let {
    page = 1,
    limit = 50,
    search,
    backdate,
    mitraId,
    productId,
    bill_status,
  } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  const where: Prisma.BillingWhereInput = {
    status: true,
    ...(search && { name: { contains: search as string } }),
    ...(mitraId && { mitraId: mitraId as string }),
    ...(productId && { productId: productId as string }),
    ...(bill_status && { bill_status: bill_status as EBill }),
    ...(backdate && {
      bill_date: {
        gte: moment((backdate as string).split(",")[0])
          .startOf("day")
          .toDate(),
        lte: moment((backdate as string).split(",")[1])
          .endOf("day")
          .toDate(),
      },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.billing.findMany({
      where,
      include: {
        Mitra: true,
        Submission: {
          include: {
            Debitur: true,
            Product: true,
          },
        },
        Product: true,
        User: true,
      },
      skip,
      take: limit,
      orderBy: { bill_date: "desc" },
    }),
    prisma.billing.count({ where }),
  ]);

  return ResponseServer(res, 200, {
    msg: "GET /billing",
    page,
    limit,
    search,
    backdate,
    data,
    total,
  });
};

// export const POST = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "Mohon unggah sebuah file!" });
//     }

//     const workbook = xlsx.read(req.file.buffer, {
//       type: "buffer",
//       cellDates: true, // <-- WAJIB TAMBAHKAN INI
//       dateNF: "dd/mm/yyyy",
//     });

//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];

//     const jsonData = xlsx.utils.sheet_to_json(sheet);

//     for (const data of jsonData) {
//       const record = {
//         norek: String((data as any)["NOREK"]),
//         nama: String((data as any)["NAMA"]),
//         cif: String((data as any)["CIF"]),
//         nik: String((data as any)["NO_IDENTITAS"]),
//         produk: String((data as any)["SEGMENTASI"]),
//         mitra: String((data as any)["INSTANSI"]),
//         col: String((data as any)["KD_KOL_EFF"]),
//         pkk: parseInt((data as any)["SLD_PINJAMAN_PKK"] || "0"),
//         plafond: parseInt((data as any)["NILAI_FAS_ASAL"] || "0"),
//         sld_ppk: parseInt((data as any)["SLD_TUNGGAK_PKK"] || "0"),
//         sld_bga: parseInt((data as any)["SLD_TUNGGAK_BGA"] || "0"),
//         value: parseInt((data as any)["NILAI_TGH_ANGSURAN"] || "0"),
//         tenor: parseInt((data as any)["tenor"] || "0"),
//         tanggal_tagih: (data as any)["TGL_JTH_TMP"]
//           ? moment((data as any)["TGL_JTH_TMP"], "DD/MM/YYYY").toDate()
//           : new Date(),
//         tanggal_mulai: (data as any)["TGL_BUKA"]
//           ? moment((data as any)["TGL_BUKA"], "DD/MM/YYYY").toDate()
//           : new Date(),
//         tanggal_akhir: (data as any)["TGL_AKHIR_FAS"]
//           ? moment((data as any)["TGL_AKHIR_FAS"], "DD/MM/YYYY").toDate()
//           : new Date(),
//         ao: String((data as any)["NAMA_AO"]),
//         status: String((data as any)["STATUS"]).toUpperCase(),
//       };

//       await prisma.$transaction(
//         async (tx) => {
//           const ao = await tx.user.findFirst({
//             where: { fullname: record.ao },
//           });
//           const produk = await tx.product.findFirst({
//             where: { name: record.produk },
//           });
//           const mitra = await tx.mitra.findFirst({
//             where: { name: record.mitra },
//           });
//           const sub = await tx.submission.findFirst({
//             where: {
//               OR: [
//                 { account_number: record.norek },
//                 {
//                   Debitur: {
//                     OR: [
//                       { cif: record.cif },
//                       { fullname: record.nama },
//                       { nik: record.nik },
//                     ],
//                   },
//                 },
//               ],
//             },
//           });

//           const genId = await generateId();
//           await prisma.billing.create({
//             data: {
//               id: genId,
//               name: record.nama,
//               bill_date: record.tanggal_tagih,
//               value: record.value,
//               realize_value: record.status === "BAYAR" ? record.value : 0,
//               plafond: record.plafond,
//               tenor: record.tenor,
//               tung_pkk: record.sld_ppk,
//               tung_bga: record.sld_bga,
//               pkk: record.pkk,
//               col: record.col,
//               bill_status: record.status.toUpperCase() as any,
//               userId: ao?.id,
//               productId: produk?.id,
//               mitraId: mitra?.id,
//               submissionId: sub?.id,
//             },
//           });
//           return true;
//         },
//         { timeout: 60000 * 10 },
//       );
//     }
//     res.status(200).json({
//       message: "Data berhasil diimport!",
//       total_data: jsonData.length,
//     });
//   } catch (err) {
//     console.log(err);
//     return ResponseServer(res, 500, {
//       msg: "Error creating billing",
//       error: err instanceof Error ? err.message : String(err),
//     });
//   }
// };

export const POST = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Validasi File
    if (!req.file) {
      return res.status(400).json({ message: "Mohon unggah sebuah file!" });
    }

    // 2. Baca File Excel
    const workbook = xlsx.read(req.file.buffer, {
      type: "buffer",
      cellDates: true, // Otomatis mengubah format tanggal excel menjadi objek Date JS
    });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    if (jsonData.length === 0) {
      return res
        .status(200)
        .json({ message: "Tidak ada data untuk diimport.", total_data: 0 });
    }
    const pType = await prisma.productType.findFirst({
      where: { name: { contains: "Kredit" } },
    });
    // 3. PRE-FETCH DATA MASTER & URUTAN ID (Hanya 1x query di awal)
    const [users, products, mitras, submissions, initialCount] =
      await Promise.all([
        prisma.user.findMany({ select: { id: true, fullname: true } }),
        prisma.product.findMany({ select: { id: true, name: true } }),
        prisma.mitra.findMany({ select: { id: true, name: true } }),
        prisma.submission.findMany({
          select: {
            id: true,
            account_number: true,
            Debitur: { select: { cif: true, fullname: true, nik: true } },
          },
        }),
        prisma.billing.count(), // Mengambil urutan terakhir dari database
      ]);

    // Transformasi data master ke Map (Pencarian O(1) di memori, sangat cepat)
    const userMap = new Map(
      users.map((u) => [u.fullname?.toLowerCase(), u.id]),
    );
    const productMap = new Map(
      products.map((p) => [p.name?.toLowerCase(), p.id]),
    );
    const mitraMap = new Map(mitras.map((m) => [m.name?.toLowerCase(), m.id]));

    // =========================================================================
    // 3b. DETEKSI & BUAT OTOMATIS PRODUK / MITRA BARU (Mencegah Query Duplikat)
    // =========================================================================
    const missingProducts = new Set<string>();
    const missingMitras = new Set<string>();

    for (let i = 0; i < jsonData.length; i++) {
      const anyData = jsonData[i] as any;
      const produkName = String(anyData["SEGMENTASI"] || "").trim();
      const mitraName = String(anyData["INSTANSI"] || "").trim();

      if (produkName && !productMap.has(produkName.toLowerCase())) {
        missingProducts.add(produkName);
      }
      if (mitraName && !mitraMap.has(mitraName.toLowerCase())) {
        missingMitras.add(mitraName);
      }
    }

    // Bulk Insert Produk Baru jika ada, lalu masukkan ke productMap
    if (missingProducts.size > 0) {
      // Solusi: Buat array murni secara eksplisit dan casting tipenya
      const productDataToInsert: Prisma.ProductCreateManyInput[] = Array.from(
        missingProducts,
      ).map((name) => ({
        name: String(name),
        productTypeId: pType?.id || "",
      }));

      await prisma.product.createMany({
        data: productDataToInsert,
        skipDuplicates: true,
      });

      // Ambil ID dari produk-produk baru tersebut untuk di-update ke Map
      const newProducts = await prisma.product.findMany({
        where: { name: { in: Array.from(missingProducts) } },
        select: { id: true, name: true },
      });
      newProducts.forEach((p) => productMap.set(p.name?.toLowerCase(), p.id));
    }

    // Bulk Insert Mitra Baru jika ada, lalu masukkan ke mitraMap
    if (missingMitras.size > 0) {
      const mitraDataToInsert = Array.from(missingMitras).map((name) => ({
        name,
      }));
      await prisma.mitra.createMany({
        data: mitraDataToInsert,
        skipDuplicates: true,
      });

      // Ambil ID dari mitra-mitra baru tersebut untuk di-update ke Map
      const newMitras = await prisma.mitra.findMany({
        where: { name: { in: Array.from(missingMitras) } },
        select: { id: true, name: true },
      });
      newMitras.forEach((m) => mitraMap.set(m.name?.toLowerCase(), m.id));
    }
    // =========================================================================

    // Konfigurasi untuk Auto-Increment ID BIL
    const prefix = "BIL";
    const padLength = 4;
    const billingDataList = [];

    // 4. LOOPING DATA EXCEL (Proses murni di dalam memori/RAM)
    for (let i = 0; i < jsonData.length; i++) {
      const anyData = jsonData[i] as any;
      if (!String(anyData["NAMA"])) continue;

      // --- CARA AMAN: Ambil key dengan mencoba versi trim jika versi biasa tidak ketemu ---
      const getExcelValue = (keyName: string) => {
        const actualKey = Object.keys(anyData).find(
          (k) => k.trim() === keyName,
        );
        return actualKey ? anyData[actualKey] : undefined;
      };

      const sldPinjamanPkk = getExcelValue("SLD_PINJAMAN_PKK");
      const nilaiFasAsal = getExcelValue("NILAI_FAS_ASAL");

      const nama = String(anyData["NAMA"] || "").trim();
      const aoName = String(anyData["NAMA_AO"] || "")
        .trim()
        .toLowerCase();
      const produkName = String(anyData["SEGMENTASI"] || "")
        .trim()
        .toLowerCase();
      const mitraName = String(anyData["INSTANSI"] || "")
        .trim()
        .toLowerCase();
      const norek = String(anyData["NOREK"] || "").trim();
      const cif = String(anyData["CIF"] || "").trim();
      const nik = String(anyData["NO_IDENTITAS"] || "").trim();
      const status = String(anyData["STATUS"] || "")
        .trim()
        .toUpperCase();

      const value = parseFloat(anyData["NILAI_TGH_ANGSURAN"] || "0");

      // Relasi Map (Sekarang dijamin ketemu ID-nya karena sudah dibuat di langkah 3b)
      const userId = userMap.get(aoName) || null;
      const productId = productMap.get(produkName) || null;
      const mitraId = mitraMap.get(mitraName) || null;

      const matchedSub = submissions.find(
        (sub) =>
          sub.account_number === norek ||
          sub.Debitur?.cif === cif ||
          sub.Debitur?.fullname === nama ||
          sub.Debitur?.nik === nik,
      );

      const billDate = anyData["TGL_JTH_TMP"]
        ? moment(anyData["TGL_JTH_TMP"], "DD/MM/YYYY").toDate()
        : new Date();
      const tglMulai = anyData["TGL_BUKA"]
        ? moment(anyData["TGL_BUKA"], "DD/MM/YYYY").toDate()
        : new Date();
      const tglAkhir = anyData["TGL_AKHIR_FAS"]
        ? moment(anyData["TGL_AKHIR_FAS"], "DD/MM/YYYY").toDate()
        : new Date();

      const nextNumber = initialCount + 1 + i;
      const genId = `${prefix}${String(nextNumber).padStart(padLength, "0")}`;

      billingDataList.push({
        id: genId,
        name: nama,
        bill_date: billDate,
        value: value,
        realize_value: status === "BAYAR" ? value : 0,
        plafond: parseFloat(nilaiFasAsal || "0"),
        tenor: parseInt(anyData["JANGKA_BLN"] || anyData["tenor"] || "0"),
        tung_pkk: parseFloat(anyData["SLD_TUNGGAK_PKK"] || "0"),
        tung_bga: parseFloat(anyData["SLD_TUNGGAK_BGA"] || "0"),
        pkk: parseFloat(sldPinjamanPkk || "0"),
        col: String(anyData["KD_KOL_EFF"] || ""),
        bill_status: status as any,
        start_at: tglMulai,
        end_at: tglAkhir,
        userId,
        productId,
        mitraId,
        submissionId: matchedSub?.id || null,
      });
    }

    // 5. BULK INSERT BILLING
    await prisma.billing.createMany({
      data: billingDataList,
      skipDuplicates: true,
    });

    return res.status(200).json({
      message:
        "Data berhasil diimport dengan ID berurutan beserta Produk/Mitra otomatis!",
      total_data: jsonData.length,
    });
  } catch (err) {
    console.error("Import Error: ", err);
    return res.status(500).json({
      msg: "Error creating billing",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

export const PUT = async (req: Request, res: Response, next: NextFunction) => {
  let body = req.body;
  let { id } = req.params;

  try {
    // Jika ID tidak ada di params, coba dari body
    id = id || body.id;

    if (!id) {
      return ResponseServer(res, 400, {
        msg: "ID is required",
      });
    }

    const { Mitra, Submission, User, Product, ...saved } = body;
    await prisma.billing.update({
      where: { id: id as string },
      data: { ...saved },
    });

    return ResponseServer(res, 200, {
      msg: "Tagihan updated successfully",
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: "Error updating billing",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

export const DELETE = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let { id } = req.query;
  try {
    await prisma.billing.update({
      where: { id: id as string },
      data: { status: false },
    });
    return ResponseServer(res, 200, {
      msg: "Billing berhasil dihapus",
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: "Gagal hapus data Billing. Internal server error!",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

export const LAPORAN = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { month } = req.query;
  try {
    const data = await prisma.mitra.findMany({
      where: { status: true },
      include: {
        Billing: {
          where: {
            status: true,
            ...(month && {
              bill_date: {
                gte: moment(month as string)
                  .startOf("month")
                  .toDate(),
                lte: moment(month as string)
                  .endOf("month")
                  .toDate(),
              },
            }),
          },
          include: {
            Submission: {
              include: {
                Debitur: true,
                Product: true,
              },
            },
            User: true,
          },
        },
      },
    });
    return ResponseServer(res, 200, {
      msg: "Laporan Billing berhasil digenerate",
      data: data,
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: "Gagal generate laporan Billing. Internal server error!",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
