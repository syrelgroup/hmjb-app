import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
import type { Prisma } from "@prisma/client";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let { page = 1, limit = 50, search, month } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.UserWhereInput = {
      status: true,
      ...(search && {
        OR: [
          { fullname: { contains: search as string } },
          { nik: { contains: search as string } },
          { nip: { contains: search as string } },
          { phone: { contains: search as string } },
          { email: { contains: search as string } },
          { id: { contains: search as string } },
          { username: { contains: search as string } },
        ],
      }),
    };

    const data = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      include: {
        PermitAbsence: {
          where: {
            ...(month
              ? {
                  created_at: {
                    gte: moment(month as string)
                      .startOf("month")
                      .toDate(),
                    lte: moment(month as string)
                      .endOf("month")
                      .toDate(),
                  },
                }
              : {
                  created_at: {
                    gte: moment().startOf("month").toDate(),
                    lte: moment().endOf("month").toDate(),
                  },
                }),
            status: true,
          },
        },
        Absence: {
          where: {
            ...(month
              ? {
                  created_at: {
                    gte: moment(month as string)
                      .startOf("month")
                      .toDate(),
                    lte: moment(month as string)
                      .endOf("month")
                      .toDate(),
                  },
                }
              : {
                  created_at: {
                    gte: moment().startOf("month").toDate(),
                    lte: moment().endOf("month").toDate(),
                  },
                }),
          },
        },
        UserCost: {
          where: {
            ...(month
              ? {
                  OR: [
                    {
                      start_at: {
                        lte: moment(month as string)
                          .endOf("month")
                          .toDate(),
                      },
                      end_at: {
                        gte: moment(month as string)
                          .startOf("month")
                          .toDate(),
                      },
                    },
                    {
                      start_at: {
                        lte: moment(month as string)
                          .endOf("month")
                          .toDate(),
                      },
                      end_at: null,
                    },
                  ],
                }
              : {}),
          },
        },
        Insentif: {
          where: {
            ...(month
              ? {
                  created_at: {
                    gte: moment(month as string)
                      .startOf("month")
                      .toDate(),
                    lte: moment(month as string)
                      .endOf("month")
                      .toDate(),
                  },
                }
              : {
                  created_at: {
                    gte: moment().startOf("month").toDate(),
                    lte: moment().endOf("month").toDate(),
                  },
                }),
            status: true,
            approve_status: "DISETUJUI",
          },
        },
      },
    });

    const total = await prisma.user.count({ where });
    return ResponseServer(res, 200, {
      msg: "GET /absence",
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

export const DELETE = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let { id } = req.query;

  try {
    if (!id) return ResponseServer(res, 404, { msg: "Not found data" });
    const find = await prisma.absence.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    await prisma.$transaction(async (tx) => {
      await tx.absence.delete({ where: { id: find.id } });
    });

    return ResponseServer(res, 200, { msg: "Data berhasil dihapus" });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};
