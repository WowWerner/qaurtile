import { User, Bot, Copy, Bookmark, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  onSave?: () => void;
  isSaved?: boolean;
}

export function ChatMessage({ role, content, timestamp, onSave, isSaved }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = role === 'user';

  return (
    <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[rgb(0,171,174)] to-[rgb(0,151,154)] flex items-center justify-center">
          <Bot size={18} className="text-white" />
        </div>
      )}

      <div className={`flex flex-col max-w-3xl ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-5 py-3 ${
            isUser
              ? 'bg-[rgb(0,171,174)] text-white'
              : 'bg-gray-100 text-gray-900 border border-gray-200'
          }`}
        >
          <div className="text-sm leading-relaxed whitespace-pre-wrap">{content}</div>
        </div>

        <div className="flex items-center gap-2 mt-2 px-2">
          {timestamp && (
            <span className="text-xs text-gray-400">
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          {!isUser && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span className="ml-1">{copied ? 'Copied' : 'Copy'}</span>
              </Button>

              {onSave && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSave}
                  className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  <Bookmark size={14} className={isSaved ? 'fill-current' : ''} />
                  <span className="ml-1">{isSaved ? 'Saved' : 'Save'}</span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <User size={18} className="text-gray-600" />
        </div>
      )}
    </div>
  );
}
