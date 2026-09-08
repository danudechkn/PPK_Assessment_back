import { Request, Response } from "express";
import AssessmentService from "../service/assessmentcompetent.service";
import { respond } from "../utils/api-response.util";

class AssessmentController {

  static async getOrderById(req: Request, res: Response) {
    return respond(res, () => AssessmentService.getOrderById(Number(req.params.id)));
  }

  static async getScoreById(req: Request, res: Response) {
    return respond(res, () => AssessmentService.getScoreById(Number(req.params.id)));
  }

  static async getAllOrders(req: Request, res: Response) {
    return respond(res, () => AssessmentService.getAllOrders(req.query));
  }

  static async createOrder(req: Request, res: Response) {
    return respond(res, () => AssessmentService.createOrder(req.body), 201);
  }

  static async updateOrder(req: Request, res: Response) {
    return respond(res, () => AssessmentService.updateOrder(Number(req.params.id), req.body));
  }

  static async deleteOrder(req: Request, res: Response) {
    return respond(res, () => AssessmentService.deleteOrder(Number(req.params.id)));
  }

  static async getValueDataByOrderId(req: Request, res: Response) {
    return respond(res, () => AssessmentService.getValueDataByOrderId(Number(req.params.orderId)));
  }

  static async getAssessmentSummary(req: Request, res: Response) {
    return respond(res, () => AssessmentService.getAssessmentSummary(Number(req.params.orderId)));
  }

  static async saveScores(req: Request, res: Response) {
    return respond(res, () => AssessmentService.saveScores(req.body?.orderId, req.body?.items));
  }

  static async updateScoreItem(req: Request, res: Response) {
    return respond(res, () => AssessmentService.updateScoreItem(Number(req.params.id), req.body));
  }

  static async submitScoreItem(req: Request, res: Response) {
    return respond(res, () => AssessmentService.submitScoreItem(Number(req.params.id), req.body?.submit_value));
  }

  static async getAssessmentSheet(req: Request, res: Response) {
    return respond(res, () => AssessmentService.getAssessmentSheet(Number(req.params.orderId)));
  }
}

export default AssessmentController;
