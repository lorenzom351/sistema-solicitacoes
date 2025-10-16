document.addEventListener('DOMContentLoaded', async () => {
    // --- CONFIGURAÇÃO INICIAL ---
    const params = new URLSearchParams(window.location.search);
    const nomeDoGrupo = params.get('grupo');

    if (!nomeDoGrupo) {
        window.location.href = 'index.html';
        return;
    }

    document.title = `Solicitações - ${nomeDoGrupo}`;
    document.getElementById('nomeDoGrupo').textContent = `Exibindo solicitações para: ${nomeDoGrupo}`;

    const lista = document.getElementById('listaSolicitacoes');
    let solicitacoes = [];
    let funcionarios = []; // Array para guardar a lista de funcionários

    // --- FUNÇÕES DE API ---

    // Nova função para buscar a lista de funcionários
    async function fetchFuncionarios() {
        try {
            const response = await fetch('/api/funcionarios');
            if (!response.ok) throw new Error('Erro ao buscar funcionários.');
            funcionarios = await response.json();
        } catch (error) {
            console.error(error);
        }
    }

    // Função para buscar as solicitações (já estava correta)
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
    
    // Função genérica para fazer TODAS as atualizações (status, desfazer, entregar)
    async function atualizarSolicitacao(id, acao, body = {}) {
        try {
            await fetch(`/api/solicitacoes?id=${id}&acao=${acao}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            fetchSolicitacoes(); // Sempre busca a lista atualizada para refletir as mudanças
        } catch (error) {
            console.error(`Erro ao executar a ação "${acao}":`, error);
            alert('Não foi possível completar a ação.');
        }
    }

    // --- RENDERIZAÇÃO DA TELA ---
    function renderSolicitacoes() {
        lista.innerHTML = '';
        if (solicitacoes.length === 0) {
            lista.innerHTML = '<p>Nenhuma solicitação encontrada para este grupo.</p>';
            return;
        }

        solicitacoes.forEach(s => {
            const div = document.createElement('div');
            div.className = 'solicitacao';
            // Mostra a informação de entrega se ela existir
            div.innerHTML = `
                <span class="status ${s.status}">${s.status}: ${s.item} (x${s.quantidade})</span><br>
                Solicitado por <b>${s.solicitante}</b> do setor <b>${s.setor}</b><br>
                Data: ${s.data}<br>
                <i>"${s.justificativa}"</i><br>
                ${s.link ? `<a href="${s.link}" target="_blank">🔗 Ver Link do Material</a><br>` : ''}
                ${s.entregue_a ? `<span class="entregue">✅ Entregue a: <b>${s.entregue_a}</b></span><br>` : ''}
            `;

            const btns = document.createElement('div');
            btns.className = 'btns';

            // Lógica do botão de DESFAZER
            if (s.status_anterior) {
                const undoBtn = document.createElement('button');
                undoBtn.className = 'btn-desfazer';
                undoBtn.textContent = 'Desfazer';
                undoBtn.onclick = () => atualizarSolicitacao(s.id, 'desfazer');
                btns.appendChild(undoBtn);
            }

            // Lógica dos botões de Ação de Status
            if (s.status === 'pendente') {
                const aprovar = document.createElement('button');
                aprovar.className = 'btn-aprovar';
                aprovar.textContent = 'Aprovar';
                aprovar.onclick = () => atualizarSolicitacao(s.id, 'atualizar_status', { status: 'aprovado' });

                const rejeitar = document.createElement('button');
                rejeitar.className = 'btn-rejeitar';
                rejeitar.textContent = 'Rejeitar';
                rejeitar.onclick = () => atualizarSolicitacao(s.id, 'atualizar_status', { status: 'rejeitado' });

                btns.appendChild(aprovar);
                btns.appendChild(rejeitar);
            } else if (s.status === 'rejeitado') {
                const etiquetaRej = document.createElement('div');
                etiquetaRej.className = 'etiqueta-rejeitado';
                etiquetaRej.textContent = 'Item não aprovado';
                btns.appendChild(etiquetaRej);
            } else if (s.status === 'aprovado') {
                const comprado = document.createElement('button');
                comprado.className = 'btn-comprado';
                comprado.textContent = 'Marcar como Comprado';
                comprado.onclick = () => atualizarSolicitacao(s.id, 'atualizar_status', { status: 'comprado' });
                btns.appendChild(comprado);
            }

            // Lógica do menu de ENTREGA
            if (s.status === 'comprado' && !s.entregue_a) {
                const entregaContainer = document.createElement('div');
                entregaContainer.className = 'entrega-container';

                const select = document.createElement('select');
                select.innerHTML = '<option value="">-- Entregar a --</option>';
                funcionarios.forEach(f => {
                    select.innerHTML += `<option value="${f}">${f}</option>`;
                });

                const entregarBtn = document.createElement('button');
                entregarBtn.textContent = 'Confirmar Entrega';
                entregarBtn.className = 'btn-entregar';
                entregarBtn.onclick = () => {
                    if (select.value) {
                        atualizarSolicitacao(s.id, 'entregar', { entregue_a: select.value });
                    }
                };
                
                entregaContainer.appendChild(select);
                entregaContainer.appendChild(entregarBtn);
                btns.appendChild(entregaContainer);
            }

            div.appendChild(btns);
            lista.appendChild(div);
        });
    }

    // --- SUBMISSÃO DE FORMULÁRIO (já estava correta) ---
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
            fetchSolicitacoes();
        } else {
            alert('Erro ao enviar solicitação.');
        }
      } catch (error) {
        console.error('Erro ao criar solicitação:', error);
        alert('Falha na comunicação com o servidor.');
      }
    });

    // --- CARREGAMENTO INICIAL ---
    await fetchFuncionarios(); // Primeiro, busca a lista de funcionários
    await fetchSolicitacoes(); // Depois, busca as solicitações
});