
import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChangeEvent, MouseEvent, KeyboardEvent, ReactNode } from 'react';
import { 
  Upload, Scissors, Image as ImageIcon, 
  Trash2, RefreshCw, AlertCircle, Link as LinkIcon, Link2Off, 
  FileType, Layers, RotateCcw,
  Info, ZoomIn, ZoomOut, MousePointer, Pencil, Check, X,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Square, Hand, Move,
  ChevronLeft, ChevronRight, Scaling, Download, Undo, Redo,
  Layout, Crop as CropIcon, Maximize, Palette, ChevronUp, Globe
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
    dragRedLine: "Drag red lines to adjust. Click line to fine-tune with arrow keys.",
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
    saveNext: "Save & Next"
  },
  zh: {
    title: "MemeCut Pro",
    step1: "1. 上传图片 (Upload)",
    clickUpload: "点击上传或 Ctrl+V 粘贴",
    supportType: "支持 PNG, JPG, GIF, WebP",
    step2: "2. 网格调整 (Grid)",
    reset: "重置",
    dragRedLine: "拖拽红线调整，点击选中(蓝色)后可用方向键微调。",
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
    saveNext: "保存并下一张"
  },
  ja: {
    title: "MemeCut Pro",
    step1: "1. 画像アップロード",
    clickUpload: "クリックしてアップロード / Ctrl+V",
    supportType: "PNG, JPG, GIF, WebP 対応",
    step2: "2. グリッド調整",
    reset: "リセット",
    dragRedLine: "赤線をドラッグして調整。選択後に矢印キーで微調整可。",
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
    saveNext: "保存して次へ"
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

        if (!GIFEncoder) throw new Error("GIF Library exports not found");

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

const CompactDirectionControl = ({ 
    onMove, label, centerContent
}: { 
    onMove: (dir: 'up'|'down'|'left'|'right', val: number) => void,
    label: string,
    centerContent?: ReactNode
}) => {
    return (
        <div className="flex flex-col items-center gap-1 p-2 bg-white rounded-xl border border-gray-100 shadow-sm select-none">
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">{label}</span>
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
  t, lang, setLang
}: any) => {
  const handlePaddingChange = (val: number, axis: 'x' | 'y') => {
    if (linkPadding) { setPaddingX(val); setPaddingY(val); }
    else { axis === 'x' ? setPaddingX(val) : setPaddingY(val); }
  };
  const isPreset = outputSize === 'auto' || [128, 240, 512].includes(outputSize as number);

  return (
    <div className={`bg-white shadow-xl border-r border-gray-200 h-full overflow-y-auto z-30 font-sans transition-all duration-300 ease-in-out flex flex-col shrink-0 ${isOpen ? 'w-full md:w-80 lg:w-96 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}`}>
      <div className="p-5 flex flex-col gap-5 min-w-[320px]">
        <div className="flex items-center justify-between text-indigo-600 mb-2">
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

        <div className="space-y-3">
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
                <div className="flex gap-2"><Info className="w-4 h-4 flex-shrink-0" /><span>{t.shiftFast}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">{t.rows}</label><input type="number" min="1" max="20" value={rows} onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">{t.cols}</label><input type="number" min="1" max="20" value={cols} onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" /></div>
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
        <div className="flex-1" />
        <button onClick={onSplit} disabled={!hasImage || isProcessing} className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-white shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${!hasImage || isProcessing ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500'}`}>
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
  const lastMousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, [imageSrc]);
  const handleZoom = (delta: number) => setZoom(z => Math.max(0.1, Math.min(5, z + delta)));
  const handleMouseDown = (e: MouseEvent) => { if (!imageSrc) return; setIsDragging(true); lastMousePos.current = { x: e.clientX, y: e.clientY }; };
  const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseUp = () => setIsDragging(false);

  // Focus trick: When clicking background, blur any active element to ensure keyboard listeners on window work for grid adjustments
  const handleBackgroundClick = () => {
      setSelectedLine(null);
      if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
      }
  };

  return (
    <div className="flex-1 relative bg-gray-100 flex flex-col h-full" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            {!sidebarOpen && <button onClick={(e) => { e.stopPropagation(); toggleSidebar(); }} className="p-2 bg-white rounded-lg shadow text-gray-600 hover:text-indigo-600"><ChevronRight /></button>}
             <div className="bg-white/90 backdrop-blur shadow-sm rounded-lg p-1.5 flex flex-col gap-1">
                <button onClick={(e) => { e.stopPropagation(); handleZoom(0.1); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); handleZoom(-0.1); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); setZoom(1); setPan({x:0,y:0}); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 text-xs font-bold" title="Reset 100%">1:1</button>
            </div>
        </div>
        <div ref={containerRef} className="flex-1 flex items-center justify-center p-8 cursor-grab active:cursor-grabbing" onClick={handleBackgroundClick}>
            {!imageSrc ? (
            <div className="text-center text-gray-400"><ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" /><p className="text-lg">{t.previewArea}</p><p className="text-sm">{t.previewTip}</p></div>
            ) : (
            <div className="relative shadow-2xl bg-white bg-checkerboard inline-flex select-none" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center', transition: isDragging ? 'none' : 'transform 0.1s ease-out' }}>
                <img src={imageSrc} alt="Preview" className="max-w-none pointer-events-none block" draggable={false} />
                <div className="absolute top-0 left-0 right-0 bg-black/50 pointer-events-none" style={{ height: `${rowPositions[0]}%` }} />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 pointer-events-none" style={{ top: `${rowPositions[rowPositions.length-1]}%` }} />
                <div className="absolute top-0 bottom-0 left-0 bg-black/50 pointer-events-none" style={{ width: `${colPositions[0]}%` }} />
                <div className="absolute top-0 bottom-0 right-0 bg-black/50 pointer-events-none" style={{ left: `${colPositions[colPositions.length-1]}%` }} />
                <div className="absolute inset-0">
                    {rowPositions.map((pos: number, i: number) => {
                        const isSelected = selectedLine?.type === 'row' && selectedLine.index === i;
                        return (
                        <div key={`row-${i}`} className={`absolute left-0 right-0 h-4 -mt-2 cursor-ns-resize group hover:z-30 ${isSelected ? 'z-20' : 'z-10'}`} style={{ top: `${pos}%` }}
                            onMouseDown={(e) => { e.stopPropagation(); onLineDragStart(e, 'row', i); setSelectedLine({type:'row', index:i}); if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); }} onClick={(e) => e.stopPropagation()}>
                            <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 pointer-events-none transition-colors ${isSelected ? 'bg-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.5)]' : 'bg-red-500/80 group-hover:bg-indigo-400 shadow-[0_0_2px_rgba(255,255,255,0.8)]'}`} />
                            {paddingY > 0 && (<>{i > 0 && <div className="absolute left-0 right-0 bottom-1/2 bg-yellow-400/30 border-b border-yellow-500/50 pointer-events-none" style={{ height: `${paddingY}px` }} />}{i < rowPositions.length - 1 && <div className="absolute left-0 right-0 top-1/2 bg-yellow-400/30 border-t border-yellow-500/50 pointer-events-none" style={{ height: `${paddingY}px` }} />}</>)}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full px-1 bg-blue-500 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">{i === 0 || i === rowPositions.length - 1 ? t.edge : `${t.row} ${i}`}</div>
                        </div>
                    )})}
                    {colPositions.map((pos: number, i: number) => {
                        const isSelected = selectedLine?.type === 'col' && selectedLine.index === i;
                        return (
                        <div key={`col-${i}`} className={`absolute top-0 bottom-0 w-4 -ml-2 cursor-ew-resize group hover:z-30 ${isSelected ? 'z-20' : 'z-10'}`} style={{ left: `${pos}%` }}
                            onMouseDown={(e) => { e.stopPropagation(); onLineDragStart(e, 'col', i); setSelectedLine({type:'col', index:i}); if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); }} onClick={(e) => e.stopPropagation()}>
                             <div className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 pointer-events-none transition-colors ${isSelected ? 'bg-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.5)]' : 'bg-red-500/80 group-hover:bg-indigo-400 shadow-[0_0_2px_rgba(255,255,255,0.8)]'}`} />
                             {paddingX > 0 && (<>{i > 0 && <div className="absolute top-0 bottom-0 right-1/2 bg-yellow-400/30 border-r border-yellow-500/50 pointer-events-none" style={{ width: `${paddingX}px` }} />}{i < colPositions.length - 1 && <div className="absolute top-0 bottom-0 left-1/2 bg-yellow-400/30 border-l border-yellow-500/50 pointer-events-none" style={{ width: `${paddingX}px` }} />}</>)}
                             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full px-1 bg-blue-500 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">{i === 0 || i === colPositions.length - 1 ? t.edge : `${t.col} ${i}`}</div>
                        </div>
                    )})}
                </div>
            </div>
            )}
        </div>
    </div>
  );
};

