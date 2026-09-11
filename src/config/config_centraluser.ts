import dotenv from "dotenv";
dotenv.config();

const config = {
  development: {
    username: process.env.DBUSER_USER || "root",
    password: process.env.DBUSER_PASS || "",
    database: process.env.DBUSER_NAME || "project_anc_dev",
    host: process.env.DBUSER_HOST || "127.0.0.1",
    port: process.env.DBUSER_PORT || 3306,
    dialect: process.env.DBUSER_DIALECT || "mysql",
  },
  test: {
    username: process.env.DBUSER_USER || "root",
    password: process.env.DBUSER_PASS || "",
    database: process.env.DBUSER_NAME || "project_anc_test",
    host: process.env.DBUSER_HOST || "127.0.0.1",
    port: process.env.DBUSER_PORT || 3306,
    dialect: process.env.DBUSER_DIALECT || "mysql",
  },
  production: {
    username: process.env.DBUSER_USER,
    password: process.env.DBUSER_PASS,
    database: process.env.DBUSER_NAME,
    host: process.env.DBUSER_HOST,
    port: process.env.DBUSER_PORT,
    dialect: process.env.DBUSER_DIALECT,
  },
};
export default config;
