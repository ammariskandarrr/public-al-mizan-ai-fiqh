import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Send, Sparkles, Loader2, Paperclip, X, Image as ImageIcon,
    FileText, Bot, User as UserIcon, Copy, ThumbsUp,
    ThumbsDown, ExternalLink, BookOpen, Scale, Zap
} from 'lucide-react';
import { agentService, AgentStep, AgentResponse } from '../services/agentService';
import { Citation } from '../services/supabaseClient';
import CitationPopup from './ui/CitationPopup';
import ActionSteps from './ui/ActionSteps';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    attachments?: { type: 'image' | 'document'; name: string; data: string; mimeType: string }[];
    agentResponse?: AgentResponse;
    isStreaming?: boolean;
}

const QUICK_ACTIONS = [
    {
        icon: Scale,
        title: "Is cryptocurrency halal?",
        subtitle: "Get Shariah ruling on digital assets",
        gradient: "from-amber-500 to-orange-600"
    },
    {
        icon: BookOpen,
        title: "Explain Tawarruq",
        subtitle: "Islamic financing mechanism",
        gradient: "from-emerald-500 to-teal-600"
    },
    {
        icon: Zap,
        title: "Riba in modern banking",
        subtitle: "Understanding prohibited interest",
        gradient: "from-purple-500 to-indigo-600"
    },
    {
        icon: FileText,
        title: "Islamic mortgage alternatives",
        subtitle: "Shariah-compliant home financing",
        gradient: "from-blue-500 to-cyan-600"
    }
];

