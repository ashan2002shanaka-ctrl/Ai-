import React, { useState, useEffect, useRef } from 'react';
import { Conversation, ChatMessage, Attachment, AppSettings } from './types';
import {
  loadConversations,
  saveConversations,
  loadActiveId,
  saveActiveId,
  loadSettings,
  saveSettings,
  DEFAULT_SETTINGS,
} from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { Composer } from './components/Composer';
import { SettingsModal } from './components/SettingsModal';
import { ImageStudioModal } from './components/ImageStudioModal';
import { SplashScreen } from './components/SplashScreen';
import { GhostLogo } from './components/GhostLogo';
import {
  Menu,
  Sparkles,
  Sliders,
  Globe,
  Plus,
  Image as ImageIcon,
  ChevronDown
} from 'lucide-react';

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return localStorage.getItem('black_ghost_splash_dismissed') !== 'true';
    } catch {
      return true;
    }
  });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImageStudioOpen, setIsImageStudioOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleEnterApp = () => {
    setShowSplash(false);
    try {
      localStorage.setItem('black_ghost_splash_dismissed', 'true');
    } catch (e) {
      console.warn('Failed to save splash preference', e);
    }
  };

  // Initialize data on mount
  useEffect(() => {
    const loadedConvs = loadConversations();
    const loadedSettings = loadSettings();
    const storedActiveId = loadActiveId();

    setConversations(loadedConvs);
    setSettings(loadedSettings);

    if (storedActiveId && loadedConvs.some((c) => c.id === storedActiveId)) {
      setActiveId(storedActiveId);
    } else if (loadedConvs.length > 0) {
      setActiveId(loadedConvs[0].id);
    }
  }, []);

  // Sync to local storage
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    saveActiveId(activeId);
  }, [activeId]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Global keyboard shortcuts (Ctrl+N for new chat)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewConversation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [conversations, settings]);

  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  // Create New Conversation
  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: Math.random().toString(36).substring(2, 9),
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      model: settings.model,
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
  };

  // Delete Conversation
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (activeId === id) {
        setActiveId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
  };

  // Rename Conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  // Pin / Unpin Conversation
  const handleTogglePinConversation = (id: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, isPinned: !c.isPinned, updatedAt: Date.now() } : c
      )
    );
  };

  // Clear All Conversations
  const handleClearAll = () => {
    setConversations([]);
    setActiveId(null);
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    // Mark active streaming message as stopped
    if (activeId) {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeId) return c;
          const updatedMessages = c.messages.map((m) =>
            m.isStreaming ? { ...m, isStreaming: false } : m
          );
          return { ...c, messages: updatedMessages };
        })
      );
    }
  };

  // Construct System Instructions including User Profile Memory
  const buildSystemInstructions = (): string => {
    const memory = settings.userMemory;
    const parts: string[] = [];

    if (settings.systemInstruction.trim()) {
      parts.push(settings.systemInstruction.trim());
    }

    if (memory.userName?.trim()) {
      parts.push(`The user's name is ${memory.userName.trim()}.`);
    }

    if (memory.occupation?.trim()) {
      parts.push(`The user's role/field is ${memory.occupation.trim()}.`);
    }

    if (memory.preferredTone) {
      parts.push(`Preferred communication tone: ${memory.preferredTone}.`);
    }

    if (memory.preferredLanguage && memory.preferredLanguage !== 'English') {
      parts.push(`The user's preferred language is ${memory.preferredLanguage}. Respond or translate naturally in ${memory.preferredLanguage} when appropriate.`);
    }

    if (memory.customPreferences?.trim()) {
      parts.push(`User custom persistent memory:\n${memory.customPreferences.trim()}`);
    }

    return parts.join('\n\n');
  };

  // Send Message Handler
  const handleSendMessage = async (
    text: string,
    attachments: Attachment[] = [],
    isRetry = false
  ) => {
    if (isStreaming) return;

    let targetConv = activeConversation;
    let currentConvId = activeId;

    // Create a new conversation if none exists
    if (!targetConv || !currentConvId) {
      const newConv: Conversation = {
        id: Math.random().toString(36).substring(2, 9),
        title: text.slice(0, 32) || 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        model: settings.model,
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(newConv.id);
      targetConv = newConv;
      currentConvId = newConv.id;
    }

    // Auto title if first message
    if (targetConv.messages.length === 0 && text) {
      handleRenameConversation(currentConvId, text.slice(0, 34) + (text.length > 34 ? '...' : ''));
    }

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const assistantMsgId = Math.random().toString(36).substring(2, 9);
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      modelUsed: settings.model,
    };

    // Prepare updated message thread
    const newMessages = isRetry
      ? [...targetConv.messages, assistantMsg]
      : [...targetConv.messages, userMsg, assistantMsg];

    setConversations((prev) =>
      prev.map((c) =>
        c.id === currentConvId
          ? { ...c, messages: newMessages, updatedAt: Date.now() }
          : c
      )
    );

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    try {
      // Build conversation history for model context
      const contextMessages = newMessages
        .filter((m) => m.id !== assistantMsgId)
        .map((m) => ({
          role: m.role,
          text: m.content,
          attachments: m.attachments,
        }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: contextMessages,
          model: settings.model,
          systemInstruction: buildSystemInstructions(),
          temperature: settings.temperature,
          enableSearch: settings.enableSearchGrounding,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      if (!res.body) {
        throw new Error('ReadableStream not supported by response');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let streamBuffer = '';
      let accumulatedContent = '';
      let groundingSources: any[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split('\n\n');
        streamBuffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.chunk) {
                accumulatedContent += data.chunk;
                updateAssistantMessage(currentConvId, assistantMsgId, {
                  content: accumulatedContent,
                  isStreaming: true,
                });
              }

              if (data.sources) {
                groundingSources = [...groundingSources, ...data.sources];
                updateAssistantMessage(currentConvId, assistantMsgId, {
                  groundingSources,
                });
              }

              if (data.error) {
                updateAssistantMessage(currentConvId, assistantMsgId, {
                  content: accumulatedContent,
                  error: data.error,
                  isStreaming: false,
                });
              }

              if (data.done) {
                updateAssistantMessage(currentConvId, assistantMsgId, {
                  content: accumulatedContent,
                  isStreaming: false,
                  groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
                });
              }
            } catch (err) {
              console.error('Failed to parse SSE line:', line, err);
            }
          }
        }
      }

      // Finalize
      updateAssistantMessage(currentConvId, assistantMsgId, {
        isStreaming: false,
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('User aborted generation.');
      } else {
        console.error('Chat error:', err);
        updateAssistantMessage(currentConvId, assistantMsgId, {
          error: err.message || 'Network error occurred while contacting AI model.',
          isStreaming: false,
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const updateAssistantMessage = (
    convId: string,
    messageId: string,
    updates: Partial<ChatMessage>
  ) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const updated = c.messages.map((m) =>
          m.id === messageId ? { ...m, ...updates } : m
        );
        return { ...c, messages: updated, updatedAt: Date.now() };
      })
    );
  };

  // Regenerate Response
  const handleRegenerate = () => {
    if (!activeConversation || activeConversation.messages.length === 0 || isStreaming) return;
    const lastUserMsg = [...activeConversation.messages]
      .reverse()
      .find((m) => m.role === 'user');

    if (lastUserMsg) {
      // Remove last assistant message
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeConversation.id) return c;
          const trimmed = [...c.messages];
          if (trimmed.length > 0 && trimmed[trimmed.length - 1].role === 'assistant') {
            trimmed.pop();
          }
          return { ...c, messages: trimmed };
        })
      );

      handleSendMessage(lastUserMsg.content, lastUserMsg.attachments || [], true);
    }
  };

  // Edit and Resend User Message
  const handleEditMessage = (messageId: string, newText: string) => {
    if (!activeConversation || isStreaming) return;
    const msgIndex = activeConversation.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    // Truncate messages after this point
    const truncated = activeConversation.messages.slice(0, msgIndex);
    const originalAtts = activeConversation.messages[msgIndex].attachments || [];

    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, messages: truncated } : c))
    );

    handleSendMessage(newText, originalAtts);
  };

  const handleImportData = (data: {
    conversations?: Conversation[];
    settings?: AppSettings;
  }) => {
    if (data.conversations && Array.isArray(data.conversations)) {
      setConversations(data.conversations);
      if (data.conversations.length > 0) {
        setActiveId(data.conversations[0].id);
      }
    }
    if (data.settings) {
      setSettings(data.settings);
    }
  };

  // If splash screen is active, show it
  if (showSplash) {
    return <SplashScreen onEnterApp={handleEnterApp} />;
  }

  return (
    <div className="flex h-[100dvh] w-full max-w-full overflow-hidden bg-[#07080c] text-gray-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={(id) => setActiveId(id)}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePinConversation={handleTogglePinConversation}
        onClearAll={handleClearAll}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenImageStudio={() => setIsImageStudioOpen(true)}
        currentModel={settings.model}
      />

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        {/* Top Header Bar with Safe Area support */}
        <header className="h-14 sm:h-16 pt-safe border-b border-white/5 bg-[#08090e]/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
              title="Open conversations menu"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2 truncate">
              <GhostLogo size={26} glow={false} />
              <span className="font-extrabold tracking-wide text-xs sm:text-sm bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent truncate">
                BLACK GHOST
              </span>
            </div>
          </div>

          {/* Model Selector & Quick Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Model Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/10 border border-white/5 text-xs text-gray-200 transition-all font-mono min-h-[36px]"
              >
                <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                <span className="hidden sm:inline">
                  {settings.model === 'gemini-3.8-flash'
                    ? 'Gemini 3.8 Flash'
                    : settings.model === 'gemini-3.1-flash-lite'
                    ? 'Gemini 3.1 Flash Lite'
                    : 'Gemini 4 Argon'}
                </span>
                <span className="sm:hidden text-[11px]">
                  {settings.model === 'gemini-3.8-flash' ? '3.8 Flash' : settings.model === 'gemini-3.1-flash-lite' ? '3.1 Lite' : '4 Argon'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              </button>

              {isModelDropdownOpen && (
                <div
                  onClick={() => setIsModelDropdownOpen(false)}
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-3 top-14 mt-1 w-72 max-w-[calc(100vw-1.5rem)] bg-[#0a0c14] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 space-y-1 text-xs"
                  >
                    {[
                      {
                        id: 'gemini-3.8-flash',
                        title: 'Gemini 3.8 Flash',
                        badge: 'Default',
                        desc: 'Deep reasoning, coding & multimodal vision',
                      },
                      {
                        id: 'gemini-3.1-flash-lite',
                        title: 'Gemini 3.1 Flash Lite',
                        badge: 'Fastest',
                        desc: 'Ultra-low latency responses',
                      },
                      {
                        id: 'gemini-4-argon',
                        title: 'Gemini 4 Argon',
                        badge: 'Paid Tier',
                        desc: 'Advanced STEM & complex math reasoning',
                      },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSettings({ ...settings, model: m.id });
                          setIsModelDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg transition-all ${
                          settings.model === m.id
                            ? 'bg-purple-950/60 text-purple-200 border border-purple-500/30'
                            : 'hover:bg-white/5 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span>{m.title}</span>
                          <span className="text-[10px] px-1 rounded bg-black/40 text-purple-400 font-mono">
                            {m.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-normal mt-0.5">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Web Search Toggle in Header */}
            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  enableSearchGrounding: !settings.enableSearchGrounding,
                })
              }
              className={`p-2 rounded-xl transition-all border ${
                settings.enableSearchGrounding
                  ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                  : 'bg-white/[0.02] text-gray-400 hover:text-white border-white/5'
              }`}
              title={
                settings.enableSearchGrounding
                  ? 'Web Search Grounding ON'
                  : 'Enable Web Search Grounding'
              }
            >
              <Globe className="w-4 h-4" />
            </button>

            {/* Image Studio Launcher */}
            <button
              onClick={() => setIsImageStudioOpen(true)}
              className="p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.08] text-gray-400 hover:text-cyan-300 border border-white/5 transition-all"
              title="Image Studio (Gemini 3.1 Flash Lite Image)"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Settings Launcher */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.08] text-gray-400 hover:text-purple-300 border border-white/5 transition-all"
              title="Settings & AI Memory"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Conversation Feed */}
        <ChatArea
          messages={activeConversation?.messages || []}
          isStreaming={isStreaming}
          onSelectPrompt={(prompt) => handleSendMessage(prompt)}
          onRegenerate={handleRegenerate}
          onEditMessage={handleEditMessage}
          currentModel={settings.model}
        />

        {/* Composer Input Area */}
        <Composer
          onSendMessage={(text, attachments) => handleSendMessage(text, attachments)}
          onStopGeneration={handleStopGeneration}
          isStreaming={isStreaming}
          enableSearch={settings.enableSearchGrounding}
          onToggleSearch={() =>
            setSettings({
              ...settings,
              enableSearchGrounding: !settings.enableSearchGrounding,
            })
          }
        />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        currentConversation={activeConversation}
        onImportData={handleImportData}
        onOpenSplash={() => {
          setIsSettingsOpen(false);
          setShowSplash(true);
        }}
      />

      {/* Image Studio Modal */}
      <ImageStudioModal
        isOpen={isImageStudioOpen}
        onClose={() => setIsImageStudioOpen(false)}
      />
    </div>
  );
}
