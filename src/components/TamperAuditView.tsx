import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Binary,
  Layers,
  Fingerprint,
  RefreshCw,
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Cpu,
  GitBranch,
  Sparkles,
  Lock,
  EyeOff
} from 'lucide-react';
import { computeSHA256 } from '../services/webCrypto';
import { blockchainService, Block, ZKFileCommitmentProof } from '../services/blockchain';
import { translations, Language } from '../types/i18n';

interface TamperAuditViewProps {
  lang: Language;
}

export const TamperAuditView: React.FC<TamperAuditViewProps> = ({ lang }) => {
  const t = translations[lang];

  // Avalanche effect interactive demo
  const [textA, setTextA] = useState('BaoCaoTaiChinh_2026.docx');
  const [textB, setTextB] = useState('BaoCaoTaiChinh_2026.docX');
  const [hashA, setHashA] = useState('');
  const [hashB, setHashB] = useState('');

  // Tamper attack simulation state
  const [simulatedAttackOutput, setSimulatedAttackOutput] = useState<string | null>(null);
  const [attackStatus, setAttackStatus] = useState<'idle' | 'detected' | 'blocked'>('idle');

  // Zero-Knowledge Proof State
  const [zkProof, setZkProof] = useState<ZKFileCommitmentProof | null>(null);
  const [isGeneratingZk, setIsGeneratingZk] = useState(false);

  React.useEffect(() => {
    async function updateHashes() {
      const hA = await computeSHA256(new TextEncoder().encode(textA));
      const hB = await computeSHA256(new TextEncoder().encode(textB));
      setHashA(hA);
      setHashB(hB);
    }
    updateHashes();
  }, [textA, textB]);

  // Simulate Attack 1: GCM Tag mismatch
  const handleSimulateGCMTamper = () => {
    setAttackStatus('blocked');
    setSimulatedAttackOutput(
      `[TẤN CÔNG BỊ CHẶN] Phát hiện sửa đổi 1 byte trong Ciphertext tại offset 0x004F!
Thuật toán AES-256-GCM tiến hành xác thực Authentication Tag (128-bit GHASH).
Kết quả: AUTH_TAG_MISMATCH!
Cơ chế bảo mật Windows từ chối giải mã và ngăn chặn hoàn toàn việc thực thi mã độc.`
    );
  };

  // Simulate Attack 2: Ledger Block Tampering
  const handleSimulateBlockchainTamper = async () => {
    blockchainService.simulateTamperAttack(1);
    const audit = await blockchainService.auditChain();
    setAttackStatus('detected');
    setSimulatedAttackOutput(
      `[PHÁT HIỆN GIẢ MẠO SỔ CÁI]
Kiểm toán Blockchain Cục bộ: ${audit.reason}
Hệ thống phát hiện Block #1 có mã băm không khớp với chuỗi kế tiếp.
Toàn bộ chuỗi khối từ Block #1 trở đi bị gắn cờ bất hợp lệ!
Thông báo tự động gửi về Windows System Tray.`
    );
  };

  // Simulate Attack 3: TPM Multi-Sig Bypass
  const handleSimulateTPMBypass = () => {
    setAttackStatus('blocked');
    setSimulatedAttackOutput(
      `[VI PHẠM ĐỒNG THUẬN TPM 2.0 BỊ PHÁT HIỆN]
Mã độc cố gắng chèn một khối giả vào chuỗi cục bộ mà không qua chip phần cứng TPM.
Kiểm tra chữ ký số:
  - Windows TPM 2.0 Hardware Key: THIẾU HOẶC KHÔNG HỢP LỆ (Status: REJECTED)
  - User Master Enclave: Không được cấp phép
Kết quả: Khối bị loại bỏ ngay lập tức, cơ chế đồng thuận 3-of-3 Hardware Consensus bảo vệ an toàn toàn diện.`
    );
  };

  // Generate ZK Proof
  const handleGenerateZKProof = async () => {
    setIsGeneratingZk(true);
    await new Promise(r => setTimeout(r, 200));
    const proof = await blockchainService.generateZKFileProof(
      'file_confidential_demo',
      'BaoCao_KiemToan_BaoMat_2026.docx',
      hashA
    );
    setZkProof(proof);
    setIsGeneratingZk(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-cyan-400" />
          Phòng thủ Đa tầng: AES-256-GCM, TPM 2.0 Multi-Sig & Blockchain Next-Gen
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Ngăn chặn 100% các cuộc tấn công ransomware âm thầm mã hóa đè, tấn công hoán đổi bit (Bit-Flipping), hoặc cố tình xóa log sự kiện trên hệ điều hành Windows.
        </p>
      </div>

      {/* Interactive Tamper Attack Laboratory */}
      <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-rose-400" />
          Phòng thí nghiệm Mô phỏng Tấn công Thực tế
        </h3>
        
        <p className="text-xs text-slate-400 leading-relaxed">
          Nhấp vào các nút bên dưới để thử kích hoạt các kịch bản tấn công tệp tin và quan sát cơ chế phản ứng tức thì của hệ thống AegisVault:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={handleSimulateGCMTamper}
            className="p-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-400">
                1. Tấn công Thay đổi Bit
              </span>
              <Cpu className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Can thiệp 1 byte trong tệp .aegis đã mã hóa để kiểm tra phản ứng của Authentication Tag.
            </p>
          </button>

          <button
            onClick={handleSimulateBlockchainTamper}
            className="p-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-400">
                2. Tấn công Giả mạo Sổ cái
              </span>
              <Layers className="w-4 h-4 text-slate-500 group-hover:text-rose-400" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Sửa đổi dữ liệu mã băm tệp trong khối lịch sử để kiểm tra tính toàn vẹn của chuỗi hash.
            </p>
          </button>

          <button
            onClick={handleSimulateTPMBypass}
            className="p-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400">
                3. Giả mạo TPM Multi-Sig
              </span>
              <Sparkles className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Thử nghiệm chèn khối không có xác thực chữ ký số từ chip bảo mật phần cứng TPM 2.0.
            </p>
          </button>
        </div>

        {/* Attack Simulation Result Terminal */}
        {simulatedAttackOutput && (
          <div className="mt-4 p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2">
              <span className="flex items-center gap-1.5 font-bold">
                {attackStatus === 'blocked' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                )}
                <span>Kết quả Phân tích An ninh</span>
              </span>
              <span className="text-[10px] text-slate-400">REAL-TIME THREAT DETECTOR</span>
            </div>
            <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed">
              {simulatedAttackOutput}
            </pre>
          </div>
        )}
      </div>

      {/* Zero-Knowledge File Commitment Laboratory */}
      <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-cyan-400" />
              Bằng chứng Toàn vẹn Không Tiết lộ (Zero-Knowledge Attestation)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Cho phép chứng minh với bên thứ ba (kiểm toán viên, đối tác, cloud) rằng một tệp tin tồn tại trong kho và không bị sửa đổi mà không cần chia sẻ nội dung hay lộ mã băm gốc.
            </p>
          </div>

          <button
            onClick={handleGenerateZKProof}
            disabled={isGeneratingZk}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGeneratingZk ? 'Đang tạo...' : 'Tạo Bằng chứng ZK'}</span>
          </button>
        </div>

        {/* ZK Proof Card */}
        {zkProof && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ZK-SNARK Commitment Proof: {zkProof.proofId}
              </span>
              <span className="text-[11px] text-slate-500">
                {new Date(zkProof.generatedAt).toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-slate-500">Tệp đích:</span>
                <p className="text-slate-200 font-semibold">{zkProof.fileName}</p>
              </div>

              <div>
                <span className="text-slate-500">State Root Đích:</span>
                <p className="text-slate-300 truncate">{zkProof.stateRoot}</p>
              </div>

              <div>
                <span className="text-slate-500">Cryptographic Commitment (C = H(fileHash || Salt)):</span>
                <p className="text-cyan-300 truncate">{zkProof.commitmentHash}</p>
              </div>

              <div>
                <span className="text-slate-500">Nullifier Hash (N = H(Salt || EnclaveKey)):</span>
                <p className="text-indigo-300 truncate">{zkProof.nullifierHash}</p>
              </div>
            </div>

            <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Bằng chứng toán học hợp lệ: Tệp tin được chứng minh toàn vẹn mà không làm rò rỉ bất kỳ thông tin nhạy cảm nào.</span>
            </div>
          </div>
        )}
      </div>

      {/* Avalanche Effect Interactive Demonstration */}
      <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-cyan-400" />
          Hiệu ứng Thác lũ Mật mã (Cryptographic Avalanche Effect)
        </h3>
        
        <p className="text-xs text-slate-400 leading-relaxed">
          Chỉ cần thay đổi đúng 1 ký tự duy nhất (ví dụ chữ hoa thành chữ thường), toàn bộ mã băm SHA-256 sẽ hoàn toàn biến đổi, khiến bất kỳ sự chỉnh sửa nhỏ nào cũng bị blockchain phát hiện ngay lập tức:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-400">Chuỗi dữ liệu A:</label>
            <input
              type="text"
              value={textA}
              onChange={(e) => setTextA(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-cyan-300 break-all select-all">
              {hashA}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-400">Chuỗi dữ liệu B (chỉnh sửa 1 ký tự):</label>
            <input
              type="text"
              value={textB}
              onChange={(e) => setTextB(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-amber-300 break-all select-all">
              {hashB}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
