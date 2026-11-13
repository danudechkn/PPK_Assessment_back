import { Op } from "sequelize";
import dbUser from "../../models/centralusers";
import dbppk from "../../models/ppkhosp-person";
import { ApiError } from "../../utils/api-response.util";
import {
  CreateHeaderSettingInput,
  QueryHeaderSettingInput,
  UpdateHeaderSettingInput,
} from "../../validators/headerSetting.validator";

export interface EnrichedHeaderSetting {
  id: number;
  userid: number;
  funcunitid: number;
  header_type_id: number;
  flag_status: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  personName?: string | null;
  funcunitName?: string | null;
  headerTypeNameTh?: string | null;
  headerTypeNameEn?: string | null;
}

export class HeaderSettingService {
  /**
   * สร้างการตั้งค่าหัวหน้าใหม่
   */
  static async create(input: CreateHeaderSettingInput) {
    const { userid, funcunitid, header_type_id, flag_status = "A" } = input;

    // 1. ตรวจสอบว่ามีการตั้งค่าซ้ำซ้อนหรือไม่
    const existing = await dbUser.HeaderSetting.findOne({
      where: {
        userid,
        funcunitid,
        header_type_id,
      },
    });

    if (existing) {
      if (existing.flag_status === "A") {
        throw new ApiError(
          "มีการตั้งค่าหัวหน้ารายนี้สำหรับกลุ่มงานและประเภทนี้อยู่ในระบบแล้ว",
          409,
        );
      }
      // หากเคยมีอยู่แล้วแต่สถานะไม่ active ให้เปิดใช้งานใหม่
      await existing.update({ flag_status: "A" });
      const enriched = await this.enrichRecords([existing]);
      return enriched[0];
    }

    // 2. สร้างรายการใหม่
    const created = await dbUser.HeaderSetting.create({
      userid,
      funcunitid,
      header_type_id,
      flag_status,
    });

    const enriched = await this.enrichRecords([created]);
    return enriched[0];
  }

  /**
   * ดึงรายการการตั้งค่าหัวหน้าทั้งหมด พร้อมรองรับการแบ่งหน้าและตัวกรอง
   */
  static async findAll(query: QueryHeaderSettingInput) {
    const { page = 1, limit = 10, userid, funcunitid, header_type_id, flag_status } = query;
    const offset = (Math.max(1, page) - 1) * limit;

    const where: Record<string, unknown> = {};

    if (userid !== undefined) where.userid = userid;
    if (funcunitid !== undefined) where.funcunitid = funcunitid;
    if (header_type_id !== undefined) where.header_type_id = header_type_id;
    if (flag_status !== undefined && flag_status.trim() !== "") {
      where.flag_status = flag_status.trim();
    }

    const { rows, count } = await dbUser.HeaderSetting.findAndCountAll({
      where,
      limit,
      offset,
      order: [["id", "DESC"]],
    });

    const enrichedRows = await this.enrichRecords(rows);

    return {
      rows: enrichedRows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
    };
  }

  /**
   * ดึงข้อมูลการตั้งค่าหัวหน้ารายการเดียวตาม ID
   */
  static async show(id: number) {
    const record = await dbUser.HeaderSetting.findOne({ where: { id } });
    if (!record) {
      throw new ApiError(`ไม่พบข้อมูลการตั้งค่าหัวหน้ารหัส ${id}`, 404);
    }

    const enriched = await this.enrichRecords([record]);
    return enriched[0];
  }

  /**
   * ปรับปรุงข้อมูลการตั้งค่าหัวหน้า
   */
  static async update(id: number, input: UpdateHeaderSettingInput) {
    const record = await dbUser.HeaderSetting.findOne({ where: { id } });
    if (!record) {
      throw new ApiError(`ไม่พบข้อมูลการตั้งค่าหัวหน้ารหัส ${id}`, 404);
    }

    const targetUserid = input.userid ?? record.userid;
    const targetFuncunitid = input.funcunitid ?? record.funcunitid;
    const targetHeaderTypeId = input.header_type_id ?? record.header_type_id;

    // ตรวจสอบว่าแก้ไขแล้วไปซ้ำกับรายการอื่นหรือไม่
    if (
      input.userid !== undefined ||
      input.funcunitid !== undefined ||
      input.header_type_id !== undefined
    ) {
      const duplicate = await dbUser.HeaderSetting.findOne({
        where: {
          id: { [Op.ne]: id },
          userid: targetUserid,
          funcunitid: targetFuncunitid,
          header_type_id: targetHeaderTypeId,
        },
      });

      if (duplicate && duplicate.flag_status === "A") {
        throw new ApiError(
          "ข้อมูลการตั้งค่าหัวหน้านี้ซ้ำซ้อนกับรายการอื่นที่มีอยู่ในระบบแล้ว",
          409,
        );
      }
    }

    await record.update(input);
    const enriched = await this.enrichRecords([record]);
    return enriched[0];
  }

