import db from "../../../models/ppkhosp-person";
import { Op } from "sequelize";

export async function getOfficeGroup(offid: number) {
  const data = await db.PersonnalOfficeGroup.findOne({
    where: {
      offid,
    },
  });
  return data;
}

export async function getFuncUnit(FuncunitID: number) {
  const data = await db.AppPersonFunctionalUnit.findOne({
    attributes: ["FuncunitID", "FuncunitName"],
    where: {
      FuncunitID,
    },
  });
  return data;
}

export async function getOfficeGroupMap(ids: number[]): Promise<Map<number, string>> {
  if (!ids.length) return new Map();
  const list = await db.PersonnalOfficeGroup.findAll({
    attributes: ["offid", "offname"],
    where: { offid: { [Op.in]: ids } },
    raw: true,
  });
  return new Map(list.map((item: any) => [item.offid, item.offname]));
}

export async function getFuncUnitMap(ids: number[]): Promise<Map<number, string>> {
  if (!ids.length) return new Map();
  const list = await db.AppPersonFunctionalUnit.findAll({
    attributes: ["FuncunitID", "FuncunitName"],
    where: { FuncunitID: { [Op.in]: ids } },
    raw: true,
  });
  return new Map(list.map((item: any) => [item.FuncunitID, item.FuncunitName]));
}
