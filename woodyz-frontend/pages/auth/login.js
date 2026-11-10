// pages/auth/login.js
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import Head from 'next/head';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(username, password);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <>
      <Head>
        <title>Login | WOODYZ</title>
        <meta name="description" content="Log into your WOODYZ account to manage your orders." />
      </Head>

      <section className="py-16 lg:py-24 px-6">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-cedar border-4 border-charcoal rounded-[24px] mb-6 shadow-[6px_6px_0px_0px_#3A322B]">
              <iconify-icon icon="ph:user-bold" class="text-white text-4xl"></iconify-icon>
            </div>
            <h1 className="font-display text-5xl font-black text-3d mb-3">Welcome Back!</h1>
            <p className="text-lg font-medium text-charcoal/60">Log in to continue your WOODYZ journey.</p>
          </div>

          {/* Form Card */}
          <div className="relative">
            <div className="absolute -inset-3 bg-maple rounded-[48px] border-4 border-charcoal -rotate-2 -z-10 shadow-[8px_8px_0px_0px_#3A322B]"></div>
            <div className="bg-white border-4 border-charcoal rounded-[40px] p-10">
              {error && (
                <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 text-red-700 rounded-xl font-bold text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label htmlFor="login-username" className="block text-xs font-black uppercase tracking-widest mb-3 text-charcoal/60">Username</label>
                  <input
                    id="login-username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-6 py-4 rounded-2xl border-3 border-charcoal bg-cream font-bold text-charcoal focus:outline-none focus:ring-4 focus:ring-cedar/30 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="login-password" className="block text-xs font-black uppercase tracking-widest mb-3 text-charcoal/60">Password</label>
                  <input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-6 py-4 rounded-2xl border-3 border-charcoal bg-cream font-bold text-charcoal focus:outline-none focus:ring-4 focus:ring-cedar/30 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full btn-pop bg-cedar text-white border-4 border-charcoal px-8 py-5 rounded-2xl font-black text-lg uppercase tracking-widest"
                >
                  Log In
                </button>
              </form>
            </div>
          </div>

          <p className="text-center mt-8 font-bold text-charcoal/60">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-cedar font-black hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
