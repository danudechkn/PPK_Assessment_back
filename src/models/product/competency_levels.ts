import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { sequelize } from "./index";


class CompetencyLevels extends Model<
    InferAttributes<CompetencyLevels>,
    InferCreationAttributes<CompetencyLevels>
> {
    declare id: CreationOptional<number>;
    declare competency_id: number;
    declare level: number;
    declare title: CreationOptional<string | null>;
    declare behavioral_indicators: string;
    declare created_at: CreationOptional<Date>;


    static associate(models: any) {
    }
}


CompetencyLevels.init(
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        competency_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        level: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        behavioral_indicators: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: "competency_levels",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
    }
);

export default CompetencyLevels;
