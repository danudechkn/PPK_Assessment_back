import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

// 1. สร้าง Class โดยใช้ InferAttributes และ InferCreationAttributes สำหรับ TypeScript
class AppGroup extends Model<
  InferAttributes<AppGroup>,
  InferCreationAttributes<AppGroup>
> {
  declare id: CreationOptional<number>;
  declare groupname: CreationOptional<string | null>;
  declare active: CreationOptional<string | null>;
  declare edituserid: CreationOptional<number | null>;
  declare userlogid: CreationOptional<number | null>;

  // 📝 เพิ่มช่องสำหรับทำความสัมพันธ์ (Associations)
  static associate(models: any) {
    // ตัวอย่างการเชื่อมตารางกับ Model อื่น
    // AppGroup.hasMany(models.AppUserGroup, { foreignKey: 'groupid' });
  }
}

// 2. กำหนดโครงสร้างคอลัมน์ (Schema) ของตาราง app_group
AppGroup.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    groupname: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    active: {
      type: DataTypes.STRING(1),
      allowNull: true,
    },
    edituserid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    userlogid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "app_group",
    timestamps: false, // ปิดอัตโนมัติเนื่องจากไม่มีคอลัมน์ createdAt และ updatedAt
  }
);

export default AppGroup;
