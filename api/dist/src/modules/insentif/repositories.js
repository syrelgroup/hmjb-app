import moment from "moment";
import prisma from "../../libs/prisma.js";
import { ResponseServer } from "../../libs/util.js";
export const GET = async (req, res, next) => {
    let { page = 1, limit = 50, search, backdate, approve_status } = req.query;
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;
    const where = {
        status: true,
        ...(search && {
            OR: [
                { name: { contains: search } },
                {
                    User: {
                        OR: [
                            { fullname: { contains: search } },
                            { email: { contains: search } },
                            { phone: { contains: search } },
                            { username: { contains: search } },
                            { nik: { contains: search } },
                            { nip: { contains: search } },
                            { username: { contains: search } },
                        ],
                    },
                },
            ],
        }),
        ...(backdate && {
            created_at: {
                gte: moment(backdate.split(",")[0])
                    .startOf("day")
                    .toDate(),
                lte: moment(backdate.split(",")[1])
                    .endOf("day")
                    .toDate(),
            },
        }),
        ...(approve_status && { approve_status: approve_status }),
    };
    const [data, total] = await Promise.all([
        prisma.insentif.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: "desc" },
            include: {
                User: true,
                ApproverBy: true,
            },
        }),
        prisma.insentif.count({ where }),
    ]);
    return ResponseServer(res, 200, {
        msg: "GET /insentif",
        page,
        limit,
        search,
        approve_status,
        backdate,
        data,
        total,
    });
};
export const POST = async (req, res, next) => {
    let body = req.body;
    try {
        const { id, User, ApproverBy, ...saved } = body;
        const genId = await generateId();
        await prisma.insentif.create({ data: { ...saved, id: genId } });
        return ResponseServer(res, 201, {
            msg: "Insentif created successfully",
        });
    }
    catch (err) {
        console.log(err);
        return ResponseServer(res, 500, {
            msg: "Error creating insentif",
            error: err instanceof Error ? err.message : String(err),
        });
    }
};
export const PUT = async (req, res, next) => {
    let body = req.body;
    try {
        const { id, User, ApproverBy, ...saved } = body;
        await prisma.insentif.update({ where: { id }, data: { ...saved } });
        return ResponseServer(res, 200, {
            msg: "Insentif updated successfully",
        });
    }
    catch (err) {
        console.log(err);
        return ResponseServer(res, 500, {
            msg: "Error updating insentif",
            error: err instanceof Error ? err.message : String(err),
        });
    }
};
export const DELETE = async (req, res, next) => {
    let { id } = req.query;
    try {
        await prisma.insentif.update({
            where: { id: id },
            data: { status: false },
        });
        return ResponseServer(res, 200, {
            msg: "Insentif berhasil dihapus",
        });
    }
    catch (err) {
        console.log(err);
        return ResponseServer(res, 500, {
            msg: "Gagal hapus data insentif. Internal server error!",
            error: err instanceof Error ? err.message : String(err),
        });
    }
};
async function generateId() {
    const prefix = "INSC";
    const padLength = 4;
    const lastRecord = await prisma.insentif.count({});
    return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
