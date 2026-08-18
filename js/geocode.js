// Geocodificação via LocationIQ (dados OpenStreetMap, sem os bloqueios do Nominatim público).
async function geocodificar(endereco){
  const key = pegarKey();
  if(!key){
    throw new Error('SEM_KEY');
  }
  const url = `https://us1.locationiq.com/v1/search?key=${encodeURIComponent(key)}&format=json&limit=1&countrycodes=br&q=${encodeURIComponent(endereco)}`;

  let res;
  try{
    res = await fetch(url);
  } catch(networkErr){
    throw new Error('REDE: ' + networkErr.message);
  }

  if(res.status === 401 || res.status === 403) throw new Error('KEY_INVALIDA');
  if(res.status === 429) throw new Error('LIMITE_EXCEDIDO');
  if(!res.ok) throw new Error('HTTP_' + res.status);

  let data;
  try{
    data = await res.json();
  } catch(err){
    throw new Error('RESPOSTA_INVALIDA');
  }

  if(!Array.isArray(data) || !data.length) return null;

  const lat = parseFloat(data[0].lat);
  const lon = parseFloat(data[0].lon);
  if(!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return { lat, lon, display: data[0].display_name };
}

async function pegarLocalizacaoAtual(){
  return new Promise((resolve) => {
    if(!navigator.geolocation){ resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy:true, timeout:8000 }
    );
  });
}
