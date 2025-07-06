require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const sequelize = require('./config/database');

const app = express();
const PORT = process.env.PORT || 9000;

// CORS: Permitir localhost e o frontend hospedado no Render
const allowedOrigins = [
  'http://localhost:8080',
  'https://bntech-frontend1.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Sessão
app.use(session({
  secret: 'seuSegredoAqui',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,         // true só se for HTTPS
    httpOnly: true,
    sameSite: 'lax'        // use 'none' se for HTTPS com domínios diferentes
  }
}));

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando!' });
});

// Models
const Usuario = require('./models/usuarios');
const Cliente = require("./models/clientes");
const Servico = require("./models/servicos");
const Vendas = require("./models/vendas");
const VendaServico = require("./models/VendaServico");
const Despesas = require("./models/despesa");
const Agendamento = require("./models/agendamento");
const AgendamentoServico = require("./models/agendaServico");

// Controllers
const UsuarioController = require("./controllers/usuarioController");
const ClientesController = require("./controllers/clientesController");

app.use("/", UsuarioController);
app.use("/", ClientesController);

// Sessão
app.get('/sessao', (req, res) => {
  if (req.session.usuario) {
    res.json({ logado: true, usuario: req.session.usuario });
  } else {
    res.json({ logado: false });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Erro ao encerrar sessão:', err);
      return res.status(500).json({ erro: 'Erro ao sair' });
    }
    res.clearCookie('connect.sid');
    res.json({ mensagem: 'Sessão encerrada com sucesso.' });
  });
});

// Inicializa servidor e banco
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados com sucesso.');
    await sequelize.sync({ force: false });

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err);
  }
})();
