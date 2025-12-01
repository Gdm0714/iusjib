import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

interface VerificationScreenProps {
  onCancel: () => void;
  onSuccess: () => void;
}

interface Building {
  id: string;
  name: string;
  address: string;
}

export default function VerificationScreen({ onCancel, onSuccess }: VerificationScreenProps) {
  const [step, setStep] = useState<'building' | 'floor' | 'document'>('building');
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [floor, setFloor] = useState('');
  const [newBuildingName, setNewBuildingName] = useState('');
  const [newBuildingAddress, setNewBuildingAddress] = useState('');
  const [showNewBuildingForm, setShowNewBuildingForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documentUri, setDocumentUri] = useState<string | null>(null);

  useEffect(() => {
    loadBuildings();
    requestPermissions();
  }, []);

  async function requestPermissions() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.');
    }
  }

  async function loadBuildings() {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .order('name');

      if (error) throw error;
      setBuildings(data || []);
    } catch (error: any) {
      console.error('건물 목록 로드 오류:', error.message);
    }
  }

  async function handleCreateBuilding() {
    if (!newBuildingName.trim() || !newBuildingAddress.trim()) {
      Alert.alert('오류', '건물명과 주소를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('buildings')
        .insert({
          name: newBuildingName.trim(),
          address: newBuildingAddress.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setBuildings([...buildings, data]);
      setSelectedBuilding(data);
      setShowNewBuildingForm(false);
      setNewBuildingName('');
      setNewBuildingAddress('');
      setStep('floor');
    } catch (error: any) {
      console.error('건물 등록 오류:', error.message);
      Alert.alert('오류', '건물 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setDocumentUri(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('이미지 선택 오류:', error.message);
      Alert.alert('오류', '이미지를 선택할 수 없습니다.');
    }
  }

  async function handleSubmitVerification() {
    if (!selectedBuilding || !floor.trim()) {
      Alert.alert('오류', '모든 정보를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      // 임시: 이미지 업로드 없이 인증 요청 (나중에 Storage 연동)
      const documentUrl = documentUri || 'placeholder';

      // 프로필 업데이트
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          building_id: selectedBuilding.id,
          floor: floor.trim(),
          verified: true, // 개발 중에는 자동 인증
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 인증 요청 기록 (선택사항)
      await supabase.from('verification_requests').insert({
        user_id: user.id,
        building_id: selectedBuilding.id,
        floor: floor.trim(),
        document_url: documentUrl,
        status: 'approved', // 개발 중에는 자동 승인
      });

      Alert.alert('성공', '거주 인증이 완료되었습니다!');
      onSuccess();
    } catch (error: any) {
      console.error('인증 요청 오류:', error.message);
      Alert.alert('오류', error.message || '인증 요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
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
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>거주 인증</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 16 }}>
          {/* 진행 단계 표시 */}
          <View style={{ flexDirection: 'row', marginBottom: 24, gap: 8 }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: step === 'building' ? '#f97316' : '#d1d5db',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>1</Text>
              </View>
              <Text style={{ fontSize: 11, color: '#6b7280' }}>건물 선택</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: step === 'floor' ? '#f97316' : '#d1d5db',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>2</Text>
              </View>
              <Text style={{ fontSize: 11, color: '#6b7280' }}>층수 입력</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: step === 'document' ? '#f97316' : '#d1d5db',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>3</Text>
              </View>
              <Text style={{ fontSize: 11, color: '#6b7280' }}>서류 제출</Text>
            </View>
          </View>

          {/* Step 1: 건물 선택 */}
          {step === 'building' && (
            <View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>
                거주 중인 건물을 선택해주세요
              </Text>

              {buildings.map((building) => (
                <TouchableOpacity
                  key={building.id}
                  onPress={() => {
                    setSelectedBuilding(building);
                    setStep('floor');
                  }}
                  style={{
                    backgroundColor: '#fff',
                    padding: 16,
                    borderRadius: 8,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: selectedBuilding?.id === building.id ? '#f97316' : '#e5e7eb',
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#1f2937', marginBottom: 4 }}>
                    {building.name}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#6b7280' }}>{building.address}</Text>
                </TouchableOpacity>
              ))}

              {!showNewBuildingForm && (
                <TouchableOpacity
                  onPress={() => setShowNewBuildingForm(true)}
                  style={{
                    backgroundColor: '#f3f4f6',
                    padding: 16,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginTop: 8,
                  }}
                >
                  <Text style={{ fontSize: 14, color: '#6b7280' }}>+ 내 건물이 없어요</Text>
                </TouchableOpacity>
              )}

              {showNewBuildingForm && (
                <View
                  style={{
                    backgroundColor: '#fff',
                    padding: 16,
                    borderRadius: 8,
                    marginTop: 8,
                    borderWidth: 1,
                    borderColor: '#f97316',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>
                    새 건물 등록
                  </Text>
                  <TextInput
                    value={newBuildingName}
                    onChangeText={setNewBuildingName}
                    placeholder="건물명 (예: 강남타워 오피스텔)"
                    style={{
                      borderWidth: 1,
                      borderColor: '#d1d5db',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      marginBottom: 8,
                      fontSize: 14,
                    }}
                  />
                  <TextInput
                    value={newBuildingAddress}
                    onChangeText={setNewBuildingAddress}
                    placeholder="주소"
                    style={{
                      borderWidth: 1,
                      borderColor: '#d1d5db',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      marginBottom: 12,
                      fontSize: 14,
                    }}
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => setShowNewBuildingForm(false)}
                      style={{
                        flex: 1,
                        backgroundColor: '#f3f4f6',
                        padding: 12,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#6b7280', fontSize: 14 }}>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleCreateBuilding}
                      disabled={loading}
                      style={{
                        flex: 1,
                        backgroundColor: loading ? '#d1d5db' : '#f97316',
                        padding: 12,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                        {loading ? '등록 중...' : '등록'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Step 2: 층수 입력 */}
          {step === 'floor' && selectedBuilding && (
            <View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>
                거주 층수를 입력해주세요
              </Text>

              <View
                style={{
                  backgroundColor: '#fff',
                  padding: 16,
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>선택한 건물</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1f2937' }}>
                  {selectedBuilding.name}
                </Text>
              </View>

              <TextInput
                value={floor}
                onChangeText={setFloor}
                placeholder="층수 (예: 12층, 3F)"
                style={{
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  marginBottom: 16,
                }}
              />

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setStep('building')}
                  style={{
                    flex: 1,
                    backgroundColor: '#f3f4f6',
                    padding: 14,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#6b7280', fontSize: 15 }}>이전</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setStep('document')}
                  disabled={!floor.trim()}
                  style={{
                    flex: 1,
                    backgroundColor: floor.trim() ? '#f97316' : '#d1d5db',
                    padding: 14,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>다음</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 3: 서류 제출 */}
          {step === 'document' && (
            <View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>
                거주 증빙 서류를 제출해주세요
              </Text>

              <View
                style={{
                  backgroundColor: '#fef3c7',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 13, color: '#92400e', lineHeight: 20 }}>
                  💡 등본, 계약서, 우편물 사진 등{'\n'}개인정보는 안전하게 보호됩니다
                </Text>
              </View>

              <TouchableOpacity
                onPress={handlePickImage}
                style={{
                  backgroundColor: '#fff',
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: documentUri ? '#f97316' : '#d1d5db',
                  borderRadius: 8,
                  padding: 32,
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 40, marginBottom: 8 }}>
                  {documentUri ? '✅' : '📄'}
                </Text>
                <Text style={{ fontSize: 14, color: '#6b7280' }}>
                  {documentUri ? '서류가 선택되었습니다' : '서류 사진 선택하기'}
                </Text>
              </TouchableOpacity>

              <View
                style={{
                  backgroundColor: '#f3f4f6',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 12, color: '#6b7280', lineHeight: 18 }}>
                  ℹ️ 개발 중에는 서류 없이도 인증이 자동으로 완료됩니다
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setStep('floor')}
                  style={{
                    flex: 1,
                    backgroundColor: '#f3f4f6',
                    padding: 14,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#6b7280', fontSize: 15 }}>이전</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmitVerification}
                  disabled={loading}
                  style={{
                    flex: 1,
                    backgroundColor: loading ? '#d1d5db' : '#f97316',
                    padding: 14,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
                      인증 요청
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
