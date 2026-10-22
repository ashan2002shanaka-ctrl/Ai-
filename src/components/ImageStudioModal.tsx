import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Download,
  Copy,
  Check,
  Maximize2,
  RefreshCw,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';

interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImageStudioModal: React.FC<ImageStudioModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<
    Array<{ id: string; url: string; prompt: string; timestamp: number }>
  >([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/image-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), aspectRatio }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      const newImg = {
        id: Math.random().toString(36).substring(2, 9),
        url: data.imageUrl,
        prompt: prompt.trim(),
        timestamp: Date.now(),
      };

      setGeneratedImages((prev) => [newImg, ...prev]);
      setActiveImage(data.imageUrl);
    } catch (err: any) {
      console.error('Image generation error:', err);
      setError(err?.message || 'Error generating image with Gemini 3.1 Flash Lite Image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (imageUrl: string, promptText: string) => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `black-ghost-${promptText.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    a.click();
  };

  const SAMPLE_PROMPTS = [
    'A cybernetic stealth phantom standing on the edge of a rainy neon cyberpunk skyscraper, volumetric lighting, photorealistic 8k',
    'Futuristic quantum core sphere glowing with electric violet plasma in a dark obsidian chamber',
    'Minimalist matte-black stealth robot concept art with subtle neon purple accents and silver trim',
    'Abstract dark matter nebula swirling with holographic geometric constellations in deep space',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#090b12] border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-base font-bold text-white flex items-center gap-1.5 sm:gap-2">
                <span>Image Studio</span>
                <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-500/20 font-mono">
                  gemini-3.1-flash-lite-image
                </span>
              </h2>
              <p className="text-[11px] text-gray-400 hidden sm:block">Generate visual concepts directly with official Gemini models</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
            aria-label="Close image studio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 sm:space-y-5 overflow-y-auto max-h-[calc(90dvh-120px)]">
          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
              <span>Image Prompt</span>
              <span className="text-[11px] text-gray-500 font-normal hidden sm:inline">Describe your desired visual in detail</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Sleek futuristic obsidian sentinel with purple neon light trails..."
                className="flex-1 px-3.5 sm:px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500/50 min-h-[42px]"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className={`px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[42px] ${
                  prompt.trim() && !isGenerating
                    ? 'bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs text-gray-400 font-medium mr-1">Aspect Ratio:</span>
            {(['1:1', '16:9', '9:16', '4:3', '3:4'] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  aspectRatio === ratio
                    ? 'bg-purple-950/60 text-purple-200 border border-purple-500/40 shadow-sm'
                    : 'bg-white/[0.03] text-gray-400 hover:text-gray-200 border border-white/5'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>

          {/* Sample Prompts */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Inspiration Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(p)}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-[11px] text-gray-400 hover:text-purple-300 transition-colors text-left truncate max-w-xs"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Active Preview Area */}
          {activeImage && (
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/60 flex items-center justify-center max-h-[400px]">
              <img src={activeImage} alt="Generated visual" className="max-h-[380px] w-auto object-contain rounded-xl" />
              <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-black/70 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
                <button
                  onClick={() => handleDownload(activeImage, prompt)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                  title="Download PNG"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* History Gallery */}
          {generatedImages.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-400">Generated Session History ({generatedImages.length})</span>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {generatedImages.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setActiveImage(img.url)}
                    className={`relative rounded-xl overflow-hidden cursor-pointer border aspect-square bg-black/40 ${
                      activeImage === img.url ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-white/5 hover:border-white/20'
                    }`}
                  >
                    <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
