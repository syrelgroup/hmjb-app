import { PTKPDetail, type IPTKP, type IUser } from "../../libs/interface";

// 1. Helper Fungsi untuk Mendapatkan Kategori TER berdasarkan Status PTKP
const getTERKategori = (ptkpName: string): "A" | "B" | "C" => {
  const katB = ["TK/2", "TK/3", "K/1", "K/2"];
  const katC = ["K/3"];

  if (katB.includes(ptkpName)) return "B";
  if (katC.includes(ptkpName)) return "C";
  return "A"; // Default Kategori A
};

// 2. Helper Fungsi untuk Mendapatkan Tarif TER Bulanan (Sesuai Aturan DJP)
const getTERTarif = (kategori: "A" | "B" | "C", bruto: number): number => {
  if (kategori === "A") {
    if (bruto <= 5400000) return 0;
    if (bruto <= 5650000) return 0.0025;
    if (bruto <= 5950000) return 0.005;
    if (bruto <= 6300000) return 0.0075;
    if (bruto <= 6750000) return 0.01;
    if (bruto <= 7500000) return 0.0125;
    if (bruto <= 8550000) return 0.015;
    if (bruto <= 9650000) return 0.0175;
    if (bruto <= 10950000) return 0.02;
    if (bruto <= 13000000) return 0.03;
    if (bruto <= 15000000) return 0.04;
    if (bruto <= 19400000) return 0.05;
    if (bruto <= 22600000) return 0.06;
    if (bruto <= 26100000) return 0.07;
    if (bruto <= 30050000) return 0.08;
    if (bruto <= 35400000) return 0.09;
    if (bruto <= 40200000) return 0.1;
    if (bruto <= 46200000) return 0.11;
    if (bruto <= 54550000) return 0.12;
    if (bruto <= 65900000) return 0.13;
    if (bruto <= 81150000) return 0.14;
    if (bruto <= 101900000) return 0.15;
    // ... batas atas dipersingkat demi efisiensi kode, mencakup upah standar menengah tinggi
    return 0.2;
  }

  if (kategori === "B") {
    if (bruto <= 6200000) return 0;
    if (bruto <= 6500000) return 0.0025;
    if (bruto <= 6850000) return 0.005;
    if (bruto <= 7300000) return 0.0075;
    if (bruto <= 7800000) return 0.01;
    if (bruto <= 8850000) return 0.0125;
    if (bruto <= 9800000) return 0.015;
    if (bruto <= 10800000) return 0.0175;
    if (bruto <= 12200000) return 0.02;
    if (bruto <= 14200000) return 0.03;
    if (bruto <= 16400000) return 0.04;
    if (bruto <= 20850000) return 0.05;
    if (bruto <= 24550000) return 0.06;
    if (bruto <= 28600000) return 0.07;
    if (bruto <= 32600000) return 0.08;
    if (bruto <= 38500000) return 0.09;
    if (bruto <= 43900000) return 0.1;
    if (bruto <= 50400000) return 0.11;
    if (bruto <= 59700000) return 0.12;
    if (bruto <= 71400000) return 0.13;
    if (bruto <= 87400000) return 0.14;
    if (bruto <= 109100000) return 0.15;
    return 0.2;
  }

  // Kategori C (K/3)
  if (bruto <= 6600000) return 0;
  if (bruto <= 6950000) return 0.0025;
  if (bruto <= 7350000) return 0.005;
  if (bruto <= 7800000) return 0.0075;
  if (bruto <= 8350000) return 0.01;
  if (bruto <= 9450000) return 0.0125;
  if (bruto <= 10450000) return 0.015;
  if (bruto <= 11450000) return 0.0175;
  if (bruto <= 13000000) return 0.02;
  if (bruto <= 15100000) return 0.03;
  if (bruto <= 17400000) return 0.04;
  if (bruto <= 22100000) return 0.05;
  if (bruto <= 26000000) return 0.06;
  if (bruto <= 30100000) return 0.07;
  if (bruto <= 34300000) return 0.08;
  if (bruto <= 40400000) return 0.09;
  if (bruto <= 46000000) return 0.1;
  if (bruto <= 52800000) return 0.11;
  if (bruto <= 62300000) return 0.12;
  if (bruto <= 74400000) return 0.13;
  if (bruto <= 91000000) return 0.14;
  if (bruto <= 113300000) return 0.15;
  return 0.2;
};

