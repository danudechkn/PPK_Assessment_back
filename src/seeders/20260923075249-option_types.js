"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    await queryInterface.bulkInsert(
      "option_types",
      [
        {
          name: "evaluator status",
          columnname: "evaluator_status",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "assessment status",
          columnname: "status",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "signer type",
          columnname: "signer_type",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete("option_types", null, {});
  },
};
