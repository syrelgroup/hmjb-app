import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import type { Prisma } from "@prisma/client";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let { page = 1, limit = 50, search, submissionTypeId } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const querywhere: Prisma.DebiturWhereInput = {
      status: true,
      ...(search && {
        OR: [
          { fullname: { contains: search as string } },
          { cif: { contains: search as string } },
          { nik: { contains: search as string } },
          { id: { contains: search as string } },
        ],
      }),
      ...(submissionTypeId && {
        submissionTypeId: submissionTypeId as string,
      }),
    };
    const data = await prisma.debitur.findMany({
      where: querywhere,
      skip: skip,
      take: limit,
      include: {
        SubmissionType: true,
        Submission: {
          where: {
            status: true,
            ...(req.user?.Role.data_status === "USER"
              ? { userId: req.user?.id }
              : {}),
          },
          include: { Product: { include: { ProductType: true } }, Mitra: true },
        },
        Visit: {
          where: {
            status: true,
            ...(req.user?.Role.data_status === "USER"
              ? { userId: req.user?.id }
              : {}),
          },
          include: {
            VisitCategory: true,
            VisitStatus: true,
            VisitPurpose: true,
          },
        },
      },
    });

    const total = await prisma.debitur.count({
      where: querywhere,
    });
    return ResponseServer(res, 200, {
      msg: "GET /debitur",
      page,
      limit,
      search,
      data,
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
    const { id, SubmissionType, Submissions, Visit, ...saved } = body;
    const genId = await generateId();
    await prisma.debitur.create({
      data: {
        ...saved,
        id: body.id && body.id !== "" ? body.id : genId,
      },
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
    const find = await prisma.debitur.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });
    const { SubmissionType, Submissions, Visit, ...saved } = body;

    await prisma.debitur.update({
      where: { id: find.id },
      data: {
        ...saved,
        updated_at: new Date(),
      },
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
    const find = await prisma.debitur.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    await prisma.debitur.update({
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
    const find = await prisma.debitur.findFirst({
      where: {
        OR: [
          { id: id as string },
          { nik: id as string },
          { cif: id as string },
          { fullname: id as string },
        ],
      },
      include: {
        SubmissionType: true,
        Submission: {
          include: { Product: { include: { ProductType: true } } },
        },
        Visit: true,
      },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    return ResponseServer(res, 200, { msg: "OK", data: find });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

async function generateId() {
  const prefix = "DEB";
  const padLength = 4;
  const lastRecord = await prisma.debitur.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
