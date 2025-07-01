const express = require('express');
const router = express.Router();
const Usuario  = require('../models/usuarios');
const Despesa = require("../models/despesa")
const Venda = require("../models/vendas");
const VendaServico = require("../models/VendaServico");


const Servico = require("../models/servicos")
const bcrypt = require('bcrypt');


const verificarToken = require("../middleware/auth");



router.post('/usuarios', async (req, res) => {
  try {
    const { nome, email, senha, funcao } = req.body;

    // Verifica se o email já está cadastrado
    const existente = await Usuario.findOne({ where: { email } });
    if (existente) {
      return res.status(400).json({ erro: 'Email já cadastrado.' });
    }

    // Se a função for 'admin', só permite se ainda não houver nenhum
    if (funcao === 'admin') {
      const jaExisteAdmin = await Usuario.findOne({ where: { funcao: 'admin' } });
      if (jaExisteAdmin) {
        return res.status(403).json({ erro: 'Cadastro de administrador não permitido.' });
      }
    }

    // Criptografa a senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Cria novo usuário
    const novoUsuario = await Usuario.create({
      nome,
      email,
      senha: senhaHash,
      funcao
    });

    // Gera token JWT
    const token = jwt.sign(
      {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        funcao: novoUsuario.funcao
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso.',
      token,
      usuario: {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        funcao: novoUsuario.funcao
      }
    });

  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    res.status(500).json({ erro: 'Erro interno ao cadastrar usuário.' });
  }
});

// GET /usuarios/existe-admin
router.get('/usuarios/existe-admin', async (req, res) => {
  try {
    const adminExiste = await Usuario.findOne({ where: { funcao: 'admin' } });
    res.json({ adminExiste: !!adminExiste });
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    res.status(500).json({ erro: 'Erro interno ao verificar admin.' });
  }
});










 

const jwt = require('jsonwebtoken');


const JWT_SECRET = 'berna12890i'; // substitua por algo seguro



// POST /login - Faz login e retorna token JWT
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(401).json({ erro: 'Usuário não encontrado.' });
    }

    if (usuario.ativo != 1) { // com != (não estritamente igual)
      return res.status(403).json({ erro: 'Hmm... Parece que sua conta está desativada. Contate um responsável..' });
    }
    
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Senha incorreta.' });
    }

    // ✅ Gera token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        funcao: usuario.funcao
      },
      JWT_SECRET,
      { expiresIn: '6h' }
    );

    // ✅ Retorna token + dados do usuário
    res.json({
      mensagem: 'Login realizado com sucesso.',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        funcao: usuario.funcao
      }
    });

  } catch (erro) {
    console.error('Erro ao fazer login:', erro);
    res.status(500).json({ erro: 'Erro interno ao fazer login.' });
  }
});




router.delete('/despesas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const despesa = await Despesa.findByPk(id);
    if (!despesa) {
      return res.status(404).json({ erro: 'Despesa não encontrada' });
    }

    await despesa.destroy();
    res.json({ mensagem: 'Despesa excluída com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao excluir despesa' });
  }
});


// GET /despesas - lista todas as despesas, ordenadas por data (mais recente primeiro)
router.get('/despesas', async (req, res) => {
  try {
    const despesas = await Despesa.findAll({
      order: [['dataDespesa', 'DESC']]
    });
    res.json(despesas);
  } catch (err) {
    console.error('Erro ao listar despesas:', err);
    res.status(500).json({ erro: 'Erro ao listar despesas.' });
  }
});



// GET /despesas/:id - busca uma despesa específica
router.get('/despesas/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const despesa = await Despesa.findByPk(id);
    if (!despesa) {
      return res.status(404).json({ erro: 'Despesa não encontrada.' });
    }
    res.json(despesa);
  } catch (err) {
    console.error('Erro ao buscar despesa:', err);
    res.status(500).json({ erro: 'Erro ao buscar despesa.' });
  }
});






  // POST /despesas - Cadastrar nova despesa
