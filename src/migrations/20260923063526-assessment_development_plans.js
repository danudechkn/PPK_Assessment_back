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
    await queryInterface.createTable("assessment_development_plans", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      summary_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      need_development: {
        type: Sequelize.TEXT("medium"),
        allowNull: false,
      },
      development_method: {
        type: Sequelize.TEXT("medium"),
        allowNull: false,
      },
      development_period: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      sort_order: {
        type: Sequelize.STRING(3),
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
    await queryInterface.dropTable("assessment_development_plans");
  },
};
