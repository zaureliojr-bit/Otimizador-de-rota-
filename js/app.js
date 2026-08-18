// Orquestração: liga os eventos da tela às funções dos outros módulos e mantém o
// estado `origem` (ponto de partida da rota).
let origem = null;

function enderecoComRegiao(texto){
  const regiao = pegarRegiaoBusca();
  return regiao ? `${texto}, ${regiao}` : texto;
}

function tratarErroGeocode(err){
  switch(err.message){
    case 'SEM_KEY':
      setStatus('Configure a chave de busca de endereço acima antes de continuar.', true);
      abrirCfg('cfgToggle', 'cfgBody');
      break;
    case 'KEY_INVALIDA':
      setStatus('Chave inválida ou expirada. Confira em ⚙ acima.', true);
      abrirCfg('cfgToggle', 'cfgBody');
      break;
    case 'LIMITE_EXCEDIDO':
      setStatus('Limite de buscas atingido. Aguarde um instante e tente de novo.', true);
      break;
    default:
      setStatus('Erro: ' + err.message, true);
      console.error(err);
  }
}

function removerParada(i){
  paradas.splice(i, 1);
  salvarParadas();
  renderLista(removerParada);
  redesenharMapa(origem);
  esconderResumoENavegacao();
}

async function adicionarEndereco(){
  const input = document.getElementById('inputEndereco');
  const texto = input.value.trim();
  if(!texto) return;

  setStatus('Localizando endereço...');
  document.getElementById('btnAdd').disabled = true;

  try{
    const geo = await geocodificar(enderecoComRegiao(texto));
    if(!geo){
      setStatus('Não encontramos esse endereço. Tente incluir bairro e número.', true);
    } else {
      paradas.push({ endereco: texto, lat: geo.lat, lon: geo.lon });
      salvarParadas();
      renderLista(removerParada);
      redesenharMapa(origem);
      input.value = '';
      setStatus('Endereço adicionado.');
    }
  } catch(err){
    tratarErroGeocode(err);
  } finally {
    document.getElementById('btnAdd').disabled = false;
  }
}

async function otimizarRota(){
  const loja = pegarLoja();
  const btn = document.getElementById('btnOtimizar');

  if(loja){
    origem = { lat: loja.lat, lon: loja.lon, label: `Saída: ${loja.endereco}` };
  } else {
    setStatus('Obtendo sua localização (nenhuma loja configurada)...');
    btn.disabled = true;
    const gps = await pegarLocalizacaoAtual();
    if(!gps){
      setStatus('Não foi possível obter sua localização. Configure o endereço da loja ou ative o GPS.', true);
      btn.disabled = false;
      return;
    }
    origem = { lat: gps.lat, lon: gps.lon, label: 'Você está aqui' };
  }

  const validos = paradas.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lon));
  if(validos.length < 2){
    setStatus('Adicione pelo menos 2 endereços localizados para otimizar.', true);
    btn.disabled = false;
    return;
  }

  btn.disabled = true;
  setStatus('Calculando a melhor rota...');

  try{
    const { paradasOrdenadas, trip } = await calcularRotaOtimizada(origem, validos);
    paradas = paradasOrdenadas;
    salvarParadas();
    renderLista(removerParada);

    desenharRota(trip.geometry.coordinates);
    redesenharMapa(origem);

    const km = (trip.distance / 1000).toFixed(1);
    const min = Math.round(trip.duration / 60);
    document.getElementById('distTotal').textContent = `${km} km`;
    document.getElementById('tempoTotal').textContent = `${min} min`;
    document.getElementById('resumo').style.display = 'flex';

    document.getElementById('iniciarRow').style.display = 'flex';
    document.getElementById('iniciarRow2').style.display = 'block';

    document.getElementById('btnGoogleMaps').onclick = () => {
      const { url, truncado } = linkGoogleMaps(origem, validos);
      if(truncado){
        setStatus(`Rota tem muitas paradas: o link do Google Maps abre só as ${GOOGLE_MAPS_MAX_WAYPOINTS} primeiras.`, true);
      }
      window.open(url, '_blank', 'noopener');
    };

    document.getElementById('btnWaze').onclick = () => {
      window.open(linkWaze(validos[0]), '_blank', 'noopener');
    };

    setStatus('Rota otimizada!');
  } catch(err){
    if(err.message === 'SEM_ROTA'){
      setStatus('Não foi possível calcular a rota agora. Tente novamente.', true);
    } else {
      setStatus('Erro ao calcular rota. Verifique sua conexão.', true);
    }
    console.error(err);
  } finally {
    btn.disabled = false;
  }
}

