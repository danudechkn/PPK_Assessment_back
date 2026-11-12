import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class ValueData extends Model<
  InferAttributes<ValueData>,
  InferCreationAttributes<ValueData>
> {
  declare id: CreationOptional<number>;
  declare value_order_id: number | null;
  declare quest: number | null;
  declare user_value: number | null;
  declare head_value: number | null;
  declare submit_value: number | null;
  declare user_actual_value: number | null;
  declare head_actual_value: number | null;
  declare submit_actual_value: number | null;
  declare createdAt: Date | null;
  declare updatedAt: Date | null;

  static associate(models: any) {
    //
  }
}

ValueData.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    value_order_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    quest: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    user_value: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    head_value: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    submit_value: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    user_actual_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    head_actual_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    submit_actual_value: {
      type: DataTypes.DECIMAL(10, 2),
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
    tableName: "value_data",
    timestamps: false,
    indexes: [
      {
        unique: true,
        name: "uq_value_data_order_quest",
        fields: ["value_order_id", "quest"],
      },
    ],
  },
);

export default ValueData;
