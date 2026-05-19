import type { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import moment from "moment";
import prisma from "../../libs/prisma.js";
import { ResponseServer } from "../../libs/util.js";
import xlsx from "xlsx";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let { page = 1, limit = 50, search, backdate } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  const where: Prisma.BillingWhereInput = {
    status: true,
    ...(search && {
      OR: [
        { name: { contains: search as string } },
        {
          Debitur: {
            OR: [
              { id: { contains: search as string } },
              { cif: { contains: search as string } },
              { fullname: { contains: search as string } },
              { email: { contains: search as string } },
              { phone: { contains: search as string } },
              { nik: { contains: search as string } },
            ],
          },
        },
      ],
    }),
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
      skip,
      take: limit,
      orderBy: { bill_date: "desc" },
      include: {
        Debitur: true,
      },
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

export const POST = async (req: Request, res: Response, next: NextFunction) => {
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
      const record = {
        cif: String((data as any).cif),
        nik: String((data as any).nik),
        nama: String((data as any).nama),
        nominal_tagihan: (data as any).nominal_tagihan
          ? parseInt((data as any).nominal_tagihan || "0")
          : 0,
        nominal_realisasi: (data as any).nominal_realisasi
          ? parseInt((data as any).nominal_realisasi || "0")
          : 0,
        tanggal_tagih: (data as any).tanggal_tagih
          ? moment((data as any).tanggal_tagih, "DD/MM/YYYY").toDate()
          : new Date(),
        tanggal_tertagih: (data as any).tanggal_tagih
          ? moment((data as any).tanggal_tagih, "DD/MM/YYYY").toDate()
          : null,
      };

      await prisma.$transaction(
        async (tx) => {
          let deb = await tx.debitur.findFirst({
            where: {
              OR: [
                { fullname: record.nama },
                { cif: record.cif },
                { nik: record.nik },
              ],
            },
          });
          const genId = await generateId();
          await tx.billing.create({
            data: {
              id: genId,
              name: record.nama,
              bill_date: record.tanggal_tagih,
              paid_date: record.tanggal_tertagih,
              value: record.nominal_tagihan,
              realize_value: record.nominal_realisasi,
              debiturId: deb?.id,
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

    const { Debitur, ...saved } = body;
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

async function generateId() {
  const prefix = "BIL";
  const padLength = 4;
  const lastRecord = await prisma.billing.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
