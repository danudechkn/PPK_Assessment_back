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
    declare category_id: number;
    declare department_id: CreationOptional<number | null>;
    declare code: string;
    declare name: string;
    declare description: CreationOptional<string | null>;
    declare created_at: CreationOptional<Date>;
    declare updated_at: CreationOptional<Date>;

    static associate(models: any) {
    }
}


Competencies.init(
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        category_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        department_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
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
        tableName: "competencies",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

export default Competencies;
