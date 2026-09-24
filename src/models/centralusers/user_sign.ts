import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class UserSign extends Model<
  InferAttributes<UserSign>,
  InferCreationAttributes<UserSign>
> {
  declare id: CreationOptional<number>;
  declare userid: number;
  declare note: string | null;
  declare flag_type: string | null;
  declare flag_default: string | null;
  declare flag_cancel: string | null;
  declare createdAt: Date | null;
  declare updatedAt: Date | null;

  static associate(models: any) {
    //
  }
}

UserSign.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    userid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    note: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    flag_type: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: "A",
    },
    flag_default: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: "Y",
    },
    flag_cancel: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: "N",
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
    tableName: "user_sign",
    timestamps: true,
  },
);

export default UserSign;
