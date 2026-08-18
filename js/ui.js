// Renderização de tela e leitura/escrita dos elementos de configuração.
// A lista de paradas é montada com createElement/textContent (não innerHTML) porque
// p.endereco vem de texto digitado pelo usuário — usar innerHTML aqui seria uma
// brecha de XSS armazenado.
function setStatus(msg, isError){
  const el = document.getElementById('status');
  el.textContent = msg || '';
  el.style.color = isError ? '#E23744' : '#F5C518';
}

function esconderResumoENavegacao(){
  document.getElementById('resumo').style.display = 'none';
  document.getElementById('iniciarRow').style.display = 'none';
  document.getElementById('iniciarRow2').style.display = 'none';
}

function renderLista(aoRemover){
  const ul = document.getElementById('lista');
  const vazio = document.getElementById('vazio');
  ul.innerHTML = '';

  vazio.style.display = paradas.length === 0 ? 'block' : 'none';

  paradas.forEach((p, i) => {
    const li = document.createElement('li');
    li.className = 'stop';

    const ordem = document.createElement('div');
    ordem.className = 'ordem';
    ordem.textContent = String(i + 1);

    const info = document.createElement('div');
    info.className = 'stop-info';

    const end = document.createElement('div');
    end.className = 'end';
    end.textContent = p.endereco;

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = (Number.isFinite(p.lat) && Number.isFinite(p.lon)) ? 'Localizado' : 'Endereço não encontrado';

    info.append(end, meta);

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'del';
    del.textContent = '✕';
    del.setAttribute('aria-label', `Remover parada ${i + 1}: ${p.endereco}`);
    del.addEventListener('click', () => aoRemover(i));

    li.append(ordem, info, del);
    ul.appendChild(li);
  });

  atualizarBotaoOtimizar();
}

function atualizarBotaoOtimizar(){
  document.getElementById('btnOtimizar').disabled = paradas.length < 2;
}

function atualizarCfgStatus(){
  const el = document.getElementById('cfgStatus');
  const key = pegarKey();
  el.textContent = key ? 'Configurado ✓' : 'Não configurado';
  el.style.color = key ? '#8FD19E' : 'var(--gray)';
  document.getElementById('inputKey').value = key;
}

function atualizarCfgLojaStatus(){
  const el = document.getElementById('cfgLojaStatus');
  const loja = pegarLoja();
  el.textContent = loja ? 'Configurado ✓' : 'Não configurado';
  el.style.color = loja ? '#8FD19E' : 'var(--gray)';
  document.getElementById('inputLoja').value = loja ? loja.endereco : '';
}

function atualizarCfgRegiaoStatus(){
  const el = document.getElementById('cfgRegiaoStatus');
  const regiao = pegarRegiaoBusca();
  el.textContent = regiao ? 'Configurado ✓' : 'Não configurado (opcional)';
  el.style.color = regiao ? '#8FD19E' : 'var(--gray)';
  document.getElementById('inputRegiao').value = regiao;
}
