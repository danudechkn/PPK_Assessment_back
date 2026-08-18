"use strict";

import fs from "fs";
import path from "path";
import { Sequelize, DataTypes } from "sequelize"; // เปลี่ยนมาใช้ sequelize package หลักของ v6

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";

// 1. ดึงค่า Config
const rawConfig = require(
  path.resolve(__dirname, "..", "..", "config", "config"),
);
const config = rawConfig.default ? rawConfig.default[env] : rawConfig[env];

// 2. สร้างอินสแตนซ์ Sequelize v6 ก่อน
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect || "mysql", // ระบุเป็น string เช่น 'mysql', 'postgres'
    port: Number(config.port) || 3306,
    logging: config.logging !== false ? console.log : false,
  },
);

// สร้าง object เปล่าแบบยังไม่ระบุเจาะจงชนิดในช่วงแรก
const db: any = {};

// 3. ค้นหาและโหลดคลาสโมเดลทั้งหมดในโฟลเดอร์นี้แบบอัตโนมัติ
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      (file.slice(-3) === ".js" || file.slice(-3) === ".ts") &&
      file.indexOf(".test.js") === -1 &&
      file.indexOf(".test.ts") === -1 &&
      file !== "db.d.ts" // ป้องกันการโหลดไฟล์ Type Definition
    );
  })
  .forEach((file) => {
    const modelModule = require(path.join(__dirname, file));
    // รองรับทั้ง export default และ export ปกติ
    let model = modelModule.default || modelModule;

    // ระบบ v6 มักใช้โครงสร้างฟังก์ชันข้ามไฟล์ (โมเดลแบบเก่า) หรือคลาสที่เขียนแบบใช้สืบทอด
    if (typeof model === "function" && model.init) {
      // สำหรับคลาสโมเดล v6 ที่เขียนสืบทอดมาจาก Model และมีเมธอด init ไว้เรียกใช้งาน
      // ในกรณีนี้โมเดลมักถูกอินิทโครงสร้างแยกในไฟล์ตัวเองแล้ว เราจับยัดเข้า db object ได้เลย
      db[model.name] = model;
    } else if (typeof model === "function") {
      // สำหรับสไตล์ดั้งเดิมของ Sequelize CLI ที่ส่งฟังก์ชันมาให้รันอินิท
      model = model(sequelize, DataTypes);
      db[model.name] = model;
    } else if (model && typeof model === "object") {
      // เก็บตกกรณีที่มีการนำคลาสใส่ไว้ใน object ตัวแปรย่อย
      const actualModel = Object.values(model)[0];
      if (typeof actualModel === "function" && (actualModel as any).init) {
        db[(actualModel as any).name] = actualModel;
      }
    }
  });

// 4. เรียกใช้การเชื่อมความสัมพันธ์ (Associations) หากตัวโมเดลมีฟังก์ชัน associate ตั้งไว้
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// ความสัมพันธ์ทั้งหมด (hasMany & belongsTo)

// 1. EmployeeTypes <-> EvaluationTemplates, Users
if (db.EmployeeTypes) {
  if (db.EvaluationTemplates) {
    db.EmployeeTypes.hasMany(db.EvaluationTemplates, { foreignKey: "employee_type_id", as: "evaluation_templates" });
    db.EvaluationTemplates.belongsTo(db.EmployeeTypes, { foreignKey: "employee_type_id", as: "employee_type" });
  }
  if (db.Users) {
    db.EmployeeTypes.hasMany(db.Users, { foreignKey: "employee_type_id", as: "users" });
    db.Users.belongsTo(db.EmployeeTypes, { foreignKey: "employee_type_id", as: "employee_type" });
  }
}

// 2. Department <-> Users, Competencies
if (db.Department) {
  if (db.Users) {
    db.Department.hasMany(db.Users, { foreignKey: "department_id", as: "users" });
    db.Users.belongsTo(db.Department, { foreignKey: "department_id", as: "department" });
  }
  if (db.Competencies) {
    db.Department.hasMany(db.Competencies, { foreignKey: "department_id", as: "competencies" });
    db.Competencies.belongsTo(db.Department, { foreignKey: "department_id", as: "department" });
  }
}

