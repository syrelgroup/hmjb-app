import { PTKPDetail, type IPTKP, type IUser } from "../../libs/interface";

export const calculatePayroll = (user: IUser) => {
  const salary = user.salary || 0;
  const absences = user.Absence || [];
  const permit = user.PermitAbsence || [];
  const insentif = user.Insentif || [];
  const userCosts = user.UserCost || [];

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

  const lemburPay = absences.reduce((acc, curr) => acc + curr.lemburan, 0);
  const alphaDeduction = alpha.reduce(
    (acc, curr) => acc + curr.alpha_deduction,
    0,
  );
  const fastLeaveDeduction = fastleave.reduce(
    (acc, curr) => acc + curr.fast_leave_deduction,
    0,
  );
  const totalInsentifPay = insentif.reduce((acc, cost) => {
    const nominal =
      cost.nominal_type === "PERCENT"
        ? salary * (cost.nominal / 100)
        : cost.nominal;
    return acc + nominal;
  }, 0);

  // Calculate user costs (allowances and deductions)
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

  const grossSalary =
    salary + lemburPay + totalAllowanceUserCost + totalInsentifPay;
  const netBeforeTax = Math.max(
    0,
    grossSalary -
      latededuction -
      alphaDeduction -
      fastLeaveDeduction -
      totalDeductionUserCost,
  );
  const ptkp: IPTKP =
    PTKPDetail.find((tkp) => tkp.name === user.ptkp) || PTKPDetail[0];
  const taxableIncome = Math.max(0, netBeforeTax - ptkp.value / 12);
  const pph = Math.round(taxableIncome * 0.05);
  const takeHome = Math.max(0, netBeforeTax - pph);

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
    taxableIncome,
    pph,
    takeHome,
    permitCount: permit.length,
    permitApproved: permit.filter((p) => p.permit_status === "DISETUJUI")
      .length,
    permitPending: permit.filter((p) => p.permit_status === "PENDING").length,
    allowance: userCosts.filter((a) => a.type === "PENAMBAHAN"),
    allowancePay: totalAllowanceUserCost,
    deduction: userCosts.filter((a) => a.type === "PENAMBAHAN"),
    deductionPay: totalDeductionUserCost,
    insentif: insentif,
    insentifPay: totalInsentifPay,
  };
};
