import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class KpiScoreLevels extends Model<
  InferAttributes<KpiScoreLevels>,
  InferCreationAttributes<KpiScoreLevels>
> {
  declare id: CreationOptional<number>;
  declare kpi_indicator_id: number;
  declare criteria_text: string;
  declare score: number;
  declare expected_score: number | null;
  declare weight: string | null;
  declare operator_type: string;
  declare createdAt: Date | null;
  declare updatedAt: Date | null;
}

KpiScoreLevels.init(
  {
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
    expected_score: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    criteria_text: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    score: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
    },
    weight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
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
  },
  {
    sequelize,
    tableName: "kpi_score_levels",
    timestamps: false,
    indexes: [
      {
        unique: true,
        name: "uq_kpi_level_indicator_score",
        fields: ["kpi_indicator_id", "score"],
      },
    ],
  },
);

export default KpiScoreLevels;
