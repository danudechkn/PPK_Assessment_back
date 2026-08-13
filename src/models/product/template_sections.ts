import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class TemplateSections extends Model<
    InferAttributes<TemplateSections>,
    InferCreationAttributes<TemplateSections>
> {
    declare id: CreationOptional<number>;
    declare template_id: number;
    declare sort_order: number;
    declare title: string;
    declare section_type: string;
    declare weight_percentage: CreationOptional<number | null>;
    declare created_at: CreationOptional<Date>;

    static associate(models: any) {
        // Define associations here if needed
    }
}

TemplateSections.init(
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        template_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        sort_order: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        section_type: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        weight_percentage: {
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
        tableName: "template_sections",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
    }
);

export default TemplateSections;
