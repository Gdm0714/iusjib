import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { supabase } from '../lib/supabase';

// 개발 모드 플래그 (환경 변수에서 읽기)
const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 인증 시도:', isSignUp ? '회원가입' : '로그인');
      console.log('📧 이메일:', email);

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: 'iusjib://', // 딥링크 리다이렉트
          },
        });
        console.log('📝 회원가입 응답:', { data, error });
        if (error) throw error;

        // 개발 모드 vs 프로덕션 모드 메시지
        if (DEV_MODE) {
          Alert.alert(
            '개발 모드',
            '⚠️ 개발 모드입니다.\n\nSupabase에서 이메일 인증을 활성화하려면:\n1. Authentication > Providers > Email\n2. "Confirm email" 옵션 켜기\n\n지금은 회원가입 후 바로 로그인할 수 있습니다.',
            [{ text: '확인' }]
          );
        } else {
          // 프로덕션: 이메일 인증 필요
          Alert.alert(
            '이메일 인증 필요',
            '가입하신 이메일로 인증 링크가 전송되었습니다.\n이메일을 확인하여 인증을 완료해주세요.',
            [{ text: '확인' }]
          );
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        console.log('🔓 로그인 응답:', { data, error });
        if (error) throw error;
      }
    } catch (error: any) {
      console.error('❌ 인증 오류:', error);
      console.error('❌ 오류 상세:', JSON.stringify(error, null, 2));
      Alert.alert('오류', error.message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 24,
          backgroundColor: '#fff',
        }}
      >
        {/* 로고 영역 */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <View
            style={{
              width: 80,
              height: 80,
              backgroundColor: '#f97316',
              borderRadius: 40,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 32, color: '#fff' }}>🏢</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 }}>
            이웃집
          </Text>
          <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center' }}>
            같은 건물 이웃들과{'\n'}소통하고 정보를 나누는 공간
          </Text>
        </View>

        {/* 입력 폼 */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>이메일</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="example@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            style={{
              borderWidth: 1,
              borderColor: '#d1d5db',
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              backgroundColor: '#fff',
            }}
          />
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>비밀번호</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="6자 이상 입력"
            secureTextEntry
            style={{
              borderWidth: 1,
              borderColor: '#d1d5db',
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              backgroundColor: '#fff',
            }}
          />
        </View>

        {/* 버튼 */}
        <TouchableOpacity
          onPress={handleAuth}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#9ca3af' : '#f97316',
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            {loading ? '처리 중...' : isSignUp ? '회원가입' : '로그인'}
          </Text>
        </TouchableOpacity>

        {/* 전환 버튼 */}
        <TouchableOpacity
          onPress={() => setIsSignUp(!isSignUp)}
          style={{ alignItems: 'center', paddingVertical: 12 }}
        >
          <Text style={{ color: '#6b7280', fontSize: 14 }}>
            {isSignUp ? '이미 계정이 있으신가요? ' : '계정이 없으신가요? '}
            <Text style={{ color: '#f97316', fontWeight: '600' }}>
              {isSignUp ? '로그인' : '회원가입'}
            </Text>
          </Text>
        </TouchableOpacity>

        {/* 개발 모드 경고 */}
        {DEV_MODE && (
          <View
            style={{
              marginTop: 32,
              padding: 16,
              backgroundColor: '#fee2e2',
              borderRadius: 8,
              borderWidth: 2,
              borderColor: '#dc2626',
            }}
          >
            <Text style={{ fontSize: 14, color: '#991b1b', textAlign: 'center', fontWeight: '600', marginBottom: 4 }}>
              ⚠️ 개발 모드
            </Text>
            <Text style={{ fontSize: 12, color: '#b91c1c', textAlign: 'center' }}>
              이메일 인증이 비활성화되어 있습니다.{'\n'}프로덕션 배포 전에 .env에서 DEV_MODE를 false로 변경하세요.
            </Text>
          </View>
        )}

        {/* 안내 메시지 */}
        <View
          style={{
            marginTop: 16,
            padding: 16,
            backgroundColor: '#fef3c7',
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 13, color: '#92400e', textAlign: 'center' }}>
            💡 회원가입 후 거주 인증을 완료하면{'\n'}커뮤니티를 이용하실 수 있습니다
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
