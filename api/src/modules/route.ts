import { type Response, type Request, type NextFunction } from "express";
import { ResponseServer } from "../libs/util.js";
import prisma from "../libs/prisma.js";

export const MainDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const [submissionType, productType, visitCategory, visitStatus] =
    await prisma.$transaction([
      prisma.submissionType.findMany({
        where: {
          status: true,
        },
        include: { Debitur: true },
      }),
      prisma.productType.findMany({
        where: {
          status: true,
        },
        include: {
          Product: {
            include: {
              Submission: {
                where: {
                  status: true,
                  ...(req.user?.Role.data_status === "USER"
                    ? { userId: req.user?.id }
                    : {}),
                },
              },
            },
          },
          ProductTypeFile: {
            include: { Files: { where: { submissionId: { not: null } } } },
            where: { status: true },
          },
        },
      }),
      prisma.visitCategory.findMany({
        where: { status: true },
        include: {
          Visit: {
            where: {
              status: true,
              ...(req.user?.Role.data_status === "USER"
                ? { userId: req.user?.id }
                : {}),
            },
          },
        },
      }),
      prisma.visitStatus.findMany({
        where: { status: true },
        include: {
          Visit: {
            where: {
              status: true,
              ...(req.user?.Role.data_status === "USER"
                ? { userId: req.user?.id }
                : {}),
            },
          },
        },
      }),
    ]);
  return ResponseServer(res, 200, {
    submissionType,
    productType,
    visitCategory,
    visitStatus,
  });
};

export const GET_HOLIDAY = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let { year } = req.query;
  const responseApi = await fetch(
    `https://api-hari-libur.vercel.app/api?year=${year}`,
  );
  const data = await responseApi.json();
  return ResponseServer(res, 200, {
    data: data.data,
  });
};
