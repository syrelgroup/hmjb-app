import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import DashboardApp from "./app/Dashboard";
import DataDebitur from "./app/Debitur";
import DataRole from "./app/Role";
import useContext from "../libs/context";
import { Button } from "antd";
import DataPosition from "./app/Position";
import DataSubmissionType from "./app/SubmissionType";
import DataProductType from "./earsip/ProductType";
import DataSubmission from "./earsip/Submission";
import UpsertSubmission from "./earsip/UpsertSubmission";
import UpdateSubmission from "./earsip/UpdateSubmission";
import DataVisitCategory from "./creport/Category";
import DataVisitStatus from "./creport/Status";
import DataVisitPurpose from "./creport/Purpose";
import UpsertVisit from "./creport/UpsertVisit";
import UpdateVisit from "./creport/UpdateVisit";
import DetailVisit from "./creport/DetailVisit";
import DebiturCallReport from "./creport/Debitur";
import UserManagement from "./app/User";
import UserProfile from "./app/UserProfile";
import LogActivities from "./app/LogActivities";
import DebiturEArsip from "./earsip/Debitur";
import DataGuestBook from "./guestbook/GuestBook";
import DataGbookType from "./guestbook/GbookType";
import UpsertProductType from "./earsip/UpsertProductType";
import UpdateProductType from "./earsip/UpdateProductType";
import DataMitra from "./app/Mitra";
import DashboardEarsip from "./earsip/DashboardEarsip";
import DashboardCallReport from "./creport/DashboardCallReport";
import DashboardGuestBook from "./guestbook/DashboardGuestBook";
import CollateralLending from "./earsip/CollateralLending";
import UpsertCollateralLending from "./earsip/UpsertCollateralLending";
import DataVisitPlan from "./creport/VisitPlan";
import DataVisit from "./creport/Visit";
import PermitDownload from "./earsip/PermitDownload";
import PermitDelete from "./earsip/PermitDelete";
import UpsertVisitPlan from "./creport/UpsertVisitPlan";
import UpdateVisitPlan from "./creport/UpdateVisitPlan";
import AbsenceConfig from "./absensi/AbsenceConfig";
import PermitAbsence from "./absensi/PermitAbsence";
import DailyReportAbsence from "./absensi/DailyReportAbsence";
import InsentifPage from "./absensi/Insentif";
import DashboardAbsensi from "./absensi/DashboardAbsensi";
import PayrollPage from "./absensi/Payroll";
import { useEffect } from "react";
import DataPayOffice from "./app/PayOffice";
import DataInsurance from "./app/Insurance";
import DeductionPage from "./absensi/Deduction";
import DataBilling from "./creport/Billing";

