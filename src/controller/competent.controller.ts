import { Request, Response } from "express";
import CompetentService from "../service/competent.service";
import { respond, respondError } from "../utils/api-response.util";

class CompetentController {

  static async getCategoryById(req: Request, res: Response) {
    return respond(res, () => CompetentService.getCategoryById(Number(req.params.id)));
  }

  static async getCompetentById(req: Request, res: Response) {
    return respond(res, () => CompetentService.getCompetentById(Number(req.params.id)));
  }

  static async getBehaviorById(req: Request, res: Response) {
    return respond(res, () => CompetentService.getBehaviorById(Number(req.params.id)));
  }


  // --- Competencies ---

  static async getCompetent(req: Request, res: Response) {
    try {
      const result = await CompetentService.getAllCompetent(req.query);
      res.status(200).json({ success: true, ...result });
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



  static async getCompetenciesByCategory(req: Request, res: Response) {
    try {
      const result = await CompetentService.getCompetenciesByCategory(Number(req.params.categoryId));
      res.status(200).json({ success: true, data: result });
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

  // --- Competencies_Categories ---

  static async getAllCategories(req: Request, res: Response) {
    try {
      const result = await CompetentService.getAllCategories(req.query);
      res.status(200).json({ success: true, ...result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }


  static async getCategoriesFull(req: Request, res: Response) {
    try {
      const result = await CompetentService.getCategoriesFull();
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async createCategory(req: Request, res: Response) {
    try {
      const result = await CompetentService.createCategory(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async updateCategory(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await CompetentService.updateCategory(id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async deleteCategory(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await CompetentService.deleteCategory(id);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  // --- Posts ---

  static async getBehavior(req: Request, res: Response) {
    try {
      const result = await CompetentService.getBehavior(req.query);
      res.status(200).json({ success: true, ...result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async createBehavior(req: Request, res: Response) {
    try {
      const result = await CompetentService.createBehavior(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }
  static async getBehaviorsByCompetency(req: Request, res: Response) {
    try {
      const result = await CompetentService.getBehaviorsByCompetency(Number(req.params.competencyId));
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }


  static async updateBehavior(req: Request, res: Response) {
    try {
    
      const id = Number(req.params.id);
      const result = await CompetentService.updateBehavior(id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }

  static async deleteBehavior(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await CompetentService.deleteBehavior(id);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      respondError(res, error);
    }
  }
}

export default CompetentController;
