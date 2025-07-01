const jwt = require('jsonwebtoken');
const JWT_SECRET = 'berna12890i'; // Em produção, use dotenv para proteger esse segredo

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    // Salvamos as informações úteis do usuário no request
    req.usuario = {
      id: payload.id,
      nome: payload.nome,
      email: payload.email,
      funcao: payload.funcao
    };

    next(); // continua para a próxima função/rota
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido' });
  }
};
