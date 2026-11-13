import { Request, Response } from "express";
import BehaviorsService from "../../service/competent/behaviors.service";
import { respondError } from "../../utils/api-response.util";

export class BehaviorsController {
  static async getBehavior(req: Request, res: Response) {
    try {
      const result = await BehaviorsService.getBehavior(req.query);
      res.status(200).json({ success: true, ...result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async getBehaviorById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await BehaviorsService.getBehaviorById(id);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async getBehaviorsByCompetency(req: Request, res: Response) {
    try {
      const result = await BehaviorsService.getBehaviorsByCompetency(
        Number(req.params.competencyId),
      );
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async createBehavior(req: Request, res: Response) {
    try {
      const result = await BehaviorsService.createBehavior(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async updateBehavior(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await BehaviorsService.updateBehavior(id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async deleteBehavior(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await BehaviorsService.deleteBehavior(id);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }
}

export default BehaviorsController;

