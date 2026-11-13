import { z } from "zod";

/**
 * Schema สำหรับตรวจสอบข้อมูลการสร้าง HeaderSetting
 */
export const createHeaderSettingSchema = z.object({
  userid: z.coerce
    .number()
    .int({ message: "รหัสผู้ใช้งานต้องเป็นจำนวนเต็ม" })
    .positive({ message: "กรุณาระบุรหัสผู้ใช้งาน (userid) ให้ถูกต้อง" }),
  funcunitid: z.coerce
    .number()
    .int({ message: "รหัสกลุ่มงานต้องเป็นจำนวนเต็ม" })
    .positive({ message: "กรุณาระบุรหัสกลุ่มงาน (funcunitid) ให้ถูกต้อง" }),
  header_type_id: z.coerce
    .number()
    .int({ message: "ประเภทหัวหน้าต้องเป็นจำนวนเต็ม" })
    .positive({ message: "กรุณาระบุประเภทหัวหน้า (header_type_id) ให้ถูกต้อง" }),
  flag_status: z
    .string()
    .max(1, { message: "สถานะต้องมีความยาวไม่เกิน 1 ตัวอักษร" })
    .trim()
    .optional()
    .default("A"),
});

/**
 * Schema สำหรับตรวจสอบข้อมูลการแก้ไข HeaderSetting
 */
export const updateHeaderSettingSchema = z.object({
  userid: z.coerce
    .number()
    .int({ message: "รหัสผู้ใช้งานต้องเป็นจำนวนเต็ม" })
    .positive({ message: "กรุณาระบุรหัสผู้ใช้งาน (userid) ให้ถูกต้อง" })
    .optional(),
  funcunitid: z.coerce
    .number()
    .int({ message: "รหัสกลุ่มงานต้องเป็นจำนวนเต็ม" })
    .positive({ message: "กรุณาระบุรหัสกลุ่มงาน (funcunitid) ให้ถูกต้อง" })
    .optional(),
  header_type_id: z.coerce
    .number()
    .int({ message: "ประเภทหัวหน้าต้องเป็นจำนวนเต็ม" })
    .positive({ message: "กรุณาระบุประเภทหัวหน้า (header_type_id) ให้ถูกต้อง" })
    .optional(),
  flag_status: z
    .string()
    .max(1, { message: "สถานะต้องมีความยาวไม่เกิน 1 ตัวอักษร" })
    .trim()
    .optional(),
});

/**
 * Schema สำหรับตรวจสอบ Query Parameters สำหรับการค้นหาและแบ่งหน้า
 */
export const queryHeaderSettingSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  userid: z.coerce.number().int().positive().optional(),
  funcunitid: z.coerce.number().int().positive().optional(),
  header_type_id: z.coerce.number().int().positive().optional(),
  flag_status: z.string().trim().optional(),
  search: z.string().trim().optional(),
});

/**
 * Schema สำหรับตรวจสอบ ID ใน Request Parameters
 */
export const idParamSchema = z.object({
  id: z.coerce
    .number()
    .int({ message: "รหัส ID ต้องเป็นจำนวนเต็ม" })
    .positive({ message: "รหัส ID ต้องเป็นจำนวนเต็มบวก" }),
});

/**
 * Schema สำหรับตรวจสอบ funcunitid ใน Request Parameters
 */
export const funcunitParamSchema = z.object({
  funcunitid: z.coerce
    .number()
    .int({ message: "รหัสกลุ่มงานต้องเป็นจำนวนเต็ม" })
    .positive({ message: "รหัสกลุ่มงานต้องเป็นจำนวนเต็มบวก" }),
});

/**
 * Schema สำหรับตรวจสอบ userid ใน Request Parameters
 */
export const userParamSchema = z.object({
  userid: z.coerce
    .number()
    .int({ message: "รหัสผู้ใช้งานต้องเป็นจำนวนเต็ม" })
    .positive({ message: "รหัสผู้ใช้งานต้องเป็นจำนวนเต็มบวก" }),
});

// Type Inference (Single Source of Truth)
export type CreateHeaderSettingInput = z.infer<typeof createHeaderSettingSchema>;
export type UpdateHeaderSettingInput = z.infer<typeof updateHeaderSettingSchema>;
export type QueryHeaderSettingInput = z.infer<typeof queryHeaderSettingSchema>;
export type IdParamInput = z.infer<typeof idParamSchema>;
export type FuncunitParamInput = z.infer<typeof funcunitParamSchema>;
export type UserParamInput = z.infer<typeof userParamSchema>;
