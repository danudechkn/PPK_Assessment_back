import { Request, Response } from "express";
import AssessmentService from "../service/assessmentcompetent/assessmentcompetent.service";
import { respondError } from "../utils/api-response.util";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

class AssessmentController {
  static async getOrderById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await AssessmentService.getOrderById(id);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async getScoreById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await AssessmentService.getScoreById(id);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async getAllOrders(req: Request, res: Response) {
    try {
      const result = await AssessmentService.getAllOrders(req.query);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async createOrder(req: Request, res: Response) {
    try {
      const result = await AssessmentService.createOrder(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async updateOrder(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await AssessmentService.updateOrder(id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async deleteOrder(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await AssessmentService.deleteOrder(id);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async getValueDataByOrderId(req: Request, res: Response) {
    try {
      const orderId = Number(req.params.orderId);
      const result = await AssessmentService.getValueDataByOrderId(orderId);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async getAssessmentSummary(req: Request, res: Response) {
    try {
      const orderId = Number(req.params.orderId);
      const result = await AssessmentService.getAssessmentSummary(orderId);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async saveScores(req: Request, res: Response) {
    try {
      const authUser = (req as AuthenticatedRequest).user;
      const currentUserId = authUser?.userid || authUser?.id;

      // รองรับทั้ง mode: "SELF" | "HEAD" และ fallback ผ่าน isHead: true | false
      const rawMode = req.body?.mode;
      const isHead =
        req.body?.isHead === true ||
        (typeof rawMode === "string" &&
          rawMode.trim().toUpperCase() === "HEAD");
      const mode: "SELF" | "HEAD" = isHead ? "HEAD" : "SELF";

      // ถ้าเป็น HEAD: userId คือเป้าหมายลูกน้องที่ถูกประเมิน (จาก body)
      // ถ้าเป็น SELF: userId คือตนเอง (จาก token)
      const targetUserId =
        mode === "HEAD"
          ? req.body?.user_id
          : currentUserId || req.body?.user_id;

      const result = await AssessmentService.saveScores({
        orderId: req.body?.orderId,
        items: req.body?.items,
        userId: targetUserId,
        headId: currentUserId,
        mode,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async updateScoreItem(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await AssessmentService.updateScoreItem(id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async submitScoreItem(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await AssessmentService.submitScoreItem(
        id,
        req.body?.submit_value,
      );
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async getAssessmentSheet(req: Request, res: Response) {
    try {
      const orderId = Number(req.params.orderId);
      const result = await AssessmentService.getAssessmentSheet(orderId);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async checkSelfAssessment(req: Request, res: Response) {
    try {
      const authUser = (req as AuthenticatedRequest).user;
      const tokenUserId = authUser?.userid || authUser?.id;

      // 💡 ถ้าส่ง query ?userId=... มา (หัวหน้าตรวจสอบลูกน้อง) ให้ใช้ ID ลูกน้อง
      // ถ้าไม่ได้ส่ง query มา (พนักงานตรวจสอบตัวเอง) ให้ใช้ ID จาก token
      const queryUserId = req.query.userId || req.query.userid;
      const targetUserId = queryUserId
        ? Number(queryUserId)
        : Number(tokenUserId);

      const result = await AssessmentService.checkSelfAssessment(targetUserId);

      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }
}

export default AssessmentController;
