import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class CompetencyCategories extends Model<
  InferAttributes<CompetencyCategories>,
  InferCreationAttributes<CompetencyCategories>
> {
  declare id: CreationOptional<number>;
  declare name: string | null;
  declare status: string | null;
  declare createdAt: Date | null;
  declare updatedAt: Date | null;

  static associate(models: any) {
    //
  }
}

CompetencyCategories.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
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
    tableName: "competency_categories",
    timestamps: false,
  },
);

export default CompetencyCategories;
