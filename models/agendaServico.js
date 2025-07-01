const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AgendamentoServico = sequelize.define('AgendamentoServico', {
  preco: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  duracao: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

const Agendamento = require('./agendamento');
const Servico = require('./servicos');

Agendamento.hasMany(AgendamentoServico);
AgendamentoServico.belongsTo(Agendamento);

Servico.hasMany(AgendamentoServico);
AgendamentoServico.belongsTo(Servico);

module.exports = AgendamentoServico;
