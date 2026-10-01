import React, { useState } from 'react';
import {
  KeyRound,
  Shield,
  Clock,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { generateRecoveryPhrase } from '../services/webCrypto';
import { blockchainService } from '../services/blockchain';
import { translations, Language } from '../types/i18n';

interface SettingsViewProps {
  passphrase: string;
  setPassphrase: (pass: string) => void;
  recoveryPhrase: string[];
  setRecoveryPhrase: (phrase: string[]) => void;
  autoLockMinutes: number;
  setAutoLockMinutes: (min: number) => void;
  lang: Language;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  passphrase,
  setPassphrase,
  recoveryPhrase,
  setRecoveryPhrase,
  autoLockMinutes,
  setAutoLockMinutes,
  lang,
}) => {
  const t = translations[lang];
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passUpdatedMsg, setPassUpdatedMsg] = useState(false);
  const [copiedPhrase, setCopiedPhrase] = useState(false);

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass || newPass.length < 8) {
      alert(lang === 'vi' ? 'Mật khẩu phải có ít nhất 8 ký tự.' : 'Passphrase must be at least 8 characters.');
      return;
    }
    if (newPass !== confirmPass) {
      alert(lang === 'vi' ? 'Xác nhận mật khẩu không khớp!' : 'Passphrase confirmation does not match!');
      return;
    }

    setPassphrase(newPass);
    blockchainService.addBlock('KEY_ROTATION', {
      details: 'Cập nhật Mật khẩu chủ (Master Passphrase) và luân chuyển khóa AES-256 mới.',
    });
    setNewPass('');
    setConfirmPass('');
    setPassUpdatedMsg(true);
    setTimeout(() => setPassUpdatedMsg(false), 3000);
  };

  const handleRegeneratePhrase = () => {
    const confirmMsg = lang === 'vi'
      ? 'Bạn có chắc chắn muốn tạo cụm từ khôi phục mới? Hãy ghi lại ngay lập tức vào nơi an toàn.'
      : 'Are you sure you want to regenerate the recovery phrase? Please write it down immediately.';
    if (!confirm(confirmMsg)) return;

    const fresh = generateRecoveryPhrase();
    setRecoveryPhrase(fresh);
    localStorage.setItem('aegis_recovery_phrase', JSON.stringify(fresh));
  };

  const handleCopyPhrase = () => {
    navigator.clipboard.writeText(recoveryPhrase.join(' '));
    setCopiedPhrase(true);
    setTimeout(() => setCopiedPhrase(false), 2000);
  };

  // Export full backup
  const handleExportBackup = () => {
    const backupData = {
      version: '1.0',
      timestamp: Date.now(),
      blockchain: blockchainService.getChain(),
      settings: {
        autoLockMinutes,
      },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AegisVault_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-cyan-400" />
          {t.settingsTitle}
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Quản lý khóa bí mật cục bộ, cụm từ khôi phục dự phòng và tùy chỉnh thời gian tự động khóa bảo vệ.
        </p>
      </div>

      {/* Master Password Setting */}
      <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          Đổi Mật khẩu Chủ (Master Passphrase)
        </h3>

        <form onSubmit={handleUpdatePassword} className="space-y-3 max-w-md">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Mật khẩu mới (tối thiểu 8 ký tự):
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Nhập mật khẩu chủ mới..."
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
              >
                {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Xác nhận mật khẩu mới:
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="Nhập lại mật khẩu..."
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
            >
              Cập nhật Mật khẩu
            </button>
            {passUpdatedMsg && (
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Đã cập nhật thành công!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* 12-Word Recovery Phrase */}
      <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-200">
              {t.recoveryPhraseTitle}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.recoveryPhraseSub}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPhrase}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors flex items-center gap-1.5"
            >
              {copiedPhrase ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPhrase ? 'Đã sao chép' : 'Sao chép 12 từ'}</span>
            </button>

            <button
              onClick={handleRegeneratePhrase}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
              title="Tạo mới cụm từ"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 12 Words Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2">
          {recoveryPhrase.map((word, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-xs"
            >
              <span className="text-slate-400 w-5 text-right">{idx + 1}.</span>
              <span className="text-slate-200 font-semibold">{word}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-Lock Timer */}
      <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          {t.autoLockTimer}
        </h3>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[5, 15, 30, 60, 0].map((mins) => (
            <button
              key={mins}
              onClick={() => setAutoLockMinutes(mins)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                autoLockMinutes === mins
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {mins === 0 ? 'Không bao giờ' : `${mins} ${t.minutes}`}
            </button>
          ))}
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-200">
            {t.exportBackup}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Tải về toàn bộ cấu trúc sổ cái Blockchain và trạng thái tệp tin để lưu trữ ngoại tuyến an toàn.
          </p>
        </div>

        <button
          onClick={handleExportBackup}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-colors self-start sm:self-auto shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{t.exportBackup}</span>
        </button>
      </div>

    </div>
  );
};
