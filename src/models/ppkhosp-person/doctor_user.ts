import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
} from "sequelize";
import { sequelize } from "./index";

// 1. สร้าง Class โดยใช้ InferAttributes และ InferCreationAttributes สำหรับ TypeScript
class DoctorUser extends Model<
  InferAttributes<DoctorUser>,
  InferCreationAttributes<DoctorUser>
> {
  declare doctorid: number;
  declare userid: number;

  // 📝 เพิ่มช่องสำหรับทำความสัมพันธ์ (Associations)
  static associate(models: any) {
    // ตัวอย่างการเชื่อมตารางกับ Model อื่น
  }
}

// 2. กำหนดโครงสร้างคอลัมน์ (Schema) ของตาราง doctor_user
DoctorUser.init(
  {
    doctorid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    userid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "doctor_user",
    timestamps: false,
  },
);

export default DoctorUser;
