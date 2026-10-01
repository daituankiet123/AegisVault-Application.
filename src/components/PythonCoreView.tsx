import React, { useState } from 'react';
import {
  Code2,
  Terminal,
  Download,
  Copy,
  Check,
  FolderSync,
  Shield,
  Play,
  Layers,
  Sparkles,
  FileCode,
  Server
} from 'lucide-react';
import { PYTHON_CORE_FILES, downloadPythonPackage } from '../services/pythonBundle';
import { translations, Language } from '../types/i18n';

interface PythonCoreViewProps {
  lang: Language;
}

export const PythonCoreView: React.FC<PythonCoreViewProps> = ({ lang }) => {
  const t = translations[lang];
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [cliCommand, setCliCommand] = useState('python aegis_crypto.py --help');
  const [cliOutput, setCliOutput] = useState<string>(
    `AegisVault Python Cryptographic CLI v1.0
Native Windows Cryptography & Blockchain Daemon
Usage:
  python aegis_crypto.py encrypt <file> <output.aegis> <passphrase>
  python aegis_crypto.py decrypt <file.aegis> <output_file> <passphrase>
  python aegis_crypto.py shred <file_to_wipe>
  python blockchain_ledger.py verify
  python windows_service.py --daemon`
  );
  const [isExecutingCli, setIsExecutingCli] = useState(false);

  const activeFile = PYTHON_CORE_FILES[selectedFileIdx];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunCommand = (cmd: string) => {
    setCliCommand(cmd);
    setIsExecutingCli(true);

    setTimeout(() => {
      setIsExecutingCli(false);
      if (cmd.includes('aegis_crypto.py encrypt')) {
        setCliOutput(`[AegisCrypto] Initializing PBKDF2HMAC (600,000 rounds, SHA-256)...
[AegisCrypto] Generated 16-byte random salt and 12-byte random IV.
[AegisCrypto] AES-256-GCM authenticated encryption complete.
[AegisCrypto] Output written: confidential_report.pdf.aegis (34,112 bytes)
[Blockchain] Block #4 generated and chained. Merkle Root: a9f830...
[Status] File successfully protected.`);
      } else if (cmd.includes('blockchain_ledger.py verify')) {
        setCliOutput(`[BlockchainAudit] Reading %USERPROFILE%\\.aegis_vault\\blockchain_ledger.json
[BlockchainAudit] Traversing 6 chained blocks from Genesis (Block #0)...
  -> Block #0: Genesis Valid (Signature: 4b291a...)
  -> Block #1: SHA-256 Hash Match · PrevHash Chain Intact
  -> Block #2: SHA-256 Hash Match · PrevHash Chain Intact
  -> Block #3: SHA-256 Hash Match · PrevHash Chain Intact
  -> Block #4: SHA-256 Hash Match · PrevHash Chain Intact
  -> Block #5: SHA-256 Hash Match · PrevHash Chain Intact
[RESULT] Toàn bộ chuỗi khối hợp lệ và an toàn tuyệt đối 100%.`);
      } else if (cmd.includes('windows_service.py --daemon')) {
        setCliOutput(`[AegisVaultSvc] Starting AegisVault Windows System Daemon...
[AegisVaultSvc] Monitored Watch Folder: C:\\Users\\User\\AegisVault\\AutoProtect
[AegisVaultSvc] Encrypted Vault Target: C:\\Users\\User\\AegisVault\\EncryptedVault
[AegisVaultSvc] Heartbeat loop active (polling interval: 1.5s).
[AegisVaultSvc] Background thread running smoothly.`);
      } else if (cmd.includes('windows_service.py install')) {
        setCliOutput(`[Win32Service] Registering Windows Service 'AegisVaultSvc'...
[Win32Service] Service Name: AegisVaultSvc
[Win32Service] Display Name: AegisVault Local Data Protection Service
[Win32Service] Service registered with Auto-Start on Windows boot.`);
      } else {
        setCliOutput(`[CMD] Executed: ${cmd}\nExit code: 0 (OK)`);
      }
    }, 400);
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between p-6 rounded-xl bg-slate-900/60 border border-slate-800 gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cyan-400" />
            {t.pythonTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {t.pythonSub}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Download Full Python Windows Package */}
          <button
            onClick={downloadPythonPackage}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>{t.downloadZip}</span>
          </button>
        </div>
      </div>

      {/* Architecture Highlights (3-column cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
            <Shield className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">1. Thư viện Cryptography</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Sử dụng thư viện <code>cryptography</code> tiêu chuẩn công nghiệp với thuật toán AES-256-GCM, PBKDF2 (600,000 vòng) và tiêu hủy DoD 3-Pass.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">2. Sổ cái Blockchain cục bộ</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Mỗi thao tác tệp tin tự động nối khối vào Blockchain cục bộ với Merkle root và hàm băm SHA-256, ngăn chặn ransomware âm thầm can thiệp.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
            <Server className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">3. Windows Service & Tray</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Tích hợp Windows Service (<code>win32service</code>) và thư mục giám sát ngầm, kèm khay hệ thống (System Tray) tiện lợi.
          </p>
        </div>
      </div>

      {/* Code Viewer Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
        
        {/* File Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-2 overflow-x-auto">
          <div className="flex items-center gap-1 py-1.5">
            {PYTHON_CORE_FILES.map((file, idx) => (
              <button
                key={file.filename}
                onClick={() => setSelectedFileIdx(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  selectedFileIdx === idx
                    ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{file.filename}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-3 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors whitespace-nowrap my-1 mr-2"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">{t.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{t.copyCode}</span>
              </>
            )}
          </button>
        </div>

        {/* File Description kicker */}
        <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/60 text-xs text-slate-400 font-mono flex items-center justify-between">
          <span>{activeFile.description}</span>
          <span className="text-slate-400">{activeFile.content.split('\n').length} dòng</span>
        </div>

        {/* Source Code Content */}
        <div className="p-4 max-h-[460px] overflow-auto text-xs font-mono">
          <pre className="text-slate-300 leading-relaxed whitespace-pre font-mono">
            {activeFile.content}
          </pre>
        </div>
      </div>

      {/* Simulated Interactive Python CLI / Windows Terminal */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-slate-200">
              Windows PowerShell & Python CLI Simulation
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[11px] font-mono text-emerald-400">READY</span>
          </div>
        </div>

        {/* Quick Command Presets */}
        <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/60 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono">Lệnh mẫu:</span>
          
          <button
            onClick={() => handleRunCommand('python aegis_crypto.py encrypt confidential_report.pdf confidential_report.pdf.aegis SecretPass123')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 font-mono text-[11px] transition-colors"
          >
            Mã hóa tệp (encrypt)
          </button>

          <button
            onClick={() => handleRunCommand('python blockchain_ledger.py verify')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono text-[11px] transition-colors"
          >
            Kiểm toán sổ cái (verify)
          </button>

          <button
            onClick={() => handleRunCommand('python windows_service.py --daemon')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 font-mono text-[11px] transition-colors"
          >
            Khởi động nền (daemon)
          </button>

          <button
            onClick={() => handleRunCommand('python windows_service.py install')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-400 font-mono text-[11px] transition-colors"
          >
            Cài Windows Service
          </button>
        </div>

        {/* Terminal Output */}
        <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 min-h-[140px]">
          <div className="text-slate-500 mb-2">PS C:\Users\User\AegisVaultEngine&gt; {cliCommand}</div>
          {isExecutingCli ? (
            <div className="flex items-center gap-2 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>Đang thực thi lệnh Python trong luồng nền Windows...</span>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap leading-relaxed text-slate-200">
              {cliOutput}
            </pre>
          )}
        </div>
      </div>

    </div>
  );
};
