import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

// 1. สร้าง Class โดยใช้ InferAttributes และ InferCreationAttributes สำหรับ TypeScript
class AppPersonFunctionalUnit extends Model<
  InferAttributes<AppPersonFunctionalUnit>,
  InferCreationAttributes<AppPersonFunctionalUnit>
> {
  declare FuncunitID: CreationOptional<number>;
  declare FuncunitName: CreationOptional<string | null>;
  declare TyCode: CreationOptional<string | null>;
  declare DepartID: CreationOptional<number | null>;
  declare SublocID: CreationOptional<number | null>;
  declare Desce: CreationOptional<string | null>;
  declare HeadID: CreationOptional<number | null>;
  declare HearNurse: CreationOptional<number | null>;
  declare ExtraNurse: CreationOptional<number>;
  declare FunctCode: CreationOptional<number | null>;
  declare Active: CreationOptional<string | null>;
  declare Newsletter: CreationOptional<string | null>;
  declare Newsgroup: CreationOptional<number | null>;
  declare Ogz: CreationOptional<number>;
  declare NewsListID: CreationOptional<number | null>;
  declare FuncFiveID: CreationOptional<number | null>;
  declare ShortName: CreationOptional<string | null>;
  declare roomdeluxe: CreationOptional<number | null>;
  declare PaperLessDepartID: CreationOptional<number | null>;
  declare CompetencyGroupID: CreationOptional<number | null>;
  declare ServiceGroup: CreationOptional<string | null>;
  declare UserKey: CreationOptional<number | null>;
  declare UntiCostID: CreationOptional<string | null>;
  declare NurseGroup: CreationOptional<number | null>;
  declare Vacation: CreationOptional<string | null>;
  declare UpToDate: CreationOptional<Date>;
  declare unittype: CreationOptional<number | null>;
  declare MinorCode: CreationOptional<number | null>;
  declare FuncunitNamenurse: CreationOptional<string | null>;
  declare Servicename: CreationOptional<string | null>;
  declare Serviceflag: CreationOptional<string | null>;
  declare Archives: CreationOptional<string | null>;
  declare FuncunitName_en: CreationOptional<string | null>;
  declare ShortName_en: CreationOptional<string | null>;
  declare Buildername: CreationOptional<string | null>;
  declare Floor: CreationOptional<number | null>;
  declare BuilderID: CreationOptional<number | null>;

  // 📝 เพิ่มช่องสำหรับทำความสัมพันธ์ (Associations)
  static associate(models: any) {
    // ตัวอย่างการเชื่อมตารางกับ Model อื่น
  }
}

// 2. กำหนดโครงสร้างคอลัมน์ (Schema) ของตาราง app_personfunctionalunit
AppPersonFunctionalUnit.init(
  {
    FuncunitID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    FuncunitName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    TyCode: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    DepartID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    SublocID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Desce: {
      type: DataTypes.TEXT("medium"),
      allowNull: true,
    },
    HeadID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    HearNurse: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ExtraNurse: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    FunctCode: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    Active: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    Newsletter: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    Newsgroup: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    Ogz: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    NewsListID: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    FuncFiveID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    ShortName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    roomdeluxe: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    PaperLessDepartID: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    CompetencyGroupID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ServiceGroup: {
      type: DataTypes.CHAR(1),
      allowNull: true,
    },
    UserKey: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    UntiCostID: {
      type: DataTypes.CHAR(1),
      allowNull: true,
    },
    NurseGroup: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Vacation: {
      type: DataTypes.CHAR(1),
      allowNull: true,
      defaultValue: "Y",
    },
    UpToDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    unittype: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    MinorCode: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    FuncunitNamenurse: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    Servicename: {
      type: DataTypes.CHAR(255),
      allowNull: true,
    },
    Serviceflag: {
      type: DataTypes.CHAR(1),
      allowNull: true,
    },
    Archives: {
      type: DataTypes.CHAR(255),
      allowNull: true,
    },
    FuncunitName_en: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    ShortName_en: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    Buildername: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    Floor: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    BuilderID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "app_personfunctionalunit",
    timestamps: false,
  }
);

export default AppPersonFunctionalUnit;
