import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // --- ROTA: GET /api/solicitacoes?grupo=NOME_DO_GRUPO ---
  // Busca todas as solicitações de um grupo
  if (req.method === 'GET') {
    try {
      const { grupo } = req.query;
      if (!grupo) {
        return res.status(400).json({ error: 'Nome do grupo é obrigatório.' });
      }
      const { rows } = await sql`SELECT * FROM solicitacoes WHERE grupo_nome = ${grupo} ORDER BY created_at DESC;`;
      return res.status(200).json(rows);
    } catch (error) {
      console.error('Erro em GET /api/solicitacoes:', error);
      return res.status(500).json({ error: 'Erro ao buscar solicitações.' });
    }
  }

  // --- ROTA: POST /api/solicitacoes?grupo=NOME_DO_GRUPO ---
  // Adiciona uma nova solicitação
  if (req.method === 'POST') {
    try {
      const { grupo } = req.query;
      const { item, quantidade, status, solicitante, setor, data, justificativa, link } = req.body;
      if (!grupo) {
        return res.status(400).json({ error: 'Nome do grupo é obrigatório.' });
      }
      const { rows } = await sql`
        INSERT INTO solicitacoes (grupo_nome, item, quantidade, status, solicitante, setor, data, justificativa, link) 
        VALUES (${grupo}, ${item}, ${quantidade}, ${status}, ${solicitante}, ${setor}, ${data}, ${justificativa}, ${link}) 
        RETURNING *;
      `;
      return res.status(201).json(rows[0]);
    } catch (error) {
      console.error('Erro em POST /api/solicitacoes:', error);
      return res.status(500).json({ error: 'Erro ao criar solicitação.' });
    }
  }
  
  // --- ROTA: PUT /api/solicitacoes?id=ID_DA_SOLICITACAO ---
  // Atualiza o status de uma solicitação
  if (req.method === 'PUT') {
      try {
          const { id } = req.query;
          const { status } = req.body;
          if (!id || !status) {
              return res.status(400).json({ error: 'ID da solicitação e novo status são obrigatórios.' });
          }
          const { rows } = await sql`UPDATE solicitacoes SET status = ${status} WHERE id = ${id} RETURNING *;`;
          if (rows.length === 0) {
              return res.status(404).json({ error: 'Solicitação não encontrada.' });
          }
          return res.status(200).json(rows[0]);
      } catch (error) {
          console.error('Erro em PUT /api/solicitacoes:', error);
          return res.status(500).json({ error: 'Erro ao atualizar status.' });
      }
  }

  // Se o método HTTP não for nenhum dos acima
  return res.status(405).json({ error: 'Método não permitido.' });
}
