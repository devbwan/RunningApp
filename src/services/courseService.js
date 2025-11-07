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

// Firestore 연결 상태 확인
const checkFirestoreConnection = () => {
  if (!db) {
    return false;
  }
  
  // Firestore가 초기화되었는지 확인
  try {
    // 간단한 연결 테스트 (실제 쿼리는 하지 않음)
    return db && typeof db === 'object';
  } catch (error) {
    return false;
  }
};

// 모든 코스 조회
export const getAllCourses = async (options = {}) => {
  // Firestore 연결 확인
  if (!checkFirestoreConnection()) {
    if (__DEV__) {
      console.warn('[CourseService] Firestore가 초기화되지 않았습니다. 로컬 데이터를 사용합니다.');
    }
    return [];
  }

  try {
    const { filter = 'all', searchQuery = '', limitCount = 50 } = options;
    
    // 기본 쿼리 (인덱스가 없을 수 있으므로 간단한 쿼리부터 시도)
    let q;
    
    try {
      // visibility 필터만 사용 (인덱스 필요 없음)
      q = query(
        collection(db, COURSES_COLLECTION), 
        where('visibility', '==', 'public'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      let courses = querySnapshot.docs.map(courseFromFirestore);

      // 클라이언트 사이드에서 정렬 및 필터링
      if (filter === 'popular') {
        courses = courses.sort((a, b) => (b.runnerCount || 0) - (a.runnerCount || 0));
      } else if (filter === 'difficulty') {
        const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
        courses = courses.sort((a, b) => 
          (difficultyOrder[a.difficulty] || 2) - (difficultyOrder[b.difficulty] || 2)
        );
      } else {
        // createdAt 기준 정렬 (내림차순)
        courses = courses.sort((a, b) => {
          const aTime = a.createdAt?.getTime?.() || a.createdAt || 0;
          const bTime = b.createdAt?.getTime?.() || b.createdAt || 0;
          return bTime - aTime;
        });
      }

      // 검색어 필터링 (클라이언트 사이드)
      if (searchQuery) {
        courses = courses.filter(
          (course) =>
            course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      return courses;
    } catch (queryError) {
      // 인덱스 오류인 경우 간단한 쿼리로 재시도
      if (queryError.code === 'failed-precondition' || queryError.message?.includes('index')) {
        console.warn('[CourseService] 인덱스가 필요합니다. 간단한 쿼리로 재시도합니다.');
        
        // 인덱스 없이도 작동하는 쿼리
        q = query(collection(db, COURSES_COLLECTION), limit(limitCount));
        const querySnapshot = await getDocs(q);
        let courses = querySnapshot.docs
          .map(courseFromFirestore)
          .filter(course => course.visibility === 'public');
        
        // 클라이언트 사이드 정렬
        if (filter === 'popular') {
          courses = courses.sort((a, b) => (b.runnerCount || 0) - (a.runnerCount || 0));
        }
        
        if (searchQuery) {
          courses = courses.filter(
            (course) =>
              course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              course.description?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        
        return courses;
      }
      throw queryError;
    }
  } catch (error) {
    // 오류를 조용히 처리하고 빈 배열 반환
    if (__DEV__) {
      console.warn('[CourseService] 코스 조회 오류:', error.code || error.message);
      
      // Firestore 관련 구체적인 오류 처리
      if (error.code === 'failed-precondition') {
        console.warn('[CourseService] Firestore 인덱스가 필요합니다. Firebase Console에서 인덱스를 생성하세요.');
      } else if (error.code === 'not-found') {
        console.warn('[CourseService] Firestore 데이터베이스가 없습니다. Firebase Console에서 데이터베이스를 생성하세요.');
      } else if (error.code === 'permission-denied') {
        console.warn('[CourseService] Firestore 접근 권한이 없습니다. Firebase Console에서 보안 규칙을 확인하세요.');
      } else if (error.code === 'unavailable') {
        console.warn('[CourseService] Firestore 서비스를 사용할 수 없습니다. 네트워크 연결을 확인하세요.');
      } else if (error.code === 'invalid-argument') {
        console.warn('[CourseService] Firestore 쿼리 인자가 잘못되었습니다.');
      }
    }
    
    return [];
  }
};

// 인기 코스 TOP3 조회
export const getTop3Courses = async () => {
  if (!checkFirestoreConnection()) {
    if (__DEV__) {
      console.warn('[CourseService] Firestore가 초기화되지 않았습니다.');
    }
    return [];
  }

  try {
    // 인덱스 없이도 작동하도록 클라이언트 사이드 정렬 사용
    const q = query(
      collection(db, COURSES_COLLECTION),
      where('visibility', '==', 'public'),
      limit(50) // 더 많이 가져와서 정렬 후 상위 3개 선택
    );

    const querySnapshot = await getDocs(q);
    const courses = querySnapshot.docs
      .map(courseFromFirestore)
      .sort((a, b) => (b.runnerCount || 0) - (a.runnerCount || 0))
      .slice(0, 3);
    
    return courses;
  } catch (error) {
    // 인덱스 오류인 경우 간단한 쿼리로 재시도
    if (error.code === 'failed-precondition' || error.message?.includes('index')) {
      try {
        const q = query(collection(db, COURSES_COLLECTION), limit(50));
        const querySnapshot = await getDocs(q);
        const courses = querySnapshot.docs
          .map(courseFromFirestore)
          .filter(course => course.visibility === 'public')
          .sort((a, b) => (b.runnerCount || 0) - (a.runnerCount || 0))
          .slice(0, 3);
        return courses;
      } catch (retryError) {
        if (__DEV__) {
          console.warn('[CourseService] 인기 코스 조회 재시도 실패:', retryError);
        }
        return [];
      }
    }
    
    if (__DEV__) {
      console.warn('[CourseService] 인기 코스 조회 오류:', error.code || error.message);
    }
    
    return [];
  }
};

// 코스 상세 조회
export const getCourseById = async (courseId) => {
  if (!checkFirestoreConnection()) {
    if (__DEV__) {
      console.warn('[CourseService] Firestore가 초기화되지 않았습니다.');
    }
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
    if (__DEV__) {
      console.warn('[CourseService] 코스 상세 조회 오류:', error.code || error.message);
      
      if (error.code === 'not-found') {
        console.warn('[CourseService] 코스를 찾을 수 없습니다.');
      } else if (error.code === 'permission-denied') {
        console.warn('[CourseService] Firestore 접근 권한이 없습니다.');
      }
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

