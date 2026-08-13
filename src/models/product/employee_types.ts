import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class EmployeeTypes extends Model<
    InferAttributes<EmployeeTypes>,
    InferCreationAttributes<EmployeeTypes>
> {
    declare id: CreationOptional<number>;
    declare code: string;
    declare name: string;
    declare is_active: CreationOptional<boolean | null>;
    declare created_at: CreationOptional<Date>;
    declare updated_at: CreationOptional<Date>;

    static associate(models: any) {
        // Define associations here if needed
    }
}

EmployeeTypes.init(
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
        tableName: "employee_types",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

export default EmployeeTypes;
