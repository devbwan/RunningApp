# Google Fit API 사용 참고

`react-native-google-fit` 패키지의 실제 API 사용법입니다.

## 패키지 설치

```bash
npm install react-native-google-fit
```

## 기본 사용법

```javascript
import GoogleFit from 'react-native-google-fit';

// 권한 요청
const options = {
  scopes: [
    Scopes.FITNESS_ACTIVITY_WRITE,
    Scopes.FITNESS_ACTIVITY_READ,
    Scopes.FITNESS_LOCATION_WRITE,
    Scopes.FITNESS_LOCATION_READ,
  ],
};

GoogleFit.authorize(options)
  .then(() => {
    console.log('인증 성공');
  })
  .catch((error) => {
    console.error('인증 실패:', error);
  });

// 워크아웃 저장
const workoutData = {
  activityType: 'running',
  startTime: Date.now(),
  endTime: Date.now() + 3600000,
  calories: 300,
  distance: 5.0, // km
  duration: 3600, // seconds
};

GoogleFit.saveWorkout(workoutData)
  .then(() => {
    console.log('워크아웃 저장 성공');
  })
  .catch((error) => {
    console.error('워크아웃 저장 실패:', error);
  });
```

## 주의사항

패키지 버전에 따라 API가 다를 수 있습니다. 실제 패키지 문서를 확인하세요:
- [react-native-google-fit GitHub](https://github.com/StasDoskalenko/react-native-google-fit)

