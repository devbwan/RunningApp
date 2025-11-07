import { Redirect } from 'expo-router';

export default function Index() {
  console.log('[Index] 초기 라우팅 - (tabs)로 리다이렉트');
  // 초기 화면을 (tabs)/index로 리다이렉트
  return <Redirect href="/(tabs)/" />;
}

