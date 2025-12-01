import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Post, Comment } from '../types';

interface PostDetailScreenProps {
  postId: string;
}

export default function PostDetailScreen({ postId }: PostDetailScreenProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    loadPostDetail();
    checkIfLiked();
  }, [postId]);

  async function loadPostDetail() {
    try {
      // 게시글 로드
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(
          `
          *,
          author:profiles!posts_author_id_fkey(nickname, floor)
        `
        )
        .eq('id', postId)
        .single();

      if (postError) throw postError;
      setPost(postData);

      // 댓글 로드
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(
          `
          *,
          author:profiles!comments_author_id_fkey(nickname, floor)
        `
        )
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;
      setComments(commentsData || []);
    } catch (error: any) {
      console.error('게시글 로드 오류:', error.message);
      Alert.alert('오류', '게시글을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function checkIfLiked() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      setIsLiked(!!data);
    } catch (error) {
      // 좋아요가 없으면 에러 발생, 무시
    }
  }

  async function handleLike() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (isLiked) {
        // 좋아요 취소
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
        setIsLiked(false);
        if (post) {
          setPost({ ...post, likes_count: post.likes_count - 1 });
        }
      } else {
        // 좋아요
        await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
        setIsLiked(true);
        if (post) {
          setPost({ ...post, likes_count: post.likes_count + 1 });
        }
      }
    } catch (error: any) {
      console.error('좋아요 오류:', error.message);
    }
  }

  async function handleSubmitComment() {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          content: newComment.trim(),
        })
        .select(
          `
          *,
          author:profiles!comments_author_id_fkey(nickname, floor)
        `
        )
        .single();

      if (error) throw error;

      setComments([...comments, data]);
      setNewComment('');
      if (post) {
        setPost({ ...post, comments_count: post.comments_count + 1 });
      }
    } catch (error: any) {
      console.error('댓글 작성 오류:', error.message);
      Alert.alert('오류', '댓글을 작성할 수 없습니다.');
    } finally {
      setSubmitting(false);
    }
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

  if (loading || !post) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={100}
    >
      <ScrollView style={{ flex: 1 }}>
        {/* 게시글 내용 */}
        <View style={{ backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
          <Text style={{ fontSize: 20, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>
            {post.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Text style={{ fontSize: 13, color: '#6b7280' }}>
              {post.author?.nickname || '알 수 없음'}
            </Text>
            <Text style={{ fontSize: 13, color: '#d1d5db' }}>·</Text>
            <Text style={{ fontSize: 13, color: '#6b7280' }}>{post.author?.floor}</Text>
            <Text style={{ fontSize: 13, color: '#d1d5db' }}>·</Text>
            <Text style={{ fontSize: 13, color: '#6b7280' }}>{formatTimeAgo(post.created_at)}</Text>
          </View>
          <Text style={{ fontSize: 15, color: '#374151', lineHeight: 24, marginBottom: 16 }}>
            {post.content}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
            <TouchableOpacity
              onPress={handleLike}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Text style={{ fontSize: 18 }}>{isLiked ? '❤️' : '🤍'}</Text>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>{post.likes_count}</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 18 }}>💬</Text>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>{post.comments_count}</Text>
            </View>
          </View>
        </View>

        {/* 댓글 목록 */}
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 16 }}>
            댓글 {comments.length}
          </Text>
          {comments.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Text style={{ fontSize: 14, color: '#9ca3af' }}>첫 댓글을 작성해보세요!</Text>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {comments.map((comment) => (
                <View key={comment.id} style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>
                      {comment.author?.nickname || '알 수 없음'}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                      {formatTimeAgo(comment.created_at)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: '#4b5563', lineHeight: 20 }}>
                    {comment.content}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 댓글 입력 */}
      <View
        style={{
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          padding: 12,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={newComment}
            onChangeText={setNewComment}
            placeholder="댓글을 입력하세요..."
            multiline
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: '#d1d5db',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              fontSize: 14,
              maxHeight: 80,
            }}
          />
          <TouchableOpacity
            onPress={handleSubmitComment}
            disabled={submitting || !newComment.trim()}
            style={{
              backgroundColor: submitting || !newComment.trim() ? '#d1d5db' : '#f97316',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 8,
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>
              {submitting ? '...' : '작성'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
