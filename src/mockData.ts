import { User, Post } from './types';

// Mock users for demo
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'johndoe',
    email: 'john@example.com',
    password: 'password123',
    displayName: 'John Doe',
    avatar: 'https://i.pravatar.cc/150?img=1',
    bio: 'Software developer and tech enthusiast',
    location: 'San Francisco, CA',
    website: 'https://johndoe.dev',
    followers: ['2', '3'],
    following: ['2', '3'],
    createdAt: new Date().toISOString(),
    authMethod: 'email',
  },
  {
    id: '2',
    username: 'janedoe',
    email: 'jane@example.com',
    password: 'password123',
    displayName: 'Jane Doe',
    avatar: 'https://i.pravatar.cc/150?img=5',
    bio: 'Designer and creative thinker',
    location: 'New York, NY',
    website: 'https://janedoe.design',
    followers: ['1', '3'],
    following: ['1'],
    createdAt: new Date().toISOString(),
    authMethod: 'email',
  },
  {
    id: '3',
    username: 'alexsmith',
    email: 'alex@example.com',
    password: 'password123',
    displayName: 'Alex Smith',
    avatar: 'https://i.pravatar.cc/150?img=12',
    bio: 'Photographer and traveler',
    location: 'Los Angeles, CA',
    followers: ['1', '2'],
    following: ['1'],
    createdAt: new Date().toISOString(),
    authMethod: 'email',
  },
];

// Initialize mock data in localStorage if not present
export const initializeMockData = () => {
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(mockUsers));
  }
  if (!localStorage.getItem('posts')) {
    localStorage.setItem('posts', JSON.stringify([]));
  }
};

