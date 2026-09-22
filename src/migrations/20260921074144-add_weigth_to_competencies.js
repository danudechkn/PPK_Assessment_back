"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn("competencies", "weight", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false, // 👈 แก้จาก false0 เป็น false
      defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("competencies", "weight"); // 👈 ใส่เพื่อให้ rollback ได้
  },
};
