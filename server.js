// 1. Importar as bibliotecas necessárias
require('dotenv').config(); // Carrega as variáveis do .env para o ambiente local
const express = require('express');
const cors = require('cors');
const path = require('path');
// Importa a função 'sql' da biblioteca otimizada da Vercel
const { sql } = require('@vercel/postgres'); 

// 2. Inicializar o servidor express
const app = express();
const PORT = process.env.PORT || 3000;

// 3. Configurar os Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// =================================================================
// API PARA GERENCIAR GRUPOS (CONECTADA AO BANCO DE DADOS REAL)
// =================================================================

// [GET] Rota para buscar todos os grupos
app.get('/api/grupos', async (req, res) => {
    try {
        // Usa a sintaxe de template literal (crases ``) para a query SQL
        const { rows } = await sql`SELECT nome FROM grupos ORDER BY created_at DESC;`;
        // Extrai apenas os nomes dos grupos do resultado
        const nomesDosGrupos = rows.map(grupo => grupo.nome);
        res.json(nomesDosGrupos);
    } catch (error) {
        console.error('Erro ao buscar grupos:', error);
        res.status(500).json({ error: error.message });
    }
});

// [POST] Rota para criar um novo grupo
app.post('/api/grupos', async (req, res) => {
    const { nome } = req.body;
    try {
        // Insere o novo grupo na tabela
        await sql`INSERT INTO grupos (nome) VALUES (${nome});`;
        res.status(201).json({ nome });
    } catch (error) {
        console.error('Erro ao criar grupo:', error);
        // Código '23505' é o erro padrão para violação de chave única (nome duplicado)
        if (error.code === '23505') { 
            return res.status(400).json({ error: 'Já existe um grupo com este nome.' });
        }
        res.status(500).json({ error: error.message });
    }
});

// [DELETE] Rota para excluir um grupo e suas respectivas solicitações
app.delete('/api/grupos/:nome', async (req, res) => {
    const nomeDoGrupo = req.params.nome;
    try {
        // Deleta primeiro as solicitações associadas para manter a integridade
        await sql`DELETE FROM solicitacoes WHERE grupo_nome = ${nomeDoGrupo};`;
        // Depois deleta o grupo principal
        await sql`DELETE FROM grupos WHERE nome = ${nomeDoGrupo};`;
        console.log(`Grupo deletado: ${nomeDoGrupo}`);
        res.status(204).send(); // Resposta de sucesso sem conteúdo
    } catch (error) {
        console.error('Erro ao deletar grupo:', error);
        res.status(500).json({ error: error.message });
    }
});

// =================================================================
// API PARA GERENCIAR SOLICITAÇÕES (CONECTADA AO BANCO DE DADOS REAL)
// =================================================================

// [GET] Rota para buscar as solicitações de um grupo específico
app.get('/api/solicitacoes/:grupo', async (req, res) => {
    const nomeDoGrupo = req.params.grupo;
    try {
        const { rows } = await sql`SELECT * FROM solicitacoes WHERE grupo_nome = ${nomeDoGrupo} ORDER BY created_at DESC;`;
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar solicitações:', error);
        res.status(500).json({ error: error.message });
    }
});

// [POST] Rota para adicionar uma nova solicitação a um grupo
app.post('/api/solicitacoes/:grupo', async (req, res) => {
    const nomeDoGrupo = req.params.grupo;
    const { item, quantidade, status, solicitante, setor, data, justificativa, link } = req.body;
    try {
        const { rows } = await sql`
            INSERT INTO solicitacoes (grupo_nome, item, quantidade, status, solicitante, setor, data, justificativa, link) 
            VALUES (${nomeDoGrupo}, ${item}, ${quantidade}, ${status}, ${solicitante}, ${setor}, ${data}, ${justificativa}, ${link}) 
            RETURNING *;
        `;
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Erro ao criar solicitação:', error);
        res.status(500).json({ error: error.message });
    }
});

// [PUT] Rota para atualizar o status de uma solicitação
app.put('/api/solicitacoes/:grupo/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const { rows } = await sql`UPDATE solicitacoes SET status = ${status} WHERE id = ${id} RETURNING *;`;
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Solicitação não encontrada.' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ error: error.message });
    }
});

// Linha para compatibilidade com o ambiente local (desenvolvimento)
// A Vercel ignora este comando, mas ele é útil para você testar no seu PC
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}

// Exporta o app para a Vercel usar como uma função Serverless
module.exports = app;
