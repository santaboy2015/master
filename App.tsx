import React, { useState, useRef, useEffect } from 'react';
import { User, View, Message, Tone, QuickAction, PromptTemplate, Category, Plan } from './types';
import { PLANS, QUICK_ACTIONS, SYSTEM_INSTRUCTION, TONES } from './constants';
import { loveAI } from './geminiService';
import { authService } from './authService';
import { adminService } from './adminService';
import { stripeService } from './stripeService';
import SignupForm from './SignupForm';

/**
 * PUBLIC LANDING HEADER
 */
const LandingHeader: React.FC<{ user: User | null, setView: (v: View) => void, isScrolled: boolean }> = ({ user, setView, isScrolled }) => (
  <header className={`fixed top-0 left-0 right-0 z-[110] px-6 md:px-12 py-6 transition-all duration-500 flex items-center justify-between border-b ${isScrolled ? 'glass border-gray-100 shadow-lg py-4' : 'bg-transparent border-transparent'}`}>
    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => { setView('landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white shadow-lg transition-transform group-hover:rotate-12">
        <i className="fa-solid fa-heart text-sm"></i>
      </div>
      <h1 className="text-xl font-black italic tracking-tighter gradient-text font-display">LOVE AI</h1>
    </div>
    <nav className="hidden lg:flex items-center gap-12">
      {['Protocol', 'Intelligence', 'Elite Tiers', 'Resources'].map((item) => (
        <a key={item} href="#" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-pink-600 transition-colors relative group">
          {item}
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pink-500 transition-all group-hover:w-full"></span>
        </a>
      ))}
    </nav>
    <button 
      onClick={() => setView(user ? 'dashboard' : 'auth')}
      className="px-8 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-pink-600 hover:scale-105 active:scale-95 transition-all"
    >
      {user ? 'Operational Base' : 'Authorize Access'}
    </button>
  </header>
);

/**
 * PUBLIC LANDING FOOTER
 */
const LandingFooter: React.FC = () => (
  <footer className="bg-gray-50 border-t border-gray-100 px-6 md:px-12 py-32 relative overflow-hidden">
    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-pink-100/20 rounded-full blur-[120px]"></div>
    <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-100/20 rounded-full blur-[120px]"></div>
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-24 relative z-10">
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white"><i className="fa-solid fa-heart text-sm"></i></div>
          <h4 className="text-2xl font-black italic font-display">LOVE AI</h4>
        </div>
        <p className="text-sm font-bold text-gray-400">The science of modern attraction. Engineered for operatives.</p>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900 mb-8">Intelligence</p>
        <ul className="space-y-4">
          <li><a href="#" className="text-sm font-bold text-gray-500 hover:text-pink-600">Signal Analyzer</a></li>
          <li><a href="#" className="text-sm font-bold text-gray-500 hover:text-pink-600">Bio Constructor</a></li>
        </ul>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900 mb-8">Resources</p>
        <ul className="space-y-4">
          <li><a href="#" className="text-sm font-bold text-gray-500 hover:text-pink-600">Manual</a></li>
          <li><a href="#" className="text-sm font-bold text-gray-500 hover:text-pink-600">FAQ</a></li>
        </ul>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900 mb-8">Legal</p>
        <ul className="space-y-4">
          <li><a href="#" className="text-sm font-bold text-gray-500 hover:text-pink-600">Privacy</a></li>
          <li><a href="#" className="text-sm font-bold text-gray-500 hover:text-pink-600">Terms</a></li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto pt-12 border-t border-gray-200 flex items-center justify-between relative z-10">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">© 2024 LOVE AI Systems. All Rights Reserved.</p>
      <div className="flex items-center gap-4">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Systems Operational</p>
      </div>
    </div>
  </footer>
);

const App: React.FC = () => {
  const [view, setView] = useState<View>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isNoticeDismissed, setIsNoticeDismissed] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newNameInput, setNewNameInput] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  // Admin / Stats
  const [adminTab, setAdminTab] = useState<'users' | 'prompts' | 'stats' | 'cms'>('users');
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminPrompts, setAdminPrompts] = useState<PromptTemplate[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  const [adminSettings, setAdminSettings] = useState<any>({
    systemInstruction: SYSTEM_INSTRUCTION,
    landingTitle: "Master the Art of Attraction.",
    landingSub: "Deploy advanced AI to analyze signals, optimize your profile substrate, and execute high-value dating strategies."
  });
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  // UI States
  const [showUsageModal, setShowUsageModal] = useState<{show: boolean, title: string, message: string}>({show: false, title: '', message: ''});
  const [isSuccessMessageVisible, setIsSuccessMessageVisible] = useState(false);
  const [confirmUpgradePlan, setConfirmUpgradePlan] = useState<Plan | null>(null);

  // Chat/Input
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedTone, setSelectedTone] = useState<Tone>('Varied');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{data: string, mimeType: string} | null>(null);
  const [bioTraits, setBioTraits] = useState({ interests: '', goal: '', personality: '' });
  const [generatedBio, setGeneratedBio] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const loadConfig = async () => {
      const s = await adminService.getSystemSettings();
      if (s) setAdminSettings(prev => ({ ...prev, ...s }));
      const p = await adminService.getPromptTemplates();
      setAdminPrompts(p);
    };
    loadConfig();
  }, []);

  const handleMainScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setIsScrolled(scrollTop > 50);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setIsSuccessMessageVisible(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (user) {
      interval = setInterval(async () => {
        const synced = await authService.syncUser(user.id);
        if (synced) {
          setUser(prev => {
            if (prev?.isVerified !== synced.isVerified) {
              setIsNoticeDismissed(false);
            }
            return synced;
          });
        }
      }, 5000); 
    }
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (view === 'admin' && user?.isAdmin) {
      loadAdminData();
    }
  }, [view, adminTab]);

  const loadAdminData = async () => {
    setIsAdminLoading(true);
    try {
      if (adminTab === 'users' || adminTab === 'stats') {
        const users = await adminService.getAllUsers();
        setAdminUsers(users);
        if (adminTab === 'stats') {
          const stats = await adminService.getSubscriptionStats();
          setAdminStats(stats);
        }
      } else if (adminTab === 'prompts') {
        const prompts = await adminService.getPromptTemplates();
        setAdminPrompts(prompts);
      }
    } catch (e) {
      console.error("Admin load error", e);
    } finally {
      setIsAdminLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      if (authMode === 'login') {
        const emailInput = (e.target as any).email.value;
        const passInput = (e.target as any).password?.value;
        const u = await authService.login(emailInput, passInput);
        setUser(u);
        setView('dashboard');
      } else {
        const emailInput = (e.target as any).email.value;
        await authService.resetPassword(emailInput);
        alert("Reset link dispatched to your secure address.");
        setAuthMode('login');
      }
    } catch (err: any) {
      setAuthError(err.message || "Credential authentication failed.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignup = async (email: string, pass: string, name: string) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const u = await authService.signUp(email, pass, name);
      setUser(u);
      setView('dashboard');
    } catch (err: any) {
      setAuthError(err.message || "Tactical enrollment failed.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setView('landing');
  };

  const handleResendVerification = async () => {
    try {
      await authService.resendVerification(user?.email);
      alert("Protocol alert: Verification link re-dispatched to your registered email.");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleChangePlan = async (uid: string, plan: 'free' | 'basic' | 'pro') => {
    try {
      await adminService.updateUserPlan(uid, plan);
      loadAdminData();
    } catch (e) {
      alert("Plan update failed.");
    }
  };

  const handleToggleAdmin = async (uid: string, isAdmin: boolean) => {
    try {
      await adminService.toggleAdmin(uid, !isAdmin);
      loadAdminData();
    } catch (e) {
      alert("Admin toggle failed.");
    }
  };

  const handleDeletePrompt = async (pid: string) => {
    if (!window.confirm("Confirm deletion of this protocol?")) return;
    try {
      const updated = adminPrompts.filter(p => p.id !== pid);
      setAdminPrompts(updated);
      await adminService.savePromptTemplates(updated);
    } catch (e) {
      alert("Deletion failed.");
    }
  };

  const handleSaveSettings = async () => {
    try {
      await adminService.updateSystemSettings(adminSettings);
      alert("CMS synchronized.");
    } catch (e) {
      alert("Save failed.");
    }
  };

  const handleSavePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrompt) return;
    
    try {
      let updatedPrompts = [...adminPrompts];
      if (editingPrompt.id === 'new') {
        const newPrompt = { 
          ...editingPrompt, 
          id: Math.random().toString(36).substr(2, 9) 
        };
        updatedPrompts.push(newPrompt);
      } else {
        updatedPrompts = updatedPrompts.map(p => p.id === editingPrompt.id ? editingPrompt : p);
      }
      
      setAdminPrompts(updatedPrompts);
      await adminService.savePromptTemplates(updatedPrompts);
      setEditingPrompt(null);
    } catch (e) {
      alert("Save failed.");
    }
  };

  const handleUpdateName = async () => {
    if (!user || !newNameInput.trim()) {
      setIsEditingName(false);
      return;
    }
    setIsUpdatingName(true);
    try {
      await authService.updateDisplayName(user.id, newNameInput.trim());
      setUser({ ...user, displayName: newNameInput.trim() });
      setIsEditingName(false);
    } catch (err: any) {
      alert("Update failed.");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage({
          data: (reader.result as string).split(',')[1],
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (textOverride?: string) => {
    if (!user) return;
    if (!user.isVerified) {
      setShowUsageModal({ show: true, title: "Tactical Block", message: "Verification required to deploy AI modules. Check your inbox." });
      return;
    }
    if (user.tokensUsed >= user.maxTokens) {
      setShowUsageModal({ show: true, title: "Reserve Depleted", message: "Daily unit allocation reached. Upgrade to expand capacity." });
      return;
    }

    const textToSend = textOverride || input.trim();
    if (!textToSend && !attachedImage) return;

    const coreTemplate = adminPrompts.find(p => p.id === 'default-system');
    if (coreTemplate) {
      await loveAI.setSystemInstruction(coreTemplate.content);
    }

    const finalPrompt = `[MODE: CONVERSATION] [TONE: ${selectedTone}] ${textToSend}`;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend || "Scanning tactical context...",
      timestamp: new Date(),
      ...(attachedImage && { image: `data:${attachedImage.mimeType};base64,${attachedImage.data}` })
    };

    setMessages(prev => [...prev, userMessage]);
    const currentImage = attachedImage;
    setInput('');
    setAttachedImage(null);
    setIsLoadingAI(true);

    const botMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: botMsgId, role: 'model', text: '', timestamp: new Date() }]);

    let acc = '';
    try {
      await loveAI.sendMessageStream(finalPrompt, (chunk) => {
        acc += chunk;
        setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, text: acc } : m));
      }, currentImage ? [currentImage] : []);
      
      await authService.incrementUsage(user.id);
      const updatedUser = await authService.syncUser(user.id);
      if (updatedUser) setUser(updatedUser);
    } catch (e) {
      setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, text: "Satellite link interrupted. Tactical re-sync required." } : m));
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleGenerateBio = async () => {
    if (!user) return;
    if (!user.isVerified) {
      setShowUsageModal({ show: true, title: "Module Locked", message: "Verification required for profile optimization." });
      return;
    }
    if (user.plan === 'free') {
      setShowUsageModal({ show: true, title: "Protocol Restricted", message: "The Bio Constructor is an elite-tier protocol. Upgrade required." });
      return;
    }

    setIsLoadingAI(true);
    setGeneratedBio('');
    
    const bioTemplate = adminPrompts.find(p => p.id === 'bio-optimizer');
    const instruction = bioTemplate ? bioTemplate.content : "Expert profile strategist.";
    const prompt = `[MODE: BIO] Interests: ${bioTraits.interests}, Personality: ${bioTraits.personality}, Goal: ${bioTraits.goal}. Generate 3 elite bios.`;
    
    try {
      let acc = '';
      await loveAI.generateWithCustomPrompt(prompt, instruction, (chunk) => {
        acc += chunk;
        setGeneratedBio(acc);
      });
      await authService.incrementUsage(user.id);
      const updatedUser = await authService.syncUser(user.id);
      if (updatedUser) setUser(updatedUser);
    } catch (e) {
      setGeneratedBio("Module failure. Try again.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const Sidebar = () => (
    <aside className={`w-80 h-full border-r flex flex-col shrink-0 z-[100] hidden lg:flex transition-colors duration-500 ${isDarkMode && view === 'chat' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
      <div className="p-10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white shadow-lg">
          <i className="fa-solid fa-heart text-lg"></i>
        </div>
        <h1 className={`text-2xl font-black italic tracking-tighter gradient-text ${isDarkMode && view === 'chat' ? 'brightness-110' : ''}`}>LOVE AI</h1>
      </div>
      <nav className="flex-1 px-6 space-y-4 mt-8">
        {[
          { id: 'dashboard', label: 'Command Center', icon: 'fa-house-signal' },
          { id: 'chat', label: 'Signal Analyzer', icon: 'fa-bolt-lightning' },
          { id: 'profile-gen', label: 'Bio Constructor', icon: 'fa-user-pen' },
          { id: 'billing', label: 'Tactical Upgrades', icon: 'fa-gem' },
          ...(user?.isAdmin ? [{ id: 'admin', label: 'Admin Matrix', icon: 'fa-user-shield' }] : [])
        ].map(item => (
          <button 
            key={item.id} 
            onClick={() => setView(item.id as View)} 
            className={`w-full p-5 rounded-3xl flex items-center gap-5 transition-all group ${view === item.id ? (isDarkMode && view === 'chat' ? 'bg-pink-600 text-white shadow-xl' : 'bg-gray-900 text-white shadow-xl') : (isDarkMode && view === 'chat' ? 'hover:bg-white/5 text-gray-500 hover:text-white' : 'hover:bg-gray-50 text-gray-400 hover:text-gray-900')}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${view === item.id ? 'bg-white/10' : (isDarkMode && view === 'chat' ? 'bg-white/5' : 'bg-gray-50')}`}>
              <i className={`fa-solid ${item.icon}`}></i>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-6">
        <div className={`${isDarkMode && view === 'chat' ? 'bg-white/5 border border-white/5' : 'bg-gray-50'} rounded-[3rem] p-8 space-y-6 transition-colors`}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center font-black text-pink-600 border-2 border-white">
                {user?.displayName?.[0] || 'O'}
              </div>
              {!user?.isVerified && <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center"><i className="fa-solid fa-exclamation text-[6px] text-white"></i></div>}
            </div>
            <div className="flex-1 min-w-0">
               <p className={`font-black text-sm italic truncate ${isDarkMode && view === 'chat' ? 'text-white' : 'text-gray-900'}`}>{user?.displayName}</p>
               <div className="flex items-center gap-2">
                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{user?.plan}</p>
                 {!user?.isVerified && <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">• Unverified</span>}
               </div>
            </div>
          </div>
          <button onClick={handleLogout} className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${isDarkMode && view === 'chat' ? 'bg-white/10 text-white/40 hover:text-rose-400 border border-white/5' : 'bg-white border border-gray-100 text-gray-400 hover:text-rose-500'}`}>
             <i className="fa-solid fa-power-off"></i> Logout
          </button>
        </div>
      </div>
    </aside>
  );

  const DashboardView = () => (
    <div className="p-12 pt-32 space-y-12 max-w-7xl mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-4">
            <h2 className="text-5xl font-black italic tracking-tighter">Welcome, Strategist {user?.displayName}</h2>
            {user?.isVerified ? (
              <span className="px-4 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100"><i className="fa-solid fa-check-double mr-1"></i> Verified</span>
            ) : (
              <span className="px-4 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100"><i className="fa-solid fa-clock mr-1"></i> Pending Verification</span>
            )}
          </div>
          <p className="text-gray-400 font-black uppercase tracking-[0.4em] text-[10px] mt-4">Current Capability: {user?.plan === 'free' ? 'Standard Protocol' : 'Elite Access'}</p>
        </div>
      </header>

      {!user?.isVerified && (
        <div className="bg-rose-50 border border-rose-100 p-8 rounded-[3rem] flex items-center justify-between gap-8 animate-in">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><i className="fa-solid fa-envelope-open-text text-2xl"></i></div>
            <div className="space-y-1">
              <p className="font-black text-rose-900">Immediate Verification Required</p>
              <p className="text-sm text-rose-700 font-medium">Core AI modules are currently locked. Check your email to verify your strategist profile.</p>
            </div>
          </div>
          <button onClick={handleResendVerification} className="px-10 py-4 bg-rose-600 text-white rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200">Resend Verification</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {QUICK_ACTIONS.map((action, idx) => (
          <button 
            key={idx} 
            onClick={() => { if (action.category === Category.PROFILE) { setView('profile-gen'); } else { setView('chat'); setInput(action.prompt); }}} 
            className="p-10 bg-white border border-gray-100 rounded-[3rem] shadow-sm hover:shadow-xl transition-all text-left space-y-6 group relative overflow-hidden"
          >
            {!user?.isVerified && <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-lock text-gray-300 text-2xl"></i></div>}
            <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-900 flex items-center justify-center text-2xl group-hover:bg-pink-50 group-hover:text-pink-500 transition-colors"><i className={`fa-solid ${action.icon}`}></i></div>
            <div><p className="text-[10px] font-black uppercase text-pink-500 tracking-widest">{action.category}</p><h4 className="text-2xl font-black italic tracking-tight mt-2">{action.label}</h4></div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderMainContent = () => {
    switch (view) {
      case 'landing': return (
        <div className="min-h-full flex flex-col pt-32 px-6 lg:px-8">
          <div className="mx-auto max-w-4xl py-32 text-center space-y-12">
            <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white shadow-2xl shadow-pink-100 mx-auto animate-bounce mb-8">
              <i className="fa-solid fa-heart text-4xl"></i>
            </div>
            <h1 className="text-8xl font-black italic tracking-tighter gradient-text leading-[0.85]">{adminSettings.landingTitle}</h1>
            <p className="text-xl font-bold text-gray-400 max-w-2xl mx-auto leading-relaxed">{adminSettings.landingSub}</p>
            <div className="flex items-center justify-center gap-10 pt-8">
              <button onClick={() => setView(user ? 'dashboard' : 'auth')} className="px-16 py-8 bg-gray-900 text-white rounded-[3rem] font-black text-xl shadow-2xl hover:bg-pink-600 hover:scale-110 transition-all flex items-center gap-6">
                 Initialize Protocol <i className="fa-solid fa-arrow-right-long"></i>
              </button>
            </div>
          </div>
        </div>
      );
      case 'auth': return (
        <div className="min-h-screen flex items-center justify-center p-6 pt-32">
          <div className="w-full max-w-md">
            {authMode === 'signup' ? (
              <SignupForm onSignup={handleSignup} isLoading={isAuthLoading} error={authError} onSwitchToLogin={() => setAuthMode('login')} />
            ) : (
              <form onSubmit={handleAuth} className="space-y-10 animate-in">
                 <div className="text-center space-y-5">
                    <div className="w-16 h-16 bg-gray-900 rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl mb-8"><i className="fa-solid fa-lock text-3xl"></i></div>
                    <h2 className="text-4xl font-black tracking-tighter text-gray-900">{authMode === 'login' ? 'Strategist Login' : 'Protocol Reset'}</h2>
                 </div>
                 {authError && <div className="p-5 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold">{authError}</div>}
                 <div className="space-y-5">
                    <input type="email" name="email" required placeholder="Email Address" className="w-full p-6 rounded-[1.8rem] bg-gray-50 border-2 border-transparent focus:border-pink-500 outline-none font-bold" />
                    {authMode === 'login' && <input type="password" name="password" required placeholder="Security Password" className="w-full p-6 rounded-[1.8rem] bg-gray-50 border-2 border-transparent focus:border-pink-500 outline-none font-bold" />}
                 </div>
                 <button type="submit" disabled={isAuthLoading} className="w-full py-6 bg-gray-900 text-white rounded-[2rem] font-black text-xl hover:bg-pink-600 transition-all">
                    {isAuthLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : (authMode === 'login' ? 'Authorize' : 'Send Link')}
                 </button>
                 <div className="text-center space-y-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase cursor-pointer hover:text-pink-500" onClick={() => setAuthMode(authMode === 'login' ? 'reset' : 'login')}>
                      {authMode === 'login' ? 'Credential Issues?' : 'Back to Entrance'}
                    </p>
                    {authMode === 'login' && <p className="text-[10px] font-black text-pink-500 uppercase cursor-pointer hover:underline" onClick={() => setAuthMode('signup')}>New Strategist Registration</p>}
                 </div>
              </form>
            )}
          </div>
        </div>
      );
      case 'dashboard': return <DashboardView />;
      case 'chat': return <ChatView user={user} messages={messages} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} setMessages={setMessages} input={input} setInput={setInput} isLoadingAI={isLoadingAI} attachedImage={attachedImage} handleImageUpload={handleImageUpload} setAttachedImage={setAttachedImage} handleSend={handleSend} messagesEndRef={messagesEndRef} fileInputRef={fileInputRef} />;
      case 'profile-gen': return <div className="p-12 pt-32"><BioGenView bioTraits={bioTraits} setBioTraits={setBioTraits} handleGenerateBio={handleGenerateBio} isLoadingAI={isLoadingAI} generatedBio={generatedBio} /></div>;
      case 'billing': return <div className="p-12 pt-32"><BillingView user={user} setConfirmUpgradePlan={setConfirmUpgradePlan} /></div>;
      case 'admin': return <AdminView adminTab={adminTab} setAdminTab={setAdminTab} isAdminLoading={isAdminLoading} adminUsers={adminUsers} handleChangePlan={handleChangePlan} handleToggleAdmin={handleToggleAdmin} adminPrompts={adminPrompts} setEditingPrompt={setEditingPrompt} handleDeletePrompt={handleDeletePrompt} adminStats={adminStats} adminSettings={adminSettings} setAdminSettings={setAdminSettings} handleSaveSettings={handleSaveSettings} editingPrompt={editingPrompt} handleSavePrompt={handleSavePrompt} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white text-gray-800">
      {user && view !== 'landing' && view !== 'auth' && <Sidebar />}
      {(view === 'landing' || view === 'auth') && <LandingHeader user={user} setView={setView} isScrolled={isScrolled} />}
      <main className="flex-1 overflow-hidden relative flex flex-col bg-white">
        {user && !user.isVerified && !isNoticeDismissed && (
          <div className="bg-rose-500 text-white p-4 flex items-center justify-between px-12 z-[100] sticky top-0">
            <div className="flex items-center gap-4"><i className="fa-solid fa-triangle-exclamation"></i><p className="text-[10px] font-black uppercase tracking-widest">Protocol Warning: Identity substrate not verified.</p></div>
            <div className="flex items-center gap-6">
               <button onClick={handleResendVerification} className="px-6 py-2 bg-white/20 rounded-full text-[8px] font-black uppercase tracking-widest">Re-dispatch Link</button>
               <button onClick={() => setIsNoticeDismissed(true)} className="opacity-50 hover:opacity-100"><i className="fa-solid fa-xmark"></i></button>
            </div>
          </div>
        )}
        <div ref={mainScrollRef} onScroll={handleMainScroll} className="flex-1 overflow-y-auto custom-scrollbar">
          {renderMainContent()}
          {(view === 'landing' || view === 'auth') && <LandingFooter />}
        </div>
      </main>

      {/* Confirmation Modal for Plan Upgrades */}
      {confirmUpgradePlan && (
        <div className="fixed inset-0 z-[600] bg-gray-900/60 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] p-16 shadow-2xl space-y-12 animate-in zoom-in-95">
            <div className="flex justify-between items-start">
               <div className="space-y-4">
                 <h3 className="text-4xl font-black italic tracking-tighter text-gray-900">Confirm Protocol Upgrade</h3>
                 <p className="text-gray-500 font-bold leading-relaxed">Prepare for enhanced tactical capabilities with the <span className="text-pink-600">{confirmUpgradePlan.name}</span> plan.</p>
               </div>
               <div className="w-20 h-20 rounded-3xl bg-pink-100 flex items-center justify-center text-pink-600 text-3xl shadow-inner"><i className="fa-solid fa-rocket"></i></div>
            </div>
            
            <div className="bg-gray-50 rounded-[2.5rem] p-10 space-y-8 border border-gray-100">
               <div className="flex justify-between items-center border-b border-gray-200 pb-6">
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tactical Package</p>
                 <p className="font-black text-xl italic text-gray-900">{confirmUpgradePlan.name}</p>
               </div>
               <div className="flex justify-between items-center border-b border-gray-200 pb-6">
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Investment</p>
                 <p className="font-black text-3xl italic gradient-text">{confirmUpgradePlan.price}</p>
               </div>
               <div className="space-y-4">
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Module Capabilities</p>
                 <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {confirmUpgradePlan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-xs font-bold text-gray-600">
                        <i className="fa-solid fa-circle-check text-pink-500 text-[10px]"></i> {f}
                      </li>
                    ))}
                 </ul>
               </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <button 
                onClick={() => { stripeService.createCheckoutSession(confirmUpgradePlan.stripePriceId); setConfirmUpgradePlan(null); }} 
                className="flex-1 py-6 bg-gray-900 text-white rounded-[2rem] font-black text-lg hover:bg-pink-600 transition-all shadow-xl flex items-center justify-center gap-4"
              >
                Deploy Upgrade <i className="fa-solid fa-arrow-right-long"></i>
              </button>
              <button 
                onClick={() => setConfirmUpgradePlan(null)} 
                className="py-6 px-12 bg-gray-100 text-gray-400 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:text-gray-900 transition-all"
              >
                Hold Position
              </button>
            </div>
            
            <p className="text-center text-[9px] font-bold text-gray-300 leading-relaxed uppercase tracking-wider">
              By confirming, you will be redirected to our secure payment gateway to finalize the transaction. All transactions are encrypted.
            </p>
          </div>
        </div>
      )}

      {showUsageModal.show && (
        <div className="fixed inset-0 z-[500] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xl rounded-[4rem] p-16 shadow-2xl text-center space-y-8 animate-in zoom-in-95">
            <div className="w-24 h-24 rounded-[2.5rem] bg-pink-100 text-pink-500 flex items-center justify-center text-4xl mx-auto shadow-inner"><i className="fa-solid fa-crown"></i></div>
            <div className="space-y-4"><h3 className="text-4xl font-black italic tracking-tighter text-gray-900">{showUsageModal.title}</h3><p className="text-gray-500 font-bold leading-relaxed">{showUsageModal.message}</p></div>
            <div className="flex flex-col gap-4">
              <button onClick={() => { setView('billing'); setShowUsageModal({...showUsageModal, show: false}); }} className="w-full py-6 bg-gray-900 text-white rounded-[2rem] font-black text-lg hover:bg-pink-600 transition-all shadow-xl">Upgrade Level</button>
              <button onClick={() => setShowUsageModal({...showUsageModal, show: false})} className="w-full py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900">Return to Field</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Re-defining internal sub-components for context
const ChatView = ({ user, messages, isDarkMode, setIsDarkMode, setMessages, input, setInput, isLoadingAI, attachedImage, handleImageUpload, setAttachedImage, handleSend, messagesEndRef, fileInputRef }: any) => (
  <div className={`h-full flex flex-col relative transition-all duration-500 ${isDarkMode ? 'bg-[#0a0a0c] text-white' : 'bg-white'}`}>
    <header className={`px-12 py-8 border-b flex justify-between items-center shrink-0 sticky top-0 z-20 shadow-sm transition-all duration-500 ${isDarkMode ? 'bg-[#121216]/90 border-white/5 backdrop-blur-2xl' : 'bg-white/90 border-gray-50 backdrop-blur-2xl'}`}>
       <div className="flex items-center gap-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm transition-colors ${isDarkMode ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' : 'bg-pink-100 text-pink-600'}`}>
            <i className="fa-solid fa-bolt-lightning"></i>
          </div>
          <div>
            <h3 className={`text-2xl font-black tracking-tight italic transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Signal Analyzer</h3>
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Operational Base</p>
          </div>
       </div>
       <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
             <p className={`text-[8px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
               {isDarkMode ? 'Tactical Stealth' : 'Bright Mode'}
             </p>
             <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm group active:scale-90 ${isDarkMode ? 'bg-white/5 text-yellow-400 border border-white/10 hover:bg-white/10' : 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100'}`}
             >
                <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-lg transition-transform duration-500 ${isDarkMode ? 'rotate-[360deg]' : 'rotate-0'}`}></i>
             </button>
          </div>
          <div className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase border tracking-[0.2em] shadow-inner transition-all ${isDarkMode ? 'bg-white/5 text-gray-400 border-white/5' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
            Reserve: <span className="text-pink-600 ml-2 font-black">{Math.max(user?.maxTokens! - user?.tokensUsed!, 0)}</span>
          </div>
       </div>
    </header>
    <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar relative">
      {messages.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 space-y-8 opacity-40">
           <div className={`w-24 h-24 rounded-[3rem] flex items-center justify-center text-4xl ${isDarkMode ? 'bg-white/5 text-white/20' : 'bg-gray-50 text-gray-200'}`}>
             <i className="fa-solid fa-tower-broadcast"></i>
           </div>
           <div className="space-y-2">
             <h4 className={`text-2xl font-black italic ${isDarkMode ? 'text-white' : 'text-gray-400'}`}>No Signals Detected</h4>
             <p className="text-[10px] font-black uppercase tracking-widest max-w-xs leading-relaxed">System initialized. Awaiting user input to begin tactical conversation analysis.</p>
           </div>
        </div>
      )}
      {messages.map((m: Message) => (
        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in`}>
          <div className={`max-w-[85%] p-10 rounded-[3rem] shadow-sm relative transition-all group ${m.role === 'user' ? (isDarkMode ? 'bg-indigo-600 shadow-indigo-900/20' : 'bg-indigo-600 shadow-indigo-100') + ' text-white' : (isDarkMode ? 'bg-[#16161a] border border-white/5' : 'bg-gray-50 border border-gray-100')}`}>
            {m.image && <img src={m.image} className="rounded-2xl mb-6 max-w-full border border-white/10" alt="Tactical Evidence" />}
            <p className={`text-lg font-bold leading-relaxed whitespace-pre-wrap ${m.role !== 'user' && isDarkMode ? 'text-gray-200' : ''}`}>{m.text}</p>
            <div className={`absolute -bottom-6 ${m.role === 'user' ? 'right-4' : 'left-4'} opacity-0 group-hover:opacity-100 transition-opacity`}>
               <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
    <footer className={`p-12 border-t sticky bottom-0 z-30 transition-all duration-500 ${isDarkMode ? 'bg-[#121216]/80 border-white/5' : 'bg-white/80 border-gray-50'} backdrop-blur-xl`}>
      <div className="max-w-5xl mx-auto space-y-10">
        <div className={`relative p-8 rounded-[4rem] border flex items-center transition-all ${isDarkMode ? 'bg-white/5 border-white/10 focus-within:border-pink-500/40' : 'glass border-gray-100 shadow-xl focus-within:border-pink-500/20'}`}>
             <button 
               onClick={() => fileInputRef.current?.click()} 
               className={`p-6 transition-all active:scale-90 ${isDarkMode ? 'text-gray-500 hover:text-pink-400' : 'text-gray-400 hover:text-pink-500'} ${user?.plan === 'free' ? 'opacity-20 pointer-events-none' : ''}`}
             >
               <i className="fa-solid fa-camera-retro text-3xl"></i>
             </button>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
             <input 
               value={input} 
               onChange={e => setInput(e.target.value)} 
               onKeyDown={e => e.key === 'Enter' && handleSend()} 
               className={`flex-1 bg-transparent px-8 font-black outline-none text-xl placeholder:italic ${isDarkMode ? 'text-white placeholder:text-gray-600' : 'text-gray-900 placeholder:text-gray-300'}`} 
               placeholder="Paste context or type message..." 
             />
             <button 
               onClick={() => handleSend()} 
               disabled={isLoadingAI || (!input && !attachedImage)} 
               className={`w-20 h-20 rounded-[2.2rem] flex items-center justify-center shadow-2xl active:scale-95 transition-all ${isDarkMode ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-pink-900/40' : 'bg-gray-900 hover:bg-pink-600 text-white shadow-gray-200'}`}
             >
                {isLoadingAI ? <i className="fa-solid fa-spinner fa-spin text-2xl"></i> : <i className="fa-solid fa-paper-plane text-2xl"></i>}
             </button>
        </div>
        {attachedImage && (
          <div className="flex items-center gap-4 animate-in">
             <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-pink-500 shadow-lg">
                <img src={`data:${attachedImage.mimeType};base64,${attachedImage.data}`} className="w-full h-full object-cover" alt="Preview" />
                <button onClick={() => setAttachedImage(null)} className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity">
                  <i className="fa-solid fa-xmark"></i>
                </button>
             </div>
             <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`}>Image Substrate Loaded</p>
          </div>
        )}
      </div>
    </footer>
  </div>
);

const BioGenView = ({ bioTraits, setBioTraits, handleGenerateBio, isLoadingAI, generatedBio }: any) => (
  <div className="space-y-12 max-w-5xl mx-auto">
    <header className="space-y-4">
      <h2 className="text-5xl font-black italic tracking-tighter">Bio Constructor</h2>
      <p className="text-gray-400 font-black uppercase tracking-[0.4em] text-[10px]">Optimizing Substrate</p>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm space-y-8">
        <textarea value={bioTraits.interests} onChange={e => setBioTraits({...bioTraits, interests: e.target.value})} placeholder="Interests..." className="w-full h-32 p-8 bg-gray-50 rounded-[2.5rem] border-2 border-transparent focus:border-pink-500 outline-none font-bold" />
        <textarea value={bioTraits.personality} onChange={e => setBioTraits({...bioTraits, personality: e.target.value})} placeholder="Personality..." className="w-full h-32 p-8 bg-gray-50 rounded-[2.5rem] border-2 border-transparent focus:border-pink-500 outline-none font-bold" />
        <input value={bioTraits.goal} onChange={e => setBioTraits({...bioTraits, goal: e.target.value})} placeholder="Goal..." className="w-full p-8 bg-gray-50 rounded-[2.5rem] border-2 border-transparent focus:border-pink-500 outline-none font-bold" />
        <button onClick={handleGenerateBio} disabled={isLoadingAI} className="w-full py-8 bg-gray-900 text-white rounded-[3rem] font-black text-xl hover:bg-pink-600 transition-all shadow-2xl flex items-center justify-center gap-6">
          {isLoadingAI ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-wand-magic-sparkles"></i> Construct Bio</>}
        </button>
      </div>
      <div className={`rounded-[4rem] p-12 border transition-all ${generatedBio ? 'bg-pink-50/30 border-pink-100' : 'bg-gray-50 border-gray-100'}`}>
        {generatedBio ? <div className="prose prose-pink font-bold text-gray-700 whitespace-pre-wrap leading-relaxed">{generatedBio}</div> : <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-6"><i className="fa-solid fa-dna text-6xl"></i><p className="text-[10px] font-black uppercase tracking-widest">Awaiting Parameter Injection</p></div>}
      </div>
    </div>
  </div>
);

const BillingView = ({ user, setConfirmUpgradePlan }: any) => (
  <div className="space-y-12 max-w-7xl mx-auto">
    <header className="text-center space-y-6"><h2 className="text-6xl font-black italic tracking-tighter">Protocol Upgrades</h2></header>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
      {PLANS.map(plan => (
        <div key={plan.id} className={`p-12 rounded-[4rem] border-2 flex flex-col justify-between space-y-10 transition-all ${user?.plan === plan.id ? 'border-pink-500 bg-pink-50/30' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
          <div className="space-y-6">
            <h4 className="text-3xl font-black italic tracking-tighter">{plan.name}</h4>
            <p className="text-5xl font-black italic">{plan.price}</p>
            <ul className="space-y-4 pt-6">{plan.features.map((f, i) => (<li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-500"><i className="fa-solid fa-check text-pink-500"></i> {f}</li>))}</ul>
          </div>
          <button 
            disabled={user?.plan === plan.id} 
            onClick={() => {
               if (plan.id === 'free') return;
               setConfirmUpgradePlan(plan);
            }} 
            className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all ${user?.plan === plan.id ? 'bg-gray-100 text-gray-400' : 'bg-gray-900 text-white hover:bg-pink-600 shadow-xl'}`}
          >
            {user?.plan === plan.id ? 'Current Protocol' : 'Upgrade'}
          </button>
        </div>
      ))}
    </div>
  </div>
);

const AdminView = ({ adminTab, setAdminTab, isAdminLoading, adminUsers, handleChangePlan, handleToggleAdmin, adminPrompts, setEditingPrompt, handleDeletePrompt, adminStats, adminSettings, setAdminSettings, handleSaveSettings, editingPrompt, handleSavePrompt }: any) => (
  <div className="p-12 pt-32 space-y-12 max-w-7xl mx-auto w-full">
    <header className="flex flex-col lg:flex-row justify-between items-center bg-gray-900 p-12 rounded-[4rem] text-white shadow-2xl relative group overflow-hidden gap-8">
      <div className="z-10"><h2 className="text-5xl font-black italic tracking-tighter">Admin Suite</h2><p className="text-white/40 font-black uppercase tracking-[0.4em] text-[10px] mt-4">Command Matrix</p></div>
      <div className="flex flex-wrap gap-4 z-10 justify-center">{[{id: 'users', label: 'Users'}, {id: 'prompts', label: 'Library'}, {id: 'stats', label: 'Stats'}, {id: 'cms', label: 'CMS'}].map(tab => (<button key={tab.id} onClick={() => setAdminTab(tab.id)} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === tab.id ? 'bg-white text-gray-900 shadow-xl' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>{tab.label}</button>))}</div>
    </header>
    {isAdminLoading ? <div className="flex items-center justify-center p-24"><i className="fa-solid fa-spinner fa-spin text-4xl text-pink-500"></i></div> : (
      <>
        {adminTab === 'users' && <div className="bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden"><table className="w-full text-left"><thead><tr className="bg-gray-50 border-b border-gray-100"><th className="p-10 text-[10px] font-black uppercase tracking-widest">Strategist</th><th className="p-10 text-[10px] font-black uppercase tracking-widest text-center">Protocol</th><th className="p-10 text-[10px] font-black uppercase tracking-widest text-right">Actions</th></tr></thead><tbody className="divide-y">{adminUsers.map((u: User) => (<tr key={u.id} className="hover:bg-gray-50/50 transition-colors"><td className="p-10"><div className="font-black text-gray-900 italic">{u.displayName}</div><div className="text-xs text-gray-400">{u.email}</div></td><td className="p-10 text-center"><select value={u.plan} onChange={(e) => handleChangePlan(u.id, e.target.value as any)} className="px-4 py-2 bg-gray-100 rounded-xl text-[10px] font-black uppercase"><option value="free">Free</option><option value="basic">Basic</option><option value="pro">Pro</option></select></td><td className="p-10 text-right"><button onClick={() => handleToggleAdmin(u.id, !!u.isAdmin)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase ${u.isAdmin ? 'text-rose-600 bg-rose-50' : 'bg-gray-100'}`}>{u.isAdmin ? 'Revoke Admin' : 'Make Admin'}</button></td></tr>))}</tbody></table></div>}
        {adminTab === 'prompts' && <div className="space-y-12"><div className="flex justify-between items-center bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm"><div><h3 className="text-3xl font-black italic tracking-tighter">AI Prompt Library</h3></div><button onClick={() => setEditingPrompt({ id: 'new', name: '', description: '', content: '' })} className="px-10 py-5 bg-pink-500 text-white rounded-[2rem] font-black text-xs uppercase shadow-2xl hover:bg-pink-600"><i className="fa-solid fa-plus mr-2"></i> New Protocol</button></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-10">{adminPrompts.map((p: any) => (<div key={p.id} className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-8"><div><div className="flex justify-between items-start mb-6"><div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center"><i className="fa-solid fa-microchip"></i></div><div className="flex gap-2"><button onClick={() => setEditingPrompt(p)} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-pink-50 hover:text-pink-500 transition-all"><i className="fa-solid fa-pen"></i></button>{!['default-system', 'bio-optimizer'].includes(p.id) && <button onClick={() => handleDeletePrompt(p.id)} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all"><i className="fa-solid fa-trash"></i></button>}</div></div><h4 className="text-2xl font-black italic tracking-tighter text-gray-900">{p.name}</h4><p className="text-xs font-bold text-gray-400 mt-2">{p.description}</p></div><div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 overflow-hidden"><p className="text-[10px] font-mono text-gray-500 line-clamp-4 leading-relaxed whitespace-pre-wrap">{p.content}</p></div></div>))}</div></div>}
        {adminTab === 'stats' && <div className="grid grid-cols-1 md:grid-cols-4 gap-10 animate-in"><div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm space-y-6"><p className="text-gray-400 font-black uppercase text-[10px]">Total Users</p><p className="text-6xl font-black italic">{adminStats?.total || 0}</p></div><div className="bg-pink-50 p-12 rounded-[4rem] border border-pink-100 shadow-sm space-y-6"><p className="text-pink-600 font-black uppercase text-[10px]">Pro Users</p><p className="text-6xl font-black italic text-pink-600">{adminStats?.pro || 0}</p></div></div>}
        {adminTab === 'cms' && <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm space-y-12"><div className="flex justify-between items-center"><div><h3 className="text-3xl font-black italic tracking-tighter">Homepage Editor</h3></div><button onClick={handleSaveSettings} className="px-10 py-5 bg-gray-900 text-white rounded-[2rem] font-black text-xs uppercase shadow-2xl hover:bg-pink-600 transition-all">Sync CMS</button></div><div className="space-y-10"><div className="space-y-4"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Main Headline</label><input value={adminSettings.landingTitle} onChange={(e) => setAdminSettings({ ...adminSettings, landingTitle: e.target.value })} className="w-full p-8 rounded-[2rem] bg-gray-50 border-2 border-transparent focus:border-pink-500 outline-none font-black text-2xl italic tracking-tight" /></div></div></div>}
      </>
    )}
    {editingPrompt && <div className="fixed inset-0 z-[300] bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-12"><div className="bg-white w-full max-w-4xl rounded-[5rem] p-16 shadow-2xl animate-in space-y-10 max-h-[90vh] overflow-y-auto custom-scrollbar"><div className="flex justify-between items-center"><h3 className="text-4xl font-black italic">{editingPrompt.id === 'new' ? 'New Protocol' : 'Edit Protocol'}</h3><button onClick={() => setEditingPrompt(null)} className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all"><i className="fa-solid fa-xmark"></i></button></div><form onSubmit={handleSavePrompt} className="space-y-8"><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="space-y-4"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Name</label><input required value={editingPrompt.name} onChange={e => setEditingPrompt({...editingPrompt, name: e.target.value})} className="w-full p-6 bg-gray-50 rounded-[2rem] border-2 border-transparent focus:border-pink-500 outline-none font-bold text-sm" /></div></div><div className="space-y-4"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Instruction Logic</label><textarea required value={editingPrompt.content} onChange={e => setEditingPrompt({...editingPrompt, content: e.target.value})} className="w-full h-80 p-10 bg-gray-50 rounded-[3rem] border-2 border-transparent focus:border-pink-500 outline-none font-mono text-xs leading-relaxed" /></div><button type="submit" className="w-full py-7 bg-gray-900 text-white rounded-[2.5rem] font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-pink-600 transition-all">Synchronize</button></form></div></div>}
  </div>
);

export default App;