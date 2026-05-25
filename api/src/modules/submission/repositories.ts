import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
import type {
  Debitur,
  EArsipStatus,
  EFlaggingStatus,
  EGuaranteeStatus,
  Insurance,
  Mitra,
  PayOffice,
  Prisma,
  Product,
  ProductType,
  Submission,
  SubmissionType,
  User,
} from "@prisma/client";
import xlsx from "xlsx";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let {
    page = 1,
    limit = 50,
    search,
    productTypeId,
    productId,
    guarantee_status,
    doc_status,
    approve_status,
    flagging_status,
    backdate,
    submissionTypeId,
    mitraId,
    payOfficeId,
    insuranceId,
  } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const queryWhere: Prisma.SubmissionWhereInput = {
      status: true,
      ...(search && {
        OR: [
          {
            Debitur: {
              OR: [
                { fullname: { contains: search as string } },
                { id: { contains: search as string } },
                { nik: { contains: search as string } },
                { cif: { contains: search as string } },
              ],
            },
          },
          { id: { contains: search as string } },
          { drawer_code: { contains: search as string } },
          { account_number: { contains: search as string } },
        ],
      }),
      ...(submissionTypeId && {
        Debitur: { submissionTypeId: submissionTypeId as string },
      }),
      ...(productTypeId && {
        Product: {
          productTypeId: productTypeId as string,
        },
      }),
      ...(productId && { productId: productId as string }),
      ...(mitraId && { mitraId: mitraId as string }),
      ...(payOfficeId && { payOfficeId: payOfficeId as string }),
      ...(insuranceId && { insuranceId: insuranceId as string }),
      ...(approve_status && {
        approve_status: approve_status as EArsipStatus,
      }),
      ...(flagging_status && {
        flagging_status: flagging_status as EFlaggingStatus,
      }),
      ...(guarantee_status && {
        guarantee_status: guarantee_status as EGuaranteeStatus,
      }),
      ...(doc_status && {
        doc_status: doc_status as EGuaranteeStatus,
      }),
      ...(backdate && {
        created_at: {
          gte: moment((backdate as string).split(",")[0])
            .startOf("day")
            .toDate(),
          lte: moment((backdate as string).split(",")[1])
            .endOf("day")
            .toDate(),
        },
      }),
      ...(req.user?.Role.data_status === "USER"
        ? { OR: [{ createdById: req.user.id }, { userId: req.user.id }] }
        : {}),
    };

    const data = await prisma.submission.findMany({
      where: queryWhere,
      skip: skip,
      take: limit,
      include: {
        Debitur: { include: { SubmissionType: true } },
        Product: {
          include: {
            ProductType: {
              include: {
                ProductTypeFile: true,
              },
            },
          },
        },
        User: true,
        Files: true,
        PermitFileDetail: true,
        Mitra: true,
        CollateralLending: true,
        PayOffice: true,
        Insurance: true,
      },
      orderBy: { created_at: "desc" },
    });

    const total = await prisma.submission.count({
      where: queryWhere,
    });
    return ResponseServer(res, 200, {
      msg: "GET /submission",
      data: data.map((d) => ({
        ...d,
        activities: JSON.parse(d.activities || "[]"),
        coments: JSON.parse(d.coments || "[]"),
      })),
      total,
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

export const POST = async (req: Request, res: Response, next: NextFunction) => {
  let body = req.body;
  try {
    const {
      id,
      User,
      PermitFileDetail,
      Debitur,
      Product,
      Files,
      Mitra,
      CollateralLending,
      CreatedBy,
      PayOffice,
      Insurance,
      ...savedSub
    } = body;
    const genId = await generateId();
    const genDebId = await generateDebiturId();
    Debitur.id = Debitur.id ? Debitur.id : genDebId;
    const { SubmissionType, Visit, Submission, ...savedeb } = Debitur;
    await prisma.$transaction(async (tx) => {
      const deb = await tx.debitur.upsert({
        where: { id: Debitur.id },
        update: savedeb,
        create: savedeb,
      });
      const sub = await tx.submission.create({
        data: {
          ...savedSub,
          id: body.id && body.id !== "" ? body.id : genId,
          debiturId: deb.id,
          coments: JSON.stringify(body.coments.filter((c: any) => c.comment)),
          activities: JSON.stringify(body.activities),
          createdById: req.user?.id,
        },
      });
      for (const productTypeFile of Product.ProductType.ProductTypeFile) {
        if (productTypeFile.Files) {
          await tx.files.createMany({
            data: productTypeFile.Files.map((f: any) => ({
              ...f,
              productTypeFileId: productTypeFile.id,
              submissionId: sub.id,
            })),
          });
        }
      }
      return true;
    });
    return ResponseServer(res, 200, { msg: "Data berhasil ditambahkan" });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

export const PUT = async (req: Request, res: Response, next: NextFunction) => {
  let { id } = req.query;
  let body = req.body;

  try {
    if (!id)
      return ResponseServer(res, 404, {
        msg: "ID Not found",
        params: req.params,
      });
    const find = await prisma.submission.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    const {
      User,
      PermitFileDetail,
      Debitur,
      Product,
      Files,
      Mitra,
      CollateralLending,
      CreatedBy,
      PayOffice,
      Insurance,
      ...savedSub
    } = body;
    const { SubmissionType, Visit, Submission, ...savedeb } = Debitur;

    await prisma.$transaction(async (tx) => {
      await tx.debitur.update({
        where: { id: Debitur.id as string },
        data: savedeb,
      });
      await tx.submission.update({
        where: { id: id as string },
        data: {
          ...savedSub,
          coments: JSON.stringify(savedSub.coments),
          activities: JSON.stringify(savedSub.activities),
        },
      });
      for (const productTypeFile of Product.ProductType.ProductTypeFile) {
        if (productTypeFile.Files) {
          for (const file of productTypeFile.Files) {
            const { id: fileId, ...fileData } = file;

            await tx.files.upsert({
              where: { id: fileId, productTypeFileId: productTypeFile.id }, // Jika file baru, id biasanya kosong
              update: { name: fileData.name },
              create: {
                ...fileData,
                id: undefined,
              },
            });
          }
        }
      }
      return true;
    });

    return ResponseServer(res, 200, { msg: "Data berhasil dirubah" });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
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
    if (!id) return ResponseServer(res, 404, { msg: "Not found data" });
    const find = await prisma.submission.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    await prisma.submission.update({
      where: { id: find.id },
      data: { status: false },
    });

    return ResponseServer(res, 200, { msg: "Data berhasil dihapus" });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

export const PATCH = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let { id } = req.query;
  try {
    if (!id) return ResponseServer(res, 404, { msg: "Not found data" });
    const find = await prisma.submission.findFirst({
      where: { id: id as string },
      include: {
        Debitur: true,
        Product: {
          include: {
            ProductType: {
              include: {
                ProductTypeFile: {
                  include: { Files: { where: { submissionId: id as string } } },
                },
              },
            },
          },
        },
        User: true,
        Files: true,
        PermitFileDetail: true,
        Mitra: true,
        PayOffice: true,
        Insurance: true,
      },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    find.coments = JSON.parse(find.coments || "[]");
    find.activities = JSON.parse(find.activities || "[]");
    return ResponseServer(res, 200, { msg: "OK", data: find });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

export const IMPORT = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Mohon unggah sebuah file!" });
    }

    const workbook = xlsx.read(req.file.buffer, {
      type: "buffer",
      cellDates: true, // <-- WAJIB TAMBAHKAN INI
      dateNF: "dd/mm/yyyy",
    });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const jsonData = xlsx.utils.sheet_to_json(sheet);

    for (const data of jsonData) {
      await prisma.$transaction(
        async (tx) => {
          const record = {
            jenis_pemohon: String((data as any).jenis_pemohon).trim(),
            tipe_produk: String((data as any).tipe_produk).trim(),
            produk: String((data as any).produk).trim(),
            cif: String((data as any).cif).trim(),
            nik: String((data as any).nik).trim(),
            nama_petugas: String((data as any).nama_petugas).trim(),
            nip_petugas: String((data as any).nip_petugas).trim(),
            nama: String((data as any).nama).trim(),
            tempat_lahir: String((data as any).tempat_lahir).trim(),
            tanggal_lahir: String((data as any).tanggal_lahir).trim(),
            alamat: String((data as any).alamat).trim(),
            no_telepon: String((data as any).no_telepon).trim(),
            email: String((data as any).email).trim(),
            nama_mitra: String((data as any).nama_mitra).trim(),
            kantor_bayar: String((data as any).kantor_bayar).trim(),
            asuransi: String((data as any).asuransi).trim(),
            nilai: String((data as any).nilai).trim(),
            tenor: String((data as any).tenor).trim(),
            no_lemari: String((data as any).no_lemari).trim(),
            tujuan_penggunaan: String((data as any).tujuan_penggunaan).trim(),
            status_nasabah: String((data as any).status_nasabah).trim() as any,
            status_dokumen: String((data as any).status_dokumen).trim() as any,
            status_jaminan: String((data as any).status_jaminan).trim() as any,
            status_flagging: String(
              (data as any).status_flagging,
            ).trim() as any,
            no_rekening: String((data as any).no_rekening).trim(),
            tanggal_dibuat: String((data as any).tanggal_dibuat).trim(),
          };

          let typeDebt = await tx.submissionType.findFirst({
            where: { name: record.jenis_pemohon },
          });
          if (!typeDebt) {
            const genSubTypeId = await generateSubTypeId();
            typeDebt = await tx.submissionType.create({
              data: {
                id: genSubTypeId,
                name: record.jenis_pemohon,
              },
            });
          }

          let productType = await tx.productType.findFirst({
            where: { name: record.tipe_produk },
          });
          if (!productType) {
            const pTypeId = await generateProdTypeId();
            productType = await tx.productType.create({
              data: {
                id: pTypeId,
                name: record.tipe_produk,
              },
            });
          }
          let product = await tx.product.findFirst({
            where: { name: record.produk },
          });
          if (!product) {
            product = await tx.product.create({
              data: {
                name: record.produk,
                productTypeId: productType.id,
              },
            });
          }

          let usr = await tx.user.findFirst({
            where: {
              OR: [
                { nip: record.nip_petugas },
                { fullname: record.nama_petugas },
              ],
            },
          });
          if (!usr) {
            const usdId = await generateUsrId();
            usr = await tx.user.create({
              data: {
                id: usdId,
                fullname: record.nama_petugas,
                nip: record.nip_petugas,
                username: record.nama_petugas.toLowerCase(),
                password: record.nama_petugas.toLowerCase(),
                salary: 0,
                absen_method: "BUTTON",
                ptkp: "TK/0",
                roleId: "RL01",
                // positionId: "POS02",
              },
            });
          }

          let debt = await tx.debitur.findFirst({
            where: {
              OR: [{ cif: record.cif }, { nik: record.nik }],
            },
          });

          if (!debt) {
            const genDebtId = await generateDebiturId();
            debt = await tx.debitur.create({
              data: {
                id: genDebtId,
                cif: record.cif,
                nik: record.nik,
                fullname: record.nama,
                birthplace: record.tempat_lahir,
                birthdate: moment(record.tanggal_lahir, "DD/MM/YYYY").toDate(),
                address: record.alamat,
                phone: record.no_telepon,
                email: record.email,
                submissionTypeId: typeDebt.id,
              },
            });
          }

          let mitra = null;
          if ((data as any).nama_mitra) {
            const mitraFind = await tx.mitra.findFirst({
              where: { name: record.nama_mitra },
            });
            if (mitraFind) {
              mitra = mitraFind;
            } else {
              const mitId = await generateMitraId();
              mitra = await tx.mitra.create({
                data: {
                  id: mitId,
                  name: record.nama_mitra,
                },
              });
            }
          }
          let payOffice = null;
          if ((data as any).kantor_bayar) {
            const kabay = await tx.payOffice.findFirst({
              where: { name: record.kantor_bayar },
            });
            if (kabay) {
              payOffice = kabay;
            } else {
              const kbyId = await generateKbyId();
              payOffice = await tx.payOffice.create({
                data: {
                  id: kbyId,
                  name: record.kantor_bayar,
                },
              });
            }
          }
          let insur = null;
          if ((data as any).asuransi) {
            const kabay = await tx.insurance.findFirst({
              where: { name: record.asuransi },
            });
            if (kabay) {
              insur = kabay;
            } else {
              const insId = await generateInscId();
              insur = await tx.insurance.create({
                data: {
                  id: insId,
                  name: record.asuransi,
                },
              });
            }
          }

          const genId = await generateId();
          await tx.submission.create({
            data: {
              id: genId,
              debiturId: debt.id,
              mitraId: mitra?.id,
              insuranceId: insur?.id,
              payOfficeId: payOffice?.id,
              value: parseInt(record.nilai || "0"),
              tenor: parseInt(record.tenor || "0"),
              productId: product.id,
              userId: usr.id,
              createdById: usr.id,
              drawer_code: record.no_lemari || "-",
              purpose: record.tujuan_penggunaan || "-",
              approve_status: record.status_nasabah,
              doc_status: record.status_dokumen,
              guarantee_status: record.status_jaminan,
              flagging_status: record.status_flagging,
              account_number: record.no_rekening || "-",
              created_at: moment(record.tanggal_dibuat, "DD/MM/YYYY").toDate(),
            },
          });
          return true;
        },
        {
          // Opsi untuk memperpanjang napas transaksi (Satuan Milliseconds)
          timeout: 60000 * 10, // 60 Detik (Sangat cukup untuk ratusan data baris)
        },
      );
    }

    res.status(200).json({
      message: "Data berhasil diimport!",
      total_data: jsonData.length,
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

async function generateId() {
  const prefix = "SID";
  const padLength = 4;
  const lastRecord = await prisma.submission.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
async function generateDebiturId() {
  const prefix = "DEBT";
  const padLength = 4;
  const lastRecord = await prisma.debitur.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}

async function generateSubTypeId() {
  const prefix = "STYPE";
  const padLength = 2;
  const lastRecord = await prisma.submissionType.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}

async function generateProdTypeId() {
  const prefix = "PTYPE";
  const padLength = 2;
  const lastRecord = await prisma.productType.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}

async function generateUsrId() {
  const prefix = "USR";
  const padLength = 3;
  const lastRecord = await prisma.user.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}

async function generateMitraId() {
  const prefix = "MITRA";
  const padLength = 2;
  const lastRecord = await prisma.mitra.count();
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}

async function generateKbyId() {
  const prefix = "PAYOF";
  const padLength = 2;
  const lastRecord = await prisma.payOffice.count();
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}

async function generateInscId() {
  const prefix = "INSC";
  const padLength = 2;
  const lastRecord = await prisma.insurance.count();
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
