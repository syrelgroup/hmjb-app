import {} from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
export const GET = async (req, res, next) => {
    let { page = 1, limit = 50, search } = req.query;
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;
    try {
        const data = await prisma.insurance.findMany({
            where: {
                status: true,
                ...(search && { name: { contains: search } }),
            },
            skip: skip,
            take: limit,
            include: { Submission: true },
            orderBy: { id: "asc" },
        });
        const total = await prisma.insurance.count({
            where: {
                status: true,
                ...(search && { name: { contains: search } }),
            },
        });
        return ResponseServer(res, 200, {
            msg: "GET /insurance",
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
export const POST = async (req, res, next) => {
    let body = req.body;
    try {
        const genId = await generateId();
        const { id, Submission, ...saved } = body;
        await prisma.insurance.create({
            data: {
                ...saved,
                id: body.id && body.id !== "" ? body.id : genId,
            },
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
        const find = await prisma.insurance.findFirst({
            where: { id: id },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        const { Submission, ...saved } = body;
        await prisma.insurance.update({
            where: { id: find.id },
            data: {
                ...saved,
                updated_at: new Date(),
            },
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
        const find = await prisma.insurance.findFirst({
            where: { id: id },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        await prisma.insurance.update({
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
async function generateId() {
    const prefix = "INSC";
    const padLength = 2;
    const lastRecord = await prisma.insurance.count();
    return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
