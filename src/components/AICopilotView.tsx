import React, { useState } from 'react';
import { ChatMessage, Task, Note } from '../types';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Copy, 
  Check, 
  Loader2, 
  RotateCcw,
  PlusSquare,
  FileText
} from 'lucide-react';

interface AICopilotViewProps {
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onAddNote: (note: Omit<Note, 'id' | 'updatedAt'>) => void;
}

export const AICopilotView: React.FC<AICopilotViewProps> = ({ onAddTask, onAddNote }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        '안녕하세요! 저는 당신의 스마트 워크스페이스 코파일럿 FlowSpace AI입니다. ⚡️\n\n오늘의 일정 계획, 복잡한 업무 세분화, 아이디어 브레인스토밍, 또는 동기부여와 루틴 조언까지 무엇이든 도와드릴 수 있습니다. 아래 빠른 질문을 선택하거나 무엇이든 물어보세요!',
      timestamp: '방금 전',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedActionNotice, setSavedActionNotice] = useState<string | null>(null);

  const quickPrompts = [
    '오늘 하루 최적의 시간표를 타임블로킹 방식으로 짜줘',
    '집중력이 흐트러질 때 멘탈을 리셋하는 3가지 실천법',
    '미루고 있던 복잡한 프로젝트를 시작하는 첫 10분 전략',
    '업무와 휴식의 균형을 잡는 뽀모도로 루틴 추천',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputVal('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      const assistantReply: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: data.reply || data.error || '답변을 생성하지 못했습니다.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...newMessages, assistantReply]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          id: 'msg-' + (Date.now() + 1),
          role: 'assistant',
          content: '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
          timestamp: '오류',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveAsNote = (content: string) => {
    onAddNote({
      title: 'AI 코파일럿 브레인스토밍 메모',
      content,
      category: 'work',
      tags: ['AI생성', '아이디어'],
      pinned: false,
    });
    setSavedActionNotice('스마트 노트에 성공적으로 저장되었습니다!');
    setTimeout(() => setSavedActionNotice(null), 3000);
  };

  const handleSaveAsTask = (content: string) => {
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    const firstLine = lines[0]?.replace(/^[#*-]\s*/, '').substring(0, 30) || 'AI 추천 작업';

    onAddTask({
      title: firstLine,
      description: content.substring(0, 200),
      category: 'work',
      priority: 'medium',
      status: 'todo',
      dueDate: '2026-10-17',
      subtasks: [],
    });
    setSavedActionNotice('할 일 보드에 성공적으로 등록되었습니다!');
    setTimeout(() => setSavedActionNotice(null), 3000);
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-5 sm:p-7 flex flex-col h-[700px] shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>FlowSpace Gemini 코파일럿</span>
              <span className="text-[11px] text-indigo-400 font-normal">v3.8 Flash</span>
            </h2>
            <p className="text-xs text-neutral-400">
              생산성 향상, 데일리 일정 최적화, 아이디어 도출을 돕는 전담 AI
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: 'init-1',
                role: 'assistant',
                content: '대화가 초기화되었습니다. 새로운 질문이나 목표를 말씀해주세요!',
                timestamp: '방금 전',
              },
            ])
          }
          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          title="대화 초기화"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Notice Banner */}
      {savedActionNotice && (
        <div className="mt-3 py-2 px-3 bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs rounded-xl flex items-center justify-between">
          <span>{savedActionNotice}</span>
          <button onClick={() => setSavedActionNotice(null)} className="text-neutral-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-neutral-800 text-neutral-200'
                    : 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/30'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-neutral-950/80 border border-neutral-800 text-neutral-200 rounded-tl-none whitespace-pre-wrap shadow-sm'
                }`}
              >
                <div>{m.content}</div>

                {/* Assistant message action strip */}
                {!isUser && (
                  <div className="mt-3 pt-2.5 border-t border-neutral-900 flex items-center justify-between text-[11px] text-neutral-500">
                    <span>{m.timestamp}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(m.id, m.content)}
                        className="hover:text-neutral-300 flex items-center gap-1 transition-colors"
                        title="내용 복사"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedId === m.id ? '복사됨' : '복사'}</span>
                      </button>

                      <button
                        onClick={() => handleSaveAsNote(m.content)}
                        className="hover:text-neutral-300 flex items-center gap-1 transition-colors"
                        title="노트로 저장"
                      >
                        <FileText className="w-3 h-3 text-indigo-400" />
                        <span>노트로 저장</span>
                      </button>

                      <button
                        onClick={() => handleSaveAsTask(m.content)}
                        className="hover:text-neutral-300 flex items-center gap-1 transition-colors"
                        title="할 일로 등록"
                      >
                        <PlusSquare className="w-3 h-3 text-sky-400" />
                        <span>할 일 등록</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-neutral-400 p-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Gemini가 최적의 답변을 생각하고 있습니다...</span>
          </div>
        )}
      </div>

      {/* Quick Prompts Bar */}
      <div className="py-2 flex items-center gap-2 overflow-x-auto border-t border-neutral-800/80">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
            className="px-3 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200 text-xs rounded-full whitespace-nowrap transition-colors shrink-0 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 pt-2"
      >
        <input
          type="text"
          placeholder="목표, 고민, 계획하고 싶은 일에 대해 질문해보세요..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={isLoading}
          className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 placeholder:text-neutral-500"
        />
        <button
          type="submit"
          disabled={isLoading || !inputVal.trim()}
          className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl shadow-sm transition-colors flex items-center justify-center shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};
