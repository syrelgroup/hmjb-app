import {} from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import bcrypt from "bcryptjs";
export const GET = async (req, res, next) => {
    let { page = 1, limit = 50, search, roleId, positionId } = req.query;
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;
    try {
        const querywhere = {
            status: true,
            ...(search && { fullname: { contains: search } }),
            ...(roleId && { roleId: roleId }),
            ...(positionId && { positionId: positionId }),
            ...(req.user?.Role.data_status === "USER" && { id: req.user.id }),
        };
        const data = await prisma.user.findMany({
            where: querywhere,
            skip: skip,
            take: limit,
            include: {
                Role: true,
                Position: true,
                UserCost: true,
                Absence: true,
            },
        });
        const total = await prisma.user.count({
            where: querywhere,
        });
        return ResponseServer(res, 200, {
            msg: "GET /user",
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
    const { id, UserCost, Absence, Position, Role, PermitAbsence, ...usersaved } = body;
    try {
        const genId = await generateId();
        const hashed = await bcrypt.hash(usersaved.password, 10);
        const saved = await prisma.user.create({
            data: {
                ...usersaved,
                password: hashed,
                id: body.id && body.id !== "" ? body.id : genId,
            },
        });
        if (UserCost && UserCost.length !== 0) {
            await prisma.userCost.createMany({
                data: UserCost.map((p) => {
                    return { ...p, userId: saved.id };
                }),
            });
        }
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
    const { UserCost, Absence, Position, Role, PermitAbsence, ...usersaved } = body;
    try {
        if (!id)
            return ResponseServer(res, 404, {
                msg: "ID Not found",
                params: req.params,
            });
        const find = await prisma.user.findFirst({ where: { id: id } });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        const hashed = await bcrypt.hash(usersaved.password, 10);
        const saved = await prisma.user.update({
            where: { id: find.id },
            data: {
                ...usersaved,
                password: usersaved.password.length < 20 ? hashed : find.password,
                updated_at: new Date(),
            },
        });
        if (UserCost && UserCost.length !== 0) {
            for (const p of UserCost) {
                await prisma.userCost.upsert({
                    where: { id: p.id },
                    update: { ...p, userId: saved.id },
                    create: { ...p, userId: saved.id },
                });
            }
        }
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
        const find = await prisma.user.findFirst({ where: { id: id } });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        await prisma.user.update({
            where: { id: find.id },
            data: { status: false, updated_at: new Date() },
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
    const { id } = req.query;
    if (!id)
        return ResponseServer(res, 404, { msg: "Not found data" });
    try {
        const find = await prisma.userCost.findFirst({
            where: { id: id },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        await prisma.userCost.update({
            where: { id: id },
            data: { end_at: new Date() },
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
export const UPDATE_FACE = async (req, res, next) => {
    const { face } = req.body;
    const userId = req.user?.id; // Assuming user is set by auth middleware
    if (!userId) {
        return ResponseServer(res, 401, { msg: "Unauthorized" });
    }
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { face, updated_at: new Date() },
        });
        return ResponseServer(res, 200, { msg: "Face data berhasil diupdate" });
    }
    catch (err) {
        console.log(err);
        return ResponseServer(res, 500, {
            msg: err.message || "Internal Server Error",
        });
    }
};
async function generateId() {
    const prefix = "USR";
    const padLength = 3;
    const lastRecord = await prisma.user.count({});
    return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
