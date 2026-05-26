import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index"; // ✨ แก้จุดนี้: ให้ดึงอินสแตนซ์มาจากศูนย์กลาง index.ts ในโฟลเดอร์เดียวกัน

// 1. สร้าง Class โดยใช้ InferAttributes เพื่อให้ดึง Type ไปใช้ได้อัตโนมัติ
class AllInOne extends Model<
  InferAttributes<AllInOne>,
  InferCreationAttributes<AllInOne>
> {
  declare id: CreationOptional<number>;
  declare service_tag: string;
  declare express_code: string;
  declare sn: CreationOptional<string>;
  declare rpj_no: CreationOptional<string>;
  declare main_asset_number: CreationOptional<string>;
  declare note: CreationOptional<string>;
  declare keyboard: CreationOptional<string>;
  declare mouse: CreationOptional<string>;
  declare adapter: CreationOptional<string>;
  declare adapterType: string | null;
  declare machineName: string | null;
  declare FuncUnitID: number | null;
  declare date: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // 📝 เพิ่มช่องสำหรับทำความสัมพันธ์ (Associations) รองรับระบบใน index.ts v6
  static associate(models: any) {
    // ตัวอย่างการเชื่อมตาราง: User.hasMany(models.Post, { foreignKey: 'userId' });
  }
}

// 2. กำหนดโครงสร้างคอลัมน์ (Schema) ของตาราง
AllInOne.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    service_tag: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    express_code: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    sn: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    rpj_no: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    main_asset_number: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    note: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    keyboard: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    mouse: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    adapter: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    adapterType: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    machineName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    FuncUnitID: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: "active",
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize, // ใช้ตัวแปรอินสแตนซ์ที่ดึงมาจาก index.ts
    tableName: "all_in_ones",
    timestamps: true,
  },
);

export default AllInOne;
