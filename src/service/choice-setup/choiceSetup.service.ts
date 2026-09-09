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
    return funcunit;
  }

  static async personnalOfficeGroup() {
    const personnalofficegroup = await dbppk.PersonnalOfficeGroup.findAll({});
    if (!personnalofficegroup) {
      throw new Error("Personnal office group not exist");
    }
    return personnalofficegroup;
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
