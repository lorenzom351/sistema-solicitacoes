import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Esta função só aceita o método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    // Busca todos os nomes da tabela de funcionários
    const { rows } = await sql`SELECT nome FROM funcionarios ORDER BY nome ASC;`;
    const nomes = rows.map(f => f.nome);
    return res.status(200).json(nomes);
  } catch (error) {
    console.error('Erro ao buscar funcionários:', error);
    return res.status(500).json({ error: error.message });
  }
}