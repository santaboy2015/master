
import { User, PromptTemplate } from "./types";
import { SYSTEM_INSTRUCTION } from "./constants";

const USERS_KEY = 'love_ai_users_db';
const SETTINGS_KEY = 'love_ai_system_settings';
const PROMPTS_KEY = 'love_ai_prompts_db';

const getLocalUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

const saveLocalUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const adminService = {
  async getAllUsers(): Promise<User[]> {
    return getLocalUsers();
  },

  async updateUserPlan(uid: string, plan: 'free' | 'basic' | 'pro') {
    const users = getLocalUsers();
    const index = users.findIndex(u => u.id === uid);
    if (index !== -1) {
      users[index].plan = plan;
      users[index].maxTokens = plan === 'pro' ? 1000 : plan === 'basic' ? 100 : 5;
      saveLocalUsers(users);
    }
  },

  async toggleAdmin(uid: string, isAdmin: boolean) {
    const users = getLocalUsers();
    const index = users.findIndex(u => u.id === uid);
    if (index !== -1) {
      users[index].isAdmin = isAdmin;
      saveLocalUsers(users);
    }
  },

  async getSystemSettings() {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) return JSON.parse(data);
    
    // Default settings if none exist
    return {
      systemInstruction: SYSTEM_INSTRUCTION,
      landingTitle: "Master the Art of Attraction.",
      landingSub: "Deploy advanced AI to analyze signals, optimize your profile substrate, and execute high-value dating strategies with surgical precision."
    };
  },

  async updateSystemSettings(settings: any) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  async getPromptTemplates(): Promise<PromptTemplate[]> {
    const data = localStorage.getItem(PROMPTS_KEY);
    if (data) return JSON.parse(data);
    
    // Default templates
    const defaults: PromptTemplate[] = [
      {
        id: 'default-system',
        name: 'Core System Instruction',
        description: 'The foundational behavioral rules for LOVE AI.',
        content: SYSTEM_INSTRUCTION
      },
      {
        id: 'bio-optimizer',
        name: 'Bio Optimization Protocol',
        description: 'Used specifically for generating high-conversion dating profiles.',
        content: "You are an expert profile strategist. Take the user's traits and turn them into a high-conversion dating bio."
      }
    ];
    localStorage.setItem(PROMPTS_KEY, JSON.stringify(defaults));
    return defaults;
  },

  async savePromptTemplates(templates: PromptTemplate[]) {
    localStorage.setItem(PROMPTS_KEY, JSON.stringify(templates));
  },

  async getSubscriptionStats() {
    const users = getLocalUsers();
    const stats = {
      free: 0,
      basic: 0,
      pro: 0,
      total: users.length
    };
    users.forEach(u => {
      if (u.plan in stats) {
        stats[u.plan as keyof typeof stats]++;
      }
    });
    return stats;
  }
};
