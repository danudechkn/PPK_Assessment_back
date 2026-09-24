import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class DoctorImageData extends Model<
  InferAttributes<DoctorImageData>,
  InferCreationAttributes<DoctorImageData>
> {
  declare id: CreationOptional<number>;
  declare signature: Buffer;

  static associate(models: any) {
    //
  }
}

DoctorImageData.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    signature: {
      type: DataTypes.BLOB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "doctor_imagedata",
    timestamps: false,
  },
);

export default DoctorImageData;
