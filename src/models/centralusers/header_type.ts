import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class HeaderType extends Model<
    InferAttributes<HeaderType>,
    InferCreationAttributes<HeaderType>
> {
    declare id: CreationOptional<number>;
    declare name_th: string | null;
    declare name_en: string | null;
    declare flag_status: string | null;
    declare createdAt: Date | null;
    declare updatedAt: Date | null;

    static associate(models: any) {
        //
    }
}

HeaderType.init(
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        name_th: {
            type: DataTypes.STRING(150),
            allowNull: true,
        },
        name_en: {
            type: DataTypes.STRING(150),
            allowNull: true,
        },
        flag_status: {
            type: DataTypes.STRING(1),
            allowNull: true,
            defaultValue: "A",
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
        tableName: "header_type",
        timestamps: true,
    },
);

export default HeaderType;
