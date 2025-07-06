const { Sequelize } = require('sequelize');

if (!process.env.DATABASE_URL) {
  console.error('❌ A variável DATABASE_URL não está definida. Verifique no painel do Render.');
  process.exit(1); // encerra a aplicação imediatamente
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false // opcional: remove logs SQL no terminal
});

module.exports = sequelize;
