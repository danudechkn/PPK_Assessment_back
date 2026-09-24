import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class UserSignData extends Model<
  InferAttributes<UserSignData>,
  InferCreationAttributes<UserSignData>
> {
  declare id: CreationOptional<number>;
  declare signature: Buffer;

  static associate(models: any) {
    //
  }
}

UserSignData.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    signature: {
      type: DataTypes.BLOB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "user_sign_data",
    timestamps: false,
  },
);

export default UserSignData;
