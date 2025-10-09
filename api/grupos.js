import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // --- ROTA: GET /api/grupos ---
  // Busca todos os grupos
  if (req.method === 'GET') {
    try {
      const { rows } = await sql`SELECT nome FROM grupos ORDER BY created_at DESC;`;
      const nomes = rows.map(r => r.nome);
      return res.status(200).json(nomes);
    } catch (error) {
      console.error('Erro em GET /api/grupos:', error);
      return res.status(500).json({ error: 'Erro ao buscar grupos.' });
    }
  }

  // --- ROTA: POST /api/grupos ---
  // Cria um novo grupo
  if (req.method === 'POST') {
    try {
      const { nome } = req.body;
      if (!nome) {
        return res.status(400).json({ error: 'O nome do grupo é obrigatório.' });
      }
      await sql`INSERT INTO grupos (nome) VALUES (${nome});`;
      return res.status(201).json({ nome });
    } catch (error) {
      console.error('Erro em POST /api/grupos:', error);
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Já existe um grupo com este nome.' });
      }
      return res.status(500).json({ error: 'Erro ao criar grupo.' });
    }
  }
  
  // --- ROTA: DELETE /api/grupos/:nome ---
  // Deleta um grupo (usa query param: /api/grupos?nome=NOME_DO_GRUPO)
  if (req.method === 'DELETE') {
    try {
        const { nome } = req.query;
        if (!nome) {
            return res.status(400).json({ error: 'Nome do grupo para deletar não fornecido.' });
        }
        await sql`DELETE FROM solicitacoes WHERE grupo_nome = ${nome};`;
        await sql`DELETE FROM grupos WHERE nome = ${nome};`;
        return res.status(204).send();
    } catch (error) {
        console.error('Erro em DELETE /api/grupos:', error);
        return res.status(500).json({ error: 'Erro ao deletar grupo.' });
    }
  }

  // Se o método HTTP não for nenhum dos acima
  return res.status(405).json({ error: 'Método não permitido.' });
}
