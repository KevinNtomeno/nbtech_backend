require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sequelize = require('./config/database');



const app = express();
const PORT = process.env.PORT || 9000;


app.use(cors({
    origin: 'http://localhost:8080', // endereço do seu front
    credentials: true // Permite envio de cookies/sessões
  }));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const session = require('express-session');

app.use(session({
  secret: 'seuSegredoAqui',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,         // true só se for HTTPS
    httpOnly: true,
    sameSite: 'lax'        // ou 'none' se usar HTTPS + domínios diferentes
  }
}));


// Rota simples de teste
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando!' });
});


const Usuario = require('./models/usuarios'); // isso garante que a tabela seja criada
const Cliente = require("./models/clientes");
const Servico = require("./models/servicos");
const Vendas = require("./models/vendas");
const VendaServico= require("./models/VendaServico");
const Despesas = require("./models/despesa");
const Agendamento = require("./models/agendamento");
const AgendamentoServico = require("./models/agendaServico");



const UsuarioController = require("./controllers/usuarioController")
app.use("/", UsuarioController);



const clientesoController = require("./controllers/clientesController")
app.use("/",clientesoController);

app.use(express.json());
  


// GET /sessao - verifica se o usuário está autenticado
app.get('/sessao', (req, res) => {
  if (req.session.usuario) {
    res.json({ logado: true, usuario: req.session.usuario });
  } else {
    res.json({ logado: false });
  }
});



// GET /logout - encerra a sessão do usuário
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Erro ao encerrar sessão:', err);
      return res.status(500).json({ erro: 'Erro ao sair' });
    }
    res.clearCookie('connect.sid'); // limpa o cookie de sessão
    res.json({ mensagem: 'Sessão encerrada com sucesso.' });
  });
});


// Inicializa conexão com o banco e sobe o servidor
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
