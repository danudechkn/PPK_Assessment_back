import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

// 1. สร้าง Class โดยใช้ InferAttributes และ InferCreationAttributes สำหรับ TypeScript
class AppPositions extends Model<
  InferAttributes<AppPositions>,
  InferCreationAttributes<AppPositions>
> {
  declare PositionID: CreationOptional<number>;
  declare Positionname: CreationOptional<string | null>;
  declare PosID: CreationOptional<number>;
  declare PPK: CreationOptional<number | null>;
  declare Nurse: CreationOptional<number | null>;
  declare Comment: CreationOptional<string | null>;
  declare Officegroup: CreationOptional<number | null>;
  declare BusinessGroup: CreationOptional<number | null>;
  declare FrameAmount: CreationOptional<number | null>;
  declare Shortname: CreationOptional<string | null>;
  declare JobDesc: CreationOptional<number | null>;
  declare Educate: CreationOptional<string | null>;
  declare UserKey: CreationOptional<number | null>;
  declare KeyDate: CreationOptional<Date | null>;
  declare UptoDate: CreationOptional<Date | null>;

  // 📝 เพิ่มช่องสำหรับทำความสัมพันธ์ (Associations)
  static associate(models: any) {
    // ตัวอย่างการเชื่อมตารางกับ Model อื่น
  }
}

// 2. กำหนดโครงสร้างคอลัมน์ (Schema) ของตาราง app_positions
AppPositions.init(
  {
    PositionID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    Positionname: {
      type: DataTypes.STRING(70),
      allowNull: true,
    },
    PosID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      defaultValue: 0,
    },
    PPK: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    Nurse: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 1,
    },
    Comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    Officegroup: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    BusinessGroup: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    FrameAmount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    Shortname: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    JobDesc: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Educate: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    UserKey: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    KeyDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    UptoDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "app_positions",
    timestamps: false,
  }
);

export default AppPositions;