const SingleAdjustModal = ({ 
    srcImage, result, onClose, onSave, onNext, onPrev, hasNext, hasPrev, t
}: { 
    srcImage: HTMLImageElement, result: SplitResult, onClose: () => void, onSave: (blob: Blob, extra: any, action: 'close'|'stay') => void, onNext: () => void, onPrev: () => void, hasNext: boolean, hasPrev: boolean, t: any
}) => {
    const [rect, setRect] = useState(result.originalRect);
    const [margins, setMargins] = useState<Margins>(result.margins || { top: 0, bottom: 0, left: 0, right: 0 });
    const [offset, setOffset] = useState<{x:number, y:number}>(result.offset || {x:0, y:0});
    const [isSquare, setIsSquare] = useState(result.isSquare !== undefined ? result.isSquare : false);
    // Default to 'white' instead of 'transparent'
    const [bgColor, setBgColor] = useState(result.bgColor || 'white');
    const [activeTab, setActiveTab] = useState<'crop' | 'layout'>('crop');
    const [isSaving, setIsSaving] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [viewPan, setViewPan] = useState({x: 0, y: 0});
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({x: 0, y: 0});
    const [tool, setTool] = useState<'move' | 'pan'>('move'); 
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Default preference to 'white'
    const userPrefBgColor = useRef(result.bgColor || 'white');
    const userPrefIsSquare = useRef(result.isSquare || false);

    const isFixedSize = typeof result.outputSize === 'number';

    useEffect(() => {
        setRect(result.originalRect);
        setMargins(result.margins || { top: 0, bottom: 0, left: 0, right: 0 });
        setOffset(result.offset || {x:0, y:0});
        
        const fixed = typeof result.outputSize === 'number';
        if (fixed) setActiveTab('layout');

        // Persistence Logic
        if (result.bgColor) {
            setBgColor(result.bgColor);
            userPrefBgColor.current = result.bgColor;
        } else {
            setBgColor(userPrefBgColor.current);
        }

        if (fixed) {
            setIsSquare(true);
        } else if (result.isSquare !== undefined) {
            setIsSquare(result.isSquare);
            userPrefIsSquare.current = result.isSquare;
        } else {
            setIsSquare(userPrefIsSquare.current);
        }

    }, [result]);

    const handleBgChange = (color: string) => {
        setBgColor(color);
        userPrefBgColor.current = color;
    };

    const handleIsSquareChange = (val: boolean) => {
        setIsSquare(val);
        userPrefIsSquare.current = val;
    };

    const handleSaveWithNavigation = async (direction: 'next' | 'prev' | 'close') => {
        setIsSaving(true);
        const format = (result.extension === 'gif') ? 'gif' : 'png';
        const blob = await generateImageBlob(
            srcImage, rect, margins, offset, isSquare, bgColor, result.outputSize || 'auto', format
        );
        onSave(blob, { margins, offset, isSquare, originalRect: rect, bgColor }, direction === 'close' ? 'close' : 'stay');
        setIsSaving(false);
        if (direction === 'next') onNext();
        if (direction === 'prev') onPrev();
    };

    useEffect(() => {
        const handleKeyDown = (e: globalThis.KeyboardEvent) => {
            if (e.altKey && e.key === 'ArrowRight' && hasNext) handleSaveWithNavigation('next');
            if (e.altKey && e.key === 'ArrowLeft' && hasPrev) handleSaveWithNavigation('prev');
            
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !e.altKey) {
                e.preventDefault();
                const step = e.shiftKey ? 10 : 1;
                if (activeTab === 'crop') {
                     setRect(prev => {
                        const newR = { ...prev };
                        if (e.key === 'ArrowUp') newR.y -= step;
                        if (e.key === 'ArrowDown') newR.y += step;
                        if (e.key === 'ArrowLeft') newR.x -= step;
                        if (e.key === 'ArrowRight') newR.x += step;
                        return newR;
                     });
                } else {
                     if (isSquare || isFixedSize) {
                         setOffset(prev => {
                             const n = { ...prev };
                             if (e.key === 'ArrowUp') n.y -= step;
                             if (e.key === 'ArrowDown') n.y += step;
                             if (e.key === 'ArrowLeft') n.x -= step;
                             if (e.key === 'ArrowRight') n.x += step;
                             return n;
                         })
                     } else {
                         setMargins(prev => {
                             const n = { ...prev };
                             if (e.key === 'ArrowUp') n.top -= step; 
                             if (e.key === 'ArrowDown') n.top += step;
                             if (e.key === 'ArrowLeft') n.left -= step;
                             if (e.key === 'ArrowRight') n.left += step;
                             return n;
                         });
                     }
                }
            }
            if (e.code === 'Space') setTool('pan');
        };
        const handleKeyUp = (e: globalThis.KeyboardEvent) => { if (e.code === 'Space') setTool('move'); }
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, [activeTab, isSquare, isFixedSize, hasNext, hasPrev, rect, margins, offset, bgColor]);

    // ... useEffect for drawing canvas ...
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const w = Math.max(1, rect.w + margins.left + margins.right);
        const h = Math.max(1, rect.h + margins.top + margins.bottom);
        const finalW = isSquare ? Math.max(w, h) : w;
        const finalH = isSquare ? Math.max(w, h) : h;
        canvas.width = finalW; canvas.height = finalH;
        if (bgColor === 'white') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, finalW, finalH); } else { ctx.clearRect(0, 0, finalW, finalH); }
        const contentW = rect.w + margins.left + margins.right;
        const contentH = rect.h + margins.top + margins.bottom;
        const startX = (finalW - contentW) / 2 + margins.left + offset.x;
        const startY = (finalH - contentH) / 2 + margins.top + offset.y;
        const safeRectW = Math.max(1, rect.w);
        const safeRectH = Math.max(1, rect.h);
        ctx.drawImage(srcImage, rect.x, rect.y, safeRectW, safeRectH, startX, startY, safeRectW, safeRectH);
    }, [rect, margins, offset, isSquare, srcImage, bgColor]);

    const handleMouseDown = (e: MouseEvent) => { setIsDragging(true); setDragStart({ x: e.clientX, y: e.clientY }); };
    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const dx = (e.clientX - dragStart.x); const dy = (e.clientY - dragStart.y);
        setDragStart({ x: e.clientX, y: e.clientY });
        if (tool === 'pan') { setViewPan(p => ({ x: p.x + dx, y: p.y + dy })); } else {
            const moveX = dx / zoom; const moveY = dy / zoom;
            if (activeTab === 'crop') { setRect(r => ({...r, x: r.x - moveX, y: r.y - moveY})); } else { if (isSquare) { setOffset(p => ({ x: p.x + moveX, y: p.y + moveY })); } else { setMargins(p => ({ ...p, left: p.left + moveX, top: p.top + moveY })); } }
        }
    };
    const handleMouseUp = () => setIsDragging(false);
    const handleDirectionMove = (dir: 'up'|'down'|'left'|'right', val: number) => {
        if (activeTab === 'crop') { setRect(prev => { const newR = { ...prev }; if (dir === 'up') newR.y -= val; if (dir === 'down') newR.y += val; if (dir === 'left') newR.x -= val; if (dir === 'right') newR.x += val; return newR; }); } else { if (isSquare) { setOffset(prev => { const n = { ...prev }; if (dir === 'up') n.y -= val; if (dir === 'down') n.y += val; if (dir === 'left') n.x -= val; if (dir === 'right') n.x += val; return n; }) } else { setMargins(prev => { const n = { ...prev }; if (dir === 'up') n.top -= val; if (dir === 'down') n.top += val; if (dir === 'left') n.left -= val; if (dir === 'right') n.left += val; return n; }); } }
    };

    const handleInputChange = (field: 'w'|'h', valStr: string) => {
        const val = parseInt(valStr);
        // Allow empty string to let user clear input, otherwise clamp to min 1
        if (valStr === '') return; 
        if (!isNaN(val)) {
            setRect(r => ({...r, [field]: Math.max(1, val)}));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex overflow-hidden">
                <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800"><Pencil className="w-5 h-5 text-indigo-600" /> {t.fineTune}</h3>
                        <div className="flex gap-1">
                            <button onClick={() => handleSaveWithNavigation('prev')} disabled={!hasPrev} className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30" title={`${t.savePrev} (Alt+Left)`}><ChevronLeft className="w-5 h-5" /></button>
                            <button onClick={() => handleSaveWithNavigation('next')} disabled={!hasNext} className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30" title={`${t.saveNext} (Alt+Right)`}><ChevronRight className="w-5 h-5" /></button>
                            <div className="w-px h-6 bg-gray-200 mx-1"></div>
                            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><X className="w-5 h-5" /></button>
                        </div>
                    </div>
                    <div className="flex border-b border-gray-200">
                        <button onClick={() => setActiveTab('crop')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'crop' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}><CropIcon className="w-4 h-4" /> {t.cropTab}</button>
                        <button onClick={() => setActiveTab('layout')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'layout' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}><Layout className="w-4 h-4" /> {t.canvasTab}</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {activeTab === 'crop' ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-200">
                                <CompactDirectionControl onMove={handleDirectionMove} label={t.moveSel} centerContent={<span className="text-[10px] text-gray-400">{t.pos}</span>} />
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.size}</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                            <span className="text-xs text-gray-400">W</span>
                                            <div className="flex-1 flex justify-between items-center">
                                                <button onClick={() => setRect(r => ({...r, w: r.w-1}))} className="w-6 h-6 flex items-center justify-center bg-white border rounded shadow-sm hover:bg-gray-50">-</button>
                                                <input 
                                                    type="number" 
                                                    value={Math.round(rect.w)} 
                                                    onChange={(e) => handleInputChange('w', e.target.value)}
                                                    className="w-12 text-center bg-transparent font-mono font-medium text-sm focus:outline-none focus:border-b border-indigo-300 appearance-none m-0"
                                                />
                                                <button onClick={() => setRect(r => ({...r, w: r.w+1}))} className="w-6 h-6 flex items-center justify-center bg-white border rounded shadow-sm hover:bg-gray-50">+</button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                            <span className="text-xs text-gray-400">H</span>
                                            <div className="flex-1 flex justify-between items-center">
                                                <button onClick={() => setRect(r => ({...r, h: r.h-1}))} className="w-6 h-6 flex items-center justify-center bg-white border rounded shadow-sm hover:bg-gray-50">-</button>
                                                 <input 
                                                    type="number" 
                                                    value={Math.round(rect.h)} 
                                                    onChange={(e) => handleInputChange('h', e.target.value)}
                                                    className="w-12 text-center bg-transparent font-mono font-medium text-sm focus:outline-none focus:border-b border-indigo-300 appearance-none m-0"
                                                />
                                                <button onClick={() => setRect(r => ({...r, h: r.h+1}))} className="w-6 h-6 flex items-center justify-center bg-white border rounded shadow-sm hover:bg-gray-50">+</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                                <CompactDirectionControl onMove={handleDirectionMove} label={t.moveContent} centerContent={<Move className="w-4 h-4 text-indigo-500" />} />
                                <div className="space-y-3">
                                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSquare ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}><input type="checkbox" checked={isSquare} onChange={(e) => !isFixedSize && handleIsSquareChange(e.target.checked)} disabled={isFixedSize} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" /><div><span className="text-sm font-bold text-gray-800 block">{t.autoSquare}</span></div>{isFixedSize && <span className="ml-auto text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold">{t.locked}</span>}</label>
                                    <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-2">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><Palette className="w-3 h-3" /> {t.background}</span>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => handleBgChange('transparent')} className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 border ${bgColor === 'transparent' ? 'bg-checkerboard border-indigo-500 text-indigo-700 shadow-sm ring-1 ring-indigo-500' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}><div className="w-3 h-3 border bg-white/50" /> {t.trans}</button>
                                            <button onClick={() => handleBgChange('white')} className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 border ${bgColor === 'white' ? 'bg-white border-indigo-500 text-indigo-700 shadow-sm ring-1 ring-indigo-500' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}><div className="w-3 h-3 border bg-white" /> {t.white}</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-5 border-t border-gray-200 bg-gray-50 flex gap-3">
                        <button onClick={onClose} className="flex-1 py-2.5 text-sm text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 rounded-xl font-medium transition-all">{t.cancel}</button>
                        <button onClick={() => handleSaveWithNavigation('close')} disabled={isSaving} className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl font-medium shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-70 disabled:scale-100">{isSaving ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4"/>} {t.save}</button>
                    </div>
                </div>
                <div className="flex-1 bg-gray-100 relative bg-checkerboard cursor-crosshair overflow-hidden" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={(e) => { const d = e.deltaY > 0 ? -0.1 : 0.1; setZoom(z => Math.max(0.1, Math.min(5, z + d))); }}>
                    <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur p-2 rounded-lg shadow-sm border border-gray-200 flex gap-3 text-xs font-medium text-gray-500">
                        <span className={`flex items-center gap-1 ${tool === 'move' ? 'text-indigo-600 font-bold' : ''}`}><Move className="w-3 h-3" /> {t.dragMove}</span><span className="w-px bg-gray-300 h-4 self-center" /><span className={`flex items-center gap-1 ${tool === 'pan' ? 'text-indigo-600 font-bold' : ''}`}><Hand className="w-3 h-3" /> {t.spacePan}</span>
                    </div>
                    <div className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out" style={{ transform: `translate(${viewPan.x}px, ${viewPan.y}px) scale(${zoom})` }}>
                        <div className="bg-white shadow-2xl border border-gray-300 relative"> 
                            <canvas ref={canvasRef} className="block" />
                            {activeTab === 'crop' && <div className="absolute inset-0 border-2 border-indigo-500 pointer-events-none opacity-50"><div className="absolute top-0 left-0 bg-indigo-500 text-white text-[10px] px-1">{t.sourceGuide}</div></div>}
                        </div>
                    </div>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                        <button onClick={() => setZoom(z => z - 0.1)} className="p-2 bg-white rounded-full shadow hover:bg-gray-50 text-gray-600"><ZoomOut className="w-4 h-4" /></button><span className="px-3 py-2 bg-white rounded-full shadow text-xs font-mono text-gray-600 flex items-center">{Math.round(zoom * 100)}%</span><button onClick={() => setZoom(z => z + 0.1)} className="p-2 bg-white rounded-full shadow hover:bg-gray-50 text-gray-600"><ZoomIn className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ResultsGallery = ({ 
    results, onClose, onDownloadAll, onEdit, t
}: { 
    results: SplitResult[], onClose: () => void, onDownloadAll: () => void, onEdit: (res: SplitResult) => void, t: any
}) => {
    return (
        <div className="fixed inset-0 z-40 bg-gray-100 flex flex-col animate-in fade-in duration-300">
            <div className="bg-white shadow-sm border-b border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3"><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><ArrowLeft className="w-5 h-5" /></button><h2 className="text-xl font-bold text-gray-800">{t.resultsTitle} <span className="ml-2 text-sm font-normal text-gray-500">({results.length} {t.images})</span></h2></div>
                <div className="flex gap-3"><button onClick={onDownloadAll} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 font-medium flex items-center gap-2 transition-transform active:scale-95"><Download className="w-4 h-4" /> {t.downloadAll}</button></div>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {results.map((res) => (
                        <div key={res.id} className="group relative bg-white rounded-xl shadow-sm border border-gray-200 aspect-square flex flex-col transition-all hover:shadow-md hover:border-indigo-300">
                            <div className="flex-1 p-4 flex items-center justify-center bg-checkerboard rounded-t-xl overflow-hidden"><img src={res.dataUrl} className="max-w-full max-h-full object-contain shadow-sm" alt="" /></div>
                            <div className="p-3 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-xl">
                                <span className="text-xs font-mono text-gray-500">#{res.id + 1}</span>
                                <div className="flex gap-1">
                                    <button onClick={() => onEdit(res)} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded text-gray-500 transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => downloadBlob(res.blob, `split_${res.id+1}.${res.extension}`)} className="p-1.5 hover:bg-white hover:text-green-600 rounded text-gray-500 transition-colors" title="Download"><Download className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const App = () => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
    const [rows, setRows] = useState(4);
    const [cols, setCols] = useState(4);
    const [rowPositions, setRowPositions] = useState<number[]>([0, 25, 50, 75, 100]);
    const [colPositions, setColPositions] = useState<number[]>([0, 25, 50, 75, 100]);
    const [paddingX, setPaddingX] = useState(0);
    const [paddingY, setPaddingY] = useState(0);
    const [linkPadding, setLinkPadding] = useState(true);
    const [format, setFormat] = useState<'png' | 'gif'>('png');
    const [outputSize, setOutputSize] = useState<number | 'auto'>('auto');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedLine, setSelectedLine] = useState<{type: 'row'|'col', index: number} | null>(null);
    const [results, setResults] = useState<SplitResult[] | null>(null);
    const [editingResult, setEditingResult] = useState<SplitResult | null>(null);
    const [history, setHistory] = useState<HistoryState[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const isUndoRedo = useRef(false);
    
    // Language
    const [lang, setLang] = useState<Lang>('en');
    const t: any = translations[lang];

    // Refs for keyboard adjustment
    const rowPositionsRef = useRef(rowPositions);
    const colPositionsRef = useRef(colPositions);
    
    useEffect(() => { rowPositionsRef.current = rowPositions; }, [rowPositions]);
    useEffect(() => { colPositionsRef.current = colPositions; }, [colPositions]);

    useEffect(() => { setLang(getBrowserLang()); }, []);

    useEffect(() => {
        if (!imageSrc) return;
        if (history.length === 0) {
            const initial = { rows, cols, rowPositions, colPositions };
            setHistory([initial]);
            setHistoryIndex(0);
        }
    }, [imageSrc]);

    const addToHistory = (newState: HistoryState) => {
        if (isUndoRedo.current) return;
        setHistory(prev => {
            const current = prev.slice(0, historyIndex + 1);
            const last = current[current.length - 1];
            if (last && JSON.stringify(last) === JSON.stringify(newState)) return current;
            const next = [...current, newState];
            setHistoryIndex(next.length - 1);
            return next;
        });
    };

    useEffect(() => {
        const handleKeyDown = (e: globalThis.KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return;
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) handleRedo();
                else handleUndo();
                return;
            }
            if (selectedLine) {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                    e.preventDefault();
                    const step = e.shiftKey ? 2 : 0.2;
                    let newRP = [...rowPositionsRef.current];
                    let newCP = [...colPositionsRef.current];
                    let changed = false;
                    if (selectedLine.type === 'row') {
                        const idx = selectedLine.index;
                        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                            const limit = idx > 0 ? newRP[idx-1] : -10;
                            const newVal = Math.max(limit + 0.1, newRP[idx] - step);
                            if (newVal !== newRP[idx]) { newRP[idx] = Number(newVal.toFixed(2)); changed = true; }
                        } else {
                            const limit = idx < newRP.length - 1 ? newRP[idx+1] : 110;
                            const newVal = Math.min(limit - 0.1, newRP[idx] + step);
                            if (newVal !== newRP[idx]) { newRP[idx] = Number(newVal.toFixed(2)); changed = true; }
                        }
                    } else {
                        const idx = selectedLine.index;
                        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                            const limit = idx > 0 ? newCP[idx-1] : -10;
                            const newVal = Math.max(limit + 0.1, newCP[idx] - step);
                            if (newVal !== newCP[idx]) { newCP[idx] = Number(newVal.toFixed(2)); changed = true; }
                        } else {
                            const limit = idx < newCP.length - 1 ? newCP[idx+1] : 110;
                            const newVal = Math.min(limit - 0.1, newCP[idx] + step);
                            if (newVal !== newCP[idx]) { newCP[idx] = Number(newVal.toFixed(2)); changed = true; }
                        }
                    }
                    if (changed) {
                        setRowPositions(newRP);
                        setColPositions(newCP);
                        addToHistory({ rows, cols, rowPositions: newRP, colPositions: newCP });
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedLine, history, historyIndex, rows, cols]);

    const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const url = URL.createObjectURL(e.target.files[0]);
            const img = new Image();
            img.onload = () => {
                setImageSrc(url);
                setImageElement(img);
                const initR = generatePositions(4);
                const initC = generatePositions(4);
                setRowPositions(initR);
                setColPositions(initC);
                setHistory([{ rows: 4, cols: 4, rowPositions: initR, colPositions: initC }]);
                setHistoryIndex(0);
            };
            img.src = url;
        }
    };

    const handleRowChange = (n: number) => {
        setRows(n);
        const rp = generatePositions(n);
        setRowPositions(rp);
        addToHistory({ rows: n, cols, rowPositions: rp, colPositions });
    };

    const handleColChange = (n: number) => {
        setCols(n);
        const cp = generatePositions(n);
        setColPositions(cp);
        addToHistory({ rows, cols, rowPositions, colPositions: cp });
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            isUndoRedo.current = true;
            const prev = history[historyIndex - 1];
            setRows(prev.rows);
            setCols(prev.cols);
            setRowPositions(prev.rowPositions);
            setColPositions(prev.colPositions);
            setHistoryIndex(historyIndex - 1);
            setTimeout(() => isUndoRedo.current = false, 0);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            isUndoRedo.current = true;
            const next = history[historyIndex + 1];
            setRows(next.rows);
            setCols(next.cols);
            setRowPositions(next.rowPositions);
            setColPositions(next.colPositions);
            setHistoryIndex(historyIndex + 1);
            setTimeout(() => isUndoRedo.current = false, 0);
        }
    };

    const onLineDragStart = (e: MouseEvent, type: 'row' | 'col', index: number) => {
        e.preventDefault();
        e.stopPropagation();
        const container = (e.currentTarget as HTMLElement).parentElement;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const handleMove = (ev: globalThis.MouseEvent) => {
            const isRow = type === 'row';
            const clientPos = isRow ? ev.clientY : ev.clientX;
            const startPos = isRow ? rect.top : rect.left;
            const dimension = isRow ? rect.height : rect.width;
            let pct = ((clientPos - startPos) / dimension) * 100;
            pct = Math.max(0, Math.min(100, pct));
            if (isRow) { setRowPositions(prev => { const next = [...prev]; next[index] = pct; return next.sort((a,b) => a-b); }); }
            else { setColPositions(prev => { const next = [...prev]; next[index] = pct; return next.sort((a,b) => a-b); }); }
        };
        const handleUp = () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); addToHistory({ rows, cols, rowPositions, colPositions }); };
        window.addEventListener('mousemove', handleMove); window.addEventListener('mouseup', handleUp);
    };

    const handleSplit = async () => {
        if (!imageElement) return;
        setIsProcessing(true);
        try {
            const newResults: SplitResult[] = [];
            const sortedRows = [...rowPositions].sort((a, b) => a - b);
            const sortedCols = [...colPositions].sort((a, b) => a - b);
            const iw = imageElement.naturalWidth;
            const ih = imageElement.naturalHeight;
            let idCounter = 0;
            for (let r = 0; r < sortedRows.length - 1; r++) {
                for (let c = 0; c < sortedCols.length - 1; c++) {
                    const y1 = (sortedRows[r] / 100) * ih;
                    const y2 = (sortedRows[r+1] / 100) * ih;
                    const x1 = (sortedCols[c] / 100) * iw;
                    const x2 = (sortedCols[c+1] / 100) * iw;
                    const contentX = x1 + paddingX;
                    const contentY = y1 + paddingY;
                    const contentW = Math.max(1, (x2 - x1) - (paddingX * 2));
                    const contentH = Math.max(1, (y2 - y1) - (paddingY * 2));
                    const rect = { x: contentX, y: contentY, w: contentW, h: contentH };
                    const blob = await generateImageBlob(imageElement, rect, {top:0, bottom:0, left:0, right:0}, {x:0, y:0}, false, 'transparent', outputSize, format);
                    newResults.push({ id: idCounter++, dataUrl: URL.createObjectURL(blob), blob: blob, extension: format, originalRect: rect, outputSize: outputSize });
                }
            }
            setResults(newResults);
        } catch (error) { console.error(error); alert("Error splitting image"); } finally { setIsProcessing(false); }
    };
    
    const handleDownloadAll = async () => {
        if (!results) return;
        const zip = new JSZip();
        results.forEach(res => { zip.file(`split_${res.id + 1}.${res.extension}`, res.blob); });
        const content = await zip.generateAsync({ type: 'blob' });
        downloadBlob(content, 'emojis.zip');
    };
    
    const handleSaveSingle = (newBlob: Blob, extra: any, action: 'close'|'stay') => {
        if (!editingResult || !results) return;
        const newUrl = URL.createObjectURL(newBlob);
        const newResults = results.map(r => r.id === editingResult.id ? { ...r, blob: newBlob, dataUrl: newUrl, ...extra } : r);
        setResults(newResults);
        if (action === 'close') setEditingResult(null);
    };

    const handleNextEdit = () => { if (!editingResult || !results) return; const idx = results.findIndex(r => r.id === editingResult.id); if (idx < results.length - 1) setEditingResult(results[idx + 1]); };
    const handlePrevEdit = () => { if (!editingResult || !results) return; const idx = results.findIndex(r => r.id === editingResult.id); if (idx > 0) setEditingResult(results[idx - 1]); };

    return (
        <div className="flex h-screen w-full bg-gray-100 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-700 overflow-hidden">
            <div className="flex-1 flex justify-center h-full max-w-[1600px] mx-auto bg-white shadow-2xl overflow-hidden">
                <Sidebar 
                    onUpload={handleUpload}
                    rows={rows} setRows={handleRowChange}
                    cols={cols} setCols={handleColChange}
                    paddingX={paddingX} setPaddingX={setPaddingX}
                    paddingY={paddingY} setPaddingY={setPaddingY}
                    linkPadding={linkPadding} setLinkPadding={setLinkPadding}
                    format={format} setFormat={setFormat}
                    outputSize={outputSize} setOutputSize={setOutputSize}
                    onSplit={handleSplit} hasImage={!!imageSrc} isProcessing={isProcessing}
                    onResetGrid={() => { const p = generatePositions(rows); setRowPositions(p); setColPositions(p); addToHistory({rows, cols, rowPositions:p, colPositions:p}); }}
                    isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    canUndo={historyIndex > 0} canRedo={historyIndex < history.length - 1} onUndo={handleUndo} onRedo={handleRedo}
                    t={t}
                    lang={lang}
                    setLang={setLang}
                />
                <div className="flex-1 flex flex-col relative overflow-hidden">
                    <PreviewArea 
                        imageSrc={imageSrc} rows={rows} cols={cols} rowPositions={rowPositions} colPositions={colPositions}
                        paddingX={paddingX} paddingY={paddingY} onLineDragStart={onLineDragStart} selectedLine={selectedLine} setSelectedLine={setSelectedLine}
                        sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                        t={t}
                    />
                </div>
            </div>
            {results && <ResultsGallery results={results} onClose={() => setResults(null)} onDownloadAll={handleDownloadAll} onEdit={(res) => setEditingResult(res)} t={t} />}
            {editingResult && imageElement && <SingleAdjustModal 
                srcImage={imageElement} result={editingResult} onClose={() => setEditingResult(null)} 
                onSave={handleSaveSingle} 
                onNext={handleNextEdit} 
                onPrev={handlePrevEdit} 
                hasNext={results ? results.findIndex(r => r.id === editingResult.id) < results.length - 1 : false} 
                hasPrev={results ? results.findIndex(r => r.id === editingResult.id) > 0 : false} 
                t={t}
            />}
        </div>
    );
};
