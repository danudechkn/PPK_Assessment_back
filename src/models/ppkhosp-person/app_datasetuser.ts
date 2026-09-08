import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class AppDatasetUser extends Model<
  InferAttributes<AppDatasetUser>,
  InferCreationAttributes<AppDatasetUser>
> {
  declare userid: number;
  declare referencename: string;
  declare referenceid: number;
  declare rightflag: CreationOptional<string | null>;

  static associate(models: any) {
    // Relationships can be defined here
  }
}

AppDatasetUser.init(
  {
    userid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    referencename: {
      type: DataTypes.STRING(30),
      primaryKey: true,
      allowNull: false,
    },
    referenceid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    rightflag: {
      type: DataTypes.STRING(1),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "app_datasetuser",
    timestamps: false,
  }
);

export default AppDatasetUser;
