// Mapa pro web (Leaflet + podklady OpenStreetMap).
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { SpotMapProps } from './SpotMap.types';
import { colors } from '../theme';

const spotIcon = L.divIcon({
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  html: `<div style="width:34px;height:34px;border-radius:17px;background:${colors.accent};border:3px solid ${colors.bg};box-shadow:0 2px 6px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;font-size:17px;cursor:pointer">💪</div>`,
});

const meIcon = L.divIcon({
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  html: '<div style="width:18px;height:18px;border-radius:9px;background:#3b9bff;border:3px solid #fff;box-shadow:0 0 0 4px rgba(59,155,255,.3)"></div>',
});

export default function SpotMap({ spots, center, position, onSelect }: SpotMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const me = useRef<L.Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!container.current) return;
    const m = L.map(container.current, { zoomControl: false }).setView([center.lat, center.lon], 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);
    map.current = m;
    return () => {
      // Zastaví rozběhnuté animace, jinak Leaflet po odebrání mapy hlásí chybu.
      m.stop();
      m.remove();
      map.current = null;
      me.current = null;
    };
    // Mapa se zakládá jen jednou; střed je výchozí pohled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const markers = spots.map((spot) =>
      L.marker([spot.lat, spot.lon], { icon: spotIcon, title: spot.name })
        // Odloženo, aby Leaflet dokončil zpracování kliknutí dřív, než mapa zmizí.
        .on('click', () => setTimeout(() => onSelectRef.current(spot.id), 0))
        .addTo(m),
    );
    if (spots.length > 0) {
      m.fitBounds(L.latLngBounds(spots.map((s) => [s.lat, s.lon])), { padding: [40, 40], maxZoom: 15, animate: false });
    }
    return () => markers.forEach((marker) => marker.remove());
  }, [spots]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (!position) {
      me.current?.remove();
      me.current = null;
      return;
    }
    if (me.current) me.current.setLatLng([position.lat, position.lon]);
    else me.current = L.marker([position.lat, position.lon], { icon: meIcon, interactive: false }).addTo(m);
  }, [position]);

  return <div ref={container} style={{ position: 'absolute', inset: 0, background: colors.card }} />;
}
