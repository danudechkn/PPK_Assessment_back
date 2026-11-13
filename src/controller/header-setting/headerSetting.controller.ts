import { Request, Response } from "express";
import { HeaderSettingService } from "../../service/header-setting/headerSetting.service";
import { ApiError, respondError } from "../../utils/api-response.util";
import {
  createHeaderSettingSchema,
  funcunitParamSchema,
  idParamSchema,
  queryHeaderSettingSchema,
  updateHeaderSettingSchema,
  userParamSchema,
} from "../../validators/headerSetting.validator";

export class HeaderSettingController {
  /**
   * สร้างการตั้งค่าหัวหน้าใหม่
   * POST /api/admin/header-settings
   */
  static async create(req: Request, res: Response) {
    try {
      const parsedBody = createHeaderSettingSchema.safeParse(req.body);
      if (!parsedBody.success) {
        const firstError = parsedBody.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง";
        throw new ApiError(firstError, 400);
      }

      const data = await HeaderSettingService.create(parsedBody.data);

      return res.status(201).json({
        success: true,
        message: "บันทึกข้อมูลการตั้งค่าหัวหน้าเรียบร้อยแล้ว",
        data,
      });
    } catch (error) {
      return respondError(res, error);
    }
  }

  /**
   * ดึงรายการการตั้งค่าหัวหน้าทั้งหมด พร้อม pagination และ filter
   * GET /api/admin/header-settings
   */
  static async index(req: Request, res: Response) {
    try {
      const parsedQuery = queryHeaderSettingSchema.safeParse(req.query);
      if (!parsedQuery.success) {
        const firstError = parsedQuery.error.issues[0]?.message || "พารามิเตอร์การค้นหาไม่ถูกต้อง";
        throw new ApiError(firstError, 400);
      }

      const result = await HeaderSettingService.findAll(parsedQuery.data);

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      return respondError(res, error);
    }
  }

  /**
   * ดึงข้อมูลการตั้งค่าหัวหน้ารายการเดียว
   * GET /api/admin/header-settings/:id
   */
  static async show(req: Request, res: Response) {
    try {
      const parsedParams = idParamSchema.safeParse(req.params);
      if (!parsedParams.success) {
        const firstError = parsedParams.error.issues[0]?.message || "รหัสอ้างอิงไม่ถูกต้อง";
        throw new ApiError(firstError, 400);
      }

      const data = await HeaderSettingService.show(parsedParams.data.id);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return respondError(res, error);
    }
  }

  /**
   * ปรับปรุงข้อมูลการตั้งค่าหัวหน้า
   * PUT /api/admin/header-settings/:id
   */
  static async update(req: Request, res: Response) {
    try {
      const parsedParams = idParamSchema.safeParse(req.params);
      if (!parsedParams.success) {
        const firstError = parsedParams.error.issues[0]?.message || "รหัสอ้างอิงไม่ถูกต้อง";
        throw new ApiError(firstError, 400);
      }

      const parsedBody = updateHeaderSettingSchema.safeParse(req.body);
      if (!parsedBody.success) {
        const firstError = parsedBody.error.issues[0]?.message || "ข้อมูลสำหรับแก้ไขไม่ถูกต้อง";
        throw new ApiError(firstError, 400);
      }

      const data = await HeaderSettingService.update(
        parsedParams.data.id,
        parsedBody.data,
      );

      return res.status(200).json({
        success: true,
        message: "ปรับปรุงข้อมูลการตั้งค่าหัวหน้าเรียบร้อยแล้ว",
        data,
      });
    } catch (error) {
      return respondError(res, error);
    }
  }

  /**
   * ลบการตั้งค่าหัวหน้า
   * DELETE /api/admin/header-settings/:id
   */
  static async delete(req: Request, res: Response) {
    try {
      const parsedParams = idParamSchema.safeParse(req.params);
      if (!parsedParams.success) {
        const firstError = parsedParams.error.issues[0]?.message || "รหัสอ้างอิงไม่ถูกต้อง";
        throw new ApiError(firstError, 400);
      }

      const hardDelete = req.query.hard === "true" || req.query.hard === "1";
      const result = await HeaderSettingService.delete(parsedParams.data.id, hardDelete);

      return res.status(200).json({
        success: true,
        message: "ลบข้อมูลการตั้งค่าหัวหน้าเรียบร้อยแล้ว",
        ...result,
      });
    } catch (error) {
      return respondError(res, error);
    }
  }

  /**
   * ดึงการตั้งค่าหัวหน้าตามกลุ่มงาน (funcunitid)
   * GET /api/admin/header-settings/by-funcunit/:funcunitid
   */
  static async getByFuncunit(req: Request, res: Response) {
    try {
      const parsedParams = funcunitParamSchema.safeParse(req.params);
      if (!parsedParams.success) {
        const firstError = parsedParams.error.issues[0]?.message || "รหัสกลุ่มงานไม่ถูกต้อง";
        throw new ApiError(firstError, 400);
      }

      const data = await HeaderSettingService.getByFuncunit(parsedParams.data.funcunitid);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return respondError(res, error);
    }
  }

  /**
   * ดึงการตั้งค่าหัวหน้าตามผู้ใช้งาน (userid)
   * GET /api/admin/header-settings/by-user/:userid
   */
  static async getByUser(req: Request, res: Response) {
    try {
      const parsedParams = userParamSchema.safeParse(req.params);
      if (!parsedParams.success) {
        const firstError = parsedParams.error.issues[0]?.message || "รหัสผู้ใช้งานไม่ถูกต้อง";
        throw new ApiError(firstError, 400);
      }

      const data = await HeaderSettingService.getByUser(parsedParams.data.userid);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return respondError(res, error);
    }
  }
}