function ligarToggle(idBotao, idCorpo){
  const botao = document.getElementById(idBotao);
  const corpo = document.getElementById(idCorpo);
  botao.addEventListener('click', () => {
    const aberto = corpo.classList.toggle('aberto');
    botao.setAttribute('aria-expanded', String(aberto));
  });
}

function abrirCfg(idBotao, idCorpo){
  document.getElementById(idCorpo).classList.add('aberto');
  document.getElementById(idBotao).setAttribute('aria-expanded', 'true');
}

function fecharCfg(idBotao, idCorpo){
  document.getElementById(idCorpo).classList.remove('aberto');
  document.getElementById(idBotao).setAttribute('aria-expanded', 'false');
}

function ligarEventos(){
  ligarToggle('cfgLojaToggle', 'cfgLojaBody');
  ligarToggle('cfgRegiaoToggle', 'cfgRegiaoBody');
  ligarToggle('cfgToggle', 'cfgBody');

  document.getElementById('btnSaveLoja').addEventListener('click', async () => {
    const texto = document.getElementById('inputLoja').value.trim();
    if(!texto) return;
    setStatus('Localizando endereço da loja...');
    try{
      const geo = await geocodificar(enderecoComRegiao(texto));
      if(!geo){
        setStatus('Não encontramos esse endereço. Tente incluir bairro e número.', true);
        return;
      }
      salvarLoja({ endereco: texto, lat: geo.lat, lon: geo.lon });
      atualizarCfgLojaStatus();
      setStatus('Endereço da loja salvo.');
      fecharCfg('cfgLojaToggle', 'cfgLojaBody');
      origem = { lat: geo.lat, lon: geo.lon, label: `Saída: ${texto}` };
      redesenharMapa(origem);
    } catch(err){
      tratarErroGeocode(err);
    }
  });

  document.getElementById('btnSaveRegiao').addEventListener('click', () => {
    const regiao = document.getElementById('inputRegiao').value.trim();
    salvarRegiaoBusca(regiao);
    atualizarCfgRegiaoStatus();
    setStatus(regiao ? 'Região de busca salva.' : 'Região de busca removida.');
    fecharCfg('cfgRegiaoToggle', 'cfgRegiaoBody');
  });

  document.getElementById('btnSaveKey').addEventListener('click', () => {
    const key = document.getElementById('inputKey').value.trim();
    if(!key) return;
    salvarKey(key);
    atualizarCfgStatus();
    setStatus('Chave salva. Já pode adicionar endereços.');
    fecharCfg('cfgToggle', 'cfgBody');
  });

  document.getElementById('btnAdd').addEventListener('click', adicionarEndereco);
  document.getElementById('inputEndereco').addEventListener('keypress', e => {
    if(e.key === 'Enter') adicionarEndereco();
  });

  document.getElementById('btnOtimizar').addEventListener('click', otimizarRota);

  document.getElementById('btnLimpar').addEventListener('click', () => {
    if(confirm('Remover todos os endereços?')){
      paradas = [];
      const loja = pegarLoja();
      origem = loja ? { lat: loja.lat, lon: loja.lon, label: `Saída: ${loja.endereco}` } : null;
      salvarParadas();
      renderLista(removerParada);
      redesenharMapa(origem);
      esconderResumoENavegacao();
    }
  });
}

function init(){
  initMap();
  ligarEventos();
  renderLista(removerParada);
  atualizarCfgStatus();
  atualizarCfgLojaStatus();
  atualizarCfgRegiaoStatus();

  const lojaSalva = pegarLoja();
  if(lojaSalva){
    origem = { lat: lojaSalva.lat, lon: lojaSalva.lon, label: `Saída: ${lojaSalva.endereco}` };
  }
  redesenharMapa(origem);

  if(!pegarKey()){
    abrirCfg('cfgToggle', 'cfgBody');
  }
}

init();
