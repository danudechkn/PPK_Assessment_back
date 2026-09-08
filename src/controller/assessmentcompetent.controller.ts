import { Request, Response } from "express";
import AssessmentService from "../service/assessmentcompetent.service";
import { respondError } from "../utils/api-response.util";

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
      const result = await AssessmentService.saveScores(req.body?.orderId, req.body?.items);
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
      const result = await AssessmentService.submitScoreItem(id, req.body?.submit_value);
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
}

export default AssessmentController;
