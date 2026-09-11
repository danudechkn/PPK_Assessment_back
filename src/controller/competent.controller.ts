import { Request, Response } from "express";
import CompetentService from "../service/competent/competent.service";
import CategoriesService from "../service/competent/categories.service";
import BehaviorsService from "../service/competent/behaviors.service";
import { respondError } from "../utils/api-response.util";
import { AuthenticatedRequest } from "../middleware/auth.middleware"; //

class CompetentController {
  // ==========================================
  // Competencies Categories
  // ==========================================

  static async getAllCategories(req: Request, res: Response) {
    try {
      const result = await CategoriesService.getAllCategories(req.query);
      res.status(200).json({ success: true, ...result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async getCategoriesFull(req: Request, res: Response) {
    try {
      const result = await CategoriesService.getCategoriesFull();
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async getCategoryById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await CategoriesService.getCategoryById(id);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async createCategory(req: Request, res: Response) {
    try {
      const result = await CategoriesService.createCategory(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async updateCategory(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await CategoriesService.updateCategory(id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async deleteCategory(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await CategoriesService.deleteCategory(id);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  // ==========================================
  // Competencies
  // ==========================================

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

      // console.log(userToken);
      // 💡 ลำดับความสำคัญ: ถ้าส่ง Query Params มาให้ใช้ก่อน ถ้าไม่ส่งให้ดึงจาก Token
      const offID = req.query.offid
        ? Number(req.query.offid)
        : Number(userToken?.OffID);
      const funcId = req.query.funcid
        ? Number(req.query.funcid)
        : Number(userToken?.funcUnitID);
      // ⚠️ ตรวจสอบว่าได้ค่าทั้ง 2 ตัวครบหรือไม่
      if (!Number.isSafeInteger(offID) || offID <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "ไม่พบข้อมูลระดับตำแหน่ง (posid)" });
      }
      if (!Number.isSafeInteger(funcId) || funcId <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "ไม่พบข้อมูลหน่วยงาน (funcid)" });
      }
      // เรียก Service
      const result = await CompetentService.getCompetencyByPosAndFuncAndLevel(
        offID,
        funcId,
      );
      res.status(200).json({ success: true, data: result });
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

  // ==========================================
  // Behaviors
  // ==========================================

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

export default CompetentController;
