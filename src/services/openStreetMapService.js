/**
 * OpenStreetMap Overpass API를 사용한 무료 러닝 코스 데이터 가져오기
 * 
 * 참고: https://wiki.openstreetmap.org/wiki/Overpass_API
 * Overpass API는 완전 무료이며 인증이 필요 없습니다.
 */

/**
 * 거리 계산 (Haversine 공식)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // 지구 반지름 (미터)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * 경로 좌표 배열로부터 총 거리 계산
 */
const calculateTotalDistance = (coordinates) => {
  if (!coordinates || coordinates.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const prev = coordinates[i - 1];
    const curr = coordinates[i];
    totalDistance += calculateDistance(
      prev.lat || prev.latitude,
      prev.lng || prev.longitude,
      curr.lat || curr.latitude,
      curr.lng || curr.longitude
    );
  }
  return totalDistance;
};

/**
 * OpenStreetMap Overpass API에서 러닝 경로 데이터 가져오기
 * 
 * @param {number} latitude - 중심 위도
 * @param {number} longitude - 중심 경도
 * @param {number} radiusKm - 반경 (킬로미터, 기본값: 5km)
 * @returns {Promise<Array>} 코스 데이터 배열
 */
export const getRunningRoutesFromOSM = async (
  latitude,
  longitude,
  radiusKm = 5
) => {
  try {
    // Overpass API 엔드포인트 (무료, 공개)
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    
    // 반경을 도(degree)로 변환 (대략적)
    const radiusDeg = radiusKm / 111; // 1도 ≈ 111km
    
    // 경계 박스 계산
    const minLat = latitude - radiusDeg;
    const maxLat = latitude + radiusDeg;
    const minLon = longitude - radiusDeg;
    const maxLon = longitude + radiusDeg;

    // Overpass QL 쿼리
    // 러닝에 적합한 경로: footway, path, track, cycleway 등
    const query = `
[out:json][timeout:25];
(
  way["highway"~"^(footway|path|track|cycleway|bridleway)$"](${minLat},${minLon},${maxLat},${maxLon});
  way["leisure"~"^(park|playground|track)$"](${minLat},${minLon},${maxLat},${maxLon});
  way["sport"~"^(running|jogging)$"](${minLat},${minLon},${maxLat},${maxLon});
);
out body;
>;
out skel qt;
`;

    const response = await fetch(overpassUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API 오류: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.elements || data.elements.length === 0) {
      console.log('[OSM] 해당 지역에 러닝 경로를 찾을 수 없습니다.');
      return [];
    }

    // 경로 데이터 변환
    const routes = [];
    const nodeMap = new Map();
    
    // 노드 정보 수집
    data.elements.forEach((element) => {
      if (element.type === 'node') {
        nodeMap.set(element.id, {
          lat: element.lat,
          lon: element.lon,
        });
      }
    });

    // 웨이(경로) 정보 처리
    data.elements.forEach((element) => {
      if (element.type === 'way' && element.nodes && element.nodes.length > 0) {
        const coordinates = [];
        
        // 노드 ID를 좌표로 변환
        element.nodes.forEach((nodeId) => {
          const node = nodeMap.get(nodeId);
          if (node) {
            coordinates.push({
              lat: node.lat,
              lng: node.lon,
            });
          }
        });

        // 최소 2개 이상의 좌표가 있어야 경로로 인정
        if (coordinates.length >= 2) {
          const distance = calculateTotalDistance(coordinates);
          
          // 최소 거리 필터 (100m 이상)
          if (distance >= 100) {
            const tags = element.tags || {};
            
            routes.push({
              id: `osm_${element.id}`,
              name: tags.name || `OSM 러닝 경로 ${element.id}`,
              description: tags.description || 
                         tags.leisure || 
                         tags.sport || 
                         'OpenStreetMap에서 가져온 러닝 경로',
              coordinates,
              distance: Math.round(distance),
              difficulty: 'medium', // OSM 데이터에는 난이도 정보가 없으므로 기본값
              visibility: 'public',
              runnerCount: 0,
              rating: 0,
              reviewCount: 0,
              source: 'osm',
              tags: {
                highway: tags.highway,
                leisure: tags.leisure,
                sport: tags.sport,
              },
            });
          }
        }
      }
    });

    console.log(`[OSM] ${routes.length}개의 러닝 경로를 찾았습니다.`);
    return routes;
  } catch (error) {
    console.error('[OSM] 러닝 경로 가져오기 오류:', error);
    return [];
  }
};

/**
 * 특정 지역의 인기 러닝 경로 가져오기 (여러 경로를 합쳐서 긴 코스 생성)
 */
export const getPopularRoutesFromOSM = async (
  latitude,
  longitude,
  radiusKm = 5
) => {
  try {
    const routes = await getRunningRoutesFromOSM(latitude, longitude, radiusKm);
    
    // 거리순으로 정렬하여 긴 경로를 우선
    return routes
      .sort((a, b) => b.distance - a.distance)
      .slice(0, 10); // 상위 10개만 반환
  } catch (error) {
    console.error('[OSM] 인기 경로 가져오기 오류:', error);
    return [];
  }
};

