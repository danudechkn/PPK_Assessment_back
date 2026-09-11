import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { getPersonService } from "../../service/get-person/getPerson.service";

export class GetPersonController {
  static async headGetPersonByFuncUnit(req: Request, res: Response) {
    try {
      const funcUnitID = (req as AuthenticatedRequest).user?.funcUnitID;
      const userID = (req as AuthenticatedRequest).user?.userid;

      //   console.log(userID);
      const result = await getPersonService.headGetPersonByFuncUnit(
        Number(userID),
        Number(funcUnitID),
      );
      if (!result) {
        return res
          .status(404)
          .json({ message: "ไม่พบข้อมูล", success: false, data: [] });
      }
      return res
        .status(200)
        .json({ message: "ดึงข้อมูลสำเร็จ", success: true, data: result });
    } catch (error: any) {
      return res.status(500).json({
        message: "เกิดข้อผิดพลาดในการดึงข้อมูล",
        success: false,
        error: error.message,
      });
    }
  }
}
