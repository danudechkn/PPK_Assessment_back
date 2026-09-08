import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable("kpi_score_levels", {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    kpi_indicator_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    score: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
    },
    criteria_text: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    operator_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
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
  await queryInterface.dropTable("kpi_score_levels");
}

module.exports = { up, down };
