import dbppk from "../../models/ppkhosp-person";
import db from "../../models/product";

export class ChoiceSetupService {
  static async getFuncUnit() {
    const funcunit = await dbppk.AppPersonFunctionalUnit.findAll({
      attributes: ["FuncunitID", "FuncunitName", "TyCode"],
      where: {
        active: "Y",
      },
    });

    if (!funcunit) {
      throw new Error("Function not exist");
    }
    const allOption = {
      FuncunitID: 0,
      FuncunitName: "ทุกกลุ่มงาน",
      TyCode: "",
    };
    const list = funcunit.map((item: any) =>
      typeof item.toJSON === "function" ? item.toJSON() : item,
    );
    return [allOption, ...list];
  }

  static async personnalOfficeGroup() {
    const personnalofficegroup = await dbppk.PersonnalOfficeGroup.findAll({});
    if (!personnalofficegroup) {
      throw new Error("Personnal office group not exist");
    }
    const allOption = {
      offid: 0,
      offname: "ทั้งหมด",
    };
    const list = personnalofficegroup.map((item: any) =>
      typeof item.toJSON === "function" ? item.toJSON() : item,
    );
    return [allOption, ...list];
  }

  static async positionLevel() {
    const positionlevel = await db.PositionLevel.findAll({
      where: {
        active: "Y",
      },
      attributes: ["id", "name", "active"],
    });
    if (!positionlevel) {
      throw new Error("Position level not exist");
    }
    return positionlevel;
  }
}
