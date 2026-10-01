import React, { useState } from 'react';
import {
  AppWindow,
  Download,
  ShieldCheck,
  Terminal,
  CheckCircle2,
  FolderLock,
  Layers,
  ExternalLink,
  Laptop,
  Play,
  Copy,
  Check,
  ChevronRight,
  HardDrive
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { downloadPythonPackage } from '../services/pythonBundle';
import { translations, Language } from '../types/i18n';

interface WindowsAppDeployViewProps {
  lang: Language;
}

export const WindowsAppDeployView: React.FC<WindowsAppDeployViewProps> = ({ lang }) => {
  const t = translations[lang];
  const { isInstallable, isInstalled, isWindows, install } = usePWAInstall();
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pwa' | 'service' | 'exe'>('pwa');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(id);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Laptop className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                {lang === 'vi' ? 'Quy trình Cài đặt & Sử dụng AegisVault trên Windows' : 'Install & Run AegisVault on Windows'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              {lang === 'vi'
                ? 'Ứng dụng hỗ trợ chạy như một Windows Desktop Application độc lập với giao diện riêng biệt, tự động chạy ngầm dưới dạng Windows Background Service để bảo vệ toàn diện dữ liệu máy tính.'
                : 'AegisVault runs as a native standalone Windows Desktop App with its own window, and can run in the background as a Windows Service for automated continuous file protection.'}
            </p>
          </div>

          {/* Quick Install Action Button */}
          <div className="shrink-0">
            {isInstalled ? (
              <div className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'vi' ? 'Đã cài đặt trên Windows' : 'Installed as Desktop App'}</span>
              </div>
            ) : isInstallable ? (
              <button
                onClick={install}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-950 flex items-center gap-2 transition-all transform hover:scale-[1.02]"
              >
                <AppWindow className="w-4 h-4" />
                <span>{lang === 'vi' ? 'Cài đặt Desktop App Ngay' : 'Install Windows Desktop App'}</span>
              </button>
            ) : (
              <button
                onClick={downloadPythonPackage}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-950 flex items-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>{lang === 'vi' ? 'Tải Trọn bộ Gói Cài đặt (.zip)' : 'Download Windows Package (.zip)'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Deployment Modes Selection Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-medium">
        <button
          onClick={() => setActiveTab('pwa')}
          className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'pwa'
              ? 'bg-slate-800 text-cyan-400 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AppWindow className="w-4 h-4" />
          <span>Cách 1: Cài đặt Desktop App (Khuyên dùng)</span>
        </button>

        <button
          onClick={() => setActiveTab('service')}
          className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'service'
              ? 'bg-slate-800 text-cyan-400 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Cách 2: Windows Background Service</span>
        </button>

        <button
          onClick={() => setActiveTab('exe')}
          className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'exe'
              ? 'bg-slate-800 text-cyan-400 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Cách 3: Đóng gói Standalone .exe</span>
        </button>
      </div>

      {/* Tab 1: PWA Desktop App Walkthrough */}
      {activeTab === 'pwa' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <AppWindow className="w-4 h-4 text-cyan-400" />
              Cách 1: Chạy như Ứng dụng Desktop Windows Độc lập (Standalone App)
            </h3>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Ứng dụng có thể được cài đặt trực tiếp vào hệ điều hành Windows qua công nghệ Progressive Web App (PWA) thế hệ mới. Khi cài đặt xong:
            </p>

            <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono text-slate-300">
              <li className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Xuất hiện trên Start Menu & Desktop Icon của Windows</span>
              </li>
              <li className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Chạy trong cửa sổ riêng biệt không thanh địa chỉ trình duyệt</span>
              </li>
              <li className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Bảo mật dữ liệu 5 GB lưu trữ an toàn trong máy tính</span>
              </li>
            </ul>

            {/* Step-by-Step Installation Instructions */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <span className="font-bold text-slate-200">Hướng dẫn Cài đặt 3 Bước trên Trình duyệt Edge / Chrome:</span>
              
              <div className="space-y-2 text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-400 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                  <span>Bấm vào nút <strong>"Cài đặt Desktop App Ngay"</strong> ở góc trên bên phải trang này.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-400 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                  <span>Hoặc trên thanh địa chỉ trình duyệt Edge/Chrome, bấm vào biểu tượng <strong>"Cài đặt ứng dụng" (Cài đặt AegisVault)</strong>.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-400 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                  <span>Chọn <strong>"Cài đặt" (Install)</strong>. Ứng dụng sẽ tự động ghim vào thanh Taskbar Windows của bạn!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Windows Background Service Walkthrough */}
      {activeTab === 'service' && (
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            Cách 2: Đăng ký Dịch vụ Nền tảng Hệ thống Windows (Background Service)
          </h3>

          <p className="text-xs text-slate-400 leading-relaxed">
            Dành cho máy tính cần tự động bảo vệ tệp tin 24/7 không cần mở giao diện. Dịch vụ tự khởi chạy khi bật máy tính Windows (`AegisVaultSvc`).
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-cyan-400 font-semibold">Tập tin cài đặt tự động (Run as Administrator):</span>
                <button
                  onClick={() => handleCopy("python_core\\install_windows_service.bat", "bat")}
                  className="text-slate-400 hover:text-slate-200"
                >
                  {copiedScript === 'bat' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="text-slate-300 text-[11px]">
{`cd python_core
install_windows_service.bat`}
              </pre>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-emerald-400 font-semibold">Lệnh kiểm tra trạng thái trong Services.msc:</span>
                <button
                  onClick={() => handleCopy("sc query AegisVaultSvc", "sc")}
                  className="text-slate-400 hover:text-slate-200"
                >
                  {copiedScript === 'sc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="text-slate-300 text-[11px]">
{`sc query AegisVaultSvc
# Trạng thái mong đợi: STATE: 4 RUNNING`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Build Standalone .exe with PyInstaller */}
      {activeTab === 'exe' && (
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            Cách 3: Đóng gói Tệp Thực thi Độc lập (.exe) cho Windows
          </h3>

          <p className="text-xs text-slate-400 leading-relaxed">
            Bạn có thể biên dịch toàn bộ mã nguồn Python thành một tệp nhị phân `.exe` duy nhất bằng <code>PyInstaller</code>, có thể chạy trên bất kỳ máy Windows nào mà không cần cài đặt Python.
          </p>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-cyan-400">Lệnh đóng gói PyInstaller:</span>
              <button
                onClick={() => handleCopy(`pip install pyinstaller cryptography watchdog pystray\npyinstaller --onefile --noconsole --name "AegisVault" --icon=icon.ico windows_tray.py`, "pyinstaller")}
                className="text-slate-400 hover:text-slate-200"
              >
                {copiedScript === 'pyinstaller' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <pre className="text-slate-200 text-[11px] whitespace-pre-wrap leading-relaxed">
{`# 1. Cài đặt công cụ đóng gói:
pip install pyinstaller cryptography watchdog pystray

# 2. Biên dịch thành tệp AegisVault.exe duy nhất:
pyinstaller --onefile --noconsole --name "AegisVault" windows_tray.py

# Kết quả: Tệp dist\\AegisVault.exe sẵn sàng chạy trên Windows!`}
            </pre>
          </div>
        </div>
      )}

      {/* 4-Step Master Workflow Card */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Quy trình 4 Bước Chuẩn Hóa Hoàn Thiện Triển Khai trên Máy tính Windows
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <div className="text-cyan-400 font-bold text-sm">BƯỚC 1</div>
            <div className="font-semibold text-slate-200">Cài đặt Ứng dụng</div>
            <p className="text-[11px] text-slate-400">Bấm Cài đặt Desktop App hoặc tải bộ mã nguồn (.zip) về máy.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <div className="text-cyan-400 font-bold text-sm">BƯỚC 2</div>
            <div className="font-semibold text-slate-200">Đăng ký Dịch vụ</div>
            <p className="text-[11px] text-slate-400">Chạy file <code>install_windows_service.bat</code> với quyền Admin.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <div className="text-cyan-400 font-bold text-sm">BƯỚC 3</div>
            <div className="font-semibold text-slate-200">Theo dõi Thư mục</div>
            <p className="text-[11px] text-slate-400">Mọi file lưu vào <code>AegisVault\AutoProtect</code> tự động mã hóa AES-256.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <div className="text-emerald-400 font-bold text-sm">BƯỚC 4</div>
            <div className="font-semibold text-slate-200">Kiểm toán Blockchain</div>
            <p className="text-[11px] text-slate-400">Kiểm tra tính toàn vẹn 5 GB dữ liệu với Merkle State Root & ZK Proofs.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
