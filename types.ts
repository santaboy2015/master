
export interface User {
  id: string;
  email: string;
  displayName: string;
  plan: 'free' | 'basic' | 'pro';
  tokensUsed: number;
  maxTokens: number;
  isVerified: boolean;
  isAdmin?: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  tokens: number;
  features: string[];
  stripePriceId: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  image?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
}

export enum Category {
  TEXTING = 'Texting',
  PROFILE = 'Profile Review',
  FIRST_DATE = 'First Date',
  ADVICE = 'Relationship Advice',
  CONFIDENCE = 'Confidence Boost'
}

export interface QuickAction {
  label: string;
  prompt: string;
  icon: string;
  category: Category;
}

export type Tone = 'Varied' | 'Funny' | 'Flirty' | 'Calm' | 'Bold' | 'Romantic';

export type View = 'landing' | 'auth' | 'dashboard' | 'chat' | 'profile-gen' | 'admin' | 'billing';
