import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable("evaluations", {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    fiscal_year: {
      type: DataTypes.INTEGER,
      allowNull: false,

    },
    template_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "evaluation_templates",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    evaluatee_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
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
    final_score: {
      type: DataTypes.DECIMAL(5, 2),
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
  await queryInterface.dropTable("evaluations");
}