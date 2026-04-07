let frota = JSON.parse(localStorage.getItem('frota_japan_pro')) || [];

function atualizarSistema() {
    localStorage.setItem('frota_japan_pro', JSON.stringify(frota));
    const select = document.getElementById('filtro-veiculo');
    const valorAtual = select.value;
    
    select.innerHTML = '<option value="todos">Todos os Veículos</option>';
    frota.forEach(v => {
        select.innerHTML += `<option value="${v.placa}">${v.placa} - ${v.modelo}</option>`;
    });
    select.value = valorAtual;
    gerarRelatorio();
}

function registrarServico(e) {
    e.preventDefault();
    const placa = document.getElementById('placa').value.toUpperCase();
    
    let veiculo = frota.find(v => v.placa === placa);
    if (!veiculo) {
        veiculo = {
            placa: placa,
            modelo: document.getElementById('modelo').value,
            ano: document.getElementById('ano').value,
            historico: []
        };
        frota.push(veiculo);
    }

    veiculo.kmAtual = document.getElementById('km-atual').value;
    veiculo.emManutencao = document.getElementById('em-manutencao').checked;

    const servico = {
        id: Date.now(),
        data: new Date().toLocaleDateString('pt-br'),
        tipo: document.getElementById('tipo-servico').value,
        km: document.getElementById('km-atual').value,
        proxima: document.getElementById('proxima-troca').value,
        responsavel: document.getElementById('responsavel').value,
        descricao: document.getElementById('descricao').value,
        isPendencia: document.getElementById('is-pendencia').checked
    };

    veiculo.historico.unshift(servico);
    atualizarSistema();
    alert("Dados registrados!");
    document.getElementById('form-veiculo').reset();
}

function concluirPendencia(placa, idServico) {
    const veiculo = frota.find(v => v.placa === placa);
    const servico = veiculo.historico.find(s => s.id === idServico);
    if (servico && confirm("Marcar como CONCLUÍDO?")) {
        servico.isPendencia = false;
        servico.data = new Date().toLocaleDateString('pt-br'); // Atualiza para data de hoje
        atualizarSistema();
    }
}

function excluirRegistro(placa, idServico) {
    if (confirm("Excluir permanentemente?")) {
        const veiculo = frota.find(v => v.placa === placa);
        veiculo.historico = veiculo.historico.filter(s => s.id !== idServico);
        atualizarSistema();
    }
}

function gerarRelatorio() {
    const filtroPlaca = document.getElementById('filtro-veiculo').value;
    const filtroTipo = document.getElementById('filtro-tipo-servico').value;
    const container = document.getElementById('relatorio-detalhado');
    container.innerHTML = "";

    const listaVeiculos = filtroPlaca === "todos" ? frota : frota.filter(v => v.placa === filtroPlaca);

    listaVeiculos.forEach(v => {
        const historicoFiltrado = filtroTipo === "todos" 
            ? v.historico 
            : v.historico.filter(h => h.tipo === filtroTipo);

        if (historicoFiltrado.length === 0 && filtroTipo !== "todos") return;

        const ultimaTroca = v.historico.find(s => s.tipo === "Troca de Óleo" && !s.isPendencia) || { km: "---", proxima: "---" };

        container.innerHTML += `
            <div class="card-relatorio">
                <div class="header-rel">
                    <img src="logo-japan.png" class="logo-rel">
                    <div style="text-align:right">
                        <h4>${v.modelo} | ${v.ano}</h4>
                        <strong>PLACA: ${v.placa}</strong>
                    </div>
                </div>
                <p style="margin-top:10px"><b>KM Atual:</b> ${v.kmAtual} | <b>Status:</b> ${v.emManutencao ? '⚠️ OFICINA' : '✅ ATIVO'}</p>
                <p style="color:red; font-size:0.8rem"><b>ÓLEO:</b> Útima: ${ultimaTroca.km} km | Próxima: ${ultimaTroca.proxima} km</p>
                
                <table class="tabela-servicos">
                    <thead><tr><th>Data</th><th>Serviço</th><th>KM</th><th>Ações</th></tr></thead>
                    <tbody>
                        ${historicoFiltrado.map(h => `
                            <tr class="${h.isPendencia ? 'linha-pendencia' : ''}">
                                <td>${h.data}</td>
                                <td>
                                    ${h.tipo}
                                    ${h.isPendencia ? '<span class="tag-pendente">PENDENTE</span>' : ''}
                                    <br><small>${h.descricao}</small>
                                </td>
                                <td>${h.km}</td>
                                <td>
                                    ${h.isPendencia ? `<button class="btn-check" onclick="concluirPendencia('${v.placa}', ${h.id})">✅</button>` : ''}
                                    <button class="btn-del" onclick="excluirRegistro('${v.placa}', ${h.id})">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    });
}

async function baixarPDF() {
    const { jsPDF } = window.jspdf;
    const elemento = document.getElementById('relatorio-detalhado');
    const canvas = await html2canvas(elemento, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(imgData, 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width);
    pdf.save(`Relatorio_Frota_Japan.pdf`);
}

function exportarDados() {
    const blob = new Blob([JSON.stringify(frota)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "backup_japan_security.json";
    a.click();
}

function importarDados(e) {
    const reader = new FileReader();
    reader.onload = (event) => {
        frota = JSON.parse(event.target.result);
        atualizarSistema();
    };
    reader.readAsText(e.target.files[0]);
}

atualizarSistema();