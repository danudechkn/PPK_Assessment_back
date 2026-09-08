import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

// 1. สร้าง Class โดยใช้ InferAttributes และ InferCreationAttributes สำหรับ TypeScript
class PersonnalOfficeGroup extends Model<
  InferAttributes<PersonnalOfficeGroup>,
  InferCreationAttributes<PersonnalOfficeGroup>
> {
  declare offid: CreationOptional<number>;
  declare offname: CreationOptional<string | null>;

  // 📝 เพิ่มช่องสำหรับทำความสัมพันธ์ (Associations)
  static associate(models: any) {
    // ตัวอย่างการเชื่อมตารางกับ Model อื่น
  }
}

// 2. กำหนดโครงสร้างคอลัมน์ (Schema) ของตาราง personnal_officegroup
PersonnalOfficeGroup.init(
  {
    offid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    offname: {
      type: DataTypes.CHAR(50),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "personnal_officegroup",
    timestamps: false, // ปิดเนื่องจากไม่มีคอลัมน์ createdAt และ updatedAt
  }
);

export default PersonnalOfficeGroup;
