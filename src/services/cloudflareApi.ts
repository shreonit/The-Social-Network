/**
 * Cloudflare API Helper
 * All API calls to Cloudflare Worker backend
 */

import { User, Post, Comment, Conversation, Message } from '../types';

// Normalize API base URL: HTTPS only, no trailing slash
const rawApiBase = import.meta.env.VITE_API_URL || 'https://your-worker.your-subdomain.workers.dev';
const API_BASE_URL = (rawApiBase || '').replace(/\/+$/, '');

const DEFAULT_TIMEOUT_MS = 5000;

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
  const userStr = localStorage.getItem('loggedInUser');
  if (!userStr) {
    return { 'Content-Type': 'application/json' };
  }
  try {
    const user = JSON.parse(userStr);
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user.id}`, // Using user ID as token for now
    };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
}

// Helper to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

// User APIs
export async function syncUser(user: User): Promise<User> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/users/sync`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      id: user.id,
      username: user.username,
      name: user.displayName,
      email: user.email,
      nickname: user.nickname,
      dob: user.dob,
      address: user.address,
      bio: user.bio,
      profilePicture: user.profilePicture || user.avatar,
    }),
  });
  return handleResponse<User>(response);
}

export async function getUser(userId: string): Promise<User & { followersCount: number; followingCount: number; postsCount: number }> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/users/${userId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function getUserByUsername(username: string): Promise<User & { followersCount: number; followingCount: number; postsCount: number }> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/users/by-username/${username}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function searchUsers(query: string): Promise<User[]> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/users/search?q=${encodeURIComponent(query)}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<User[]>(response);
}

export async function getFollowers(userId: string): Promise<User[]> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/users/${userId}/followers`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<User[]>(response);
}

export async function getFollowing(userId: string): Promise<User[]> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/users/${userId}/following`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<User[]>(response);
}

export async function getUserPosts(userId: string): Promise<Post[]> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/users/${userId}/posts`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Post[]>(response);
}

// Follow APIs
export async function followUser(followerId: string, followingId: string): Promise<{ success: boolean }> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/follow`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ followerId, followingId }),
  });
  return handleResponse(response);
}

export async function unfollowUser(followerId: string, followingId: string): Promise<{ success: boolean }> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/unfollow`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ followerId, followingId }),
  });
  return handleResponse(response);
}

// Post APIs
export async function createPost(data: {
  authorId: string;
  caption?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}): Promise<Post> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/posts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Post>(response);
}

export async function getFeed(userId?: string): Promise<Post[]> {
  const url = userId ? `${API_BASE_URL}/api/feed?userId=${userId}` : `${API_BASE_URL}/api/feed`;
  const response = await fetchWithTimeout(url, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Post[]>(response);
}

export async function likePost(postId: string, userId: string): Promise<{ success: boolean }> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/posts/${postId}/like`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ userId }),
  });
  return handleResponse(response);
}

export async function unlikePost(postId: string, userId: string): Promise<{ success: boolean }> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/posts/${postId}/unlike`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ userId }),
  });
  return handleResponse(response);
}

export async function getComments(postId: string): Promise<Comment[]> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/posts/${postId}/comments`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Comment[]>(response);
}

export async function createComment(postId: string, authorId: string, content: string): Promise<Comment> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ authorId, content }),
  });
  return handleResponse<Comment>(response);
}

// Conversation APIs
export async function createConversation(userAId: string, userBId: string): Promise<Conversation> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/conversations`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ userAId, userBId }),
  });
  return handleResponse<Conversation>(response);
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/conversations?userId=${userId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Conversation[]>(response);
}

// Message APIs
export async function getMessages(conversationId: string, limit: number = 50, before?: string): Promise<Message[]> {
  let url = `${API_BASE_URL}/api/conversations/${conversationId}/messages?limit=${limit}`;
  if (before) {
    url += `&before=${encodeURIComponent(before)}`;
  }
  const response = await fetchWithTimeout(url, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Message[]>(response);
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content?: string,
  mediaUrl?: string,
  mediaType?: 'image' | 'video'
): Promise<Message> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ senderId, content, mediaUrl, mediaType }),
  });
  return handleResponse<Message>(response);
}

