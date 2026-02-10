
import React, { useState } from 'react';

interface SignupFormProps {
  onSignup: (email: string, pass: string, name: string) => void;
  isLoading: boolean;
  error: string | null;
  onSwitchToLogin: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSignup, isLoading, error, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignup(email, password, displayName);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-in">
      <div className="text-center space-y-5">
        <div className="w-16 h-16 bg-pink-500 rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl shadow-pink-100 mb-8 rotate-3">
          <i className="fa-solid fa-user-plus text-3xl"></i>
        </div>
        <h2 className="text-4xl font-black tracking-tighter text-gray-900">Join the Elite</h2>
        <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Deploy your tactical dating protocol</p>
      </div>

      {error && (
        <div className="p-5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold animate-in flex items-center gap-3">
          <i className="fa-solid fa-triangle-exclamation"></i> {error}
        </div>
      )}

      <div className="space-y-5">
        <div className="relative">
          <i className="fa-solid fa-user absolute left-6 top-1/2 -translate-y-1/2 text-gray-300"></i>
          <input 
            type="text" 
            required 
            value={displayName} 
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Strategist Name" 
            className="w-full p-6 pl-14 rounded-[1.8rem] bg-gray-50 border-2 border-transparent focus:border-pink-500 focus:bg-white outline-none font-bold text-sm" 
          />
        </div>
        <div className="relative">
          <i className="fa-solid fa-envelope absolute left-6 top-1/2 -translate-y-1/2 text-gray-300"></i>
          <input 
            type="email" 
            required 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            placeholder="Email Address" 
            className="w-full p-6 pl-14 rounded-[1.8rem] bg-gray-50 border-2 border-transparent focus:border-pink-500 focus:bg-white outline-none font-bold text-sm" 
          />
        </div>
        <div className="relative">
          <i className="fa-solid fa-lock absolute left-6 top-1/2 -translate-y-1/2 text-gray-300"></i>
          <input 
            type="password" 
            required 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            placeholder="Security Password" 
            className="w-full p-6 pl-14 rounded-[1.8rem] bg-gray-50 border-2 border-transparent focus:border-pink-500 focus:bg-white outline-none font-bold text-sm" 
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isLoading} 
        className="w-full py-6 bg-gray-900 text-white rounded-[2rem] font-black shadow-2xl hover:bg-pink-600 hover:scale-[1.02] transition-all flex items-center justify-center gap-5 text-xl"
      >
        {isLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Deploy Strategy"}
      </button>

      <div className="text-center">
        <span 
          onClick={onSwitchToLogin} 
          className="text-[10px] font-black text-pink-500 uppercase tracking-widest cursor-pointer hover:underline"
        >
          Already an operative? Return to Login
        </span>
      </div>
    </form>
  );
};

export default SignupForm;
