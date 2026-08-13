import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class EvaluationSteps extends Model<
  InferAttributes<EvaluationSteps>,
  InferCreationAttributes<EvaluationSteps>
> {
  declare id: CreationOptional<number>;
  declare evaluation_id: number;
  declare step_order: number;
  declare role_type: string;
  declare evaluator_id: number;
  declare status: CreationOptional<string | null>;
  declare completed_at: CreationOptional<Date | null>;
  declare created_at: CreationOptional<Date>;

  static associate(models: any) {
    // Define associations here if needed
  }
}

EvaluationSteps.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    evaluation_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    step_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    evaluator_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "PENDING",
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "evaluation_steps",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

export default EvaluationSteps;
