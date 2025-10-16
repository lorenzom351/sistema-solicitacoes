import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Extrai os parâmetros da URL para usar em todas as rotas
  const { grupo, id, acao } = req.query;

  try {
    // --- ROTA GET: Buscar solicitações de um grupo ---
    if (req.method === 'GET') {
      if (!grupo) return res.status(400).json({ error: 'Nome do grupo é obrigatório.' });
      const { rows } = await sql`SELECT * FROM solicitacoes WHERE grupo_nome = ${grupo} ORDER BY created_at DESC;`;
      return res.status(200).json(rows);
    }

    // --- ROTA POST: Criar uma nova solicitação ---
    if (req.method === 'POST') {
      if (!grupo) return res.status(400).json({ error: 'Nome do grupo é obrigatório.' });
      const { item, quantidade, status, solicitante, setor, data, justificativa, link } = req.body;
      const { rows } = await sql`
        INSERT INTO solicitacoes (grupo_nome, item, quantidade, status, solicitante, setor, data, justificativa, link) 
        VALUES (${grupo}, ${item}, ${quantidade}, ${status}, ${solicitante}, ${setor}, ${data}, ${justificativa}, ${link}) 
        RETURNING *;
      `;
      return res.status(201).json(rows[0]);
    }
    
    // --- ROTA PUT: Atualizar uma solicitação (LÓGICA NOVA E MELHORADA) ---
    if (req.method === 'PUT') {
      if (!id || !acao) return res.status(400).json({ error: 'ID da solicitação e ação são obrigatórios.' });

      let result;

      // Usamos um 'switch' para decidir o que fazer com base no parâmetro 'acao' da URL
      switch (acao) {
        case 'atualizar_status':
          const { status } = req.body;
          // Guarda o status atual em 'status_anterior' antes de o atualizar
          result = await sql`
            UPDATE solicitacoes 
            SET status_anterior = status, status = ${status} 
            WHERE id = ${id} RETURNING *;
          `;
          break;
        
        case 'desfazer':
          // Copia o status_anterior de volta para o status principal
          result = await sql`
            UPDATE solicitacoes 
            SET status = status_anterior, status_anterior = NULL 
            WHERE id = ${id} RETURNING *;
          `;
          break;

        case 'entregar':
          const { entregue_a } = req.body;
          result = await sql`
            UPDATE solicitacoes 
            SET entregue_a = ${entregue_a} 
            WHERE id = ${id} RETURNING *;
          `;
          break;

        default:
          return res.status(400).json({ error: 'Ação desconhecida.' });
      }

      if (result.rows.length === 0) return res.status(404).json({ error: 'Solicitação não encontrada.' });
      return res.status(200).json(result.rows[0]);
    }

    // Se o método HTTP não for GET, POST ou PUT
    return res.status(405).json({ error: 'Método não permitido.' });

  } catch (error) {
    console.error(`Erro em ${req.method} /api/solicitacoes:`, error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

