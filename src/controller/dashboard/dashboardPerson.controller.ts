import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { DashboardPersonService } from "../../service/dashboard/dashboardPerson.service";

export class DashboardPersonController {
  static async getDashboardPerson(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userid || authReq.user?.id;

      if (!userId) {
        return res.status(401).json({
          status: 401,
          success: false,
          message: "ไม่พบข้อมูลผู้ใช้งาน (Unauthorized)",
        });
      }

      const year = req.query.year ? Number(req.query.year) : undefined;
      const round = req.query.round ? Number(req.query.round) : undefined;

      const result = await DashboardPersonService.getDashboardPerson(
        userId,
        year,
        round,
      );

      return res.status(200).json({ success: true, status: 200, data: result });
    } catch (error: any) {
      console.error("getDashboardPerson Error:", error);
      return res.status(500).json({
        status: 500,
        success: false,
        message: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล Dashboard",
      });
    }
  }
}
