import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

// 1. สร้าง Class โดยใช้ InferAttributes และ InferCreationAttributes สำหรับ TypeScript
class AppDatasetGroup extends Model<
  InferAttributes<AppDatasetGroup>,
  InferCreationAttributes<AppDatasetGroup>
> {
  declare groupid: number;
  declare referencename: string;
  declare referenceid: number;
  declare rightflag: CreationOptional<string | null>;

  // 📝 เพิ่มช่องสำหรับทำความสัมพันธ์ (Associations)
  static associate(models: any) {
    // ตัวอย่างการเชื่อมตารางกับ Model อื่น
  }
}

// 2. กำหนดโครงสร้างคอลัมน์ (Schema) ของตาราง app_datasetgroup
AppDatasetGroup.init(
  {
    groupid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    referencename: {
      type: DataTypes.STRING(30),
      primaryKey: true,
      allowNull: false,
    },
    referenceid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    rightflag: {
      type: DataTypes.STRING(1),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "app_datasetgroup",
    timestamps: false,
  }
);

export default AppDatasetGroup;
