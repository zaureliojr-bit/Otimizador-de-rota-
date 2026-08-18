// Acesso ao localStorage. Todo JSON.parse passa por aqui para não derrubar o app
// se algum dado salvo estiver corrompido.
function lerJSON(chave, valorPadrao){
  const raw = localStorage.getItem(chave);
  if(!raw) return valorPadrao;
  try{
    const dado = JSON.parse(raw);
    return (dado === null || dado === undefined) ? valorPadrao : dado;
  } catch(err){
    console.warn(`Dado inválido em "${chave}", ignorando:`, err);
    return valorPadrao;
  }
}

function salvarJSON(chave, valor){
  localStorage.setItem(chave, JSON.stringify(valor));
}

let paradas = lerJSON(STORAGE_KEY, []);
if(!Array.isArray(paradas)) paradas = [];

function salvarParadas(){
  salvarJSON(STORAGE_KEY, paradas);
}

function pegarLoja(){
  const loja = lerJSON(LOJA_STORAGE, null);
  if(loja && Number.isFinite(loja.lat) && Number.isFinite(loja.lon)) return loja;
  return null;
}

function salvarLoja(loja){
  salvarJSON(LOJA_STORAGE, loja);
}

function pegarKey(){
  return localStorage.getItem(KEY_STORAGE) || '';
}

function salvarKey(key){
  localStorage.setItem(KEY_STORAGE, key);
}

function pegarRegiaoBusca(){
  return localStorage.getItem(REGIAO_STORAGE) || '';
}

function salvarRegiaoBusca(regiao){
  localStorage.setItem(REGIAO_STORAGE, regiao);
}
