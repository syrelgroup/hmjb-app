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

export const DashboardCallreport = async (req: Request, res: Response) => {
  const [visit, visit_plan, tagihan] = await prisma.$transaction([
    prisma.visit.findMany({
      where: { status: true, date_action: { not: null } },
      include: { VisitCategory: true, VisitStatus: true, VisitPurpose: true },
    }),
    prisma.visit.findMany({
      where: { status: true, date_action: null },
      include: { VisitCategory: true, VisitStatus: true, VisitPurpose: true },
    }),
    prisma.billing.findMany({ where: { status: true } }),
  ]);

  return ResponseServer(res, 200, { visit, visit_plan, tagihan });
};

export const DashboardAbsensi = async (req: Request, res: Response) => {
  const [users, deduction, insentif, permit] = await prisma.$transaction([
    prisma.user.findMany({
      where: { status: true },
      include: {
        Absence: true,
        UserCost: true,
      },
    }),
    prisma.deduction.findMany({ where: { status: true } }),
    prisma.insentif.findMany({ where: { status: true } }),
    prisma.permitAbsence.findMany({ where: { status: true } }),
  ]);

  return ResponseServer(res, 200, { users, deduction, insentif, permit });
};

export const DashboardEarsip = async (req: Request, res: Response) => {
  const [
    debitur,
    submission,
    producttype,
    mitra,
    asuransi,
    payoffice,
    collending,
  ] = await prisma.$transaction([
    prisma.debitur.findMany({
      where: { status: true },
      include: { SubmissionType: true },
    }),
    prisma.submission.findMany({
      where: { status: true },
      include: { Files: true },
    }),
    prisma.productType.findMany({
      where: { status: true },
      include: {
        Product: { include: { Submission: true } },
        ProductTypeFile: true,
      },
    }),
    prisma.mitra.findMany({
      where: { status: true },
      include: { Submission: true },
    }),
    prisma.insurance.findMany({
      where: { status: true },
      include: { Submission: true },
    }),
    prisma.payOffice.findMany({
      where: { status: true },
      include: { Submission: true },
    }),
    prisma.collateralLending.findMany({
      where: { status: true },
      include: { Submission: true },
    }),
  ]);

  return ResponseServer(res, 200, {
    debitur,
    submission,
    producttype,
    mitra,
    asuransi,
    payoffice,
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
