import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

// 1. สร้าง Class โดยใช้ InferAttributes และ InferCreationAttributes สำหรับ TypeScript
class AppPerson extends Model<
  InferAttributes<AppPerson>,
  InferCreationAttributes<AppPerson>
> {
  declare id: CreationOptional<number>;
  declare PSCodeID: CreationOptional<number | null>;
  declare pscode: CreationOptional<string | null>;
  declare salutation: CreationOptional<number | null>;
  declare firstname: CreationOptional<string | null>;
  declare lastname: CreationOptional<string | null>;
  declare GroID: CreationOptional<number | null>;
  declare OffID: CreationOptional<number | null>;
  declare PosID: CreationOptional<number | null>;
  declare NursePosID: CreationOptional<number | null>;
  declare Poslevel: CreationOptional<string | null>;
  declare Sex: CreationOptional<string | null>;
  declare DivID: CreationOptional<number | null>;
  declare DepartID: CreationOptional<number | null>;
  declare SsjID: CreationOptional<number | null>;
  declare WorkPoint: CreationOptional<string | null>;
  declare Specialty: CreationOptional<number | null>;
  declare Gradlevel: CreationOptional<number | null>;
  declare Graduate: CreationOptional<number | null>;
  declare Educate: CreationOptional<string | null>;
  declare Birthday: CreationOptional<Date | null>;
  declare StartJobdate: CreationOptional<Date | null>;
  declare ExpertID: CreationOptional<number | null>;
  declare EndJobdate: CreationOptional<Date | null>;
  declare AcademicGroup: CreationOptional<number | null>;
  declare Remark: CreationOptional<string | null>;
  declare Active: CreationOptional<string | null>;
  declare FuncUnitID: CreationOptional<number | null>;
  declare StatusID: CreationOptional<number | null>;
  declare Up_date: CreationOptional<Date | null>;
  declare TypeMID: CreationOptional<number | null>;
  declare TypePayMid: CreationOptional<number | null>;
  declare TypeDC: CreationOptional<string | null>;
  declare Inscl: CreationOptional<string | null>;
  declare CITIZEN: CreationOptional<string | null>;
  declare NOBANK: CreationOptional<string | null>;
  declare TAXID: CreationOptional<string | null>;
  declare salary: CreationOptional<number | null>;
  declare EndUser: CreationOptional<number | null>;
  declare KeyDate: CreationOptional<Date | null>;
  declare Unions: CreationOptional<number | null>;
  declare StatusMember: CreationOptional<number | null>;
  declare picperson: CreationOptional<string | null>;
  declare NurseCrNo: CreationOptional<number | null>;
  declare Engprename: CreationOptional<string | null>;
  declare Engname: CreationOptional<string | null>;
  declare Engsurname: CreationOptional<string | null>;
  declare Email: CreationOptional<string | null>;
  declare Fiveyear: CreationOptional<string | null>;
  declare Username: CreationOptional<string | null>;
  declare Password: CreationOptional<string | null>;
  declare UserKey: CreationOptional<number | null>;
  declare CodeCSMBS: CreationOptional<number | null>;
  declare FiveyearNurse: CreationOptional<number | null>;
  declare NolicensedClinic: CreationOptional<string | null>;
  declare HN: CreationOptional<number | null>;
  declare Director: CreationOptional<string | null>;
  declare PosLevelOLD: CreationOptional<number | null>;
  declare BloodGroup: CreationOptional<string | null>;
  declare SendDev: CreationOptional<string | null>;
  declare HomePhone: CreationOptional<string | null>;
  declare MobilePhone: CreationOptional<string | null>;
  declare JobEducate: CreationOptional<number | null>;
  declare IP: CreationOptional<string | null>;

  // 📝 เพิ่มช่องสำหรับทำความสัมพันธ์ (Associations)
  static associate(models: any) {
    // ตัวอย่างการเชื่อมตารางกับ Model อื่น
  }
}

// 2. กำหนดโครงสร้างคอลัมน์ (Schema) ของตาราง app_person
AppPerson.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    PSCodeID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    pscode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    salutation: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    firstname: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    lastname: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    GroID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    OffID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    PosID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    NursePosID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Poslevel: {
      type: DataTypes.CHAR(70),
      allowNull: true,
    },
    Sex: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    DivID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    DepartID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    SsjID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    WorkPoint: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    Specialty: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Gradlevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Graduate: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Educate: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    Birthday: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    StartJobdate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    ExpertID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    EndJobdate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    AcademicGroup: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Remark: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },
    Active: {
      type: DataTypes.STRING(9),
      allowNull: true,
    },
    FuncUnitID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    StatusID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Up_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    TypeMID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    TypePayMid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    TypeDC: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    Inscl: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    CITIZEN: {
      type: DataTypes.STRING(13),
      allowNull: true,
    },
    NOBANK: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    TAXID: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    salary: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
    },
    EndUser: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    KeyDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    Unions: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    StatusMember: {
      type: DataTypes.SMALLINT,
      allowNull: true,
    },
    picperson: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    NurseCrNo: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Engprename: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Engname: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    Engsurname: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    Email: {
      type: DataTypes.TEXT("medium"),
      allowNull: true,
    },
    Fiveyear: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Username: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    Password: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    UserKey: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    CodeCSMBS: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    FiveyearNurse: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    NolicensedClinic: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    HN: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Director: {
      type: DataTypes.CHAR(1),
      allowNull: true,
    },
    PosLevelOLD: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    BloodGroup: {
      type: DataTypes.STRING(5),
      allowNull: true,
    },
    SendDev: {
      type: DataTypes.CHAR(1),
      allowNull: true,
      defaultValue: "N",
    },
    HomePhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    MobilePhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    JobEducate: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    IP: {
      type: DataTypes.CHAR(15),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "app_person",
    timestamps: false,
  }
);

export default AppPerson;
