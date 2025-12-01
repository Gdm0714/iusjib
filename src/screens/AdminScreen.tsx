import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  Modal,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { VerificationRequest } from '../types';

export default function AdminScreen() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    loadRequests();
  }, [filter]);

  async function loadRequests() {
    try {
      setLoading(true);
      let query = supabase
        .from('verification_requests')
        .select(
          `
          *,
          user:profiles!verification_requests_user_id_fkey(email, nickname),
          building:buildings!verification_requests_building_id_fkey(name, address)
        `
        )
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('status', 'pending');
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error('인증 요청 로드 오류:', error.message);
      Alert.alert('오류', '인증 요청을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(request: VerificationRequest) {
    try {
      // 인증 요청 상태 업데이트
      const { error: requestError } = await supabase
        .from('verification_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (requestError) throw requestError;

      // 사용자 프로필 verified 업데이트
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ verified: true })
        .eq('id', request.user_id);

      if (profileError) throw profileError;

      Alert.alert('승인 완료', '거주 인증이 승인되었습니다.');
      setShowDetailModal(false);
      loadRequests();
    } catch (error: any) {
      console.error('승인 오류:', error.message);
      Alert.alert('오류', '승인 처리에 실패했습니다.');
    }
  }

  async function handleReject(request: VerificationRequest) {
    Alert.alert(
      '거부 확인',
      '정말로 이 인증 요청을 거부하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '거부',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('verification_requests')
                .update({
                  status: 'rejected',
                  reviewed_at: new Date().toISOString(),
                })
                .eq('id', request.id);

              if (error) throw error;

              Alert.alert('거부 완료', '인증 요청이 거부되었습니다.');
              setShowDetailModal(false);
              loadRequests();
            } catch (error: any) {
              console.error('거부 오류:', error.message);
              Alert.alert('오류', '거부 처리에 실패했습니다.');
            }
          },
        },
      ]
    );
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'pending':
        return '대기 중';
      case 'approved':
        return '승인';
      case 'rejected':
        return '거부';
      default:
        return status;
    }
  }

  function renderRequest({ item }: { item: VerificationRequest }) {
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedRequest(item);
          setShowDetailModal(true);
        }}
        style={{
          backgroundColor: '#fff',
          padding: 16,
          marginHorizontal: 16,
          marginVertical: 8,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#e5e7eb',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 }}>
              {item.user?.nickname || '알 수 없음'}
            </Text>
            <Text style={{ fontSize: 13, color: '#6b7280' }}>{item.user?.email}</Text>
          </View>
          <View
            style={{
              backgroundColor: getStatusColor(item.status) + '20',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
              height: 24,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: getStatusColor(item.status) }}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: '#f9fafb',
            padding: 12,
            borderRadius: 8,
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 4 }}>
            {item.building?.name}
          </Text>
          <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>
            {item.building?.address}
          </Text>
          <Text style={{ fontSize: 13, color: '#6b7280' }}>📍 {item.floor}</Text>
        </View>

        <Text style={{ fontSize: 12, color: '#9ca3af' }}>
          신청일: {new Date(item.created_at).toLocaleString('ko-KR')}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* 헤더 */}
      <View
        style={{
          backgroundColor: '#fff',
          paddingTop: 60,
          paddingBottom: 16,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 }}>
          인증 요청 관리
        </Text>

        {/* 필터 버튼 */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => setFilter('pending')}
            style={{
              flex: 1,
              backgroundColor: filter === 'pending' ? '#f97316' : '#f3f4f6',
              paddingVertical: 10,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: filter === 'pending' ? '#fff' : '#6b7280',
              }}
            >
              대기 중
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('all')}
            style={{
              flex: 1,
              backgroundColor: filter === 'all' ? '#f97316' : '#f3f4f6',
              paddingVertical: 10,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: filter === 'all' ? '#fff' : '#6b7280',
              }}
            >
              전체
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 요청 목록 */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : requests.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📋</Text>
          <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center' }}>
            {filter === 'pending' ? '대기 중인 인증 요청이 없습니다' : '인증 요청이 없습니다'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      )}

      {/* 상세 모달 */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: 20,
              maxHeight: '80%',
            }}
          >
            {selectedRequest && (
              <ScrollView>
                <View style={{ paddingHorizontal: 20 }}>
                  {/* 헤더 */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 20,
                    }}
                  >
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }}>
                      인증 요청 상세
                    </Text>
                    <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                      <Text style={{ fontSize: 16, color: '#6b7280' }}>닫기</Text>
                    </TouchableOpacity>
                  </View>

                  {/* 사용자 정보 */}
                  <View
                    style={{
                      backgroundColor: '#f9fafb',
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 16,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>신청자 정보</Text>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 }}>
                      {selectedRequest.user?.nickname}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#6b7280' }}>
                      {selectedRequest.user?.email}
                    </Text>
                  </View>

                  {/* 건물 정보 */}
                  <View
                    style={{
                      backgroundColor: '#f9fafb',
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 16,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>거주지 정보</Text>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 }}>
                      {selectedRequest.building?.name}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>
                      {selectedRequest.building?.address}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#1f2937' }}>📍 {selectedRequest.floor}</Text>
                  </View>

                  {/* 서류 이미지 */}
                  {selectedRequest.document_url !== 'placeholder' && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                        제출된 서류
                      </Text>
                      <Image
                        source={{ uri: selectedRequest.document_url }}
                        style={{
                          width: '100%',
                          height: 200,
                          borderRadius: 12,
                          backgroundColor: '#f3f4f6',
                        }}
                        resizeMode="contain"
                      />
                    </View>
                  )}

                  {/* 신청 일시 */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, color: '#6b7280' }}>
                      신청일: {new Date(selectedRequest.created_at).toLocaleString('ko-KR')}
                    </Text>
                    {selectedRequest.reviewed_at && (
                      <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                        처리일: {new Date(selectedRequest.reviewed_at).toLocaleString('ko-KR')}
                      </Text>
                    )}
                  </View>

                  {/* 버튼 (pending 상태일 때만) */}
                  {selectedRequest.status === 'pending' && (
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                      <TouchableOpacity
                        onPress={() => handleReject(selectedRequest)}
                        style={{
                          flex: 1,
                          backgroundColor: '#fee2e2',
                          paddingVertical: 14,
                          borderRadius: 12,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#dc2626' }}>
                          거부
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleApprove(selectedRequest)}
                        style={{
                          flex: 1,
                          backgroundColor: '#f97316',
                          paddingVertical: 14,
                          borderRadius: 12,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
                          승인
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
