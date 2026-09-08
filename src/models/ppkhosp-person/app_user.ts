import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

// 1. สร้าง Class โดยใช้ InferAttributes และ InferCreationAttributes สำหรับ TypeScript
class AppUser extends Model<
  InferAttributes<AppUser>,
  InferCreationAttributes<AppUser>
> {
  declare userid: CreationOptional<number>;
  declare blobpsw1: CreationOptional<Buffer | null>;
  declare blobpsw2: CreationOptional<Buffer | null>;
  declare rightlevel: CreationOptional<number | null>;
  declare careuserid: CreationOptional<number | null>;
  declare personid: CreationOptional<number | null>;
  declare startdatetime: CreationOptional<Date | null>;
  declare enddatetime: CreationOptional<Date | null>;
  declare createdatetime: CreationOptional<Date | null>;
  declare createuserid: CreationOptional<number | null>;
  declare editdatetime: CreationOptional<Date | null>;
  declare edituserid: CreationOptional<number | null>;
  declare editlogid: CreationOptional<number | null>;
  declare active: CreationOptional<string | null>;
  declare logext: CreationOptional<string | null>;

  // 📝 เพิ่มช่องสำหรับทำความสัมพันธ์ (Associations)
  static associate(models: any) {
    // ตัวอย่างการเชื่อมตารางกับ Model อื่น
  }
}

// 2. กำหนดโครงสร้างคอลัมน์ (Schema) ของตาราง app_user
AppUser.init(
  {
    userid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    blobpsw1: {
      type: DataTypes.BLOB("long"),
      allowNull: true,
    },
    blobpsw2: {
      type: DataTypes.BLOB("long"),
      allowNull: true,
    },
    rightlevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    careuserid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    personid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    startdatetime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    enddatetime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdatetime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createuserid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    editdatetime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    edituserid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    editlogid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    active: {
      type: DataTypes.STRING(1),
      allowNull: true,
    },
    logext: {
      type: DataTypes.CHAR(1),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "app_user",
    timestamps: false, // เนื่องจากใช้คอลัมน์ createdatetime / editdatetime แบบกำหนดเอง
  }
);

export default AppUser;