// 3. CompetencyCategories <-> Competencies
if (db.CompetencyCategories && db.Competencies) {
  db.CompetencyCategories.hasMany(db.Competencies, { foreignKey: "category_id", as: "competencies" });
  db.Competencies.belongsTo(db.CompetencyCategories, { foreignKey: "category_id", as: "category" });
}

// 4. Competencies <-> CompetencyLevels, TemplateItems
if (db.Competencies) {
  if (db.CompetencyLevels) {
    db.Competencies.hasMany(db.CompetencyLevels, { foreignKey: "competency_id", as: "competency_levels" });
    db.CompetencyLevels.belongsTo(db.Competencies, { foreignKey: "competency_id", as: "competency" });
  }
  if (db.TemplateItems) {
    db.Competencies.hasMany(db.TemplateItems, { foreignKey: "competency_id", as: "template_items" });
    db.TemplateItems.belongsTo(db.Competencies, { foreignKey: "competency_id", as: "competency" });
  }
}

// 5. EvaluationTemplates <-> TemplateSections, Evaluations
if (db.EvaluationTemplates) {
  if (db.TemplateSections) {
    db.EvaluationTemplates.hasMany(db.TemplateSections, { foreignKey: "template_id", as: "template_sections" });
    db.TemplateSections.belongsTo(db.EvaluationTemplates, { foreignKey: "template_id", as: "evaluation_template" });
  }
  if (db.Evaluations) {
    db.EvaluationTemplates.hasMany(db.Evaluations, { foreignKey: "template_id", as: "evaluations" });
    db.Evaluations.belongsTo(db.EvaluationTemplates, { foreignKey: "template_id", as: "evaluation_template" });
  }
}

// 6. TemplateSections <-> TemplateItems
if (db.TemplateSections && db.TemplateItems) {
  db.TemplateSections.hasMany(db.TemplateItems, { foreignKey: "section_id", as: "template_items" });
  db.TemplateItems.belongsTo(db.TemplateSections, { foreignKey: "section_id", as: "template_section" });
}

// 7. Users <-> Evaluations, EvaluationSteps
if (db.Users) {
  if (db.Evaluations) {
    db.Users.hasMany(db.Evaluations, { foreignKey: "evaluatee_id", as: "evaluations" });
    db.Evaluations.belongsTo(db.Users, { foreignKey: "evaluatee_id", as: "evaluatee" });
  }
  if (db.EvaluationSteps) {
    db.Users.hasMany(db.EvaluationSteps, { foreignKey: "evaluator_id", as: "evaluation_steps" });
    db.EvaluationSteps.belongsTo(db.Users, { foreignKey: "evaluator_id", as: "evaluator" });
  }
}

// 8. Evaluations <-> EvaluationSteps, EvaluationResponses
if (db.Evaluations) {
  if (db.EvaluationSteps) {
    db.Evaluations.hasMany(db.EvaluationSteps, { foreignKey: "evaluation_id", as: "evaluation_steps" });
    db.EvaluationSteps.belongsTo(db.Evaluations, { foreignKey: "evaluation_id", as: "evaluation" });
  }
  if (db.EvaluationResponses) {
    db.Evaluations.hasMany(db.EvaluationResponses, { foreignKey: "evaluation_id", as: "evaluation_responses" });
    db.EvaluationResponses.belongsTo(db.Evaluations, { foreignKey: "evaluation_id", as: "evaluation" });
  }
}

// 9. EvaluationSteps <-> EvaluationResponses
if (db.EvaluationSteps && db.EvaluationResponses) {
  db.EvaluationSteps.hasMany(db.EvaluationResponses, { foreignKey: "evaluation_step_id", as: "evaluation_responses" });
  db.EvaluationResponses.belongsTo(db.EvaluationSteps, { foreignKey: "evaluation_step_id", as: "evaluation_step" });
}

// 10. TemplateItems <-> EvaluationResponses
if (db.TemplateItems && db.EvaluationResponses) {
  db.TemplateItems.hasMany(db.EvaluationResponses, { foreignKey: "template_item_id", as: "evaluation_responses" });
  db.EvaluationResponses.belongsTo(db.TemplateItems, { foreignKey: "template_item_id", as: "template_item" });
}

// 5. ส่งออกระบบไปใช้ร่วมกัน
db.sequelize = sequelize;
db.Sequelize = Sequelize;

export { sequelize, Sequelize };
export default db;
