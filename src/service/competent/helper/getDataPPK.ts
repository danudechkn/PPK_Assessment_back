import db from "../../../models/ppkhosp-person";
import { Op } from "sequelize";

export async function getOfficeGroup(offid: number) {
  if (Number(offid) === 0) {
    return { offid: 0, offname: "ทั้งหมด" };
  }
  const data = await db.PersonnalOfficeGroup.findOne({
    where: {
      offid,
    },
  });
  return data;
}

export async function getFuncUnit(FuncunitID: number) {
  if (Number(FuncunitID) === 0) {
    return { FuncunitID: 0, FuncunitName: "ทุกกลุ่มงาน" };
  }
  const data = await db.AppPersonFunctionalUnit.findOne({
    attributes: ["FuncunitID", "FuncunitName"],
    where: {
      FuncunitID,
    },
  });
  return data;
}

export async function getOfficeGroupMap(ids: number[]): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (ids.some((id) => Number(id) === 0)) {
    map.set(0, "ทั้งหมด");
  }
  const validDbIds = ids.filter((id) => Number(id) > 0);
  if (validDbIds.length > 0) {
    const list = await db.PersonnalOfficeGroup.findAll({
      attributes: ["offid", "offname"],
      where: { offid: { [Op.in]: validDbIds } },
      raw: true,
    });
    list.forEach((item: any) => map.set(item.offid, item.offname));
  }
  return map;
}

export async function getFuncUnitMap(ids: number[]): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (ids.some((id) => Number(id) === 0)) {
    map.set(0, "ทุกกลุ่มงาน");
  }
  const validDbIds = ids.filter((id) => Number(id) > 0);
  if (validDbIds.length > 0) {
    const list = await db.AppPersonFunctionalUnit.findAll({
      attributes: ["FuncunitID", "FuncunitName"],
      where: { FuncunitID: { [Op.in]: validDbIds } },
      raw: true,
    });
    list.forEach((item: any) => map.set(item.FuncunitID, item.FuncunitName));
  }
  return map;
}
