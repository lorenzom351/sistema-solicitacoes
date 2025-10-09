document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('novoGrupoForm');
    const input = document.getElementById('nomeGrupoInput');
    const listaDiv = document.getElementById('listaDeGrupos');

    // Função para buscar os grupos da API
    async function getGruposAPI() {
        try {
            const response = await fetch('/api/grupos');
            if (!response.ok) throw new Error('Erro ao buscar grupos.');
            return await response.json();
        } catch (error) {
            console.error(error);
            listaDiv.innerHTML = '<p>Não foi possível carregar os grupos. Tente novamente mais tarde.</p>';
            return [];
        }
    }

    // Função para renderizar os grupos na tela
    async function renderGrupos() {
        const grupos = await getGruposAPI();
        listaDiv.innerHTML = ''; // Limpa a lista

        if (grupos.length === 0) {
            listaDiv.innerHTML = '<p>Nenhum grupo criado ainda.</p>';
            return;
        }

        grupos.forEach(nomeDoGrupo => {
            const grupoItem = document.createElement('div');
            grupoItem.className = 'grupo-item';

            const link = document.createElement('a');
            link.textContent = nomeDoGrupo;
            // O link continua funcionando como antes
            link.href = `solicitacoes.html?grupo=${encodeURIComponent(nomeDoGrupo)}`;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Excluir';
            deleteBtn.className = 'delete-btn';
            deleteBtn.dataset.grupo = nomeDoGrupo;

            grupoItem.appendChild(link);
            grupoItem.appendChild(deleteBtn);
            
            listaDiv.appendChild(grupoItem);
        });
    }

    // Event listener para criar um novo grupo
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nomeDoGrupo = input.value.trim();
        if (nomeDoGrupo) {
            try {
                const response = await fetch('/api/grupos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome: nomeDoGrupo })
                });

                if (response.ok) {
                    input.value = '';
                    renderGrupos(); // Re-renderiza a lista para incluir o novo grupo
                } else {
                    const errorData = await response.json();
                    alert(`Erro: ${errorData.error}`);
                }
            } catch (error) {
                console.error(error);
                alert('Falha na comunicação com o servidor.');
            }
        }
    });

    // Event listener para excluir um grupo
    listaDiv.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const nomeDoGrupo = e.target.dataset.grupo;
            
            const confirmado = confirm(`Tem certeza que deseja excluir o grupo "${nomeDoGrupo}"? Todas as solicitações dele serão perdidas.`);
            
            if (confirmado) {
                try {
                    const response = await fetch(`/api/grupos?nome=${encodeURIComponent(nomeDoGrupo)}`, {
                        method: 'DELETE'
                    });

                    if (response.ok) {
                        renderGrupos(); // Re-renderiza a lista para remover o grupo
                    } else {
                        alert('Erro ao excluir o grupo.');
                    }
                } catch (error) {
                    console.error(error);
                    alert('Falha na comunicação com o servidor.');
                }
            }
        }
    });

    // Renderiza os grupos quando a página carrega
    renderGrupos();
});