router.post('/cadastrar-despesas', async (req, res) => {
  try {
    const { descricao, valor, dataDespesa, tipo, observacoes } = req.body;

    if (!descricao || !valor || !dataDespesa || !tipo) {
      return res.status(400).json({ erro: 'Campos obrigatórios ausentes.' });
    }

    const novaDespesa = await Despesa.create({
      descricao,
      valor,
      dataDespesa,
      tipo,
      observacoes
    });

    res.status(201).json(novaDespesa);
  } catch (error) {
    console.error('Erro ao cadastrar despesa:', error);
    res.status(500).json({ erro: 'Erro ao cadastrar despesa.' });
  }
});









const { Op, fn, col, literal} = require('sequelize')

router.get('/relatorio-servico', async (req, res) => {
  try {
    const { servicoIds, periodo } = req.query

    let ids = []
    if (Array.isArray(servicoIds)) {
      ids = servicoIds.map(Number)
    } else if (servicoIds) {
      ids = [Number(servicoIds)]
    }

    if (!ids.length || !periodo) {
      return res.status(400).json({ message: 'Serviço(s) ou período não fornecido(s)' })
    }

    // calcular período
    let endDate = new Date()
    let startDate = new Date(endDate)

    switch (periodo) {
      case 'dia': break
      case 'semana': startDate.setDate(endDate.getDate() - 7); break
      case 'mes': startDate.setMonth(endDate.getMonth() - 1); break
      case 'trimestre': startDate.setMonth(endDate.getMonth() - 3); break
      case 'ano': startDate.setFullYear(endDate.getFullYear() - 1); break
      default: return res.status(400).json({ message: 'Período inválido' })
    }

    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)

    const vendas = await Venda.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      }
    })

    const vendaIds = vendas.map(v => v.id)

    const servicos = await Servico.findAll({
      where: { id: { [Op.in]: ids } }
    })

    const precos = {}
    const nomes = {}
    servicos.forEach(s => {
      precos[s.id] = parseFloat(s.preco)
      nomes[s.id] = s.nome
    })

    const vendasServicos = await VendaServico.findAll({
      where: {
        VendaId: { [Op.in]: vendaIds },
        ServicoId: { [Op.in]: ids }
      }
    })

    // calcular totais, quantidades, médias
    const totaisPorServico = {}
    const quantidadesPorServico = {}
    let totalVendido = 0
    let totalServicosVendidos = 0

    vendasServicos.forEach(vs => {
      const id = vs.ServicoId
      const preco = precos[id] || 0
      totaisPorServico[id] = (totaisPorServico[id] || 0) + preco
      quantidadesPorServico[id] = (quantidadesPorServico[id] || 0) + 1
      totalVendido += preco
      totalServicosVendidos += 1
    })

    const detalhesServicos = Object.entries(totaisPorServico).map(([id, total]) => {
      const quantidade = quantidadesPorServico[id]
      return {
        id: Number(id),
        nome: nomes[id],
        quantidade,
        total,
        media: quantidade ? total / quantidade : 0
      }
    })

    const despesas = await Despesa.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      }
    })

    const totalDespesas = despesas.reduce((sum, d) => sum + parseFloat(d.valor), 0)
    const saldo = totalVendido - totalDespesas

    res.json({
      dataInicio: startDate.toISOString().slice(0, 10),
      dataFim: endDate.toISOString().slice(0, 10),
      totalVendas: vendas.length,
      totalServicosVendidos,
      detalhesServicos,
      totalVendido,
      totalDespesas,
      saldo
    })
  } catch (error) {
    console.error('Erro ao gerar relatório completo:', error)
    res.status(500).json({ message: 'Erro no servidor ao gerar relatório' })
  }
})






