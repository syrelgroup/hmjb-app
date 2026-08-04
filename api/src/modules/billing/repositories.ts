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
    col,
  } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  const where: Prisma.BillingWhereInput = {
    status: true,
    ...(search && {
      OR: [
        { name: { contains: search as string } },
        {
          Submission: {
            OR: [
              { account_number: { contains: search as string } },
              {
                Debitur: {
                  OR: [
                    { nik: { contains: search as string } },
                    { fullname: { contains: search as string } },
                    { cif: { contains: search as string } },
                  ],
                },
              },
            ],
          },
        },
      ],
    }),
    ...(mitraId && { mitraId: mitraId as string }),
    ...(productId && { productId: productId as string }),
    ...(bill_status && { bill_status: bill_status as EBill }),
    ...(col && col === "NOT_WO" && { col: { not: "6" } }),
    ...(col && col === "NPL" && { col: { in: ["3", "4", "5"] } }),
    ...(col && col === "LAR" && { col: { in: ["2", "3", "4", "5"] } }),
    ...(col &&
      !["NOT_WO", "NPL", "LAR"].includes(col as string) && {
        col: { contains: col as string },
      }),
    ...(backdate && {
      periode: {
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
        Mitra: { select: { name: true, id: true } },
        Submission: {
          include: {
            Debitur: { select: { fullname: true, cif: true } },
            Product: { select: { name: true, id: true } },
          },
          omit: {
            activities: true,
            coments: true,
            purpose: true,
            doc_status: true,
            flagging_status: true,
            approve_status: true,
            guarantee_status: true,
          },
        },
        Product: { select: { name: true } },
        User: {
          omit: {
            created_at: true,
            updated_at: true,
            absen_method: true,
            salary: true,
            ptkp: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { bill_date: "desc" },
    }),
    prisma.billing.count({ where }),
  ]);

  return ResponseServer(res, 200, { data, total });
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
    if (!req.file) {
      return res.status(400).json({ message: "Mohon unggah sebuah file!" });
    }

    const workbook = xlsx.read(req.file.buffer, {
      type: "buffer",
      cellDates: true,
      dateNF: "dd/mm/yyyy",
    });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    if (!jsonData.length) {
      return res.status(200).json({
        message: "Tidak ada data untuk diimport.",
        total_data: 0,
      });
    }

    const normalize = (value: any) =>
      String(value ?? "")
        .trim()
        .toLowerCase();

    const normalizeKey = (value: any) =>
      String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[\s\-_./]+/g, "");

    const text = (value: any) => String(value ?? "").trim();

    const number = (value: any) => {
      if (value === null || value === undefined || value === "") return 0;

      if (typeof value === "number") return value;

      const raw = String(value).trim();

      // Format Indonesia: 1.234.567,89
      if (raw.includes(",")) {
        return Number(raw.replace(/\./g, "").replace(/,/g, ".")) || 0;
      }

      // Format angka biasa / Excel number
      return Number(raw.replace(/\./g, "")) || 0;
    };

    const parseDate = (value: any): Date => {
      if (!value) return new Date();

      let year: number, month: number, day: number;

      if (value instanceof Date) {
        // Gunakan method lokal (getFullYear/getMonth/getDate) karena SheetJS
        // mengeset tanggal yang benar di zona waktu lokal (WIB)
        year = value.getFullYear();
        month = value.getMonth();
        day = value.getDate();
      } else if (typeof value === "number") {
        // Jika Excel membaca sebagai serial number (misal: 46235)
        const utcDays = Math.floor(value - 25569);
        const utcValue = utcDays * 86400 * 1000;
        const dateInfo = new Date(utcValue);
        year = dateInfo.getUTCFullYear();
        month = dateInfo.getUTCMonth();
        day = dateInfo.getUTCDate();
      } else {
        // Jika berupa string ("01/08/2026", "YYYY-MM-DD", dll)
        const parsed = moment(String(value).trim(), [
          "DD/MM/YYYY",
          "D/M/YYYY",
          "YYYY-MM-DD",
          "MM/DD/YYYY",
        ]);
        if (!parsed.isValid()) return new Date();
        year = parsed.year();
        month = parsed.month();
        day = parsed.date();
      }

      // Kunci waktu pada 12:00:00 UTC mutlak
      // Hasil di DB UTC: 2026-08-01 12:00:00 | Hasil di WIB: 2026-08-01 19:00:00
      // Kedua zona waktu TETAP berada di tanggal 01/08/2026
      return new Date(Date.UTC(year, month, day, 12, 0, 0));
    };

    const getExcelValue = (row: any, keyName: string) => {
      const targetKey = normalizeKey(keyName);
      const actualKey = Object.keys(row).find(
        (key) => normalizeKey(key) === targetKey,
      );
      return actualKey ? row[actualKey] : undefined;
    };

    const normalizeBillStatus = (value: any) => {
      const status = normalizeEnum(text(value)).trim().toUpperCase();
      return status || "BELUMBAYAR";
    };

    // ==================================================
    // 1. NORMALISASI ROW EXCEL DULU
    // ==================================================
    const rows = (jsonData as any[])
      .map((item: any, index: number) => {
        const nama = text(getExcelValue(item, "NAMA"));
        const per = moment(parseDate(getExcelValue(item, "PERIODE")))
          .add(1, "day")
          .toDate();
        const billDate = parseDate(getExcelValue(item, "TGL_JTH_TMP"));

        return {
          rowIndex: index + 2,
          nama,
          aoName: text(getExcelValue(item, "NAMA_AO")),
          produkName: text(getExcelValue(item, "SEGMENTASI")),
          mitraName: text(getExcelValue(item, "INSTANSI")),
          norek: text(getExcelValue(item, "NOREK")),
          cif: text(getExcelValue(item, "CIF")),
          nik: text(getExcelValue(item, "NO_IDENTITAS")),
          status: normalizeBillStatus(getExcelValue(item, "STATUS")),
          billDate: moment(billDate)
            .set("month", per.getMonth())
            .set("year", per.getFullYear())
            .toDate(),
          startAt: parseDate(getExcelValue(item, "TGL_BUKA")),
          endAt: parseDate(getExcelValue(item, "TGL_AKHIR_FAS")),
          angsuran: number(getExcelValue(item, "NILAI_TGH_ANGSURAN")),
          plafond: number(getExcelValue(item, "NILAI_FAS_ASAL")),
          tenor: number(getExcelValue(item, "JANGKA_BLN")),
          tungPkk: number(getExcelValue(item, "SLD_TUNGGAK_PKK")),
          tungBga: number(getExcelValue(item, "SLD_TUNGGAK_BGA")),
          pkk: number(getExcelValue(item, "SLD_PINJAMAN_PKK")),
          col: text(getExcelValue(item, "KD_KOL_EFF")),
          periode: per,
        };
      })
      .filter((row) => row.nama);

    if (!rows.length) {
      return res.status(200).json({
        message:
          "Tidak ada data valid untuk diimport. Kolom NAMA kosong / tidak terbaca.",
        total_data: jsonData.length,
        inserted_data: 0,
        sample_header: Object.keys((jsonData as any[])[0] || {}),
      });
    }

    const unique = (arr: string[]) =>
      Array.from(
        new Set(arr.map((v) => text(v)).filter((v) => v && v !== "-")),
      );

    const aoNames = unique(rows.map((r) => r.aoName));
    const productNames = unique(rows.map((r) => r.produkName));
    const mitraNames = unique(rows.map((r) => r.mitraName));
    const accountNumbers = unique(rows.map((r) => r.norek));
    const cifs = unique(rows.map((r) => r.cif));
    const niks = unique(rows.map((r) => r.nik));

    // ==================================================
    // 2. PREFETCH MASTER DATA
    // ==================================================
    let pType = await prisma.productType.findFirst({
      where: {
        name: {
          contains: "Kredit",
        },
      },
    });

    // Kalau product type Kredit belum ada, buat otomatis.
    if (!pType) {
      pType = await prisma.productType.create({
        data: {
          name: "Kredit",
        },
      });
    }

    const [users, products, mitras, submissions, billings] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          fullname: true,
          username: true,
          nip: true,
        },
      }),
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
        },
      }),
      prisma.mitra.findMany({
        select: {
          id: true,
          name: true,
        },
      }),
      prisma.submission.findMany({
        where: {
          OR: [
            { account_number: { in: accountNumbers } },
            { Debitur: { cif: { in: cifs } } },
            { Debitur: { nik: { in: niks } } },
          ],
        },
        select: {
          id: true,
          account_number: true,
          Debitur: {
            select: {
              cif: true,
              fullname: true,
              nik: true,
            },
          },
        },
      }),
      prisma.billing.findMany({
        where: {
          id: {
            startsWith: "BIL",
          },
        },
        select: {
          id: true,
        },
      }),
    ]);

    const userMap = new Map<string, any>();
    users.forEach((user) => {
      if (user.fullname) userMap.set(normalize(user.fullname), user);
      if (user.username) userMap.set(normalize(user.username), user);
      if (user.nip) userMap.set(normalize(user.nip), user);
    });

    const productMap = new Map<string, any>();
    products.forEach((product) => {
      if (product.name) productMap.set(normalize(product.name), product);
    });

    const mitraMap = new Map<string, any>();
    mitras.forEach((mitra) => {
      if (mitra.name) mitraMap.set(normalize(mitra.name), mitra);
    });

    const submissionMapByNorek = new Map<string, any>();
    const submissionMapByCif = new Map<string, any>();
    const submissionMapByNik = new Map<string, any>();
    const submissionMapByName = new Map<string, any>();

    submissions.forEach((submission) => {
      if (submission.account_number) {
        submissionMapByNorek.set(
          normalize(submission.account_number),
          submission,
        );
      }
      if (submission.Debitur?.cif) {
        submissionMapByCif.set(normalize(submission.Debitur.cif), submission);
      }
      if (submission.Debitur?.nik) {
        submissionMapByNik.set(normalize(submission.Debitur.nik), submission);
      }
      if (submission.Debitur?.fullname) {
        submissionMapByName.set(
          normalize(submission.Debitur.fullname),
          submission,
        );
      }
    });

    const getLastBillingNumber = () => {
      let max = 0;
      billings.forEach((billing) => {
        const match = String(billing.id || "").match(/\d+/);
        if (match) max = Math.max(max, Number(match[0]));
      });
      return max;
    };

    let runningBillingNumber = getLastBillingNumber();

    const skippedRows: any[] = [];
    const billingDataList: Prisma.BillingCreateManyInput[] = [];

    // ==================================================
    // 3. TRANSACTION: BUAT MASTER JIKA BELUM ADA + INSERT BILLING
    // ==================================================
    const insertResult = await prisma.$transaction(
      async (tx) => {
        // 3a. Buat User/AO yang belum ada
        for (const aoName of aoNames) {
          const key = normalize(aoName);
          if (!key || userMap.has(key)) continue;

          const created = await tx.user.create({
            data: {
              fullname: aoName,
              username: normalizeKey(aoName).replace(/\s+/g, ".") || key,
              password: "123456",
              status: true,
              salary: 0,
              ptkp: "TK/0",
              absen_method: "BUTTON",
              roleId: "RL02",
            },
            select: {
              id: true,
              fullname: true,
              username: true,
              nip: true,
            },
          });

          userMap.set(normalize(created.fullname), created);
          userMap.set(normalize(created.username), created);
          if (created.nip) userMap.set(normalize(created.nip), created);
        }

        // 3b. Buat Product yang belum ada
        for (const productName of productNames) {
          const key = normalize(productName);
          if (!key || productMap.has(key)) continue;

          const created = await tx.product.create({
            data: {
              name: productName,
              productTypeId: pType!.id,
            },
            select: {
              id: true,
              name: true,
            },
          });

          productMap.set(normalize(created.name), created);
        }

        // 3c. Buat Mitra yang belum ada
        for (const mitraName of mitraNames) {
          const key = normalize(mitraName);
          if (!key || mitraMap.has(key)) continue;

          const created = await tx.mitra.create({
            data: {
              name: mitraName,
            },
            select: {
              id: true,
              name: true,
            },
          });

          mitraMap.set(normalize(created.name), created);
        }

        // 3d. Hapus billing pada bulan yang ada di Excel supaya upload ulang bulan sama tidak dobel
        // const monthKeys = Array.from(
        //   new Set(rows.map((row) => moment(row.periode).format("YYYY-MM-DD"))),
        // );

        // for (const monthKey of monthKeys) {
        //   await tx.billing.deleteMany({
        //     where: {
        //       periode: {
        //         gte: moment(monthKey).startOf("day").toDate(),
        //         lte: moment(monthKey).endOf("day").toDate(),
        //       },
        //     },
        //   });
        // }

        // 3e. Susun data billing
        for (const row of rows) {
          const user = userMap.get(normalize(row.aoName));
          const product = productMap.get(normalize(row.produkName));
          const mitra = mitraMap.get(normalize(row.mitraName));

          if (!user) {
            skippedRows.push({
              row: row.rowIndex,
              reason: "NAMA_AO kosong / user gagal dibuat",
              nama: row.nama,
              aoName: row.aoName,
            });
            continue;
          }

          if (!product) {
            skippedRows.push({
              row: row.rowIndex,
              reason: "SEGMENTASI kosong / produk gagal dibuat",
              nama: row.nama,
              produkName: row.produkName,
            });
            continue;
          }

          const matchedSub =
            submissionMapByNorek.get(normalize(row.norek)) ||
            submissionMapByCif.get(normalize(row.cif)) ||
            submissionMapByNik.get(normalize(row.nik)) ||
            submissionMapByName.get(normalize(row.nama));

          runningBillingNumber++;
          const id = `BIL${String(runningBillingNumber).padStart(4, "0")}`;

          billingDataList.push({
            id,
            name: row.nama,
            bill_date: row.billDate,
            value: row.angsuran,
            realize_value: row.status === "BAYAR" ? row.angsuran : 0,
            plafond: row.plafond,
            tenor: row.tenor,
            tung_pkk: row.tungPkk,
            tung_bga: row.tungBga,
            pkk: row.pkk,
            col: row.col,
            bill_status: row.status as any,
            start_at: row.startAt,
            end_at: row.endAt,
            userId: user.id,
            productId: product.id,
            mitraId: mitra?.id || null,
            submissionId: matchedSub?.id || null,
            periode: row.periode,
          });
        }

        if (!billingDataList.length) {
          return { count: 0 };
        }

        const result = await tx.billing.createMany({
          data: billingDataList,
          // skipDuplicates: true,
        });
        return result;
      },
      {
        timeout: 60000 * 10,
      },
    );

    return res.status(200).json({
      message: "Data billing berhasil diimport.",
      total_data: jsonData.length,
      valid_data: rows.length,
      prepared_data: billingDataList.length,
      inserted_data: insertResult.count,
      skipped_data: skippedRows.length,
      skipped_rows: skippedRows.slice(0, 30),
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
    const [data, billings] = await Promise.all([
      prisma.mitra.findMany({
        where: {
          status: true,
          Billing: {
            some: {
              col: { in: ["1", "2", "3", "4", "5"] },
              status: true,
              periode: {
                gte: moment(month ? new Date(month as string) : new Date())
                  .startOf("month")
                  .toDate(),
                lte: moment(month ? new Date(month as string) : new Date())
                  .endOf("month")
                  .toDate(),
              },
            },
          },
        },
        omit: {
          file: true,
          address: true,
          phone: true,
          email: true,
          no_contract: true,
          pic: true,
        },
        include: {
          Billing: {
            where: {
              col: { in: ["1", "2", "3", "4", "5"] },
              status: true,
              periode: {
                gte: moment(month ? new Date(month as string) : new Date())
                  .startOf("month")
                  .toDate(),
                lte: moment(month ? new Date(month as string) : new Date())
                  .endOf("month")
                  .toDate(),
              },
            },
            include: {
              Submission: {
                omit: {
                  flagging_status: true,
                  doc_status: true,
                  activities: true,
                  coments: true,
                  approve_status: true,
                  guarantee_status: true,
                  purpose: true,
                  value: true,
                  tenor: true,
                  drawer_code: true,
                  created_at: true,
                  updated_at: true,
                  createdById: true,
                },
                include: {
                  Debitur: { select: { fullname: true } },
                  Product: { select: { name: true } },
                  Mitra: { select: { name: true } },
                },
              },
              User: { select: { fullname: true, nip: true, nik: true } },
            },
          },
        },
      }),
      prisma.billing.findMany({
        where: {
          status: true,
          periode: {
            gte: moment().subtract(12, "month").startOf("month").toDate(),
            lte: moment(month ? new Date(month as string) : new Date())
              .endOf("month")
              .toDate(),
          },
        },
      }),
    ]);
    return ResponseServer(res, 200, {
      msg: "Laporan Billing berhasil digenerate",
      data: data,
      billings,
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: "Gagal generate laporan Billing. Internal server error!",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

const normalizeEnum = (value: any) => {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "")
    .replace(/_+/g, "");
};

export const UPDATE_ALL_BILLDATE = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const BATCH_SIZE = 500;
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const billings = await prisma.billing.findMany({
      take: BATCH_SIZE,
      skip: skip,
    });

    if (billings.length === 0) {
      hasMore = false;
      break;
    }
    console.log({ batch: skip / BATCH_SIZE });

    // Buat transaksi untuk update per baris dalam batch ini
    await prisma.$transaction(
      billings.map((f) => {
        const newDate = moment(f.bill_date)
          .set("month", f.periode.getMonth())
          .set("year", f.periode.getFullYear())
          .toDate();

        return prisma.billing.update({
          where: { id: f.id },
          data: { bill_date: newDate },
        });
      }),
    );

    skip += BATCH_SIZE;
  }

  return ResponseServer(res, 200, { msg: "OK", status: 200 });
};