  /**
   * ลบการตั้งค่าหัวหน้า (Soft delete โดยตั้ง flag_status = 'I' หรือ Hard delete ตามต้องการ)
   */
  static async delete(id: number, hardDelete = false) {
    const record = await dbUser.HeaderSetting.findOne({ where: { id } });
    if (!record) {
      throw new ApiError(`ไม่พบข้อมูลการตั้งค่าหัวหน้ารหัส ${id}`, 404);
    }

    if (hardDelete) {
      await record.destroy();
      return { id, deleted: true, mode: "hard" };
    }

    await record.update({ flag_status: "I" });
    return { id, deleted: true, mode: "soft" };
  }

  /**
   * ดึงการตั้งค่าหัวหน้าที่ใช้งานอยู่ตาม funcunitid
   */
  static async getByFuncunit(funcunitid: number) {
    const records = await dbUser.HeaderSetting.findAll({
      where: {
        funcunitid,
        flag_status: "A",
      },
      order: [["header_type_id", "ASC"]],
    });

    return await this.enrichRecords(records);
  }

  /**
   * ดึงการตั้งค่าหัวหน้าที่ใช้งานอยู่ตาม userid
   */
  static async getByUser(userid: number) {
    const records = await dbUser.HeaderSetting.findAll({
      where: {
        userid,
        flag_status: "A",
      },
      order: [["funcunitid", "ASC"]],
    });

    return await this.enrichRecords(records);
  }

  /**
   * Private Helper: เติมชื่อผู้ใช้งานและชื่อกลุ่มงานแบบ Batch Lookup O(1) เพื่อประสิทธิภาพสูงสุด
   */
  private static async enrichRecords(records: any[]): Promise<EnrichedHeaderSetting[]> {
    if (!records || records.length === 0) return [];

    const plainRecords: EnrichedHeaderSetting[] = records.map((r) =>
      r.get ? r.get({ plain: true }) : { ...r },
    );

    const userIds = Array.from(
      new Set(plainRecords.map((r) => Number(r.userid)).filter(Boolean)),
    );
    const funcUnitIds = Array.from(
      new Set(plainRecords.map((r) => Number(r.funcunitid)).filter(Boolean)),
    );
    const headerTypeIds = Array.from(
      new Set(plainRecords.map((r) => Number(r.header_type_id)).filter(Boolean)),
    );

    // 1. ดึงชื่อผู้ใช้งาน, กลุ่มงาน, และประเภทหัวหน้าแบบคู่ขนาน
    const [users, funcUnits, headerTypes] = await Promise.all([
      userIds.length > 0
        ? dbppk.AppUser.findAll({
            where: { userid: { [Op.in]: userIds } },
            attributes: ["userid"],
            include: [
              {
                model: dbppk.AppPerson,
                as: "Person",
                attributes: ["firstname", "lastname"],
              },
            ],
            raw: true,
            nest: true,
          }).catch(() => [])
        : [],
      funcUnitIds.length > 0
        ? dbppk.AppPersonFunctionalUnit.findAll({
            where: { FuncunitID: { [Op.in]: funcUnitIds } },
            attributes: ["FuncunitID", "FuncunitName"],
            raw: true,
          }).catch(() => [])
        : [],
      headerTypeIds.length > 0
        ? dbUser.HeaderType.findAll({
            where: { id: { [Op.in]: headerTypeIds } },
            attributes: ["id", "name_th", "name_en"],
            raw: true,
          }).catch(() => [])
        : [],
    ]);

    const userNameMap = new Map<number, string>();
    for (const u of users as any[]) {
      const uId = Number(u.userid);
      const fname = u.Person?.firstname || "";
      const lname = u.Person?.lastname || "";
      const fullName = `${fname} ${lname}`.trim();
      if (fullName) userNameMap.set(uId, fullName);
    }

    const funcUnitNameMap = new Map<number, string>();
    for (const f of funcUnits as any[]) {
      const fId = Number(f.FuncunitID);
      const name = f.FuncunitName || "";
      if (name) funcUnitNameMap.set(fId, name.trim());
    }

    const headerTypeMap = new Map<number, { name_th?: string; name_en?: string }>();
    for (const h of headerTypes as any[]) {
      const hId = Number(h.id);
      headerTypeMap.set(hId, {
        name_th: h.name_th ? String(h.name_th).trim() : undefined,
        name_en: h.name_en ? String(h.name_en).trim() : undefined,
      });
    }

    return plainRecords.map((item) => {
      const typeInfo = headerTypeMap.get(Number(item.header_type_id));
      return {
        ...item,
        personName: userNameMap.get(Number(item.userid)) || null,
        funcunitName: funcUnitNameMap.get(Number(item.funcunitid)) || null,
        headerTypeNameTh: typeInfo?.name_th || null,
        headerTypeNameEn: typeInfo?.name_en || null,
      };
    });
  }
}
