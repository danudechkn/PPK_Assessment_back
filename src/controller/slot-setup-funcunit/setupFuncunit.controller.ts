import { Request, Response } from "express";
import { SlotSetupFuncunitService } from "../../service/slot-setup-funcunit/slotSetupFuncunit.service";

export class SetupFuncunitController {
  static async personInDBCentralusers(req: Request, res: Response) {
    try {
      const { name, cid } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await SlotSetupFuncunitService.personInDBCentralusers(
        name as string,
        cid as string,
        page,
        limit,
      );

      return res.status(200).json({
        success: true,
        status: "success",
        ...result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        status: "error",
        message: error.message,
      });
    }
  }
  static async getPersonByUserID(req: Request, res: Response) {
    try {
      const { userid } = req.body;
      if (!userid) {
        throw new Error("User ID is required");
      }
      const result = await SlotSetupFuncunitService.getPersonByUserID(
        parseInt(userid),
      );
      return res.status(200).json({
        success: true,
        status: "success",
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        status: "error",
        message: error.message,
      });
    }
  }

  static async createOrEditSetUpPersonFuncunit(req: Request, res: Response) {
    try {
      const result =
        await SlotSetupFuncunitService.createOrEditSetUpPersonFuncunit(
          req.body,
        );
      return res.status(200).json({
        success: true,
        status: "success",
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        status: "error",
        message: error.message,
      });
    }
  }
}
