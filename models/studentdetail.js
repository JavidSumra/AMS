"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class studentdetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
    static getList(classId) {
      return this.findAll({
        where: {
          classId,
        },
        order: [["id", "ASC"]],
      });
    }
    static deleteStudent(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }
    static removeStudent(classId) {
      return this.destroy({
        where: {
          classId,
        },
      });
    }
    static getStudentName(id) {
      return this.findOne({
        where: {
          id,
        },
      });
    }
  }
  studentdetail.init(
    {
      SName: DataTypes.STRING,
      SNumber: DataTypes.STRING,
      PNumber: DataTypes.STRING,
      classId: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "studentdetail",
    }
  );
  return studentdetail;
};
