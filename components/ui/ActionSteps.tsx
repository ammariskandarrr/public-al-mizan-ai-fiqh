import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Clock, SkipForward, Loader2, Bot, Database, Sparkles, Eye, Cpu, Search, FileStack, Wand2 } from 'lucide-react';
import { AgentStep } from '../../services/agentService';

interface ActionStepsProps {
    steps: AgentStep[];
    collapsed?: boolean;
    embedded?: boolean; // When embedded inside a message, use compact layout
}

const getAgentIcon = (agentName: string) => {
    // Knowledge sources (vector DBs)
    if (agentName.includes('BNM') || agentName.includes('Resolutions')) return Database;
    if (agentName.includes('Islamic') || agentName.includes('Financial-Act')) return Database;
    if (agentName.includes('Contract') || agentName.includes('Framework')) return Database;
    if (agentName.includes('Mufti')) return Database;

    // Query processors
    if (agentName.includes('Query') || agentName.includes('Analyzer')) return Search;
    if (agentName.includes('Intent')) return Search;
    if (agentName.includes('Orchestrator')) return Cpu;

    // Content processors
    if (agentName.includes('Curator') || agentName.includes('Context')) return FileStack;
    if (agentName.includes('Synthesizer') || agentName.includes('Answer') || agentName.includes('Composer')) return Wand2;
    if (agentName.includes('Vision')) return Eye;

    return Bot;
};

const getStatusIcon = (status: AgentStep['status']) => {
    switch (status) {
        case 'completed':
            return <CheckCircle2 size={14} className="text-emerald-500" />;
        case 'error':
            return <AlertCircle size={14} className="text-red-500" />;
        case 'running':
            return <Loader2 size={14} className="text-blue-500 animate-spin" />;
        case 'skipped':
            return <SkipForward size={14} className="text-slate-400" />;
        case 'pending':
        default:
            return <Clock size={14} className="text-slate-400" />;
    }
};

const getStatusColor = (status: AgentStep['status']) => {
    switch (status) {
        case 'completed':
            return 'border-emerald-200 bg-emerald-50/80';
        case 'error':
            return 'border-red-200 bg-red-50/80';
        case 'running':
            return 'border-blue-200 bg-blue-50/80';
        case 'skipped':
            return 'border-slate-100 bg-slate-50/50';
        case 'pending':
        default:
            return 'border-slate-200 bg-white';
    }
};

const getAgentColor = (agentName: string) => {
    // Knowledge sources with distinct colors
    if (agentName.includes('BNM') || agentName.includes('Resolutions')) return 'from-emerald-500 to-teal-600';
    if (agentName.includes('Islamic') || agentName.includes('Financial-Act')) return 'from-blue-500 to-indigo-600';
    if (agentName.includes('Contract') || agentName.includes('Framework')) return 'from-amber-500 to-orange-600';
    if (agentName.includes('Mufti')) return 'from-purple-500 to-pink-600';

    // Processor agents
    if (agentName.includes('Orchestrator')) return 'from-slate-600 to-slate-800';
    if (agentName.includes('Query') || agentName.includes('Analyzer') || agentName.includes('Intent')) return 'from-violet-500 to-indigo-600';
    if (agentName.includes('Curator') || agentName.includes('Context')) return 'from-cyan-500 to-blue-600';
    if (agentName.includes('Synthesizer') || agentName.includes('Answer') || agentName.includes('Composer')) return 'from-pink-500 to-rose-600';
    if (agentName.includes('Vision')) return 'from-teal-500 to-emerald-600';

    return 'from-slate-500 to-slate-600';
};

