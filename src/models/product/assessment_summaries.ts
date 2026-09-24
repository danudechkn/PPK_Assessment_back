import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class AssessmentSummaries extends Model<
  InferAttributes<AssessmentSummaries>,
  InferCreationAttributes<AssessmentSummaries>
> {
  declare id: CreationOptional<number>;
  declare user_id: number;
  declare head_id: number;
  declare round: number;
  declare year: number;
  declare kpi_score: string | null;
  declare kpi_weight: string | null;
  declare kpi_weighted_score: string | null;
  declare competency_score: string | null;
  declare competency_weight: string | null;
  declare competency_weighted_score: string | null;
  declare total_score: string | null;
  declare grade_level: number | null;
  declare evaluator_status: number | null;
  declare status: number | null;
  declare createdAt: Date | null;
  declare updatedAt: Date | null;

  static associate(models: any) {
    //
  }
}

AssessmentSummaries.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    head_id: { type: DataTypes.INTEGER, allowNull: false },
    round: { type: DataTypes.TINYINT, allowNull: false },
    year: { type: DataTypes.SMALLINT, allowNull: false },
    kpi_score: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    kpi_weight: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    kpi_weighted_score: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    competency_score: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    competency_weight: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    competency_weighted_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    total_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    grade_level: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    evaluator_status: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 2,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 3,
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
  },
  {
    sequelize,
    tableName: "assessment_summaries",
    timestamps: true,
  },
);

export default AssessmentSummaries;
