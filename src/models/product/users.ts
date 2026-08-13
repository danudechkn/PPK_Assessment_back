import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class Users extends Model<
    InferAttributes<Users>,
    InferCreationAttributes<Users>
> {
    declare id: CreationOptional<number>;
    declare employee_code: string;
    declare username: CreationOptional<string | null>;
    declare full_name: string;
    declare position_name: CreationOptional<string | null>;
    declare position_level: CreationOptional<string | null>;
    declare work_point: CreationOptional<string | null>;
    declare avatar_url: CreationOptional<string | null>;
    declare employee_type_id: number;
    declare department_id: number;
    declare is_active: CreationOptional<boolean | null>;
    declare created_at: CreationOptional<Date>;
    declare updated_at: CreationOptional<Date>;

    static associate(models: any) {
        // Define associations here if needed
    }
}

Users.init(
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        employee_code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        username: {
            type: DataTypes.STRING(100),
            allowNull: true,
            unique: true,
        },
        full_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        position_name: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        position_level: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        work_point: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        avatar_url: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        employee_type_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        department_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
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
        tableName: "users",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

export default Users;
