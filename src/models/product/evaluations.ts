import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class Evaluations extends Model<
    InferAttributes<Evaluations>,
    InferCreationAttributes<Evaluations>
> {
    declare id: CreationOptional<number>;
    declare fiscal_year: number;
    declare template_id: number;
    declare evaluatee_id: number;
    declare status: CreationOptional<string | null>;
    declare final_score: CreationOptional<number | null>;
    declare created_at: CreationOptional<Date>;
    declare updated_at: CreationOptional<Date>;

    static associate(models: any) {
    }
}


Evaluations.init(
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        fiscal_year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        template_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        evaluatee_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING(50),
            allowNull: true,
            defaultValue: "DRAFT",
        },
        final_score: {
            type: DataTypes.DECIMAL(5, 2),
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
        tableName: "evaluations",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

export default Evaluations;
