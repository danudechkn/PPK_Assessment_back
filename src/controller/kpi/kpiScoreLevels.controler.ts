import { Request, Response } from "express";
import { KpiScoreLevelsService } from "../../service/kpi/kpiScoreLevels.service";

export class KpiScoreLevelsController {
  static async index(req: Request, res: Response) {
    try {
      const result = await KpiScoreLevelsService.index(req.query);
      return res.status(200).json({
        success: true,
        message: "success",
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const result = await KpiScoreLevelsService.create(req.body);
      return res.status(201).json({
        success: true,
        message: "KPI Score Level created successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async show(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await KpiScoreLevelsService.show(id);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "KPI Score Level not found",
          data: null,
        });
      }
      return res.status(200).json({
        success: true,
        message: "success",
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await KpiScoreLevelsService.update(id, req.body);
      return res.status(200).json({
        success: true,
        message: "KPI Score Level updated successfully",
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await KpiScoreLevelsService.destroy(id);
      return res.status(200).json({
        success: true,
        message: "KPI Score Level deleted successfully",
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getByIndicator(req: Request, res: Response) {
    try {
      const indicatorId = Number(req.params.indicatorId);
      const result = await KpiScoreLevelsService.getByIndicatorId(indicatorId);
      return res.status(200).json({
        success: true,
        message: "success",
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getKpi(req: Request, res: Response) {
    try {
      const result = await KpiScoreLevelsService.getKpi();
      return res.status(200).json({
        success: true,
        message: "success",
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

// Alias to prevent breaking if imported with previous typo
export const KpiIndicatorsSetUpController = KpiScoreLevelsController;