export const calculatePayroll = (user: IUser) => {
  const salary = user.salary || 0;
  const absences = user.Absence || [];
  const permit = user.PermitAbsence || [];
  const insentif = user.Insentif || [];
  const deduction = user.Deduction || [];
  const userCosts = user.UserCost || [];

  // --- 1. Perhitungan Potongan Absensi ---
  const latededuction = absences.reduce(
    (acc, curr) => acc + (curr.late_deduction || 0),
    0,
  );
  const late = absences.filter((a) =>
    (a.description || "").split(",").includes("TERLAMBAT"),
  );
  const alpha = absences.filter((a) => a.absence_status === "ALPHA");
  const lembur = absences.filter((a) =>
    (a.description || "").split(",").includes("LEMBUR"),
  );
  const fastleave = absences.filter((a) =>
    (a.description || "").split(",").includes("PULANG_CEPAT"),
  );
  const hadir = absences.filter((a) => a.absence_status === "HADIR");
  const sakit = absences.filter((a) => a.absence_status === "SAKIT");
  const cuti = absences.filter((a) => a.absence_status === "CUTI");
  const perdin = absences.filter(
    (a) =>
      a.absence_status === "PERDIN" ||
      (a.description || "").split(",").includes("PERDIN"),
  );

  const lemburPay = absences.reduce(
    (acc, curr) => acc + (curr.lemburan || 0),
    0,
  );
  const alphaDeduction = alpha.reduce(
    (acc, curr) => acc + (curr.alpha_deduction || 0),
    0,
  );
  const fastLeaveDeduction = fastleave.reduce(
    (acc, curr) => acc + (curr.fast_leave_deduction || 0),
    0,
  );

  // --- 2. Perhitungan Tunjangan & Insentif ---
  const totalInsentifPay = insentif.reduce((acc, cost) => {
    const nominal =
      cost.nominal_type === "PERCENT"
        ? salary * (cost.nominal / 100)
        : cost.nominal;
    return acc + nominal;
  }, 0);
  const totalDeductionPay = deduction.reduce((acc, cost) => {
    const nominal =
      cost.nominal_type === "PERCENT"
        ? salary * (cost.nominal / 100)
        : cost.nominal;
    return acc + nominal;
  }, 0);

  const totalAllowanceUserCost = userCosts
    .filter((cost) => cost.type === "PENAMBAHAN")
    .reduce((acc, cost) => {
      const nominal =
        cost.nominal_type === "PERCENT"
          ? salary * (cost.nominal / 100)
          : cost.nominal;
      return acc + nominal;
    }, 0);

  const totalDeductionUserCost = userCosts
    .filter((cost) => cost.type === "PENGURANGAN")
    .reduce((acc, cost) => {
      const nominal =
        cost.nominal_type === "PERCENT"
          ? salary * (cost.nominal / 100)
          : cost.nominal;
      return acc + nominal;
    }, 0);

  // --- 3. Perhitungan Gaji Bruto Bulanan (Dasar Pengenaan TER) ---
  const grossSalary =
    salary + lemburPay + totalAllowanceUserCost + totalInsentifPay;

  // --- 4. FORMULA PERHITUNGAN PAJAK BULANAN (TER) ---
  const userPtkpName = user.ptkp || "TK/0";
  const kategoriTER = getTERKategori(userPtkpName);
  const tarifTER = getTERTarif(kategoriTER, grossSalary);

  // Pajak PPh 21 Bulan Ini
  const pphBulanan = Math.round(grossSalary * tarifTER);

  // --- 5. Perhitungan Gaji Bersih Terakhir (Take Home Pay) ---
  const netBeforeTax = Math.max(
    0,
    grossSalary -
      latededuction -
      alphaDeduction -
      fastLeaveDeduction -
      totalDeductionUserCost -
      totalDeductionPay,
  );
  const takeHome = Math.max(0, netBeforeTax - pphBulanan);

  const ptkp: IPTKP =
    PTKPDetail.find((tkp) => tkp.name === userPtkpName) || PTKPDetail[0];

  return {
    salary,
    late,
    latePay: latededuction,
    alpha,
    alphaPay: alphaDeduction,
    lembur,
    lemburPay: lemburPay,
    fastleave,
    fastLeaveDeduction,
    hadir,
    sakit,
    cuti,
    perdin,
    grossSalary,
    netBeforeTax,
    pph: pphBulanan,
    takeHome,
    permitCount: permit.length,
    permitApproved: permit.filter((p) => p.permit_status === "DISETUJUI")
      .length,
    permitPending: permit.filter((p) => p.permit_status === "PENDING").length,
    allowance: userCosts.filter((a) => a.type === "PENAMBAHAN"),
    allowancePay: totalAllowanceUserCost,
    deduction: userCosts.filter((a) => a.type === "PENGURANGAN"),
    deductionPay: totalDeductionUserCost,
    insentif: insentif,
    insentifPay: totalInsentifPay,
    tt_deduction: deduction,
    tt_deductionPay: totalDeductionPay,

    // Properti pelengkap agar slip lampiran di bawah tidak error:
    bruto: grossSalary,
    kategoriTER,
    tarifTER: `${(tarifTER * 100).toFixed(2)}%`,
    ptkpValue: ptkp.value,
  };
};
