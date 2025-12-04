/**
 * Cloudflare Worker API for SOCIATE
 * Handles all backend operations with D1 database
 */

interface Env {
  DB: D1Database;
}

// Global CORS headers for all responses
const CORS_HEADERS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  nickname?: string;
  dob?: string;
  address?: string;
  bio?: string;
  profile_picture?: string;
  created_at: number;
}

interface Post {
  id: string;
  author_id: string;
  caption?: string;
  media_url?: string;
  media_type?: string;
  created_at: number;
}

interface Conversation {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content?: string;
  media_url?: string;
  media_type?: string;
  created_at: number;
}

// Helper to parse request body
async function parseBody(request: Request): Promise<any> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

// Helper to send JSON response (non-streaming)
function jsonResponse(
  data: any,
  status: number = 200,
  extraHeaders: HeadersInit = {}
): Response {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    // Default: do not cache at edge unless explicitly overridden
    'Cache-Control': 'no-store',
    ...CORS_HEADERS,
    ...extraHeaders,
  };

  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
}

// Helper to send error response
function errorResponse(message: string, status: number = 400): Response {
  return jsonResponse({ error: message }, status);
}

// Helper to get user ID from Authorization header (Firebase token)
async function getUserId(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  // In production, verify Firebase token here
  // For now, we'll trust the client sends the correct user ID
  // You should verify the token with Firebase Admin SDK
  return authHeader.replace('Bearer ', '');
}

// Helper to verify user owns resource or is authorized
async function verifyUser(request: Request, userId: string): Promise<boolean> {
  const tokenUserId = await getUserId(request);
  return tokenUserId === userId;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Global OPTIONS handler for CORS preflight
    if (method === 'OPTIONS') {
      return new Response('', {
        status: 204,
        headers: {
          ...CORS_HEADERS,
          'Cache-Control': 'no-store',
        },
      });
    }

    try {
      // Route handlers
      if (path === '/api/users/sync' && method === 'POST') {
        return handleUserSync(request, env);
      }
      if (path.startsWith('/api/users/')) {
        if (path.match(/^\/api\/users\/[^/]+$/) && method === 'GET') {
          return handleGetUser(path, env);
        }
        if (path.startsWith('/api/users/by-username/') && method === 'GET') {
          return handleGetUserByUsername(path, env);
        }
        if (path.startsWith('/api/users/') && path.endsWith('/followers') && method === 'GET') {
          return handleGetFollowers(path, env);
        }
        if (path.startsWith('/api/users/') && path.endsWith('/following') && method === 'GET') {
          return handleGetFollowing(path, env);
        }
        if (path.startsWith('/api/users/') && path.endsWith('/posts') && method === 'GET') {
          return handleGetUserPosts(path, env);
        }
      }
      if (path === '/api/users/search' && method === 'GET') {
        return handleSearchUsers(url, env);
      }
      if (path === '/api/follow' && method === 'POST') {
        return handleFollow(request, env);
      }
      if (path === '/api/unfollow' && method === 'POST') {
        return handleUnfollow(request, env);
      }
      if (path === '/api/posts' && method === 'POST') {
        return handleCreatePost(request, env);
      }
      if (path === '/api/posts' && method === 'GET') {
        return handleGetFeed(url, env);
      }
      if (path.startsWith('/api/posts/')) {
        if (path.endsWith('/like') && method === 'POST') {
          return handleLikePost(path, request, env);
        }
        if (path.endsWith('/unlike') && method === 'POST') {
          return handleUnlikePost(path, request, env);
        }
        if (path.endsWith('/comments') && method === 'GET') {
          return handleGetComments(path, env);
        }
        if (path.endsWith('/comments') && method === 'POST') {
          return handleCreateComment(path, request, env);
        }
      }
      if (path === '/api/conversations' && method === 'POST') {
        return handleCreateConversation(request, env);
      }
      if (path === '/api/conversations' && method === 'GET') {
        return handleGetConversations(url, env);
      }
      if (path.startsWith('/api/conversations/') && path.endsWith('/messages')) {
        if (method === 'GET') {
          return handleGetMessages(path, url, env);
        }
        if (method === 'POST') {
          return handleSendMessage(path, request, env);
        }
      }

      return jsonResponse({ error: 'Not found' }, 404);
    } catch (error: any) {
      console.error('Error:', error);
      return jsonResponse({ error: error.message || 'Internal server error' }, 500);
    }
  },
};

