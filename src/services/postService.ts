import { Post, Comment, User } from '../types';

const POSTS_KEY = 'posts';

export const getPosts = (): Post[] => {
  const posts = localStorage.getItem(POSTS_KEY);
  return posts ? JSON.parse(posts) : [];
};

export const savePosts = (posts: Post[]) => {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
};

export const createPost = (post: Omit<Post, 'id' | 'createdAt' | 'savedBy'>): Post => {
  const posts = getPosts();
  const newPost: Post = {
    ...post,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    savedBy: [],
  };
  posts.push(newPost);
  savePosts(posts);
  return newPost;
};

export const likePost = (postId: string, userId: string): boolean => {
  const posts = getPosts();
  const postIndex = posts.findIndex(p => p.id === postId);
  
  if (postIndex === -1) return false;

  const post = posts[postIndex];
  if (post.likes.includes(userId)) {
    post.likes = post.likes.filter(id => id !== userId);
  } else {
    post.likes.push(userId);
  }

  savePosts(posts);
  return true;
};

export const addComment = (postId: string, comment: Omit<Comment, 'id' | 'createdAt'>): Comment | null => {
  const posts = getPosts();
  const postIndex = posts.findIndex(p => p.id === postId);
  
  if (postIndex === -1) return null;

  const newComment: Comment = {
    ...comment,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };

  posts[postIndex].comments.push(newComment);
  savePosts(posts);
  return newComment;
};

export const savePost = (postId: string, userId: string): boolean => {
  const posts = getPosts();
  const postIndex = posts.findIndex(p => p.id === postId);
  
  if (postIndex === -1) return false;

  const post = posts[postIndex];
  if (post.savedBy.includes(userId)) {
    post.savedBy = post.savedBy.filter(id => id !== userId);
  } else {
    post.savedBy.push(userId);
  }

  savePosts(posts);
  return true;
};

export const getSavedPosts = (userId: string): Post[] => {
  const posts = getPosts();
  return posts.filter(p => p.savedBy.includes(userId));
};

export const getPublicPosts = (excludeUserId?: string): Post[] => {
  const posts = getPosts();
  return posts
    .filter(p => p.visibility === 'public' && p.userId !== excludeUserId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getUserPosts = (userId: string): Post[] => {
  const posts = getPosts();
  return posts
    .filter(p => p.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getFilteredPosts = (userId: string, mutedUserIds: string[]): Post[] => {
  const posts = getPosts();
  return posts
    .filter(p => !mutedUserIds.includes(p.userId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