const AgenticChatBot: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentSteps, setCurrentSteps] = useState<AgentStep[]>([]);
    const [attachments, setAttachments] = useState<{ type: 'image' | 'document'; name: string; data: string; mimeType: string }[]>([]);
    const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, currentSteps, scrollToBottom]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [input]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                const isImage = file.type.startsWith('image/');
                setAttachments(prev => [...prev, {
                    type: isImage ? 'image' : 'document',
                    name: file.name,
                    data: base64,
                    mimeType: file.type,
                }]);
            };
            reader.readAsDataURL(file);
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = async (customQuery?: string) => {
        const query = customQuery || input.trim();
        if (!query && attachments.length === 0) return;

        const userMessage: ChatMessage = {
            id: `user_${Date.now()}`,
            role: 'user',
            content: query,
            timestamp: new Date(),
            attachments: attachments.length > 0 ? [...attachments] : undefined,
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setAttachments([]);
        setIsLoading(true);
        setCurrentSteps([]);

        // Add placeholder for assistant message
        const assistantMessageId = `assistant_${Date.now()}`;
        setMessages(prev => [...prev, {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
        }]);

        try {
            const response = await agentService.processQuery(
                query,
                userMessage.attachments?.map(a => ({
                    type: a.type,
                    data: a.data,
                    mimeType: a.mimeType,
                })),
                (steps) => setCurrentSteps([...steps])
            );

            // Update the assistant message with the response
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: response.answer,
                        agentResponse: response,
                        isStreaming: false,
                    }
                    : msg
            ));
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: "I apologize, but I encountered an error processing your request. Please try again.",
                        isStreaming: false,
                    }
                    : msg
            ));
        } finally {
            setIsLoading(false);
            setCurrentSteps([]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleCitationClick = (citation: Citation, event: React.MouseEvent) => {
        // Prevent default navigation if it's a link
        event.preventDefault();
        event.stopPropagation();
        setActiveCitation(citation);
    };

    // Custom component for rendering citations inline with markdown
    const renderMarkdownWithCitations = (text: string, citations: Citation[]) => {
        // Pre-process text to convert [n] into specific links that we can intercept.
        // This avoids splitting the markdown string which breaks block elements like tables.
        // We replace [1] with a markdown link: [[1]](#citation-1)
        const processedText = text.replace(/\[(\d+)\]/g, (match, digit) => {
            return `[${match}](#citation-${digit})`;
        });

        return (
            <div className="prose prose-slate prose-sm max-w-none text-slate-800">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        // Intercept links to render citations
                        a: ({ href, children }) => {
                            if (href?.startsWith('#citation-')) {
                                const indexStr = href.replace('#citation-', '');
                                const index = parseInt(indexStr, 10) - 1;
                                const citation = citations[index];
                                if (citation) {
                                    return (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleCitationClick(citation, e as any);
                                            }}
                                            className="inline-flex items-center justify-center w-5 h-5 mx-0.5 text-[10px] font-bold text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 hover:scale-110 transition-all cursor-pointer align-middle shadow-sm no-underline"
                                            title={`Click to view: ${citation.sourceName}${citation.page ? ` - Page ${citation.page}` : ''}`}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                }
                            }
                            return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{children}</a>;
                        },
                        // Preserve style mappings
                        h1: ({ children }) => <h1 className="text-xl font-bold text-slate-800 mt-4 mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-lg font-bold text-slate-800 mt-4 mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-base font-semibold text-slate-700 mt-3 mb-2">{children}</h3>,
                        p: ({ children }) => <p className="text-slate-700 leading-relaxed mb-3 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 text-slate-700">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3 text-slate-700">{children}</ol>,
                        li: ({ children }) => <li className="text-slate-700">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
                        em: ({ children }) => <em className="italic text-slate-600">{children}</em>,
                        code: ({ children }) => <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-slate-700">{children}</code>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-300 pl-4 italic text-slate-600 my-3">{children}</blockquote>,
                        table: ({ children }) => <div className="overflow-x-auto my-4 border border-slate-200 rounded-lg"><table className="min-w-full divide-y divide-slate-200 text-sm text-left">{children}</table></div>,
                        thead: ({ children }) => <thead className="bg-slate-50 font-semibold text-slate-700">{children}</thead>,
                        tbody: ({ children }) => <tbody className="divide-y divide-slate-200 bg-white">{children}</tbody>,
                        tr: ({ children }) => <tr className="hover:bg-slate-50/50 transition-colors">{children}</tr>,
                        th: ({ children }) => <th className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">{children}</th>,
                        td: ({ children }) => <td className="px-4 py-3 text-slate-600 align-top">{children}</td>,
                    }}
                >
                    {processedText}
                </ReactMarkdown>
            </div>
        );
    };

    const renderMessageContent = (message: ChatMessage) => {
        if (!message.agentResponse) {
            return <p className="whitespace-pre-wrap">{message.content}</p>;
        }

        const { answer, citations, steps, metadata } = message.agentResponse;

        return (
            <div className="space-y-4">
                {/* Agent Processing Steps - Always Visible */}
                {steps && steps.length > 0 && (
                    <div className="mb-4">
                        <ActionSteps steps={steps} collapsed={true} embedded={true} />
                    </div>
                )}

                {/* Answer Content - Parsed Markdown with Inline Citations */}
                <div className="answer-content">
                    {renderMarkdownWithCitations(answer, citations)}
                </div>

                {/* References Section */}
                {citations.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-200">
                        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <BookOpen size={14} />
                            References ({citations.length})
                        </h4>
                        <div className="grid gap-2">
                            {citations.slice(0, 5).map((citation, idx) => (
                                <button
                                    key={citation.id}
                                    onClick={(e) => handleCitationClick(citation, e)}
                                    className="w-full text-left p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 hover:from-blue-50 hover:to-indigo-50 border border-slate-200 hover:border-blue-300 transition-all group shadow-sm hover:shadow"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow">
                                            {idx + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 group-hover:text-blue-700 transition-colors">
                                                {citation.title}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {citation.sourceName}
                                                {citation.page && ` • Page ${citation.page}`}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${citation.similarity >= 0.8 ? 'bg-emerald-100 text-emerald-700' :
                                                    citation.similarity >= 0.6 ? 'bg-blue-100 text-blue-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {(citation.similarity * 100).toFixed(0)}% match
                                                </span>
                                                <span className="text-[10px] text-slate-400">Click to view source</span>
                                            </div>
                                        </div>
                                        <ExternalLink size={14} className="text-slate-400 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Metadata Footer */}
                {metadata && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        {/* <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-full">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                            GPT-4.1-mini
                        </span> */}
                        <span className="bg-slate-100 px-2 py-1 rounded-full">{metadata.totalSources} sources</span>
                        <span className="bg-slate-100 px-2 py-1 rounded-full">{(metadata.processingTime / 1000).toFixed(1)}s</span>
                        {/* <span className={`px-2 py-1 rounded-full ${metadata.confidenceScore >= 70 ? 'bg-emerald-100 text-emerald-700' :
                            metadata.confidenceScore >= 40 ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                            {metadata.confidenceScore.toFixed(0)}% confidence
                        </span> */}
                    </div>
                )}
            </div>
        );
    };

    // Welcome screen when no messages
    if (messages.length === 0) {
        return (
            <div className="flex flex-col h-full bg-white relative">
                {/* Content */}
                <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 max-w-3xl mx-auto w-full">
                    {/* Logo & Title */}
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 mb-6">
                            <Scale size={24} className="text-slate-700" />
                        </div>
                        <h1 className="text-3xl font-semibold text-slate-800 mb-2">
                            Al-Mizan Fiqh Assistant
                        </h1>
                        <p className="text-slate-500 text-base">
                            Ask anything about Malaysian Islamic Finance & Shariah rulings
                        </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-8">
                        {QUICK_ACTIONS.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(action.title)}
                                className="group flex flex-col gap-1 p-4 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all text-left shadow-sm hover:shadow"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <action.icon size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                    <span className="font-medium text-slate-700 text-sm group-hover:text-slate-900">{action.title}</span>
                                </div>
                                <span className="text-xs text-slate-400">{action.subtitle}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Input Area - Floating */}
                <div className="p-4 pb-6 w-full max-w-3xl mx-auto z-20">
                    <div className="relative bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden focus-within:ring-1 focus-within:ring-slate-300 transition-all">
                        {/* Attachments preview */}
                        {attachments.length > 0 && (
                            <div className="flex gap-2 p-3 border-b border-slate-100 bg-slate-50/50">
                                {attachments.map((att, idx) => (
                                    <div key={idx} className="relative group">
                                        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600">
                                            {att.type === 'image' ? <ImageIcon size={12} /> : <FileText size={12} />}
                                            <span className="max-w-[100px] truncate">{att.name}</span>
                                        </div>
                                        <button
                                            onClick={() => removeAttachment(idx)}
                                            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-end gap-2 p-3">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                                title="Attach file"
                            >
                                <Paperclip size={20} />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,.pdf,.doc,.docx"
                                multiple
                                className="hidden"
                                onChange={handleFileUpload}
                            />

                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Message Al-Mizan..."
                                className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 resize-none focus:outline-none text-base leading-relaxed max-h-[150px] py-2"
                                rows={1}
                            />

                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() && attachments.length === 0}
                                className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                    <p className="text-center text-[10px] text-slate-400 mt-3">
                        AI provided by authoritative Malaysian Islamic Finance sources.
                    </p>
                </div>
            </div>
        );
    }

    // Chat interface
    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-8">
                <div className="max-w-3xl mx-auto space-y-8">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${msg.role === 'user'
                                ? 'bg-slate-100 border-slate-200'
                                : 'bg-slate-900 border-slate-900 border-transparent'
                                }`}>
                                {msg.role === 'user' ? (
                                    <UserIcon size={16} className="text-slate-600" />
                                ) : (
                                    <Scale size={16} className="text-white" />
                                )}
                            </div>

                            <div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                {/* Name */}
                                <span className="text-xs font-semibold text-slate-900 mb-1">
                                    {msg.role === 'user' ? 'You' : 'Al-Mizan'}
                                </span>

                                {/* Attachments */}
                                {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {msg.attachments.map((att, idx) => (
                                            <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
                                                {att.type === 'image' ? <ImageIcon size={14} /> : <FileText size={14} />}
                                                <span className="max-w-[150px] truncate">{att.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Message Content */}
                                <div className={`text-[15px] leading-relaxed ${msg.role === 'user'
                                    ? 'bg-slate-100 px-4 py-2.5 rounded-2xl rounded-tr-sm text-slate-800'
                                    : 'text-slate-800 w-full'
                                    }`}>
                                    {msg.isStreaming ? (
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                                        </div>
                                    ) : (
                                        msg.role === 'user' ? (
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                        ) : (
                                            renderMessageContent(msg)
                                        )
                                    )}
                                </div>

                                {/* Message Footer / Actions */}
                                {!msg.isStreaming && msg.role === 'assistant' && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <button className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded" title="Copy">
                                            <Copy size={12} />
                                        </button>
                                        <button className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded" title="Helpful">
                                            <ThumbsUp size={12} />
                                        </button>
                                        <button className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded" title="Not helpful">
                                            <ThumbsDown size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Action Steps Display - During Loading - Bottom of stream */}
                    {isLoading && currentSteps.length > 0 && (
                        <div className="pl-12">
                            <ActionSteps steps={currentSteps} />
                        </div>
                    )}

                    <div ref={messagesEndRef} className="h-4" />
                </div>
            </div>

            {/* Citation Popup */}
            {activeCitation && (
                <CitationPopup
                    citation={activeCitation}
                    onClose={() => setActiveCitation(null)}
                />
            )}

            {/* Input Area - Fixed Bottom */}
            <div className="p-4 pb-6 w-full max-w-3xl mx-auto z-20 bg-gradient-to-t from-white via-white to-transparent pt-10">
                <div className="relative bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden focus-within:ring-1 focus-within:ring-slate-300 transition-all">
                    {/* Attachments preview */}
                    {attachments.length > 0 && (
                        <div className="flex gap-2 p-3 border-b border-slate-100 bg-slate-50/50">
                            {attachments.map((att, idx) => (
                                <div key={idx} className="relative group">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600">
                                        {att.type === 'image' ? <ImageIcon size={12} /> : <FileText size={12} />}
                                        <span className="max-w-[100px] truncate">{att.name}</span>
                                    </div>
                                    <button
                                        onClick={() => removeAttachment(idx)}
                                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-end gap-2 p-3">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                            title="Attach file"
                        >
                            <Paperclip size={20} />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf,.doc,.docx"
                            multiple
                            className="hidden"
                            onChange={handleFileUpload}
                        />

                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Message Al-Mizan..."
                            className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 resize-none focus:outline-none text-base leading-relaxed max-h-[150px] py-2"
                            rows={1}
                            disabled={isLoading}
                        />

                        <button
                            onClick={() => handleSend()}
                            disabled={isLoading || (!input.trim() && attachments.length === 0)}
                            className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Send size={18} />
                            )}
                        </button>
                    </div>
                </div>
                <p className="text-center text-[10px] text-slate-400 mt-3">
                    AI provided by authoritative Malaysian Islamic Finance sources.
                </p>
            </div>
        </div>
    );
};

export default AgenticChatBot;
