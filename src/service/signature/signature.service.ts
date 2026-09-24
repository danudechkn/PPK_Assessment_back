import dbuser from "../../models/centralusers";
import { signBuffer, bufferToSign } from "../../utils/sign-buffer.util";

export class SignatureService {
  /**
   * ดึงข้อมูลลายเซ็นตาม userid และประเภทผู้ใช้งาน (type_id)
   */
  static async getSignatureByUserid(
    userid: number,
    type_id: number,
    doctorid?: number,
  ) {
    let result: any = null;

    if ([3, 4].includes(type_id)) {
      result = await dbuser.UserSign.findOne({
        where: { userid: userid, flag_cancel: "N" },
        include: [{ model: dbuser.UserSignData, as: "SignData" }],
      });
    } else if (type_id === 5) {
      const whereCondition: any = { userid: userid, flag_cancel: "N" };
      if (doctorid) whereCondition.doctorid = doctorid;

      result = await dbuser.DoctorImage.findOne({
        where: whereCondition,
        include: [{ model: dbuser.DoctorImageData, as: "DoctorSignData" }],
      });
    }

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      userid: result.userid,
      note: result.note,
      signature: bufferToSign(
        result.SignData?.signature || result.DoctorSignData?.signature || null,
      ),
    };
  }

  /**
   * บันทึกหรือแก้ไขลายเซ็น (Upsert Signature)
   */
  static async upsertSignature(
    userid: number,
    type_id: number,
    doctorid: number | null,
    body: any,
  ) {
    const { note, signature } = body;

    let signatureBuffer: Record<string, Buffer | null> = {};
    if (signature) {
      signatureBuffer = signBuffer({ signature });
    }

    const rawBuffer = signatureBuffer.signature || null;

    if ([3, 4].includes(type_id)) {
      // 1. ค้นหารายการเดิมก่อน หากไม่มีให้สร้างใหม่เพื่อป้องกันข้อมูลซ้ำซ้อน
      let userSign = await dbuser.UserSign.findOne({
        where: { userid, flag_cancel: "N" },
      });

      if (userSign) {
        await userSign.update({ note });
      } else {
        userSign = await dbuser.UserSign.create({
          userid,
          note,
          flag_type: "A",
          flag_default: "Y",
          flag_cancel: "N",
        });
      }

      // 2. บันทึกหรืออัปเดตข้อมูลไฟล์รูปภาพลายเซ็น
      await dbuser.UserSignData.upsert({
        id: userSign.id,
        signature: rawBuffer,
      });
    } else if (type_id === 5) {
      const whereCondition: any = { userid, flag_cancel: "N" };
      if (doctorid) whereCondition.doctorid = doctorid;

      let doctorSign = await dbuser.DoctorImage.findOne({
        where: whereCondition,
      });

      if (doctorSign) {
        await doctorSign.update({
          note,
          doctorid: doctorid || doctorSign.doctorid,
          editdatetime: new Date(),
        });
      } else {
        doctorSign = await dbuser.DoctorImage.create({
          doctorid: doctorid || 0,
          userid,
          note,
          flag_type: "A",
          flag_default: "Y",
          flag_cancel: "N",
          editdatetime: new Date(),
        });
      }

      // 2. บันทึกหรืออัปเดตไฟล์รูปภาพลายเซ็นแพทย์ (ฟิลด์ชื่อ signature)
      await dbuser.DoctorImageData.upsert({
        id: doctorSign.id,
        signature: rawBuffer,
      });
    }

    return {
      message: "บันทึกลายเซ็นสำเร็จ",
    };
  }
}
