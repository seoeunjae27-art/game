import React, { useState } from 'react';
import { Note, TaskCategory } from '../types';
import { 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  Sparkles, 
  Eye, 
  Edit3, 
  Loader2, 
  Tag, 
  Clock,
  Check
} from 'lucide-react';

interface NotesViewProps {
  notes: Note[];
  onAddNote: (note: Omit<Note, 'id' | 'updatedAt'>) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string>(() => notes[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isPreview, setIsPreview] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResultText, setAiResultText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedNote = notes.find((n) => n.id === selectedNoteId) || notes[0];

  const handleCreateNew = () => {
    const newNoteObj: Omit<Note, 'id' | 'updatedAt'> = {
      title: '새로운 생각과 메모',
      content: '여기에 자유롭게 아이디어나 회의록, 할 일을 적어보세요.',
      category: 'work',
      tags: ['아이디어'],
      pinned: false,
    };
    onAddNote(newNoteObj);
  };

  const handleAiAction = async (action: 'summarize_note' | 'improve_writing' | 'brainstorm') => {
    if (!selectedNote) return;
    setAiLoading(true);
    setAiResultText(null);
    try {
      const res = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action === 'brainstorm' ? 'general' : action,
          text:
            action === 'brainstorm'
              ? `다음 노트 내용을 바탕으로 더 깊이 탐구할 수 있는 독창적인 아이디어 3가지와 고려해볼 질문들을 제시해줘:\n\n${selectedNote.content}`
              : selectedNote.content,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setAiResultText(data.result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiResult = () => {
    if (!selectedNote || !aiResultText) return;
    onUpdateNote(selectedNote.id, {
      content: selectedNote.content + '\n\n---\n### 💡 Gemini AI 어시스턴트 제안\n' + aiResultText,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    });
    setAiResultText(null);
  };

  const filteredNotes = notes.filter((n) => {
    const matchesCategory = activeCategory === 'all' || n.category === activeCategory;
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', label: '전체' },
    { id: 'work', label: '업무' },
    { id: 'study', label: '학습' },
    { id: 'personal', label: '개인' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/70 border border-neutral-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">스마트 노트 & 마크다운</h2>
          <p className="text-xs text-neutral-400 mt-1">
            아이디어를 빠르게 정리하고 Gemini AI로 요약 및 문장 교정을 받아보세요.
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>새 노트 작성</span>
        </button>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Note List (4 cols) */}
        <div className="lg:col-span-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 space-y-3">
          {/* Search & filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="메모 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-lg border border-neutral-800">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                  activeCategory === c.id
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* List of notes */}
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {filteredNotes.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                작성된 메모가 없습니다.
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = selectedNote?.id === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => {
                      setSelectedNoteId(note.id);
                      setAiResultText(null);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-neutral-800/80 border-indigo-500/50 shadow-sm'
                        : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-white truncate">
                        {note.title || '제목 없음'}
                      </span>
                      {note.pinned && <Pin className="w-3 h-3 text-indigo-400 shrink-0" />}
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {note.content}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-2">
                      <Clock className="w-3 h-3" />
                      <span>{note.updatedAt}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Note Editor & AI Enhancer (8 cols) */}
        <div className="lg:col-span-8 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-4">
          {selectedNote ? (
            <>
              {/* Note Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                <input
                  type="text"
                  value={selectedNote.title}
                  onChange={(e) =>
                    onUpdateNote(selectedNote.id, {
                      title: e.target.value,
                      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
                    })
                  }
                  className="bg-transparent text-lg font-bold text-white focus:outline-none w-full"
                  placeholder="메모 제목"
                />

                <div className="flex items-center gap-2 shrink-0">
                  {/* Pin toggle */}
                  <button
                    onClick={() =>
                      onUpdateNote(selectedNote.id, { pinned: !selectedNote.pinned })
                    }
                    className={`p-1.5 rounded-lg border transition-colors ${
                      selectedNote.pinned
                        ? 'bg-indigo-950/50 border-indigo-500/40 text-indigo-400'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                    title={selectedNote.pinned ? '고정 해제' : '상단 고정'}
                  >
                    <Pin className="w-4 h-4" />
                  </button>

                  {/* Preview toggle */}
                  <button
                    onClick={() => setIsPreview(!isPreview)}
                    className="p-1.5 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                    title={isPreview ? '편집 모드로 전환' : '마크다운 미리보기'}
                  >
                    {isPreview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  {/* Delete note */}
                  <button
                    onClick={() => onDeleteNote(selectedNote.id)}
                    className="p-1.5 bg-neutral-950 border border-neutral-800 hover:border-rose-900/50 text-neutral-400 hover:text-rose-400 rounded-lg transition-colors"
                    title="메모 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* AI Assistance Toolbar */}
              <div className="flex items-center gap-2 flex-wrap bg-neutral-950/60 border border-neutral-800/80 p-2 rounded-xl text-xs">
                <div className="flex items-center gap-1 text-indigo-400 font-semibold px-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gemini AI 도구:</span>
                </div>
                <button
                  onClick={() => handleAiAction('summarize_note')}
                  disabled={aiLoading}
                  className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-neutral-300 rounded border border-neutral-800 transition-colors"
                >
                  3줄 핵심 요약
                </button>
                <button
                  onClick={() => handleAiAction('improve_writing')}
                  disabled={aiLoading}
                  className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-neutral-300 rounded border border-neutral-800 transition-colors"
                >
                  문장 다듬기
                </button>
                <button
                  onClick={() => handleAiAction('brainstorm')}
                  disabled={aiLoading}
                  className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-neutral-300 rounded border border-neutral-800 transition-colors"
                >
                  아이디어 확장
                </button>
                {aiLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 ml-2" />}
              </div>

              {/* AI Result Box */}
              {aiResultText && (
                <div className="bg-indigo-950/20 border border-indigo-800/40 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between text-indigo-300 font-semibold">
                    <span>AI 생성 결과</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleApplyAiResult}
                        className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
                      >
                        본문 끝에 삽입
                      </button>
                      <button
                        onClick={() => setAiResultText(null)}
                        className="text-neutral-400 hover:text-white"
                      >
                        닫기
                      </button>
                    </div>
                  </div>
                  <div className="text-neutral-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {aiResultText}
                  </div>
                </div>
              )}

              {/* Editor or Preview */}
              {isPreview ? (
                <div className="min-h-[360px] bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">
                  {selectedNote.content}
                </div>
              ) : (
                <textarea
                  value={selectedNote.content}
                  onChange={(e) =>
                    onUpdateNote(selectedNote.id, {
                      content: e.target.value,
                      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
                    })
                  }
                  placeholder="내용을 입력하세요..."
                  className="w-full min-h-[360px] bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y font-mono"
                />
              )}
            </>
          ) : (
            <div className="py-24 text-center text-sm text-neutral-500">
              선택된 메모가 없습니다. 새 노트를 작성해보세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
