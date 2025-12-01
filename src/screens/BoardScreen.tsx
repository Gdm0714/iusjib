import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { BoardType, Post } from '../types';

interface BoardScreenProps {
  boardType: BoardType;
  onNavigateToPost: (postId: string) => void;
}

export default function BoardScreen({ boardType, onNavigateToPost }: BoardScreenProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [boardType]);

  async function loadPosts() {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(
          `
          *,
          author:profiles!posts_author_id_fkey(nickname, floor)
        `
        )
        .eq('board_type', boardType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      console.error('게시글 로드 오류:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadPosts();
  }

  function formatTimeAgo(dateString: string): string {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`;
    return past.toLocaleDateString('ko-KR');
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{ padding: 16 }}>
        {posts.length === 0 ? (
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 32,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📝</Text>
            <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center' }}>
              아직 작성된 게시글이 없습니다{'\n'}첫 글을 작성해보세요!
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {posts.map((post) => (
              <TouchableOpacity
                key={post.id}
                onPress={() => onNavigateToPost(post.id)}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: 8,
                  }}
                  numberOfLines={1}
                >
                  {post.title}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: '#6b7280',
                    marginBottom: 12,
                    lineHeight: 20,
                  }}
                  numberOfLines={2}
                >
                  {post.content}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                      {post.author?.nickname || '알 수 없음'}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#d1d5db' }}>·</Text>
                    <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                      {formatTimeAgo(post.created_at)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 14 }}>💬</Text>
                      <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                        {post.comments_count}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 14 }}>❤️</Text>
                      <Text style={{ fontSize: 12, color: '#9ca3af' }}>{post.likes_count}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
