import { Request, Response } from "express";
import AssessmentService from "../service/assessmentcompetent/assessmentcompetent.service";
import { respondError } from "../utils/api-response.util";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { AssessmentMode } from "../types/assessmentcompetent";

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

      // รองรับ mode: "SELF" | "HEAD" | "AGREEMENT" และ fallback ผ่าน isHead: true | false
      const rawMode =
        typeof req.body?.mode === "string"
          ? req.body.mode.trim().toUpperCase()
          : "";
      const isHead = req.body?.isHead === true || rawMode === "HEAD";
      const mode: AssessmentMode = isHead
        ? "HEAD"
        : rawMode === "AGREEMENT"
        ? "AGREEMENT"
        : "SELF";

      // ถ้าเป็น HEAD หรือ AGREEMENT: userId คือเป้าหมายลูกน้องที่ถูกประเมิน (จาก body)
      // ถ้าเป็น SELF: userId คือตนเอง (จาก token)
      const targetUserId =
        mode === "HEAD" || mode === "AGREEMENT"
          ? req.body?.user_id
          : currentUserId || req.body?.user_id;

      const result = await AssessmentService.saveScores({
        orderId: req.body?.orderId,
        items: req.body?.items,
        item: req.body?.item,
        userId: targetUserId,
        headId: req.body?.head_id || currentUserId,
        mode,
        development_plans: req.body?.development_plans,
        signature: req.body?.signature,
        clientIp: req.ip || req.socket.remoteAddress,
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

      const queryTypeOrderId = req.query.type_order_id || req.query.typeOrderId;
      const typeOrderId = queryTypeOrderId ? Number(queryTypeOrderId) : undefined;

      const result = await AssessmentService.checkSelfAssessment(
        targetUserId,
        typeOrderId,
      );

      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }
}

export default AssessmentController;
