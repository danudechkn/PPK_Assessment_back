import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable("evaluation_responses", {
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
    evaluation_step_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "evaluation_steps",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    template_item_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "template_items",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  })
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable("evaluation_responses");
} 