router.get('/dashboard', async (req, res) => {
  try {
    const hoje = new Date();
    const inicioDia = new Date(hoje.setHours(0, 0, 0, 0));
    const fimDia = new Date(hoje.setHours(23, 59, 59, 999));

    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - 6);
    inicioSemana.setHours(0, 0, 0, 0);
    const fimSemana = new Date();
    fimSemana.setHours(23, 59, 59, 999);

    const vendasHoje = await Venda.findAll({
      where: { createdAt: { [Op.between]: [inicioDia, fimDia] } }
    });

    const vendasSemana = await Venda.findAll({
      where: { createdAt: { [Op.between]: [inicioSemana, fimSemana] } }
    });

    const vendaIdsHoje = vendasHoje.map(v => v.id);
    const vendaIdsSemana = vendasSemana.map(v => v.id);

    const servicos = await Servico.findAll();
    const precos = {}, nomes = {};
    servicos.forEach(s => {
      precos[s.id] = parseFloat(s.preco);
      nomes[s.id] = s.nome;
    });

    const vendaServicosHoje = await VendaServico.findAll({
      where: { VendaId: { [Op.in]: vendaIdsHoje } }
    });

    const totalVendasHoje = vendaServicosHoje.reduce((total, vs) => {
      const preco = precos[vs.ServicoId] || 0;
      return total + preco;
    }, 0);

    const vendaServicosSemana = await VendaServico.findAll({
      where: { VendaId: { [Op.in]: vendaIdsSemana } }
    });

    let totalSemana = 0;
    const servicosMaisVendidos = {};
    const vendasPorDia = {
      0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 // domingo a sábado
    };

    const vendasMap = {};
    vendasSemana.forEach(v => {
      vendasMap[v.id] = v.createdAt;
    });

    vendaServicosSemana.forEach(vs => {
      const id = vs.ServicoId;
      const preco = precos[id] || 0;
      const dataVenda = vendasMap[vs.VendaId];
      const diaSemana = new Date(dataVenda).getDay(); // 0 = domingo

      vendasPorDia[diaSemana] += preco;

      totalSemana += preco;
      if (!servicosMaisVendidos[id]) {
        servicosMaisVendidos[id] = { nome: nomes[id], quantidade: 0, total: 0 };
      }
      servicosMaisVendidos[id].quantidade += 1;
      servicosMaisVendidos[id].total += preco;
    });

    const topServicos = Object.entries(servicosMaisVendidos)
      .map(([id, dados]) => ({ id: Number(id), ...dados }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);

    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const vendasPorDiaArray = dias.map((dia, i) => ({
      dia,
      total: vendasPorDia[i]
    }));

    res.json({
      quantidadeAtendimentosHoje: vendasHoje.length,
      totalVendasHoje,
      vendasDaSemana: totalSemana,
      servicosMaisVendidosSemana: topServicos,
      vendasPorDiaSemana: vendasPorDiaArray
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    res.status(500).json({ message: 'Erro ao carregar dados do dashboard' });
  }
});




router.delete('/servicos/:id', async (req, res) => {
  const id = req.params.id
  try {
    const servico = await Servico.findByPk(id)
    if (!servico) return res.status(404).json({ erro: 'Serviço não encontrado.' })

    await servico.update({ ativo: false })
    res.json({ mensagem: 'Serviço desativado com sucesso.' })
  } catch (err) {
    console.error('Erro ao excluir serviço:', err)
    res.status(500).json({ erro: 'Falha ao excluir serviço.' })
  }
})





router.get('/painel/indicadores', async (req, res) => {
  const agora = new Date();
  const inicioMesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
  const fimMesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0);

  try {
    // Total de receitas no mês atual
    const receitas = await Venda.findAll({
      where: { dataVenda: { [Op.gte]: inicioMesAtual } },
      attributes: ['valorTotal']
    });
    const totalReceitas = receitas.reduce((acc, venda) => acc + parseFloat(venda.valorTotal), 0);

    // Total de despesas no mês atual
    const despesas = await Despesa.findAll({
      where: { dataDespesa: { [Op.gte]: inicioMesAtual } },
      attributes: ['valor']
    });
    const totalDespesas = despesas.reduce((acc, despesa) => acc + parseFloat(despesa.valor), 0);

    // Ticket médio por cliente
    const clientesUnicos = [...new Set((await Venda.findAll({
      where: { dataVenda: { [Op.gte]: inicioMesAtual } },
      attributes: ['clienteId']
    })).map(v => v.clienteId))];
    const ticketMedio = clientesUnicos.length > 0 ? totalReceitas / clientesUnicos.length : 0;

    // Funcionário mais produtivo
    const vendasFuncionario = await Venda.findAll({
      where: { dataVenda: { [Op.gte]: inicioMesAtual } },
      attributes: ['UsuarioId', 'valorTotal']
    });

    const receitaPorFuncionario = {};
    for (const venda of vendasFuncionario) {
      const id = venda.UsuarioId;
      if (!id) continue;
      receitaPorFuncionario[id] = (receitaPorFuncionario[id] || 0) + parseFloat(venda.valorTotal);
    }

    let funcionarioTop = 'Nenhum';
    let maiorReceita = 0;
    const usuarios = await Usuario.findAll({ attributes: ['id', 'nome'] });
    usuarios.forEach(user => {
      if (receitaPorFuncionario[user.id] && receitaPorFuncionario[user.id] > maiorReceita) {
        funcionarioTop = user.nome;
        maiorReceita = receitaPorFuncionario[user.id];
      }
    });

    // Serviço mais vendido
    const vendasMes = await Venda.findAll({
      where: { dataVenda: { [Op.gte]: inicioMesAtual } },
      attributes: ['id']
    });
    const idsVendasMes = vendasMes.map(v => v.id);

    const servicosVendidos = await VendaServico.findAll({
      where: { VendaId: idsVendasMes },
      attributes: ['ServicoId']
    });

    const contagemServicos = {};
    servicosVendidos.forEach(s => {
      contagemServicos[s.ServicoId] = (contagemServicos[s.ServicoId] || 0) + 1;
    });

    let servicoTop = 'Nenhum';
    let maisVendido = 0;
    const servicos = await Servico.findAll({ attributes: ['id', 'nome'] });
    servicos.forEach(s => {
      if (contagemServicos[s.id] && contagemServicos[s.id] > maisVendido) {
        servicoTop = s.nome;
        maisVendido = contagemServicos[s.id];
      }
    });

    // Comparação com mês anterior
    const receitasAntigas = await Venda.findAll({
      where: {
        dataVenda: {
          [Op.gte]: inicioMesAnterior,
          [Op.lte]: fimMesAnterior
        }
      },
      attributes: ['valorTotal']
    });

    const totalAntigo = receitasAntigas.reduce((acc, venda) => acc + parseFloat(venda.valorTotal), 0);
    const variacao = totalAntigo ? ((totalReceitas - totalAntigo) / totalAntigo) * 100 : 0;

    res.json({
      totalReceitas: totalReceitas.toFixed(2),
      totalDespesas: totalDespesas.toFixed(2),
      lucro: (totalReceitas - totalDespesas).toFixed(2),
      ticketMedio: ticketMedio.toFixed(2),
      funcionarioTop,
      servicoTop,
      variacaoPercentual: variacao.toFixed(2)
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar indicadores' });
  }
});


router.get('/painel/indicadores/geral', async (req, res) => {
  try {
    // Total geral de receitas
    const receitas = await Venda.findAll({
      attributes: ['valorTotal']
    });
    const totalReceitas = receitas.reduce((acc, venda) => acc + parseFloat(venda.valorTotal), 0);

    // Total geral de despesas
    const despesas = await Despesa.findAll({
      attributes: ['valor']
    });
    const totalDespesas = despesas.reduce((acc, despesa) => acc + parseFloat(despesa.valor), 0);

    // Lucro geral
    const lucro = totalReceitas - totalDespesas;

    res.json({
      totalReceitas: totalReceitas.toFixed(2),
      totalDespesas: totalDespesas.toFixed(2),
      lucro: lucro.toFixed(2)
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar indicadores gerais' });
  }
});



















const moment = require('moment');

// Função para gerar os últimos 6 meses no formato YYYY-MM
const gerarUltimosMeses = () => {
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    meses.push(moment().subtract(i, 'months').format('YYYY-MM'));
  }
  return meses;
};




router.get('/painel-analitico/graficos', async (req, res) => {
  try {
    const meses = gerarUltimosMeses();

    // 1. Receita e Despesas por mês (para saldo)
    const vendasPorMes = await Venda.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('dataVenda'), '%Y-%m'), 'mes'],
        [fn('SUM', col('valorTotal')), 'total']
      ],
      group: ['mes'],
    });

    const despesasPorMes = await Despesa.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('dataDespesa'), '%Y-%m'), 'mes'],
        [fn('SUM', col('valor')), 'total']
      ],
      group: ['mes'],
    });

    const financeiro = meses.map(mes => {
      const receita = vendasPorMes.find(v => v.dataValues.mes === mes)?.dataValues.total || 0;
      const despesa = despesasPorMes.find(d => d.dataValues.mes === mes)?.dataValues.total || 0;
      return {
        nome: moment(mes, 'YYYY-MM').format('MMM/YYYY'),
        quantidade: receita - despesa
      };
    });

    // 1b. Receita e Despesas separadas por mês (para gráfico comparativo)
    const receitaPorMes = meses.map(mes => ({
      nome: moment(mes, 'YYYY-MM').format('MMM/YYYY'),
      quantidade: parseFloat(vendasPorMes.find(v => v.dataValues.mes === mes)?.dataValues.total || 0)
    }));

    const despesaPorMes = meses.map(mes => ({
      nome: moment(mes, 'YYYY-MM').format('MMM/YYYY'),
      quantidade: parseFloat(despesasPorMes.find(d => d.dataValues.mes === mes)?.dataValues.total || 0)
    }));

    const receitaDespesaDetalhado = {
      receita: receitaPorMes,
      despesa: despesaPorMes
    };

    // 2. Vendas por funcionário
    const vendasFuncionarios = await Venda.findAll({
      attributes: [
        'usuarioId',
        [fn('SUM', col('valorTotal')), 'total']
      ],
      group: ['usuarioId']
    });

    const usuarioIds = [...new Set(vendasFuncionarios.map(v => v.get('usuarioId')).filter(Boolean))];
    const usuarios = await Usuario.findAll({
      where: { id: usuarioIds },
      attributes: ['id', 'nome']
    });
    const usuariosMap = Object.fromEntries(usuarios.map(u => [u.id, u.nome]));

    const funcionarios = vendasFuncionarios.map(v => {
      const usuarioId = v.get('usuarioId');
      return {
        nome: usuariosMap[usuarioId] || 'Desconhecido',
        quantidade: parseFloat(v.get('total'))
      };
    });

    // 3. Serviços mais vendidos
    const vendasServicos = await VendaServico.findAll({
      attributes: [
        'servicoId',
        [fn('COUNT', col('servicoId')), 'quantidade']
      ],
      group: ['servicoId']
    });

    const servicoIds = [...new Set(vendasServicos.map(v => v.get('servicoId')).filter(Boolean))];
    const servicosInfo = await Servico.findAll({
      where: { id: servicoIds },
      attributes: ['id', 'nome']
    });
    const servicosMap = Object.fromEntries(servicosInfo.map(s => [s.id, s.nome]));

    const servicos = vendasServicos.map(v => {
      const servicoId = v.get('servicoId');
      return {
        nome: servicosMap[servicoId] || 'N/A',
        quantidade: parseInt(v.get('quantidade'))
      };
    });

    res.json({
      financeiro,
      funcionarios,
      servicos,
      receitaDespesaDetalhado
    });

    console.log('Dados gráficos enviados com sucesso.');
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao carregar dados dos gráficos.' });
  }
});













