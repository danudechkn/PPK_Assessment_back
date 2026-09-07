import { respond } from "../utils/api-response.util";
import { Request, Response } from "express";
import KpiService from "../service/kpi.service";

class KpiController {
  private static respond = respond;

  static getIndicators(req: Request, res: Response) {
    return KpiController.respond(res, () => KpiService.getIndicators());
  }

  static getIndicatorById(req: Request, res: Response) {
    return KpiController.respond(res, () => KpiService.getIndicatorById(Number(req.params.id)));
  }

  static async createIndicator(req: Request, res: Response) {
    return KpiController.respond(res, () => KpiService.createIndicator(req.body), 201);
  }

  static createScoreLevels(req: Request, res: Response) {
    return KpiController.respond(res, () => KpiService.createScoreLevels(req.body), 201);
  }

  static createAssessmentValues(req: Request, res: Response) {
    return KpiController.respond(res, () => KpiService.createAssessmentValues(req.body), 201);
  }

  static getAssessmentValues(req: Request, res: Response) {
    return KpiController.respond(res, () => KpiService.getAssessmentValues(req.query));
  }

  static getUserAssessmentValues(req: Request, res: Response) {
    return KpiController.respond(res, () => KpiService.getAssessmentValues(
      { ...req.query, value_order_id: req.params.orderId }, true,
    ));
  }

  static getAssessmentValueById(req: Request, res: Response) {
    return KpiController.respond(res, () => KpiService.getAssessmentValueById(Number(req.params.id)));
  }

  static updateAssessmentValue(req: Request, res: Response) {
    return KpiController.respond(res, () => KpiService.updateAssessmentValue(Number(req.params.id), req.body));
  }

  static updateAssessmentValueScores(req: Request, res: Response) {
    return KpiController.respond(res, () => KpiService.updateAssessmentValueScores(Number(req.params.id), req.body));
  }

  static deleteAssessmentValue(req: Request, res: Response) {
    return KpiController.respond(res, () => KpiService.deleteAssessmentValue(Number(req.params.id)));
  }

  static getScoreLevels(req: Request, res: Response) {
    return KpiController.respond(res, () => KpiService.getScoreLevels());
  }

  static getScoreLevelById(req: Request, res: Response) {
    return KpiController.respond(res, () => KpiService.getScoreLevelById(Number(req.params.id)));
  }

  static updateScoreLevel(req: Request, res: Response) {
    return KpiController.respond(res, () => KpiService.updateScoreLevel(Number(req.params.id), req.body));
  }

  static deleteScoreLevel(req: Request, res: Response) {
    return KpiController.respond(res, () => KpiService.deleteScoreLevel(Number(req.params.id)));
  }

  static updateIndicator(req: Request, res: Response) {
    return KpiController.respond(res, () => KpiService.updateIndicator(Number(req.params.id), req.body));
  }

  static deleteIndicator(req: Request, res: Response) {
    return KpiController.respond(res, () => KpiService.deleteIndicator(Number(req.params.id)));
  }

  static submitAssessmentValue(req: Request, res: Response) {
    return KpiController.respond(res, () => KpiService.submitAssessmentValue(Number(req.params.id), req.body));
  }
}

export default KpiController;
