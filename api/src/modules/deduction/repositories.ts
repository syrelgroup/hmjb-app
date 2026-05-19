import type { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import moment from "moment";
import prisma from "../../libs/prisma.js";
import { ResponseServer } from "../../libs/util.js";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let { page = 1, limit = 50, search, backdate } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  const where: Prisma.DeductionWhereInput = {
    status: true,
    ...(search && {
      OR: [
        { name: { contains: search as string } },
        {
          User: {
            OR: [
              { fullname: { contains: search as string } },
              { email: { contains: search as string } },
              { phone: { contains: search as string } },
              { username: { contains: search as string } },
              { nik: { contains: search as string } },
              { nip: { contains: search as string } },
              { username: { contains: search as string } },
            ],
          },
        },
      ],
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
  };

  const [data, total] = await Promise.all([
    prisma.deduction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      include: {
        User: true,
        CreatedBy: true,
      },
    }),
    prisma.deduction.count({ where }),
  ]);

  return ResponseServer(res, 200, {
    msg: "GET /deduction",
    page,
    limit,
    search,
    backdate,
    data,
    total,
  });
};

export const POST = async (req: Request, res: Response, next: NextFunction) => {
  let body = req.body;
  try {
    const { id, User, CreatedBy, ...saved } = body;
    const genId = await generateId();
    await prisma.deduction.create({ data: { ...saved, id: genId } });

    return ResponseServer(res, 201, {
      msg: "Deduction created successfully",
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: "Error creating deduction",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

export const PUT = async (req: Request, res: Response, next: NextFunction) => {
  let body = req.body;
  try {
    const { id, User, CreateBy, ...saved } = body;
    await prisma.deduction.update({ where: { id }, data: { ...saved } });

    return ResponseServer(res, 200, {
      msg: "Deduction updated successfully",
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: "Error updating deduction",
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
    await prisma.deduction.update({
      where: { id: id as string },
      data: { status: false },
    });
    return ResponseServer(res, 200, {
      msg: "Potongan berhasil dihapus",
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: "Gagal hapus data potongan. Internal server error!",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

async function generateId() {
  const prefix = "DDC";
  const padLength = 4;
  const lastRecord = await prisma.deduction.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
