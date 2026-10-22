import React, { useRef, useState, useEffect } from 'react';
import { Attachment } from '../types';
import {
  ArrowUp,
  Paperclip,
  Globe,
  Mic,
  MicOff,
  Square,
  X,
  FileText,
  Image as ImageIcon,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface ComposerProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  onStopGeneration: () => void;
  isStreaming: boolean;
  enableSearch: boolean;
  onToggleSearch: () => void;
  disabled?: boolean;
}

export const Composer: React.FC<ComposerProps> = ({
  onSendMessage,
  onStopGeneration,
  isStreaming,
  enableSearch,
  onToggleSearch,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea as content grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [text]);

  // Handle file uploads (Images, Documents, Text, PDFs)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    await processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFiles = async (files: File[]) => {
    const newAttachments: Attachment[] = [];

    for (const file of files) {
      // 20MB limit per file
      if (file.size > 20 * 1024 * 1024) {
        setRecognitionError(`File "${file.name}" exceeds 20MB limit.`);
        setTimeout(() => setRecognitionError(null), 4000);
        continue;
      }

      try {
        const base64 = await readFileAsBase64(file);
        newAttachments.push({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          data: base64,
        });
      } catch (err) {
        console.error('Failed to read file:', file.name, err);
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Submit Handler
  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isStreaming || disabled) return;
    onSendMessage(text.trim(), attachments);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Speech Recognition (Dictation) via Web Speech API
  const toggleSpeechRecognition = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecognitionError('Speech recognition is not supported in this browser.');
      setTimeout(() => setRecognitionError(null), 4000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setRecognitionError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error !== 'no-speech') {
          setRecognitionError(`Mic error: ${event.error}`);
          setTimeout(() => setRecognitionError(null), 4000);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Speech recognition setup error:', err);
      setIsRecording(false);
      setRecognitionError('Microphone access denied or unavailable.');
      setTimeout(() => setRecognitionError(null), 4000);
    }
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-2 sm:p-3 md:p-4 max-w-4xl mx-auto w-full pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] shrink-0 bg-gradient-to-t from-[#07080c] via-[#07080c]/95 to-transparent z-20">
      {/* Recognition error badge */}
      {recognitionError && (
        <div className="mb-2 px-3 py-1.5 rounded-lg bg-red-950/70 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{recognitionError}</span>
        </div>
      )}

      {/* Main Composer Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl bg-[#0b0d14] border shadow-2xl shadow-purple-950/20 focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/30 transition-all ${
          isDragging
            ? 'border-purple-400 ring-2 ring-purple-500/40 bg-purple-950/20'
            : 'border-white/10'
        }`}
      >
        {isDragging && (
          <div className="absolute inset-0 z-20 bg-purple-950/60 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-dashed border-purple-400 pointer-events-none p-4 text-center">
            <p className="text-xs font-semibold text-purple-200">Drop files to attach to Black Ghost AI</p>
          </div>
        )}

        {/* Attachment chips above text */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2.5 sm:p-3 pb-0 max-h-32 overflow-y-auto">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-gray-200 group max-w-[calc(100vw-3rem)] sm:max-w-xs"
              >
                {att.mimeType.startsWith('image/') ? (
                  <div className="w-6 h-6 rounded-md overflow-hidden bg-black/40 shrink-0">
                    <img src={att.data} alt={att.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{att.name}</p>
                  <p className="text-[10px] text-gray-400">{formatSize(att.size)}</p>
                </div>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="p-1 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors"
                  aria-label="Remove attachment"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isRecording
              ? 'Listening to your voice... Speak now.'
              : enableSearch
              ? 'Ask anything (Web Search ON)...'
              : 'Message BLACK GHOST AI...'
          }
          rows={1}
          disabled={disabled}
          className="w-full bg-transparent px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none resize-none leading-relaxed max-h-[140px] sm:max-h-[220px]"
        />

        {/* Action Toolbar Bottom */}
        <div className="flex items-center justify-between px-2.5 sm:px-3 py-2 border-t border-white/5">
          {/* Left tools: Attachments, Web Search, Microphone */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*,application/pdf,text/*,.csv,.json,.py,.js,.ts,.tsx,.html,.css"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 sm:p-2.5 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-gray-400 hover:text-purple-300 hover:bg-white/5 active:bg-white/10 transition-all"
              title="Attach files, documents, or images"
              aria-label="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Web Search Grounding Toggle */}
            <button
              type="button"
              onClick={onToggleSearch}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:py-2 min-h-[38px] rounded-xl text-xs font-medium transition-all ${
                enableSearch
                  ? 'bg-purple-900/40 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-500/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 active:bg-white/10 border border-transparent'
              }`}
              title="Toggle Google Search Grounding for live web information"
              aria-label="Toggle web search"
            >
              <Globe className={`w-3.5 h-3.5 ${enableSearch ? 'text-purple-400' : ''}`} />
              <span className="hidden sm:inline">
                {enableSearch ? 'Search ON' : 'Search'}
              </span>
            </button>

            {/* Microphone Dictation */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-2 sm:p-2.5 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl transition-all ${
                isRecording
                  ? 'bg-red-600/30 text-red-400 border border-red-500/40 animate-pulse'
                  : 'text-gray-400 hover:text-purple-300 hover:bg-white/5 active:bg-white/10'
              }`}
              title={isRecording ? 'Stop voice recording' : 'Voice input (Speech to Text)'}
              aria-label="Voice input"
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          {/* Right tools: Stop streaming or Send */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] text-gray-500 font-mono hidden md:inline">
              {text.length > 0 ? `${text.length} chars` : ''}
            </span>

            {isStreaming ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-xl bg-red-900/50 hover:bg-red-800/60 active:bg-red-800 text-red-200 border border-red-500/40 text-xs font-medium transition-all cursor-pointer"
                title="Stop generation"
                aria-label="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={(!text.trim() && attachments.length === 0) || disabled}
                className={`p-2 sm:p-2.5 min-w-[40px] min-h-[40px] rounded-xl font-medium transition-all flex items-center justify-center ${
                  text.trim() || attachments.length > 0
                    ? 'bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white shadow-lg shadow-purple-600/30 active:scale-95 cursor-pointer'
                    : 'bg-white/5 text-gray-600 cursor-not-allowed'
                }`}
                title="Send message (Enter)"
                aria-label="Send message"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
