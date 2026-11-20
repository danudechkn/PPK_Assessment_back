import { Request, Response } from "express";
import CompetentService from "../../service/competent/competent.service";
import { KpiScoreLevelsService } from "../../service/kpi/kpiScoreLevels.service";
import { respondError } from "../../utils/api-response.util";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";

export class CompetenciesController {
  static async getCompetent(req: Request, res: Response) {
    try {
      const result = await CompetentService.getAllCompetent(req.query);
      res.status(200).json({ success: true, ...result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async getCompetentById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await CompetentService.getCompetentById(id);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async getCompetentByUserAccess(req: Request, res: Response) {
    try {
      const userToken = (req as AuthenticatedRequest).user;

      // 💡 ลำดับความสำคัญ: ถ้าส่ง Query Params มาให้ใช้ก่อน ถ้าไม่ส่งให้ดึงจาก Token
      const offID = req.query.offID
        ? Number(req.query.offID)
        : Number(userToken?.OffID);
      const funcID = req.query.funcID
        ? Number(req.query.funcID)
        : Number(userToken?.funcUnitID);

      // ⚠️ ตรวจสอบว่าได้ค่าทั้ง 2 ตัวครบหรือไม่ (อนุญาตให้ >= 0 โดย 0 คือทั้งหมด / ทุกกลุ่มงาน)
      if (!Number.isSafeInteger(offID) || offID < 0) {
        return res
          .status(400)
          .json({ success: false, message: "ไม่พบข้อมูลระดับตำแหน่ง (posid)" });
      }
      if (!Number.isSafeInteger(funcID) || funcID < 0) {
        return res
          .status(400)
          .json({ success: false, message: "ไม่พบข้อมูลหน่วยงาน (funcid)" });
      }

      // เรียก Service
      const competency =
        await CompetentService.getCompetencyByPosAndFuncAndLevel(offID, funcID);
      const kpi = await KpiScoreLevelsService.getKpi();

      if (!competency || competency?.length <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "ไม่พบข้อมูลสมรรถนะ" });
      }
      res.status(200).json({ success: true, data: { kpi, competency } });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async getCompetenciesByCategory(req: Request, res: Response) {
    try {
      const result = await CompetentService.getCompetenciesByCategory(
        Number(req.params.categoryId),
      );
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async createCompetent(req: Request, res: Response) {
    try {
      const result = await CompetentService.createCompetent(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async updateCompetent(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await CompetentService.updateCompetent(id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async deleteCompetent(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await CompetentService.deleteCompetent(id);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }
}

export default CompetenciesController;

