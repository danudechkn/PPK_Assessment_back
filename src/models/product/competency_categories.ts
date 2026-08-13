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
    declare code: string;
    declare name: string;
    declare description: CreationOptional<string | null>;
    declare created_at: CreationOptional<Date>;
    declare updated_at: CreationOptional<Date>;


    static associate(models: any) {
    }
}


CompetencyCategories.init(
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
            unique: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        description: {
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
        tableName: "competency_categories",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

export default CompetencyCategories;
