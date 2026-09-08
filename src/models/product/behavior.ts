import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class Behavior extends Model<
  InferAttributes<Behavior>,
  InferCreationAttributes<Behavior>
> {
  declare id: CreationOptional<number>;
  declare competency_id: number | null;
  declare description: string | null;
  declare status: string | null;
  declare createdAt: Date | null;
  declare updatedAt: Date | null;

  static associate(models: any) {
    //
  }
}

Behavior.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    competency_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.CHAR(1),
      allowNull: true,
      defaultValue: "Y",
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
    tableName: "behavior",
    timestamps: false,
  },
);

export default Behavior;
