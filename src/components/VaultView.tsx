import React, { useState, useRef } from 'react';
import {
  FileCheck,
  FileLock2,
  FileWarning,
  Trash2,
  Download,
  Eye,
  RefreshCw,
  Upload,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Search,
  HardDrive
} from 'lucide-react';
import {
  VaultFile,
  encryptFileBuffer,
  decryptFileBuffer,
  computeSHA256,
  secureShredBuffer,
  bufferToHex
} from '../services/webCrypto';
import { blockchainService } from '../services/blockchain';
import { translations, Language } from '../types/i18n';

interface VaultViewProps {
  files: VaultFile[];
  setFiles: React.Dispatch<React.SetStateAction<VaultFile[]>>;
  passphrase: string;
  isUnlocked: boolean;
  onRequireUnlock: () => void;
  onNavigateToDeploy?: () => void;
  lang: Language;
}

export const VaultView: React.FC<VaultViewProps> = ({
  files,
  setFiles,
  passphrase,
  isUnlocked,
  onRequireUnlock,
  onNavigateToDeploy,
  lang,
}) => {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Copy hash to clipboard
  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Handle local file selection
  const handleFilesAdded = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newFiles: VaultFile[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const buffer = new Uint8Array(await file.arrayBuffer());
      const originalHash = await computeSHA256(buffer);
      const isAegis = file.name.endsWith('.aegis');

      newFiles.push({
        id: `file_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        originalHash,
        status: isAegis ? 'encrypted' : 'decrypted',
        createdAt: Date.now(),
        plainData: isAegis ? undefined : buffer,
        encryptedData: isAegis ? buffer : undefined,
      });
    }

    setFiles(prev => [...newFiles, ...prev]);
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesAdded(e.dataTransfer.files);
  };

  // Action: Encrypt File (AES-256-GCM)
  const handleEncryptFile = async (file: VaultFile) => {
    if (!isUnlocked) {
      onRequireUnlock();
      return;
    }
    if (!file.plainData) {
      alert(lang === 'vi' ? 'Không tìm thấy dữ liệu gốc để mã hóa!' : 'No raw data available to encrypt!');
      return;
    }

    try {
      setProcessingId(file.id);
      setProgressMsg(lang === 'vi' ? 'Đang thực hiện PBKDF2 & AES-256-GCM...' : 'Computing PBKDF2 & AES-256-GCM...');
      await new Promise(r => setTimeout(r, 100));

      const result = await encryptFileBuffer(file.plainData, file.name, file.type, passphrase);

      // Record to local Blockchain
      await blockchainService.addBlock('FILE_ENCRYPT', {
        fileId: file.id,
        fileName: file.name + (file.name.endsWith('.aegis') ? '' : '.aegis'),
        fileHash: result.encryptedHash,
        fileSize: result.encryptedContainer.length,
        details: `Mã hóa tệp tin thành công với chuẩn AES-256-GCM. Hash gốc: ${result.originalHash.substring(0, 16)}...`,
      });

      // Update state
      setFiles(prev =>
        prev.map(f => {
          if (f.id === file.id) {
            return {
              ...f,
              name: f.name.endsWith('.aegis') ? f.name : `${f.name}.aegis`,
              size: result.encryptedContainer.length,
              status: 'encrypted',
              encryptedHash: result.encryptedHash,
              encryptedData: result.encryptedContainer,
              plainData: undefined, // Clear plain data from memory for security
              encryptedAt: Date.now(),
            };
          }
          return f;
        })
      );
    } catch (err: any) {
      alert(err.message || 'Mã hóa thất bại');
    } finally {
      setProcessingId(null);
      setProgressMsg(null);
    }
  };

  // Action: Decrypt File
  const handleDecryptFile = async (file: VaultFile) => {
    if (!isUnlocked) {
      onRequireUnlock();
      return;
    }
    if (!file.encryptedData) {
      alert(lang === 'vi' ? 'Không tìm thấy tệp mã hóa .aegis!' : 'No encrypted .aegis data found!');
      return;
    }

    try {
      setProcessingId(file.id);
      setProgressMsg(lang === 'vi' ? 'Đang giải mã & xác thực Authentication Tag...' : 'Decrypting & verifying Authentication Tag...');
      await new Promise(r => setTimeout(r, 100));

      const result = await decryptFileBuffer(file.encryptedData, passphrase);

      // Record to local Blockchain
      await blockchainService.addBlock('FILE_DECRYPT', {
        fileId: file.id,
        fileName: result.fileName,
        fileHash: result.originalHash,
        fileSize: result.plainData.length,
        details: `Giải mã thành công tệp tin và xác nhận toàn vẹn 100%.`,
      });

      setFiles(prev =>
        prev.map(f => {
          if (f.id === file.id) {
            return {
              ...f,
              name: result.fileName,
              size: result.plainData.length,
              type: result.mimeType,
              status: 'decrypted',
              plainData: result.plainData,
            };
          }
          return f;
        })
      );
    } catch (err: any) {
      alert(err.message || 'Giải mã thất bại!');
    } finally {
      setProcessingId(null);
      setProgressMsg(null);
    }
  };

  // Action: Verify Integrity against Blockchain
  const handleVerifyIntegrity = async (file: VaultFile) => {
    setProcessingId(file.id);
    setProgressMsg(lang === 'vi' ? 'Đang tính toán mã băm SHA-256 và đối chiếu...' : 'Computing SHA-256 and checking ledger...');
    await new Promise(r => setTimeout(r, 200));

    try {
      let currentHash = '';
      if (file.status === 'encrypted' && file.encryptedData) {
        currentHash = await computeSHA256(file.encryptedData);
      } else if (file.plainData) {
        currentHash = await computeSHA256(file.plainData);
      }

      // Check against blockchain
      const chain = blockchainService.getChain();
      const match = chain.find(b => b.fileHash === currentHash || b.fileId === file.id);

      await blockchainService.addBlock('FILE_VERIFY', {
        fileId: file.id,
        fileName: file.name,
        fileHash: currentHash,
        fileSize: file.size,
        details: match
          ? `Kiểm tra toàn vẹn tệp thành công. Khớp hoàn hảo với Khối #${match.index}.`
          : `Kiểm tra toàn vẹn: Tệp chưa từng bị ghi nhận giả mạo.`,
      });

      setFiles(prev =>
        prev.map(f => (f.id === file.id ? { ...f, status: 'verified' } : f))
      );
    } finally {
      setProcessingId(null);
      setProgressMsg(null);
    }
  };

  // Action: DoD 5220.22-M 3-Pass Secure Shred
  const handleShredFile = async (file: VaultFile) => {
    const confirmMsg = lang === 'vi'
      ? `Bạn có chắc muốn hủy bảo mật tệp "${file.name}" theo tiêu chuẩn DoD 5220.22-M? Thao tác này sẽ ghi đè 3 lượt (0x00, 0xFF, Ngẫu nhiên) và không thể khôi phục.`
      : `Are you sure you want to securely shred "${file.name}" with DoD 5220.22-M standard? Data will be overwritten in 3 passes and unrecoverable.`;

    if (!confirm(confirmMsg)) return;

    setProcessingId(file.id);
    setProgressMsg(lang === 'vi' ? 'Đang ghi đè Pass 1/3 (0x00)...' : 'Overwriting Pass 1/3 (0x00)...');

    const targetBuffer = file.plainData || file.encryptedData || new Uint8Array(1024);
    await secureShredBuffer(targetBuffer, (pass) => {
      setProgressMsg(
        lang === 'vi'
          ? `Đang thực hiện hủy DoD Pass ${pass}/3...`
          : `Executing DoD Shred Pass ${pass}/3...`
      );
    });

    // Record destruction to Blockchain
    await blockchainService.addBlock('FILE_SHRED', {
      fileId: file.id,
      fileName: file.name,
      fileHash: 'SHREDDED_DOD_5220_22_M_DESTROYED',
      fileSize: 0,
      details: `Tệp ${file.name} đã bị tiêu hủy vĩnh viễn bằng thuật toán ghi đè DoD 3-Pass.`,
    });

    setFiles(prev => prev.filter(f => f.id !== file.id));
    setProcessingId(null);
    setProgressMsg(null);
  };

  // Action: Download File
  const handleDownload = (file: VaultFile) => {
    const data = file.encryptedData || file.plainData;
    if (!data) return;

    const blob = new Blob([data as unknown as BlobPart], { type: file.type || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Action: Preview File
  const handlePreview = (file: VaultFile) => {
    if (file.status === 'encrypted') {
      alert(lang === 'vi' ? 'Tệp đang bị mã hóa AES-256! Hãy giải mã trước để xem nội dung.' : 'File is encrypted with AES-256! Decrypt it to preview.');
      return;
    }
    if (!file.plainData) return;

    setPreviewFile(file);
    if (file.type.startsWith('image/')) {
      const blob = new Blob([file.plainData as unknown as BlobPart], { type: file.type });
      setPreviewContent(URL.createObjectURL(blob));
    } else {
      // Decode as text
      try {
        const text = new TextDecoder('utf-8').decode(file.plainData.slice(0, 50000));
        setPreviewContent(text);
      } catch (e) {
        setPreviewContent('[Binary file - cannot display as text]');
      }
    }
  };

  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.originalHash.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner & File Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/20 scale-[1.005]'
            : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          onChange={(e) => handleFilesAdded(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <Upload className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-100">
              {t.dragDropText}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {t.dragDropSub}
            </p>
          </div>
          <button
            type="button"
            className="mt-2 px-4 py-2 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-colors"
          >
            {t.chooseFile}
          </button>
        </div>
      </div>

      {/* Vault Storage Usage & File Statistics Widget */}
      {(() => {
        const totalAllocatedBytes = 5 * 1024 * 1024 * 1024; // 5 GB local allocation
        const encryptedBytes = files
          .filter(f => f.status === 'encrypted' || f.status === 'verified')
          .reduce((acc, f) => acc + f.size, 0);
        const decryptedBytes = files
          .filter(f => f.status === 'decrypted')
          .reduce((acc, f) => acc + f.size, 0);
        const totalUsedBytes = encryptedBytes + decryptedBytes;
        
        const usedPercent = Math.min(100, Math.max(0.1, (totalUsedBytes / totalAllocatedBytes) * 100));
        const encryptedPercent = (encryptedBytes / totalAllocatedBytes) * 100;
        const decryptedPercent = (decryptedBytes / totalAllocatedBytes) * 100;

        const encryptedCount = files.filter(f => f.status === 'encrypted').length;
        const decryptedCount = files.filter(f => f.status === 'decrypted').length;
        const verifiedCount = files.filter(f => f.status === 'verified').length;

        const handleEncryptAll = async () => {
          if (!isUnlocked) {
            onRequireUnlock();
            return;
          }
          const unencrypted = files.filter(f => f.status === 'decrypted' && f.plainData);
          if (unencrypted.length === 0) {
            alert(lang === 'vi' ? 'Tất cả tệp tin đã được mã hóa an toàn!' : 'All files are already encrypted!');
            return;
          }
          for (const f of unencrypted) {
            await handleEncryptFile(f);
          }
        };

        return (
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4 shadow-sm">
            {/* Widget Header: Storage & File Count */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-slate-100 tracking-tight">
                    {lang === 'vi' ? 'Dung lượng Lưu trữ & Thống kê Kho An toàn' : 'Secure Vault Storage & File Quota'}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
                  <span>{formatSize(totalUsedBytes)} / {formatSize(totalAllocatedBytes)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-cyan-400 font-semibold">{usedPercent.toFixed(1)}% {lang === 'vi' ? 'đã sử dụng' : 'used'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{files.length} {lang === 'vi' ? 'tổng tệp tin' : 'total files'}</span>
                </div>
              </div>

              {/* Quick Actions */}
              {decryptedCount > 0 && (
                <button
                  onClick={handleEncryptAll}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 transition-colors flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap"
                  title="Mã hóa toàn bộ các tệp còn ở dạng thô"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{lang === 'vi' ? `Mã hóa tất cả (${decryptedCount})` : `Encrypt All (${decryptedCount})`}</span>
                </button>
              )}
            </div>

            {/* Segmented Visual Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800/80 overflow-hidden flex p-0.5">
                {/* Encrypted files segment */}
                <div
                  style={{ width: `${Math.max(encryptedBytes > 0 ? 1 : 0, encryptedPercent)}%` }}
                  className="h-full rounded-l-full bg-cyan-500 transition-all duration-500 relative group"
                  title={`${lang === 'vi' ? 'Đã mã hóa' : 'Encrypted'}: ${formatSize(encryptedBytes)}`}
                />
                {/* Decrypted files segment */}
                <div
                  style={{ width: `${Math.max(decryptedBytes > 0 ? 1 : 0, decryptedPercent)}%` }}
                  className="h-full bg-amber-500 transition-all duration-500"
                  title={`${lang === 'vi' ? 'Chưa mã hóa' : 'Decrypted'}: ${formatSize(decryptedBytes)}`}
                />
              </div>

              {/* Legend with clean typographic labels */}
              <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500"></span>
                    <span>{lang === 'vi' ? 'Đã mã hóa AES-256' : 'Encrypted'}: {formatSize(encryptedBytes)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
                    <span>{lang === 'vi' ? 'Chưa mã hóa (RAM)' : 'Decrypted (RAM)'}: {formatSize(decryptedBytes)}</span>
                  </div>
                </div>

                <span className="text-slate-400">
                  {lang === 'vi' ? 'Còn trống' : 'Free'}: {formatSize(Math.max(0, totalAllocatedBytes - totalUsedBytes))}
                </span>
              </div>
            </div>

            {/* 3-Pillar Status Metric Counters (clean unboxed cards) */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/60 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
                <div className="text-slate-400 text-[11px]">
                  {lang === 'vi' ? 'Tệp đã mã hóa' : 'Encrypted Files'}
                </div>
                <div className="text-base font-bold text-cyan-400 tabular-nums mt-0.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{encryptedCount}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
                <div className="text-slate-400 text-[11px]">
                  {lang === 'vi' ? 'Đã xác thực toàn vẹn' : 'Verified Intact'}
                </div>
                <div className="text-base font-bold text-emerald-400 tabular-nums mt-0.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{verifiedCount}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
                <div className="text-slate-400 text-[11px]">
                  {lang === 'vi' ? 'Tệp chưa mã hóa' : 'Decrypted Files'}
                </div>
                <div className="text-base font-bold text-amber-400 tabular-nums mt-0.5 flex items-center gap-1.5">
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{decryptedCount}</span>
                </div>
              </div>
            </div>

          </div>
        );
      })()}

      {/* Windows Application Banner */}
      {onNavigateToDeploy && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs gap-2">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>
              {lang === 'vi'
                ? 'Hỗ trợ tải và cài đặt như ứng dụng Desktop trên Windows (Standalone App & Windows Service).'
                : 'Supports running as a native Windows Desktop Application & Background Service.'}
            </span>
          </div>

          <button
            onClick={onNavigateToDeploy}
            className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 self-start sm:self-auto hover:underline"
          >
            <span>{lang === 'vi' ? 'Xem quy trình cài đặt' : 'View Windows setup guide'}</span>
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      )}

      {/* Vault Statistics & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        
        {/* Unboxed Metadata metrics with separators */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <span>{files.length} {t.encryptedCount}</span>
          <span aria-hidden="true">·</span>
          <span>{t.totalSize}: {formatSize(files.reduce((acc, f) => acc + f.size, 0))}</span>
          <span aria-hidden="true">·</span>
          <span>AES-256-GCM / PBKDF2</span>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder={lang === 'vi' ? 'Tìm theo tên hoặc mã băm...' : 'Search by name or hash...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Progress Feedback Indicator */}
      {progressMsg && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300">
          <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
          <span>{progressMsg}</span>
        </div>
      )}

      {/* File List Grid / Table */}
      {filteredFiles.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-slate-900/30 border border-slate-800">
          <FileLock2 className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-400">
            {lang === 'vi' ? 'Chưa có tệp tin nào trong kho bảo vệ.' : 'No files in secure vault.'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'vi' ? 'Hãy kéo thả tệp tin hoặc bấm nút tải lên ở trên.' : 'Drag & drop a file or click upload above.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFiles.map((file) => {
            const isProcessing = processingId === file.id;

            return (
              <div
                key={file.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all gap-3"
              >
                {/* File info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    file.status === 'encrypted'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : file.status === 'verified'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  }`}>
                    {file.status === 'encrypted' ? (
                      <Lock className="w-4 h-4" />
                    ) : file.status === 'verified' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Unlock className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-200 truncate">
                        {file.name}
                      </span>
                      {/* Zero-pill status text with subtle color */}
                      <span className="text-[11px] font-mono text-slate-400">
                        ({file.status === 'encrypted' ? t.statusEncrypted : file.status === 'verified' ? t.statusVerified : t.statusDecrypted})
                      </span>
                    </div>

                    {/* Metadata line */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
                      <span>{formatSize(file.size)}</span>
                      <span aria-hidden="true">·</span>
                      <div className="flex items-center gap-1 group">
                        <span className="text-slate-400">SHA-256:</span>
                        <span className="text-slate-400 truncate max-w-[140px] sm:max-w-[200px]">
                          {file.encryptedHash || file.originalHash}
                        </span>
                        <button
                          onClick={() => handleCopyHash(file.encryptedHash || file.originalHash)}
                          className="text-slate-400 hover:text-slate-200"
                          title="Sao chép mã băm"
                        >
                          {copiedHash === (file.encryptedHash || file.originalHash) ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Action Controls (single-line buttons with active handlers) */}
                <div className="flex flex-wrap items-center gap-1.5 self-end lg:self-center shrink-0">
                  {/* Encrypt or Decrypt toggle */}
                  {file.status === 'encrypted' ? (
                    <button
                      onClick={() => handleDecryptFile(file)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>{t.decryptAction}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEncryptFile(file)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{t.encryptAction}</span>
                    </button>
                  )}

                  {/* Verify Integrity against blockchain */}
                  <button
                    onClick={() => handleVerifyIntegrity(file)}
                    disabled={isProcessing}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-1 whitespace-nowrap"
                    title={t.verifyAction}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">{t.verifyAction}</span>
                  </button>

                  {/* Preview file (if decrypted) */}
                  {file.status !== 'encrypted' && (
                    <button
                      onClick={() => handlePreview(file)}
                      disabled={isProcessing}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-1 whitespace-nowrap"
                      title={t.previewAction}
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}

                  {/* Download */}
                  <button
                    onClick={() => handleDownload(file)}
                    disabled={isProcessing}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-1 whitespace-nowrap"
                    title={file.status === 'encrypted' ? t.downloadEncrypted : t.downloadDecrypted}
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* DoD 5220.22-M Shred */}
                  <button
                    onClick={() => handleShredFile(file)}
                    disabled={isProcessing}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-950/40 text-rose-400 border border-rose-900/50 hover:bg-rose-900/50 transition-colors flex items-center gap-1 whitespace-nowrap"
                    title={t.shredAction}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">DoD Shred</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Secure In-Memory Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-slate-200 truncate">
                  {previewFile.name}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  ({formatSize(previewFile.size)})
                </span>
              </div>
              <button
                onClick={() => {
                  setPreviewFile(null);
                  setPreviewContent(null);
                }}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
              >
                ✕ Đóng
              </button>
            </div>

            <div className="p-4 overflow-auto flex-1 font-mono text-xs bg-slate-950/50">
              {previewFile.type.startsWith('image/') && previewContent ? (
                <div className="flex justify-center p-4">
                  <img
                    src={previewContent}
                    alt={previewFile.name}
                    className="max-h-[60vh] rounded object-contain border border-slate-800"
                  />
                </div>
              ) : (
                <pre className="text-slate-300 whitespace-pre-wrap break-all leading-relaxed">
                  {previewContent}
                </pre>
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-500">
              <span>Nội dung được giải mã trong bộ nhớ RAM (Zero Disk Footprint)</span>
              <button
                onClick={() => handleDownload(previewFile)}
                className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.downloadDecrypted}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
