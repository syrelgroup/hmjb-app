import prisma from "../../libs/prisma.js";
export const exportSubmissions = async (filters) => {
    try {
        const queryWhere = {
            status: true,
            ...(filters?.productTypeId && {
                Product: { productTypeId: filters.productTypeId },
            }),
            ...(filters?.productId && { productId: filters.productId }),
            ...(filters?.mitraId && { mitraId: filters.mitraId }),
            ...(filters?.payOfficeId && { payOfficeId: filters.payOfficeId }),
            ...(filters?.insuranceId && { insuranceId: filters.insuranceId }),
        };
        const data = await prisma.submission.findMany({
            where: queryWhere,
            include: {
                Debitur: { include: { SubmissionType: true } },
                Product: { include: { ProductType: true } },
                Mitra: true,
                PayOffice: true,
                Insurance: true,
            },
            orderBy: { created_at: "desc" },
        });
        return data;
    }
    catch (error) {
        throw new Error(`Failed to export submissions: ${error.message}`);
    }
};
export const importSubmissions = async (data, userId) => {
    const errors = [];
    let success = 0;
    let failed = 0;
    try {
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            try {
                await prisma.$transaction(async (tx) => {
                    // Find or create SubmissionType (jenis pemohon)
                    let submissionType = await tx.submissionType.findFirst({
                        where: { name: row.submission_type_name },
                    });
                    if (!submissionType) {
                        submissionType = await tx.submissionType.create({
                            data: { name: row.submission_type_name },
                        });
                    }
                    // Find or create Debitur by NIK
                    let debitur = await tx.debitur.findUnique({
                        where: { nik: row.debitur_nik },
                    });
                    if (!debitur) {
                        debitur = await tx.debitur.create({
                            data: {
                                nik: row.debitur_nik,
                                cif: row.debitur_cif || null,
                                fullname: row.debitur_name,
                                birthplace: row.debitur_birthplace || null,
                                birthdate: row.debitur_birthdate ? new Date(row.debitur_birthdate) : null,
                                address: row.debitur_address || null,
                                phone: row.debitur_phone || null,
                                email: row.debitur_email || null,
                                submissionTypeId: submissionType.id,
                            },
                        });
                    }
                    // Find or create Mitra
                    let mitra = null;
                    if (row.mitra_name) {
                        mitra = await tx.mitra.findFirst({
                            where: { name: row.mitra_name },
                        });
                        if (!mitra) {
                            mitra = await tx.mitra.create({
                                data: {
                                    name: row.mitra_name,
                                    code: row.mitra_code || null,
                                    phone: row.mitra_phone || null,
                                    email: row.mitra_email || null,
                                    address: row.mitra_address || null,
                                    pic: row.mitra_pic || null,
                                    no_contract: row.mitra_no_contract || null,
                                    drawer_code: row.mitra_drawer_code || null,
                                    description: row.mitra_description || null,
                                },
                            });
                        }
                    }
                    // Find or create PayOffice (kantorbayar)
                    let payOffice = null;
                    if (row.payoffice_name) {
                        payOffice = await tx.payOffice.findFirst({
                            where: { name: row.payoffice_name },
                        });
                        if (!payOffice) {
                            payOffice = await tx.payOffice.create({
                                data: { name: row.payoffice_name },
                            });
                        }
                    }
                    // Find or create Insurance (asuransi)
                    let insurance = null;
                    if (row.insurance_name) {
                        insurance = await tx.insurance.findFirst({
                            where: { name: row.insurance_name },
                        });
                        if (!insurance) {
                            insurance = await tx.insurance.create({
                                data: { name: row.insurance_name },
                            });
                        }
                    }
                    // Find or create ProductType (tipe produk)
                    let productType = await tx.productType.findFirst({
                        where: { name: row.product_type_name },
                    });
                    if (!productType) {
                        productType = await tx.productType.create({
                            data: { name: row.product_type_name },
                        });
                    }
                    // Find or create Product (produk)
                    let product = await tx.product.findFirst({
                        where: { name: row.product_name, productTypeId: productType.id },
                    });
                    if (!product) {
                        product = await tx.product.create({
                            data: {
                                name: row.product_name,
                                productTypeId: productType.id,
                            },
                        });
                    }
                    // Create Submission
                    const submissionId = row.id || `SID${String(i + 1).padStart(4, "0")}`;
                    await tx.submission.create({
                        data: {
                            id: submissionId,
                            drawer_code: row.drawer_code,
                            value: row.value,
                            tenor: row.tenor,
                            account_number: row.account_number || null,
                            purpose: row.purpose || null,
                            debiturId: debitur.id,
                            productId: product.id,
                            userId: userId,
                            createdById: userId,
                            mitraId: mitra?.id || null,
                            payOfficeId: payOffice?.id || null,
                            insuranceId: insurance?.id || null,
                        },
                    });
                    success++;
                });
            }
            catch (error) {
                failed++;
                errors.push({
                    row: i + 1,
                    data: row,
                    error: error.message,
                });
            }
        }
        return { success, failed, errors };
    }
    catch (error) {
        throw new Error(`Failed to import submissions: ${error.message}`);
    }
};