const ActionSteps: React.FC<ActionStepsProps> = ({ steps, collapsed: initialCollapsed = false, embedded = false }) => {
    const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
    const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

    const completedCount = steps.filter(s => s.status === 'completed').length;
    const skippedCount = steps.filter(s => s.status === 'skipped').length;
    const errorCount = steps.filter(s => s.status === 'error').length;
    const runningStep = steps.find(s => s.status === 'running');

    const toggleStepDetails = (stepId: string) => {
        setExpandedStepId(expandedStepId === stepId ? null : stepId);
    };

    // Embedded version (inside message bubble)
    if (embedded) {
        return (
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {/* Compact Header */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-slate-100 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                            <Cpu size={12} className="text-white" />
                        </div>
                        <span className="text-xs font-semibold text-slate-700">
                            Agent Processing
                        </span>
                        <div className="flex items-center gap-1">
                            {completedCount > 0 && (
                                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                                    {completedCount} ✓
                                </span>
                            )}
                            {skippedCount > 0 && (
                                <span className="text-[10px] font-medium text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded-full">
                                    {skippedCount} skipped
                                </span>
                            )}
                            {errorCount > 0 && (
                                <span className="text-[10px] font-medium text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full">
                                    {errorCount} error
                                </span>
                            )}
                        </div>
                    </div>
                    {isCollapsed ? (
                        <ChevronDown size={14} className="text-slate-400" />
                    ) : (
                        <ChevronUp size={14} className="text-slate-400" />
                    )}
                </button>

                {/* Compact Steps List */}
                {!isCollapsed && (
                    <div className="px-3 pb-3 space-y-1.5">
                        {steps.map((step) => {
                            const Icon = getAgentIcon(step.agent);
                            const isExpanded = expandedStepId === step.id;
                            const hasDetails = step.details || step.result;

                            return (
                                <div key={step.id} className="space-y-1">
                                    <button
                                        onClick={() => hasDetails && toggleStepDetails(step.id)}
                                        className={`w-full flex items-center gap-2 p-2 rounded-lg border text-xs transition-all ${getStatusColor(step.status)} ${hasDetails ? 'cursor-pointer hover:shadow-sm' : 'cursor-default'}`}
                                    >
                                        <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${getAgentColor(step.agent)} flex items-center justify-center text-white shrink-0 shadow-sm`}>
                                            <Icon size={12} />
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <span className="font-medium text-slate-700 truncate block text-xs">
                                                {step.agent}
                                            </span>
                                            {step.result && (
                                                <span className={`text-[10px] truncate block ${step.status === 'completed' ? 'text-emerald-600' :
                                                    step.status === 'skipped' ? 'text-slate-400' :
                                                        step.status === 'error' ? 'text-red-600' :
                                                            'text-slate-500'
                                                    }`}>
                                                    {step.result}
                                                </span>
                                            )}
                                        </div>
                                        {getStatusIcon(step.status)}
                                        {step.startTime && step.endTime && (
                                            <span className="text-[10px] text-slate-400 font-mono">
                                                {step.endTime - step.startTime}ms
                                            </span>
                                        )}
                                        {hasDetails && (
                                            <ChevronDown size={12} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        )}
                                    </button>

                                    {/* Expanded Details */}
                                    {isExpanded && step.details && (
                                        <div className="ml-8 p-2 bg-slate-900 rounded-lg text-[10px] font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto">
                                            {step.details}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // Full version (standalone during processing)
    return (
        <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white shadow-lg shrink-0">
                <Bot size={18} />
            </div>

            <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Header */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-150 transition-colors border-b border-slate-100"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            {runningStep ? (
                                <Loader2 size={14} className="text-blue-500 animate-spin" />
                            ) : (
                                <CheckCircle2 size={14} className="text-emerald-500" />
                            )}
                            <span className="text-sm font-semibold text-slate-700">
                                {runningStep ? 'Processing...' : 'Completed'}
                            </span>
                        </div>
                        <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                            {completedCount}/{steps.length} steps
                        </span>
                    </div>
                    {isCollapsed ? (
                        <ChevronDown size={16} className="text-slate-400" />
                    ) : (
                        <ChevronUp size={16} className="text-slate-400" />
                    )}
                </button>

                {/* Steps List */}
                {!isCollapsed && (
                    <div className="p-4 space-y-3">
                        {steps.map((step) => {
                            const Icon = getAgentIcon(step.agent);
                            const isExpanded = expandedStepId === step.id;
                            const hasDetails = step.details;

                            return (
                                <div key={step.id} className="space-y-2">
                                    <div
                                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${getStatusColor(step.status)}`}
                                    >
                                        {/* Agent Icon */}
                                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getAgentColor(step.agent)} flex items-center justify-center text-white shadow-sm shrink-0`}>
                                            <Icon size={14} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-semibold text-slate-700">
                                                    {step.agent}
                                                </span>
                                                {getStatusIcon(step.status)}
                                                {step.startTime && step.endTime && (
                                                    <span className="text-[10px] text-slate-400 font-mono ml-auto">
                                                        {step.endTime - step.startTime}ms
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600">{step.action}</p>
                                            {step.result && (
                                                <p className={`text-xs mt-1 font-medium ${step.status === 'error' ? 'text-red-600' :
                                                    step.status === 'skipped' ? 'text-slate-400' :
                                                        'text-emerald-600'
                                                    }`}>
                                                    {step.result}
                                                </p>
                                            )}

                                            {/* Toggle Details Button */}
                                            {hasDetails && (
                                                <button
                                                    onClick={() => toggleStepDetails(step.id)}
                                                    className="mt-2 text-[10px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                                >
                                                    {isExpanded ? 'Hide' : 'Show'} Debug Details
                                                    <ChevronDown size={10} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Debug Details */}
                                    {isExpanded && step.details && (
                                        <div className="ml-11 p-3 bg-slate-900 rounded-xl text-xs font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto border border-slate-700">
                                            <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Debug Info</div>
                                            {step.details}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActionSteps;
