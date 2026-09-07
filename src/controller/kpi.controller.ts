import { Request, Response } from "express";
import KpiService from "../service/kpi.service";

class KpiController {
  static async getIndicators(req: Request, res: Response) {
    try {
      const result = await KpiService.getIndicators();
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async getIndicatorById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await KpiService.getIndicatorById(id);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async createIndicator(req: Request, res: Response) {
    try {
      const result = await KpiService.createIndicator(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async createScoreLevels(req: Request, res: Response) {
    try {
      const result = await KpiService.createScoreLevels(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async createAssessmentValues(req: Request, res: Response) {
    try {
      const result = await KpiService.createAssessmentValues(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async getAssessmentValues(req: Request, res: Response) {
    try {
      const result = await KpiService.getAssessmentValues(req.query);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async getUserAssessmentValues(req: Request, res: Response) {
    try {
      const result = await KpiService.getAssessmentValues(
        { ...req.query, value_order_id: req.params.orderId },
        true
      );
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async getAssessmentValueById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await KpiService.getAssessmentValueById(id);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async updateAssessmentValue(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await KpiService.updateAssessmentValue(id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async updateAssessmentValueScores(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await KpiService.updateAssessmentValueScores(id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async deleteAssessmentValue(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await KpiService.deleteAssessmentValue(id);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async getScoreLevels(req: Request, res: Response) {
    try {
      const result = await KpiService.getScoreLevels();
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async getScoreLevelById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await KpiService.getScoreLevelById(id);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async updateScoreLevel(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await KpiService.updateScoreLevel(id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async deleteScoreLevel(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await KpiService.deleteScoreLevel(id);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async updateIndicator(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await KpiService.updateIndicator(id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async deleteIndicator(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await KpiService.deleteIndicator(id);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }

  static async submitAssessmentValue(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await KpiService.submitAssessmentValue(id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.status || 400).json({ success: false, message: error.message });
    }
  }
}

export default KpiController;
