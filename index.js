require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const sequelize = require('./config/database');

const app = express();
const PORT = process.env.PORT || 9000;

// ✅ Lista de origens permitidas
const allowedOrigins = [
  'https://bntech-frontend1.onrender.com'
];

// ✅ Configuração de CORS
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

// ✅ Middleware de parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// ✅ Configuração de sessão com suporte a HTTPS e frontend externo
app.use(session({
  secret: 'seuSegredoAqui',  // coloque uma string mais segura depois
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,        // ✅ Importante para HTTPS no Render
    httpOnly: true,
    sameSite: 'none'     // ✅ Necessário para cookies entre domínios
  }
}));

// ✅ Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando!' });
});

// ✅ Importa models para garantir que tabelas sejam criadas
require('./models/usuarios');
require('./models/clientes');
require('./models/servicos');
require('./models/vendas');
require('./models/VendaServico');
require('./models/despesa');
require('./models/agendamento');
require('./models/agendaServico');

// ✅ Importa e usa os controllers
const UsuarioController = require('./controllers/usuarioController');
const ClientesController = require('./controllers/clientesController');
app.use('/', UsuarioController);
app.use('/', ClientesController);

// ✅ Verifica sessão
app.get('/sessao', (req, res) => {
  if (req.session.usuario) {
    res.json({ logado: true, usuario: req.session.usuario });
  } else {
    res.json({ logado: false });
  }
});

// ✅ Encerra sessão
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

// ✅ Inicializa servidor e banco
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
