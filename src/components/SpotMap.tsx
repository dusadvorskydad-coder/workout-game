// Mapa pro Android a iOS. Verze pro web je v SpotMap.web.tsx.
import MapView, { Marker } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import type { SpotMapProps } from './SpotMap.types';
import { colors } from '../theme';

export default function SpotMap({ spots, center, position, onSelect }: SpotMapProps) {
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={{
        latitude: center.lat,
        longitude: center.lon,
        latitudeDelta: 0.12,
        longitudeDelta: 0.2,
      }}
      showsUserLocation={position != null}
      showsMyLocationButton
    >
      {spots.map((spot) => (
        <Marker
          key={spot.id}
          coordinate={{ latitude: spot.lat, longitude: spot.lon }}
          title={spot.name}
          description="Klepni pro detail hřiště"
          pinColor={colors.accent}
          onCalloutPress={() => onSelect(spot.id)}
        />
      ))}
    </MapView>
  );
}
