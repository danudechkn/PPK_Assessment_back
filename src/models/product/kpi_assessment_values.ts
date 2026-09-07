import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class KpiAssessmentValues extends Model<
  InferAttributes<KpiAssessmentValues>,
  InferCreationAttributes<KpiAssessmentValues>
> {
  declare id: CreationOptional<number>;
  declare value_order_id: number;
  declare kpi_indicator_id: number;
  declare actual_value: number | null;
  declare user_value: number | null;
  declare head_value: number | null;
  declare submit_value: number | null;
  declare weight: number;
  declare weighted_score: number | null;
  declare status: CreationOptional<string>;
}

KpiAssessmentValues.init(
  {
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
  },
  {
    sequelize,
    tableName: "kpi_assessment_values",
    timestamps: false,
        indexes: [{ unique: true, name: "uq_kpi_assessment_order_indicator", fields: ["value_order_id", "kpi_indicator_id"] }],
  },
);

export default KpiAssessmentValues;
