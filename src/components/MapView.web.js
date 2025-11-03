import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 웹 전용 플레이스홀더 컴포넌트
export function RunMapView({ route = [], currentLocation = null }) {
  return (
    <View style={styles.webContainer}>
      <View style={styles.webPlaceholder}>
        <Text style={styles.webText}>지도 뷰</Text>
        <Text style={styles.webSubtext}>
          지도 기능은 모바일 디바이스에서 사용할 수 있습니다.
        </Text>
        {route.length > 0 && (
          <Text style={styles.routeInfo}>
            경로 포인트: {route.length}개
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webPlaceholder: {
    alignItems: 'center',
    padding: 20,
  },
  webText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666',
  },
  webSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 12,
  },
  routeInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
});


