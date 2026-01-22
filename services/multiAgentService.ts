/**
 * Multi-Agent Shariah Review Service
 * Orchestrates parallel execution of 3 specialized agents + Gemini aggregator
 */

import { GoogleGenAI } from "@google/genai";
import { openai, ChatMessage as OpenAIChatMessage } from './openaiService';
import { VECTOR_DBS, VectorSearchResult } from './supabaseClient';
import {
    AnalysisData,
    AgentAnalysis,
    MultiAgentAnalysisData,
    ShariahIssue,
    CompliantElement
} from '../types';
import {
    IFSA_AGENT_PROMPT,
    SHARIAH_RESOLUTION_AGENT_PROMPT,
    MUFTI_AGENT_PROMPT,
    AGGREGATOR_AGENT_PROMPT,
    createAgentAnalysisPrompt,
    createAggregationPrompt
} from './agentPrompts';

// Initialize Gemini for final aggregation
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

// OpenAI model for specialist agents
const SPECIALIST_MODEL = 'gpt-4';

// Gemini model for final aggregation (user requested 2.5 Pro or 3 Pro)
const AGGREGATOR_MODEL = 'gemini-2.5-pro';

// Supabase credentials
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wndnznopltyrbiujyhgh.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Query RAG system for agent-specific context
 * READ-ONLY access to existing vector databases
 */
