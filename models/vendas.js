const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuarios  = require("./usuarios")

const Venda = sequelize.define('Venda', {
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  dataVenda: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  valorTotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

const Cliente = require('./clientes');



  Usuarios.hasMany(Venda);
  Venda.belongsTo(Usuarios);



module.exports = Venda;
