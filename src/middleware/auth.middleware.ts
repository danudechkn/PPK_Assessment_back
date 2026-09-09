import { Request, Response, NextFunction } from "express";
// import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
// import dbppk from "../models/ppkhosp";

export interface AuthenticatedRequest extends Request {
  user?: {
    id?: number;
    userid: number;
    username: string;
    role_id?: number;
    doctorid?: number | null;
    funcUnitID?: number | null;
    type_id?: number | null;
    data_group?: number[];
    userGroup?: number | number[];
    groupid?: number | number[];
    [key: string]: any;
  };
}

export const extractToken = (reqOrSocket: any): string | null => {
  // 1) กรณีเป็น Express HTTP Request
  if (reqOrSocket?.cookies?.access_token) {
    return reqOrSocket.cookies.access_token;
  }
  if (reqOrSocket?.headers?.authorization?.startsWith("Bearer ")) {
    return reqOrSocket.headers.authorization.split(" ")[1];
  }

  // 2) กรณีเป็น Socket.IO Handshake
  const cookieHeader = reqOrSocket?.handshake?.headers?.cookie;
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c: string) => {
        const [k, ...v] = c.split("=");
        return [k, v.join("=")];
      }),
    );
    if (cookies.access_token) return cookies.access_token;
  }

  return null;
};

// -------------------------------------------------------------
// 🔒 Express HTTP Middlewares
// -------------------------------------------------------------

// ยืนยันตัวตน Token สำหรับ HTTP Route
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        status: 401,
        success: false,
        data: null,
        message: "Access Denied: ไม่พบ Token ใน Cookie หรือ Header",
      });
    }

    const secretKey: jwt.Secret = process.env.JWT_SECRET || "secretkey";
    const decoded: any = jwt.verify(token, secretKey);

    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error: any) {
    return res.status(401).json({
      status: 401,
      success: false,
      data: null,
      message: error.message || "Token ไม่ถูกต้องหรือหมดอายุแล้ว",
    });
  }
};

// ตรวจสอบ Role ของผู้ใช้ (เช่น role_id 1, 2)
export const authorizeRole = (...allowedRoles: number[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || (user.role_id && !allowedRoles.includes(user.role_id))) {
      return res.status(403).json({
        status: 403,
        success: false,
        data: null,
        message: "Forbidden: คุณไม่มีสิทธิ์เข้าถึงข้อมูลส่วนนี้",
      });
    }
    next();
  };
};
