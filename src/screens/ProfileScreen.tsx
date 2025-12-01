import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export default function ProfileScreen() {
  const [userEmail, setUserEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [verified, setVerified] = useState(false);
  const [joinedDate, setJoinedDate] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserEmail(user.email || '');

      const { data: profile } = await supabase
        .from('profiles')
        .select(
          `
          *,
          building:buildings(name)
        `
        )
        .eq('id', user.id)
        .single();

      if (profile) {
        setNickname(profile.nickname || '');
        setFloor(profile.floor || '미설정');
        setVerified(profile.verified);
        setJoinedDate(new Date(profile.created_at).toLocaleDateString('ko-KR'));
        setBuilding(profile.building?.name || '미설정');
      }
    } catch (error: any) {
      console.error('프로필 로드 오류:', error.message);
    }
  }

  async function handleSignOut() {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 16 }}>
        {/* 프로필 헤더 */}
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 24,
            alignItems: 'center',
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              backgroundColor: '#fed7aa',
              borderRadius: 40,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 36 }}>👤</Text>
          </View>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 4 }}>
            {nickname}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {verified && (
              <View
                style={{
                  backgroundColor: '#fed7aa',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontSize: 12, color: '#9a3412', fontWeight: '600' }}>✓ 인증완료</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>
            가입일: {joinedDate}
          </Text>
        </View>

        {/* 사용자 정보 */}
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <View
            style={{
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: '#f3f4f6',
            }}
          >
            <Text style={{ fontSize: 20, marginRight: 12 }}>🏢</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>건물</Text>
              <Text style={{ fontSize: 14, color: '#1f2937' }}>{building}</Text>
            </View>
          </View>
          <View
            style={{
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: '#f3f4f6',
            }}
          >
            <Text style={{ fontSize: 20, marginRight: 12 }}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>층수</Text>
              <Text style={{ fontSize: 14, color: '#1f2937' }}>{floor}</Text>
            </View>
          </View>
          <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, marginRight: 12 }}>✉️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>이메일</Text>
              <Text style={{ fontSize: 14, color: '#1f2937' }}>{userEmail}</Text>
            </View>
          </View>
        </View>

        {/* 활동 통계 */}
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 16 }}>
            내 활동
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '600', color: '#f97316', marginBottom: 4 }}>
                0
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>작성글</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '600', color: '#f97316', marginBottom: 4 }}>
                0
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>댓글</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '600', color: '#f97316', marginBottom: 4 }}>
                0
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>좋아요</Text>
            </View>
          </View>
        </View>

        {/* 설정 메뉴 */}
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <TouchableOpacity
            style={{
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomWidth: 1,
              borderBottomColor: '#f3f4f6',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 20, marginRight: 12 }}>⚙️</Text>
              <Text style={{ fontSize: 14, color: '#374151' }}>설정</Text>
            </View>
            <Text style={{ fontSize: 18, color: '#d1d5db' }}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSignOut}
            style={{
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 20, marginRight: 12 }}>🚪</Text>
              <Text style={{ fontSize: 14, color: '#374151' }}>로그아웃</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 앱 정보 */}
        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
          <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>이웃집 v1.0.0</Text>
          <Text style={{ fontSize: 11, color: '#d1d5db' }}>
            오피스텔/원룸 거주자 커뮤니티
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
