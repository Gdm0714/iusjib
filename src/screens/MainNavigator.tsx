import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeScreen from './HomeScreen';
import BoardScreen from './BoardScreen';
import PostDetailScreen from './PostDetailScreen';
import ProfileScreen from './ProfileScreen';
import CreatePostScreen from './CreatePostScreen';
import VerificationScreen from './VerificationScreen';
import { BoardType } from '../types';

type Screen = 'home' | 'board' | 'post' | 'profile' | 'createPost' | 'verification';

export default function MainNavigator() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedBoard, setSelectedBoard] = useState<BoardType>('notice');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const navigateToBoard = (boardType: BoardType) => {
    setSelectedBoard(boardType);
    setCurrentScreen('board');
  };

  const navigateToPost = (postId: string) => {
    setSelectedPostId(postId);
    setCurrentScreen('post');
  };

  const navigateBack = () => {
    if (currentScreen === 'post') {
      setCurrentScreen('board');
    } else if (currentScreen === 'board') {
      setCurrentScreen('home');
    } else if (currentScreen === 'profile') {
      setCurrentScreen('home');
    } else if (currentScreen === 'createPost') {
      setCurrentScreen('home');
    }
  };

  const navigateToCreatePost = () => {
    setCurrentScreen('createPost');
  };

  const navigateToVerification = () => {
    setCurrentScreen('verification');
  };

  const handlePostCreated = () => {
    setCurrentScreen('home');
  };

  const handleVerificationCompleted = () => {
    setCurrentScreen('home');
  };

  const getBoardTitle = (boardType: BoardType): string => {
    switch (boardType) {
      case 'notice':
        return '공지/정보';
      case 'share':
        return '나눔/거래';
      case 'free':
        return '자유게시판';
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {currentScreen !== 'home' && (
              <TouchableOpacity onPress={navigateBack} style={{ marginRight: 12 }}>
                <Text style={{ fontSize: 24, color: '#374151' }}>←</Text>
              </TouchableOpacity>
            )}
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>
              {currentScreen === 'home' && '이웃집'}
              {currentScreen === 'board' && getBoardTitle(selectedBoard)}
              {currentScreen === 'post' && '게시글'}
              {currentScreen === 'profile' && '프로필'}
              {currentScreen === 'createPost' && '글쓰기'}
              {currentScreen === 'verification' && '거주 인증'}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {currentScreen === 'home' && (
          <HomeScreen
            onNavigateToBoard={navigateToBoard}
            onNavigateToProfile={() => setCurrentScreen('profile')}
            onNavigateToCreatePost={navigateToCreatePost}
            onNavigateToVerification={navigateToVerification}
          />
        )}
        {currentScreen === 'board' && (
          <BoardScreen boardType={selectedBoard} onNavigateToPost={navigateToPost} />
        )}
        {currentScreen === 'post' && selectedPostId && (
          <PostDetailScreen postId={selectedPostId} />
        )}
        {currentScreen === 'profile' && <ProfileScreen />}
        {currentScreen === 'createPost' && (
          <CreatePostScreen onCancel={navigateBack} onSuccess={handlePostCreated} />
        )}
        {currentScreen === 'verification' && (
          <VerificationScreen onCancel={navigateBack} onSuccess={handleVerificationCompleted} />
        )}
      </View>

      {/* Bottom Navigation */}
      {currentScreen !== 'profile' && currentScreen !== 'post' && currentScreen !== 'createPost' && currentScreen !== 'verification' && (
        <View
          style={{
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <TouchableOpacity
              onPress={() => setCurrentScreen('home')}
              style={{ alignItems: 'center', paddingVertical: 8, flex: 1 }}
            >
              <Text style={{ fontSize: 24, marginBottom: 4 }}>
                {currentScreen === 'home' ? '🏠' : '🏘️'}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: currentScreen === 'home' ? '#f97316' : '#6b7280',
                }}
              >
                홈
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCurrentScreen('profile')}
              style={{ alignItems: 'center', paddingVertical: 8, flex: 1 }}
            >
              <Text style={{ fontSize: 24, marginBottom: 4 }}>👤</Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>프로필</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
