"use strict";

import fs from "fs";
import path from "path";
import { Sequelize, DataTypes } from "sequelize"; // เปลี่ยนมาใช้ sequelize package หลักของ v6

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";

// 1. ดึงค่า Config
const rawConfig = require(
  path.resolve(__dirname, "..", "..", "config", "config_ppk"),
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

// ==========================================
// 🔗 การเชื่อมความสัมพันธ์ (Associations)
// ==========================================

// 1. AppPerson <-> AppUser
if (db.AppPerson && db.AppUser) {
  db.AppPerson.hasMany(db.AppUser, {
    foreignKey: "personid",
    as: "Users",
  });

  db.AppUser.belongsTo(db.AppPerson, {
    foreignKey: "personid",
    as: "Person",
  });
}

// 2. AppUser <-> AppUsername
if (db.AppUser && db.AppUsername) {
  db.AppUser.hasOne(db.AppUsername, {
    foreignKey: "userid",
    sourceKey: "userid",
    as: "UsernameInfo",
  });

  db.AppUsername.belongsTo(db.AppUser, {
    foreignKey: "userid",
    targetKey: "userid",
    as: "User",
  });
}

// 3. AppPerson -> AppGroup
if (db.AppPerson && db.AppGroup) {
  db.AppPerson.belongsTo(db.AppGroup, {
    foreignKey: "GroID",
    as: "Group",
  });

  db.AppGroup.hasMany(db.AppPerson, {
    foreignKey: "GroID",
    as: "Persons",
  });
}

// 4. AppPerson -> PersonnalOfficeGroup
if (db.AppPerson && db.PersonnalOfficeGroup) {
  db.AppPerson.belongsTo(db.PersonnalOfficeGroup, {
    foreignKey: "OffID",
    as: "OfficePerson",
  });

  db.PersonnalOfficeGroup.hasMany(db.AppPerson, {
    foreignKey: "OffID",
    as: "Persons",
  });
}

// 5. AppPerson -> AppPositions
if (db.AppPerson && db.AppPositions) {
  db.AppPerson.belongsTo(db.AppPositions, {
    foreignKey: "PosID",
    as: "Position",
  });

  db.AppPositions.hasMany(db.AppPerson, {
    foreignKey: "PosID",
    as: "Persons",
  });
}

// 6. AppPerson -> AppPersonFunctionalUnit
if (db.AppPerson && db.AppPersonFunctionalUnit) {
  db.AppPerson.belongsTo(db.AppPersonFunctionalUnit, {
    foreignKey: "FuncUnitID",
    as: "FuncUnit",
  });

  db.AppPersonFunctionalUnit.hasMany(db.AppPerson, {
    foreignKey: "FuncUnitID",
    as: "Persons",
  });
}

// 7. AppPerson <-> DoctorName
if (db.AppPerson && db.DoctorName) {
  db.AppPerson.hasOne(db.DoctorName, {
    foreignKey: "personid",
    as: "DoctorNameInfo",
  });

  db.DoctorName.belongsTo(db.AppPerson, {
    foreignKey: "personid",
    as: "Person",
  });
}

// 8. DoctorUser (Junction table: Doctor <-> User)
if (db.DoctorUser && db.AppUser) {
  db.DoctorUser.belongsTo(db.AppUser, {
    foreignKey: "userid",
    as: "User",
  });
  db.AppUser.hasMany(db.DoctorUser, {
    foreignKey: "userid",
    as: "DoctorUsers",
  });
}

// 9. AppUserGroup (Junction table: Group <-> User)
if (db.AppUserGroup && db.AppUser) {
  db.AppUserGroup.belongsTo(db.AppUser, {
    foreignKey: "userid",
    as: "User",
  });
  db.AppUser.hasMany(db.AppUserGroup, {
    foreignKey: "userid",
    as: "UserGroups",
  });
}

// 10. AppUserGroup <-> AppDataSetGroup
if (db.AppUserGroup && db.AppDatasetGroup) {
  // 1 UserGroup มีได้หลาย DatasetGroup (hasMany)
  db.AppUserGroup.hasMany(db.AppDatasetGroup, {
    foreignKey: "groupid",
    sourceKey: "groupid",
    as: "DataSetGroups", // แนะนำให้ใช้พหูพจน์เนื่องจากดึงมาเป็น Array
  });
  // AppDatasetGroup อ้างอิงกลับหา AppUserGroup (belongsTo)
  db.AppDatasetGroup.belongsTo(db.AppUserGroup, {
    foreignKey: "groupid",
    targetKey: "groupid",
    as: "UserGroup",
  });
}

// 11. AppUser <-> AppDatasetUser
if (db.AppUser && db.AppDatasetUser) {
  db.AppUser.hasMany(db.AppDatasetUser, {
    foreignKey: "userid",
    sourceKey: "userid",
    as: "DataSetUsers",
  });
  db.AppDatasetUser.belongsTo(db.AppUser, {
    foreignKey: "userid",
    targetKey: "userid",
    as: "User",
  });
}

// 5. ส่งออกระบบไปใช้ร่วมกัน
db.sequelize = sequelize;
db.Sequelize = Sequelize;

export { sequelize, Sequelize };
export default db;
