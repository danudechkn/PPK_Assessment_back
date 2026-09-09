import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class PositionLevel extends Model<
  InferAttributes<PositionLevel>,
  InferCreationAttributes<PositionLevel>
> {
  declare id: CreationOptional<number>;
  declare name: string | null;
  declare active: string | null;
  declare createdAt: Date | null;
  declare updatedAt: Date | null;

  static associate(models: any) {
    //
  }
}

PositionLevel.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    active: {
      type: DataTypes.STRING(1),
      defaultValue: "Y",
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
  },
  {
    sequelize,
    tableName: "position_level",
    timestamps: false,
  },
);

export default PositionLevel;
