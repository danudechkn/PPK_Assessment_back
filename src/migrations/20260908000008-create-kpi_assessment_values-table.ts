import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable("kpi_assessment_values", {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    value_order_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    kpi_indicator_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    actual_value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    user_value: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
    },
    head_value: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
    },
    submit_value: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    weighted_score: {
      type: DataTypes.DECIMAL(8, 4),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "DRAFT",
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
  await queryInterface.dropTable("kpi_assessment_values");
}

module.exports = { up, down };
