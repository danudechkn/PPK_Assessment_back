import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

// 1. สร้าง Class โดยใช้ InferAttributes และ InferCreationAttributes สำหรับ TypeScript
class DoctorName extends Model<
  InferAttributes<DoctorName>,
  InferCreationAttributes<DoctorName>
> {
  declare doctorid: CreationOptional<number>;
  declare doctorname: CreationOptional<string | null>;
  declare doctorlastname: CreationOptional<string | null>;
  declare sex: CreationOptional<string | null>;
  declare doctorsalutation: CreationOptional<string | null>;
  declare doctorlicenseid: CreationOptional<string | null>;
  declare doctorspecialist: CreationOptional<string | null>;
  declare doctorlevel: CreationOptional<string | null>;
  declare doctordepart: CreationOptional<string | null>;
  declare doctorlimit: CreationOptional<string | null>;
  declare flag_active: CreationOptional<string | null>;
  declare activestart: CreationOptional<Date | null>;
  declare activeend: CreationOptional<Date | null>;
  declare personid: CreationOptional<number | null>;
  declare doctornameeng: CreationOptional<string | null>;
  declare doctorlastnameeng: CreationOptional<string | null>;

  // 📝 เพิ่มช่องสำหรับทำความสัมพันธ์ (Associations)
  static associate(models: any) {
    // ตัวอย่างการเชื่อมตารางกับ Model อื่น
    // DoctorName.belongsTo(models.AppPerson, { foreignKey: 'personid' });
  }
}

// 2. กำหนดโครงสร้างคอลัมน์ (Schema) ของตาราง doctor_name
DoctorName.init(
  {
    doctorid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    doctorname: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    doctorlastname: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    sex: {
      type: DataTypes.STRING(1),
      allowNull: true,
    },
    doctorsalutation: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    doctorlicenseid: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    doctorspecialist: {
      type: DataTypes.STRING(3),
      allowNull: true,
    },
    doctorlevel: {
      type: DataTypes.STRING(1),
      allowNull: true,
    },
    doctordepart: {
      type: DataTypes.STRING(5),
      allowNull: true,
    },
    doctorlimit: {
      type: DataTypes.STRING(1),
      allowNull: true,
    },
    flag_active: {
      type: DataTypes.STRING(1),
      allowNull: true,
    },
    activestart: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    activeend: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    personid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    doctornameeng: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    doctorlastnameeng: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "doctor_name",
    timestamps: false, // ปิดเนื่องจากไม่มีคอลัมน์ createdAt และ updatedAt
  }
);

export default DoctorName;
