import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class EvaluationResponses extends Model<
    InferAttributes<EvaluationResponses>,
    InferCreationAttributes<EvaluationResponses>
> {
    declare id: CreationOptional<number>;
    declare evaluation_id: number;
    declare evaluation_step_id: number;
    declare template_item_id: number;
    declare score: number;
    declare comment: CreationOptional<string | null>;
    declare created_at: CreationOptional<Date>;
    declare updated_at: CreationOptional<Date>;

    static associate(models: any) {
        // Define associations here if needed
    }
}

EvaluationResponses.init(
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
        evaluation_step_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        template_item_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        score: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
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
        tableName: "evaluation_responses",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

export default EvaluationResponses;
