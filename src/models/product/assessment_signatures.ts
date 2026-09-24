import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class AssessmentSignatures extends Model<
  InferAttributes<AssessmentSignatures>,
  InferCreationAttributes<AssessmentSignatures>
> {
  declare id: CreationOptional<number>;
  declare summary_id: number;
  declare signer_id: number;
  declare signer_type_id: number | null;
  declare signer_name: string;
  declare signer_position: string | null;
  declare signature_id: number;
  declare comment: string | null;
  declare signed_at: Date | null;
  declare ip_address: string | null;
  declare createdAt: Date | null;
  //   declare updatedAt: Date | null;

  static associate(models: any) {
    //
  }
}

AssessmentSignatures.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    summary_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    signer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    signer_type_id: { type: DataTypes.INTEGER, allowNull: false },
    signer_name: { type: DataTypes.STRING(150), allowNull: false },
    signer_position: { type: DataTypes.STRING(200), allowNull: true },
    signature_id: { type: DataTypes.INTEGER, allowNull: false },
    comment: { type: DataTypes.TEXT("medium"), allowNull: true },
    signed_at: { type: DataTypes.DATE, allowNull: false },
    ip_address: { type: DataTypes.STRING(45), allowNull: false },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "assessment_signatures",
    timestamps: true,
    updatedAt: false,
  },
);

export default AssessmentSignatures;
