
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { 
  Upload, Scissors, Image as ImageIcon, 
  RefreshCw, Link as LinkIcon, Link2Off, 
  FileType, Layers, RotateCcw,
  Info, ZoomIn, ZoomOut, MousePointer, Pencil, Check, X,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Move,
  ChevronLeft, ChevronRight, Download, Undo, Redo,
  Layout, Crop as CropIcon, Palette, Sliders, Minus, Plus, Globe
} from 'lucide-react';
import JSZip from 'jszip';

// --- Types ---
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Margins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface SplitResult {
  id: number;
  dataUrl: string;
  blob: Blob;
  extension: string;
  originalRect: Rect;
  margins?: Margins;
  offset?: { x: number; y: number };
  isSquare?: boolean;
  bgColor?: string;
  outputSize?: number | 'auto';
}

interface HistoryState {
    rows: number;
    cols: number;
    rowPositions: number[];
    colPositions: number[];
}

type Lang = 'en' | 'zh' | 'ja';

// --- Localization ---
const translations: Record<Lang, Record<string, string>> = {
  en: {
    title: "MemeCut Pro",
    step1: "1. Upload Image",
    clickUpload: "Click to Upload or Ctrl+V",
    supportType: "Supports PNG, JPG, GIF, WebP",
    step2: "2. Grid Adjustment",
    reset: "Reset",
    dragRedLine: "Drag red lines to adjust.",
    fineTuneHint: "Tap arrow buttons to fine-tune.",
    shiftFast: "Hold Shift for faster movement.",
    rows: "Rows",
    cols: "Cols",
    padding: "Padding",
    link: "Link",
    paddingTip: "Shrink selection inward. Yellow areas in preview will be discarded.",
    step3: "3. Output Settings",
    format: "Format",
    unifiedSize: "Unified Size",
    autoOriginal: "Auto (Original)",
    custom: "Custom...",
    splitBtn: "Split Image",
    processing: "Processing...",
    previewArea: "Preview Area",
    previewTip: "Please upload image or Ctrl+V",
    resultsTitle: "Split Results",
    downloadAll: "Download All (ZIP)",
    close: "Close",
    fineTune: "Fine-tune",
    cropTab: "Crop",
    canvasTab: "Canvas",
    moveSel: "Move Selection",
    size: "Size",
    moveContent: "Move Content / Padding",
    autoSquare: "Auto Square",
    locked: "LOCKED",
    background: "Background",
    trans: "Transparent",
    white: "White",
    cancel: "Cancel",
    save: "Save",
    dragMove: "Drag to Move",
    spacePan: "Space+Drag to Pan",
    sourceGuide: "Source",
    pos: "POS",
    gifAnim: "GIF (Anim)",
    pngRec: "PNG (Rec)",
    images: "images",
    edge: "Edge",
    row: "Row",
    col: "Col",
    savePrev: "Save & Prev",
    saveNext: "Save & Next",
    upload: "Upload",
    adjust: "Adjust",
    nudge: "Nudge"
  },
  zh: {
    title: "MemeCut Pro",
    step1: "1. 上传图片 (Upload)",
    clickUpload: "点击上传或 Ctrl+V 粘贴",
    supportType: "支持 PNG, JPG, GIF, WebP",
    step2: "2. 网格调整 (Grid)",
    reset: "重置",
    dragRedLine: "拖拽红线调整。",
    fineTuneHint: "点击下方按钮微调。",
    shiftFast: "按住 Shift + 方向键可快速移动。",
    rows: "行数 (Rows)",
    cols: "列数 (Cols)",
    padding: "内缩调整 (Padding)",
    link: "关联",
    paddingTip: "向内收缩选区，去除黑边。预览图中黄色阴影表示被切除的区域。",
    step3: "3. 输出设置 (Settings)",
    format: "输出格式 (Format)",
    unifiedSize: "统一尺寸 (Unified Size)",
    autoOriginal: "自动 (原比例)",
    custom: "自定义 (Custom)...",
    splitBtn: "开始切分 (Split)",
    processing: "处理中...",
    previewArea: "预览区域 (Preview)",
    previewTip: "请上传图片或按 Ctrl+V 粘贴",
    resultsTitle: "切分完成",
    downloadAll: "批量下载 (ZIP)",
    close: "关闭",
    fineTune: "微调图片 (Fine-tune)",
    cropTab: "裁剪 (Crop)",
    canvasTab: "画布 (Canvas)",
    moveSel: "移动选区位置",
    size: "选区尺寸 (Size)",
    moveContent: "移动内容 / 增加边距",
    autoSquare: "自动补全为正方形",
    locked: "锁定",
    background: "背景 (Background)",
    trans: "透明",
    white: "白色",
    cancel: "取消",
    save: "保存",
    dragMove: "拖拽移动",
    spacePan: "空格+拖拽平移",
    sourceGuide: "选区 (Source)",
    pos: "位置",
    gifAnim: "GIF (动图)",
    pngRec: "PNG (推荐)",
    images: "张",
    edge: "边缘",
    row: "行",
    col: "列",
    savePrev: "保存并上一张",
    saveNext: "保存并下一张",
    upload: "上传",
    adjust: "调整",
    nudge: "微调"
  },
  ja: {
    title: "MemeCut Pro",
    step1: "1. 画像アップロード",
    clickUpload: "クリックしてアップロード / Ctrl+V",
    supportType: "PNG, JPG, GIF, WebP 対応",
    step2: "2. グリッド調整",
    reset: "リセット",
    dragRedLine: "赤線をドラッグして調整。",
    fineTuneHint: "下のボタンで微調整できます。",
    shiftFast: "Shiftキーで高速移動。",
    rows: "行数 (Rows)",
    cols: "列数 (Cols)",
    padding: "パディング (Padding)",
    link: "リンク",
    paddingTip: "選択範囲を縮小します。プレビューの黄色い領域は削除されます。",
    step3: "3. 出力設定",
    format: "フォーマット",
    unifiedSize: "統一サイズ",
    autoOriginal: "自動 (元比率)",
    custom: "カスタム...",
    splitBtn: "分割開始",
    processing: "処理中...",
    previewArea: "プレビュー",
    previewTip: "画像をアップロードまたは Ctrl+V",
    resultsTitle: "分割完了",
    downloadAll: "一括保存 (ZIP)",
    close: "閉じる",
    fineTune: "微調整",
    cropTab: "切り抜き",
    canvasTab: "キャンバス",
    moveSel: "選択範囲を移動",
    size: "サイズ",
    moveContent: "内容移動 / 余白",
    autoSquare: "正方形に自動補完",
    locked: "ロック",
    background: "背景色",
    trans: "透明",
    white: "白",
    cancel: "キャンセル",
    save: "保存",
    dragMove: "ドラッグで移動",
    spacePan: "Space+ドラッグでパン",
    sourceGuide: "ソース",
    pos: "位置",
    gifAnim: "GIF (動画)",
    pngRec: "PNG (推奨)",
    images: "枚",
    edge: "端",
    row: "行",
    col: "列",
    savePrev: "保存して前へ",
    saveNext: "保存して次へ",
    upload: "アップロード",
    adjust: "調整",
    nudge: "微調整"
  }
};

