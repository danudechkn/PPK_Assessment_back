import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { DashboardFuncunitService } from "../../service/dashboard/dashboardFuncunit.service";

export class DashboardFuncunitController {
  static async getFuncunitDashboardSummary(req: Request, res: Response) {
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
      const funcunitID =
        (req.query.funcunitID as string) ||
        (req.query.funcunit_id as string) ||
        (req.query.funcID as string);

      const result = await DashboardFuncunitService.getFuncunitDashboardSummary(
        userId,
        year,
        round,
        funcunitID
      );

      return res.status(200).json(result);
    } catch (error: any) {
      console.error("getFuncunitDashboardSummary Error:", error);
      return res.status(500).json({
        status: 500,
        success: false,
        message: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล Dashboard หน่วยงาน",
      });
    }
  }
}
