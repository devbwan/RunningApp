import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COURSES_COLLECTION = 'courses';

// 코스 데이터 변환
const courseToFirestore = (course) => ({
  userId: course.userId || null,
  name: course.name,
  description: course.description || '',
  coordinates: course.coordinates || [],
  distance: course.distance || 0,
  difficulty: course.difficulty || 'medium',
  visibility: course.visibility || 'public',
  runnerCount: course.runnerCount || 0,
  rating: course.rating || 0,
  reviewCount: course.reviewCount || 0,
  createdAt: course.createdAt || serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const courseFromFirestore = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
  };
};

// 모든 코스 조회
export const getAllCourses = async (options = {}) => {
  if (!db) {
    console.warn('Firestore가 초기화되지 않았습니다. 로컬 데이터를 사용합니다.');
    return [];
  }

  try {
    const { filter = 'all', searchQuery = '', limitCount = 50 } = options;
    let q = query(collection(db, COURSES_COLLECTION), where('visibility', '==', 'public'));

    // 필터 적용
    if (filter === 'popular') {
      q = query(q, orderBy('runnerCount', 'desc'));
    } else if (filter === 'difficulty') {
      q = query(q, orderBy('difficulty', 'asc'));
    } else {
      q = query(q, orderBy('createdAt', 'desc'));
    }

    q = query(q, limit(limitCount));

    const querySnapshot = await getDocs(q);
    const courses = querySnapshot.docs.map(courseFromFirestore);

    // 검색어 필터링 (클라이언트 사이드)
    if (searchQuery) {
      return courses.filter(
        (course) =>
          course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return courses;
  } catch (error) {
    console.error('코스 조회 오류:', error);
    
    // Firestore 관련 구체적인 오류 처리
    if (error.code === 'failed-precondition') {
      console.warn('Firestore 인덱스가 필요합니다. Firebase Console에서 인덱스를 생성하세요.');
      console.warn('오류 상세:', error.message);
    } else if (error.code === 'not-found') {
      console.warn('Firestore 데이터베이스가 없습니다. Firebase Console에서 데이터베이스를 생성하세요.');
    } else if (error.code === 'permission-denied') {
      console.warn('Firestore 접근 권한이 없습니다. Firebase Console에서 보안 규칙을 확인하세요.');
    } else if (error.code === 'unavailable') {
      console.warn('Firestore 서비스를 사용할 수 없습니다. 네트워크 연결을 확인하세요.');
    } else if (error.code === 'invalid-argument') {
      console.warn('Firestore 쿼리 인자가 잘못되었습니다. 쿼리를 확인하세요.');
    } else if (error.message?.includes('index')) {
      console.warn('Firestore 복합 인덱스가 필요합니다. Firebase Console에서 인덱스를 생성하세요.');
      console.warn('Firebase Console > Firestore Database > Indexes 탭에서 필요한 인덱스를 생성하세요.');
    }
    
    return [];
  }
};

// 인기 코스 TOP3 조회
export const getTop3Courses = async () => {
  if (!db) {
    console.warn('Firestore가 초기화되지 않았습니다.');
    return [];
  }

  try {
    const q = query(
      collection(db, COURSES_COLLECTION),
      where('visibility', '==', 'public'),
      orderBy('runnerCount', 'desc'),
      limit(3)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(courseFromFirestore);
  } catch (error) {
    console.error('인기 코스 조회 오류:', error);
    
    // Firestore 관련 구체적인 오류 처리
    if (error.code === 'failed-precondition') {
      console.warn('Firestore 복합 인덱스가 필요합니다: visibility + runnerCount');
      console.warn('Firebase Console > Firestore Database > Indexes 탭에서 인덱스를 생성하세요.');
    } else if (error.code === 'not-found') {
      console.warn('Firestore 데이터베이스가 없습니다.');
    } else if (error.code === 'permission-denied') {
      console.warn('Firestore 접근 권한이 없습니다.');
    }
    
    return [];
  }
};

// 코스 상세 조회
export const getCourseById = async (courseId) => {
  if (!db) {
    console.warn('Firestore가 초기화되지 않았습니다.');
    return null;
  }

  try {
    const docRef = doc(db, COURSES_COLLECTION, courseId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return courseFromFirestore(docSnap);
    }
    return null;
  } catch (error) {
    console.error('코스 상세 조회 오류:', error);
    
    // Firestore 관련 구체적인 오류 처리
    if (error.code === 'not-found') {
      console.warn('코스를 찾을 수 없습니다.');
    } else if (error.code === 'permission-denied') {
      console.warn('Firestore 접근 권한이 없습니다.');
    }
    
    return null;
  }
};

// 코스 생성
export const createCourse = async (courseData) => {
  if (!db) {
    throw new Error('Firestore가 초기화되지 않았습니다.');
  }

  try {
    const course = courseToFirestore(courseData);
    const docRef = await addDoc(collection(db, COURSES_COLLECTION), course);
    return docRef.id;
  } catch (error) {
    console.error('코스 생성 오류:', error);
    throw error;
  }
};

// 코스 업데이트
export const updateCourse = async (courseId, updates) => {
  if (!db) {
    throw new Error('Firestore가 초기화되지 않았습니다.');
  }

  try {
    const docRef = doc(db, COURSES_COLLECTION, courseId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('코스 업데이트 오류:', error);
    throw error;
  }
};

// 러너 수 증가
export const incrementRunnerCount = async (courseId) => {
  if (!db) {
    return;
  }

  try {
    const docRef = doc(db, COURSES_COLLECTION, courseId);
    await updateDoc(docRef, {
      runnerCount: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('러너 수 증가 오류:', error);
  }
};

// 사용자가 업로드한 코스 조회
export const getUserCourses = async (userId) => {
  if (!db) {
    return [];
  }

  try {
    const q = query(
      collection(db, COURSES_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(courseFromFirestore);
  } catch (error) {
    console.error('사용자 코스 조회 오류:', error);
    
    // Firestore 관련 구체적인 오류 처리
    if (error.code === 'failed-precondition') {
      console.warn('Firestore 복합 인덱스가 필요합니다: userId + createdAt');
      console.warn('Firebase Console > Firestore Database > Indexes 탭에서 인덱스를 생성하세요.');
    } else if (error.code === 'not-found') {
      console.warn('Firestore 데이터베이스가 없습니다.');
    } else if (error.code === 'permission-denied') {
      console.warn('Firestore 접근 권한이 없습니다.');
    }
    
    return [];
  }
};

// 근처 코스 조회 (위치 기반)
export const getNearbyCourses = async (latitude, longitude, radiusKm = 10) => {
  // TODO: GeoFirestore 또는 Geohash를 사용한 위치 기반 쿼리 구현
  // 현재는 모든 공개 코스를 반환
  return getAllCourses({ filter: 'all' });
};

