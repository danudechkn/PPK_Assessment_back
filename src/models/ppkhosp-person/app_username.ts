import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

// 1. สร้าง Class โดยใช้ InferAttributes และ InferCreationAttributes สำหรับ TypeScript
class AppUsername extends Model<
  InferAttributes<AppUsername>,
  InferCreationAttributes<AppUsername>
> {
  declare username: string;
  declare userid: CreationOptional<number | null>;
  declare userdesc: CreationOptional<string | null>;
  declare hash1: CreationOptional<string | null>;
  declare hash2: CreationOptional<string | null>;

  // 📝 เพิ่มช่องสำหรับทำความสัมพันธ์ (Associations)
  static associate(models: any) {
    // ตัวอย่างการเชื่อมตารางกับ Model อื่น (เช่น เชื่อมกับ AppUser)
    // AppUsername.belongsTo(models.AppUser, { foreignKey: 'userid' });
  }
}

// 2. กำหนดโครงสร้างคอลัมน์ (Schema) ของตาราง app_username
AppUsername.init(
  {
    username: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false,
    },
    userid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    userdesc: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    hash1: {
      type: DataTypes.CHAR(40),
      allowNull: true,
    },
    hash2: {
      type: DataTypes.CHAR(40),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "app_username",
    timestamps: false, // ปิดเนื่องจากไม่มีคอลัมน์ createdAt และ updatedAt
  }
);

export default AppUsername;
