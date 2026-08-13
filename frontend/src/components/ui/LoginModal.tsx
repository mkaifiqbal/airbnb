'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { FcGoogle } from 'react-icons/fc';
import { IoClose, IoMailOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const { login, loginWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await loginWithEmail(cleanEmail, name.trim() || undefined);
      toast.success('Welcome to Airbnb! 🎉');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const mockGoogleUser = {
        google_id: `google_${Date.now()}`,
        email: `user${Math.floor(Math.random() * 1000)}@gmail.com`,
        name: 'Demo Google User',
        avatar_url: `https://ui-avatars.com/api/?name=Demo+User&background=FF385C&color=fff&size=150`,
      };
      await login(mockGoogleUser);
      toast.success('Welcome to Airbnb! 🎉');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'guest' | 'host') => {
    setIsLoading(true);
    try {
      const demoUsers = {
        guest: {
          google_id: 'google_guest_001',
          email: 'mike.guest@gmail.com',
          name: 'Mike Chen',
          avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        },
        host: {
          google_id: 'google_host_001',
          email: 'sarah.host@gmail.com',
          name: 'Sarah Johnson',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
        },
      };
      await login(demoUsers[role]);
      toast.success(`Welcome back, ${demoUsers[role].name}! 🎉`);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>
            <IoClose size={20} />
          </button>
          <h2>Log in or sign up</h2>
          <div className="w-8" />
        </div>

        <div className="p-6 relative">
          <h3 className="text-xl font-semibold mb-2">Welcome to Airbnb</h3>
          <p className="text-sm text-airbnb-gray mb-5">Enter your email to continue (no password or OTP required).</p>

          {/* Email Form */}
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3 mb-5">
            <div className="relative">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 border border-airbnb-border rounded-sm text-base text-airbnb-dark bg-airbnb-bg outline-none transition-colors duration-fast focus:border-airbnb-dark focus:shadow-[0_0_0_1px_#222222]"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] text-white border-none rounded-sm text-base font-semibold cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 transition-opacity duration-fast disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <IoMailOutline size={18} />
              <span>Continue with Email</span>
            </button>
          </form>

          <div className="flex items-center gap-4 my-5">
            <span className="flex-1 h-px bg-airbnb-border" />
            <span className="text-xs text-airbnb-gray uppercase tracking-wider">or quick demo login</span>
            <span className="flex-1 h-px bg-airbnb-border" />
          </div>

          {/* Demo Login Buttons */}
          <div className="flex flex-col gap-2.5 mb-5">
            <button
              type="button"
              className="flex items-center gap-4 w-full py-3 px-4 border border-airbnb-border rounded-sm bg-airbnb-bg cursor-pointer hover:border-airbnb-dark hover:bg-airbnb-bg-secondary transition-all duration-fast text-left disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => handleDemoLogin('guest')}
              disabled={isLoading}
            >
              <span className="text-[26px]">🧳</span>
              <div className="flex flex-col gap-0.5">
                <strong className="text-sm text-airbnb-dark">Demo Guest (Mike Chen)</strong>
                <span className="text-xs text-airbnb-gray">Browse, search, book stays & leave reviews</span>
              </div>
            </button>

            <button
              type="button"
              className="flex items-center gap-4 w-full py-3 px-4 border border-airbnb-border rounded-sm bg-airbnb-bg cursor-pointer hover:border-airbnb-dark hover:bg-airbnb-bg-secondary transition-all duration-fast text-left disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => handleDemoLogin('host')}
              disabled={isLoading}
            >
              <span className="text-[26px]">🏠</span>
              <div className="flex flex-col gap-0.5">
                <strong className="text-sm text-airbnb-dark">Demo Host (Sarah Johnson)</strong>
                <span className="text-xs text-airbnb-gray">Host dashboard, manage listings & view bookings</span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-4 my-4">
            <span className="flex-1 h-px bg-airbnb-border" />
            <span className="text-xs text-airbnb-gray">or</span>
            <span className="flex-1 h-px bg-airbnb-border" />
          </div>

          {/* Google Login */}
          <button
            type="button"
            className="flex items-center justify-center gap-3 w-full py-3 border border-airbnb-dark rounded-sm text-sm font-semibold bg-airbnb-bg text-airbnb-dark cursor-pointer hover:bg-airbnb-bg-secondary transition-colors duration-fast disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <FcGoogle size={20} />
            <span>Continue with Google</span>
          </button>

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/85 rounded-md backdrop-blur-[2px]">
              <div className="spinner spinner-lg" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
