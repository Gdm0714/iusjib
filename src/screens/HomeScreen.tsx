import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { BoardType } from '../types';

interface HomeScreenProps {
  onNavigateToBoard: (boardType: BoardType) => void;
  onNavigateToProfile: () => void;
  onNavigateToCreatePost: () => void;
  onNavigateToVerification: () => void;
}

export default function HomeScreen({ onNavigateToBoard, onNavigateToProfile, onNavigateToCreatePost, onNavigateToVerification }: HomeScreenProps) {
  const [userEmail, setUserEmail] = useState<string>('');
  const [isVerified, setIsVerified] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  async function loadUserProfile() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');

        // 프로필 정보 가져오기
        const { data: profile } = await supabase
          .from('profiles')
          .select('verified, nickname, building_id, floor')
          .eq('id', user.id)
          .single();

        if (profile) {
          setIsVerified(profile.verified);

          // 승인 대기 중인 요청이 있는지 확인
          if (!profile.verified && profile.building_id) {
            const { data: requests } = await supabase
              .from('verification_requests')
              .select('status')
              .eq('user_id', user.id)
              .eq('status', 'pending')
              .limit(1);

            setHasPendingRequest(requests && requests.length > 0);
          }
        }
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
    <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        {/* 사용자 정보 카드 */}
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: '#fed7aa',
                  borderRadius: 24,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 24 }}>👤</Text>
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>
                    {userEmail.split('@')[0]}
                  </Text>
                  {isVerified && (
                    <View
                      style={{
                        backgroundColor: '#fed7aa',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 4,
                        marginLeft: 8,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: '#9a3412', fontWeight: '600' }}>
                        인증완료
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{userEmail}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onNavigateToProfile}>
              <Text style={{ fontSize: 20 }}>⚙️</Text>
            </TouchableOpacity>
          </View>

          {!isVerified && !hasPendingRequest && (
            <TouchableOpacity
              onPress={onNavigateToVerification}
              style={{
                backgroundColor: '#fef3c7',
                padding: 12,
                borderRadius: 8,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#fbbf24',
              }}
            >
              <Text style={{ fontSize: 13, color: '#92400e', textAlign: 'center', fontWeight: '500' }}>
                ⚠️ 거주 인증을 완료하면 커뮤니티를 이용하실 수 있습니다
              </Text>
              <Text style={{ fontSize: 12, color: '#b45309', textAlign: 'center', marginTop: 4 }}>
                탭하여 인증하기 →
              </Text>
            </TouchableOpacity>
          )}

          {!isVerified && hasPendingRequest && (
            <View
              style={{
                backgroundColor: '#eff6ff',
                padding: 12,
                borderRadius: 8,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#3b82f6',
              }}
            >
              <Text style={{ fontSize: 13, color: '#1e40af', textAlign: 'center', fontWeight: '500' }}>
                ⏳ 관리자가 거주 인증을 검토 중입니다
              </Text>
              <Text style={{ fontSize: 12, color: '#3b82f6', textAlign: 'center', marginTop: 4 }}>
                승인되면 커뮤니티를 이용하실 수 있습니다
              </Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={onNavigateToCreatePost}
              style={{
                flex: 1,
                backgroundColor: '#fff5ed',
                paddingVertical: 10,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#f97316', fontWeight: '600' }}>글쓰기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSignOut}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                backgroundColor: '#f3f4f6',
                borderRadius: 8,
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 16 }}>🚪</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 게시판 섹션 */}
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>
          게시판
        </Text>

        <View style={{ gap: 12 }}>
          {/* 공지/정보 */}
          <TouchableOpacity
            onPress={() => onNavigateToBoard('notice')}
            disabled={!isVerified}
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
              opacity: isVerified ? 1 : 0.5,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: '#fee2e2',
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 20 }}>📢</Text>
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>
                  공지/정보
                </Text>
                <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                  관리사무소 공지, 분실물, 민원
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 20 }}>→</Text>
          </TouchableOpacity>

          {/* 나눔/거래 */}
          <TouchableOpacity
            onPress={() => onNavigateToBoard('share')}
            disabled={!isVerified}
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
              opacity: isVerified ? 1 : 0.5,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: '#dcfce7',
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 20 }}>🎁</Text>
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>
                  나눔/거래
                </Text>
                <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                  중고거래, 공동구매, 나눔
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 20 }}>→</Text>
          </TouchableOpacity>

          {/* 자유게시판 */}
          <TouchableOpacity
            onPress={() => onNavigateToBoard('free')}
            disabled={!isVerified}
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
              opacity: isVerified ? 1 : 0.5,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: '#fed7aa',
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 20 }}>💬</Text>
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>
                  자유게시판
                </Text>
                <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                  일상 소통, 맛집, 동네 이슈
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 20 }}>→</Text>
          </TouchableOpacity>
        </View>

        {/* 공지 카드 */}
        <View
          style={{
            marginTop: 24,
            backgroundColor: '#fff5ed',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: '#fed7aa',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 20, marginRight: 12 }}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#9a3412', marginBottom: 4 }}>
                이웃집에 오신 것을 환영합니다!
              </Text>
              <Text style={{ fontSize: 13, color: '#92400e', lineHeight: 20 }}>
                같은 건물 이웃들과 소통하고 정보를 공유하세요. 궁금한 점이 있다면 자유게시판에 글을
                남겨주세요.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
