import { Request, Response } from "express";
import { KpiIndicatorsService } from "../../service/kpi/kpiIndicatorsSetup.service";

export class KpiSetUpController {
  static async index(req: Request, res: Response) {
    try {
      const result = await KpiIndicatorsService.index(req.query);
      if (!result) {
        return res.status(200).json({
          success: false,
          message: "Kpi not found",
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
  static async create(req: Request, res: Response) {
    try {
      const result = await KpiIndicatorsService.create(req.body);
      return res.status(201).json({
        success: true,
        message: "KPI Indicator created successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async show(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await KpiIndicatorsService.show(id);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "KPI Indicator not found",
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
      await KpiIndicatorsService.update(id, req.body);
      return res.status(200).json({
        success: true,
        message: "KPI Indicator updated successfully",
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await KpiIndicatorsService.destroy(id);
      return res.status(200).json({
        success: true,
        message: "KPI Indicator deleted successfully",
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const KpiIndicatorsSetupController = KpiSetUpController;

