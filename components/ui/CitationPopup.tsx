import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, ExternalLink, BookOpen, FileText, Building2, Hash, Percent, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Citation } from '../../services/supabaseClient';

interface CitationPopupProps {
    citation: Citation;
    onClose: () => void;
}

const getSourceIcon = (sourceId: string) => {
    switch (sourceId) {
        case 'VDB-01':
            return Building2; // BNM
        case 'VDB-02':
            return FileText; // Financial Act
        case 'VDB-03':
            return BookOpen; // Contract Framework
        case 'VDB-04':
        case 'VDB-05':
            return BookOpen; // Mufti Q&A
        default:
            return FileText;
    }
};

const getSourceColor = (sourceId: string) => {
    switch (sourceId) {
        case 'VDB-01':
            return 'from-emerald-500 to-teal-600';
        case 'VDB-02':
            return 'from-blue-500 to-indigo-600';
        case 'VDB-03':
            return 'from-amber-500 to-orange-600';
        case 'VDB-04':
        case 'VDB-05':
            return 'from-purple-500 to-pink-600';
        default:
            return 'from-slate-500 to-slate-600';
    }
};

const getSourceDescription = (sourceId: string) => {
    switch (sourceId) {
        case 'VDB-01':
            return 'Bank Negara Malaysia Shariah Advisory Council Resolutions - Highest regulatory authority for Islamic finance in Malaysia';
        case 'VDB-02':
            return 'Islamic Financial Services Act 2013 - Primary legislation governing Islamic financial institutions';
        case 'VDB-03':
            return 'BNM Shariah Contract Framework - Standardized parameters for Islamic contracts';
        case 'VDB-04':
        case 'VDB-05':
            return 'Mufti Q&A - Scholarly opinions and fatwas on Islamic finance matters';
        default:
            return 'Islamic Finance Knowledge Source';
    }
};

const getMatchQuality = (similarity: number) => {
    if (similarity >= 0.8) return { label: 'Excellent Match', color: 'text-emerald-700 bg-emerald-100' };
    if (similarity >= 0.6) return { label: 'Good Match', color: 'text-blue-700 bg-blue-100' };
    if (similarity >= 0.4) return { label: 'Moderate Match', color: 'text-amber-700 bg-amber-100' };
    return { label: 'Partial Match', color: 'text-slate-700 bg-slate-100' };
};

const CitationPopup: React.FC<CitationPopupProps> = ({ citation, onClose }) => {
    const popupRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);
    const [showFullContent, setShowFullContent] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);



    const Icon = getSourceIcon(citation.sourceId);
    const matchQuality = getMatchQuality(citation.similarity);

    const handleCopyContent = async () => {
        try {
            await navigator.clipboard.writeText(citation.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const displayContent = showFullContent
        ? citation.content
        : citation.content.length > 400
            ? `${citation.content.substring(0, 400)}...`
            : citation.content;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div
                ref={popupRef}
                className="relative w-[500px] max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className={`bg-gradient-to-r ${getSourceColor(citation.sourceId)} p-4`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
                                <Icon size={24} className="text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-white text-base leading-tight">
                                    {citation.title}
                                </h3>
                                <p className="text-white/80 text-sm mt-0.5">{citation.sourceName}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors shrink-0 ml-2"
                        >
                            <X size={18} className="text-white" />
                        </button>
                    </div>
                </div>

                {/* Source Description */}
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-xs text-slate-600 leading-relaxed">
                        {getSourceDescription(citation.sourceId)}
                    </p>
                </div>

                {/* Metadata Grid */}
                <div className="p-4 border-b border-slate-100">
                    <div className="grid grid-cols-3 gap-3">
                        {citation.page && (
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                                    <Hash size={16} className="text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">Page</p>
                                    <p className="text-slate-800 font-bold text-sm">{citation.page}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                                <Percent size={16} className="text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">Match</p>
                                <p className="text-slate-800 font-bold text-sm">{(citation.similarity * 100).toFixed(1)}%</p>
                            </div>
                        </div>
                        <div className="col-span-1">
                            <span className={`inline-block text-[10px] font-semibold px-2 py-1 rounded-full ${matchQuality.color}`}>
                                {matchQuality.label}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content Preview */}
                <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Source Content</h4>
                        <button
                            onClick={handleCopyContent}
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors"
                            title="Copy content"
                        >
                            {copied ? (
                                <>
                                    <Check size={12} className="text-emerald-500" />
                                    <span className="text-emerald-600">Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy size={12} />
                                    <span>Copy</span>
                                </>
                            )}
                        </button>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 max-h-[200px] overflow-y-auto border border-slate-100">
                        <div className="text-sm text-slate-700 leading-relaxed">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                    ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
                                    li: ({ children }) => <li>{children}</li>,
                                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                    em: ({ children }) => <em className="italic">{children}</em>,
                                    table: ({ children }) => <div className="overflow-x-auto my-2 border border-slate-200 rounded"><table className="min-w-full text-xs">{children}</table></div>,
                                    thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
                                    tbody: ({ children }) => <tbody className="divide-y divide-slate-100">{children}</tbody>,
                                    tr: ({ children }) => <tr>{children}</tr>,
                                    th: ({ children }) => <th className="px-2 py-1.5 font-semibold text-slate-700 text-left border-b border-slate-200">{children}</th>,
                                    td: ({ children }) => <td className="px-2 py-1.5 border-b border-slate-100 last:border-0">{children}</td>,
                                }}
                            >
                                {displayContent}
                            </ReactMarkdown>
                        </div>
                    </div>
                    {citation.content.length > 400 && (
                        <button
                            onClick={() => setShowFullContent(!showFullContent)}
                            className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                            {showFullContent ? (
                                <>
                                    <ChevronUp size={12} />
                                    Show Less
                                </>
                            ) : (
                                <>
                                    <ChevronDown size={12} />
                                    Show Full Content ({citation.content.length} chars)
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 pb-4 flex gap-2">
                    {citation.url && (
                        <a
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/25"
                        >
                            <ExternalLink size={14} />
                            View Original
                        </a>
                    )}
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CitationPopup;
