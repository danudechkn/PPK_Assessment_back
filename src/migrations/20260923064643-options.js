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
    await queryInterface.createTable("options", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        autoIncrement: true,
        primaryKey: true,
      },
      option_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      flag_active: {
        type: Sequelize.STRING(1),
        allowNull: false,
        defaultValue: "Y",
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
    await queryInterface.dropTable("options");
  },
};
