import { respond } from "../utils/api-response.util";
import { Request, Response } from "express";
import AssessmentService from "../service/assessmentcompetent.service";

class AssessmentController {
  private static respond = respond;

  static getAllOrders(req: Request, res: Response) { return AssessmentController.respond(res, () => AssessmentService.getAllOrders(req.query)); }
  static createOrder(req: Request, res: Response) { return AssessmentController.respond(res, () => AssessmentService.createOrder(req.body), 201); }
  static updateOrder(req: Request, res: Response) { return AssessmentController.respond(res, () => AssessmentService.updateOrder(Number(req.params.id), req.body)); }
  static deleteOrder(req: Request, res: Response) { return AssessmentController.respond(res, () => AssessmentService.deleteOrder(Number(req.params.id))); }
  static getValueDataByOrderId(req: Request, res: Response) { return AssessmentController.respond(res, () => AssessmentService.getValueDataByOrderId(Number(req.params.orderId))); }
  static getAssessmentSummary(req: Request, res: Response) { return AssessmentController.respond(res, () => AssessmentService.getAssessmentSummary(Number(req.params.orderId))); }
  static saveScores(req: Request, res: Response) { return AssessmentController.respond(res, () => AssessmentService.saveScores(Number(req.body.orderId), req.body.items), 200); }
  static updateScoreItem(req: Request, res: Response) { return AssessmentController.respond(res, () => AssessmentService.updateScoreItem(Number(req.params.id), req.body)); }
  static submitScoreItem(req: Request, res: Response) { return AssessmentController.respond(res, () => AssessmentService.submitScoreItem(Number(req.params.id), req.body.submit_value)); }
  static getAssessmentSheet(req: Request, res: Response) { return AssessmentController.respond(res, () => AssessmentService.getAssessmentSheet(Number(req.params.orderId))); }
}

export default AssessmentController;
