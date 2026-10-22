import React, { useState } from 'react';
import { AppSettings, Conversation } from '../types';
import { exportAllData, exportConversationAsMarkdown } from '../utils/storage';
import { GhostLogo } from './GhostLogo';
import {
  X,
  Sliders,
  Sparkles,
  Shield,
  Download,
  Upload,
  Trash2,
  Check,
  Brain,
  Globe,
  Volume2,
  FileText,
  Info
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  currentConversation?: Conversation | null;
  onImportData: (data: { conversations?: Conversation[]; settings?: AppSettings }) => void;
  onOpenSplash?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  currentConversation,
  onImportData,
  onOpenSplash,
}) => {
  const [activeTab, setActiveTab] = useState<'model' | 'memory' | 'audio' | 'data' | 'about'>('model');
  const [formState, setFormState] = useState<AppSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(formState);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.conversations || parsed.settings) {
          onImportData(parsed);
          setImportStatus('Data imported successfully!');
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('Invalid backup file format.');
        }
      } catch (err) {
        setImportStatus('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#090b12] border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <GhostLogo size={28} glow={false} />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
              Settings & Preferences
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/5 bg-[#07080e] overflow-x-auto px-2 sm:px-4 gap-1 no-scrollbar">
          {[
            { id: 'model', label: 'AI Model & Tuning', icon: Sliders },
            { id: 'memory', label: 'Profile & Memory', icon: Brain },
            { id: 'audio', label: 'Voice & Language', icon: Volume2 },
            { id: 'data', label: 'Data & Backup', icon: Download },
            { id: 'about', label: 'About & Security', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 sm:gap-2 py-3 px-3 text-xs font-medium border-b-2 whitespace-nowrap min-h-[44px] shrink-0 transition-all ${
                  isActive
                    ? 'border-purple-500 text-purple-300 bg-white/[0.02]'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto max-h-[60vh] space-y-5 text-xs text-gray-300">
          {/* TAB 1: MODEL & TUNING */}
          {activeTab === 'model' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Primary Model Engine
                </label>
                <select
                  value={formState.model}
                  onChange={(e) => setFormState({ ...formState, model: e.target.value })}
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="gemini-3.8-flash">Gemini 3.8 Flash (Default - Fast, Multimodal & Reasoning)</option>
                  <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Ultra-Low Latency)</option>
                  <option value="gemini-4-argon">Gemini 4 Argon (STEM & Advanced Reasoning - Requires Paid Key)</option>
                </select>
                <p className="text-[11px] text-gray-500 mt-1">
                  All models are verified official Google GenAI endpoints.
                </p>
              </div>

              {/* Temperature Slider */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white">Temperature (Creativity)</label>
                  <span className="text-xs font-mono text-purple-400">{formState.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={formState.temperature}
                  onChange={(e) => setFormState({ ...formState, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                  <span>0.0 (Precise / Deterministic)</span>
                  <span>0.7 (Balanced)</span>
                  <span>1.5 (High Creativity)</span>
                </div>
              </div>

              {/* Custom System Instruction */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-semibold text-white">
                  System Instructions & Persona
                </label>
                <textarea
                  value={formState.systemInstruction}
                  onChange={(e) => setFormState({ ...formState, systemInstruction: e.target.value })}
                  placeholder="e.g. Always respond concisely in bullet points; prioritize TypeScript 5 best practices; assume senior engineering background."
                  rows={4}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 leading-relaxed"
                />
                <p className="text-[11px] text-gray-500">
                  Custom instructions guide how BLACK GHOST AI frames explanations, tone, and answers.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE & MEMORY */}
          {activeTab === 'memory' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-xl flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-purple-200 leading-relaxed">
                  BLACK GHOST AI uses user-controlled memory to adapt responses to your background and preferences. You can edit or erase this anytime.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Your Name / Handle</label>
                  <input
                    type="text"
                    value={formState.userMemory.userName || ''}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        userMemory: { ...formState.userMemory, userName: e.target.value },
                      })
                    }
                    placeholder="e.g. Alex"
                    className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Occupation / Domain</label>
                  <input
                    type="text"
                    value={formState.userMemory.occupation || ''}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        userMemory: { ...formState.userMemory, occupation: e.target.value },
                      })
                    }
                    placeholder="e.g. Software Architect, Student"
                    className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">Response Style</label>
                <select
                  value={formState.userMemory.preferredTone || 'balanced'}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      userMemory: { ...formState.userMemory, preferredTone: e.target.value as any },
                    })
                  }
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="concise">Concise & Direct (Minimum fluff, straight to code/answer)</option>
                  <option value="balanced">Balanced (Clear explanation with key examples)</option>
                  <option value="detailed">In-Depth & Comprehensive (Deep dives, edge cases)</option>
                  <option value="academic">Academic & Rigorous (Formal proofs, STEM citations)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Custom AI Memory & Knowledge
                </label>
                <textarea
                  value={formState.userMemory.customPreferences || ''}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      userMemory: { ...formState.userMemory, customPreferences: e.target.value },
                    })
                  }
                  placeholder="Tell BLACK GHOST AI details you want it to always remember across sessions (e.g. 'I work on Linux, I build Next.js applications, I dislike verbose apologies')."
                  rows={3}
                  className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 3: VOICE & LANGUAGE */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Default Language Preference
                </label>
                <select
                  value={formState.userMemory.preferredLanguage || 'English'}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      userMemory: { ...formState.userMemory, preferredLanguage: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="English">English</option>
                  <option value="Sinhala">Sinhala (සිංහල)</option>
                  <option value="Spanish">Spanish (Español)</option>
                  <option value="German">German (Deutsch)</option>
                  <option value="French">French (Français)</option>
                  <option value="Japanese">Japanese (日本語)</option>
                  <option value="Chinese">Chinese (中文)</option>
                </select>
                <p className="text-[11px] text-gray-500 mt-1">
                  Supports bilingual and native Sinhala & English translations and explanations.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Gemini Speech Voice (gemini-3.8-flash-lite-tts)
                </label>
                <select
                  value={formState.speechVoice}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      speechVoice: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="Kore">Kore (Clear, Professional, Articulate)</option>
                  <option value="Puck">Puck (Energetic, Bright)</option>
                  <option value="Charon">Charon (Deep, Authoritative)</option>
                  <option value="Fenrir">Fenrir (Resonant, Confident)</option>
                  <option value="Zephyr">Zephyr (Warm, Calm)</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 4: DATA & BACKUP */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">
                Manage your conversation backups, JSON export/import, and Markdown exports.
              </p>

              {currentConversation && (
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <div>
                      <p className="font-semibold text-white">Current Conversation</p>
                      <p className="text-[11px] text-gray-400">{currentConversation.title}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => exportConversationAsMarkdown(currentConversation)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Markdown</span>
                  </button>
                </div>
              )}

              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Complete Data Backup</p>
                  <p className="text-[11px] text-gray-400">Export all conversations and settings as a JSON archive</p>
                </div>
                <button
                  onClick={exportAllData}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup</span>
                </button>
              </div>

              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Restore Backup</p>
                  <p className="text-[11px] text-gray-400">Import conversations from an exported JSON file</p>
                </div>
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {importStatus && (
                <p className="text-xs text-purple-400 font-medium">{importStatus}</p>
              )}
            </div>
          )}

          {/* TAB 5: ABOUT & SECURITY */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <GhostLogo size={40} />
                <div>
                  <h3 className="font-bold text-white text-sm">BLACK GHOST AI</h3>
                  <p className="text-[11px] text-purple-300">Version 1.0.0 • Architecture: Full-Stack React + Node</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Tagline: "Beyond Limits. Beyond Imagination."</p>
                </div>
              </div>

              <div className="space-y-2 text-xs leading-relaxed text-gray-400">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <p className="font-semibold text-gray-200 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Zero Client-Side Secret Leakage</span>
                  </p>
                  <p className="text-[11px]">
                    The Google GenAI SDK and GEMINI_API_KEY run exclusively inside the server-side environment. No credentials or keys are ever bundled into client JavaScript.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <p className="font-semibold text-gray-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Official GenAI SDK (@google/genai)</span>
                  </p>
                  <p className="text-[11px]">
                    Powered by genuine models: Gemini 3.8 Flash, Gemini 3.1 Flash Lite Image, and Gemini 3.8 Flash Lite TTS with real streaming and search grounding.
                  </p>
                </div>
              </div>

              {onOpenSplash && (
                <div className="pt-2">
                  <button
                    onClick={onOpenSplash}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-purple-300 text-xs font-medium border border-purple-500/20 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Replay Welcome Intro Screen</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/5 bg-[#06070a]">
          <span className="text-[11px] text-gray-500 font-mono">
            {saveSuccess ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Saved!
              </span>
            ) : (
              'Changes stored locally'
            )}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
