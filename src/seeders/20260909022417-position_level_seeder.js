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
      "position_level",
      [
        {
          name: "ชำนาญการ",
          // active: "Y",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "ชำนาญการพิเศษ",
          // active: "Y",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "เชี่ยวชาญ",
          // active: "Y",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "เชี่ยวชาญพิเศษ",
          // active: "Y",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "ชำนาญงาน",
          // active: "Y",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "ทรงคุณวุฒิ",
          // active: "Y",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "ไม่มีระดับ",
          // active: "Y",
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
    await queryInterface.bulkDelete("position_level", null, {});
  },
};
