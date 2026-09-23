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
    await queryInterface.createTable("assessment_signatures", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      summary_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      signer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      signer_type_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      signer_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      signer_position: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      signature_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      comment: {
        type: Sequelize.TEXT("medium"),
        allowNull: true,
      },
      signed_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: false,
      },
      createdAt: {
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
    await queryInterface.dropTable("assessment_signatures");
  },
};
