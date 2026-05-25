import {} from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
export const GET = async (req, res, next) => {
    let { page = 1, limit = 50, search, visitCategoryId, visitStatusId, visitPurposeId, approve_status, submissionTypeId, mitraId, backdate, plan, } = req.query;
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;
    try {
        const querywhere = {
            status: true,
            ...(search && {
                OR: [
                    { id: { contains: search } },
                    {
                        Debitur: {
                            OR: [
                                { fullname: { contains: search } },
                                { cif: { contains: search } },
                                { nik: { contains: search } },
                                { id: { contains: search } },
                            ],
                        },
                    },
                ],
            }),
            ...(visitCategoryId && { visitCategoryId: visitCategoryId }),
            ...(mitraId && { mitraId: mitraId }),
            ...(visitStatusId && { visitStatusId: visitStatusId }),
            ...(visitPurposeId && { visitPurposeId: visitPurposeId }),
            ...(approve_status && {
                approve_status: approve_status,
            }),
            ...(req.user?.Role.data_status === "USER"
                ? { userId: req.user?.id }
                : {}),
            ...(submissionTypeId && {
                Debitur: {
                    submissionTypeId: submissionTypeId,
                },
            }),
            date_action: plan ? null : { not: null },
            ...(backdate && {
                created_at: {
                    gte: moment(backdate.split(",")[0])
                        .startOf("date")
                        .toDate(),
                    lte: moment(backdate.split(",")[1])
                        .endOf("day")
                        .toDate(),
                },
            }),
        };
        const data = await prisma.visit.findMany({
            where: querywhere,
            include: {
                Debitur: { include: { SubmissionType: true } },
                VisitCategory: true,
                VisitStatus: true,
                VisitPurpose: true,
                User: true,
                Mitra: true,
            },
            skip: skip,
            take: limit,
        });
        const total = await prisma.visit.count({
            where: querywhere,
        });
        return ResponseServer(res, 200, {
            msg: "GET /visit",
            page,
            limit,
            search,
            data: data.map((item) => ({
                ...item,
                files: JSON.parse(item.files || "[]"),
                coments: JSON.parse(item.coments || "[]"),
            })),
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
export const POST = async (req, res, next) => {
    let body = req.body;
    try {
        const { id, VisitCategory, VisitStatus, VisitPurpose, User, Debitur, Submission, Mitra, ...saved } = body;
        const genId = await generateId();
        const genDebId = await generateDebiturId();
        Debitur.id = Debitur.id ? Debitur.id : genDebId;
        await prisma.$transaction(async (tx) => {
            const { SubmissionType, Visit, Submission, ...savedeb } = Debitur;
            const deb = await tx.debitur.upsert({
                where: { id: Debitur.id },
                update: { ...savedeb },
                create: { ...savedeb },
            });
            await tx.visit.create({
                data: {
                    ...saved,
                    coments: JSON.stringify(saved.coments || []),
                    files: JSON.stringify(saved.files || []),
                    id: body.id && body.id !== "" ? body.id : genId,
                    debiturId: deb.id,
                },
            });
        });
        return ResponseServer(res, 200, { msg: "Data berhasil ditambahkan" });
    }
    catch (err) {
        console.log(err);
        return ResponseServer(res, 500, {
            msg: err.message || "Internal Server Error",
        });
    }
};
export const PUT = async (req, res, next) => {
    let { id } = req.query;
    let body = req.body;
    try {
        if (!id)
            return ResponseServer(res, 404, {
                msg: "ID Not found",
                params: req.params,
            });
        const find = await prisma.visit.findFirst({
            where: { id: id },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        const { VisitCategory, VisitStatus, VisitPurpose, User, Debitur, Mitra, ...saved } = body;
        await prisma.$transaction(async (tx) => {
            const { SubmissionType, Visit, Submission, ...savedeb } = Debitur;
            const deb = await tx.debitur.update({
                where: { id: Debitur.id },
                data: savedeb,
            });
            await tx.visit.update({
                where: { id: find.id },
                data: {
                    ...saved,
                    coments: JSON.stringify(body.coments || []),
                    files: JSON.stringify(body.files || []),
                    updated_at: new Date(),
                    debiturId: deb.id,
                },
            });
        });
        return ResponseServer(res, 200, { msg: "Data berhasil dirubah" });
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
        const find = await prisma.visit.findFirst({
            where: { id: id },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        await prisma.visit.update({
            where: { id: find.id },
            data: { status: false },
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
export const PATCH = async (req, res, next) => {
    let { id } = req.query;
    try {
        if (!id)
            return ResponseServer(res, 404, { msg: "Not found data" });
        const find = await prisma.visit.findFirst({
            where: { id: id },
            include: {
                Debitur: {
                    include: {
                        SubmissionType: true,
                        Submission: {
                            include: { Product: { include: { ProductType: true } } },
                        },
                    },
                },
                VisitCategory: true,
                VisitStatus: true,
                VisitPurpose: true,
                User: true,
            },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        find.coments = JSON.parse(find.coments || "[]");
        find.files = JSON.parse(find.files || "[]");
        return ResponseServer(res, 200, { msg: "OK", data: find });
    }
    catch (err) {
        console.log(err);
        return ResponseServer(res, 500, {
            msg: err.message || "Internal Server Error",
        });
    }
};
async function generateId() {
    const prefix = "VID";
    const padLength = 4;
    const lastRecord = await prisma.visit.count({});
    return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
async function generateDebiturId() {
    const prefix = "DEBT";
    const padLength = 4;
    const lastRecord = await prisma.debitur.count({});
    return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
