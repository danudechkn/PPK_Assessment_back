import { Request, Response } from "express";
import { AllInOneService } from "../../services/all_in_one/allInOne.service";

export class AllInOneController {
  static async index(req: Request, res: Response) {
    try {
      const query = req.query;
      const data = await AllInOneService.index(query);
      return res.status(200).json({ success: true, ...data });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "Internal Server Error",
      });
    }
  }
}
