// app.ts
import express from "express";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.route";
import adminRoutes from "./routes/admin.route";
import authRoutes from "./routes/auth.route";
import publicRoutes from "./routes/public.route";

const app = express();

app.use(compression()); // บีบอัดข้อมูล
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use("/api", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);

export default app;
