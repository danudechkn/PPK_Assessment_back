import dotenv from "dotenv";
dotenv.config();

const config = {
  development: {
    username: process.env.DBPPK_USER || "root",
    password: process.env.DBPPK_PASS || "",
    database: process.env.DBPPK_NAME || "project_anc_dev",
    host: process.env.DBPPK_HOST || "127.0.0.1",
    port: process.env.PORTPPK || 3306,
    dialect: process.env.DBPPK_DIALECT || "mysql",
  },
  test: {
    username: process.env.DBPPK_USER || "root",
    password: process.env.DBPPK_PASS || "",
    database: process.env.DBPPK_NAME || "project_anc_test",
    host: process.env.DBPPK_HOST || "127.0.0.1",
    port: process.env.PORTPPK || 3306,
    dialect: process.env.DBPPK_DIALECT || "mysql",
  },
  production: {
    username: process.env.DBPPK_USER,
    password: process.env.DBPPK_PASS,
    database: process.env.DBPPK_NAME,
    host: process.env.DBPPK_HOST,
    port: process.env.PORTPPK,
    dialect: process.env.DBPPK_DIALECT,
  },
};
export default config;
