import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class EvaluationTemplates extends Model<
    InferAttributes<EvaluationTemplates>,
    InferCreationAttributes<EvaluationTemplates>
> {
    declare id: CreationOptional<number>;
    declare code: string;
    declare title: string;
    declare employee_type_id: number;
    declare version: CreationOptional<string | null>;
    declare scoring_formula: CreationOptional<string | null>;
    declare is_active: CreationOptional<boolean | null>;
    declare created_at: CreationOptional<Date>;
    declare updated_at: CreationOptional<Date>;

    static associate(models: any) {
        // Define associations here if needed
    }
}

EvaluationTemplates.init(
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        code: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        employee_type_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        version: {
            type: DataTypes.STRING(20),
            allowNull: true,
            defaultValue: "1.0",
        },
        scoring_formula: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: "evaluation_templates",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

export default EvaluationTemplates;
