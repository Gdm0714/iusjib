export type BoardType = 'notice' | 'share' | 'free';

export interface User {
  id: string;
  email: string;
  nickname: string;
  building_id: string;
  floor: string;
  verified: boolean;
  created_at: string;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  created_at: string;
}

export interface Post {
  id: string;
  board_type: BoardType;
  title: string;
  content: string;
  author_id: string;
  building_id: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  author?: {
    nickname: string;
    floor: string;
  };
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: {
    nickname: string;
    floor: string;
  };
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface VerificationRequest {
  id: string;
  user_id: string;
  building_id: string;
  floor: string;
  document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}
