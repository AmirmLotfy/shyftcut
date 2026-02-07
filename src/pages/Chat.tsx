import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Trash2, User, Globe, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, apiPath, apiHeaders } from '@/lib/api';
import { debugLog, debugError } from '@/lib/debug';
import { captureException } from '@/lib/error-tracking';
import { useToast } from '@/hooks/use-toast';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useIsMobile } from '@/hooks/use-mobile';
import { UpgradePrompt } from '@/components/common/UpgradePrompt';
import { BreathingCircle } from '@/components/common/BreathingCircle';
import { UsageBadge } from '@/components/common/UsageBadge';
import { getUpgradePath } from '@/lib/upgrade-link';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

interface Citation {
  uri: string;
  title?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  metadata?: { thoughtSignature?: string };
  citations?: Citation[];
}

/** Allowed tags for heading sanitization */
const HEADING_TAGS = ['strong', 'b', 'em', 'i', 'code', 'h1', 'h2', 'h3'];

/** Render Gemini/chat markdown (**, *, `, lists, ###/##/#) as clean HTML/JSX. Sanitized for XSS. */
function renderChatMarkdown(text: string): ReactNode {
  const lines = text.split('\n');
  const out: ReactNode[] = [];
  let listItems: string[] = [];
  let inList = false;
  let listOrdered = false;
  const listKey = () => `list-${out.length}-${listItems.length}`;

  const inlineMarkdownToReact = (line: string): ReactNode => {
    const html = line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-sm">$1</code>');
    const sanitized = DOMPurify.sanitize(html, { ALLOWED_TAGS: ['strong', 'b', 'em', 'i', 'code'], ALLOWED_ATTR: ['class'] });
    return <span dangerouslySetInnerHTML={{ __html: sanitized }} />;
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    const className = 'list-disc pl-6 space-y-1 my-2 rtl:pl-0 rtl:pr-6';
    if (listOrdered) {
      out.push(
        <ol key={listKey()} className={className}>
          {listItems.map((item, i) => (
            <li key={i}>{inlineMarkdownToReact(item)}</li>
          ))}
        </ol>
      );
    } else {
      out.push(
        <ul key={listKey()} className={className}>
          {listItems.map((item, i) => (
            <li key={i}>{inlineMarkdownToReact(item)}</li>
          ))}
        </ul>
      );
    }
    listItems = [];
    inList = false;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    // Headings: ###, ##, #
    const h3Match = trimmed.match(/^###\s+(.+)$/);
    const h2Match = trimmed.match(/^##\s+(.+)$/);
    const h1Match = trimmed.match(/^#\s+(.+)$/);
    if (h3Match) {
      if (inList) flushList();
      const inner = DOMPurify.sanitize(
        h3Match[1]
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/`(.+?)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-sm">$1</code>'),
        { ALLOWED_TAGS: HEADING_TAGS, ALLOWED_ATTR: ['class'] }
      );
      out.push(<h3 key={index} className="mt-4 mb-1.5 text-sm font-semibold leading-tight first:mt-0" dangerouslySetInnerHTML={{ __html: inner }} />);
      return;
    }
    if (h2Match) {
      if (inList) flushList();
      const inner = DOMPurify.sanitize(
        h2Match[1]
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/`(.+?)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-sm">$1</code>'),
        { ALLOWED_TAGS: HEADING_TAGS, ALLOWED_ATTR: ['class'] }
      );
      out.push(<h2 key={index} className="mt-4 mb-1.5 text-base font-semibold leading-tight first:mt-0" dangerouslySetInnerHTML={{ __html: inner }} />);
      return;
    }
    if (h1Match) {
      if (inList) flushList();
      const inner = DOMPurify.sanitize(
        h1Match[1]
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/`(.+?)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-sm">$1</code>'),
        { ALLOWED_TAGS: HEADING_TAGS, ALLOWED_ATTR: ['class'] }
      );
      out.push(<h1 key={index} className="mt-4 mb-1.5 text-lg font-semibold leading-tight first:mt-0" dangerouslySetInnerHTML={{ __html: inner }} />);
      return;
    }
    // Unordered list: - or *
    if (line.startsWith('- ') || trimmed.match(/^\*\s+/)) {
      if (inList && listOrdered) flushList();
      inList = true;
      listOrdered = false;
      const content = line.startsWith('- ') ? line.slice(2) : trimmed.replace(/^\*\s+/, '');
      listItems.push(content);
      return;
    }
    if (line.match(/^\d+\.\s/)) {
      if (inList && !listOrdered) flushList();
      inList = true;
      listOrdered = true;
      listItems.push(line.replace(/^\d+\.\s/, ''));
      return;
    }
    if (inList) flushList();
    if (trimmed === '') {
      out.push(<br key={`br-${index}`} />);
      return;
    }
    out.push(
      <p key={index} className="mb-2 last:mb-0 leading-relaxed">
        {inlineMarkdownToReact(line)}
      </p>
    );
  });

  if (inList) flushList();
  return <>{out}</>;
}

const quickQuestions = {
  en: [
    'How do I prepare for technical interviews?',
    'What skills should I prioritize this week?',
    'Tips for salary negotiation?',
    'How to build a strong portfolio?',
  ],
  ar: [
    'كيف أستعد للمقابلات التقنية؟',
    'ما المهارات التي يجب أن أركز عليها هذا الأسبوع؟',
    'نصائح للتفاوض على الراتب؟',
    'كيف أبني محفظة أعمال قوية؟',
  ],
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { language, t } = useLanguage();
  const isMobile = useIsMobile();

  const getSpeechRecognition = (): (new () => SpeechRecognition) | null => {
    if (typeof window === 'undefined') return null;
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  };
  const speechSupported = !!getSpeechRecognition();
  const { user, session, getAccessToken } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { 
    canSendChatMessage, 
    getChatMessagesRemaining, 
    limits, 
    refetch: refetchUsage,
    isUnlimitedChat 
  } = useUsageLimits();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Clear inline permission error after 5s
  useEffect(() => {
    if (!permissionError) return;
    const timer = setTimeout(() => setPermissionError(null), 5000);
    return () => clearTimeout(timer);
  }, [permissionError]);

  // Load chat history on mount (API + Neon)
  useEffect(() => {
    const loadHistory = async () => {
      if (!user || !session) return;
      try {
        const token = await getAccessToken();
        if (!token) return;
        const data = await apiFetch<Array<{ role: string; content: string }>>(
          '/api/chat/history',
          { token }
        );
        if (Array.isArray(data) && data.length > 0) {
          setMessages(
            data.map((m: { role: string; content: string; metadata?: { thoughtSignature?: string } }) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
              ...(m.metadata && typeof m.metadata === 'object' && (m.metadata as { thoughtSignature?: string }).thoughtSignature
                ? { metadata: { thoughtSignature: (m.metadata as { thoughtSignature?: string }).thoughtSignature } }
                : {}),
            }))
          );
        }
      } catch (err) {
        debugLog('Chat', 'loadHistory failed (best-effort)', err);
      }
    };

    loadHistory();
  }, [user, session, getAccessToken]);

  const saveMessage = async (role: 'user' | 'assistant', content: string, metadata?: { thoughtSignature?: string }) => {
    const token = await getAccessToken();
    if (!token) return;
    try {
      const body: { role: string; content: string; metadata?: { thoughtSignature?: string } } = { role, content };
      if (metadata?.thoughtSignature) body.metadata = { thoughtSignature: metadata.thoughtSignature };
      await apiFetch('/api/chat/messages', {
        method: 'POST',
        body: JSON.stringify(body),
        token,
      });
    } catch (err) {
      debugLog('Chat', 'saveMessage failed (best-effort)', role, err);
    }
  };

  const streamChat = async (userMessage: string) => {
    // Check usage limits before sending
    if (!canSendChatMessage()) {
      toast({
        title: t('chat.messageLimit'),
        description: t('chat.messageLimitDescription'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];
    setMessages(newMessages);
    
    // Save user message
    await saveMessage('user', userMessage);

      let assistantContent = '';
      let citations: Citation[] = [];
      const token = await getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(apiPath('/api/chat'), {
        method: 'POST',
        headers: apiHeaders('/api/chat', token),
        body: JSON.stringify({
          messages: newMessages.map(m => ({
            role: m.role,
            content: m.content,
            ...(m.metadata?.thoughtSignature ? { metadata: { thoughtSignature: m.metadata.thoughtSignature } } : {}),
          })),
          useSearch: useSearch,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let apiMsg = '';
        try {
          const data = text.trim() ? (JSON.parse(text) as { error?: string }) : {};
          apiMsg = data?.error ?? '';
        } catch {
          apiMsg = text?.slice(0, 200) || '';
        }
        if (response.status === 429) {
          throw new Error(apiMsg || t('chat.rateLimit'));
        }
        if (response.status === 402) {
          throw new Error(apiMsg || t('chat.upgradeForUnlimited'));
        }
        throw new Error(apiMsg || 'Failed to get response. Please try again.');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let buffer = '';
      let thoughtSignature: string | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process SSE lines
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            if (typeof parsed.thoughtSignature === 'string') {
              thoughtSignature = parsed.thoughtSignature;
              continue;
            }
            if (Array.isArray(parsed.citations) && parsed.citations.length > 0) {
              citations = parsed.citations.map((c: { uri?: string; title?: string }) => ({ uri: c.uri ?? '', title: c.title }));
              continue;
            }
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages([
                ...newMessages,
                {
                  role: 'assistant',
                  content: assistantContent,
                  ...(thoughtSignature ? { metadata: { thoughtSignature } } : {}),
                  ...(citations.length > 0 ? { citations } : {}),
                },
              ]);
            }
          } catch {
            // Incomplete JSON, wait for more data
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Save assistant message (with thoughtSignature for next-turn reasoning)
      if (assistantContent) {
        await saveMessage('assistant', assistantContent, thoughtSignature ? { thoughtSignature } : undefined);
        if (thoughtSignature || citations.length > 0) {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant') {
              return [...prev.slice(0, -1), { ...last, ...(thoughtSignature ? { metadata: { thoughtSignature } } : {}), ...(citations.length > 0 ? { citations } : {}) }];
            }
            return prev;
          });
        }
      }

    } catch (error) {
      debugError('Chat', 'streamChat failed', error);
      captureException(error);
      const fallbackMessage = t('chat.failedToGetResponse');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: fallbackMessage },
      ]);
      toast({
        title: t('common.errorTitle'),
        description: error instanceof Error ? error.message : t('common.error'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      refetchUsage();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput('');
    streamChat(message);
  };

  const handleQuickQuestion = (question: string) => {
    if (isLoading) return;
    streamChat(question);
  };

  const startListening = async () => {
    const SR = getSpeechRecognition();
    if (!SR) {
      toast({
        title: t('chat.notSupported'),
        description: t('chat.speechNotAvailable'),
        variant: 'destructive',
      });
      return;
    }
    if (recognitionRef.current) return;

    // Explicitly request microphone permission so the browser shows its permission popup
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        const name = err instanceof Error ? err.name : '';
        const msg =
          name === 'NotAllowedError' || name === 'PermissionDeniedError'
            ? t('chat.microphoneRequired')
            : t('chat.couldNotAccessMicrophone');
        setPermissionError(msg);
        return;
      }
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === 'ar' ? 'ar' : undefined;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[result.length - 1]?.transcript ?? '';
      if (result.isFinal && transcript) {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'aborted') {
        const msg = event.error === 'not-allowed' ? t('chat.microphoneRequired') : String(event.error);
        setPermissionError(msg);
      }
      recognitionRef.current = null;
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleVoiceInput = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const clearHistory = async () => {
    const token = await getAccessToken();
    if (!token) return;
    try {
      await apiFetch('/api/chat/history', { method: 'DELETE', token });
      setMessages([]);
      queryClient.invalidateQueries({ queryKey: ['usage-limits'] });
      toast({
        title: t('chat.cleared'),
        description: t('chat.historyCleared'),
      });
    } catch {
      toast({
        title: t('common.errorTitle'),
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Helmet><title>Chat | Shyftcut</title></Helmet>
      <div className={cn(
        'flex min-h-0 flex-col',
        isMobile ? 'flex-1 min-h-0' : 'h-[calc(100dvh-3.5rem)]'
      )}>
        {/* Header: compact on mobile, safe-area top */}
        <div
          className="shrink-0 border-b border-border bg-background/80 px-4 py-2.5 backdrop-blur md:py-3"
          style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}
        >
          <div className="container mx-auto flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <BreathingCircle size="sm" className="rounded-xl overflow-hidden" />
              <div className="min-w-0">
                <h1 className="truncate font-semibold text-sm md:text-base">
                  {t('chat.title')}
                </h1>
                {!isMobile && (
                  <p className="text-xs text-muted-foreground">
                    {t('chat.ready24_7')}
                  </p>
                )}
              </div>
            </div>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearHistory} className="gap-2">
                <Trash2 className="h-4 w-4" />
                {t('chat.clear')}
              </Button>
            )}
            {!isUnlimitedChat && (
              <UsageBadge 
                remaining={getChatMessagesRemaining()} 
                limit={limits.chatMessages} 
                type="chat" 
              />
            )}
          </div>
        </div>

        {/* Show upgrade prompt if limit reached */}
        {!canSendChatMessage() ? (
          <div className="flex flex-1 items-center justify-center p-4">
            <UpgradePrompt 
              feature="chat" 
              remaining={getChatMessagesRemaining()} 
              limit={limits.chatMessages} 
            />
          </div>
        ) : (
          <>
            {/* Messages: only this area scrolls; pb on mobile for fixed input above nav */}
            <div
              ref={scrollRef}
              className={cn(
                'min-h-0 flex-1 overflow-y-auto px-4',
                isMobile && 'pb-44'
              )}
            >
              <div className="container mx-auto max-w-3xl py-6">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-16 md:py-20 text-center"
              >
                <div className="mx-auto mb-6 flex justify-center rounded-2xl p-2">
                  <BreathingCircle size="lg" />
                </div>
                <h2 className="mb-2 text-2xl font-bold">
                  {t('chat.welcomeTitle')}
                </h2>
                <p className="mb-8 text-muted-foreground">
                  {t('chat.welcomeSubtitle')}
                </p>

                {/* Quick questions */}
                <div className="flex flex-wrap justify-center gap-2">
                  {quickQuestions[language].map((q, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickQuestion(q)}
                      className="text-sm"
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4 md:space-y-6" data-testid="chat-message-list">
                <AnimatePresence initial={false}>
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 md:gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gradient-to-br from-primary to-accent text-white'
                      }`}>
                        {message.role === 'user' ? <User className="h-4 w-4" /> : <BreathingCircle size="sm" />}
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 md:max-w-[80%] ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-border/50 bg-muted/50'
                        }`}
                      >
                        <div className="prose prose-sm dark:prose-invert max-w-none text-[15px] leading-relaxed md:text-sm">
                          {message.role === 'assistant'
                            ? renderChatMarkdown(message.content)
                            : message.content.split('\n').map((line, i) => (
                                <p key={i} className="mb-2 last:mb-0">{line}</p>
                              ))}
                        </div>
                        {message.role === 'assistant' && message.citations && message.citations.length > 0 && (
                          <div className="mt-3 border-t border-border pt-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1.5">
                              {t('chat.sources')}
                            </p>
                            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                              {message.citations.map((c, i) => (
                                <li key={i}>
                                  <a
                                    href={c.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    {c.title || c.uri}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2 md:gap-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                      <BreathingCircle size="sm" />
                    </div>
                    <div className="flex max-w-[85%] items-center gap-1 rounded-2xl border border-border/50 bg-muted/50 px-4 py-3 md:max-w-[80%]">
                      <span className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
              </div>
            </div>

            {/* Input: floating glass pill with all controls inside */}
            <div
              className={cn(
                'relative flex items-end justify-center',
                isMobile ? 'fixed inset-x-0 bottom-0 z-30 px-3' : 'shrink-0 p-4'
              )}
              style={{
                paddingBottom: isMobile
                  ? 'calc(5rem + env(safe-area-inset-bottom, 0px))'
                  : 'max(0.75rem, env(safe-area-inset-bottom))',
              }}
            >
              {!isUnlimitedChat && getChatMessagesRemaining() <= 2 && getChatMessagesRemaining() >= 0 && (
                <p className="absolute -top-6 left-1/2 -translate-x-1/2 text-center text-xs text-muted-foreground whitespace-nowrap">
                  {t('chat.messagesLeft').replace('{{count}}', String(getChatMessagesRemaining()))}
                  <Link to={getUpgradePath(user)} className="text-primary hover:underline ml-1">
                    {t('chat.upgradeUnlimited')}
                  </Link>
                </p>
              )}
              {permissionError && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center justify-between gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive max-w-[90vw]">
                  <span className="min-w-0 truncate">{permissionError}</span>
                  <Button variant="ghost" size="sm" className="h-7 shrink-0 text-destructive hover:bg-destructive/20 rounded-full" onClick={() => setPermissionError(null)}>
                    {t('chat.dismiss')}
                  </Button>
                </div>
              )}
              <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
                <div className="rounded-[1.75rem] border border-white/10 dark:border-white/5 bg-background/70 dark:bg-background/60 backdrop-blur-2xl shadow-xl shadow-black/10 dark:shadow-black/30 p-2 md:p-2.5">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 gap-1.5 rounded-full px-3 text-xs transition-colors",
                          useSearch ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setUseSearch((v) => !v)}
                        title={t('chat.useWebSearch')}
                      >
                        <Globe className="h-3.5 w-3.5" />
                        {t('chat.webSearch')}
                      </Button>
                      {useSearch && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          {t('chat.webSearchNote')}
                        </span>
                      )}
                    </div>
                    <div className="flex min-h-[44px] items-end gap-2">
                      <Textarea
                        data-testid="chat-input"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t('chat.placeholder')}
                        className="min-h-[40px] max-h-[120px] flex-1 resize-none border-0 bg-transparent/50 rounded-2xl px-4 py-3 text-[15px] shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/70"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                          }
                        }}
                      />
                      {speechSupported ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-10 w-10 shrink-0 rounded-full transition-colors",
                            isListening ? "bg-destructive/20 text-destructive" : "hover:bg-muted/80"
                          )}
                          onClick={toggleVoiceInput}
                          title={isListening ? t('chat.stopListening') : t('chat.voiceInput')}
                          disabled={isLoading}
                        >
                          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 shrink-0 rounded-full opacity-50"
                          disabled
                          title={t('chat.voiceNotSupported')}
                        >
                          <MicOff className="h-5 w-5" />
                        </Button>
                      )}
                      <Button
                        type="submit"
                        data-testid="chat-send"
                        disabled={!input.trim() || isLoading}
                        className="h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
                      >
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  );
}
