// força o Node a priorizar IPv4 em vez de IPv6
const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const { Sequelize } = require('sequelize');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não definida!');
  process.exit(1);
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  },
  logging: false
});

module.exports = sequelize;
