import { Request, Response } from "express";
import CategoriesService from "../../service/competent/categories.service";
import { respondError } from "../../utils/api-response.util";

export class CategoriesController {
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
}

export default CategoriesController;

