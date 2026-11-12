"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("value_data", "user_actual_value", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      after: "quest",
      comment: "ค่าผลงานจริงที่ตนเองกรอก (เช่น 95)",
    });

    await queryInterface.addColumn("value_data", "head_actual_value", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      after: "user_value",
      comment: "ค่าผลงานจริงที่หัวหน้าประเมิน",
    });

    await queryInterface.addColumn("value_data", "submit_actual_value", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      after: "head_value",
      comment: "ค่าผลงานจริงที่ตกลงร่วมกัน",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("value_data", "submit_actual_value");
    await queryInterface.removeColumn("value_data", "head_actual_value");
    await queryInterface.removeColumn("value_data", "user_actual_value");
  },
};
