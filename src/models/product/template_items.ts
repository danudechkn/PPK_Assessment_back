import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class TemplateItems extends Model<
  InferAttributes<TemplateItems>,
  InferCreationAttributes<TemplateItems>
> {
  declare id: CreationOptional<number>;
  declare section_id: number;
  declare sort_order: number;
  declare kpi_id: CreationOptional<number | null>;
  declare competency_id: CreationOptional<number | null>;
  declare default_weight: CreationOptional<number | null>;
  declare created_at: CreationOptional<Date>;

  static associate(models: any) {
    // Define associations here if needed
  }
}

TemplateItems.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    section_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    kpi_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    competency_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    default_weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0.00,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "template_items",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

export default TemplateItems;
