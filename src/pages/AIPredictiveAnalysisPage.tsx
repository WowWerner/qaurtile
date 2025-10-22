import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Plus, MessageSquare, Loader2, Download, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { ChatMessage } from '../components/ai/ChatMessage';
import { ChartRenderer } from '../components/ai/ChartRenderer';
import { supabase } from '../lib/supabase';
import { AIQueryProcessor } from '../services/aiQueryProcessor';
import { DatabaseContextService } from '../services/databaseContextService';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  chartConfig?: any;
  isSaved?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

export function AIPredictiveAnalysisPage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        chartConfig: msg.chart_data,
      }));

      setMessages(formattedMessages);
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load conversation');
    }
  };

  const createNewConversation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          title: 'New Conversation'
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentConversationId(data.id);
      setMessages([]);
      loadConversations();
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create new conversation');
    }
  };

  const saveMessage = async (role: 'user' | 'assistant', content: string, chartConfig?: any) => {
    if (!currentConversationId) {
      await createNewConversation();
      return;
    }

    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: currentConversationId,
          role,
          content,
          chart_data: chartConfig || null
        })
        .select()
        .single();

      if (error) throw error;

      if (messages.length === 1 && role === 'assistant') {
        const titlePreview = messages[0].content.substring(0, 50);
        await supabase
          .from('ai_conversations')
          .update({ title: titlePreview })
          .eq('id', currentConversationId);
        loadConversations();
      }

      return data.id;
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    if (!currentConversationId) {
      await createNewConversation();
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    await saveMessage('user', userMessage);

    try {
      const result = await AIQueryProcessor.processUserQuery(
        userMessage,
        messages.map(m => ({ role: m.role, content: m.content }))
      );

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.answer,
        timestamp: new Date(),
        chartConfig: result.chartConfig
      };

      setMessages(prev => [...prev, assistantMsg]);
      await saveMessage('assistant', result.answer, result.chartConfig);

      if (result.queryResult?.error) {
        toast.error('Query execution had issues, but I provided a response based on available data');
      }
    } catch (error: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFinding = async (messageId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !currentConversationId) return;

      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const { error } = await supabase
        .from('ai_saved_findings')
        .insert({
          conversation_id: currentConversationId,
          message_id: messageId,
          user_id: user.id,
          title: message.content.substring(0, 100)
        });

      if (error) throw error;

      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, isSaved: true } : m))
      );

      toast.success('Finding saved successfully');
    } catch (error) {
      console.error('Error saving finding:', error);
      toast.error('Failed to save finding');
    }
  };

  const handleExportToCSV = () => {
    const csvContent = messages
      .map(msg => `"${msg.role}","${msg.content.replace(/"/g, '""')}","${msg.timestamp.toISOString()}"`)
      .join('\n');

    const blob = new Blob([`Role,Content,Timestamp\n${csvContent}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Conversation exported to CSV');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = DatabaseContextService.getSampleQueries().slice(0, 4);

  return (
    <div className="h-screen bg-white flex">
      {/* Sidebar */}
      {isSidebarOpen && (
        <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <Button
              onClick={createNewConversation}
              className="w-full bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)] text-white"
              size="sm"
            >
              <Plus size={16} className="mr-2" />
              New Chat
            </Button>
          </div>

          <ScrollArea className="flex-1 p-2">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => loadConversationMessages(conv.id)}
                className={`w-full text-left p-3 rounded-lg mb-1 hover:bg-gray-200 transition-colors ${
                  currentConversationId === conv.id ? 'bg-gray-200' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">{conv.title}</span>
                </div>
                <span className="text-xs text-gray-400 ml-6">
                  {new Date(conv.updated_at).toLocaleDateString()}
                </span>
              </button>
            ))}
          </ScrollArea>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </Button>
            <div>
              <h1 className="text-xl font-light text-gray-800 flex items-center gap-2">
                <Sparkles size={20} className="text-[rgb(0,171,174)]" />
                AI Predictive Analysis
              </h1>
              <p className="text-xs text-gray-500">Ask questions about your account data</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportToCSV}>
              <Download size={16} className="mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6">
          {messages.length === 0 ? (
            <div className="max-w-3xl mx-auto mt-12">
              <div className="text-center mb-12">
                <div className="w-16 h-16 bg-gradient-to-br from-[rgb(0,171,174)] to-[rgb(0,151,154)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-light text-gray-800 mb-2">
                  AI-Powered Predictive Analysis
                </h2>
                <p className="text-gray-600">
                  Ask me anything about your accounts, predictions, and recovery strategies
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedQuestions.map((question, idx) => (
                  <Card
                    key={idx}
                    className="cursor-pointer hover:shadow-md transition-shadow border-gray-200"
                    onClick={() => setInputValue(question)}
                  >
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-700">{question}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {messages.map(message => (
                <div key={message.id}>
                  <ChatMessage
                    role={message.role}
                    content={message.content}
                    timestamp={message.timestamp}
                    onSave={message.role === 'assistant' ? () => handleSaveFinding(message.id) : undefined}
                    isSaved={message.isSaved}
                  />
                  {message.chartConfig && (
                    <ChartRenderer config={message.chartConfig} />
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4 mb-6">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[rgb(0,171,174)] to-[rgb(0,151,154)] flex items-center justify-center">
                    <Loader2 size={18} className="text-white animate-spin" />
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <span>Analyzing your data</span>
                    <span className="animate-pulse">...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me about your accounts, predictions, or recovery strategies..."
                className="resize-none min-h-[60px] max-h-[200px] border-gray-300 focus:border-[rgb(0,171,174)] focus:ring-[rgb(0,171,174)]/20"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)] text-white h-[60px] px-6"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Press Enter to send, Shift + Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
