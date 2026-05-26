// connect mysql db for models
// connect mysql db for models
import dotenv from "dotenv";
dotenv.config();
import { Sequelize, Dialect } from "sequelize";

// แก้ไขเรื่อง Type: บังคับระบุเป็น Dialect (เช่น 'mysql', 'postgres')
const dbDialect = (process.env.DB_DIALECT || "mysql") as Dialect;

const sequelize = new Sequelize(
  process.env.DB_NAME as string, // project_anc
  process.env.DB_USER as string, // root
  process.env.DB_PASS as string, // (ว่าง)
  {
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: dbDialect, // มั่นใจได้ว่าค่าเป็นข้อมูลประเภท Dialect แน่นอน
    port: Number(process.env.DB_PORT) || 3306, // แปลงค่า string จาก env เป็นตัวเลข (number)
    logging: true, // ปิด log query
  },
);

export default sequelize;
