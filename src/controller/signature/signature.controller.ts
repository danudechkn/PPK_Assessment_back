import { Request, Response } from "express";
import { SignatureService } from "../../service/signature/signature.service";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";

export class SignatureController {
  static async getSignatureByUserid(req: Request, res: Response) {
    try {
      const authUser = (req as AuthenticatedRequest).user;
      const userid = Number(authUser?.userid);
      const type_id = Number(authUser?.type_id);
      const doctorid = Number(authUser?.doctorid);
      const result = await SignatureService.getSignatureByUserid(
        userid,
        type_id,
        doctorid,
      );
      return res
        .status(200)
        .json({ status: 200, success: true, data: result, message: "success" });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ status: 500, success: false, data: null, message: error });
    }
  }

  static async upsertSignature(req: Request, res: Response) {
    try {
      const authUser = (req as AuthenticatedRequest).user;
      const userid = Number(authUser?.userid);
      const type_id = Number(authUser?.type_id);
      const doctorid = Number(authUser?.doctorid);
      const result = await SignatureService.upsertSignature(
        userid,
        type_id,
        doctorid,
        req.body,
      );
      return res
        .status(200)
        .json({ status: 200, success: true, data: result, message: "success" });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ status: 500, success: false, data: null, message: error });
    }
  }
  static async edit(req: Request, res: Response) {
    // try {
    //   const authUser = (req as AuthenticatedRequest).user;
    //   const userid = Number(authUser?.userid);
    //   const type_id = Number(authUser?.type_id);
    //   const result = await SignatureService.edit(userid, type_id, req.body);
    //   return res.status(200).json({ status: 200, data: result });
    // } catch (error) {
    //   console.error(error);
    //   return res
    //     .status(500)
    //     .json({ status: 500, message: "Internal Server Error" });
    // }
  }
}
