import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class AssessmentDevelopmentPlans extends Model<
  InferAttributes<AssessmentDevelopmentPlans>,
  InferCreationAttributes<AssessmentDevelopmentPlans>
> {
  declare id: CreationOptional<number>;
  declare summary_id: number;
  declare need_development: string;
  declare development_method: string;
  declare development_period: string;
  declare sort_order: string;
  declare createdAt: Date | null;
  declare updatedAt: Date | null;

  static associate(models: any) {
    //
  }
}

AssessmentDevelopmentPlans.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    summary_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    need_development: {
      type: DataTypes.TEXT("medium"),
      allowNull: false,
    },
    development_method: { type: DataTypes.TEXT("medium"), allowNull: false },
    development_period: { type: DataTypes.TEXT("medium"), allowNull: false },
    sort_order: {
      type: DataTypes.STRING(3),
      allowNull: false,
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
    tableName: "assessment_development_plans",
    timestamps: true,
  },
);

export default AssessmentDevelopmentPlans;
