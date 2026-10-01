/**
 * AegisVault - Windows Local Blockchain & E2EE File Protection
 * Core Application Entrypoint
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { VaultView } from './components/VaultView';
import { BlockchainView } from './components/BlockchainView';
import { PythonCoreView } from './components/PythonCoreView';
import { TamperAuditView } from './components/TamperAuditView';
import { WindowsAppDeployView } from './components/WindowsAppDeployView';
import { SettingsView } from './components/SettingsView';
import { UnlockModal } from './components/UnlockModal';
import { AuthView, UserProfile } from './components/AuthView';
import { VaultFile, generateRecoveryPhrase, computeSHA256 } from './services/webCrypto';
import { blockchainService } from './services/blockchain';
import { Language } from './types/i18n';
import { ShieldCheck, HardDrive, Cpu, Terminal } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'vault' | 'blockchain' | 'python' | 'audit' | 'deploy' | 'settings'>('vault');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passphrase, setPassphrase] = useState<string>('Aegis@MasterKey2026');
  const [recoveryPhrase, setRecoveryPhrase] = useState<string[]>([]);
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(15);
  const [lang, setLang] = useState<Language>('vi');
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState<boolean>(false);
  const [files, setFiles] = useState<VaultFile[]>([]);

  // Check saved user profile
  useEffect(() => {
    const savedProf = localStorage.getItem('aegis_user_profile');
    if (savedProf) {
      try {
        const parsed = JSON.parse(savedProf);
        setCurrentUser(parsed);
      } catch (e) {
        // Fallback
      }
    }
  }, []);

  // Initialize demo files and recovery phrase
  useEffect(() => {
    // Recovery phrase
    const savedPhrase = localStorage.getItem('aegis_recovery_phrase');
    if (savedPhrase) {
      try {
        setRecoveryPhrase(JSON.parse(savedPhrase));
      } catch (e) {
        const fresh = generateRecoveryPhrase();
        setRecoveryPhrase(fresh);
        localStorage.setItem('aegis_recovery_phrase', JSON.stringify(fresh));
      }
    } else {
      const fresh = generateRecoveryPhrase();
      setRecoveryPhrase(fresh);
      localStorage.setItem('aegis_recovery_phrase', JSON.stringify(fresh));
    }

    // Initialize initial sample files in vault
    async function initSampleFiles() {
      const docData = new TextEncoder().encode(
        "BÁO CÁO KIỂM TOÁN AN TOÀN THÔNG TIN WINDOWS 2026\n==============================================\n" +
        "Mức độ bảo mật: Tuyệt mật (Strictly Confidential)\n" +
        "Thuật toán mã hóa: AES-256-GCM với PBKDF2 (600,000 vòng lặp)\n" +
        "Liên kết toàn vẹn: Blockchain Cục bộ SHA-256 Merkle Tree\n" +
        "Tình trạng xác thực: Đã phê duyệt và lưu trữ an toàn."
      );
      const codeData = new TextEncoder().encode(
        "import cryptography\nprint('AegisVault Python Windows Engine Active')\n"
      );

      const docHash = await computeSHA256(docData);
      const codeHash = await computeSHA256(codeData);

      const sampleFiles: VaultFile[] = [
        {
          id: 'demo_file_1',
          name: 'BaoCao_KiemToan_BaoMat_2026.docx',
          size: docData.length,
          type: 'text/plain',
          originalHash: docHash,
          status: 'decrypted',
          createdAt: Date.now() - 3600000,
          plainData: docData,
        },
        {
          id: 'demo_file_2',
          name: 'DuLieu_HeThong_Windows.py',
          size: codeData.length,
          type: 'text/x-python',
          originalHash: codeHash,
          status: 'decrypted',
          createdAt: Date.now() - 7200000,
          plainData: codeData,
        }
      ];

      setFiles(sampleFiles);

      // Record first demo to blockchain if not already present
      const currentChain = blockchainService.getChain();
      if (currentChain.length <= 1) {
        await blockchainService.addBlock('FILE_VERIFY', {
          fileId: 'demo_file_1',
          fileName: 'BaoCao_KiemToan_BaoMat_2026.docx',
          fileHash: docHash,
          fileSize: docData.length,
          details: 'Khởi tạo tệp mẫu bảo mật trong kho lưu trữ cục bộ.',
        });
      }
    }

    initSampleFiles();
  }, []);

  // Auto-lock timer effect
  useEffect(() => {
    if (autoLockMinutes === 0 || !isUnlocked) return;
    const timer = setTimeout(() => {
      setIsUnlocked(false);
    }, autoLockMinutes * 60 * 1000);
    return () => clearTimeout(timer);
  }, [autoLockMinutes, isUnlocked]);

  const handleLockToggle = () => {
    if (isUnlocked) {
      setIsUnlocked(false);
    } else {
      setIsUnlockModalOpen(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsUnlocked(false);
  };

  // Render Full-Screen Login & Registration Portal if not authenticated
  if (!isAuthenticated) {
    return (
      <AuthView
        lang={lang}
        onToggleLang={() => setLang(prev => (prev === 'vi' ? 'en' : 'vi'))}
        onLoginSuccess={(userProf, plainPass) => {
          setCurrentUser(userProf);
          setPassphrase(plainPass);
          setIsAuthenticated(true);
          setIsUnlocked(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Bar Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isUnlocked={isUnlocked}
        onLockToggle={handleLockToggle}
        currentUser={currentUser}
        onLogout={handleLogout}
        lang={lang}
        onToggleLang={() => setLang(prev => (prev === 'vi' ? 'en' : 'vi'))}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'vault' && (
          <VaultView
            files={files}
            setFiles={setFiles}
            passphrase={passphrase}
            isUnlocked={isUnlocked}
            onRequireUnlock={() => setIsUnlockModalOpen(true)}
            onNavigateToDeploy={() => setCurrentTab('deploy')}
            lang={lang}
          />
        )}

        {currentTab === 'blockchain' && (
          <BlockchainView lang={lang} />
        )}

        {currentTab === 'python' && (
          <PythonCoreView lang={lang} />
        )}

        {currentTab === 'audit' && (
          <TamperAuditView lang={lang} />
        )}

        {currentTab === 'deploy' && (
          <WindowsAppDeployView lang={lang} />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            passphrase={passphrase}
            setPassphrase={setPassphrase}
            recoveryPhrase={recoveryPhrase}
            setRecoveryPhrase={setRecoveryPhrase}
            autoLockMinutes={autoLockMinutes}
            setAutoLockMinutes={setAutoLockMinutes}
            lang={lang}
          />
        )}
      </main>

      {/* Clean Unobtrusive Local Windows Status Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">Windows Local Daemon: Online</span>
            <span aria-hidden="true">·</span>
            <span>AES-256-GCM Hardware Cipher</span>
            <span aria-hidden="true">·</span>
            <span>Zero Server Footprint</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>AegisVault Windows Protection</span>
            <span aria-hidden="true">·</span>
            <span>PBKDF2 600,000 Rounds</span>
          </div>
        </div>
      </footer>

      {/* Unlock Passphrase Modal */}
      <UnlockModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        onUnlockSuccess={() => {
          setIsUnlocked(true);
          setIsUnlockModalOpen(false);
        }}
        correctPassphrase={passphrase}
        lang={lang}
      />

    </div>
  );
}
