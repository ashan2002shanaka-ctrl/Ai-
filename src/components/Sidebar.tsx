import React, { useState } from 'react';
import { Conversation } from '../types';
import { GhostLogo } from './GhostLogo';
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Edit2,
  Pin,
  X,
  Settings,
  Sparkles,
  Database,
  Check,
  BrainCircuit,
  Sliders,
  Image as ImageIcon
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePinConversation: (id: string) => void;
  onClearAll: () => void;
  onOpenSettings: () => void;
  onOpenImageStudio: () => void;
  currentModel: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onCloseMobile,
  conversations,
  activeId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  onClearAll,
  onOpenSettings,
  onOpenImageStudio,
  currentModel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pinnedConversations = filteredConversations.filter((c) => c.isPinned);
  const recentConversations = filteredConversations.filter((c) => !c.isPinned);

  const startRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveRename = (id: string, e?: React.FormEvent) => {
    e?.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-[85vw] max-w-xs sm:w-80 bg-[#08090e] border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl pt-safe pb-safe ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* App Header & Brand */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GhostLogo size={32} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-sm bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                  BLACK GHOST
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/70 text-purple-300 font-mono border border-purple-500/20">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-gray-500 tracking-tight">Beyond Limits</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
            title="Close menu"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="p-3 space-y-2">
          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewConversation();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-900/40 via-purple-800/20 to-transparent hover:from-purple-900/60 hover:via-purple-800/40 border border-purple-500/30 text-white font-medium text-sm transition-all shadow-lg shadow-purple-950/20 group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-lg bg-purple-500/20 text-purple-300 group-hover:bg-purple-500/40 transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <span>New Conversation</span>
            </div>
            <span className="text-[11px] text-purple-300/60 font-mono bg-black/40 px-1.5 py-0.5 rounded border border-purple-500/10">
              Ctrl+N
            </span>
          </button>

          {/* Image Studio Button */}
          <button
            onClick={() => {
              onOpenImageStudio();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-gray-300 hover:text-white text-xs font-medium transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400">
                <ImageIcon className="w-3.5 h-3.5" />
              </div>
              <span>Image Studio (Gemini 3.1)</span>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400/60 group-hover:text-cyan-300" />
          </button>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/5 focus:border-purple-500/40 rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-gray-500 hover:text-gray-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 py-2">
          {/* Pinned Section */}
          {pinnedConversations.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-purple-400 uppercase">
                <Pin className="w-3 h-3 rotate-45" />
                <span>Pinned</span>
              </div>
              <div className="space-y-1">
                {pinnedConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === activeId}
                    isEditing={editingId === conv.id}
                    editTitle={editTitle}
                    onSelect={() => {
                      onSelectConversation(conv.id);
                      onCloseMobile();
                    }}
                    onStartRename={(e) => startRename(conv, e)}
                    onSaveRename={(e) => saveRename(conv.id, e)}
                    onCancelRename={() => setEditingId(null)}
                    onChangeTitle={setEditTitle}
                    onTogglePin={(e) => {
                      e.stopPropagation();
                      onTogglePinConversation(conv.id);
                    }}
                    onDelete={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent Section */}
          <div>
            <div className="px-2 pb-1.5 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
              {pinnedConversations.length > 0 ? 'Recent' : 'Conversations'}
            </div>
            {recentConversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500 border border-dashed border-white/5 rounded-xl m-2">
                {searchQuery ? 'No matching conversations found' : 'No conversations yet. Start a new chat!'}
              </div>
            ) : (
              <div className="space-y-1">
                {recentConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === activeId}
                    isEditing={editingId === conv.id}
                    editTitle={editTitle}
                    onSelect={() => {
                      onSelectConversation(conv.id);
                      onCloseMobile();
                    }}
                    onStartRename={(e) => startRename(conv, e)}
                    onSaveRename={(e) => saveRename(conv.id, e)}
                    onCancelRename={() => setEditingId(null)}
                    onChangeTitle={setEditTitle}
                    onTogglePin={(e) => {
                      e.stopPropagation();
                      onTogglePinConversation(conv.id);
                    }}
                    onDelete={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clear All Confirmation Modal */}
        {showClearConfirm && (
          <div className="p-3 bg-red-950/30 border-t border-red-500/20 text-xs">
            <p className="text-red-200 font-medium mb-2">Delete all conversations?</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onClearAll();
                  setShowClearConfirm(false);
                }}
                className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
              >
                Yes, Delete All
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Bottom Footer Info & Settings */}
        <div className="p-3 border-t border-white/5 bg-[#06070a] space-y-2">
          {/* Active Model Indicator */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] text-gray-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-gray-300 font-mono truncate max-w-[150px]">{currentModel}</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 font-semibold uppercase tracking-wider">Online</span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={onOpenSettings}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-gray-300 hover:text-white text-xs font-medium border border-white/5 transition-all"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>Settings & Memory</span>
            </button>

            {conversations.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                title="Clear all conversations"
                className="p-2 rounded-xl bg-white/[0.02] hover:bg-red-950/40 text-gray-500 hover:text-red-400 border border-white/5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  onSelect: () => void;
  onStartRename: (e: React.MouseEvent) => void;
  onSaveRename: (e: React.FormEvent) => void;
  onCancelRename: () => void;
  onChangeTitle: (title: string) => void;
  onTogglePin: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  isEditing,
  editTitle,
  onSelect,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onChangeTitle,
  onTogglePin,
  onDelete,
}) => {
  if (isEditing) {
    return (
      <form onSubmit={onSaveRename} className="px-2 py-1 flex items-center gap-1">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => onChangeTitle(e.target.value)}
          autoFocus
          className="flex-1 px-2 py-1 bg-black/60 border border-purple-500/50 rounded-lg text-xs text-white focus:outline-none"
        />
        <button
          type="submit"
          className="p-1 rounded bg-purple-600 text-white hover:bg-purple-500"
          title="Save"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onCancelRename}
          className="p-1 rounded bg-white/10 text-gray-400 hover:text-white"
          title="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </form>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-all ${
        isActive
          ? 'bg-purple-950/40 text-purple-100 font-medium border border-purple-500/30 shadow-md shadow-purple-950/10'
          : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border border-transparent'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <MessageSquare
          className={`w-3.5 h-3.5 shrink-0 ${
            isActive ? 'text-purple-400' : 'text-gray-500 group-hover:text-gray-400'
          }`}
        />
        <span className="truncate">{conversation.title || 'Untitled Conversation'}</span>
      </div>

      {/* Action icons with mobile-first touch accessibility */}
      <div
        className={`flex items-center gap-0.5 transition-opacity ${
          isActive ? 'opacity-100' : 'opacity-70 sm:opacity-0 sm:group-hover:opacity-100'
        }`}
      >
        <button
          onClick={onTogglePin}
          title={conversation.isPinned ? 'Unpin' : 'Pin conversation'}
          className={`p-1.5 min-w-[30px] min-h-[30px] flex items-center justify-center rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors ${
            conversation.isPinned ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'
          }`}
          aria-label={conversation.isPinned ? 'Unpin conversation' : 'Pin conversation'}
        >
          <Pin className="w-3.5 h-3.5 rotate-45" />
        </button>

        <button
          onClick={onStartRename}
          title="Rename conversation"
          className="p-1.5 min-w-[30px] min-h-[30px] flex items-center justify-center rounded-lg hover:bg-white/10 active:bg-white/20 text-gray-500 hover:text-gray-300 transition-colors"
          aria-label="Rename conversation"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onDelete}
          title="Delete conversation"
          className="p-1.5 min-w-[30px] min-h-[30px] flex items-center justify-center rounded-lg hover:bg-white/10 active:bg-white/20 text-gray-500 hover:text-red-400 transition-colors"
          aria-label="Delete conversation"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
