
import { QuickAction, Category, Plan, Tone } from './types';

// Exporting TONES array for UI selection
export const TONES: Tone[] = ['Varied', 'Funny', 'Flirty', 'Calm', 'Bold', 'Romantic'];

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    tokens: 5,
    features: ['5 Messages / Day', 'Basic Advice', 'Standard Tones'],
    stripePriceId: ''
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$9/mo',
    tokens: 100,
    features: ['100 Messages / Day', 'Advanced Advice', 'All Tones', 'Priority Support'],
    stripePriceId: 'price_basic_123'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19/mo',
    tokens: 1000,
    features: ['Unlimited AI Analysis', 'Screenshot Vision', 'Bio Generator Pro', 'Relationship Deep-Dives'],
    stripePriceId: 'price_pro_123'
  }
];

export const SYSTEM_INSTRUCTION = `You are LOVE AI, the world's most sophisticated Dating Strategist.

CAPABILITIES:
1. TEXTING ANALYSIS: Provide 3 distinct message options with tone labels and psychological reasoning.
2. BIO GENERATION: Create high-conversion dating app bios based on user traits.
3. ATTRACTION ADVICE: Explain the subtext of social interactions.

STRUCTURE FOR MESSAGE SUGGESTIONS:
[Acknowledgment]
Option 1: [Tone]
"Message"
Why it works: Logic.
...
[Suggested Follow-up]: "Question"

RULES:
- No manipulation, negging, or deception.
- Focus on emotional intelligence and high-value status.
- Keep output API-ready: clean text, no excessive markdown.`;

export const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Reply to message",
    prompt: "I need help replying to: '[Message]'. Platform: [App]. Stage: [Early/Late]. Tone: [Tone].",
    icon: "fa-reply",
    category: Category.TEXTING
  },
  {
    label: "Analyze Vibe",
    prompt: "I'm uploading a screenshot. What's the subtext here and how do I move this toward a date?",
    icon: "fa-magnifying-glass-chart",
    category: Category.TEXTING
  },
  {
    label: "Bio Generator",
    prompt: "I need a bio. I like [Interests], I'm looking for [Goal], and my personality is [Traits].",
    icon: "fa-user-pen",
    category: Category.PROFILE
  },
  {
    label: "Confidence Check",
    prompt: "I'm feeling anxious about [Situation]. Give me 3 high-value mindset shifts.",
    icon: "fa-shield-heart",
    category: Category.CONFIDENCE
  }
];