const getBrowserLang = (): Lang => {
    if (typeof navigator === 'undefined') return 'en';
    const l = navigator.language.toLowerCase();
    if (l.startsWith('zh')) return 'zh';
    if (l.startsWith('ja')) return 'ja';
    return 'en';
};

// --- Helper Functions ---
const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const generatePositions = (count: number) => {
  if (count < 1) return [0, 100];
  const step = 100 / count;
  const positions = [];
  for (let i = 0; i <= count; i++) {
    positions.push(Number((i * step).toFixed(2)));
  }
  return positions;
};

// Image Gen Helper
const generateImageBlob = async (
  image: HTMLImageElement, 
  rect: Rect, 
  margins: Margins, 
  offset: { x: number, y: number },
  isSquare: boolean,
  bgColor: string,
  outputSize: number | 'auto',
  format: 'png' | 'gif'
): Promise<Blob> => {
  let canvasWidth = rect.w + margins.left + margins.right;
  let canvasHeight = rect.h + margins.top + margins.bottom;

  if (isSquare) {
      const size = Math.max(canvasWidth, canvasHeight);
      canvasWidth = size;
      canvasHeight = size;
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Context creation failed');

  if (bgColor === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  } else {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  }

  const contentW = rect.w + margins.left + margins.right;
  const contentH = rect.h + margins.top + margins.bottom;
  const startX = (canvasWidth - contentW) / 2 + margins.left + offset.x;
  const startY = (canvasHeight - contentH) / 2 + margins.top + offset.y;

  ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h, startX, startY, rect.w, rect.h);

  let finalCanvas = canvas;
  if (typeof outputSize === 'number' && (canvasWidth !== outputSize || canvasHeight !== outputSize)) {
      finalCanvas = document.createElement('canvas');
      finalCanvas.width = outputSize;
      finalCanvas.height = outputSize;
      const fCtx = finalCanvas.getContext('2d');
      if (fCtx) {
        if (bgColor === 'white') {
           fCtx.fillStyle = '#ffffff';
           fCtx.fillRect(0, 0, outputSize, outputSize);
        }
        fCtx.drawImage(canvas, 0, 0, outputSize, outputSize);
      }
  }

  if (format === 'png') {
      return new Promise((resolve, reject) => {
          finalCanvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Canvas to Blob failed'));
          }, 'image/png');
      });
  } else {
      try {
        const gifModule: any = await import('gifenc');
        const GIFEncoder = gifModule.GIFEncoder || gifModule.default?.GIFEncoder;
        const quantize = gifModule.quantize || gifModule.default?.quantize;
        const applyPalette = gifModule.applyPalette || gifModule.default?.applyPalette;

        if (!GIFEncoder || !quantize || !applyPalette) {
             const { GIFEncoder: GE, quantize: Q, applyPalette: AP } = await import('https://esm.sh/gifenc@1.0.3');
             if (!GE) throw new Error("GIF Library exports not found in fallback");
             
             const data = finalCanvas.getContext('2d')?.getImageData(0, 0, finalCanvas.width, finalCanvas.height).data;
             if (!data) throw new Error('No image data');
             const palette = Q(data, 256, { format: 'rgba4444' });
             const index = AP(data, palette, 'rgba4444');
             const encoder = new GE();
             encoder.writeFrame(index, finalCanvas.width, finalCanvas.height, { 
                palette: palette, 
                transparent: bgColor !== 'white' ? 0 : undefined,
                delay: 0,
                repeat: 0
             });
             encoder.finish();
             return new Blob([encoder.bytes()], { type: 'image/gif' });
        }

        const data = finalCanvas.getContext('2d')?.getImageData(0, 0, finalCanvas.width, finalCanvas.height).data;
        if (!data) throw new Error('No image data');

        const palette = quantize(data, 256, { format: 'rgba4444' });
        const index = applyPalette(data, palette, 'rgba4444');
        const encoder = new GIFEncoder();
        
        encoder.writeFrame(index, finalCanvas.width, finalCanvas.height, { 
            palette: palette, 
            transparent: bgColor !== 'white' ? 0 : undefined,
            delay: 0,
            repeat: 0
        });
        encoder.finish();
        return new Blob([encoder.bytes()], { type: 'image/gif' });
      } catch (e) {
          console.error("GIF generation error:", e);
          return new Promise((resolve) => {
            finalCanvas.toBlob(b => resolve(b!), 'image/png');
            alert("GIF generation failed, falling back to PNG.");
          });
      }
  }
};

