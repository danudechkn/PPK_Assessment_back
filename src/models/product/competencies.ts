import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class Competencies extends Model<
  InferAttributes<Competencies>,
  InferCreationAttributes<Competencies>
> {
  declare id: CreationOptional<number>;
  declare competency_category_id: number | null;
  declare type_person_id: number | null;
  declare func_unit_id: number | null;
  declare position_level_id: number | null;
  declare competency: string | null;
  declare expected_score: number | null;
  declare weight: string | null;
  declare status: string | null;
  declare createdAt: Date | null;
  declare updatedAt: Date | null;

  static associate(models: any) {
    //
  }
}

Competencies.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    competency_category_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    type_person_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    func_unit_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    position_level_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    competency: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expected_score: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    weight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
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
    tableName: "competencies",
    timestamps: false,
  },
);

export default Competencies;
