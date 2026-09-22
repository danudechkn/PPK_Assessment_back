import { Op } from "sequelize";
import dbppk from "../../models/ppkhosp-person";
import dbuser from "../../models/centralusers";
import dbproduct from "../../models/product";
import { AssessmentHelper } from "../assessmentcompetent/helper/assessment.helper";
export class getPersonService {
  static async headGetPersonByFuncUnit(userId: number, funcId: number) {
    try {
      // -------------------------------------------------------------
      // สเต็ป 1: ตรวจสอบว่า "ตัวหัวหน้า" ถูก Slot ไปทำงานที่หน่วยงานอื่นหรือไม่
      // -------------------------------------------------------------
      const headSlot = await dbuser.SlotSetupFuncunit.findOne({
        where: {
          userid: userId,
          active: "Y",
        },
      });
      // ถ้าหัวหน้าถูก Slot ไปหน่วยงานอื่น ให้ใช้หน่วยงานที่ถูกย้ายไป ถ้าไม่มีให้ใช้ funcId เดิม
      const activeFuncId = headSlot ? Number(headSlot.FuncUnitID) : funcId;
      // -------------------------------------------------------------
      // สเต็ป 2: ค้นหา Slot ของลูกน้อง (คนที่ย้ายเข้า และ คนที่ย้ายออก)
      // -------------------------------------------------------------
      // 2.1 คนจากหน่วยงานอื่นที่ถูก Slot ย้ายเข้ามาทำงานที่หน่วยงานนี้
      const slotInMembers = await dbuser.SlotSetupFuncunit.findAll({
        where: {
          FuncUnitID: activeFuncId,
          active: "Y",
        },
        attributes: ["userid"],
      });
      const slotInUserIds = slotInMembers.map((s: any) => Number(s.userid));
      // 2.2 คนที่ถูก Slot ย้ายออกไปช่วยหน่วยงานอื่น (ไม่รวมหน่วยงานนี้)
      const slotOutMembers = await dbuser.SlotSetupFuncunit.findAll({
        where: {
          FuncUnitID: { [Op.ne]: activeFuncId },
          active: "Y",
        },
        attributes: ["userid"],
      });
      const slotOutUserIds = slotOutMembers.map((s: any) => Number(s.userid));
      // แปลง userIds เป็น personid เพื่อนำไปใช้กับตาราง AppPerson
      const [slotInPersons, slotOutPersons] = await Promise.all([
        slotInUserIds.length > 0
          ? dbppk.AppUser.findAll({
              where: { userid: { [Op.in]: slotInUserIds } },
              attributes: ["personid"],
            })
          : [],
        slotOutUserIds.length > 0
          ? dbppk.AppUser.findAll({
              where: { userid: { [Op.in]: slotOutUserIds } },
              attributes: ["personid"],
            })
          : [],
      ]);
      const slotInPersonIds = slotInPersons
        .map((u: any) => Number(u.personid))
        .filter(Boolean);
      const slotOutPersonIds = slotOutPersons
        .map((u: any) => Number(u.personid))
        .filter(Boolean);
      // -------------------------------------------------------------
      // สเต็ป 3: ดึงข้อมูลบุคลากรจาก AppPerson
      // -------------------------------------------------------------
      const personWhereCondition: any = {
        [Op.or]: [
          // เงื่อนไข 1: คนที่สังกัดหน่วยงานนี้แต่เดิม (ยกเว้นคนที่ถูก Slot ย้ายออกไปที่อื่น)
          {
            funcUnitID: activeFuncId,
            ...(slotOutPersonIds.length > 0
              ? { id: { [Op.notIn]: slotOutPersonIds } }
              : {}),
          },
          // เงื่อนไข 2: บวกกับคนที่ถูก Slot ย้ายเข้ามาทำงานที่นี่
          ...(slotInPersonIds.length > 0
            ? [{ id: { [Op.in]: slotInPersonIds } }]
            : []),
        ],
      };
      const person = await dbppk.AppPerson.findAll({
        attributes: [
          "id",
          "firstname",
          "lastname",
          "OffID",
          "PosID",
          "FuncUnitID",
          "StatusID",
        ],
        where: personWhereCondition,
        include: [
          {
            model: dbppk.AppPositions,
            as: "Position",
            required: false,
            attributes: ["Positionname"],
          },
          {
            model: dbppk.PersonnalOfficeGroup,
            as: "OfficePerson",
            required: false,
            attributes: ["offname"],
          },
          {
            model: dbppk.AppPersonFunctionalUnit,
            as: "FuncUnit",
            required: false,
            attributes: ["FuncunitName"],
          },
          {
            model: dbppk.AppUser,
            as: "Users",
            required: false,
            attributes: ["userid"],
          },
          {
            model: dbppk.DoctorName,
            as: "DoctorNameInfo",
            required: false,
          },
        ],
      });
      // -------------------------------------------------------------
      // สเต็ป 4: กรองตัดตัวหัวหน้า (คนที่กำลังเปิดดู) ออกเสมอ
      // -------------------------------------------------------------
      const filteredPerson = person.filter((item: any) => {
        const isCurrentUser = item.Users?.some(
          (u: any) => Number(u.userid) === Number(userId),
        );
        return !isCurrentUser;
      });
      if (filteredPerson.length === 0) {
        throw new Error("ไม่พบข้อมูลบุคลากรในกลุ่มงานนี้");
      }
      // -------------------------------------------------------------
      // สเต็ป 4.1: ดึงสถานะการประเมินของลูกน้องทุกคนในรอบปัจจุบัน (Batch Query)
      // -------------------------------------------------------------
      const { round, year } = AssessmentHelper.getCurrentRoundAndYear();

      const targetUserIds = filteredPerson
        .map((item: any) => item.Users?.[0]?.userid || item.Users?.[1]?.userid)
        .filter(Boolean)
        .map(Number);

      const orders =
        targetUserIds.length > 0
          ? await dbproduct.ValueOrders.findAll({
              where: {
                user_id: { [Op.in]: targetUserIds },
                round,
                year,
              },
              include: [
                {
                  model: dbproduct.ValueData,
                  as: "value_data_list",
                },
              ],
            })
          : [];

      const orderMap = new Map<number, any>();
      for (const order of orders) {
        if (order.user_id) {
          orderMap.set(Number(order.user_id), order);
        }
      }

      // -------------------------------------------------------------
      // สเต็ป 5: Format ข้อมูลส่งกลับพร้อม Status
      // -------------------------------------------------------------
      const formatPerson = filteredPerson.map((item: any, index: number) => {
        const doctor_name = item?.DoctorNameInfo
          ? [
              item.DoctorNameInfo.doctorsalutation,
              item.DoctorNameInfo.doctorname,
              item.DoctorNameInfo.doctorlastname,
            ]
              .filter(Boolean)
              .join(" ")
          : null;
        const person_name = [item.firstname, item.lastname]
          .filter(Boolean)
          .join(" ");

        const targetUserId =
          item.Users?.[0]?.userid || item.Users?.[1]?.userid || null;
        const order = targetUserId ? orderMap.get(Number(targetUserId)) : null;

        const valueList = order?.value_data_list || [];
        const hasSelfAssessed = valueList.some(
          (d: any) => d.user_value != null,
        );
        const hasHeadAssessed = valueList.some(
          (d: any) => d.head_value != null,
        );
        const isAllSubmitted =
          valueList.length > 0 &&
          valueList.every((d: any) => d.submit_value != null);

        let status = order?.status || "PENDING";
        if (isAllSubmitted) {
          status = "COMPLETED";
          if (order?.id && order.status !== "COMPLETED") {
            dbproduct.ValueOrders.update(
              { status: "COMPLETED" },
              { where: { id: order.id } },
            ).catch(() => {});
          }
        }

        return {
          no: index + 1,
          id: item.id,
          userid: targetUserId ? Number(targetUserId) : null,
          name: doctor_name || person_name,
          posName: item.Position?.Positionname || null,
          offName: item.OfficePerson?.offname || null,
          offID: item.OffID || null,
          funcunitName: item.FuncUnit?.FuncunitName || null,
          funcID: item.FuncUnitID || null,

          // 🎯 ข้อมูลสถานะการประเมิน
          orderId: order?.id || null,
          status,
          hasSelfAssessed,
          hasHeadAssessed,
        };
      });
      return formatPerson;
    } catch (error) {
      console.error("Error in headGetPersonByFuncUnit:", error);
      throw error;
    }
  }

  // static async getPersonByUserId(userId: number) {
  //   try {
  //     const person = await dbppk.AppPerson.findOne({
  //       attributes: ["id", "firstname", "lastname", "OffID", "PosID"],
  //       include: [
  //         {
  //           model: dbppk.AppPositions,
  //           as: "Position",
  //           required: false,
  //           attributes: ["Positionname"],
  //         },
  //         {
  //           model: dbppk.PersonnalOfficeGroup,
  //           as: "OfficePerson",
  //           required: false,
  //           attributes: ["offname"],
  //         },
  //         {
  //           model: dbppk.AppUser,
  //           as: "Users",
  //           required: false,
  //           attributes: ["userid"],
  //           where: {
  //             userid: userId,
  //           },
  //         },
  //         {
  //           model: dbppk.DoctorName,
  //           as: "DoctorNameInfo",
  //           required: false,
  //         },
  //       ],
  //     });
  //     if (!person) {
  //       throw new Error("ไม่พบข้อมูลบุคลากร");
  //     }
  //     const format = {

  //     }
  //     return person;
  //   } catch (error) {
  //     console.error("Error in getPersonByUserId:", error);
  //     throw error;
  //   }
  // }
}