const Cliente = require("../models/clientes");

















const dayjs = require('dayjs')

router.get('/painel-analitico/listagens', async (req, res) => {
  try {
    const { funcionarioId, servicoId, periodo } = req.query

    const whereVenda = {}
    const whereDespesa = {}

    // Calcular intervalo de datas conforme o período
    if (periodo) {
      const hoje = dayjs().startOf('day')
      let inicio, fim

      switch (periodo) {
        case 'hoje':
          inicio = hoje
          fim = hoje.endOf('day')
          break
        case 'semana':
          inicio = hoje.startOf('week')
          fim = hoje.endOf('week')
          break
        case 'mes':
          inicio = hoje.startOf('month')
          fim = hoje.endOf('month')
          break
        case 'trimestre':
          inicio = hoje.startOf('quarter')
          fim = hoje.endOf('quarter')
          break
        case 'semestre':
          inicio = hoje.month() < 6
            ? hoje.startOf('year')
            : hoje.month(6).startOf('month')
          fim = hoje.month() < 6
            ? hoje.month(5).endOf('month')
            : hoje.endOf('year')
          break
        case 'ano':
          inicio = hoje.startOf('year')
          fim = hoje.endOf('year')
          break
        default:
          break
      }

      if (inicio && fim) {
        whereVenda.dataVenda = { [Op.between]: [inicio.toDate(), fim.toDate()] }
        whereDespesa.dataDespesa = { [Op.between]: [inicio.toDate(), fim.toDate()] }
      }
    }

    if (funcionarioId) {
      whereVenda.UsuarioId = funcionarioId
    }

    const vendas = await Venda.findAll({ where: whereVenda, raw: true })

    const [usuarios, clientes, servicos, vendasServicos] = await Promise.all([
      Usuario.findAll({ raw: true }),
      Cliente.findAll({ raw: true }),
      Servico.findAll({ raw: true }),
      VendaServico.findAll({ raw: true })
    ])

    const vendasDetalhadas = vendas
      .map(venda => {
        const cliente = clientes.find(c => c.id === venda.clienteId)
        const funcionario = usuarios.find(u => u.id === venda.UsuarioId)

        const servicosDaVendaIds = vendasServicos
          .filter(vs => vs.VendaId === venda.id)
          .map(vs => vs.ServicoId)

        const nomesServicos = servicos
          .filter(s => servicosDaVendaIds.includes(s.id))
          .map(s => s.nome)

        if (servicoId && !servicosDaVendaIds.includes(Number(servicoId))) {
          return null
        }

        return {
          id: venda.id,
          cliente: cliente?.nome || 'N/A',
          funcionario: funcionario?.nome || 'N/A',
          valor: venda.valorTotal,
          data: venda.dataVenda,
          servicos: nomesServicos
        }
      })
      .filter(Boolean)

    const despesas = await Despesa.findAll({ where: whereDespesa, raw: true })

    const despesasDetalhadas = despesas.map(d => ({
      id: d.id,
      descricao: d.descricao,
      tipo: d.tipo,
      valor: d.valor,
      data: d.dataDespesa
    }))

    res.json({
      vendas: vendasDetalhadas,
      despesas: despesasDetalhadas
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao buscar dados do painel analítico.' })
  }
})





router.get('/todos-servicos', async (req, res) => {
  try {
    const servicos = await Servico.findAll({
      attributes: ['id', 'nome', 'descricao', 'preco', 'ativo'], // adicione os campos aqui
      raw: true
    })
    res.json(servicos)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao buscar serviços' })
  }
})


router.get('/todos-funcionarios', async (req, res) => {
  try {
    const funcionarios = await Usuario.findAll({
      attributes: ['id', 'nome'],
      raw: true
    })
    res.json(funcionarios)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao buscar funcionários' })
  }
})


















router.get('/relatorio/funcionarios', async (req, res) => {
  const { periodo, inicio, fim, funcionarios } = req.query;

  let dataInicio, dataFim;
  const hoje = new Date();

  switch (periodo) {
    case 'hoje':
      dataInicio = new Date(hoje.setHours(0, 0, 0, 0));
      dataFim = new Date(hoje.setHours(23, 59, 59, 999));
      break;
    case 'semana':
      const diaSemana = hoje.getDay(); // 0 = domingo
      dataInicio = new Date(hoje);
      dataInicio.setDate(hoje.getDate() - diaSemana);
      dataInicio.setHours(0, 0, 0, 0);
      dataFim = new Date();
      dataFim.setHours(23, 59, 59, 999);
      break;
    case 'mes':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      dataFim = new Date();
      dataFim.setHours(23, 59, 59, 999);
      break;
    case 'trimestre':
      const mesAtual = hoje.getMonth();
      const inicioTrimestre = mesAtual - (mesAtual % 3);
      dataInicio = new Date(hoje.getFullYear(), inicioTrimestre, 1);
      dataFim = new Date();
      dataFim.setHours(23, 59, 59, 999);
      break;
    case 'personalizado':
      if (!inicio || !fim) {
        return res.status(400).json({ erro: 'Datas de início e fim são obrigatórias.' });
      }
      dataInicio = new Date(inicio);
      dataFim = new Date(fim);
      dataFim.setHours(23, 59, 59, 999);
      break;
    default:
      return res.status(400).json({ erro: 'Período inválido.' });
  }

  try {
    const idsSelecionados = funcionarios?.split(',').map(id => parseInt(id)) || [];

    const vendas = await Venda.findAll({
      where: {
        UsuarioId: { [Op.in]: idsSelecionados },
        createdAt: {
          [Op.between]: [dataInicio, dataFim]
        }
      },
      attributes: ['UsuarioId', 'valorTotal', 'id'],
      raw: true
    });

    const dadosPorFuncionario = {};

    for (const venda of vendas) {
      const id = venda.UsuarioId;
      if (!dadosPorFuncionario[id]) {
        dadosPorFuncionario[id] = {
          atendimentos: 0,
          totalReceita: 0,
          vendas: new Set()
        };
      }
      dadosPorFuncionario[id].atendimentos++;
      dadosPorFuncionario[id].totalReceita += parseFloat(venda.valorTotal);
      dadosPorFuncionario[id].vendas.add(venda.id);
    }

    const usuarios = await Usuario.findAll({
      where: { id: { [Op.in]: idsSelecionados } },
      attributes: ['id', 'nome'],
      raw: true
    });

    const relatorio = usuarios.map(user => {
      const dados = dadosPorFuncionario[user.id] || {
        atendimentos: 0,
        totalReceita: 0,
        vendas: new Set()
      };
      const totalVendas = dados.vendas.size;
      const ticketMedio = totalVendas ? dados.totalReceita / totalVendas : 0;

      return {
        nome: user.nome,
        atendimentos: dados.atendimentos,
        totalReceita: dados.totalReceita.toFixed(2),
        ticketMedio: ticketMedio.toFixed(2)
      };
    });

    res.json(relatorio);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao gerar relatório de funcionários' });
  }
});



const auth = require("../middleware/auth")


router.get('/perfil', auth, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    // Busca os dados do usuário (excluindo a senha)
    const usuario = await Usuario.findOne({
      where: { id: usuarioId },
      attributes: ['id', 'nome', 'email', 'funcao', 'ativo', 'createdAt'],
      raw: true,
    });

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    // Total de vendas feitas pelo usuário
    const totalVendas = await Venda.count({
      where: { UsuarioId: usuarioId }
    });

    // Valor total vendido pelo usuário
    const valorTotalVendido = await Venda.sum('valorTotal', {
      where: { UsuarioId: usuarioId }
    }) || 0;

    // Últimas 5 vendas feitas pelo usuário
    const ultimasVendas = await Venda.findAll({
      where: { UsuarioId: usuarioId },
      attributes: ['dataVenda', 'valorTotal', 'observacoes'],
      order: [['dataVenda', 'DESC']],
      limit: 5,
      raw: true,
    });

    // Se for admin, envia dados extras
    if (usuario.funcao === 'admin') {
      const totalUsuarios = await Usuario.count();
      const totalClientes = await Cliente.count();
      const totalServicos = await Servico.count();

      return res.json({
        usuario,
        totalVendas,
        valorTotalVendido,
        ultimasVendas,
        adminExtra: {
          totalUsuarios,
          totalClientes,
          totalServicos
        }
      });
    }

    // Para usuários comuns, sem extras
    return res.json({
      usuario,
      totalVendas,
      valorTotalVendido,
      ultimasVendas
    });

  } catch (error) {
    console.error('Erro ao buscar dados do perfil:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});












































router.get('/gerir-usuarios', auth, async (req, res) => {
  try {
    if (req.usuario.funcao !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }

    const usuarios = await Usuario.findAll({
      attributes: ['id', 'nome', 'email', 'funcao', 'ativo', 'createdAt'],
      order: [['createdAt', 'DESC']],
      raw: true
    });

    res.json(usuarios);
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    res.status(500).json({ erro: 'Erro interno ao buscar usuários' });
  }
});

// Exclui um usuário
router.delete('/usuarios/:id', auth, async (req, res) => {
  try {
    if (req.usuario.funcao !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }

    const usuario = await Usuario.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    await usuario.destroy();

    res.json({ mensagem: 'Usuário excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir usuário:', err);
    res.status(500).json({ erro: 'Erro interno ao excluir usuário' });
  }
});


// Atualiza função de um usuário
router.put('/usuarios/:id/funcao', auth, async (req, res) => {
  try {
    if (req.usuario.funcao !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }

    const { funcao } = req.body;
    const usuario = await Usuario.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    usuario.funcao = funcao;
    await usuario.save();

    res.json({ mensagem: 'Função atualizada com sucesso' });
  } catch (err) {
    console.error('Erro ao atualizar função:', err);
    res.status(500).json({ erro: 'Erro interno ao atualizar função' });
  }
});


// Atualiza status (ativo/inativo) de um usuário
router.put('/usuarios/:id/status', auth, async (req, res) => {
  try {
    if (req.usuario.funcao !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }

    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    usuario.ativo = req.body.ativo;
    await usuario.save();

    res.json({ mensagem: 'Status atualizado com sucesso' });
  } catch (err) {
    console.error('Erro ao atualizar status:', err);
    res.status(500).json({ erro: 'Erro interno ao atualizar status' });
  }
});






router.put('/usuarios/me/dados', auth, async (req, res) => {
  try {
    const { nome, email } = req.body;
    const usuarioId = req.usuario.id;

    const dadosAtualizar = {};
    if (nome) dadosAtualizar.nome = nome;
    if (email) {
      // Verifica se o novo e-mail já está sendo usado por outro usuário
      const emailEmUso = await Usuario.findOne({
        where: {
          email,
          id: { [Op.ne]: usuarioId }
        }
      });
      if (emailEmUso) {
        return res.status(400).json({ erro: 'Este e-mail já está em uso por outro usuário.' });
      }
      dadosAtualizar.email = email;
    }

    if (Object.keys(dadosAtualizar).length === 0) {
      return res.status(400).json({ erro: 'Nenhum dado enviado para atualização.' });
    }

    await Usuario.update(dadosAtualizar, { where: { id: usuarioId } });
    res.json({ mensagem: 'Dados atualizados com sucesso.' });

  } catch (error) {
    console.error('Erro ao atualizar dados do usuário:', error);
    res.status(500).json({ erro: 'Erro interno ao atualizar dados.' });
  }
});



// Atualizar senha do usuário autenticado
router.put('/usuarios/me/senha', auth, async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    const usuarioId = req.usuario.id;

    const usuario = await Usuario.findByPk(usuarioId);

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    // Verifica se a senha atual está correta
    const senhaConfere = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!senhaConfere) {
      return res.status(401).json({ erro: 'Senha atual incorreta.' });
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
    await Usuario.update({ senha: novaSenhaHash }, { where: { id: usuarioId } });

    res.json({ mensagem: 'Senha atualizada com sucesso.' });

  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ erro: 'Erro interno ao atualizar senha.' });
  }
});



module.exports = router;
