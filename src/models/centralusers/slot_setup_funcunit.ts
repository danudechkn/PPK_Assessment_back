import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class SlotSetupFuncunit extends Model<
  InferAttributes<SlotSetupFuncunit>,
  InferCreationAttributes<SlotSetupFuncunit>
> {
  declare id: CreationOptional<number>;
  declare userid: number;
  declare FuncUnitID: number;
  declare active: string;
  declare createdAt: Date | null;
  declare updatedAt: Date | null;

  static associate(models: any) {
    //
  }
}

SlotSetupFuncunit.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    userid: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    FuncUnitID: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    active: {
      type: DataTypes.STRING(1),
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
    tableName: "slot_setup_funcunits",
    timestamps: false,
  },
);

export default SlotSetupFuncunit;
