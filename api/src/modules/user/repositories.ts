import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import type { Prisma, UserCost } from "@prisma/client";
import bcrypt from "bcryptjs";

export const GET = async (req: Request, res: Response, next: NextFunction) => {
  let { page = 1, limit = 50, search, roleId, positionId } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const querywhere: Prisma.UserWhereInput = {
      status: true,
      ...(search && { fullname: { contains: search as string } }),
      ...(roleId && { roleId: roleId as string }),
      ...(positionId && { positionId: positionId as string }),
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
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

export const POST = async (req: Request, res: Response, next: NextFunction) => {
  let body = req.body;
  const {
    id,
    UserCost,
    Absence,
    Position,
    Role,
    PermitAbsence,
    Insentif,
    ...usersaved
  } = body;
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
        data: UserCost.map((p: UserCost) => {
          return { ...p, userId: saved.id };
        }),
      });
    }
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
  const {
    UserCost,
    Absence,
    Position,
    Role,
    PermitAbsence,
    Insentif,
    ...usersaved
  } = body;

  try {
    if (!id)
      return ResponseServer(res, 404, {
        msg: "ID Not found",
        params: req.params,
      });
    const find = await prisma.user.findFirst({ where: { id: id as string } });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });
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
    const find = await prisma.user.findFirst({ where: { id: id as string } });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });

    await prisma.user.update({
      where: { id: find.id },
      data: { status: false, updated_at: new Date() },
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
  const { id } = req.query;

  if (!id) return ResponseServer(res, 404, { msg: "Not found data" });
  try {
    const find = await prisma.userCost.findFirst({
      where: { id: id as string },
    });
    if (!find) return ResponseServer(res, 404, { msg: "Not found data" });
    await prisma.userCost.update({
      where: { id: id as string },
      data: { end_at: new Date() },
    });
    return ResponseServer(res, 200, { msg: "Data berhasil dihapus" });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

export const UPDATE_FACE = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { face } = req.body;
  const userId = (req as any).user?.id; // Assuming user is set by auth middleware

  if (!userId) {
    return ResponseServer(res, 401, { msg: "Unauthorized" });
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { face, updated_at: new Date() },
    });

    return ResponseServer(res, 200, { msg: "Face data berhasil diupdate" });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, {
      msg: (err as any).message || "Internal Server Error",
    });
  }
};

async function generateId() {
  const prefix = "USR";
  const padLength = 3;
  const lastRecord = await prisma.user.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
