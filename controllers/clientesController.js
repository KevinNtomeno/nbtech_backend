const express = require('express');
const router = express.Router();
const Usuario  = require('../models/usuarios');
const Clientes  = require('../models/clientes');
const Servico  = require("../models/servicos")
const Vendas = require("../models/vendas")
const VendaServico = require("../models/VendaServico");

const bcrypt = require('bcrypt');





const auth = require('../middleware/auth'); // ajuste o caminho conforme necessário

router.post('/cadastrar-clientes', auth, async (req, res) => {
  console.log('req.body.valorTotal:', req.body.valorTotal)

  const t = await Clientes.sequelize.transaction();

  try {
    const {
      nome,
      telefone,
      email,
      dataNascimento,
      observacoes,
      localidade,
      dataAgendamento,
      servicosIds = [],
      valorTotal,
      dataVenda
    } = req.body;

    const usuarioId = req.usuario.id; // <- pega do middleware

    const novoCliente = await Clientes.create({
      nome,
      telefone,
      email,
      dataNascimento,
      observacoes,
      localidade,
      dataAgendamento
    }, { transaction: t });

    const novaVenda = await Vendas.create({
      clienteId: novoCliente.id,
      dataVenda: dataVenda || new Date(),
      valorTotal,
      observacoes,
      UsuarioId: usuarioId // <- aqui você registra o vendedor
    }, { transaction: t });

    if (servicosIds.length > 0) {
      const registros = servicosIds.map(servicoId => ({
        VendaId: novaVenda.id,
        ServicoId: servicoId
      }));

      await VendaServico.bulkCreate(registros, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ cliente: novoCliente, venda: novaVenda });

  } catch (error) {
    await t.rollback();
    console.error('Erro ao cadastrar cliente e venda:', error);
    res.status(500).json({ erro: 'Erro ao cadastrar cliente e venda.' });
  }
});



  // ROTA: POST /agendamentos/:id/finalizar
  router.post('/agendamentos/:id/finalizar', auth, async (req, res) => {
    const { id } = req.params
    try {

      const usuarioId = req.usuario.id; // <- pega do middleware

      // 1. Busca o agendamento
      const agendamento = await Agendamento.findByPk(id)
      if (!agendamento) {
        return res.status(404).json({ erro: 'Agendamento não encontrado' })
      }
  
      if (agendamento.finalizado) {
        return res.status(400).json({ erro: 'Agendamento já finalizado' })
      }
  
      // 2. Busca os serviços agendados
      const agendamentoServicos = await AgendamentoServico.findAll({
        where: { AgendamentoId: id }
      })
  
      if (agendamentoServicos.length === 0) {
        return res.status(400).json({ erro: 'Nenhum serviço encontrado para este agendamento' })
      }
  
      // 3. Calcula valor total corretamente
      let valorTotal = 0
      const vendaServicos = []
  
      for (const registro of agendamentoServicos) {
        const servico = await Servico.findByPk(registro.ServicoId)
        const preco = servico?.preco ?? registro.preco ?? 0
        const precoNumerico = parseFloat(preco) || 0
  
        valorTotal += precoNumerico
  
        vendaServicos.push({
          ServicoId: registro.ServicoId,
          preco: precoNumerico
        })
      }
  
      // 4. Cria a venda
      const novaVenda = await Vendas.create({
        clienteId: agendamento.ClienteId,
        dataVenda: new Date(),
        valorTotal,
        observacoes: agendamento.observacoes || '',
        UsuarioId: usuarioId
      })
  
      // 5. Registra cada serviço na venda
      for (const item of vendaServicos) {
        await VendaServico.create({
          VendaId: novaVenda.id,
          ServicoId: item.ServicoId,
          preco: item.preco
        })
      }
  
      // 6. Atualiza o agendamento como finalizado
      agendamento.finalizado = true
      await agendamento.save()
  
      res.json({ mensagem: 'Atendimento finalizado e venda registrada com sucesso.' })
    } catch (err) {
      console.error('Erro ao finalizar atendimento:', err)
      res.status(500).json({ erro: 'Erro ao finalizar atendimento' })
    }
  })
  


