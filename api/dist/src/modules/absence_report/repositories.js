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
                PermitAbsence: {
                    where: {
                        ...(month
                            ? {
                                created_at: {
                                    gte: moment(month)
                                        .startOf("month")
                                        .toDate(),
                                    lte: moment(month)
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
                                    gte: moment(month)
                                        .startOf("month")
                                        .toDate(),
                                    lte: moment(month)
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
                                            lte: moment(month)
                                                .endOf("month")
                                                .toDate(),
                                        },
                                        end_at: {
                                            gte: moment(month)
                                                .startOf("month")
                                                .toDate(),
                                        },
                                    },
                                    {
                                        start_at: {
                                            lte: moment(month)
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
                                    gte: moment(month)
                                        .startOf("month")
                                        .toDate(),
                                    lte: moment(month)
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
