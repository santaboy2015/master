
import { User } from "./types";

const USERS_KEY = 'love_ai_users_db';
const AUTH_STATE_KEY = 'love_ai_auth_state';

const getLocalUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

const saveLocalUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const authService = {
  async signUp(email: string, pass: string, name: string) {
    const users = getLocalUsers();
    
    if (users.find(u => u.email === email)) {
      throw new Error("Operative already exists in our database. Protocol identity collision.");
    }

    // First user is automatically made an Admin for testing purposes
    const isAdmin = users.length === 0;

    const userData: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      displayName: name,
      plan: 'free',
      tokensUsed: 0,
      maxTokens: 5,
      isVerified: false,
      isAdmin
    };

    users.push(userData);
    saveLocalUsers(users);
    
    // Immediately trigger a simulated verification email dispatch
    await this.resendVerification(email);
    
    localStorage.setItem(AUTH_STATE_KEY, userData.id);
    return userData;
  },

  async login(email: string, pass: string) {
    const users = getLocalUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      throw new Error("Tactical credentials not found in our encrypted substrate.");
    }

    localStorage.setItem(AUTH_STATE_KEY, user.id);
    return user;
  },

  async logout() {
    localStorage.removeItem(AUTH_STATE_KEY);
  },

  async resetPassword(email: string) {
    console.log(`[AUTH SYSTEM] Reset link dispatched to ${email}`);
    return true;
  },

  async resendVerification(email?: string) {
    console.log(`[TACTICAL DISPATCH] Verification link sent to: ${email || 'primary operative email'}`);
    // Simulate real-world delay for network call
    await new Promise(resolve => setTimeout(resolve, 800));
    return true;
  },

  async updateDisplayName(uid: string, newName: string) {
    const users = getLocalUsers();
    const index = users.findIndex(u => u.id === uid);
    if (index !== -1) {
      users[index].displayName = newName;
      saveLocalUsers(users);
    }
  },

  async incrementUsage(uid: string) {
    const users = getLocalUsers();
    const index = users.findIndex(u => u.id === uid);
    if (index !== -1) {
      users[index].tokensUsed += 1;
      saveLocalUsers(users);
    }
  },

  async syncUser(uid: string): Promise<User | null> {
    const users = getLocalUsers();
    const user = users.find(u => u.id === uid);
    return user || null;
  }
};
