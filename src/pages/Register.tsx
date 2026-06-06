import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Register({ setActivePage }) {
  const { register } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!name) newErrors.name = 'Name is required';
    else if (name.length < 2) newErrors.name = 'Name must be at least 2 characters';

    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';

    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    return newErrors;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setApiError('');
    try {
      await register(name, email, password);
      setActivePage('dashboard');
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const passwordStrength = {
    hasLength: password.length >= 6,
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };

  const strengthScore = Object.values(passwordStrength).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] via-[#111827] to-[#0f1419] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <span className="text-white text-2xl font-bold">H</span>
          </div>
        </div>

        <div className="bg-[#111827] rounded-2xl border border-[#1e2d45] shadow-2xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Join HouseMate</h1>
            <p className="text-[#8896b0] text-sm">Create your account to get started</p>
          </div>

          {apiError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs text-red-400">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-[#8896b0]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  placeholder="John Doe"
                  className={`w-full pl-10 pr-4 py-2.5 bg-[#0f1419] border rounded-lg outline-none transition ${errors.name
                    ? 'border-red-500/50'
                    : 'border-[#1e2d45] focus:border-indigo-500'
                  } text-white placeholder-[#596a80]`}
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-[#8896b0]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 bg-[#0f1419] border rounded-lg outline-none transition ${errors.email
                    ? 'border-red-500/50'
                    : 'border-[#1e2d45] focus:border-indigo-500'
                  } text-white placeholder-[#596a80]`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-[#8896b0]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 bg-[#0f1419] border rounded-lg outline-none transition ${errors.password
                    ? 'border-red-500/50'
                    : 'border-[#1e2d45] focus:border-indigo-500'
                  } text-white placeholder-[#596a80]`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#8896b0] hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}

              {password && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition ${i < strengthScore
                          ? strengthScore === 1
                            ? 'bg-red-500'
                            : strengthScore === 2
                              ? 'bg-yellow-500'
                              : 'bg-emerald-500'
                          : 'bg-[#1e2d45]'
                        }`}
                      ></div>
                    ))}
                  </div>
                  <div className="text-xs text-[#8896b0] space-y-1">
                    <div className="flex items-center gap-2">
                      {passwordStrength.hasLength ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-[#596a80]"></div>
                      )}
                      <span>At least 6 characters</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-[#8896b0]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 bg-[#0f1419] border rounded-lg outline-none transition ${errors.confirmPassword
                    ? 'border-red-500/50'
                    : 'border-[#1e2d45] focus:border-indigo-500'
                  } text-white placeholder-[#596a80]`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-[#8896b0] hover:text-white transition"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>}
            </div>

            <label className="flex items-start gap-2 cursor-pointer mt-4">
              <input type="checkbox" className="w-4 h-4 rounded border-[#1e2d45] bg-[#0f1419] accent-indigo-600 mt-0.5" />
              <span className="text-xs text-[#8896b0]">
                I agree to the Terms of Service and Privacy Policy
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-indigo-600/50 disabled:to-indigo-700/50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#1e2d45]"></div>
            <span className="text-xs text-[#8896b0]">Already have an account?</span>
            <div className="flex-1 h-px bg-[#1e2d45]"></div>
          </div>

          <button
            onClick={() => setActivePage('login')}
            className="w-full border border-[#1e2d45] hover:bg-[#0f1419] text-white py-3 rounded-lg transition font-medium"
          >
            Sign In
          </button>
        </div>

        <p className="text-center text-xs text-[#596a80] mt-6">
          After registering, join a house with invite code 12A06
        </p>
      </div>
    </div>
  );
}