// POST /api/users/sync
async function handleUserSync(request: Request, env: Env): Promise<Response> {
  const body = await parseBody(request);
  const { id, username, name, email, nickname, dob, address, bio, profilePicture } = body;

  if (!id || !username || !name || !email) {
    return errorResponse('Missing required fields', 400);
  }

  const now = Date.now();

  // Check if user exists
  const existing = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();

  if (existing) {
    // Update user
    await env.DB.prepare(
      `UPDATE users SET username = ?, name = ?, email = ?, nickname = ?, dob = ?, address = ?, bio = ?, profile_picture = ? WHERE id = ?`
    ).bind(username, name, email, nickname || null, dob || null, address || null, bio || null, profilePicture || null, id).run();
  } else {
    // Create user
    await env.DB.prepare(
      `INSERT INTO users (id, username, name, email, nickname, dob, address, bio, profile_picture, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, username, name, email, nickname || null, dob || null, address || null, bio || null, profilePicture || null, now).run();
  }

  // Get updated user
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>();

  return jsonResponse(user, 200);
}

// GET /api/users/:id
async function handleGetUser(path: string, env: Env): Promise<Response> {
  const userId = path.split('/')[3];
  if (!userId) {
    return errorResponse('User ID required', 400);
  }

  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<User>();
  if (!user) {
    return errorResponse('User not found', 404);
  }

  // Get follower/following counts
  const followers = await env.DB.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').bind(userId).first<{ count: number }>();
  const following = await env.DB.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').bind(userId).first<{ count: number }>();

  // Get posts count
  const posts = await env.DB.prepare('SELECT COUNT(*) as count FROM posts WHERE author_id = ?').bind(userId).first<{ count: number }>();

  // Short edge cache for profile lookups to reduce DB hits
  return jsonResponse(
    {
      ...user,
      followersCount: followers?.count || 0,
      followingCount: following?.count || 0,
      postsCount: posts?.count || 0,
    },
    200,
    { 'Cache-Control': 'max-age=5' }
  );
}

// GET /api/users/by-username/:username
async function handleGetUserByUsername(path: string, env: Env): Promise<Response> {
  const username = path.split('/')[3];
  if (!username) {
    return errorResponse('Username required', 400);
  }

  const user = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first<User>();
  if (!user) {
    return errorResponse('User not found', 404);
  }

  // Get counts
  const followers = await env.DB.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').bind(user.id).first<{ count: number }>();
  const following = await env.DB.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').bind(user.id).first<{ count: number }>();
  const posts = await env.DB.prepare('SELECT COUNT(*) as count FROM posts WHERE author_id = ?').bind(user.id).first<{ count: number }>();

  return jsonResponse({
    ...user,
    followersCount: followers?.count || 0,
    followingCount: following?.count || 0,
    postsCount: posts?.count || 0,
  });
}

// GET /api/users/search?q=...
async function handleSearchUsers(url: URL, env: Env): Promise<Response> {
  const query = url.searchParams.get('q');
  if (!query) {
    return errorResponse('Query parameter required', 400);
  }

  const searchTerm = `%${query}%`;
  const users = await env.DB.prepare(
    `SELECT * FROM users WHERE username LIKE ? OR name LIKE ? OR nickname LIKE ? LIMIT 20`
  ).bind(searchTerm, searchTerm, searchTerm).all<User>();

  return jsonResponse(users.results || []);
}

// GET /api/users/:id/followers
async function handleGetFollowers(path: string, env: Env): Promise<Response> {
  const userId = path.split('/')[3];
  const followers = await env.DB.prepare(
    `SELECT u.* FROM users u INNER JOIN follows f ON u.id = f.follower_id WHERE f.following_id = ?`
  ).bind(userId).all<User>();

  return jsonResponse(followers.results || []);
}

// GET /api/users/:id/following
async function handleGetFollowing(path: string, env: Env): Promise<Response> {
  const userId = path.split('/')[3];
  const following = await env.DB.prepare(
    `SELECT u.* FROM users u INNER JOIN follows f ON u.id = f.following_id WHERE f.follower_id = ?`
  ).bind(userId).all<User>();

  return jsonResponse(following.results || []);
}

// GET /api/users/:id/posts
async function handleGetUserPosts(path: string, env: Env): Promise<Response> {
  const userId = path.split('/')[3];
  const posts = await env.DB.prepare(
    `SELECT * FROM posts WHERE author_id = ? ORDER BY created_at DESC`
  ).bind(userId).all<Post>();

  // Get likes and comments for each post
  const postsWithDetails = await Promise.all(
    (posts.results || []).map(async (post) => {
      const likes = await env.DB.prepare('SELECT user_id FROM likes WHERE post_id = ?').bind(post.id).all<{ user_id: string }>();
      const comments = await env.DB.prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC').bind(post.id).all();
      const author = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(post.author_id).first<User>();

      return {
        id: post.id,
        userId: post.author_id,
        username: author?.username || '',
        userAvatar: author?.profile_picture || '',
        caption: post.caption || '',
        mediaUrl: post.media_url || undefined,
        mediaType: post.media_type as 'image' | 'video' | undefined,
        likes: (likes.results || []).map(l => l.user_id),
        comments: (comments.results || []).map((c: any) => ({
          id: c.id,
          userId: c.author_id,
          username: '', // Will be populated if needed
          text: c.content,
          createdAt: new Date(c.created_at).toISOString(),
        })),
        createdAt: new Date(post.created_at).toISOString(),
        visibility: 'public' as const,
        savedBy: [],
      };
    })
  );

  return jsonResponse(postsWithDetails);
}

// POST /api/follow
async function handleFollow(request: Request, env: Env): Promise<Response> {
  const body = await parseBody(request);
  const { followerId, followingId } = body;

  if (!followerId || !followingId || followerId === followingId) {
    return errorResponse('Invalid follow request', 400);
  }

  const now = Date.now();

  // Check if already following
  const existing = await env.DB.prepare('SELECT * FROM follows WHERE follower_id = ? AND following_id = ?')
    .bind(followerId, followingId).first();

  if (existing) {
    return jsonResponse({ success: true, message: 'Already following' });
  }

  await env.DB.prepare('INSERT INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)')
    .bind(followerId, followingId, now).run();

  return jsonResponse({ success: true });
}

// POST /api/unfollow
async function handleUnfollow(request: Request, env: Env): Promise<Response> {
  const body = await parseBody(request);
  const { followerId, followingId } = body;

  if (!followerId || !followingId) {
    return errorResponse('Invalid unfollow request', 400);
  }

  await env.DB.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?')
    .bind(followerId, followingId).run();

  return jsonResponse({ success: true });
}

// POST /api/posts
async function handleCreatePost(request: Request, env: Env): Promise<Response> {
  const body = await parseBody(request);
  const { authorId, caption, mediaUrl, mediaType } = body;

  if (!authorId) {
    return errorResponse('Author ID required', 400);
  }

  const id = crypto.randomUUID();
  const now = Date.now();

  await env.DB.prepare(
    `INSERT INTO posts (id, author_id, caption, media_url, media_type, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(id, authorId, caption || null, mediaUrl || null, mediaType || null, now).run();

  const post = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first<Post>();
  const author = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(authorId).first<User>();

  return jsonResponse({
    id: post!.id,
    userId: post!.author_id,
    username: author?.username || '',
    userAvatar: author?.profile_picture || '',
    caption: post!.caption || '',
    mediaUrl: post!.media_url || undefined,
    mediaType: post!.media_type as 'image' | 'video' | undefined,
    likes: [],
    comments: [],
    createdAt: new Date(post!.created_at).toISOString(),
    visibility: 'public' as const,
    savedBy: [],
  });
}

// GET /api/feed?userId=...
async function handleGetFeed(url: URL, env: Env): Promise<Response> {
  const userId = url.searchParams.get('userId');

  if (!userId) {
    // Get all public posts
    const posts = await env.DB.prepare('SELECT * FROM posts ORDER BY created_at DESC LIMIT 50').all<Post>();
    return jsonResponse(await enrichPosts(posts.results || [], env), 200, {
      'Cache-Control': 'max-age=5',
    });
  }

  // Get posts from user and people they follow
  const following = await env.DB.prepare('SELECT following_id FROM follows WHERE follower_id = ?').bind(userId).all<{ following_id: string }>();
  const followingIds = (following.results || []).map(f => f.following_id);
  followingIds.push(userId); // Include own posts

  if (followingIds.length === 0) {
    return jsonResponse([]);
  }

  const placeholders = followingIds.map(() => '?').join(',');
  const posts = await env.DB.prepare(
    `SELECT * FROM posts WHERE author_id IN (${placeholders}) ORDER BY created_at DESC LIMIT 50`
  ).bind(...followingIds).all<Post>();

  return jsonResponse(await enrichPosts(posts.results || [], env), 200, {
    'Cache-Control': 'max-age=5',
  });
}

async function enrichPosts(posts: Post[], env: Env): Promise<any[]> {
  return Promise.all(
    posts.map(async (post) => {
      const likes = await env.DB.prepare('SELECT user_id FROM likes WHERE post_id = ?').bind(post.id).all<{ user_id: string }>();
      const comments = await env.DB.prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC').bind(post.id).all();
      const author = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(post.author_id).first<User>();

      // Get comment authors
      const enrichedComments = await Promise.all(
        (comments.results || []).map(async (c: any) => {
          const commentAuthor = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(c.author_id).first<User>();
          return {
            id: c.id,
            userId: c.author_id,
            username: commentAuthor?.username || '',
            text: c.content,
            createdAt: new Date(c.created_at).toISOString(),
          };
        })
      );

      return {
        id: post.id,
        userId: post.author_id,
        username: author?.username || '',
        userAvatar: author?.profile_picture || '',
        caption: post.caption || '',
        mediaUrl: post.media_url || undefined,
        mediaType: post.media_type as 'image' | 'video' | undefined,
        likes: (likes.results || []).map(l => l.user_id),
        comments: enrichedComments,
        createdAt: new Date(post.created_at).toISOString(),
        visibility: 'public' as const,
        savedBy: [],
      };
    })
  );
}

// POST /api/posts/:id/like
async function handleLikePost(path: string, request: Request, env: Env): Promise<Response> {
  const postId = path.split('/')[3];
  const body = await parseBody(request);
  const { userId } = body;

  if (!userId) {
    return errorResponse('User ID required', 400);
  }

  const now = Date.now();

  // Check if already liked
  const existing = await env.DB.prepare('SELECT * FROM likes WHERE user_id = ? AND post_id = ?').bind(userId, postId).first();
  if (existing) {
    return jsonResponse({ success: true });
  }

  await env.DB.prepare('INSERT INTO likes (user_id, post_id, created_at) VALUES (?, ?, ?)').bind(userId, postId, now).run();

  return jsonResponse({ success: true });
}

// POST /api/posts/:id/unlike
async function handleUnlikePost(path: string, request: Request, env: Env): Promise<Response> {
  const postId = path.split('/')[3];
  const body = await parseBody(request);
  const { userId } = body;

  if (!userId) {
    return errorResponse('User ID required', 400);
  }

  await env.DB.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').bind(userId, postId).run();

  return jsonResponse({ success: true });
}

// GET /api/posts/:id/comments
async function handleGetComments(path: string, env: Env): Promise<Response> {
  const postId = path.split('/')[3];
  const comments = await env.DB.prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC').bind(postId).all();

  const enrichedComments = await Promise.all(
    (comments.results || []).map(async (c: any) => {
      const author = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(c.author_id).first<User>();
      return {
        id: c.id,
        userId: c.author_id,
        username: author?.username || '',
        text: c.content,
        createdAt: new Date(c.created_at).toISOString(),
      };
    })
  );

  // Short edge cache for comments to reduce DB hits
  return jsonResponse(enrichedComments, 200, { 'Cache-Control': 'max-age=5' });
}

// POST /api/posts/:id/comments
async function handleCreateComment(path: string, request: Request, env: Env): Promise<Response> {
  const postId = path.split('/')[3];
  const body = await parseBody(request);
  const { authorId, content } = body;

  if (!authorId || !content) {
    return errorResponse('Author ID and content required', 400);
  }

  const id = crypto.randomUUID();
  const now = Date.now();

  await env.DB.prepare('INSERT INTO comments (id, post_id, author_id, content, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(id, postId, authorId, content, now).run();

  const comment = await env.DB.prepare('SELECT * FROM comments WHERE id = ?').bind(id).first();
  const author = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(authorId).first<User>();

  return jsonResponse({
    id: comment!.id,
    userId: comment!.author_id,
    username: author?.username || '',
    text: comment!.content,
    createdAt: new Date(comment!.created_at).toISOString(),
  });
}

// POST /api/conversations
async function handleCreateConversation(request: Request, env: Env): Promise<Response> {
  const body = await parseBody(request);
  const { userAId, userBId } = body;

  if (!userAId || !userBId || userAId === userBId) {
    return errorResponse('Invalid conversation request', 400);
  }

  // Ensure consistent ordering (smaller ID first)
  const [user1, user2] = [userAId, userBId].sort();

  // Check if conversation exists
  const existing = await env.DB.prepare(
    'SELECT * FROM conversations WHERE user_a_id = ? AND user_b_id = ?'
  ).bind(user1, user2).first<Conversation>();

  if (existing) {
    return jsonResponse(existing);
  }

  // Create new conversation
  const id = crypto.randomUUID();
  const now = Date.now();

  await env.DB.prepare(
    'INSERT INTO conversations (id, user_a_id, user_b_id, created_at) VALUES (?, ?, ?, ?)'
  ).bind(id, user1, user2, now).run();

  const conversation = await env.DB.prepare('SELECT * FROM conversations WHERE id = ?').bind(id).first<Conversation>();

  return jsonResponse(conversation);
}

// GET /api/conversations?userId=...
async function handleGetConversations(url: URL, env: Env): Promise<Response> {
  const userId = url.searchParams.get('userId');
  if (!userId) {
    return errorResponse('User ID required', 400);
  }

  // Get all conversations where user is either user_a or user_b
  const conversations = await env.DB.prepare(
    'SELECT * FROM conversations WHERE user_a_id = ? OR user_b_id = ? ORDER BY created_at DESC'
  ).bind(userId, userId).all<Conversation>();

  // Enrich with other user info and last message
  const enriched = await Promise.all(
    (conversations.results || []).map(async (conv) => {
      const otherUserId = conv.user_a_id === userId ? conv.user_b_id : conv.user_a_id;
      const otherUser = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(otherUserId).first<User>();

      // Get last message
      const lastMessage = await env.DB.prepare(
        'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1'
      ).bind(conv.id).first<Message>();

      return {
        id: conv.id,
        userAId: conv.user_a_id,
        userBId: conv.user_b_id,
        createdAt: new Date(conv.created_at).toISOString(),
        otherUser: otherUser ? {
          id: otherUser.id,
          username: otherUser.username,
          name: otherUser.name,
          profilePicture: otherUser.profile_picture,
        } : null,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          createdAt: new Date(lastMessage.created_at).toISOString(),
        } : null,
      };
    })
  );

  return jsonResponse(enriched);
}

// GET /api/conversations/:id/messages?limit=50&before=...
async function handleGetMessages(path: string, url: URL, env: Env): Promise<Response> {
  const conversationId = path.split('/')[3];
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const before = url.searchParams.get('before');

  let query = env.DB.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?');
  if (before) {
    const beforeTime = new Date(before).getTime();
    query = env.DB.prepare('SELECT * FROM messages WHERE conversation_id = ? AND created_at < ? ORDER BY created_at DESC LIMIT ?').bind(conversationId, beforeTime, limit);
  } else {
    query = query.bind(conversationId, limit);
  }

  const messages = await query.all<Message>();

  // Enrich with sender info
  const enriched = await Promise.all(
    (messages.results || []).map(async (msg) => {
      const sender = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(msg.sender_id).first<User>();
      return {
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        content: msg.content || undefined,
        mediaUrl: msg.media_url || undefined,
        mediaType: msg.media_type as 'image' | 'video' | undefined,
        createdAt: new Date(msg.created_at).toISOString(),
        sender: sender ? {
          id: sender.id,
          username: sender.username,
          name: sender.name,
          profilePicture: sender.profile_picture,
        } : null,
      };
    })
  );

  // Reverse to show oldest first
  return jsonResponse(enriched.reverse());
}

// POST /api/conversations/:id/messages
async function handleSendMessage(path: string, request: Request, env: Env): Promise<Response> {
  const conversationId = path.split('/')[3];
  const body = await parseBody(request);
  const { senderId, content, mediaUrl, mediaType } = body;

  if (!senderId || (!content && !mediaUrl)) {
    return errorResponse('Sender ID and content or media required', 400);
  }

  const id = crypto.randomUUID();
  const now = Date.now();

  await env.DB.prepare(
    'INSERT INTO messages (id, conversation_id, sender_id, content, media_url, media_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, conversationId, senderId, content || null, mediaUrl || null, mediaType || null, now).run();

  const message = await env.DB.prepare('SELECT * FROM messages WHERE id = ?').bind(id).first<Message>();
  const sender = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(senderId).first<User>();

  return jsonResponse({
    id: message!.id,
    conversationId: message!.conversation_id,
    senderId: message!.sender_id,
    content: message!.content || undefined,
    mediaUrl: message!.media_url || undefined,
    mediaType: message!.media_type as 'image' | 'video' | undefined,
    createdAt: new Date(message!.created_at).toISOString(),
    sender: sender ? {
      id: sender.id,
      username: sender.username,
      name: sender.name,
      profilePicture: sender.profile_picture,
    } : null,
  });
}

