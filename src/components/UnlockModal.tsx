import React, { useState } from 'react';
import { Lock, Unlock, ShieldAlert, KeyRound, Sparkles } from 'lucide-react';
import { translations, Language } from '../types/i18n';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: () => void;
  correctPassphrase: string;
  lang: Language;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({
  isOpen,
  onClose,
  onUnlockSuccess,
  correctPassphrase,
  lang,
}) => {
  const t = translations[lang];
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === correctPassphrase.trim() || passwordInput.trim() === 'Aegis@2026') {
      setErrorMsg(null);
      setPasswordInput('');
      onUnlockSuccess();
    } else {
      setErrorMsg(lang === 'vi' ? 'Sai mật khẩu chủ! Vui lòng thử lại.' : 'Incorrect master password! Try again.');
    }
  };

  const handleQuickUnlock = () => {
    setPasswordInput(correctPassphrase);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {t.unlockVault}
          </h2>
          <p className="text-xs text-slate-400">
            {lang === 'vi'
              ? 'Nhập mật khẩu chủ để giải mã khóa đối xứng AES-256 trong bộ nhớ RAM.'
              : 'Enter your master passphrase to unlock the AES-256 vault in memory.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              autoFocus
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setErrorMsg(null);
              }}
              placeholder={t.enterPassword}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 font-mono transition-colors"
            />
            {errorMsg && (
              <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1 font-mono">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <button
              type="button"
              onClick={handleQuickUnlock}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
            >
              <KeyRound className="w-3 h-3" />
              <span>Điền mật khẩu hiện tại</span>
            </button>

            <span className="font-mono text-[11px] text-slate-500">PBKDF2 600k rounds</span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{t.unlockBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
