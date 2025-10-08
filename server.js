// 1. Importar as bibliotecas necessárias
const express = require('express');
const cors = require('cors');
const path = require('path');

// 2. Inicializar o servidor express
const app = express();
const PORT = process.env.PORT || 3000;

// 3. Configurar os Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve os arquivos da pasta public

// =================================================================
// NOSSO BANCO DE DADOS FAKE (EM MEMÓRIA)
// =================================================================
let db = {
    // Lista de nomes dos grupos
    grupos: ["Exemplo de Grupo A", "Exemplo de Grupo B"],
    // Um objeto onde cada chave é o nome de um grupo,
    // e o valor é a lista de solicitações daquele grupo.
    solicitacoes: {
        "Exemplo de Grupo A": [
            { id: 1665586800000, item: "Mouse sem fio", quantidade: 5, status: 'pendente', solicitante: 'Ana', setor: 'TI', data: '12/10/2025', justificativa: 'Para novos funcionários', link: '' }
        ],
        "Exemplo de Grupo B": []
    }
};
// =================================================================
// API PARA GERENCIAR GRUPOS
// =================================================================

// [GET] Rota para buscar todos os grupos
app.get('/api/grupos', (req, res) => {
    res.json(db.grupos);
});

// [POST] Rota para criar um novo grupo
app.post('/api/grupos', (req, res) => {
    const { nome } = req.body; // Espera um objeto { "nome": "Novo Grupo" }
    if (!nome || db.grupos.includes(nome)) {
        return res.status(400).json({ error: 'Nome do grupo inválido ou já existente.' });
    }
    db.grupos.push(nome);
    db.solicitacoes[nome] = []; // Cria uma lista vazia de solicitações para o novo grupo
    console.log(`Grupo criado: ${nome}`);
    res.status(201).json({ nome });
});

// [DELETE] Rota para excluir um grupo
app.delete('/api/grupos/:nome', (req, res) => {
    const nomeDoGrupo = req.params.nome;
    db.grupos = db.grupos.filter(g => g !== nomeDoGrupo);
    delete db.solicitacoes[nomeDoGrupo];
    console.log(`Grupo deletado: ${nomeDoGrupo}`);
    res.status(204).send(); // 204 = No Content (sucesso, sem conteúdo para retornar)
});


// =================================================================
// API PARA GERENCIAR SOLICITAÇÕES
// =================================================================

// [GET] Rota para buscar as solicitações de um grupo específico
app.get('/api/solicitacoes/:grupo', (req, res) => {
    const nomeDoGrupo = req.params.grupo;
    const solicitacoesDoGrupo = db.solicitacoes[nomeDoGrupo] || [];
    res.json(solicitacoesDoGrupo);
});

// [POST] Rota para adicionar uma nova solicitação a um grupo
app.post('/api/solicitacoes/:grupo', (req, res) => {
    const nomeDoGrupo = req.params.grupo;
    const novaSolicitacao = req.body;
    novaSolicitacao.id = Date.now(); // Garante um ID único
    
    if (!db.solicitacoes[nomeDoGrupo]) {
        return res.status(404).json({ error: 'Grupo não encontrado.' });
    }

    db.solicitacoes[nomeDoGrupo].unshift(novaSolicitacao); // Adiciona no início da lista
    console.log(`Nova solicitação em "${nomeDoGrupo}": ${novaSolicitacao.item}`);
    res.status(201).json(novaSolicitacao);
});

// [PUT] Rota para atualizar o status de uma solicitação
app.put('/api/solicitacoes/:grupo/:id', (req, res) => {
    const { grupo, id } = req.params;
    const { status } = req.body;
    const solicitacaoId = parseInt(id, 10);

    if (!db.solicitacoes[grupo]) {
        return res.status(404).json({ error: 'Grupo não encontrado.' });
    }
    
    const solicitacaoParaAtualizar = db.solicitacoes[grupo].find(s => s.id === solicitacaoId);

    if (solicitacaoParaAtualizar) {
        solicitacaoParaAtualizar.status = status;
        console.log(`Status atualizado para "${status}" no item ${solicitacaoParaAtualizar.item}`);
        res.json(solicitacaoParaAtualizar);
    } else {
        res.status(404).json({ error: 'Solicitação não encontrada.' });
    }
});

// 4. Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse seu site em http://localhost:${PORT}`);
});