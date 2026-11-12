import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class HeaderSetting extends Model<
    InferAttributes<HeaderSetting>,
    InferCreationAttributes<HeaderSetting>
> {
    declare id: CreationOptional<number>;
    declare userid: number;
    declare funcunitid: number;
    declare header_type_id: number;
    declare flag_status: string;
    declare createdAt: Date | null;
    declare updatedAt: Date | null;

    static associate(models: any) {
        //
    }
}

HeaderSetting.init(
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        userid: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        funcunitid: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        header_type_id: {
            type: DataTypes.INTEGER,
            allowNull: true
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
        tableName: "header_setting",
        timestamps: false,
    },
);

export default HeaderSetting;
