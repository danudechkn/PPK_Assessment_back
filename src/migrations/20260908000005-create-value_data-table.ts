import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable("value_data", {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    value_order_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    quest: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    user_value: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    head_value: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    submit_value: {
      type: DataTypes.TINYINT,
      allowNull: true,
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
  await queryInterface.dropTable("value_data");
}

module.exports = { up, down };
