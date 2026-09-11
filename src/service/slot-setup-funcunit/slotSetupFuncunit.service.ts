import dbppk from "../../models/ppkhosp-person";
import dbuser from "../../models/centralusers";
import { Op } from "sequelize";

export class SlotSetupFuncunitService {
  static async personInDBCentralusers(
    name?: string,
    cid?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const currentPage = Math.max(1, Number(page) || 1);
    const currentLimit = Math.max(1, Number(limit) || 10);
    const offset = (currentPage - 1) * currentLimit;

    const where: any = {};
    if (name) {
      where[Op.or] = [
        { firstname: { [Op.like]: `%${name}%` } },
        { lastname: { [Op.like]: `%${name}%` } },
      ];
    }
    if (cid) {
      where.CITIZEN = cid; // 👈 ใน AppPerson คอลัมน์ชื่อ CITIZEN
    }

    // 1. แก้เป็น dbuser.User (ไม่มี s)
    const users = await dbuser.User.findAll({
      attributes: ["userid"],
      where: {
        active: "Y",
      },
    });
    const userIds = users.map((user: any) => user.userid);

    const { rows: person, count } = await dbppk.AppPerson.findAndCountAll({
      where,
      attributes: ["id", "firstname", "lastname", "PosID", "OffID"],
      distinct: true,
      limit: currentLimit,
      offset: offset,
      order: [["id", "ASC"]],
      include: [
        {
          model: dbppk.AppUser,
          as: "Users",
          attributes: ["userid"],
          where: { userid: { [Op.in]: userIds } },
        },
        {
          model: dbppk.AppPositions,
          as: "Position",
          required: false,
          attributes: ["Positionname"],
        },
        {
          model: dbppk.AppPersonFunctionalUnit,
          as: "FuncUnit",
          required: false,
          attributes: ["FuncunitName"],
        },
        {
          model: dbppk.PersonnalOfficeGroup,
          as: "OfficePerson",
          required: false,
          attributes: ["offname"],
        },
      ],
    });

    // 1. ดึง userid เฉพาะของคนในหน้าปัจจุบัน (เพื่อความเร็วและแม่นยำ)
    const currentPageUserIds = person
      .map((p: any) => p.Users?.[0]?.userid)
      .filter(Boolean);
    // 2. ดึง slot ของคนในหน้านี้
    const slots = await dbuser.SlotSetupFuncunit.findAll({
      where: {
        userid: { [Op.in]: currentPageUserIds },
        active: "Y",
      },
    });
    // 3. ดึงชื่อหน่วยงานที่ถูกตั้งค่าไว้ใน slot
    const slotFuncUnitIds = slots
      .map((s: any) => Number(s.FuncUnitID))
      .filter(Boolean);
    const funcUnitNameSetup = await dbppk.AppPersonFunctionalUnit.findAll({
      where: {
        FuncunitID: { [Op.in]: slotFuncUnitIds },
      },
      attributes: ["FuncunitID", "FuncunitName"],
    });
    // 4. ทำ Map จับคู่: FuncunitID -> FuncunitName
    const funcUnitNameMap = new Map<number, string>();
    funcUnitNameSetup.forEach((f: any) => {
      funcUnitNameMap.set(Number(f.FuncunitID), f.FuncunitName || "");
    });
    // 5. ทำ Map จับคู่: userid -> FuncUnitID ของแต่ละคน
    const userSlotMap = new Map<number, number>();
    slots.forEach((s: any) => {
      userSlotMap.set(Number(s.userid), Number(s.FuncUnitID));
    });
    // 6. Map ข้อมูลส่งกลับ
    const formatPerson = person.map((p: any, index: number) => {
      const fullname = `${p.firstname} ${p.lastname}`.trim();
      const position = p.Position?.Positionname || "";
      const office = p.OfficePerson?.offname || "";
      const funcunit = p.FuncUnit?.FuncunitName || "";
      const currentUserId = p.Users?.[0]?.userid;
      const assignedSlotFuncUnitId = currentUserId
        ? userSlotMap.get(Number(currentUserId))
        : null;
      // 🎯 ถ้ามี slot ให้ดึงชื่อกลุ่มงานที่ถูกย้ายไปช่วยงาน ถ้าไม่มีให้แสดงว่าทำงานที่เดิม
      const isWorking = assignedSlotFuncUnitId
        ? funcUnitNameMap.get(assignedSlotFuncUnitId)
        : "ทำงานที่กลุ่มงานนั้นอยู่เเล้ว";
      return {
        no: index + 1,
        userid: currentUserId || null,
        personid: p.id,
        fullname: fullname,
        position: position,
        office: office,
        funcunit: funcunit,
        isWorking: isWorking,
      };
    });

    return {
      data: formatPerson,
      pagination: {
        page: currentPage,
        limit: currentLimit,
        total: count,
        totalPages: Math.ceil(count / currentLimit),
      },
    };
  }

  static async getPersonByUserID(userid: number) {
    const person = await dbppk.AppUser.findOne({
      where: {
        userid: userid,
        // active: "Y",
      },
      attributes: ["userid"],
      include: [
        {
          model: dbppk.AppPerson,
          as: "Person",
          attributes: [
            "id",
            "firstname",
            "lastname",
            "PosID",
            "Poslevel",
            "OffID",
            "GroID",
            "FuncUnitID",
          ],
          include: [
            {
              model: dbppk.AppPositions,
              as: "Position",
              required: false,
              attributes: ["Positionname"],
            },
            {
              model: dbppk.AppPersonFunctionalUnit,
              as: "FuncUnit",
              required: false,
              attributes: ["FuncunitID", "FuncunitName"],
            },
            {
              model: dbppk.PersonnalOfficeGroup,
              as: "OfficePerson",
              required: false,
              attributes: ["offname"],
            },
            {
              model: dbppk.AppGroup,
              as: "Group",
              required: false,
              attributes: ["groupname"],
            },
            {
              model: dbppk.AppPersonFunctionalUnit,
              as: "FuncUnit",
              required: false,
              attributes: ["FuncunitName"],
            },
          ],
        },
      ],
    });

    if (!person) {
      throw new Error("ไม่พบข้อมูลผู้ใช้");
    }

    const formatPerson = {
      userid: person.userid,
      personid: person.Person?.id,
      funcunitID: person.Person?.FuncUnitID,
      fullname: `${person.Person?.firstname} ${person.Person?.lastname}`.trim(),
      position: person.Person?.Position?.Positionname || "",
      poslevel: person.Person?.Poslevel || "",
      office: person.Person?.OfficePerson?.offname || "",
      funcunit: person.Person?.FuncUnit?.FuncunitName || "",
      group: person.Person?.Group?.groupname || "",
    };

    return formatPerson;
  }

  static async createOrEditSetUpPersonFuncunit(body: any) {
    const { userid, FuncUnitID } = body;
    if (!userid && !FuncUnitID) {
      throw new Error("User ID and FuncUnit ID is required");
    }

    const check_slot = await dbuser.SlotSetupFuncunit.findOne({
      where: {
        userid: userid,
      },
    });

    if (check_slot) {
      await dbuser.SlotSetupFuncunit.update(
        {
          FuncUnitID: FuncUnitID,
        },
        {
          where: {
            userid: userid,
          },
        },
      );
    } else {
      await dbuser.SlotSetupFuncunit.create({
        userid: userid,
        FuncUnitID: FuncUnitID,
        active: "Y",
      });
    }
  }
}
