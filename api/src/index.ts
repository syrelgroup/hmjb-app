import "dotenv/config";
import cors from "cors";
import { middleware } from "./middlewares/middleware.js";
import express from "express";
import roleRoute from "./modules/role/routes.js";
import posRoute from "./modules/position/routes.js";
import userRoute from "./modules/user/routes.js";
import profileRoute from "./modules/profile/routes.js";
import authRoute from "./modules/auth/routes.js";
import subTypeRoute from "./modules/sub_type/routes.js";
import productTypeRoute from "./modules/product_type/routes.js";
import mitraRoute from "./modules/mitra/routes.js";
import submissionRoute from "./modules/submission/routes.js";
import visitCategoryRoute from "./modules/visit_category/routes.js";
import visitStatusRoute from "./modules/visit_status/routes.js";
import visitPurposeRoute from "./modules/visit_purpose/routes.js";
import visitRoute from "./modules/visit/routes.js";
import debiturRoute from "./modules/debitur/routes.js";
import absConfigRoute from "./modules/absence_config/routes.js";
import absenceRoute from "./modules/absence/routes.js";
import absenceReportRoute from "./modules/absence_report/routes.js";
import permitAbsenceRoute from "./modules/permit_absence/routes.js";
import insentifRoute from "./modules/insentif/routes.js";
import permitDownloadRoute from "./modules/permit_download/routes.js";
import permitDeleteRoute from "./modules/permit_delete/routes.js";
import guestBookRoute from "./modules/guestbook/routes.js";
import gbookTypeRoute from "./modules/gbook_type/routes.js";
import fileRoute from "./modules/file/routes.js";
import logActivitiesRoute from "./modules/log-activities/routes.js";
import collateralLendingRoute from "./modules/collateral_lending/routes.js";
import { MainDashboard } from "./modules/route.js";
import type { Role, User } from "@prisma/client";

interface IUser extends User {
  Role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// ROOT APP
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));
app.use("/maindashboard", middleware, MainDashboard);
app.use("/auth", authRoute);
app.use("/role", middleware, roleRoute);
app.use("/position", middleware, posRoute);
app.use("/user", middleware, userRoute);
app.use("/profile", middleware, profileRoute);
app.use("/debitur", middleware, debiturRoute);
app.use("/mitra", middleware, mitraRoute);
app.use("/file", middleware, fileRoute);

// EARSIP
app.use("/sub_type", middleware, subTypeRoute);
app.use("/producttype", middleware, productTypeRoute);
app.use("/submission", middleware, submissionRoute);
app.use("/permit_download", middleware, permitDownloadRoute);
app.use("/permit_delete", middleware, permitDeleteRoute);
app.use("/collateral_lending", middleware, collateralLendingRoute);

// CALLREPORT
app.use("/visit_category", middleware, visitCategoryRoute);
app.use("/visit_status", middleware, visitStatusRoute);
app.use("/visit_purpose", middleware, visitPurposeRoute);
app.use("/visit", middleware, visitRoute);

// ABSENSI
app.use("/absence_config", middleware, absConfigRoute);
app.use("/absence", middleware, absenceRoute);
app.use("/absence_report", middleware, absenceReportRoute);
app.use("/permit_absence", middleware, permitAbsenceRoute);
app.use("/insentif", middleware, insentifRoute);

// BUKU TAMU
app.use("/guestbook", middleware, guestBookRoute);
app.use("/gbook_type", middleware, gbookTypeRoute);

// LOGS
app.use("/log-activities", middleware, logActivitiesRoute);

const PORT = process.env.APP_PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server ready at port: ${PORT}`);
});
