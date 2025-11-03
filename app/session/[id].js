import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Card, Surface, Divider } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { getRunningSessions, getRoutePoints } from '../../src/db/sessionRepository';
import { RunMapView } from '../../src/components/MapView';
import { spacing, typography, colors } from '../../src/theme';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams();
  const [session, setSession] = useState(null);
  const [route, setRoute] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, [id]);

  const loadSession = async () => {
    try {
      const [sessions, routePoints] = await Promise.all([
        getRunningSessions(null, 1000),
        getRoutePoints(id),
      ]);
      
      const foundSession = sessions.find((s) => s.id === id);
      if (foundSession) {
        setSession(foundSession);
        setRoute(
          routePoints.map((p) => ({
            lat: p.lat,
            lng: p.lng,
            timestamp: p.timestamp,
          }))
        );
      }
    } catch (error) {
      console.error('세션 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (meters) => {
    if (!meters) return '0m';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}시간 ${mins}분 ${secs}초`;
    return `${mins}분 ${secs}초`;
  };

  const formatPace = (secPerKm) => {
    if (!secPerKm || secPerKm === 0) return '--:--';
    const mins = Math.floor(secPerKm / 60);
    const secs = Math.round(secPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}/km`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateAvgSpeed = () => {
    if (!session || !session.duration || session.duration === 0) return 0;
    const distanceKm = session.distance / 1000;
    const timeHours = session.duration / 3600;
    return distanceKm / timeHours;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>세션을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.mapContainer}>
        <RunMapView route={route} />
      </View>

      <View style={styles.content}>
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text style={styles.dateText}>{formatDate(session.start_time)}</Text>
            
            <Divider style={styles.divider} />

            <View style={styles.statsGrid}>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{formatDistance(session.distance)}</Text>
                <Text style={styles.statLabel}>거리</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{formatDuration(session.duration)}</Text>
                <Text style={styles.statLabel}>시간</Text>
              </View>
              {session.avg_pace && (
                <View style={styles.statBlock}>
                  <Text style={styles.statValue}>{formatPace(session.avg_pace)}</Text>
                  <Text style={styles.statLabel}>평균 페이스</Text>
                </View>
              )}
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{calculateAvgSpeed().toFixed(1)} km/h</Text>
                <Text style={styles.statLabel}>평균 속도</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text style={styles.cardTitle}>상세 정보</Text>
            <Divider style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>최고 속도</Text>
              <Text style={styles.detailValue}>
                {session.max_speed ? `${session.max_speed.toFixed(1)} km/h` : '-'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>소모 칼로리</Text>
              <Text style={styles.detailValue}>
                {session.calories ? `${session.calories} kcal` : '-'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>경로 포인트</Text>
              <Text style={styles.detailValue}>{route.length}개</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>러닝 유형</Text>
              <Text style={styles.detailValue}>
                {session.type === 'solo' ? '개인 러닝' : '그룹 러닝'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {route.length > 0 && (
          <Card style={styles.card} mode="outlined">
            <Card.Content>
              <Text style={styles.cardTitle}>경로 정보</Text>
              <Divider style={styles.divider} />
              <Text style={styles.routeText}>
                총 {route.length}개의 위치 포인트로 기록되었습니다.
              </Text>
            </Card.Content>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    height: 300,
    backgroundColor: '#e0e0e0',
  },
  content: {
    padding: spacing.lg,
  },
  card: {
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  dateText: {
    fontSize: typography.fontSize.md,
    color: '#666',
    marginBottom: spacing.md,
  },
  divider: {
    marginVertical: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBlock: {
    width: '48%',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: '#666',
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.fontSize.md,
    color: '#666',
  },
  detailValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  routeText: {
    fontSize: typography.fontSize.md,
    color: '#666',
    marginTop: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.error,
    textAlign: 'center',
    padding: spacing.xl,
  },
});


