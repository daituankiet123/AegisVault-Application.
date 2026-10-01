import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, Lock, Unlock, Globe, AppWindow, Download, User, LogOut } from 'lucide-react';
import { translations, Language } from '../types/i18n';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { UserProfile } from './AuthView';

interface HeaderProps {
  currentTab: 'vault' | 'blockchain' | 'python' | 'audit' | 'deploy' | 'settings';
  onSelectTab: (tab: 'vault' | 'blockchain' | 'python' | 'audit' | 'deploy' | 'settings') => void;
  isUnlocked: boolean;
  onLockToggle: () => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  lang: Language;
  onToggleLang: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  isUnlocked,
  onLockToggle,
  currentUser,
  onLogout,
  lang,
  onToggleLang,
}) => {
  const t = translations[lang];
  const { isInstallable, isInstalled, install } = usePWAInstall();

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Zone 1: Single text element wordmark with icon */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-950">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              AegisVault
              <span className="text-[10px] font-mono tracking-wider font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Win-Local
              </span>
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (single line, clean text with active hover) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onSelectTab('vault')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              currentTab === 'vault'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.navVault}
          </button>
          
          <button
            onClick={() => onSelectTab('blockchain')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              currentTab === 'blockchain'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.navBlockchain}
          </button>

          <button
            onClick={() => onSelectTab('python')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              currentTab === 'python'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {t.navPython}
          </button>

          <button
            onClick={() => onSelectTab('audit')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              currentTab === 'audit'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.navAudit}
          </button>

          <button
            onClick={() => onSelectTab('deploy')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
              currentTab === 'deploy'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AppWindow className="w-3.5 h-3.5" />
            <span>{t.navDeploy}</span>
          </button>

          <button
            onClick={() => onSelectTab('settings')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              currentTab === 'settings'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.navSettings}
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* In-App PWA Install Button */}
          {!isInstalled && isInstallable && (
            <button
              onClick={install}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap animate-pulse"
              title="Cài đặt AegisVault như ứng dụng độc lập trên Windows"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Cài đặt Desktop App</span>
            </button>
          )}

          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800 transition-colors"
            title="Đổi ngôn ngữ / Switch language"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="uppercase">{lang}</span>
          </button>

          {/* User Profile Badge */}
          {currentUser && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">
                {currentUser.displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-slate-200 font-semibold max-w-[100px] truncate">
                {currentUser.displayName}
              </span>
            </div>
          )}

          {/* Vault Lock / Unlock toggle button */}
          <button
            onClick={onLockToggle}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              isUnlocked
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
            }`}
          >
            {isUnlocked ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>{t.vaultUnlocked}</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>{t.vaultLocked}</span>
              </>
            )}
          </button>

          {/* Logout button */}
          {currentUser && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-slate-800 transition-colors"
              title="Đăng xuất khỏi kho / Khóa hoàn toàn"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>

      {/* Mobile subnavigation */}
      <div className="flex md:hidden border-t border-slate-800/80 px-4 py-2 overflow-x-auto gap-2 text-xs">
        <button
          onClick={() => onSelectTab('vault')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'vault' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}
        >
          {t.navVault}
        </button>
        <button
          onClick={() => onSelectTab('blockchain')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'blockchain' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}
        >
          {t.navBlockchain}
        </button>
        <button
          onClick={() => onSelectTab('python')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'python' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}
        >
          {t.navPython}
        </button>
        <button
          onClick={() => onSelectTab('audit')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'audit' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}
        >
          {t.navAudit}
        </button>
        <button
          onClick={() => onSelectTab('deploy')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'deploy' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}
        >
          {t.navDeploy}
        </button>
        <button
          onClick={() => onSelectTab('settings')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'settings' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}
        >
          {t.navSettings}
        </button>
      </div>
    </header>
  );
};
