import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class DoctorImage extends Model<
  InferAttributes<DoctorImage>,
  InferCreationAttributes<DoctorImage>
> {
  declare id: CreationOptional<number>;
  declare doctorid: number;
  declare note: string | null;
  declare userid: number | null;
  declare editdatetime: number | null;
  declare flag_type: string | null;
  declare flag_default: string | null;
  declare flag_cancel: string | null;
  declare createdAt: Date | null;
  declare updatedAt: Date | null;

  static associate(models: any) {
    //
  }
}

DoctorImage.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    doctorid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    note: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    userid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    editdatetime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    flag_type: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: "A",
    },
    flag_default: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: "Y",
    },
    flag_cancel: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: "N",
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
    tableName: "doctor_image",
    timestamps: true,
  },
);

export default DoctorImage;
