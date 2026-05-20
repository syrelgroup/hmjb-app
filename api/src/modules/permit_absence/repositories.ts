import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
import type {
  Absence,
  EAbsenceStatus,
  EPermitStatus,
  Prisma,
} from "@prisma/client";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let {
    page = 1,
    limit = 50,
    search,
    backdate,
    permit_status,
    type,
  } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.PermitAbsenceWhereInput = {
      ...(backdate && {
        created_at: {
          gte: moment((backdate as string).split(",")[0] as string)
            .startOf("day")
            .toDate(),
          lte: moment((backdate as string).split(",")[1] as string)
            .endOf("day")
            .toDate(),
        },
      }),
      ...(req.user?.Role.data_status === "USER" && { userId: req.user.id }),
      ...(permit_status && { permit_status: permit_status as EPermitStatus }),
      ...(type && { type: type as EAbsenceStatus }),
      ...(search && {
        User: {
          OR: [
            { fullname: { contains: search as string } },
            { nik: { contains: search as string } },
            { nip: { contains: search as string } },
            { phone: { contains: search as string } },
            { email: { contains: search as string } },
            { id: { contains: search as string } },
            { username: { contains: search as string } },
          ],
        },
      }),
    };

    const data = await prisma.permitAbsence.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      include: {
        ApproverBy: true,
        User: true,
      },
    });

    const total = await prisma.permitAbsence.count({ where });
    return ResponseServer(res, 200, {
      msg: "GET /absence",
      page,
      limit,
      search,
      backdate,
      permit_status,
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
    const { id, User, ApproverBy, ...saved } = body;
    const genId = await generateId();
    await prisma.permitAbsence.create({
      data: { ...saved, id: genId },
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
  let body = req.body;

  try {
    if (!body.id)
      return ResponseServer(res, 404, {
        msg: "ID Not found",
        params: req.params,
      });

    const {
      id,
      User,
      Absence,
      late_deduction,
      fast_leave_deduction,
      lemburan,
      ApproverBy,
      ...saved
    } = body;

    await prisma.$transaction(async (tx) => {
      if (saved.permit_status === "DISETUJUI") {
        if (
          body.end_date &&
          !moment(body.end_date).isSame(moment(), "day") &&
          !moment(body.start_date).isSame(moment(), "day")
        ) {
          let datesToInsert: Absence[] = [];
          let currentDate = moment(body.start_date);

          while (currentDate.isSameOrBefore(moment(body.end_date), "day")) {
            datesToInsert.push({
              check_in: moment(currentDate)
                .hour(8)
                .minute(0)
                .second(0)
                .toDate(),
              check_out: moment(currentDate)
                .hour(17)
                .minute(0)
                .second(0)
                .toDate(),
              absence_status: body.type as EAbsenceStatus,
              late_deduction: Absence.late_deduction || 0,
              fast_leave_deduction: Absence.fast_leave_deduction || 0,
              lemburan: Absence.lemburan || 0,
              alpha_deduction: Absence.alpha_deduction || 0,
              userId: body.userId,
              status: true,
              created_at: new Date(),
              updated_at: new Date(),
              geo_in_lat: null,
              geo_in_long: null,
              geo_out_lat: null,
              geo_out_long: null,
              description: body.type,
              id: "",
              method: "BUTTON",
            });
            currentDate.add(1, "days");
          }
          await tx.absence.createMany({
            data: datesToInsert.map(({ id, ...rest }) => rest),
          });
        } else {
          const { id: absId, User, ...abs } = Absence;
          await tx.absence.upsert({
            where: {
              id: Absence.id,
            },
            update: abs,
            create: abs,
          });
        }
      }
      await prisma.permitAbsence.update({
        where: { id: id as string },
        data: saved,
      });
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
    if (!id)
      return ResponseServer(res, 404, { msg: "Bad Request. ID not found" });
    const find = await prisma.permitAbsence.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Data tidak ditemukan" });

    await prisma.$transaction(async (tx) => {
      await tx.permitAbsence.deleteMany({ where: { id: id as string } });
    });

    return ResponseServer(res, 200, { msg: "Data berhasil dihapus" });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

async function generateId() {
  const prefix = "PMT";
  const padLength = 3;
  const lastRecord = await prisma.permitAbsence.count();
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
