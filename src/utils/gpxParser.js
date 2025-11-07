/**
 * GPX 파일 파싱 유틸리티
 * 
 * GPX (GPS Exchange Format) 파일을 파싱하여 러닝 코스 데이터로 변환
 * 무료로 사용 가능한 GPX 파일은 다음 사이트에서 다운로드 가능:
 * - Wikiloc (https://www.wikiloc.com)
 * - AllTrails (https://www.alltrails.com)
 * - TrailRunProject (https://www.trailrunproject.com)
 */

/**
 * XML 텍스트를 파싱하여 DOM 객체로 변환
 */
const parseXML = (xmlText) => {
  if (typeof DOMParser !== 'undefined') {
    // 웹 환경
    const parser = new DOMParser();
    return parser.parseFromString(xmlText, 'text/xml');
  } else {
    // React Native 환경에서는 xml2js 같은 라이브러리 필요
    // 간단한 파싱을 위해 정규식 사용
    throw new Error('React Native 환경에서는 xml2js 라이브러리가 필요합니다.');
  }
};

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
      prev.lat,
      prev.lng,
      curr.lat,
      curr.lng
    );
  }
  return totalDistance;
};

/**
 * GPX 파일 내용을 파싱하여 코스 데이터로 변환
 * 
 * @param {string} gpxContent - GPX 파일 내용 (텍스트)
 * @param {string} courseName - 코스 이름 (선택사항)
 * @returns {Object|null} 코스 데이터 객체
 */
export const parseGPXFile = (gpxContent, courseName = null) => {
  try {
    // XML 파싱
    const xmlDoc = parseXML(gpxContent);
    
    // GPX 네임스페이스 확인
    const gpxElements = xmlDoc.getElementsByTagName('gpx');
    if (gpxElements.length === 0) {
      throw new Error('유효한 GPX 파일이 아닙니다.');
    }

    // 트랙 또는 경로 찾기
    let coordinates = [];
    let name = courseName;
    let description = '';

    // trkpt (트랙 포인트) 찾기
    const trackPoints = xmlDoc.getElementsByTagName('trkpt');
    if (trackPoints.length > 0) {
      for (let i = 0; i < trackPoints.length; i++) {
        const pt = trackPoints[i];
        const lat = parseFloat(pt.getAttribute('lat'));
        const lon = parseFloat(pt.getAttribute('lon'));
        
        if (!isNaN(lat) && !isNaN(lon)) {
          coordinates.push({
            lat,
            lng: lon,
          });
        }
      }
    } else {
      // wpt (웨이포인트) 찾기
      const waypoints = xmlDoc.getElementsByTagName('wpt');
      for (let i = 0; i < waypoints.length; i++) {
        const wpt = waypoints[i];
        const lat = parseFloat(wpt.getAttribute('lat'));
        const lon = parseFloat(wpt.getAttribute('lon'));
        
        if (!isNaN(lat) && !isNaN(lon)) {
          coordinates.push({
            lat,
            lng: lon,
          });
        }
      }
    }

    // 이름 찾기
    if (!name) {
      const nameElements = xmlDoc.getElementsByTagName('name');
      if (nameElements.length > 0) {
        name = nameElements[0].textContent || 'GPX 코스';
      } else {
        name = 'GPX 코스';
      }
    }

    // 설명 찾기
    const descElements = xmlDoc.getElementsByTagName('desc');
    if (descElements.length > 0) {
      description = descElements[0].textContent || '';
    }

    if (coordinates.length < 2) {
      throw new Error('경로 좌표가 부족합니다 (최소 2개 필요).');
    }

    const distance = calculateTotalDistance(coordinates);

    return {
      name: name.trim(),
      description: description.trim(),
      coordinates,
      distance: Math.round(distance),
      difficulty: 'medium', // GPX에는 난이도 정보가 없으므로 기본값
      visibility: 'public',
      runnerCount: 0,
      rating: 0,
      reviewCount: 0,
      source: 'gpx',
    };
  } catch (error) {
    console.error('[GPX] 파싱 오류:', error);
    throw error;
  }
};

/**
 * GPX 파일 URL에서 다운로드하여 파싱
 * 
 * @param {string} gpxUrl - GPX 파일 URL
 * @param {string} courseName - 코스 이름 (선택사항)
 * @returns {Promise<Object>} 코스 데이터 객체
 */
export const parseGPXFromURL = async (gpxUrl, courseName = null) => {
  try {
    const response = await fetch(gpxUrl);
    
    if (!response.ok) {
      throw new Error(`GPX 파일 다운로드 실패: ${response.status}`);
    }

    const gpxContent = await response.text();
    return parseGPXFile(gpxContent, courseName);
  } catch (error) {
    console.error('[GPX] URL에서 파싱 오류:', error);
    throw error;
  }
};

/**
 * 간단한 정규식 기반 GPX 파싱 (React Native 호환)
 * DOMParser가 없는 환경에서 사용
 */
export const parseGPXSimple = (gpxContent, courseName = null) => {
  try {
    const coordinates = [];
    let name = courseName || 'GPX 코스';
    let description = '';

    // trkpt 태그에서 좌표 추출
    const trkptRegex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"/g;
    let match;
    while ((match = trkptRegex.exec(gpxContent)) !== null) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lon)) {
        coordinates.push({ lat, lng: lon });
      }
    }

    // wpt 태그에서 좌표 추출 (trkpt가 없는 경우)
    if (coordinates.length === 0) {
      const wptRegex = /<wpt\s+lat="([^"]+)"\s+lon="([^"]+)"/g;
      while ((match = wptRegex.exec(gpxContent)) !== null) {
        const lat = parseFloat(match[1]);
        const lon = parseFloat(match[2]);
        if (!isNaN(lat) && !isNaN(lon)) {
          coordinates.push({ lat, lng: lon });
        }
      }
    }

    // 이름 추출
    const nameMatch = gpxContent.match(/<name>([^<]+)<\/name>/);
    if (nameMatch && !courseName) {
      name = nameMatch[1].trim();
    }

    // 설명 추출
    const descMatch = gpxContent.match(/<desc>([^<]+)<\/desc>/);
    if (descMatch) {
      description = descMatch[1].trim();
    }

    if (coordinates.length < 2) {
      throw new Error('경로 좌표가 부족합니다 (최소 2개 필요).');
    }

    const distance = calculateTotalDistance(coordinates);

    return {
      name: name.trim(),
      description: description.trim(),
      coordinates,
      distance: Math.round(distance),
      difficulty: 'medium',
      visibility: 'public',
      runnerCount: 0,
      rating: 0,
      reviewCount: 0,
      source: 'gpx',
    };
  } catch (error) {
    console.error('[GPX] 간단 파싱 오류:', error);
    throw error;
  }
};

