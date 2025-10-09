document.addEventListener('DOMContentLoaded', async () => {

    // 1. Pega o nome do grupo da URL (isso permanece igual)
    const params = new URLSearchParams(window.location.search);
    const nomeDoGrupo = params.get('grupo');

    if (!nomeDoGrupo) {
        window.location.href = 'index.html';
        return; // Para a execução do script
    }

    // 2. Define o título da página
    document.title = `Solicitações - ${nomeDoGrupo}`;
    document.getElementById('nomeDoGrupo').textContent = `Exibindo solicitações para: ${nomeDoGrupo}`;

    const lista = document.getElementById('listaSolicitacoes');
    let solicitacoes = []; // O array agora começa vazio e será populado pela API

    // Função para buscar as solicitações da API
    async function fetchSolicitacoes() {
        try {
            const response = await fetch(`/api/solicitacoes?grupo=${encodeURIComponent(nomeDoGrupo)}`);
            if (!response.ok) throw new Error('Erro ao buscar solicitações.');
            solicitacoes = await response.json();
            renderSolicitacoes();
        } catch (error) {
            console.error(error);
            lista.innerHTML = '<p>Não foi possível carregar as solicitações.</p>';
        }
    }

    // Função para atualizar o status de uma solicitação na API
    async function atualizarStatusAPI(id, novoStatus) {
        try {
            await fetch(`/api/solicitacoes?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: novoStatus })
            });
            // Após atualizar, buscamos a lista inteira novamente para garantir consistência
            fetchSolicitacoes();
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Não foi possível atualizar o status.');
        }
    }

    // Função para renderizar a lista (praticamente idêntica à sua)
    function renderSolicitacoes() {
      lista.innerHTML = '';
      if(solicitacoes.length === 0) {
        lista.innerHTML = '<p>Nenhuma solicitação encontrada para este grupo.</p>';
        return;
      }
      solicitacoes.forEach(s => { // Não precisamos mais do índice 'i'
        const div = document.createElement('div');
        div.className = 'solicitacao';
        div.innerHTML = `
          <span class="status ${s.status}">${s.status}: ${s.item} (x${s.quantidade})</span><br>
          Solicitado por <b>${s.solicitante}</b> do setor <b>${s.setor}</b><br>
          Data: ${s.data}<br>
          <i>"${s.justificativa}"</i><br>
          ${s.link ? `<a href="${s.link}" target="_blank">🔗 Ver Link do Material</a><br>` : ''}
        `;

        const btns = document.createElement('div');
        btns.className = 'btns';

        if (s.status === 'pendente') {
          const aprovar = document.createElement('button');
          aprovar.className = 'btn-aprovar';
          aprovar.textContent = 'Aprovar';
          aprovar.onclick = () => atualizarStatusAPI(s.id, 'aprovado');

          const rejeitar = document.createElement('button');
          rejeitar.className = 'btn-rejeitar';
          rejeitar.textContent = 'Rejeitar';
          rejeitar.onclick = () => atualizarStatusAPI(s.id, 'rejeitado');

          btns.appendChild(aprovar);
          btns.appendChild(rejeitar);
        }

        if (s.status === 'rejeitado') {
            const etiquetaRej = document.createElement('div');
            etiquetaRej.className = 'etiqueta-rejeitado';
            etiquetaRej.textContent = 'Item não aprovado';
            btns.appendChild(etiquetaRej);
        }

        if (s.status === 'aprovado') {
          const comprado = document.createElement('button');
          comprado.className = 'btn-comprado';
          comprado.textContent = 'Marcar como Comprado';
          comprado.onclick = () => atualizarStatusAPI(s.id, 'comprado');
          btns.appendChild(comprado);
        }

        if (s.status === 'comprado') {
            const etiqueta = document.createElement('div');
            etiqueta.className = 'etiqueta-comprado';
            etiqueta.textContent = 'Comprado';
            btns.appendChild(etiqueta);
        }

        div.appendChild(btns);
        lista.appendChild(div);
      });
    }

    // Event listener para enviar uma nova solicitação
    document.getElementById('solicitacaoForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      const form = e.target;
      const novaSolicitacao = {
        item: form.item.value,
        quantidade: form.quantidade.value,
        status: 'pendente',
        solicitante: form.nome.value,
        setor: form.setor.value,
        data: new Date().toLocaleDateString('pt-BR'),
        justificativa: form.justificativa.value,
        link: form.link.value
      };

      try {
        const response = await fetch(`/api/solicitacoes?grupo=${encodeURIComponent(nomeDoGrupo)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaSolicitacao)
        });
        if(response.ok) {
            form.reset();
            fetchSolicitacoes(); // Atualiza a lista com a nova solicitação
        } else {
            alert('Erro ao enviar solicitação.');
        }
      } catch (error) {
        console.error('Erro ao criar solicitação:', error);
        alert('Falha na comunicação com o servidor.');
      }
    });

    // Finalmente, busca as solicitações iniciais quando a página carrega
    fetchSolicitacoes();
});