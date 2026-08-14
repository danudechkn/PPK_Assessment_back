import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable("evaluation_steps", {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    evaluation_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "evaluations",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    step_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    evaluator_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    completeAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  })
}
export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable("evaluation_steps");
}