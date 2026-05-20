import {} from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
export const GET = async (req, res, next) => {
    let { page = 1, limit = 50, search, month } = req.query;
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;
    try {
        const where = {
            status: true,
            ...(search && {
                OR: [
                    { fullname: { contains: search } },
                    { nik: { contains: search } },
                    { nip: { contains: search } },
                    { phone: { contains: search } },
                    { email: { contains: search } },
                    { id: { contains: search } },
                    { username: { contains: search } },
                ],
            }),
            ...(req.user?.Role.data_status === "USER" && { id: req.user.id }),
        };
        const data = await prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: "desc" },
            include: {
                Position: true,
                PermitAbsence: {
                    where: {
                        ...(month
                            ? {
                                created_at: {
                                    gte: moment(month)
                                        .subtract(1, "month")
                                        .set("date", 21)
                                        .startOf("day")
                                        .toDate(),
                                    lte: moment(month)
                                        .set("date", 20)
                                        .endOf("day")
                                        .toDate(),
                                },
                            }
                            : {
                                created_at: {
                                    gte: moment().set("date", 21).startOf("day").toDate(),
                                    lte: moment().set("date", 20).endOf("day").toDate(),
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
                                    gte: moment(month)
                                        .subtract(1, "month")
                                        .set("date", 21)
                                        .startOf("day")
                                        .toDate(),
                                    lte: moment(month)
                                        .set("date", 20)
                                        .endOf("day")
                                        .toDate(),
                                },
                            }
                            : {
                                created_at: {
                                    gte: moment()
                                        .subtract(1, "month")
                                        .set("date", 21)
                                        .startOf("day")
                                        .toDate(),
                                    lte: moment().set("date", 20).endOf("day").toDate(),
                                },
                            }),
                    },
                },
                UserCost: {
                    where: {
                        end_at: null,
                    },
                },
                Insentif: {
                    where: {
                        ...(month
                            ? {
                                created_at: {
                                    gte: moment(month)
                                        .subtract(1, "month")
                                        .set("date", 21)
                                        .startOf("day")
                                        .toDate(),
                                    lte: moment(month)
                                        .set("date", 20)
                                        .endOf("day")
                                        .toDate(),
                                },
                            }
                            : {
                                created_at: {
                                    gte: moment()
                                        .subtract(1, "month")
                                        .set("date", 21)
                                        .startOf("day")
                                        .toDate(),
                                    lte: moment().set("date", 20).endOf("day").toDate(),
                                },
                            }),
                        status: true,
                        approve_status: "DISETUJUI",
                    },
                },
                Deduction: {
                    where: {
                        ...(month
                            ? {
                                created_at: {
                                    gte: moment(month)
                                        .subtract(1, "month")
                                        .set("date", 21)
                                        .startOf("day")
                                        .toDate(),
                                    lte: moment(month)
                                        .set("date", 20)
                                        .endOf("day")
                                        .toDate(),
                                },
                            }
                            : {
                                created_at: {
                                    gte: moment()
                                        .subtract(1, "month")
                                        .set("date", 21)
                                        .startOf("day")
                                        .toDate(),
                                    lte: moment().set("date", 20).endOf("day").toDate(),
                                },
                            }),
                        status: true,
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
    }
    catch (err) {
        console.log(err);
        return ResponseServer(res, 500, {
            msg: err.message || "Internal Server Error",
        });
    }
};
export const DELETE = async (req, res, next) => {
    let { id } = req.query;
    try {
        if (!id)
            return ResponseServer(res, 404, { msg: "Not found data" });
        const find = await prisma.absence.findFirst({
            where: { id: id },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        await prisma.$transaction(async (tx) => {
            await tx.absence.delete({ where: { id: find.id } });
        });
        return ResponseServer(res, 200, { msg: "Data berhasil dihapus" });
    }
    catch (err) {
        console.log(err);
        return ResponseServer(res, 500, {
            msg: err.message || "Internal Server Error",
        });
    }
};
