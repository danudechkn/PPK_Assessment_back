import { Request, Response } from "express";
import { HeaderTypeService } from "../../service/header-type/headerType.service";
import { ApiError, respondError } from "../../utils/api-response.util";
import {
  createHeaderTypeSchema,
  headerTypeIdParamSchema,
  queryHeaderTypeSchema,
  updateHeaderTypeSchema,
} from "../../validators/headerType.validator";

export class HeaderTypeController {
  /**
   * สร้างประเภทหัวหน้าใหม่
   * POST /api/admin/header-types
   */
  static async create(req: Request, res: Response) {
    try {
      const parsedBody = createHeaderTypeSchema.safeParse(req.body);
      if (!parsedBody.success) {
        const firstError = parsedBody.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง";
        throw new ApiError(firstError, 400);
      }

      const data = await HeaderTypeService.create(parsedBody.data);

      return res.status(201).json({
        success: true,
        message: "บันทึกข้อมูลประเภทหัวหน้าเรียบร้อยแล้ว",
        data,
      });
    } catch (error) {
      return respondError(res, error);
    }
  }

  /**
   * ดึงรายการประเภทหัวหน้าทั้งหมด (Pagination & Search)
   * GET /api/admin/header-types
   */
  static async index(req: Request, res: Response) {
    try {
      const parsedQuery = queryHeaderTypeSchema.safeParse(req.query);
      if (!parsedQuery.success) {
        const firstError =
          parsedQuery.error.issues[0]?.message || "พารามิเตอร์การค้นหาไม่ถูกต้อง";
        throw new ApiError(firstError, 400);
      }

      const result = await HeaderTypeService.findAll(parsedQuery.data);

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      return respondError(res, error);
    }
  }

  /**
   * ดึงประเภทหัวหน้าทั้งหมดที่ Active สำหรับ Dropdown/Select
   * GET /api/admin/header-types/active
   */
  static async getActive(req: Request, res: Response) {
    try {
      const data = await HeaderTypeService.getAllActive();

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return respondError(res, error);
    }
  }

  /**
   * ดูข้อมูลประเภทหัวหน้ารายการเดียว
   * GET /api/admin/header-types/:id
   */
  static async show(req: Request, res: Response) {
    try {
      const parsedParams = headerTypeIdParamSchema.safeParse(req.params);
      if (!parsedParams.success) {
        const firstError = parsedParams.error.issues[0]?.message || "รหัสอ้างอิงไม่ถูกต้อง";
        throw new ApiError(firstError, 400);
      }

      const data = await HeaderTypeService.show(parsedParams.data.id);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return respondError(res, error);
    }
  }

  /**
   * ปรับปรุงข้อมูลประเภทหัวหน้า
   * PUT /api/admin/header-types/:id
   */
  static async update(req: Request, res: Response) {
    try {
      const parsedParams = headerTypeIdParamSchema.safeParse(req.params);
      if (!parsedParams.success) {
        const firstError = parsedParams.error.issues[0]?.message || "รหัสอ้างอิงไม่ถูกต้อง";
        throw new ApiError(firstError, 400);
      }

      const parsedBody = updateHeaderTypeSchema.safeParse(req.body);
      if (!parsedBody.success) {
        const firstError =
          parsedBody.error.issues[0]?.message || "ข้อมูลสำหรับแก้ไขไม่ถูกต้อง";
        throw new ApiError(firstError, 400);
      }

      const data = await HeaderTypeService.update(
        parsedParams.data.id,
        parsedBody.data,
      );

      return res.status(200).json({
        success: true,
        message: "ปรับปรุงข้อมูลประเภทหัวหน้าเรียบร้อยแล้ว",
        data,
      });
    } catch (error) {
      return respondError(res, error);
    }
  }

  /**
   * ลบประเภทหัวหน้า
   * DELETE /api/admin/header-types/:id
   */
  static async delete(req: Request, res: Response) {
    try {
      const parsedParams = headerTypeIdParamSchema.safeParse(req.params);
      if (!parsedParams.success) {
        const firstError = parsedParams.error.issues[0]?.message || "รหัสอ้างอิงไม่ถูกต้อง";
        throw new ApiError(firstError, 400);
      }

      const hardDelete = req.query.hard === "true" || req.query.hard === "1";
      const result = await HeaderTypeService.delete(parsedParams.data.id, hardDelete);

      return res.status(200).json({
        success: true,
        message: "ลบข้อมูลประเภทหัวหน้าเรียบร้อยแล้ว",
        ...result,
      });
    } catch (error) {
      return respondError(res, error);
    }
  }
}