const Agendamento = require('../models/agendamento');
const AgendamentoServico = require('../models/agendaServico');




// POST /agendar-cliente
router.post('/agendar-cliente', async (req, res) => {
  const t = await Clientes.sequelize.transaction();

  try {
    const {
      nome,
      telefone,
      email,
      dataNascimento,
      localidade,
      dataAgendamento,
      observacoes,
      servicosIds = []
    } = req.body;

    // 1. Cria cliente
    const novoCliente = await Clientes.create({
      nome,
      telefone,
      email,
      dataNascimento,
      localidade,
      dataAgendamento,
      observacoes
    }, { transaction: t });

    // 2. Cria agendamento
    const novoAgendamento = await Agendamento.create({
      dataHora: dataAgendamento || new Date(),
      observacoes,
      ClienteId: novoCliente.id,
      finalizado: false
    }, { transaction: t });

    // 3. Relaciona serviços ao agendamento
    const servicos = await Servico.findAll({
      where: { id: servicosIds }
    });

    const registrosServicos = servicos.map(servico => ({
      preco: servico.preco,
      duracao: servico.duracao || null,
      observacoes: '',
      AgendamentoId: novoAgendamento.id,
      ServicoId: servico.id
    }));

    await AgendamentoServico.bulkCreate(registrosServicos, { transaction: t });

    await t.commit();
    res.status(201).json({ agendamento: novoAgendamento });

  } catch (erro) {
    await t.rollback();
    console.error('Erro ao agendar cliente:', erro);
    res.status(500).json({ erro: 'Erro ao agendar cliente.' });
  }
});



// GET /clientes - retorna todos os clientes ativos
router.get('/clientes', async (req, res) => {
  try {
    const lista = await Clientes.findAll({
      where: { ativo: 1 },
      order: [['createdAt', 'DESC']]
    });
    res.json(lista);
  } catch (err) {
    console.error('Erro ao listar clientes:', err);
    res.status(500).json({ erro: 'Falha ao listar clientes.' });
  }
});



// GET /clientes/:id/historico - sem include
router.get('/clientes/:id/historico', async (req, res) => {
  const id = req.params.id
  try {
    const vendas = await Vendas.findAll({
      where: { clienteId: id },
      order: [['dataVenda', 'DESC']]
    })

    const resultado = await Promise.all(
      vendas.map(async venda => {
        // Busca IDs de serviços da venda
        const vendaServicos = await VendaServico.findAll({
          where: { vendaId: venda.id }
        })

        const servicoIds = vendaServicos.map(vs => vs.servicoId)

        // Busca dados dos serviços diretamente
        const servicos = await Servico.findAll({
          where: { id: servicoIds }
        })

        return {
          id: venda.id,
          dataVenda: venda.dataVenda,
          valorTotal: Number(venda.valorTotal),
          observacoes: venda.observacoes,
          servicos: servicos.map(s => ({
            id: s.id,
            nome: s.nome,
            preco: Number(s.preco)
          }))
        }
      })
    )

    res.json(resultado)
  } catch (err) {
    console.error('Erro ao buscar histórico:', err)
    res.status(500).json({ erro: 'Falha ao carregar histórico.' })
  }
})


// DELETE /clientes/:id - Exclui um cliente por ID
router.delete('/clientes/:id', async (req, res) => {
  const id = req.params.id
  try {
    const cliente = await Clientes.findByPk(id)

    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado.' })
    }

    await cliente.destroy()
    res.json({ mensagem: 'Cliente excluído com sucesso.' })
  } catch (err) {
    console.error('Erro ao excluir cliente:', err)
    res.status(500).json({ erro: 'Erro ao excluir cliente.' })
  }
})
















  
  // POST /servicos - cadastrar novo serviço
