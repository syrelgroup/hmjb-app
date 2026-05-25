import {} from "express";
import { ResponseServer } from "../libs/util.js";
import prisma from "../libs/prisma.js";
import moment from "moment";
export const MainDashboard = async (req, res, next) => {
    const userQuery = req.user?.Role.data_status === "USER" ? { userId: req.user?.id } : {};
    const [submissionType, productType, visitCategory, visitStatus, visitPurpose,] = await prisma.$transaction([
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
                                ...userQuery,
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
                        ...userQuery,
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
                        ...userQuery,
                    },
                },
            },
        }),
        prisma.visitPurpose.findMany({
            where: { status: true },
            include: {
                Visit: {
                    where: {
                        status: true,
                        ...userQuery,
                    },
                },
            },
        }),
    ]);
    const allSubmissions = productType.flatMap((item) => item.Product.flatMap((product) => product.Submission ?? []));
    const allVisits = visitCategory.flatMap((item) => item.Visit ?? []);
    const totalValue = allSubmissions.reduce((acc, submission) => acc + (submission?.value || 0), 0);
    const summary = {
        totals: {
            debitur: submissionType.reduce((acc, item) => acc + (item.Debitur?.length || 0), 0),
            submissions: allSubmissions.length,
            visits: allVisits.length,
            value: totalValue,
            productTypes: productType.length,
            submissionTypes: submissionType.length,
            visitCategories: visitCategory.length,
            visitStatuses: visitStatus.length,
            approvedSubmissions: allSubmissions.filter((submission) => ["AKTIF", "LUNAS"].includes(submission?.approve_status ?? "")).length,
            pendingSubmissions: allSubmissions.filter((submission) => submission?.approve_status === "PENDING").length,
            rejectedSubmissions: allSubmissions.filter((submission) => ["PASIF", "BREAK"].includes(submission?.approve_status ?? "")).length,
            approvedVisits: allVisits.filter((visit) => visit.date_action !== null)
                .length,
            pendingVisits: allVisits.filter((visit) => visit.date_action === null)
                .length,
            rejectedVisits: 0,
            averageSubmissionValue: allSubmissions.length > 0
                ? Math.round(totalValue / allSubmissions.length)
                : 0,
        },
        breakdowns: {
            submissionType: submissionType.map((item) => ({
                id: item.id,
                name: item.name,
                count: item.Debitur?.length || 0,
            })),
            productType: productType.map((item) => {
                const submissions = item.Product.flatMap((product) => product.Submission ?? []);
                return {
                    id: item.id,
                    name: item.name,
                    submissionCount: submissions.length,
                    value: submissions.reduce((acc, submission) => acc + (submission?.value || 0), 0),
                };
            }),
            visitCategory: visitCategory.map((item) => ({
                id: item.id,
                name: item.name,
                count: item.Visit?.length || 0,
            })),
            visitStatus: visitStatus.map((item) => ({
                id: item.id,
                name: item.name,
                count: item.Visit?.length || 0,
            })),
            visitPurpose: visitPurpose.map((item) => ({
                id: item.id,
                name: item.name,
                count: item.Visit?.length || 0,
            })),
            fileCategory: productType
                .flatMap((item) => item.ProductTypeFile)
                .map((fileCategory) => ({
                id: fileCategory.id,
                name: fileCategory.name,
                count: fileCategory.Files?.length || 0,
            })),
        },
        topLists: {
            submissionType: submissionType
                .map((item) => ({
                id: item.id,
                name: item.name,
                count: item.Debitur?.length || 0,
            }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5),
            visitCategory: visitCategory
                .map((item) => ({
                id: item.id,
                name: item.name,
                count: item.Visit?.length || 0,
            }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5),
            visitPurpose: visitPurpose
                .map((item) => ({
                id: item.id,
                name: item.name,
                count: item.Visit?.length || 0,
            }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5),
            fileCategory: productType
                .flatMap((item) => item.ProductTypeFile)
                .map((fileCategory) => ({
                id: fileCategory.id,
                name: fileCategory.name,
                count: fileCategory.Files?.length || 0,
            }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5),
        },
        growth: (() => {
            const weeks = [];
            const now = new Date();
            for (let i = 3; i >= 0; i--) {
                const start = new Date(now);
                start.setDate(now.getDate() - (i + 1) * 7);
                const end = new Date(now);
                end.setDate(now.getDate() - i * 7);
                const weeklySubmissions = allSubmissions.filter((submission) => {
                    if (!submission?.created_at)
                        return false;
                    const createdAt = new Date(submission.created_at);
                    return createdAt >= start && createdAt < end;
                });
                const weeklyVisits = allVisits.filter((visit) => {
                    if (!visit.created_at)
                        return false;
                    const createdAt = new Date(visit.created_at);
                    return createdAt >= start && createdAt < end;
                });
                weeks.push({
                    name: i === 0 ? "Minggu Ini" : `${i} Minggu Lalu`,
                    submissions: weeklySubmissions.length,
                    visits: weeklyVisits.length,
                    approved: weeklySubmissions.filter((submission) => ["AKTIF", "LUNAS"].includes(submission?.approve_status ?? "")).length,
                });
            }
            return weeks;
        })(),
    };
    return ResponseServer(res, 200, {
        submissionType,
        productType,
        visitCategory,
        visitStatus,
        summary,
    });
};
export const DashboardCallreport = async (req, res) => {
    const [visit, visit_plan, tagihan] = await prisma.$transaction([
        prisma.visit.findMany({
            where: { status: true, date_action: { not: null } },
            include: {
                VisitCategory: true,
                VisitStatus: true,
                VisitPurpose: true,
                Submission: { include: { Mitra: true } },
            },
        }),
        prisma.visit.findMany({
            where: { status: true, date_action: null },
            include: {
                VisitCategory: true,
                VisitStatus: true,
                VisitPurpose: true,
                Submission: { include: { Mitra: true } },
            },
        }),
        prisma.billing.findMany({
            where: { status: true },
            include: { Mitra: true },
        }),
    ]);
    return ResponseServer(res, 200, { visit, visit_plan, tagihan });
};
export const LaporanCallreport = async (req, res) => {
    const { startDate, endDate } = req.query;
    const dateFilter = startDate && endDate
        ? {
            date_action: {
                gte: new Date(startDate),
                lte: new Date(endDate),
            },
        }
        : {};
    const data = await prisma.visit.findMany({
        where: {
            status: true,
            date_action: { not: null },
            ...dateFilter,
        },
        include: {
            Debitur: true,
            VisitStatus: true,
            VisitPurpose: true,
            VisitCategory: true,
            Submission: { include: { Mitra: true } },
            User: true,
        },
        orderBy: { date_action: "desc" },
    });
    return ResponseServer(res, 200, { data });
};
export const DashboardAbsensi = async (req, res) => {
    const [users, deduction, insentif, permit] = await prisma.$transaction([
        prisma.user.findMany({
            where: { status: true },
            include: {
                Absence: true,
                UserCost: true,
                Position: true,
            },
        }),
        prisma.deduction.findMany({ where: { status: true } }),
        prisma.insentif.findMany({ where: { status: true } }),
        prisma.permitAbsence.findMany({ where: { status: true } }),
    ]);
    return ResponseServer(res, 200, { users, deduction, insentif, permit });
};
export const DashboardEarsip = async (req, res) => {
    const { month } = req.query;
    const startMonth = month
        ? moment(month)
            .startOf("month")
            .toDate()
        : undefined;
    const endMonth = month
        ? moment(month)
            .endOf("month")
            .toDate()
        : undefined;
    const dateFilter = month
        ? {
            created_at: {
                gte: startMonth,
                lte: endMonth,
            },
        }
        : {};
    const [debitur, submission, producttype, mitra, asuransi, payoffice, collending,] = await prisma.$transaction([
        prisma.debitur.findMany({
            where: {
                status: true,
                ...(month && {
                    Submission: {
                        some: dateFilter,
                    },
                }),
            },
            include: {
                SubmissionType: true,
            },
        }),
        prisma.submission.findMany({
            where: {
                status: true,
                ...dateFilter,
            },
            include: {
                Files: true,
            },
        }),
        prisma.productType.findMany({
            where: { status: true },
            include: {
                Product: {
                    include: {
                        Submission: {
                            where: {
                                status: true,
                                ...dateFilter,
                            },
                        },
                    },
                },
                ProductTypeFile: true,
            },
        }),
        prisma.mitra.findMany({
            where: { status: true },
            include: {
                Submission: {
                    where: {
                        status: true,
                        ...dateFilter,
                    },
                },
            },
        }),
        prisma.insurance.findMany({
            where: { status: true },
            include: {
                Submission: {
                    where: {
                        status: true,
                        ...dateFilter,
                    },
                },
            },
        }),
        prisma.payOffice.findMany({
            where: { status: true },
            include: {
                Submission: {
                    where: {
                        status: true,
                        ...dateFilter,
                    },
                },
            },
        }),
        prisma.collateralLending.findMany({
            where: {
                status: true,
                ...dateFilter,
            },
            include: {
                Submission: true,
            },
        }),
    ]);
    return ResponseServer(res, 200, {
        debitur,
        submission,
        producttype,
        mitra,
        asuransi,
        payoffice,
        collending,
    });
};
export const GET_HOLIDAY = async (req, res, next) => {
    let { year } = req.query;
    const responseApi = await fetch(`https://api-hari-libur.vercel.app/api?year=${year}`);
    const data = await responseApi.json();
    return ResponseServer(res, 200, {
        data: data.data,
    });
};
