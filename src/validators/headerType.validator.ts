import { z } from "zod";

/**
 * Schema สำหรับตรวจสอบข้อมูลการสร้าง HeaderType (ประเภทหัวหน้า)
 */
export const createHeaderTypeSchema = z.object({
  name_th: z
    .string()
    .min(1, { message: "กรุณาระบุชื่อประเภทหัวหน้าภาษาไทย" })
    .max(150, { message: "ชื่อภาษาไทยต้องไม่เกิน 150 ตัวอักษร" })
    .trim(),
  name_en: z
    .string()
    .max(150, { message: "ชื่อภาษาอังกฤษต้องไม่เกิน 150 ตัวอักษร" })
    .trim()
    .optional()
    .nullable(),
  flag_status: z
    .string()
    .max(1, { message: "สถานะต้องมีความยาวไม่เกิน 1 ตัวอักษร" })
    .trim()
    .optional()
    .default("A"),
});

/**
 * Schema สำหรับตรวจสอบข้อมูลการแก้ไข HeaderType
 */
export const updateHeaderTypeSchema = z.object({
  name_th: z
    .string()
    .min(1, { message: "กรุณาระบุชื่อประเภทหัวหน้าภาษาไทย" })
    .max(150, { message: "ชื่อภาษาไทยต้องไม่เกิน 150 ตัวอักษร" })
    .trim()
    .optional(),
  name_en: z
    .string()
    .max(150, { message: "ชื่อภาษาอังกฤษต้องไม่เกิน 150 ตัวอักษร" })
    .trim()
    .optional()
    .nullable(),
  flag_status: z
    .string()
    .max(1, { message: "สถานะต้องมีความยาวไม่เกิน 1 ตัวอักษร" })
    .trim()
    .optional(),
});

/**
 * Schema สำหรับค้นหาและแบ่งหน้า HeaderType
 */
export const queryHeaderTypeSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  flag_status: z.string().trim().optional(),
});

/**
 * Schema สำหรับพารามิเตอร์ ID
 */
export const headerTypeIdParamSchema = z.object({
  id: z.coerce
    .number()
    .int({ message: "รหัส ID ต้องเป็นจำนวนเต็ม" })
    .positive({ message: "รหัส ID ต้องเป็นจำนวนเต็มบวก" }),
});

export type CreateHeaderTypeInput = z.infer<typeof createHeaderTypeSchema>;
export type UpdateHeaderTypeInput = z.infer<typeof updateHeaderTypeSchema>;
export type QueryHeaderTypeInput = z.infer<typeof queryHeaderTypeSchema>;
export type HeaderTypeIdParamInput = z.infer<typeof headerTypeIdParamSchema>;
