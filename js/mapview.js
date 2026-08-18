// Mapa (Leaflet) e sua renderização. Textos vindos do usuário sempre passam por
// textContent/DOM, nunca por innerHTML, para não abrir brecha de XSS nos popups.
let map, markersLayer, routeLine;

function initMap(){
  map = L.map('map', { zoomControl:false }).setView([-23.69, -46.56], 13);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
}

function corMarcador(cor){
  return L.divIcon({
    html: `<div style="background:${cor};width:16px;height:16px;border-radius:50%;border:2px solid #fff;"></div>`,
    className:'',
    iconSize:[16,16]
  });
}

function criarPopup(texto){
  const div = document.createElement('div');
  div.textContent = texto;
  return div;
}

function redesenharMapa(origem){
  markersLayer.clearLayers();
  if(routeLine){ map.removeLayer(routeLine); routeLine = null; }

  const pontos = [];

  if(origem){
    L.marker([origem.lat, origem.lon], {icon: corMarcador('#F5C518')})
      .addTo(markersLayer)
      .bindPopup(criarPopup(origem.label || 'Ponto de partida'));
    pontos.push([origem.lat, origem.lon]);
  }

  paradas.forEach((p, i) => {
    if(Number.isFinite(p.lat) && Number.isFinite(p.lon)){
      L.marker([p.lat, p.lon], {icon: corMarcador('#E23744')})
        .addTo(markersLayer)
        .bindPopup(criarPopup(`${i + 1}. ${p.endereco}`));
      pontos.push([p.lat, p.lon]);
    }
  });

  if(pontos.length){
    map.fitBounds(pontos, {padding:[30,30]});
  }
}

function desenharRota(coordsGeoJSON){
  if(routeLine) map.removeLayer(routeLine);
  const latlngs = coordsGeoJSON.map(c => [c[1], c[0]]);
  routeLine = L.polyline(latlngs, { color:'#F5C518', weight:4, opacity:0.85 }).addTo(map);
  map.fitBounds(latlngs, {padding:[30,30]});
}
