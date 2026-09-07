import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class ValueOrders extends Model<
    InferAttributes<ValueOrders>,
    InferCreationAttributes<ValueOrders>
> {
    declare id: CreationOptional<number>;
    declare user_id: number | null;
    declare head_id: number | null;
    declare round: number | null;
    declare year: number | null;
    declare status: string | null;

    static associate(models: any) {
    //
  }
}

ValueOrders.init(
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        head_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        round: {
            type: DataTypes.TINYINT,
            allowNull: true,
        },
        year: {
            type: DataTypes.SMALLINT,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: true,
            defaultValue: "Y",
        },
    },
    {
        sequelize,
        tableName: "value_orders",
        timestamps: false,
    },
);

export default ValueOrders;
