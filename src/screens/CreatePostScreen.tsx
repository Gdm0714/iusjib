import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { BoardType } from '../types';

interface CreatePostScreenProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export default function CreatePostScreen({ onCancel, onSuccess }: CreatePostScreenProps) {
  const [selectedBoard, setSelectedBoard] = useState<BoardType>('free');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [userBuildingId, setUserBuildingId] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    checkUserVerification();
  }, []);

  async function checkUserVerification() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('verified, building_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        setIsVerified(profile.verified);
        setUserBuildingId(profile.building_id);
      }
    } catch (error: any) {
      console.error('사용자 확인 오류:', error.message);
    }
  }

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) {
      Alert.alert('오류', '제목과 내용을 모두 입력해주세요.');
      return;
    }

    if (!isVerified) {
      Alert.alert('오류', '거주 인증이 완료되지 않았습니다.');
      return;
    }

    if (!userBuildingId) {
      Alert.alert('오류', '건물 정보가 없습니다.');
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const { error } = await supabase.from('posts').insert({
        board_type: selectedBoard,
        title: title.trim(),
        content: content.trim(),
        author_id: user.id,
        building_id: userBuildingId,
      });

      if (error) throw error;

      Alert.alert('성공', '게시글이 작성되었습니다!');
      onSuccess();
    } catch (error: any) {
      console.error('게시글 작성 오류:', error.message);
      Alert.alert('오류', error.message || '게시글 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const getBoardName = (type: BoardType): string => {
    switch (type) {
      case 'notice':
        return '공지/정보';
      case 'share':
        return '나눔/거래';
      case 'free':
        return '자유게시판';
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
    >
      {/* 헤더 */}
      <View
        style={{
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TouchableOpacity onPress={onCancel}>
          <Text style={{ fontSize: 16, color: '#6b7280' }}>취소</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>글쓰기</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={loading}>
          <Text
            style={{
              fontSize: 16,
              color: loading ? '#9ca3af' : '#f97316',
              fontWeight: '600',
            }}
          >
            {loading ? '작성 중...' : '완료'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 16 }}>
          {/* 게시판 선택 */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 12, fontWeight: '500' }}>
              게시판 선택
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['notice', 'share', 'free'] as BoardType[]).map((board) => (
                <TouchableOpacity
                  key={board}
                  onPress={() => setSelectedBoard(board)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 8,
                    backgroundColor: selectedBoard === board ? '#fff5ed' : '#fff',
                    borderWidth: 1,
                    borderColor: selectedBoard === board ? '#f97316' : '#e5e7eb',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: selectedBoard === board ? '#f97316' : '#6b7280',
                      fontWeight: selectedBoard === board ? '600' : '400',
                    }}
                  >
                    {getBoardName(board)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 제목 입력 */}
          <View style={{ marginBottom: 16 }}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="제목을 입력하세요"
              placeholderTextColor="#9ca3af"
              style={{
                backgroundColor: '#fff',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                borderWidth: 1,
                borderColor: '#e5e7eb',
              }}
            />
          </View>

          {/* 내용 입력 */}
          <View style={{ marginBottom: 16 }}>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="내용을 입력하세요"
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              style={{
                backgroundColor: '#fff',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                lineHeight: 22,
                minHeight: 300,
                borderWidth: 1,
                borderColor: '#e5e7eb',
              }}
            />
          </View>

          {/* 안내 메시지 */}
          {!isVerified && (
            <View
              style={{
                backgroundColor: '#fef3c7',
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 13, color: '#92400e', textAlign: 'center' }}>
                ⚠️ 거주 인증을 완료해야 게시글을 작성할 수 있습니다
              </Text>
            </View>
          )}

          {/* 작성 안내 */}
          <View
            style={{
              backgroundColor: '#f3f4f6',
              padding: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 12, color: '#6b7280', lineHeight: 18 }}>
              💡 게시판 이용 안내{'\n'}
              • 같은 건물 이웃들만 볼 수 있습니다{'\n'}
              • 개인정보는 공개하지 마세요{'\n'}
              • 서로 존중하는 커뮤니티를 만들어요
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
