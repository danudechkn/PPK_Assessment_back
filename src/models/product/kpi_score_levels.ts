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
  declare score: number;
  declare criteria_text: string;
  declare operator_type: string;
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
  },
  {
    sequelize,
    tableName: "kpi_score_levels",
    timestamps: false,
        indexes: [{ unique: true, name: "uq_kpi_level_indicator_score", fields: ["kpi_indicator_id", "score"] }],
  },
);

export default KpiScoreLevels;
