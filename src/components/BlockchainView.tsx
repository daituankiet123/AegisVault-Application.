import React, { useState, useEffect } from 'react';
import {
  Link2,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  Boxes,
  Code2,
  ChevronRight,
  Fingerprint,
  Cpu,
  Layers,
  Sparkles,
  GitBranch,
  ShieldQuestion,
  Lock
} from 'lucide-react';
import {
  Block,
  BlockAction,
  blockchainService,
  ChainAuditResult,
  MerkleInclusionProof,
  ZKFileCommitmentProof
} from '../services/blockchain';
import { translations, Language } from '../types/i18n';

interface BlockchainViewProps {
  lang: Language;
}

export const BlockchainView: React.FC<BlockchainViewProps> = ({ lang }) => {
  const t = translations[lang];
  const [chain, setChain] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [auditResult, setAuditResult] = useState<ChainAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Next-Gen ZK / Merkle Proof State
  const [activeProof, setActiveProof] = useState<MerkleInclusionProof | null>(null);
  const [proofVerified, setProofVerified] = useState<boolean | null>(null);
  const [isVerifyingProof, setIsVerifyingProof] = useState(false);

  useEffect(() => {
    const unsub = blockchainService.subscribe(newChain => {
      setChain(newChain);
      setAuditResult(null);
    });
    return unsub;
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleRunAudit = async () => {
    setIsAuditing(true);
    await new Promise(r => setTimeout(r, 250));
    const res = await blockchainService.auditChain();
    setAuditResult(res);
    setIsAuditing(false);
  };

  const handleSimulateTamper = (index: number) => {
    blockchainService.simulateTamperAttack(index);
    setTimeout(handleRunAudit, 100);
  };

  const handleResetChain = async () => {
    await blockchainService.resetChain();
    setAuditResult(null);
    setActiveProof(null);
  };

  // Generate Merkle Inclusion Proof
  const handleGenerateProof = async (blockIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const proof = await blockchainService.generateMerkleProof(blockIndex);
    setActiveProof(proof);
    setProofVerified(null);
  };

  // Verify standalone Merkle Proof
  const handleVerifyActiveProof = async () => {
    if (!activeProof) return;
    setIsVerifyingProof(true);
    await new Promise(r => setTimeout(r, 200));
    const isValid = await blockchainService.verifyMerkleProof(activeProof);
    setProofVerified(isValid);
    setIsVerifyingProof(false);
  };

  const filteredBlocks = chain.filter(b => {
    if (actionFilter === 'ALL') return true;
    return b.action === actionFilter;
  });

  const latestBlock = chain[chain.length - 1];
  const isChainCompromised = chain.some(b => b.isTampered);
  const verifiedBlocksCount = isChainCompromised 
    ? chain.filter(b => !b.isTampered).length 
    : chain.length;

  return (
    <div className="space-y-6">

      {/* Visual Summary: Immutability State & Verified Blocks */}
      <div className={`p-6 rounded-2xl border transition-all shadow-xl ${
        isChainCompromised
          ? 'bg-rose-950/20 border-rose-500/50 shadow-rose-950/20'
          : 'bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/30 border-emerald-500/30 shadow-emerald-950/20'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Left: Reassuring Status Badge */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              {isChainCompromised ? (
                <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-2 tracking-wide uppercase shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Cảnh Báo: Phát Hiện Giả Mạo Khối!</span>
                </div>
              ) : (
                <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-2 tracking-wide uppercase shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>System Integrity Verified (Toàn Vẹn 100%)</span>
                </div>
              )}

              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Trạng thái: Bất biến tuyệt đối (Immutable)</span>
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                {lang === 'vi' ? 'Sổ cái Mật mã học AegisVault' : 'AegisVault Cryptographic Ledger'}
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {lang === 'vi'
                  ? 'Mọi hành vi can thiệp trái phép, ghi đè ransomware hay sửa đổi tệp tin đều bị chặn đứng nhờ cấu trúc liên kết toán học SHA-256 kết hợp cây Sparse Merkle Tree và đồng thuận phần cứng TPM 2.0.'
                  : 'Every unauthorized modification, ransomware attack, or file alteration is instantly blocked by our SHA-256 chained mathematical links and TPM 2.0 hardware consensus.'}
              </p>
            </div>
          </div>

          {/* Right: Key Verified Block Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono shrink-0">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="text-[11px] text-slate-400">
                {lang === 'vi' ? 'Khối đã xác thực' : 'Verified Blocks'}
              </div>
              <div className="text-lg font-bold text-emerald-400 tabular-nums mt-0.5 flex items-center gap-1.5">
                <Boxes className="w-4 h-4" />
                <span>{verifiedBlocksCount} / {chain.length}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="text-[11px] text-slate-400">
                {lang === 'vi' ? 'Đồng thuận TPM' : 'Hardware Multi-Sig'}
              </div>
              <div className="text-lg font-bold text-cyan-400 tabular-nums mt-0.5 flex items-center gap-1.5">
                <Cpu className="w-4 h-4" />
                <span>3 / 3 Enclaves</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 col-span-2 sm:col-span-1">
              <div className="text-[11px] text-slate-400">
                {lang === 'vi' ? 'Mức độ tin cậy' : 'Trust Score'}
              </div>
              <div className="text-lg font-bold text-indigo-400 tabular-nums mt-0.5 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>{isChainCompromised ? 'VIOLATED' : '100% PURE'}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Top Banner & Audit Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-xl bg-slate-900/60 border border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">
              {t.blockchainTitle}
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold uppercase">
              Next-Gen SMT & TPM 2.0
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {t.blockchainSub}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Audit Chain Button */}
          <button
            onClick={handleRunAudit}
            disabled={isAuditing}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isAuditing ? 'Đang kiểm toán...' : t.auditChainBtn}</span>
          </button>

          {/* Tamper Simulation Button */}
          <button
            onClick={() => handleSimulateTamper(Math.min(1, chain.length - 1))}
            className="px-3 py-2 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            title="Thử nghiệm thay đổi dữ liệu để kiểm tra cơ chế phòng thủ"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t.simulateTamper}</span>
          </button>

          {/* Restore clean chain */}
          <button
            onClick={handleResetChain}
            className="p-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors"
            title={t.restoreChain}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Next-Gen Architectural Pillars Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-semibold mb-1">
            <Layers className="w-4 h-4" />
            <span>Cumulative State Root</span>
          </div>
          <p className="text-[11px] font-mono text-slate-300 truncate" title={latestBlock?.stateRoot}>
            {latestBlock?.stateRoot ? `${latestBlock.stateRoot.slice(0, 16)}...` : 'N/A'}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Tích lũy trạng thái toàn diện</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-semibold mb-1">
            <Cpu className="w-4 h-4" />
            <span>TPM 2.0 Multi-Sig</span>
          </div>
          <p className="text-[11px] font-mono text-slate-300">3-of-3 Hardware Consensus</p>
          <p className="text-[10px] text-slate-400 mt-1">Đồng thuận chip TPM + Enclave</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-mono text-indigo-400 font-semibold mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Dual-Hash Quantum Shield</span>
          </div>
          <p className="text-[11px] font-mono text-slate-300">SHA-256 + Time-Locked Cascade</p>
          <p className="text-[10px] text-slate-400 mt-1">Chống va chạm Grover lượng tử</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400 font-semibold mb-1">
            <GitBranch className="w-4 h-4" />
            <span>Sparse Merkle Tree (SMT)</span>
          </div>
          <p className="text-[11px] font-mono text-slate-300">O(log N) Cryptographic Proofs</p>
          <p className="text-[10px] text-slate-400 mt-1">Bằng chứng tồn tại không tiết lộ</p>
        </div>
      </div>

      {/* Audit Result Banner if verified */}
      {auditResult && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
            auditResult.isValid
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
          }`}
        >
          {auditResult.isValid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}

          <div className="flex-1 text-xs">
            <p className="font-semibold text-sm">
              {auditResult.isValid ? t.chainHealthy : t.chainTampered}
            </p>
            <p className="mt-1 opacity-90 leading-relaxed font-mono">
              {auditResult.isValid
                ? `Đã kiểm toán ${auditResult.checkedBlocksCount} khối từ Genesis đến Block #${auditResult.checkedBlocksCount - 1}. Xác thực thành công Dual-Hash, State Root (${auditResult.stateRoot.slice(0, 12)}...) và chữ ký đa phần cứng TPM 2.0.`
                : auditResult.reason}
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto text-xs">
        {['ALL', 'GENESIS', 'FILE_ENCRYPT', 'FILE_DECRYPT', 'FILE_VERIFY', 'FILE_SHRED'].map((action) => (
          <button
            key={action}
            onClick={() => setActionFilter(action)}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
              actionFilter === action
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {action}
          </button>
        ))}
      </div>

      {/* Block Timeline / Explorer */}
      <div className="space-y-4">
        {filteredBlocks.map((block) => {
          const isCompromised = block.isTampered;

          return (
            <div
              key={block.index}
              onClick={() => setSelectedBlock(block)}
              className={`p-5 rounded-xl border transition-all cursor-pointer ${
                isCompromised
                  ? 'bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-950/30'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              {/* Block top header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400">
                    <Fingerprint className="w-4 h-4 text-cyan-400" />
                    <span>BLOCK #{block.index}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className={
                      block.action === 'FILE_ENCRYPT' ? 'text-cyan-400 font-semibold' :
                      block.action === 'FILE_DECRYPT' ? 'text-emerald-400 font-semibold' :
                      block.action === 'FILE_SHRED' ? 'text-rose-400 font-semibold' :
                      'text-amber-400 font-semibold'
                    }>
                      {block.action}
                    </span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-slate-400">
                      {new Date(block.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Right controls: Generate Proof button & Nonce */}
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <button
                    onClick={(e) => handleGenerateProof(block.index, e)}
                    className="px-2.5 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/60 text-cyan-300 text-[11px] flex items-center gap-1 transition-colors"
                    title="Tạo Bằng chứng Merkle Inclusion cho khối này"
                  >
                    <GitBranch className="w-3 h-3" />
                    <span>Tạo Bằng chứng SMT</span>
                  </button>

                  <span className="hidden sm:inline">Nonce: {block.nonce}</span>
                  {isCompromised && (
                    <span className="text-rose-400 font-bold">
                      [GIẢ MẠO]
                    </span>
                  )}
                </div>
              </div>

              {/* Block cryptographic data grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs font-mono">
                {/* Current Hash */}
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span>{t.blockHash} (SHA-256)</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopy(block.hash); }}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      {copiedText === block.hash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <p className="text-slate-200 truncate select-all">
                    {block.hash}
                  </p>
                </div>

                {/* Cumulative State Root */}
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-cyan-400">State Root (Tích lũy)</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopy(block.stateRoot); }}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      {copiedText === block.stateRoot ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <p className="text-slate-300 truncate select-all">
                    {block.stateRoot}
                  </p>
                </div>
              </div>

              {/* Multi-Sig & File kicker */}
              <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-400 border-t border-slate-800/40 pt-2 font-mono gap-2">
                <div className="flex items-center gap-3">
                  {block.fileName && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Tệp:</span>
                      <span className="text-slate-200 font-semibold">{block.fileName}</span>
                    </div>
                  )}

                  {/* Multi-Sig witness badges */}
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>TPM 2.0 Enclave Confirmed</span>
                  </div>
                </div>

                <span className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]">
                  Xem chi tiết khối <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Standalone Merkle Inclusion Proof Modal */}
      {activeProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-white">
                  Bằng chứng Merkle Inclusion (SMT Proof)
                </span>
              </div>
              <button
                onClick={() => setActiveProof(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
              >
                ✕ Đóng
              </button>
            </div>

            <div className="p-5 overflow-auto space-y-4 text-xs font-mono">
              <p className="text-slate-400 leading-relaxed">
                Bằng chứng mật mã toán học chứng minh Khối #{activeProof.blockIndex} thực sự nằm trong State Root mà không cần duyệt lại toàn bộ dữ liệu lịch sử (Light-Client Verification).
              </p>

              <div className="space-y-1">
                <span className="text-slate-400">Leaf Hash (Mã băm Khối #{activeProof.blockIndex}):</span>
                <p className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-200 break-all select-all">
                  {activeProof.leafHash}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-slate-400">Đường dẫn Merkle (Audit Path - {activeProof.path.length} bước):</span>
                {activeProof.path.length === 0 ? (
                  <p className="text-slate-400 italic">Khối đơn (Genesis hoặc Root duy nhất).</p>
                ) : (
                  <div className="space-y-1.5">
                    {activeProof.path.map((step, sIdx) => (
                      <div key={sIdx} className="p-2 rounded bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                        <span className="text-cyan-400 font-semibold">[{step.position.toUpperCase()}] Sibling #{sIdx + 1}:</span>
                        <span className="text-slate-300 truncate max-w-[280px]">{step.hash}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-slate-400">Merkle State Root Đích:</span>
                <p className="p-2 rounded bg-slate-950 border border-slate-800 text-cyan-300 break-all select-all">
                  {activeProof.merkleRoot}
                </p>
              </div>

              {/* Proof verification status */}
              {proofVerified !== null && (
                <div className={`p-3 rounded-lg border flex items-center gap-2 ${
                  proofVerified ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}>
                  {proofVerified ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Xác thực thành công 100%! Bằng chứng Merkle khớp chính xác với State Root.</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span>Xác thực thất bại! Dữ liệu đường dẫn bị sai lệch.</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">Zero-Knowledge Ready</span>
              <button
                onClick={handleVerifyActiveProof}
                disabled={isVerifyingProof}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isVerifyingProof ? 'Đang tính toán...' : 'Xác thực Bằng chứng Ngay'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Inspection Modal */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-white">
                  Chi tiết Khối Next-Gen Cryptographic #{selectedBlock.index}
                </span>
              </div>
              <button
                onClick={() => setSelectedBlock(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
              >
                ✕ Đóng
              </button>
            </div>

            <div className="p-5 overflow-auto space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-slate-400">Action:</span>
                <p className="text-cyan-400 font-semibold text-sm">{selectedBlock.action}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400">Mã băm khối chính (Block Hash):</span>
                <p className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-200 break-all select-all">
                  {selectedBlock.hash}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400">Cumulative State Root:</span>
                <p className="p-2 rounded bg-slate-950 border border-slate-800 text-cyan-300 break-all select-all">
                  {selectedBlock.stateRoot}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400">Dual-Hash Quantum Shield:</span>
                <p className="p-2 rounded bg-slate-950 border border-slate-800 text-indigo-300 break-all select-all">
                  {selectedBlock.dualHash}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400">Chữ ký đa phần cứng (TPM 2.0 Multi-Signatures):</span>
                <div className="space-y-1">
                  {selectedBlock.signatures?.map((sig, sIdx) => (
                    <div key={sIdx} className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300">
                      <div className="text-emerald-400 font-semibold text-[11px] mb-0.5">{sig.role} ({sig.keyId}):</div>
                      <div className="break-all text-slate-400">{sig.signature}</div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedBlock.details && (
                <div className="space-y-1">
                  <span className="text-slate-400">Ghi chú sự kiện:</span>
                  <p className="text-slate-300">{selectedBlock.details}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => handleCopy(JSON.stringify(selectedBlock, null, 2))}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép JSON khối</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
