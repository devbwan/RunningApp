import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, RefreshControl } from 'react-native';
import { Card, Surface } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { getRunningSessions } from '../../src/db/sessionRepository';
import { spacing, typography, colors } from '../../src/theme';

export default function RecordsScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadSessions();
    }, [])
  );

  const loadSessions = async () => {
    try {
      const data = await getRunningSessions(null, 50);
      setSessions(data);
    } catch (error) {
      console.error('기록 로드 실패:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSessions();
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
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const renderSession = ({ item }) => (
    <Card
      style={styles.card}
      mode="outlined"
      onPress={() => {
        router.push(`/session/${item.id}`);
      }}
    >
      <Card.Content>
        <Text style={styles.dateText}>{formatDate(item.start_time)}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>거리</Text>
            <Text style={styles.statValue}>{formatDistance(item.distance)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>시간</Text>
            <Text style={styles.statValue}>{formatDuration(item.duration)}</Text>
          </View>
          {item.avg_pace && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>페이스</Text>
              <Text style={styles.statValue}>
                {Math.floor(item.avg_pace / 60)}:{(item.avg_pace % 60).toFixed(0).padStart(2, '0')}/km
              </Text>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>기록</Text>
        <Text style={styles.subtitle}>러닝 기록을 확인하세요</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text>로딩 중...</Text>
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>아직 기록이 없습니다.</Text>
          <Text style={styles.emptySubtext}>러닝을 시작해서 첫 기록을 남겨보세요!</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    padding: spacing.xl,
    paddingTop: spacing.xl + 20,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: '#666',
  },
  list: {
    padding: spacing.lg,
  },
  card: {
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    color: '#666',
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: '#666',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: typography.fontSize.md,
    color: '#666',
    textAlign: 'center',
  },
});