// --- Components ---

const CompactNumberInput = ({ value, onChange, min, max }: { value: number, onChange: (v: number) => void, min: number, max: number }) => {
    return (
        <div className="flex items-center w-full">
            <button 
                onClick={() => onChange(Math.max(min, value - 1))}
                className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-l-lg hover:bg-gray-100 active:bg-gray-200 transition-colors text-gray-600"
            >
                <Minus className="w-4 h-4" />
            </button>
            <input 
                type="number" 
                min={min} 
                max={max} 
                value={value} 
                onChange={(e) => onChange(Math.max(min, parseInt(e.target.value) || min))} 
                className="flex-1 h-10 text-center border-y border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
            />
            <button 
                onClick={() => onChange(Math.min(max, value + 1))}
                className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-r-lg hover:bg-gray-100 active:bg-gray-200 transition-colors text-gray-600"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
    );
};

const CompactDirectionControl = ({ 
    onMove, label, centerContent
}: { 
    onMove: (dir: 'up'|'down'|'left'|'right', val: number) => void,
    label?: string,
    centerContent?: ReactNode
}) => {
    return (
        <div className="flex flex-col items-center gap-1 p-2 bg-white rounded-xl border border-gray-100 shadow-sm select-none">
            {label && <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">{label}</span>}
            <div className="grid grid-cols-3 gap-1">
                <div />
                <button onClick={() => onMove('up', 1)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 active:bg-gray-200 transition-colors"><ArrowUp className="w-4 h-4" /></button>
                <div />
                <button onClick={() => onMove('left', 1)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 active:bg-gray-200 transition-colors"><ArrowLeft className="w-4 h-4" /></button>
                <div className="w-8 h-8 flex items-center justify-center text-xs font-bold text-indigo-600">{centerContent || <Move className="w-4 h-4 text-gray-300" />}</div>
                <button onClick={() => onMove('right', 1)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 active:bg-gray-200 transition-colors"><ArrowRight className="w-4 h-4" /></button>
                <div />
                <button onClick={() => onMove('down', 1)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 active:bg-gray-200 transition-colors"><ArrowDown className="w-4 h-4" /></button>
                <div />
            </div>
        </div>
    );
};

const NudgeControl = ({ 
    onNudge, label
}: { 
    onNudge: (dir: 'up'|'down'|'left'|'right', fast: boolean) => void,
    label: string
}) => {
    return (
        <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 mb-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-2"><Move className="w-3 h-3" /> {label}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onNudge('left', false)} className="h-8 flex items-center justify-center bg-white border border-indigo-100 rounded text-indigo-600 hover:bg-indigo-50"><ArrowLeft className="w-4 h-4" /></button>
                <button onClick={() => onNudge('right', false)} className="h-8 flex items-center justify-center bg-white border border-indigo-100 rounded text-indigo-600 hover:bg-indigo-50"><ArrowRight className="w-4 h-4" /></button>
                <button onClick={() => onNudge('up', false)} className="h-8 flex items-center justify-center bg-white border border-indigo-100 rounded text-indigo-600 hover:bg-indigo-50"><ArrowUp className="w-4 h-4" /></button>
                <button onClick={() => onNudge('down', false)} className="h-8 flex items-center justify-center bg-white border border-indigo-100 rounded text-indigo-600 hover:bg-indigo-50"><ArrowDown className="w-4 h-4" /></button>
            </div>
        </div>
    );
};

const Sidebar = ({
  onUpload,
  rows, setRows,
  cols, setCols,
  paddingX, setPaddingX,
  paddingY, setPaddingY,
  linkPadding, setLinkPadding,
  format, setFormat,
  outputSize, setOutputSize,
  onSplit, hasImage, isProcessing,
  onResetGrid, isOpen, toggleSidebar,
  canUndo, canRedo, onUndo, onRedo,
  selectedLine,
  t, lang, setLang,
  onNudge
}: any) => {
  const handlePaddingChange = (val: number, axis: 'x' | 'y') => {
    if (linkPadding) { setPaddingX(val); setPaddingY(val); }
    else { axis === 'x' ? setPaddingX(val) : setPaddingY(val); }
  };
  const isPreset = outputSize === 'auto' || [128, 240, 512].includes(outputSize as number);

  const containerClasses = `
    font-sans bg-white shadow-xl z-50 transition-all duration-300 ease-in-out
    md:h-full md:border-r md:static md:shadow-none
    ${isOpen ? 'md:w-80 lg:w-96 md:opacity-100 md:translate-x-0' : 'md:w-0 md:opacity-0 md:overflow-hidden md:-translate-x-full'}

    /* Mobile Bottom Sheet Styles */
    fixed bottom-0 left-0 right-0 
    h-[65vh] rounded-t-2xl 
    ${isOpen ? 'translate-y-0' : 'translate-y-full'}
    md:rounded-none md:translate-y-0
  `;

  return (
    <div className={containerClasses}>
      {/* Mobile Drag Handle */}
      <div className="md:hidden w-full flex justify-center pt-3 pb-1" onClick={toggleSidebar}>
        <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
      </div>

      <div className="p-5 flex flex-col gap-5 min-w-[320px] h-full overflow-y-auto pb-24 md:pb-5">
        <div className="flex items-center justify-between text-indigo-600 mb-2 md:flex hidden">
            <div className="flex items-center gap-2"><Scissors className="w-6 h-6" /><h1 className="text-xl font-bold tracking-tight text-gray-900">{t.title}</h1></div>
            <div className="flex items-center gap-2">
                <div className="relative group">
                    <Globe className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select 
                        value={lang} 
                        onChange={(e) => setLang(e.target.value)} 
                        className="pl-7 pr-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded-md text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none hover:bg-gray-100"
                    >
                        <option value="zh">中文</option>
                        <option value="en">English</option>
                        <option value="ja">日本語</option>
                    </select>
                </div>
                <button onClick={toggleSidebar} className="md:hidden p-2 text-gray-500"><ChevronLeft /></button>
            </div>
        </div>

        {/* Step 1: Upload - Hide on mobile if image exists to save space */}
        <div className={`space-y-3 ${hasImage ? 'hidden md:block' : ''}`}>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-100 flex items-center justify-center text-indigo-600">1</div>{t.step1}</h2>
            <div className="relative group">
            <input type="file" accept="image/*" onChange={onUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all group-hover:border-indigo-400 group-hover:bg-indigo-50/50">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-2 group-hover:bg-indigo-100"><ImageIcon className="w-5 h-5" /></div>
                <p className="text-sm font-medium text-gray-700">{t.clickUpload}</p>
                <p className="text-xs text-gray-400 mt-1">{t.supportType}</p>
            </div>
            </div>
        </div>

        <div className={`space-y-5 transition-opacity duration-300 ${hasImage ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-indigo-100 flex items-center justify-center text-indigo-600">2</div>{t.step2}
                </div>
                <div className="flex gap-1">
                    <button onClick={onUndo} disabled={!canUndo} className="p-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-600" title="Undo (Ctrl+Z)"><Undo className="w-3.5 h-3.5" /></button>
                    <button onClick={onRedo} disabled={!canRedo} className="p-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-600" title="Redo (Ctrl+Shift+Z)"><Redo className="w-3.5 h-3.5" /></button>
                    <button onClick={onResetGrid} className="text-[10px] flex items-center gap-1 text-gray-500 hover:text-indigo-600 bg-gray-100 px-2 py-1 rounded hover:bg-indigo-50 transition-colors ml-2"><RotateCcw className="w-3 h-3" /> {t.reset}</button>
                </div>
            </h2>
            
            <div className="text-xs text-indigo-700 bg-indigo-50 p-2.5 rounded border border-indigo-100 flex flex-col gap-2">
                <div className="flex gap-2"><MousePointer className="w-4 h-4 flex-shrink-0" /><span>{t.dragRedLine}</span></div>
                <div className="flex gap-2 md:hidden"><Info className="w-4 h-4 flex-shrink-0" /><span>{t.fineTuneHint}</span></div>
                <div className="hidden md:flex gap-2"><Info className="w-4 h-4 flex-shrink-0" /><span>{t.shiftFast}</span></div>
            </div>

            {/* Mobile Nudge Controls - visible only when a line is selected */}
            {selectedLine && (
                <div className="md:hidden">
                    <NudgeControl label={t.nudge} onNudge={(dir, fast) => onNudge(dir, fast, selectedLine)} />
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t.rows}</label>
                    <CompactNumberInput value={rows} min={1} max={20} onChange={setRows} />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t.cols}</label>
                    <CompactNumberInput value={cols} min={1} max={20} onChange={setCols} />
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-1.5"><label className="text-xs font-semibold text-gray-700">{t.padding}</label><button onClick={() => setLinkPadding(!linkPadding)} className={`p-1 rounded hover:bg-gray-100 ${linkPadding ? 'text-indigo-600' : 'text-gray-400'}`} title={t.link}>{linkPadding ? <LinkIcon className="w-3 h-3" /> : <Link2Off className="w-3 h-3" />}</button></div>
                <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2"><span className="text-xs text-gray-400 w-3">H</span><input type="range" min="0" max="50" value={paddingX} onChange={(e) => handlePaddingChange(parseInt(e.target.value), 'x')} className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" /><span className="text-xs text-gray-500 w-6 text-right">{paddingX}px</span></div>
                    <div className="flex items-center gap-2"><span className="text-xs text-gray-400 w-3">V</span><input type="range" min="0" max="50" value={paddingY} onChange={(e) => handlePaddingChange(parseInt(e.target.value), 'y')} className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" /><span className="text-xs text-gray-500 w-6 text-right">{paddingY}px</span></div>
                    <p className="text-[10px] text-gray-400 leading-tight">{t.paddingTip}</p>
                </div>
            </div>
        </div>

        <div className={`space-y-3 transition-opacity duration-300 ${hasImage ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
             <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2"><div className="w-6 h-6 rounded bg-indigo-100 flex items-center justify-center text-indigo-600">3</div>{t.step3}</h2>
            <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">{t.format}</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setFormat('png')} className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${format === 'png' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-500' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}><FileType className="w-4 h-4" /> {t.pngRec}</button>
                        <button onClick={() => setFormat('gif')} className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${format === 'gif' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-500' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}><Layers className="w-4 h-4" /> {t.gifAnim}</button>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">{t.unifiedSize}</label>
                    <div className="relative">
                        <select value={typeof outputSize === 'number' && ![128, 240, 512].includes(outputSize) ? 'custom' : outputSize} onChange={(e) => { const val = e.target.value; if (val === 'custom') setOutputSize(512); else setOutputSize(val === 'auto' ? 'auto' : parseInt(val)); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500">
                            <option value="auto">{t.autoOriginal}</option>
                            <option value="128">128 x 128 px (Emoji)</option>
                            <option value="240">240 x 240 px (WeChat)</option>
                            <option value="512">512 x 512 px (Sticker)</option>
                            <option value="custom">{t.custom}</option>
                        </select>
                    </div>
                     {!isPreset && <div className="mt-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-1"><input type="number" min="16" max="2048" value={typeof outputSize === 'number' ? outputSize : ''} onChange={(e) => { const val = parseInt(e.target.value); if (!isNaN(val)) setOutputSize(val); }} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Size (px)" /><span className="text-xs text-gray-500">px</span></div>}
                </div>
            </div>
        </div>
        
        {/* Only show large split button on Desktop, Mobile has it in bottom nav */}
        <div className="flex-1 hidden md:block" />
        <button onClick={onSplit} disabled={!hasImage || isProcessing} className={`hidden md:flex w-full py-3.5 px-4 rounded-xl items-center justify-center gap-2 font-bold text-white shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${!hasImage || isProcessing ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500'}`}>
            {isProcessing ? (<><RefreshCw className="w-5 h-5 animate-spin" />{t.processing}</>) : (<><Check className="w-5 h-5" />{t.splitBtn}</>)}
        </button>
      </div>
    </div>
  );
};

const PreviewArea = ({
  imageSrc, rows, cols, rowPositions, colPositions, paddingX, paddingY, onLineDragStart, selectedLine, setSelectedLine, sidebarOpen, toggleSidebar, t
}: any) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imgDim, setImgDim] = useState({ w: 0, h: 0 }); // Explicit image dimensions
  const lastMousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const fitImageToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const img = document.querySelector('#preview-img') as HTMLImageElement;
    if (img && img.naturalWidth && img.naturalHeight) {
        setImgDim({ w: img.naturalWidth, h: img.naturalHeight }); // Lock container dimensions
        const isMobile = window.innerWidth < 768;
        const padX = isMobile ? 32 : 64; 
        const padY = isMobile ? 80 : 80;
        
        const scaleX = (rect.width - padX) / img.naturalWidth;
        const scaleY = (rect.height - padY) / img.naturalHeight;
        const scale = Math.min(scaleX, scaleY, 1); 
        setZoom(scale);
        setPan({ x: 0, y: 0 });
    }
  }, []);

  useEffect(() => { 
      if (imageSrc) {
          fitImageToScreen();
          const timer = setTimeout(fitImageToScreen, 100); // Retry for safety
          return () => clearTimeout(timer);
      }
  }, [imageSrc, fitImageToScreen]);

  useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const observer = new ResizeObserver(() => {
          if (imageSrc) fitImageToScreen();
      });
      observer.observe(el);
      window.addEventListener('resize', fitImageToScreen);
      return () => {
          observer.disconnect();
          window.removeEventListener('resize', fitImageToScreen);
      }
  }, [imageSrc, fitImageToScreen]);

  useEffect(() => {
      if (imageSrc) setTimeout(fitImageToScreen, 200);
  }, [sidebarOpen, imageSrc, fitImageToScreen]);

  const handleZoom = (delta: number) => setZoom(z => Math.max(0.1, Math.min(5, z + delta)));
  
  const onPointerDown = (e: React.PointerEvent) => {
      if (!imageSrc) return;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setIsDragging(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: React.PointerEvent) => {
      setIsDragging(false);
      try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch(err) {}
  };

  const handleBackgroundClick = () => {
      setSelectedLine(null);
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  return (
    <div className="flex-1 relative bg-gray-100 flex flex-col overflow-hidden min-h-0" 
         onPointerDown={onPointerDown} 
         onPointerMove={onPointerMove} 
         onPointerUp={onPointerUp} 
         onPointerLeave={onPointerUp}>
        
        {/* Floating Controls */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-auto">
            {!sidebarOpen && <button onClick={(e) => { e.stopPropagation(); toggleSidebar(); }} className="hidden md:block p-2 bg-white rounded-lg shadow text-gray-600 hover:text-indigo-600"><ChevronRight /></button>}
             <div className="bg-white/90 backdrop-blur shadow-sm rounded-lg p-1.5 flex flex-col gap-1">
                <button onClick={(e) => { e.stopPropagation(); handleZoom(0.1); }} className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Zoom In"><ZoomIn className="w-5 h-5" /></button>
                <button onClick={(e) => { e.stopPropagation(); handleZoom(-0.1); }} className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Zoom Out"><ZoomOut className="w-5 h-5" /></button>
                <button onClick={(e) => { e.stopPropagation(); fitImageToScreen(); }} className="p-2 hover:bg-gray-100 rounded text-gray-600 text-xs font-bold" title="Fit">FIT</button>
            </div>
        </div>

        {/* Absolute Centering Container */}
        <div ref={containerRef} className="w-full h-full relative cursor-grab active:cursor-grabbing touch-none select-none overflow-hidden" onClick={handleBackgroundClick}>
            {!imageSrc ? (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-gray-400 p-6">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">{t.previewArea}</p>
                    <p className="text-sm opacity-60">{t.previewTip}</p>
                </div>
            </div>
            ) : (
            <div 
                className="absolute left-1/2 top-1/2 shadow-xl bg-white bg-checkerboard touch-none origin-center"
                style={{ 
                    // Explicitly set width/height to match image to prevent collapse
                    width: imgDim.w > 0 ? imgDim.w : 'auto',
                    height: imgDim.h > 0 ? imgDim.h : 'auto',
                    transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, 
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                    // REMOVED overflow-hidden to allow edge lines to be fully visible and touchable
                }}
            >
                <img key={imageSrc} id="preview-img" src={imageSrc} alt="Preview" className="max-w-none pointer-events-none block select-none" onLoad={fitImageToScreen} draggable={false} />
                
                {/* Overlays */}
                <div className="absolute top-0 left-0 right-0 bg-black/50 pointer-events-none" style={{ height: `${rowPositions[0]}%` }} />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 pointer-events-none" style={{ top: `${rowPositions[rowPositions.length-1]}%` }} />
                <div className="absolute top-0 bottom-0 left-0 bg-black/50 pointer-events-none" style={{ width: `${colPositions[0]}%` }} />
                <div className="absolute top-0 bottom-0 right-0 bg-black/50 pointer-events-none" style={{ left: `${colPositions[colPositions.length-1]}%` }} />
                
                <div className="absolute inset-0 z-10">
                    {rowPositions.map((pos: number, i: number) => {
                        const isSelected = selectedLine?.type === 'row' && selectedLine.index === i;
                        return (
                        <div key={`row-${i}`} className={`absolute left-0 right-0 h-6 -mt-3 cursor-ns-resize group touch-none ${isSelected ? 'z-30' : 'z-20'}`} style={{ top: `${pos}%` }}
                            onPointerDown={(e) => { e.stopPropagation(); onLineDragStart(e, 'row', i); setSelectedLine({type:'row', index:i}); }}>
                            <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 md:h-0.5 pointer-events-none transition-colors duration-200 ring-1 ring-white/50 ${isSelected ? 'bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.3)] h-1 md:h-0.5' : 'bg-red-500 shadow-[0_0_2px_rgba(255,255,255,0.8)]'}`} />
                            {paddingY > 0 && (<>{i > 0 && <div className="absolute left-0 right-0 bottom-1/2 bg-yellow-400/30 border-b border-yellow-500/50 pointer-events-none" style={{ height: `${paddingY}px` }} />}{i < rowPositions.length - 1 && <div className="absolute left-0 right-0 top-1/2 bg-yellow-400/30 border-t border-yellow-500/50 pointer-events-none" style={{ height: `${paddingY}px` }} />}</>)}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full px-1 bg-blue-500 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none hidden md:block">{i === 0 || i === rowPositions.length - 1 ? t.edge : `${t.row} ${i}`}</div>
                        </div>
                    )})}
                    {colPositions.map((pos: number, i: number) => {
                        const isSelected = selectedLine?.type === 'col' && selectedLine.index === i;
                        return (
                        <div key={`col-${i}`} className={`absolute top-0 bottom-0 w-6 -ml-3 cursor-ew-resize group touch-none ${isSelected ? 'z-30' : 'z-20'}`} style={{ left: `${pos}%` }}
                            onPointerDown={(e) => { e.stopPropagation(); onLineDragStart(e, 'col', i); setSelectedLine({type:'col', index:i}); }}>
                             <div className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 md:w-0.5 pointer-events-none transition-colors duration-200 ring-1 ring-white/50 ${isSelected ? 'bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.3)] w-1 md:w-0.5' : 'bg-red-500 shadow-[0_0_2px_rgba(255,255,255,0.8)]'}`} />
                             {paddingX > 0 && (<>{i > 0 && <div className="absolute top-0 bottom-0 right-1/2 bg-yellow-400/30 border-r border-yellow-500/50 pointer-events-none" style={{ width: `${paddingX}px` }} />}{i < colPositions.length - 1 && <div className="absolute top-0 bottom-0 left-1/2 bg-yellow-400/30 border-l border-yellow-500/50 pointer-events-none" style={{ width: `${paddingX}px` }} />}</>)}
                             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full px-1 bg-blue-500 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none hidden md:block">{i === 0 || i === colPositions.length - 1 ? t.edge : `${t.col} ${i}`}</div>
                        </div>
                    )})}
                </div>
            </div>
            )}
        </div>
    </div>
  );
};
