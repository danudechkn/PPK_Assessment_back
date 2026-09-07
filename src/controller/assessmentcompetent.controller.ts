import { Request, Response } from "express";
import AssessmentService from "../service/assessmentcompetent.service";

class AssessmentController {
  static async getAllOrders(req: Request, res: Response) {
    try {
      const result = await AssessmentService.getAllOrders(req.query);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async createOrder(req: Request, res: Response) {
    try {
      const result = await AssessmentService.createOrder(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async updateOrder(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await AssessmentService.updateOrder(id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async deleteOrder(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await AssessmentService.deleteOrder(id);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async getValueDataByOrderId(req: Request, res: Response) {
    try {
      const orderId = Number(req.params.orderId);
      const result = await AssessmentService.getValueDataByOrderId(orderId);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async getAssessmentSummary(req: Request, res: Response) {
    try {
      const orderId = Number(req.params.orderId);
      const result = await AssessmentService.getAssessmentSummary(orderId);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async saveScores(req: Request, res: Response) {
    try {
      const orderId = Number(req.body?.orderId);
      const result = await AssessmentService.saveScores(orderId, req.body?.items);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async updateScoreItem(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await AssessmentService.updateScoreItem(id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async submitScoreItem(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await AssessmentService.submitScoreItem(id, req.body?.submit_value);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async getAssessmentSheet(req: Request, res: Response) {
    try {
      const orderId = Number(req.params.orderId);
      const result = await AssessmentService.getAssessmentSheet(orderId);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }
}

export default AssessmentController;
