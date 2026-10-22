import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage, Attachment } from '../types';
import { GhostLogo } from './GhostLogo';
import { MarkdownRenderer } from './MarkdownRenderer';
import { playTextToSpeech, stopAudioPlayback } from '../utils/audio';
import {
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  ExternalLink,
  Code2,
  Brain,
  FileSearch,
  Sparkles,
  Edit3,
  Globe,
  FileText,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Maximize2,
  X
} from 'lucide-react';

interface ChatAreaProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSelectPrompt: (prompt: string) => void;
  onRegenerate: () => void;
  onEditMessage: (messageId: string, newText: string) => void;
  currentModel: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isStreaming,
  onSelectPrompt,
  onRegenerate,
  onEditMessage,
  currentModel,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'up' | 'down'>>({});

  // Auto-scroll when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopAudioPlayback();
    };
  }, []);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error('Failed to copy message:', e);
    }
  };

  const handlePlayTTS = async (id: string, text: string) => {
    if (playingId === id) {
      stopAudioPlayback();
      setPlayingId(null);
      return;
    }

    setPlayingId(id);
    await playTextToSpeech(
      text,
      'Kore',
      () => setPlayingId(id),
      () => setPlayingId(null),
      () => setPlayingId(null)
    );
  };

  const startEdit = (msg: ChatMessage) => {
    setEditingId(msg.id);
    setEditText(msg.content);
  };

  const saveEdit = (msgId: string) => {
    if (editText.trim()) {
      onEditMessage(msgId, editText.trim());
    }
    setEditingId(null);
  };

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    setFeedbackMap((prev) => ({
      ...prev,
      [id]: prev[id] === type ? (null as any) : type,
    }));
  };

  // Quick Starter Prompts
  const STARTER_PROMPTS = [
    {
      icon: <Code2 className="w-4 h-4 text-purple-400" />,
      title: 'Advanced Architecture',
      desc: 'Design a distributed cache system with TTL eviction in TypeScript',
      prompt: 'Design a high-performance distributed caching system in TypeScript with sliding window rate limiting and TTL eviction strategies. Provide implementation and architectural decisions.',
    },
    {
      icon: <Brain className="w-4 h-4 text-indigo-400" />,
      title: 'Deep Logical Reasoning',
      desc: 'Explain quantum entanglement and quantum teleportation with analogies',
      prompt: 'Explain the principles of quantum entanglement and quantum teleportation. Use clear physical analogies, address the no-communication theorem, and outline modern experimental verifications.',
    },
    {
      icon: <FileSearch className="w-4 h-4 text-emerald-400" />,
      title: 'Multimodal Analysis',
      desc: 'Upload code, PDF, CSV, or images for deep structural review',
      prompt: 'I am attaching files or logs for you to analyze. Provide a structured review covering architectural soundness, key findings, and action items.',
    },
    {
      icon: <Globe className="w-4 h-4 text-cyan-400" />,
      title: 'Live Web Intelligence',
      desc: 'Research latest AI breakthroughs and autonomous agents in 2026',
      prompt: 'Provide a comprehensive overview of the latest advancements in autonomous AI agents and multimodal models in 2026, comparing architectural trends and commercial milestones.',
    },
  ];

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 sm:px-4 md:px-6 py-3 sm:py-5 space-y-4 sm:space-y-6 overscroll-contain">
      {/* Lightbox Modal for Attachment Images */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90dvh] overflow-hidden rounded-2xl border border-white/20">
            <img src={previewImage} alt="Attachment Preview" className="w-full h-full object-contain" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Empty State / Welcome Screen */}
      {messages.length === 0 ? (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center max-w-3xl mx-auto px-3 sm:px-4">
          {/* Logo & Headline */}
          <div className="relative mb-4 sm:mb-6">
            <GhostLogo size={68} glow={true} className="animate-ghost-pulse" />
          </div>

          <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-400 bg-clip-text text-transparent mb-1.5 sm:mb-2">
            BLACK GHOST AI
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm md:text-base max-w-lg mb-6 sm:mb-8 font-light px-2">
            Beyond Limits. Beyond Imagination. Experience elite intelligence powered by Google Gemini.
          </p>

          {/* Quick Prompts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full">
            {STARTER_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPrompt(item.prompt)}
                className="flex flex-col text-left p-3 sm:p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] active:bg-white/[0.08] border border-white/5 hover:border-purple-500/30 transition-all group shadow-lg shadow-black/20 cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-white/[0.04] group-hover:bg-purple-950/40 transition-colors shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-xs font-semibold text-gray-200 group-hover:text-purple-300 transition-colors truncate">
                    {item.title}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-400 group-hover:text-gray-300 font-light leading-relaxed line-clamp-2">
                  {item.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Messages Thread */
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 w-full">
          {messages.map((message) => {
            const isUser = message.role === 'user';

            return (
              <div
                key={message.id}
                className={`flex gap-2 sm:gap-3 md:gap-4 w-full ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Assistant Ghost Avatar */}
                {!isUser && (
                  <div className="shrink-0 mt-1">
                    <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-950/30">
                      <GhostLogo size={18} glow={false} />
                      {message.isStreaming && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
                      )}
                    </div>
                  </div>
                )}

                {/* Message Body */}
                <div
                  className={`flex flex-col w-full max-w-[92%] sm:max-w-[85%] md:max-w-[80%] min-w-0 ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Assistant Model Name Tag */}
                  {!isUser && (
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 px-1">
                      <span className="text-[10px] sm:text-[11px] font-semibold text-purple-300 tracking-wider">
                        BLACK GHOST AI
                      </span>
                      <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded bg-white/[0.04] text-gray-400 font-mono border border-white/5 truncate max-w-[140px]">
                        {message.modelUsed || currentModel}
                      </span>
                    </div>
                  )}

                  {/* Bubble Container */}
                  <div
                    className={`rounded-2xl p-3 sm:p-4 md:p-5 shadow-xl transition-all w-full max-w-full overflow-hidden break-words ${
                      isUser
                        ? 'bg-[#151722] border border-white/10 text-gray-100 rounded-tr-none'
                        : 'bg-[#090b12] border border-white/5 text-gray-100 rounded-tl-none'
                    }`}
                  >
                    {/* Multimodal Attachments Display */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2.5 mb-3">
                        {message.attachments.map((att) => {
                          const isImage = att.mimeType.startsWith('image/');
                          return (
                            <div
                              key={att.id}
                              className="group relative rounded-xl overflow-hidden border border-white/10 bg-black/40"
                            >
                              {isImage ? (
                                <div
                                  onClick={() => setPreviewImage(att.data)}
                                  className="relative cursor-pointer max-w-[200px] max-h-[160px] overflow-hidden"
                                >
                                  <img
                                    src={att.data}
                                    alt={att.name}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Maximize2 className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 p-2.5 pr-4 text-xs">
                                  <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="truncate font-medium text-gray-200 max-w-[140px]">
                                      {att.name}
                                    </p>
                                    <p className="text-[10px] text-gray-400 uppercase">
                                      {att.mimeType.split('/')[1] || 'Doc'}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Message Content: Edit Form vs Markdown */}
                    {editingId === message.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full p-2.5 bg-black/50 border border-purple-500/40 rounded-xl text-xs text-white focus:outline-none resize-none"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => saveEdit(message.id)}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium"
                          >
                            Resend
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 bg-white/10 text-gray-300 rounded-lg text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <MarkdownRenderer content={message.content} />
                        {message.isStreaming && (
                          <span className="inline-block w-2 h-4 ml-1 bg-purple-400 animate-pulse rounded-sm align-middle" />
                        )}
                      </>
                    )}

                    {/* Error display if generation failed */}
                    {message.error && (
                      <div className="mt-3 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                        <div>
                          <p className="font-semibold">Request Failed</p>
                          <p className="text-red-300/90 text-[11px] mt-0.5">{message.error}</p>
                        </div>
                      </div>
                    )}

                    {/* Grounding Sources (Google Search Citations) */}
                    {message.groundingSources && message.groundingSources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-1.5 text-xs text-purple-300 font-medium mb-2">
                          <Globe className="w-3.5 h-3.5" />
                          <span>Sources & Citations:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {message.groundingSources.map((source, sIdx) => (
                            <a
                              key={sIdx}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-[11px] text-gray-300 hover:text-purple-300 transition-colors"
                            >
                              <span className="truncate max-w-[160px]">{source.title}</span>
                              <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 px-1 text-gray-500 text-xs">
                    <span className="text-[10px]">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopy(message.id, message.content)}
                      className="p-1.5 min-w-[30px] min-h-[30px] flex items-center justify-center rounded-lg hover:text-gray-300 hover:bg-white/5 active:bg-white/10 transition-colors"
                      title="Copy content"
                      aria-label="Copy content"
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* TTS Read Aloud for Assistant */}
                    {!isUser && !message.isStreaming && (
                      <button
                        onClick={() => handlePlayTTS(message.id, message.content)}
                        className={`p-1.5 min-w-[30px] min-h-[30px] flex items-center justify-center rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors ${
                          playingId === message.id
                            ? 'text-purple-400 animate-pulse'
                            : 'hover:text-gray-300'
                        }`}
                        title={playingId === message.id ? 'Stop audio' : 'Read aloud with AI TTS'}
                        aria-label="Read aloud"
                      >
                        {playingId === message.id ? (
                          <VolumeX className="w-3.5 h-3.5 text-purple-400" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    {/* Regenerate for Assistant */}
                    {!isUser && !message.isStreaming && onRegenerate && (
                      <button
                        onClick={onRegenerate}
                        className="p-1.5 min-w-[30px] min-h-[30px] flex items-center justify-center rounded-lg hover:text-gray-300 hover:bg-white/5 active:bg-white/10 transition-colors"
                        title="Regenerate this answer"
                        aria-label="Regenerate answer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* User Edit & Resend */}
                    {isUser && (
                      <button
                        onClick={() => startEdit(message)}
                        className="p-1.5 min-w-[30px] min-h-[30px] flex items-center justify-center rounded-lg hover:text-gray-300 hover:bg-white/5 active:bg-white/10 transition-colors"
                        title="Edit and resend"
                        aria-label="Edit message"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Thumbs up / down feedback */}
                    {!isUser && !message.isStreaming && (
                      <div className="flex items-center gap-1 border-l border-white/5 pl-1.5 ml-0.5">
                        <button
                          onClick={() => handleFeedback(message.id, 'up')}
                          className={`p-1.5 min-w-[30px] min-h-[30px] flex items-center justify-center rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors ${
                            feedbackMap[message.id] === 'up'
                              ? 'text-emerald-400'
                              : 'hover:text-gray-300'
                          }`}
                          title="Good response"
                          aria-label="Thumbs up"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleFeedback(message.id, 'down')}
                          className={`p-1.5 min-w-[30px] min-h-[30px] flex items-center justify-center rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors ${
                            feedbackMap[message.id] === 'down'
                              ? 'text-red-400'
                              : 'hover:text-gray-300'
                          }`}
                          title="Poor response"
                          aria-label="Thumbs down"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