async function queryRAGForAgent(
    agentType: 'IFSA' | 'Shariah_Resolutions' | 'Mufti',
    queryEmbedding: number[]
): Promise<string> {
    // Define which VDBs each agent should query
    const agentVDBMapping: Record<string, string[]> = {
        'IFSA': ['islamic_financial_act', 'shariah_contract_framework'], // VDB-02, VDB-03
        'Shariah_Resolutions': ['bnm_resolutions', 'shariah_contract_framework'], // VDB-01, VDB-03
        'Mufti': ['mufti_qa', 'bnm_resolutions'] // VDB-04, VDB-01
    };

    const tables = agentVDBMapping[agentType];
    const allResults: VectorSearchResult[] = [];

    for (const table of tables) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_${table}`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query_embedding: queryEmbedding,
                    match_count: 3,
                    match_threshold: 0.3,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                allResults.push(...data.map((item: any) => ({
                    id: item.id,
                    content: item.content,
                    metadata: item.metadata || {},
                    similarity: item.similarity || 0.5,
                })));
            }
        } catch (error) {
            console.warn(`[MultiAgent] RAG query failed for ${table}:`, error);
        }
    }

    // Sort by similarity and format context
    const sortedResults = allResults.sort((a, b) => b.similarity - a.similarity).slice(0, 5);

    if (sortedResults.length === 0) {
        return "No relevant context found in knowledge base.";
    }

    return sortedResults.map((r, i) =>
        `[Source ${i + 1}] (${(r.similarity * 100).toFixed(0)}% match)\n${r.content}`
    ).join('\n\n---\n\n');
}

/**
 * Run a specialist agent (IFSA, Shariah Resolutions, or Mufti)
 */
async function runSpecialistAgent(
    agentType: 'IFSA' | 'Shariah_Resolutions' | 'Mufti',
    documentText: string,
    queryEmbedding: number[]
): Promise<AgentAnalysis> {
    console.log(`[MultiAgent] Starting ${agentType} agent...`);
    const startTime = Date.now();

    // Get agent-specific system prompt
    const systemPrompts: Record<string, string> = {
        'IFSA': IFSA_AGENT_PROMPT,
        'Shariah_Resolutions': SHARIAH_RESOLUTION_AGENT_PROMPT,
        'Mufti': MUFTI_AGENT_PROMPT
    };

    try {
        // Query RAG for relevant context
        const ragContext = await queryRAGForAgent(agentType, queryEmbedding);

        // Build analysis prompt
        const analysisPrompt = createAgentAnalysisPrompt(documentText, ragContext, agentType);

        // Call OpenAI
        const messages: OpenAIChatMessage[] = [
            { role: 'system', content: systemPrompts[agentType] },
            { role: 'user', content: analysisPrompt }
        ];

        const response = await openai.chatCompletion(messages, {
            model: SPECIALIST_MODEL,
            temperature: 0.1,
            maxTokens: 2000,
        });

        const responseText = response.choices[0].message.content;

        // Parse JSON from response
        const analysis = parseAgentJson(responseText, agentType);

        console.log(`[MultiAgent] ${agentType} agent completed in ${Date.now() - startTime}ms`);
        return analysis;

    } catch (error) {
        console.error(`[MultiAgent] ${agentType} agent failed:`, error);

        // Return error fallback
        return {
            agent_name: agentType,
            compliance_status: 'Partially Compliant',
            confidence_score: 0,
            key_findings: [{ finding: `Agent error: ${error}`, severity: 'Low' }],
            issues_detected: [],
            compliant_aspects: [],
            recommendations: ['Manual review recommended due to agent error'],
            summary: `${agentType} agent encountered an error during analysis.`
        };
    }
}

/**
 * Parse JSON from agent response with fallback handling
 */
function parseAgentJson(responseText: string, agentType: string): AgentAnalysis {
    try {
        // Remove markdown code blocks if present
        let cleanText = responseText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        // Try to extract JSON object
        const match = cleanText.match(/\{[\s\S]*\}/);
        if (match) {
            const parsed = JSON.parse(match[0]);
            return {
                agent_name: agentType as 'IFSA' | 'Shariah_Resolutions' | 'Mufti',
                compliance_status: parsed.compliance_status || 'Partially Compliant',
                confidence_score: parsed.confidence_score || 50,
                key_findings: parsed.key_findings || [],
                issues_detected: parsed.issues_detected || [],
                compliant_aspects: parsed.compliant_aspects || [],
                recommendations: parsed.recommendations || [],
                summary: parsed.summary || 'Analysis complete.'
            };
        }
    } catch (e) {
        console.warn(`[MultiAgent] JSON parse failed for ${agentType}:`, e);
    }

    // Fallback: extract what we can from text
    return {
        agent_name: agentType as 'IFSA' | 'Shariah_Resolutions' | 'Mufti',
        compliance_status: 'Partially Compliant',
        confidence_score: 50,
        key_findings: [{ finding: responseText.slice(0, 200), severity: 'Medium' }],
        issues_detected: [],
        compliant_aspects: [],
        recommendations: ['Review raw analysis output'],
        summary: responseText.slice(0, 300)
    };
}

/**
 * Run final Gemini aggregator agent
 */
async function runAggregatorAgent(
    documentSummary: string,
    ifsaAnalysis: AgentAnalysis,
    resolutionAnalysis: AgentAnalysis,
    muftiAnalysis: AgentAnalysis
): Promise<MultiAgentAnalysisData> {
    console.log('[MultiAgent] Starting Gemini aggregator agent...');
    const startTime = Date.now();

    try {
        const aggregationPrompt = createAggregationPrompt(
            documentSummary,
            ifsaAnalysis,
            resolutionAnalysis,
            muftiAnalysis
        );

        const response = await ai.models.generateContent({
            model: AGGREGATOR_MODEL,
            contents: { parts: [{ text: aggregationPrompt }] },
            config: {
                systemInstruction: AGGREGATOR_AGENT_PROMPT,
            }
        });

        const responseText = response.text || '';

        // Parse aggregation result
        const aggregation = parseAggregatorJson(
            responseText,
            ifsaAnalysis,
            resolutionAnalysis,
            muftiAnalysis,
            startTime
        );

        console.log(`[MultiAgent] Aggregator completed in ${Date.now() - startTime}ms`);
        return aggregation;

    } catch (error) {
        console.error('[MultiAgent] Aggregator agent failed:', error);

        // Return fallback aggregation
        return createFallbackAggregation(ifsaAnalysis, resolutionAnalysis, muftiAnalysis, startTime);
    }
}

/**
 * Parse JSON from aggregator response
 */
function parseAggregatorJson(
    responseText: string,
    ifsaAnalysis: AgentAnalysis,
    resolutionAnalysis: AgentAnalysis,
    muftiAnalysis: AgentAnalysis,
    startTime: number
): MultiAgentAnalysisData {
    try {
        let cleanText = responseText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const match = cleanText.match(/\{[\s\S]*\}/);
        if (match) {
            const parsed = JSON.parse(match[0]);

            return {
                overall_verdict: parsed.overall_verdict || {
                    status: 'Partially Compliant',
                    confidence: 50,
                    risk_level: 'Medium',
                    summary: 'Analysis complete.'
                },
                consensus_analysis: parsed.consensus_analysis || {
                    level: 'Split opinion',
                    agreement_areas: [],
                    disagreement_areas: []
                },
                agent_analyses: {
                    ifsa: ifsaAnalysis,
                    shariah_resolutions: resolutionAnalysis,
                    mufti: muftiAnalysis
                },
                consolidated_issues: parsed.consolidated_issues || [],
                strengths: parsed.strengths || [],
                recommendations: parsed.recommendations || [],
                final_shariah_verdict: parsed.final_shariah_verdict || 'Review required.',
                suitable_islamic_structures: parsed.suitable_islamic_structures || [],
                next_steps: parsed.next_steps || [],
                processing_time_seconds: (Date.now() - startTime) / 1000,
                agents_consulted: ['IFSA', 'Shariah_Resolutions', 'Mufti']
            };
        }
    } catch (e) {
        console.warn('[MultiAgent] Aggregator JSON parse failed:', e);
    }

    return createFallbackAggregation(ifsaAnalysis, resolutionAnalysis, muftiAnalysis, startTime);
}

/**
 * Create fallback aggregation when parsing fails
 */
function createFallbackAggregation(
    ifsaAnalysis: AgentAnalysis,
    resolutionAnalysis: AgentAnalysis,
    muftiAnalysis: AgentAnalysis,
    startTime: number
): MultiAgentAnalysisData {
    // Determine consensus
    const statuses = [
        ifsaAnalysis.compliance_status,
        resolutionAnalysis.compliance_status,
        muftiAnalysis.compliance_status
    ];

    const allSame = statuses.every(s => s === statuses[0]);
    const majorityStatus = statuses.sort((a, b) =>
        statuses.filter(v => v === a).length - statuses.filter(v => v === b).length
    ).pop() || 'Partially Compliant';

    const avgConfidence = (
        ifsaAnalysis.confidence_score +
        resolutionAnalysis.confidence_score +
        muftiAnalysis.confidence_score
    ) / 3;

    return {
        overall_verdict: {
            status: majorityStatus as 'Compliant' | 'Partially Compliant' | 'Non-Compliant',
            confidence: avgConfidence,
            risk_level: avgConfidence > 70 ? 'Low' : avgConfidence > 40 ? 'Medium' : 'High',
            summary: `Multi-agent analysis complete. ${allSame ? 'All agents agree' : 'Mixed opinions'} on compliance status.`
        },
        consensus_analysis: {
            level: allSame ? 'All agents agree' : 'Majority agree',
            agreement_areas: [],
            disagreement_areas: []
        },
        agent_analyses: {
            ifsa: ifsaAnalysis,
            shariah_resolutions: resolutionAnalysis,
            mufti: muftiAnalysis
        },
        consolidated_issues: [],
        strengths: [],
        recommendations: [
            { priority: 'High', action: 'Review individual agent analyses', impact: 'Comprehensive understanding' }
        ],
        final_shariah_verdict: 'Please review individual agent analyses for detailed findings.',
        suitable_islamic_structures: [],
        next_steps: ['Review IFSA analysis', 'Review Shariah Resolution analysis', 'Review Mufti analysis'],
        processing_time_seconds: (Date.now() - startTime) / 1000,
        agents_consulted: ['IFSA', 'Shariah_Resolutions', 'Mufti']
    };
}

/**
 * Main multi-agent analysis function
 * Runs all 3 specialist agents in parallel, then aggregates with Gemini
 */
export async function analyzeDocumentMultiAgent(
    documentText: string,
    documentSummary?: string
): Promise<AnalysisData> {
    console.log('[MultiAgent] Starting multi-agent Shariah analysis...');
    const overallStartTime = Date.now();

    try {
        // Step 1: Generate embedding for RAG queries
        console.log('[MultiAgent] Generating query embedding...');
        const queryText = documentSummary || documentText.slice(0, 1000);
        const queryEmbedding = await openai.createEmbedding(queryText);

        // Step 2: Run all 3 specialist agents in parallel
        console.log('[MultiAgent] Running specialist agents in parallel...');
        const [ifsaAnalysis, resolutionAnalysis, muftiAnalysis] = await Promise.all([
            runSpecialistAgent('IFSA', documentText, queryEmbedding),
            runSpecialistAgent('Shariah_Resolutions', documentText, queryEmbedding),
            runSpecialistAgent('Mufti', documentText, queryEmbedding)
        ]);

        // Step 3: Run Gemini aggregator
        console.log('[MultiAgent] Running Gemini aggregator...');
        const multiAgentData = await runAggregatorAgent(
            documentSummary || documentText.slice(0, 500),
            ifsaAnalysis,
            resolutionAnalysis,
            muftiAnalysis
        );

        // Step 4: Convert to AnalysisData format for UI compatibility
        const result: AnalysisData = convertToAnalysisData(multiAgentData);

        console.log(`[MultiAgent] Complete! Total time: ${(Date.now() - overallStartTime) / 1000}s`);
        return result;

    } catch (error) {
        console.error('[MultiAgent] Analysis failed:', error);
        throw error;
    }
}

/**
 * Convert MultiAgentAnalysisData to AnalysisData for UI compatibility
 */
function convertToAnalysisData(multiAgentData: MultiAgentAnalysisData): AnalysisData {
    const { overall_verdict, consolidated_issues, strengths, final_shariah_verdict, suitable_islamic_structures } = multiAgentData;

    // Calculate score from confidence (0-100)
    const score = Math.round(overall_verdict.confidence);

    // Generate key_points from all agent summaries and consolidated issues
    const key_points: string[] = [];

    // Add agent summaries
    key_points.push(`🏛️ IFSA: ${multiAgentData.agent_analyses.ifsa.summary}`);
    key_points.push(`📚 Resolutions: ${multiAgentData.agent_analyses.shariah_resolutions.summary}`);
    key_points.push(`👨‍⚖️ Mufti: ${multiAgentData.agent_analyses.mufti.summary}`);

    // Add consolidated issues
    consolidated_issues.forEach(issue => {
        const severityEmoji = issue.severity === 'Critical' ? '🔴' : issue.severity === 'High' ? '🟠' : issue.severity === 'Medium' ? '🟡' : '🟢';
        key_points.push(`${severityEmoji} ${issue.issue_type}: ${issue.description}`);
    });

    // Convert issues to ShariahIssue format
    const issues_detected: ShariahIssue[] = consolidated_issues.map(issue => ({
        type: issue.issue_type === 'Regulatory' || issue.issue_type === 'Governance' || issue.issue_type === 'Ethical'
            ? 'Other'
            : issue.issue_type as ShariahIssue['type'],
        severity: issue.severity === 'Critical' ? 'High' : issue.severity as ShariahIssue['severity'],
        location: undefined,
        description: issue.description,
        evidence: issue.evidence,
        shariah_principle: issue.shariah_basis,
        suggested_fix: issue.suggested_fix
    }));

    // Convert strengths to CompliantElement format
    const compliant_elements: CompliantElement[] = strengths.map(s => ({
        aspect: s.aspect,
        explanation: s.explanation
    }));

    return {
        score,
        risk: overall_verdict.risk_level,
        summary: overall_verdict.summary,
        key_points,
        issues_detected,
        compliant_elements,
        shariah_verdict: final_shariah_verdict,
        suitable_structures: suitable_islamic_structures.map(s => s.structure),
        analysis_type: 'multi-agent',
        multi_agent_data: multiAgentData
    };
}
