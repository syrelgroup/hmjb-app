import {} from "express";
import { ResponseServer } from "../../libs/util.js";
import prisma from "../../libs/prisma.js";
import moment from "moment";
import { exportSubmissions, importSubmissions } from "./importExportService.js";
import * as XLSX from "xlsx";
import { parse } from "csv-parse/sync";
export const GET = async (req, res, next) => {
    let { page = 1, limit = 50, search, productTypeId, productId, guarantee_status, doc_status, approve_status, flagging_status, backdate, submissionTypeId, mitraId, payOfficeId, insuranceId, } = req.query;
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;
    try {
        const queryWhere = {
            status: true,
            ...(search && {
                OR: [
                    {
                        Debitur: {
                            OR: [
                                { fullname: { contains: search } },
                                { id: { contains: search } },
                                { nik: { contains: search } },
                                { cif: { contains: search } },
                            ],
                        },
                    },
                    { id: { contains: search } },
                    { drawer_code: { contains: search } },
                    { account_number: { contains: search } },
                ],
            }),
            ...(submissionTypeId && {
                Debitur: { submissionTypeId: submissionTypeId },
            }),
            ...(productTypeId && {
                Product: {
                    productTypeId: productTypeId,
                },
            }),
            ...(productId && { productId: productId }),
            ...(mitraId && { mitraId: mitraId }),
            ...(payOfficeId && { payOfficeId: payOfficeId }),
            ...(insuranceId && { insuranceId: insuranceId }),
            ...(approve_status && {
                approve_status: approve_status,
            }),
            ...(flagging_status && {
                flagging_status: flagging_status,
            }),
            ...(guarantee_status && {
                guarantee_status: guarantee_status,
            }),
            ...(doc_status && {
                doc_status: doc_status,
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
            ...(req.user?.Role.data_status === "USER"
                ? { OR: [{ createdById: req.user.id }, { userId: req.user.id }] }
                : {}),
        };
        const data = await prisma.submission.findMany({
            where: queryWhere,
            skip: skip,
            take: limit,
            include: {
                Debitur: { include: { SubmissionType: true } },
                Product: {
                    include: {
                        ProductType: {
                            include: {
                                ProductTypeFile: true,
                            },
                        },
                    },
                },
                User: true,
                Files: true,
                PermitFileDetail: true,
                Mitra: true,
                CollateralLending: true,
                PayOffice: true,
                Insurance: true,
            },
            orderBy: { created_at: "desc" },
        });
        const total = await prisma.submission.count({
            where: queryWhere,
        });
        return ResponseServer(res, 200, {
            msg: "GET /submission",
            data: data.map((d) => ({
                ...d,
                activities: JSON.parse(d.activities || "[]"),
                coments: JSON.parse(d.coments || "[]"),
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
        const { id, User, PermitFileDetail, Debitur, Product, Files, Mitra, CollateralLending, CreatedBy, PayOffice, Insurance, ...savedSub } = body;
        const genId = await generateId();
        const genDebId = await generateDebiturId();
        Debitur.id = Debitur.id ? Debitur.id : genDebId;
        const { SubmissionType, Visit, Submission, ...savedeb } = Debitur;
        await prisma.$transaction(async (tx) => {
            const deb = await tx.debitur.upsert({
                where: { id: Debitur.id },
                update: savedeb,
                create: savedeb,
            });
            const sub = await tx.submission.create({
                data: {
                    ...savedSub,
                    id: body.id && body.id !== "" ? body.id : genId,
                    debiturId: deb.id,
                    coments: JSON.stringify(body.coments.filter((c) => c.comment)),
                    activities: JSON.stringify(body.activities),
                    createdById: req.user?.id,
                },
            });
            for (const productTypeFile of Product.ProductType.ProductTypeFile) {
                if (productTypeFile.Files) {
                    await tx.files.createMany({
                        data: productTypeFile.Files.map((f) => ({
                            ...f,
                            productTypeFileId: productTypeFile.id,
                            submissionId: sub.id,
                        })),
                    });
                }
            }
            return true;
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
        const find = await prisma.submission.findFirst({
            where: { id: id },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        const { User, PermitFileDetail, Debitur, Product, Files, Mitra, CollateralLending, CreatedBy, PayOffice, Insurance, ...savedSub } = body;
        const { SubmissionType, Visit, Submission, ...savedeb } = Debitur;
        await prisma.$transaction(async (tx) => {
            await tx.debitur.update({
                where: { id: Debitur.id },
                data: savedeb,
            });
            await tx.submission.update({
                where: { id: id },
                data: {
                    ...savedSub,
                    coments: JSON.stringify(savedSub.coments),
                    activities: JSON.stringify(savedSub.activities),
                },
            });
            for (const productTypeFile of Product.ProductType.ProductTypeFile) {
                if (productTypeFile.Files) {
                    for (const file of productTypeFile.Files) {
                        const { id: fileId, ...fileData } = file;
                        await tx.files.upsert({
                            where: { id: fileId, productTypeFileId: productTypeFile.id }, // Jika file baru, id biasanya kosong
                            update: { name: fileData.name },
                            create: {
                                ...fileData,
                                id: undefined,
                            },
                        });
                    }
                }
            }
            return true;
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
        const find = await prisma.submission.findFirst({
            where: { id: id },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        await prisma.submission.update({
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
        const find = await prisma.submission.findFirst({
            where: { id: id },
            include: {
                Debitur: true,
                Product: {
                    include: {
                        ProductType: {
                            include: {
                                ProductTypeFile: {
                                    include: { Files: { where: { submissionId: id } } },
                                },
                            },
                        },
                    },
                },
                User: true,
                Files: true,
                PermitFileDetail: true,
                Mitra: true,
                PayOffice: true,
                Insurance: true,
            },
        });
        if (!find)
            return ResponseServer(res, 404, { msg: "Not found data" });
        find.coments = JSON.parse(find.coments || "[]");
        find.activities = JSON.parse(find.activities || "[]");
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
    const prefix = "SID";
    const padLength = 4;
    const lastRecord = await prisma.submission.count({});
    return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
async function generateDebiturId() {
    const prefix = "DEBT";
    const padLength = 4;
    const lastRecord = await prisma.debitur.count({});
    return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
export const EXPORT = async (req, res, next) => {
    try {
        const { format = "csv", productTypeId, productId, mitraId, payOfficeId, insuranceId } = req.query;
        const data = await exportSubmissions({
            productTypeId,
            productId,
            mitraId,
            payOfficeId,
            insuranceId,
        });
        // Transform data for export
        const exportData = data.map((item) => ({
            id: item.id,
            drawer_code: item.drawer_code,
            debitur_nik: item.Debitur.nik,
            debitur_cif: item.Debitur.cif,
            debitur_name: item.Debitur.fullname,
            debitur_birthplace: item.Debitur.birthplace,
            debitur_birthdate: item.Debitur.birthdate?.toISOString().split("T")[0],
            debitur_address: item.Debitur.address,
            debitur_phone: item.Debitur.phone,
            debitur_email: item.Debitur.email,
            submission_type_name: item.Debitur.SubmissionType.name,
            mitra_name: item.Mitra?.name || "",
            mitra_code: item.Mitra?.code || "",
            mitra_phone: item.Mitra?.phone || "",
            mitra_email: item.Mitra?.email || "",
            mitra_address: item.Mitra?.address || "",
            mitra_pic: item.Mitra?.pic || "",
            mitra_no_contract: item.Mitra?.no_contract || "",
            mitra_drawer_code: item.Mitra?.drawer_code || "",
            mitra_description: item.Mitra?.description || "",
            product_name: item.Product.name,
            product_type_name: item.Product.ProductType.name,
            payoffice_name: item.PayOffice?.name || "",
            insurance_name: item.Insurance?.name || "",
            value: item.value,
            tenor: item.tenor,
            account_number: item.account_number,
            purpose: item.purpose,
            created_at: item.created_at.toISOString(),
        }));
        if (format === "xlsx") {
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");
            const fileName = `submissions_${moment().format("YYYY-MM-DD_HHmmss")}.xlsx`;
            res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
            return res.end(buffer);
        }
        else {
            // CSV format
            const headers = Object.keys(exportData[0] || {});
            const csvContent = [
                headers.join(","),
                ...exportData.map((row) => headers
                    .map((header) => {
                    const value = row[header];
                    // Escape quotes and wrap in quotes if contains comma
                    const stringValue = String(value || "");
                    if (stringValue.includes(",") || stringValue.includes('"')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                })
                    .join(",")),
            ].join("\n");
            const fileName = `submissions_${moment().format("YYYY-MM-DD_HHmmss")}.csv`;
            res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
            res.setHeader("Content-Type", "text/csv");
            return res.end(csvContent);
        }
    }
    catch (err) {
        console.log(err);
        return ResponseServer(res, 500, {
            msg: err.message || "Internal Server Error",
        });
    }
};
export const IMPORT = async (req, res, next) => {
    try {
        const file = req.file;
        if (!file) {
            console.error("File not found in request");
            return ResponseServer(res, 400, { msg: "File tidak ditemukan" });
        }
        let data = [];
        // Parse file berdasarkan extension
        try {
            if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
                data = parse(file.buffer.toString(), {
                    columns: true,
                    skip_empty_lines: true,
                });
            }
            else if (file.mimetype ===
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                file.originalname.endsWith(".xlsx")) {
                const workbook = XLSX.read(file.buffer);
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                data = XLSX.utils.sheet_to_json(worksheet);
            }
            else if (file.mimetype === "application/vnd.ms-excel" || file.originalname.endsWith(".xls")) {
                const workbook = XLSX.read(file.buffer);
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                data = XLSX.utils.sheet_to_json(worksheet);
            }
            else {
                console.error("Unsupported file type:", file.mimetype, file.originalname);
                return ResponseServer(res, 400, {
                    msg: "Format file harus CSV atau XLSX (diterima: " + file.mimetype + ")",
                });
            }
        }
        catch (parseErr) {
            console.error("File parsing error:", parseErr);
            return ResponseServer(res, 400, {
                msg: "Gagal membaca file. Pastikan format file sudah benar. Error: " + parseErr.message,
            });
        }
        // Validate required fields
        const requiredFields = [
            "drawer_code",
            "debitur_nik",
            "debitur_name",
            "submission_type_name",
            "product_name",
            "product_type_name",
            "value",
            "tenor",
        ];
        // Check if data is empty
        if (data.length === 0) {
            console.error("No data rows found in file");
            return ResponseServer(res, 400, {
                msg: "File tidak berisi data atau format sheet tidak sesuai",
            });
        }
        const invalidRows = [];
        const missingFieldsMap = new Map();
        data.forEach((row, index) => {
            const missingFields = requiredFields.filter((field) => !row[field]);
            if (missingFields.length > 0) {
                invalidRows.push(index + 1);
                missingFieldsMap.set(index + 1, missingFields);
            }
        });
        if (invalidRows.length > 0) {
            const detailErrors = Array.from(missingFieldsMap.entries())
                .slice(0, 5)
                .map(([row, fields]) => `Baris ${row}: ${fields.join(", ")}`)
                .join("; ");
            const msg = `Data tidak valid pada baris: ${invalidRows.slice(0, 10).join(", ")}${invalidRows.length > 10 ? "... (total " + invalidRows.length + " baris)" : ""}. Detail: ${detailErrors}`;
            console.error(msg);
            return ResponseServer(res, 400, { msg });
        }
        // Convert string to number
        data = data.map((row) => ({
            ...row,
            value: Number(row.value),
            tenor: Number(row.tenor),
        }));
        // Import data
        const result = await importSubmissions(data, req.user?.id || "");
        return ResponseServer(res, 200, {
            msg: `Import selesai. ${result.success} data berhasil, ${result.failed} data gagal.`,
            data: result,
        });
    }
    catch (err) {
        console.log(err);
        return ResponseServer(res, 500, {
            msg: err.message || "Internal Server Error",
        });
    }
};
export const TEMPLATE = async (req, res, next) => {
    try {
        const { format = "xlsx" } = req.query;
        // Sample data for template
        const templateData = [
            {
                id: "SID0001",
                drawer_code: "DRWR001",
                debitur_nik: "3217012345678910",
                debitur_cif: "CIF001",
                debitur_name: "Budi Santoso",
                debitur_birthplace: "Jakarta",
                debitur_birthdate: "1990-01-15",
                debitur_address: "Jl. Merdeka No. 10, Jakarta",
                debitur_phone: "081234567890",
                debitur_email: "budi@email.com",
                submission_type_name: "Nasabah",
                mitra_name: "PT. Mitra Jaya",
                mitra_code: "MTR001",
                mitra_phone: "081987654321",
                mitra_email: "mitra@email.com",
                mitra_address: "Jl. Sudirman, Jakarta",
                mitra_pic: "Budi Wijaya",
                mitra_no_contract: "No. 123",
                mitra_drawer_code: "DRWR-MTR001",
                mitra_description: "Mitra terpercaya",
                product_name: "Kredit Usaha",
                product_type_name: "Kredit Modal",
                payoffice_name: "Kantor Pusat",
                insurance_name: "Asuransi Nasional",
                value: 50000000,
                tenor: 12,
                account_number: "1234567890",
                purpose: "Modal Usaha",
                created_at: new Date().toISOString(),
            },
        ];
        if (format === "xlsx") {
            const worksheet = XLSX.utils.json_to_sheet(templateData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");
            const fileName = `template_submission_${moment().format("YYYY-MM-DD")}.xlsx`;
            res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
            return res.end(buffer);
        }
        else {
            // CSV format
            const headers = Object.keys(templateData[0] || {});
            const csvContent = [
                headers.join(","),
                ...templateData.map((row) => headers
                    .map((header) => {
                    const value = row[header];
                    const stringValue = String(value || "");
                    if (stringValue.includes(",") || stringValue.includes('"')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                })
                    .join(",")),
            ].join("\n");
            const fileName = `template_submission_${moment().format("YYYY-MM-DD")}.csv`;
            res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
            res.setHeader("Content-Type", "text/csv");
            return res.end(csvContent);
        }
    }
    catch (err) {
        console.log(err);
        return ResponseServer(res, 500, {
            msg: err.message || "Internal Server Error",
        });
    }
};