router.post('/cadastrar-servicos', async (req, res) => {
    try {
      const { nome, descricao, preco } = req.body;
  
      if (!nome || !preco) {
        return res.status(400).json({ erro: 'Nome e preço são obrigatórios.' });
      }
  
      const novoServico = await Servico.create({
        nome,
        descricao,
        preco,
        
      });
  
      res.status(201).json(novoServico);
    } catch (error) {
      console.error('Erro ao cadastrar serviço:', error);
      res.status(500).json({ erro: 'Erro ao cadastrar serviço.' });
    }
  });
  



  // Atualizar serviço
router.patch('/salvar-servicos/:id', async (req, res) => {
  const { id } = req.params
  const { nome, descricao, preco, ativo } = req.body

  try {
    const servico = await Servico.findByPk(id)

    if (!servico) {
      return res.status(404).json({ erro: 'Serviço não encontrado.' })
    }

    await servico.update({ nome, descricao, preco, ativo })
    return res.json(servico)
  } catch (erro) {
    console.error('Erro ao atualizar serviço:', erro)
    return res.status(500).json({ erro: 'Erro interno ao atualizar serviço.' })
  }
});



// routes/servicos.js
router.get('/todos-servicos', async (_req, res) => {
  try {
    const servicos = await Servico.findAll({
      where: { ativo: 1 } // <-- FORÇANDO NÚMERO EM VEZ DE BOOLEANO
    });
    res.json(servicos);
  } catch (error) {
    console.error('Erro ao listar serviços:', error);
    res.status(500).json({ erro: 'Erro ao listar serviços.' });
  }
});

  

  


  // ROTA: GET /agendamentos
  router.get('/agendamentos', async (req, res) => {
    try {
      const { data } = req.query
      const where = {}
  
      if (data) {
        where.dataHora = {
          [Op.gte]: new Date(`${data}T00:00:00`),
          [Op.lt]: new Date(`${data}T23:59:59`)
        }
      }
  
      const agendamentos = await Agendamento.findAll({ where, order: [['dataHora', 'ASC']] })
  
      const agendamentosComCliente = await Promise.all(
        agendamentos.map(async (agendamento) => {
          const cliente = await Clientes.findByPk(agendamento.ClienteId)
          return {
            ...agendamento.toJSON(),
            clienteNome: cliente ? cliente.nome : 'Desconhecido'
          }
        })
      )
  
      res.json(agendamentosComCliente)
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err)
      res.status(500).json({ erro: 'Erro ao buscar agendamentos' })
    }
  })
  
  
  

  // ROTA: GET /agendamentos/:id/ficha
router.get('/agendamentos/:id/ficha', async (req, res) => {
  try {
    const { id } = req.params

    // Busca o agendamento
    const agendamento = await Agendamento.findByPk(id)

    if (!agendamento) {
      return res.status(404).json({ erro: 'Agendamento não encontrado' })
    }

    // Busca os serviços vinculados ao agendamento
    const agendamentoServicos = await AgendamentoServico.findAll({
      where: { AgendamentoId: id }
    })

    const servicos = await Promise.all(
      agendamentoServicos.map(async (registro) => {
        const servico = await Servico.findByPk(registro.ServicoId)
        return {
          ...registro.toJSON(),
          nome: servico?.nome || 'Serviço removido',
          preco: servico?.preco ?? registro.preco ?? 0
        }
      })
    )

    // Busca o cliente manualmente
    const cliente = await Clientes.findByPk(agendamento.ClienteId)

    res.json({
      agendamento,
      cliente: cliente || null,
      servicos
    })
  } catch (err) {
    console.error('Erro ao buscar ficha do agendamento:', err)
    res.status(500).json({ erro: 'Erro ao buscar ficha do agendamento' })
  }
})

  




router.get('/contador-agendamentos', async (req, res) => {
  try {
    const count = await Agendamento.count({
      where: { finalizado: 0 }
    })
    res.json({ count })
  } catch (error) {
    console.error('Erro ao contar agendamentos pendentes:', error)
    res.status(500).json({ error: 'Erro ao contar agendamentos pendentes' })
  }
})




module.exports = router;
