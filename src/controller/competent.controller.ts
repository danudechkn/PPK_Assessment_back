import { Request, Response } from "express";
import CompetentService from "../service/competent.service";

class CompetentController {

  // --- Competencies ---

  static async getCompetent(req: Request, res: Response) {
    try {
      const result = await CompetentService.getAllCompetent();
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async createCompetent(req: Request, res: Response) {
    try {
      const result = await CompetentService.createCompetent(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }



  static async getCompetenciesByCategory(req: Request, res: Response) {
    try {
      const result = await CompetentService.getCompetenciesByCategory(Number(req.params.categoryId));
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateCompetent(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await CompetentService.updateCompetent(id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async deleteCompetent(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await CompetentService.deleteCompetent(id);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // --- Competencies_Categories ---

  static async getAllCategories(req: Request, res: Response) {
    try {
      const result = await CompetentService.getAllCategories();
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }


  static async getCategoriesFull(req: Request, res: Response) {
    try {
      const result = await CompetentService.getCategoriesFull();
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async createCategory(req: Request, res: Response) {
    try {
      const result = await CompetentService.createCategory(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateCategory(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await CompetentService.updateCategory(id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async deleteCategory(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await CompetentService.deleteCategory(id);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // --- Posts ---

  static async getBehavior(req: Request, res: Response) {
    try {
      const result = await CompetentService.getBehavior();
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async createBehavior(req: Request, res: Response) {
    try {
      const result = await CompetentService.createBehavior(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  static async getBehaviorsByCompetency(req: Request, res: Response) {
    try {
      const result = await CompetentService.getBehaviorsByCompetency(Number(req.params.competencyId));
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }


  static async updateBehavior(req: Request, res: Response) {
    try {
    
      const id = parseInt(req.params.id as string);
      const result = await CompetentService.updateBehavior(id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async deleteBehavior(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await CompetentService.deleteBehavior(id);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default CompetentController;
