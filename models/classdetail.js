"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class classDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
    static getClass(id) {
      return this.findAll({
        where: {
          ClassId: id,
        },
      });
    }
    static Removebatch(ClassId, id) {
      return this.destroy({
        where: {
          ClassId,
          id,
        },
      });
    }
  }
  classDetail.init(
    {
      ClassName: DataTypes.STRING,
      StartTime: DataTypes.STRING,
      EndTime: DataTypes.STRING,
      ClassId: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "classDetail",
    }
  );
  return classDetail;
};
