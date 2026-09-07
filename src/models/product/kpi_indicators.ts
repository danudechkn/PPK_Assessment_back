import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class KpiIndicators extends Model<
  InferAttributes<KpiIndicators>,
  InferCreationAttributes<KpiIndicators>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare weight: number;
  declare status: CreationOptional<string>;
}

KpiIndicators.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.CHAR(1),
      allowNull: false,
      defaultValue: "Y",
    },
  },
  {
    sequelize,
    tableName: "kpi_indicators",
    timestamps: false,
  },
);

export default KpiIndicators;
