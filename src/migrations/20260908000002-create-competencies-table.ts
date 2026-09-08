import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable("competencies", {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    competency_category_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    type_person_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    func_unit_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    position_level_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    competency: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expected_score: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    status: {
      type: DataTypes.CHAR(1),
      allowNull: true,
      defaultValue: "Y",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable("competencies");
}

module.exports = { up, down };
