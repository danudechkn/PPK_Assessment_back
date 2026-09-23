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
    await queryInterface.createTable("assessment_summaries", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      head_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      round: {
        type: Sequelize.TINYINT,
        allowNull: false,
      },
      year: {
        type: Sequelize.SMALLINT,
        allowNull: false,
      },
      // kpi
      kpi_score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      kpi_weight: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      kpi_weighted_score: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      // competency
      competency_score: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      competency_weight: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      competency_weighted_score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      // final
      total_score: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      grade_level: { type: Sequelize.INTEGER, allowNull: true },
      evaluator_status: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 2,
      },
      status: {
        type: Sequelize.INTEGER,
        defaultValue: 3,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable("assessment_summaries");
  },
};
