import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

// 1. สร้าง Class โดยใช้ InferAttributes และ InferCreationAttributes สำหรับ TypeScript
class AppUserGroup extends Model<
  InferAttributes<AppUserGroup>,
  InferCreationAttributes<AppUserGroup>
> {
  declare groupid: number;
  declare userid: number;
  declare active: CreationOptional<string | null>;
  declare createdatetime: CreationOptional<Date | null>;

  // 📝 เพิ่มช่องสำหรับทำความสัมพันธ์ (Associations)
  static associate(models: any) {
    // ตัวอย่างการเชื่อมตารางกับ Model อื่น
    // AppUserGroup.belongsTo(models.AppUser, { foreignKey: 'userid' });
  }
}

// 2. กำหนดโครงสร้างคอลัมน์ (Schema) ของตาราง app_usergroup
AppUserGroup.init(
  {
    groupid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    userid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    active: {
      type: DataTypes.STRING(1),
      allowNull: true,
    },
    createdatetime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "app_usergroup",
    timestamps: false, // ปิดอัตโนมัติ เนื่องจากใช้ createdatetime แบบกำหนดเอง
  }
);

export default AppUserGroup;
