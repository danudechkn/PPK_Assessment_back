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
    // await queryInterface.removeColumn("kpi_indicators", "weight");
    await queryInterface.addColumn("kpi_score_levels", "weight", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("kpi_score_levels", "expected_score", {
      type: Sequelize.TINYINT,
      allowNull: true,
    });
    // await queryInterface.dropTable("kpi_assessment_values");
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("kpi_score_levels", "weight");
    await queryInterface.removeColumn("kpi_score_levels", "expected_score");
  },
};
