import db from "../../models/product";

export class KpiScoreLevelsService {
  /**
   * ดึงรายการระดับคะแนน (รองรับกรองตาม kpi_indicator_id, pagination และดึงทั้งหมด)
   */
  static async index(query: any) {
    const isAll = query?.all === "true" || query?.all === true;
    const page = Number(query?.page) || 1;
    const limit = isAll ? undefined : Number(query?.limit) || 10;
    const offset = isAll ? undefined : (page - 1) * (limit || 10);

    const where: any = {};
    if (query?.kpi_indicator_id) {
      where.kpi_indicator_id = Number(query.kpi_indicator_id);
    }

    const list = await db.KpiScoreLevels.findAndCountAll({
      where,
      include: [{ model: db.KpiIndicators, as: "kpi_indicator" }],
      order: [
        ["kpi_indicator_id", "ASC"],
        ["id", "ASC"],
      ],
      ...(limit !== undefined ? { limit, offset } : {}),
    });

    return {
      data: list.rows,
      total: list.count,
      page: isAll ? 1 : page,
      limit: isAll ? list.count : limit,
    };
  }

  /**
   * สร้างหรืออัปเดตเกณฑ์ระดับคะแนน (รองรับ bulkCreate และ updateOnDuplicate)
   */
  static async create(body: any) {
    const array_items = Array.isArray(body)
      ? body
      : Array.isArray(body?.array_items)
        ? body.array_items
        : body?.criteria_text || body?.score !== undefined
          ? [body]
          : [];

    if (!array_items || !array_items.length) {
      throw new Error("array_items is required");
    }

    const payload_array = array_items.map((item: any) => {
      const indicatorId = Number(item.kpi_indicator_id);
      if (!indicatorId) {
        throw new Error("kpi_indicator_id is required");
      }
      if (item.score === undefined || item.score === null) {
        throw new Error("score is required");
      }

      return {
        kpi_indicator_id: indicatorId,
        criteria_text: item.criteria_text || "",
        score: Number(item.score),
        weight: item.weight != null ? item.weight : 0,
        operator_type: item.operator_type || "EQ",
        expected_score:
          item.expected_score != null ? Number(item.expected_score) : null,
      };
    });

    // ใช้ updateOnDuplicate เพื่อให้อัปเดตข้อมูลอัตโนมัติหากมีคู่ (kpi_indicator_id, score) อยู่แล้ว
    const result = await db.KpiScoreLevels.bulkCreate(payload_array, {
      updateOnDuplicate: [
        "criteria_text",
        "weight",
        "operator_type",
        "expected_score",
        "updatedAt",
      ],
    });

    return result;
  }

  /**
   * ดึงรายละเอียดระดับคะแนนตาม ID
   */
  static async show(id: number) {
    if (!id) throw new Error("id is required");

    const data = await db.KpiScoreLevels.findOne({
      where: { id },
      include: [{ model: db.KpiIndicators, as: "kpi_indicator" }],
    });

    if (!data) {
      throw new Error("KPI score level not found");
    }

    return data;
  }

  /**
   * อัปเดตข้อมูลระดับคะแนนตาม ID
   */
  static async update(id: number, body: any) {
    if (!id) throw new Error("id is required");

    const {
      kpi_indicator_id,
      criteria_text,
      score,
      weight,
      operator_type,
      expected_score,
    } = body;

    const updateData: any = {};
    if (kpi_indicator_id !== undefined)
      updateData.kpi_indicator_id = Number(kpi_indicator_id);
    if (criteria_text !== undefined) updateData.criteria_text = criteria_text;
    if (score !== undefined) updateData.score = Number(score);
    if (weight !== undefined) updateData.weight = weight;
    if (operator_type !== undefined) updateData.operator_type = operator_type;
    if (expected_score !== undefined) {
      updateData.expected_score =
        expected_score != null ? Number(expected_score) : null;
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("No fields to update");
    }

    const [affected] = await db.KpiScoreLevels.update(updateData, {
      where: { id },
    });
    if (affected === 0) {
      const exists = await db.KpiScoreLevels.findByPk(id);
      if (!exists) throw new Error("KPI score level not found");
    }

    return true;
  }

  /**
   * ลบระดับคะแนนตาม ID
   */
  static async destroy(id: number) {
    if (!id) {
      throw new Error("id is required");
    }
    const affected = await db.KpiScoreLevels.destroy({ where: { id } });
    if (affected === 0) {
      throw new Error("KPI score level not found");
    }
    return true;
  }

  /**
   * ดึงระดับคะแนนทั้งหมดของตัวชี้วัดนั้นๆ (By Indicator ID)
   */
  static async getByIndicatorId(kpi_indicator_id: number) {
    if (!kpi_indicator_id) throw new Error("kpi_indicator_id is required");

    return db.KpiScoreLevels.findAll({
      where: { kpi_indicator_id },
      order: [["score", "ASC"]],
    });
  }

  static async getKpi() {
    const data = await db.KpiIndicators.findAll({
      where: { status: "Y" },
      attributes: ["id", "name"],
      include: [
        {
          model: db.KpiScoreLevels,
          as: "score_levels",
          attributes: [
            "id",
            "kpi_indicator_id",
            "criteria_text",
            "score",
            "weight",
            "expected_score",
            "operator_type",
          ],
        },
      ],
      order: [
        ["id", "ASC"],
        [{ model: db.KpiScoreLevels, as: "score_levels" }, "id", "ASC"],
      ],
    });

    const formatData = data.map((item: any) => {
      const itemsList = (item.score_levels || []).map((lvl: any) => ({
        id: lvl.id,
        kpi_indicator_id: lvl.kpi_indicator_id,
        criteria_text: lvl.criteria_text,
        score: lvl.score,
        weight: lvl.weight,
        expected_score: lvl.expected_score,
        operator_type: lvl.operator_type,
      }));

      return {
        id: item.id,
        name: item.name,
        // item: itemsList,
        items: itemsList,
      };
    });

    return formatData;
  }
}
