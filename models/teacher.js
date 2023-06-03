"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class teacher extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
    updatePass(Password) {
      return this.update({
        password: Password,
      });
    }
    static getEmail(email) {
      return this.findAll({
        where: {
          email,
        },
      });
    }
  }
  teacher.init(
    {
      FirstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: 8,
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: {
            msg: "Please Provide Valid Email",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "teacher",
    }
  );
  return teacher;
};