function AppRouter() {
  const path = window.location.pathname;
  const navigate = useNavigate();
  const { updatetoken, updateconfig } = useContext((state) => state);

  useEffect(() => {
    (async () => {
      updatetoken();
      updateconfig();
    })();
  }, []);

  return (
    <main className="bg-slate-50">
      <Routes>
        <Route path="/" element={<DashboardApp />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route element={<ProtectedRoute path={path} />}>
          <Route path="/sub_type" element={<DataSubmissionType />} />
          <Route path="/debitur" element={<DataDebitur />} />
          <Route path="/user" element={<UserManagement />} />
          <Route path="/role" element={<DataRole />} />
          <Route path="/position" element={<DataPosition />} />
          <Route path="/mitra" element={<DataMitra />} />
          <Route path="/pay_office" element={<DataPayOffice />} />
          <Route path="/insurance" element={<DataInsurance />} />
          <Route path="/log-activities" element={<LogActivities />} />

          {/* EARSIP */}
          <Route path="/earsip/" element={<DashboardEarsip />} />
          <Route path="/earsip/product_type" element={<DataProductType />} />
          <Route
            path="/earsip/product_type/upsert"
            element={<UpsertProductType />}
          />
          <Route
            path="/earsip/product_type/upsert/:id"
            element={<UpdateProductType />}
          />
          <Route path="/earsip/submission" element={<DataSubmission />} />
          <Route
            path="/earsip/submission/upsert"
            element={<UpsertSubmission />}
          />
          <Route
            path="/earsip/submission/upsert/:id"
            element={<UpdateSubmission />}
          />
          <Route path="/earsip/debitur" element={<DebiturEArsip />} />
          <Route
            path="/earsip/collateral_lending"
            element={<CollateralLending />}
          />
          <Route
            path="/earsip/collateral_lending/upsert"
            element={<UpsertCollateralLending />}
          />
          <Route
            path="/earsip/collateral_lending/upsert/:id"
            element={<UpsertCollateralLending />}
          />
          <Route path="/earsip/permit_download" element={<PermitDownload />} />
          <Route path="/earsip/permit_delete" element={<PermitDelete />} />

          {/* CALLREPORT */}
          <Route path="/callreport/" element={<DashboardCallReport />} />
          <Route path="/callreport/debitur" element={<DebiturCallReport />} />
          <Route path="/callreport/category" element={<DataVisitCategory />} />
          <Route path="/callreport/status" element={<DataVisitStatus />} />
          <Route path="/callreport/purpose" element={<DataVisitPurpose />} />
          <Route path="/callreport/visit_plan" element={<DataVisitPlan />} />
          <Route
            path="/callreport/visit_plan/upsert"
            element={<UpsertVisitPlan />}
          />
          <Route
            path="/callreport/visit_plan/upsert/:id"
            element={<UpdateVisitPlan />}
          />
          <Route path="/callreport/visit" element={<DataVisit />} />
          <Route path="/callreport/visit/upsert" element={<UpsertVisit />} />
          <Route
            path="/callreport/visit/upsert/:id"
            element={<UpdateVisit />}
          />
          <Route path="/callreport/visit/:id" element={<DetailVisit />} />
          <Route path="/callreport/tagihan" element={<DataBilling />} />

          {/* ABSENSI */}
          <Route path="/absensi/" element={<DashboardAbsensi />} />
          <Route path="/absensi/payroll" element={<PayrollPage />} />
          <Route path="/absensi/config" element={<AbsenceConfig />} />
          <Route path="/absensi/permit" element={<PermitAbsence />} />
          <Route path="/absensi/report" element={<DailyReportAbsence />} />
          <Route path="/absensi/insentif" element={<InsentifPage />} />
          <Route path="/absensi/deduction" element={<DeductionPage />} />

          {/* GUESTBOOK */}
          <Route path="/guestbook/" element={<DashboardGuestBook />} />
          <Route path="/guestbook/guestbook" element={<DataGuestBook />} />
          <Route path="/guestbook/gbook_type" element={<DataGbookType />} />
        </Route>

        {/* 404 Page (Opsional) */}
        <Route
          path="/unauthorized"
          element={
            <div className="py-20 flex flex-col gap-4 items-center justify-center">
              <div className="text-center text-2xl font-bold">
                404 - Akses tidak diizinkan
              </div>
              <div>
                <Button onClick={() => navigate(-1)} block type="primary">
                  Back
                </Button>
              </div>
            </div>
          }
        />
        <Route
          path="*"
          element={
            <div className="py-20 flex flex-col gap-4 items-center justify-center">
              <div className="text-center text-2xl font-bold">
                404 - Halaman Tidak Ditemukan
              </div>
              <div>
                <Button onClick={() => navigate(-1)} block type="primary">
                  Back
                </Button>
              </div>
            </div>
          }
        />
      </Routes>
    </main>
  );
}

const ProtectedRoute = ({ path }: { path: string }) => {
  const { user, hasAccess } = useContext((state) => state);
  if (!user) return <Navigate to="/" replace />;
  if (!hasAccess(path, "read")) {
    return <Navigate to="/app/unauthorized" replace />;
  }

  return <Outlet />;
};

export default AppRouter;
