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
      "options",
      [
        {
          option_type_id: 1,
          name: "informed_and_acknowledged",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          option_type_id: 1,
          name: "informed_only",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          option_type_id: 2,
          name: "WATTING_AGREEMENT",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          option_type_id: 2,
          name: "COMPLETED",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          option_type_id: 3,
          name: "HEAD",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          option_type_id: 3,
          name: "SUBORDINATE",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          option_type_id: 3,
          name: "HIGHER_SUPERVISOR",
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
  },
};
