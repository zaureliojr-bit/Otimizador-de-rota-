// Otimização de rota via OSRM (serviço de demonstração pública — sem SLA, sujeito a
// limite de uso; para produção considere um OSRM próprio ou um serviço pago) e
// montagem dos links de navegação externa.
async function calcularRotaOtimizada(origem, validos){
  const coords = [[origem.lon, origem.lat], ...validos.map(p => [p.lon, p.lat])]
    .map(c => c.join(',')).join(';');

  const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&roundtrip=false&overview=full&geometries=geojson`;

  const res = await fetch(url);
  if(!res.ok) throw new Error('HTTP_' + res.status);

  const data = await res.json();
  if(data.code !== 'Ok' || !Array.isArray(data.waypoints) || !Array.isArray(data.trips) || !data.trips.length){
    throw new Error('SEM_ROTA');
  }

  // Reordena as paradas conforme os waypoints da viagem (ignorando índice 0 = origem).
  const waypoints = data.waypoints
    .map((wp, idx) => ({ idx, order: wp.waypoint_index }))
    .filter(wp => wp.idx !== 0)
    .sort((a, b) => a.order - b.order);

  const paradasOrdenadas = waypoints.map(wp => validos[wp.idx - 1]);

  return { paradasOrdenadas, trip: data.trips[0] };
}

function linkGoogleMaps(origem, validos){
  const destino = validos[validos.length - 1];
  const intermediarias = validos.slice(0, -1);
  const truncado = intermediarias.length > GOOGLE_MAPS_MAX_WAYPOINTS;
  const usados = intermediarias.slice(0, GOOGLE_MAPS_MAX_WAYPOINTS);

  let url = `https://www.google.com/maps/dir/?api=1&origin=${origem.lat},${origem.lon}&destination=${destino.lat},${destino.lon}&travelmode=driving`;
  if(usados.length){
    const wp = usados.map(p => `${p.lat},${p.lon}`).join('|');
    url += `&waypoints=${encodeURIComponent(wp)}`;
  }
  return { url, truncado };
}

function linkWaze(proximaParada){
  return `https://waze.com/ul?ll=${proximaParada.lat},${proximaParada.lon}&navigate=yes`;
}
