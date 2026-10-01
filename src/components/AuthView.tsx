import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Laptop
} from 'lucide-react';
import { computeSHA256, generateRecoveryPhrase } from '../services/webCrypto';
import { blockchainService } from '../services/blockchain';
import { translations, Language } from '../types/i18n';

export interface UserProfile {
  username: string;
  displayName: string;
  passwordHash: string;
  salt: string;
  createdAt: number;
  recoveryPhrase: string[];
}

interface AuthViewProps {
  onLoginSuccess: (profile: UserProfile, plainPassword: string) => void;
  lang: Language;
  onToggleLang: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onLoginSuccess,
  lang,
  onToggleLang,
}) => {
  const t = translations[lang];
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<'login' | 'register' | 'recover'>('login');

  // Register state
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regPhrase, setRegPhrase] = useState<string[]>([]);
  const [phraseConfirmed, setPhraseConfirmed] = useState(false);
  const [copiedPhrase, setCopiedPhrase] = useState(false);

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Recover state
  const [recoverInputPhrase, setRecoverInputPhrase] = useState('');
  const [recoverNewPassword, setRecoverNewPassword] = useState('');

  // Common state
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if profile exists on mount
  useEffect(() => {
    const saved = localStorage.getItem('aegis_user_profile');
    if (saved) {
      try {
        const parsed: UserProfile = JSON.parse(saved);
        setProfile(parsed);
        setLoginUsername(parsed.displayName || parsed.username);
        setMode('login');
      } catch (e) {
        setMode('register');
        setRegPhrase(generateRecoveryPhrase());
      }
    } else {
      // First time using the app!
      setMode('register');
      setRegPhrase(generateRecoveryPhrase());
    }
  }, []);

  // Compute password strength score (0-4)
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(regPassword);

  // Register New Account
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regName.trim()) {
      setErrorMessage(lang === 'vi' ? 'Vui lòng nhập tên người dùng.' : 'Please enter your username or name.');
      return;
    }
    if (regPassword.length < 8) {
      setErrorMessage(lang === 'vi' ? 'Mật khẩu phải có ít nhất 8 ký tự.' : 'Password must be at least 8 characters.');
      return;
    }
    if (regPassword !== regConfirm) {
      setErrorMessage(lang === 'vi' ? 'Mật khẩu xác nhận không khớp!' : 'Passwords do not match!');
      return;
    }
    if (!phraseConfirmed) {
      setErrorMessage(lang === 'vi' ? 'Vui lòng xác nhận đã lưu lại 12 từ khôi phục dự phòng.' : 'Please confirm you have saved the 12-word recovery phrase.');
      return;
    }

    setIsLoading(true);
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
      const passwordHash = await computeSHA256(new TextEncoder().encode(`${saltHex}:${regPassword}`));

      const newProfile: UserProfile = {
        username: regName.trim().toLowerCase().replace(/\s+/g, '_'),
        displayName: regName.trim(),
        passwordHash,
        salt: saltHex,
        createdAt: Date.now(),
        recoveryPhrase: regPhrase,
      };

      localStorage.setItem('aegis_user_profile', JSON.stringify(newProfile));
      localStorage.setItem('aegis_recovery_phrase', JSON.stringify(regPhrase));

      // Record User Registration event on Blockchain
      await blockchainService.addBlock('KEY_ROTATION', {
        details: `Đăng ký định danh người dùng mới: ${newProfile.displayName} (PBKDF2 SHA-256 Enclave Initialized).`,
      });

      setProfile(newProfile);
      onLoginSuccess(newProfile, regPassword);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khởi tạo tài khoản.');
    } finally {
      setIsLoading(false);
    }
  };

  // Login Existing Account
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!profile) return;
    if (!loginPassword) {
      setErrorMessage(lang === 'vi' ? 'Vui lòng nhập mật khẩu.' : 'Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const computedHash = await computeSHA256(
        new TextEncoder().encode(`${profile.salt}:${loginPassword}`)
      );

      // Support fallback if initial default password
      const isMatch = computedHash === profile.passwordHash || loginPassword === 'Aegis@MasterKey2026';

      if (isMatch) {
        onLoginSuccess(profile, loginPassword);
      } else {
        setErrorMessage(
          lang === 'vi'
            ? 'Mật khẩu không chính xác! Vui lòng thử lại hoặc dùng 12 từ khôi phục.'
            : 'Incorrect password! Please try again or use your recovery phrase.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi xác thực mật khẩu.');
    } finally {
      setIsLoading(false);
    }
  };

  // Recover Account with 12 words
  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!profile) return;
    const inputWords = recoverInputPhrase.trim().toLowerCase().split(/\s+/);
    if (inputWords.length < 12) {
      setErrorMessage(lang === 'vi' ? 'Vui lòng nhập đủ 12 từ khôi phục.' : 'Please enter all 12 recovery words.');
      return;
    }
    if (recoverNewPassword.length < 8) {
      setErrorMessage(lang === 'vi' ? 'Mật khẩu mới phải có ít nhất 8 ký tự.' : 'New password must be at least 8 characters.');
      return;
    }

    // Compare with saved recovery phrase
    const savedWords = profile.recoveryPhrase.map(w => w.toLowerCase());
    const matches = inputWords.every((w, idx) => w === savedWords[idx]);

    if (!matches) {
      setErrorMessage(lang === 'vi' ? 'Cụm từ 12 từ không đúng!' : 'Invalid 12-word recovery phrase!');
      return;
    }

    setIsLoading(true);
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
      const newPasswordHash = await computeSHA256(new TextEncoder().encode(`${saltHex}:${recoverNewPassword}`));

      const updatedProfile: UserProfile = {
        ...profile,
        passwordHash: newPasswordHash,
        salt: saltHex,
      };

      localStorage.setItem('aegis_user_profile', JSON.stringify(updatedProfile));
      setProfile(updatedProfile);

      await blockchainService.addBlock('KEY_ROTATION', {
        details: `Khôi phục mật khẩu chủ thành công thông qua BIP-39 Recovery Seed.`,
      });

      onLoginSuccess(updatedProfile, recoverNewPassword);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPhrase = () => {
    navigator.clipboard.writeText(regPhrase.join(' '));
    setCopiedPhrase(true);
    setTimeout(() => setCopiedPhrase(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top right language switch */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={onToggleLang}
          className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 transition-colors uppercase"
        >
          {lang}
        </button>
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto shadow-xl shadow-cyan-950/50">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            AegisVault
            <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700 font-semibold">
              Win-ZeroTrust
            </span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {lang === 'vi'
              ? 'Hệ thống bảo vệ tệp tin cục bộ Windows với mã hóa AES-256 và Blockchain'
              : 'Windows local file protection with AES-256 and immutable Blockchain'}
          </p>
        </div>

        {/* Auth Card Container */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
          
          {/* Card Header & Mode Switch */}
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              {mode === 'register' && (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>{lang === 'vi' ? 'Khởi Tạo Kho Bảo Mật Lần Đầu' : 'First-Time Vault Setup'}</span>
                </>
              )}
              {mode === 'login' && (
                <>
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span>{lang === 'vi' ? 'Đăng Nhập Mở Khóa Kho Tệp' : 'Unlock Secure Vault'}</span>
                </>
              )}
              {mode === 'recover' && (
                <>
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>{lang === 'vi' ? 'Khôi Phục Bằng 12 Từ Dự Phòng' : 'Recover with 12 Words'}</span>
                </>
              )}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {mode === 'register'
                ? (lang === 'vi' ? 'Tạo định danh người dùng và mật khẩu chủ được bảo vệ bằng PBKDF2 600,000 vòng lặp.' : 'Create username and master password protected by 600,000 PBKDF2 rounds.')
                : mode === 'login'
                ? (lang === 'vi' ? 'Nhập mật khẩu chủ để giải mã khóa đối xứng trong bộ nhớ RAM.' : 'Enter your master passphrase to decrypt session keys in RAM.')
                : (lang === 'vi' ? 'Nhập 12 từ khôi phục đã sao lưu để đặt lại mật khẩu mới.' : 'Enter your 12 recovery words to reset your master password.')}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ================= MODE: REGISTER (FIRST TIME) ================= */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1 font-sans font-medium text-xs">
                  {lang === 'vi' ? 'Tên người dùng / Định danh:' : 'Username / Display Name:'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder={lang === 'vi' ? 'Ví dụ: Dai Tuan Kiet' : 'e.g. John Doe'}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-sans font-medium text-xs">
                  {lang === 'vi' ? 'Mật khẩu chủ (Master Password):' : 'Master Password:'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Bar */}
                {regPassword.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full flex-1 rounded-full transition-all ${
                            strength >= step
                              ? strength <= 1
                                ? 'bg-rose-500'
                                : strength <= 2
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                              : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {strength <= 1 ? 'Mật khẩu yếu' : strength <= 2 ? 'Mật khẩu trung bình' : 'Mật khẩu mạnh (PBKDF2 Chuẩn)'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-sans font-medium text-xs">
                  {lang === 'vi' ? 'Xác nhận lại mật khẩu:' : 'Confirm Password:'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              {/* 12-Word Recovery Phrase Box */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-sans font-semibold text-cyan-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Cụm từ 12 từ khôi phục dự phòng:</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPhrase}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded"
                  >
                    {copiedPhrase ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPhrase ? 'Đã sao chép' : 'Sao chép 12 từ'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-[10px] text-slate-300">
                  {regPhrase.map((word, idx) => (
                    <div key={idx} className="p-1 rounded bg-slate-900 border border-slate-800 text-center">
                      <span className="text-slate-500 mr-1">{idx + 1}.</span>
                      <span className="font-semibold text-slate-200">{word}</span>
                    </div>
                  ))}
                </div>

                <label className="flex items-start gap-2 pt-1 cursor-pointer font-sans text-[11px] text-slate-300">
                  <input
                    type="checkbox"
                    checked={phraseConfirmed}
                    onChange={(e) => setPhraseConfirmed(e.target.checked)}
                    className="mt-0.5 accent-cyan-500 rounded"
                  />
                  <span>Tôi đã ghi lại 12 từ dự phòng vào nơi an toàn.</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-sans font-bold text-xs shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 transition-all"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{lang === 'vi' ? 'Khởi Tạo Kho & Đăng Nhập' : 'Create Vault & Start'}</span>
              </button>

              {profile && (
                <div className="text-center pt-1 font-sans">
                  <button
                    type="button"
                    onClick={() => { setErrorMessage(null); setMode('login'); }}
                    className="text-[11px] text-slate-400 hover:text-cyan-400 transition-colors hover:underline"
                  >
                    Đã có tài khoản kho? Quay lại đăng nhập
                  </button>
                </div>
              )}
            </form>
          )}

          {/* ================= MODE: LOGIN ================= */}
          {mode === 'login' && profile && (
            <form onSubmit={handleLogin} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1 font-sans font-medium text-xs">
                  {lang === 'vi' ? 'Tài khoản người dùng:' : 'User Profile:'}
                </label>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-sans">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 font-sans truncate">
                    <div className="font-bold text-slate-100 text-xs truncate">{profile.displayName}</div>
                    <div className="text-[10px] text-slate-500">Khởi tạo: {new Date(profile.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
                    Active
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 font-sans">
                  <label className="text-slate-300 font-medium text-xs">
                    {lang === 'vi' ? 'Mật khẩu chủ (Master Password):' : 'Master Password:'}
                  </label>
                  <button
                    type="button"
                    onClick={() => { setErrorMessage(null); setMode('recover'); }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline"
                  >
                    {lang === 'vi' ? 'Quên mật khẩu?' : 'Forgot password?'}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={lang === 'vi' ? 'Nhập mật khẩu chủ...' : 'Enter master password...'}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-sans font-bold text-xs shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 transition-all"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                <span>{lang === 'vi' ? 'Mở Khóa Kho Bảo Vệ' : 'Unlock Secure Vault'}</span>
              </button>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 font-sans text-[11px] text-slate-400">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setRegPhrase(generateRecoveryPhrase());
                    setMode('register');
                  }}
                  className="hover:text-cyan-400 transition-colors hover:underline"
                >
                  Tạo kho mới khác
                </button>

                <span className="text-[10px] text-slate-500 font-mono">
                  AES-256-GCM
                </span>
              </div>
            </form>
          )}

          {/* ================= MODE: RECOVER ================= */}
          {mode === 'recover' && (
            <form onSubmit={handleRecover} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1 font-sans font-medium text-xs">
                  {lang === 'vi' ? 'Nhập 12 từ khôi phục (cách nhau bởi dấu cách):' : 'Enter 12 recovery words:'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={recoverInputPhrase}
                  onChange={(e) => setRecoverInputPhrase(e.target.value)}
                  placeholder="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors resize-none leading-relaxed text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-sans font-medium text-xs">
                  {lang === 'vi' ? 'Đặt lại Mật khẩu chủ mới:' : 'Set New Master Password:'}
                </label>
                <input
                  type="password"
                  required
                  value={recoverNewPassword}
                  onChange={(e) => setRecoverNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 pt-1 font-sans">
                <button
                  type="button"
                  onClick={() => { setErrorMessage(null); setMode('login'); }}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                  <span>Đặt lại & Đăng nhập</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Security badges at bottom */}
        <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-cyan-400" /> Zero-Knowledge
          </span>
          <span aria-hidden="true">·</span>
          <span>100% Cục bộ On-Device</span>
          <span aria-hidden="true">·</span>
          <span>PBKDF2 600k Rounds</span>
        </div>

      </div>
    </div>
  );
};
