import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView from 'react-native-maps';
import { Marker, Polyline } from 'react-native-maps';

export function RunMapView({ route = [], currentLocation = null }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (route.length > 0 && mapRef.current) {
      // 경로가 모두 보이도록 영역 조정
      const coordinates = route.map((p) => ({
        latitude: p.lat,
        longitude: p.lng,
      }));

      if (coordinates.length > 0) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    }
  }, [route]);

  const getInitialRegion = () => {
    if (route.length > 0) {
      const first = route[0];
      return {
        latitude: first.lat,
        longitude: first.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    // 서울 기본 위치
    return {
      latitude: 37.5665,
      longitude: 126.978,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={getInitialRegion()}
        showsUserLocation={!!currentLocation}
        showsMyLocationButton={false}
        followsUserLocation={!!currentLocation && !route.length}
      >
        {route.length > 1 && (
          <Polyline
            coordinates={route.map((p) => ({
              latitude: p.lat,
              longitude: p.lng,
            }))}
            strokeColor="#00D9FF"
            strokeWidth={4}
          />
        )}
        {route.length > 0 && (
          <>
            <Marker
              coordinate={{
                latitude: route[0].lat,
                longitude: route[0].lng,
              }}
              title="시작점"
              pinColor="green"
            />
            <Marker
              coordinate={{
                latitude: route[route.length - 1].lat,
                longitude: route[route.length - 1].lng,
              }}
              title="종료점"
              pinColor="red"
            />
          </>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
