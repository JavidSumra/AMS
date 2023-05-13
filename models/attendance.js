"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class attendance extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
    static getAttencdanceList(studentClassId, Date) {
      return this.findAll({
        where: {
          studentClassId,
          Date,
        },
        order: [["userId", "ASC"]],
      });
    }
    static getPresent(studentClassId, Date) {
      return this.findAll({
        where: {
          studentClassId,
          Status: "true",
          Date,
        },
      });
    }
    static deleteAttendance(userId) {
      return this.destroy({
        where: {
          userId,
        },
      });
    }
  }
  attendance.init(
    {
      Name: DataTypes.STRING,
      studentClassId: DataTypes.STRING,
      Status: {
        type: DataTypes.STRING,
        defaultValue: "None",
      },
      Date: DataTypes.STRING,
      userId: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "attendance",
    }
  );
  return attendance;
};
