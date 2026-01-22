// Agentic RAG Service - Orchestrates multi-source retrieval and synthesis
import { openai, ChatMessage as OpenAIChatMessage } from './openaiService';
import { VECTOR_DBS, Citation, VectorSearchResult } from './supabaseClient';

export type AgentStep = {
    id: string;
    agent: string;
    action: string;
    status: 'pending' | 'running' | 'completed' | 'error' | 'skipped';
    result?: string;
    details?: string; // Additional debug info
    startTime?: number;
    endTime?: number;
};

export interface AgentResponse {
    answer: string;
    citations: Citation[];
    steps: AgentStep[];
    metadata: {
        totalSources: number;
        processingTime: number;
        confidenceScore: number;
        model: string;
    };
}

// Source priority for conflict resolution (higher = more authoritative)
const SOURCE_PRIORITY: Record<string, number> = {
    'VDB-01': 100, // BNM Shariah Resolutions - highest regulatory authority
    'VDB-02': 95,  // Islamic Financial Act
    'VDB-03': 90,  // BNM Shariah Contract Framework
    'VDB-04': 70,  // Mufti Q&A
};

// Threshold for semantic relevance
const RELEVANCE_THRESHOLD = 0.35;

// Current model
const SYNTHESIS_MODEL = 'gpt-4.1-mini';

class AgentService {
    // Patterns for detecting conversational/greeting queries that don't need KB lookup
    private readonly GREETING_PATTERNS = [
        /^(hi|hai|hello|hey|assalamualaikum|salam|bg|boss|good\s*(morning|afternoon|evening|day)|greetings)/i,
        /^(how\s+are\s+you|what'?s?\s+up|sup)/i,
        /^(thanks?|thank\s+you|appreciate)/i,
        /^(bye|goodbye|see\s+you|take\s+care)/i,
    ];

    private readonly CONVERSATIONAL_PATTERNS = [
        /^(who\s+are\s+you|what\s+are\s+you|tell\s+me\s+about\s+yourself)/i,
        /^(what\s+can\s+you\s+do|how\s+can\s+you\s+help|what\s+are\s+your\s+capabilities)/i,
        /^(help\s*$|help\s+me\s*$)/i,
    ];

    private isGreeting(query: string): boolean {
        return this.GREETING_PATTERNS.some(pattern => pattern.test(query.trim()));
    }

    private isConversational(query: string): boolean {
        return this.CONVERSATIONAL_PATTERNS.some(pattern => pattern.test(query.trim()));
    }

    private async generateDirectResponse(query: string): Promise<string> {
        const messages: OpenAIChatMessage[] = [
            {
                role: 'system',
                content: `You are Al-Mizan, an expert Islamic Finance Consultant specializing in Fiqh Al-Muamalat and Shariah compliance in Malaysia.

You are friendly, professional, and knowledgeable. When responding to greetings or conversational queries:
- Be warm and welcoming
- Briefly introduce yourself if asked
- Explain your capabilities related to Islamic finance
- Encourage users to ask about Shariah compliance, Islamic banking, halal investments, etc.

Keep responses concise but helpful. Use both English and Malay terms where appropriate.`
            },
            {
                role: 'user',
                content: query
            }
        ];

        const response = await openai.chatCompletion(messages, {
            model: SYNTHESIS_MODEL,
            temperature: 0.7,
            maxTokens: 500,
        });

        return response.choices[0].message.content;
    }

    private async checkRelevance(query: string): Promise<{ isRelevant: boolean; refusalMessage?: string }> {
        const messages: OpenAIChatMessage[] = [
            {
                role: 'system',
                content: `You are a Guardrail Agent for Al-Mizan, an Islamic Finance Consultant.
Your task is to classify if a user's query is RELEVANT to the following topics:
1. Islamic Finance, Banking, Takaful, or Economics
2. Fiqh Al-Muamalat (Islamic Commercial Law)
3. Shariah Rulings and compliance
4. Inquiries about Al-Mizan's capabilities or identity
5. General greetings or courtesies (if mixed with questions)

If the query is completely UNRELATED (e.g., cooking recipes, general history, coding, sports, non-finance politics, medical advice, homework help unrelated to finance), you must flagging it as IRRELEVANT.

Respond with a JSON object:
{
  "isRelevant": boolean,
  "refusalMessage": string // Only if isRelevant is false. A polite, short apology explaining you can only discuss Islamic Finance and Shariah topics.
}

Example Refusal: "I apologize, but I specialize only in Islamic Finance and Fiqh questions. I cannot assist with general topics."`
            },
            {
                role: 'user',
                content: query
            }
        ];

        try {
            const response = await openai.chatCompletion(messages, {
                model: SYNTHESIS_MODEL,
                temperature: 0.1,
                maxTokens: 100,
                response_format: { type: "json_object" }
            });

            return JSON.parse(response.choices[0].message.content);
        } catch (error) {
            console.error('Guardrail check failed:', error);
            // Fail open (allow query) if guardrail fails to avoid blocking legitimate users on error
            return { isRelevant: true };
        }
    }

    private generateStepId(): string {
        return `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Main orchestration method
    async processQuery(
        query: string,
        attachments?: { type: 'image' | 'document'; data: string; mimeType: string }[],
        onStepUpdate?: (steps: AgentStep[]) => void
    ): Promise<AgentResponse> {
        const startTime = Date.now();
        const steps: AgentStep[] = [];
        const allCitations: Citation[] = [];

        // Helper to update steps
        const updateStep = (stepId: string, updates: Partial<AgentStep>) => {
            const stepIndex = steps.findIndex(s => s.id === stepId);
            if (stepIndex !== -1) {
                steps[stepIndex] = { ...steps[stepIndex], ...updates };
                onStepUpdate?.(steps);
            }
        };

        // Step 0: Intent Detection - Check if this is a greeting or conversational query
        const isGreetingQuery = this.isGreeting(query);
        const isConversationalQuery = this.isConversational(query);

        if ((isGreetingQuery || isConversationalQuery) && (!attachments || attachments.length === 0)) {
            // Handle greeting/conversational queries directly without KB lookup
            const intentStepId = this.generateStepId();
            steps.push({
                id: intentStepId,
                agent: 'Intent-Detector',
                action: isGreetingQuery ? 'Detected greeting, responding directly...' : 'Detected conversational query, responding directly...',
                status: 'running',
                details: `Query type: ${isGreetingQuery ? 'Greeting' : 'Conversational'}`,
                startTime: Date.now(),
            });
            onStepUpdate?.(steps);

            try {
                const directResponse = await this.generateDirectResponse(query);
                updateStep(intentStepId, {
                    status: 'completed',
                    result: 'Direct response generated',
                    endTime: Date.now(),
                });

                return {
                    answer: directResponse,
                    citations: [],
                    steps,
                    metadata: {
                        totalSources: 0,
                        processingTime: Date.now() - startTime,
                        confidenceScore: 100,
                        model: SYNTHESIS_MODEL,
                    },
                };
            } catch (error) {
                updateStep(intentStepId, {
                    status: 'error',
                    result: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    endTime: Date.now(),
                });
            }
        }

        // Step 0.5: Guardrail Check (Domain Relevance)
        const guardrailStepId = this.generateStepId();
        steps.push({
            id: guardrailStepId,
            agent: 'Guardrail-Agent',
            action: 'Verifying query relevance to Islamic Finance...',
            status: 'running',
            details: 'Ensuring topic is within scope (Fiqh/Shariah/Finance)',
            startTime: Date.now(),
        });
        onStepUpdate?.(steps);

        const { isRelevant, refusalMessage } = await this.checkRelevance(query);

        if (!isRelevant) {
            updateStep(guardrailStepId, {
                status: 'error', // Use error status to indicate rejection/stop
                result: 'Query blocked: Off-topic',
                details: 'Topic is outside Islamic Finance domain',
                endTime: Date.now(),
            });

            return {
                answer: refusalMessage || "I apologize, but I can only answer questions related to Islamic Finance and Fiqh rulings.",
                citations: [],
                steps,
                metadata: {
                    totalSources: 0,
                    processingTime: Date.now() - startTime,
                    confidenceScore: 0,
                    model: 'guardrail',
                },
            };
        }

        updateStep(guardrailStepId, {
            status: 'completed',
            result: 'Query is relevant',
            endTime: Date.now(),
        });

        // Step 1: Query Analysis (for knowledge-based queries)
        const analyzeStepId = this.generateStepId();
        steps.push({
            id: analyzeStepId,
            agent: 'Orchestrator',
            action: 'Analyzing query and planning knowledge retrieval strategy...',
            status: 'running',
            details: `Query: "${query.slice(0, 100)}${query.length > 100 ? '...' : ''}"`,
            startTime: Date.now(),
        });
        onStepUpdate?.(steps);

        let enhancedQuery = query;

        // Handle multimodal input (images/documents)
        if (attachments && attachments.length > 0) {
            const imageAttachment = attachments.find(a => a.type === 'image');
            if (imageAttachment) {
                const imageAnalysisStepId = this.generateStepId();
                steps.push({
                    id: imageAnalysisStepId,
                    agent: 'Vision-Analyzer',
                    action: 'Analyzing uploaded image for Shariah compliance context...',
                    details: `Image type: ${imageAttachment.mimeType}`,
                    status: 'running',
                    startTime: Date.now(),
                });
                onStepUpdate?.(steps);

                try {
                    const imageDescription = await openai.analyzeImage(
                        imageAttachment.data,
                        imageAttachment.mimeType,
                        `Analyze this image in the context of Islamic finance and Shariah compliance. 
             Describe any financial documents, contracts, or relevant details you see.
             Focus on elements that might be relevant to Fiqh Al-Muamalat (Islamic commercial law).`
                    );
                    enhancedQuery = `${query}\n\n[Image Analysis Context: ${imageDescription}]`;
                    updateStep(imageAnalysisStepId, {
                        status: 'completed',
                        result: 'Image analyzed successfully',
                        details: `Extracted context: ${imageDescription.slice(0, 150)}...`,
                        endTime: Date.now(),
                    });
                } catch (error) {
                    updateStep(imageAnalysisStepId, {
                        status: 'error',
                        result: `Image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        endTime: Date.now(),
                    });
                }
            }
        }

        // Generate embedding for the query
        let queryEmbedding: number[];
        try {
            queryEmbedding = await openai.createEmbedding(enhancedQuery);
            updateStep(analyzeStepId, {
                status: 'completed',
                result: 'Query understood and embedding generated',
                details: `Embedding dimension: 1536 | Model: text-embedding-3-large`,
                endTime: Date.now(),
            });
        } catch (error) {
            updateStep(analyzeStepId, {
                status: 'error',
                result: `Failed to process query: ${error instanceof Error ? error.message : 'Unknown error'}`,
                endTime: Date.now(),
            });
            throw error;
        }

        // Step 2: Parallel search across all knowledge sources
        const searchResults = new Map<string, VectorSearchResult[]>();

        for (const [sourceId, config] of Object.entries(VECTOR_DBS)) {
            // Generate agent name from source (e.g., "BNM Shariah Resolutions" -> "BNM-Resolutions")
            const agentName = config.name.replace(/\s+/g, '-').replace(/(Shariah-|Q&A)/gi, '');
            const searchStepId = this.generateStepId();
            steps.push({
                id: searchStepId,
                agent: agentName,
                action: `Searching knowledge base...`,
                details: `Source: ${config.name} | Threshold: ${(RELEVANCE_THRESHOLD * 100).toFixed(0)}%`,
                status: 'running',
                startTime: Date.now(),
            });
            onStepUpdate?.(steps);

            try {
                // Perform vector search using RPC or direct query
                const results = await this.searchVectorDB(config.table, queryEmbedding, 5, RELEVANCE_THRESHOLD);

                if (results.length > 0) {
                    searchResults.set(sourceId, results);

                    // Build detailed result info
                    const topPassages = results.slice(0, 3).map((r, i) =>
                        `  [${i + 1}] ${(r.similarity * 100).toFixed(1)}% - "${r.content.slice(0, 80)}..."`
                    ).join('\n');

                    // Convert to citations
                    results.forEach((result, idx) => {
                        allCitations.push({
                            id: `${sourceId}_${idx}`,
                            sourceId,
                            sourceName: config.name,
                            title: result.metadata?.title || result.metadata?.document_title || config.name,
                            page: result.metadata?.page,
                            url: result.metadata?.url,
                            content: result.content,
                            similarity: result.similarity,
                        });
                    });

                    updateStep(searchStepId, {
                        status: 'completed',
                        result: `Found ${results.length} passages (best: ${(results[0].similarity * 100).toFixed(0)}%)`,
                        details: `Top matches from ${config.name}:\n${topPassages}`,
                        endTime: Date.now(),
                    });
                } else {
                    updateStep(searchStepId, {
                        status: 'skipped',
                        result: `No content above ${(RELEVANCE_THRESHOLD * 100).toFixed(0)}% threshold`,
                        details: `Source had no semantically similar passages for this query`,
                        endTime: Date.now(),
                    });
                }
            } catch (error) {
                updateStep(searchStepId, {
                    status: 'error',
                    result: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    endTime: Date.now(),
                });
            }
        }
        // Step 3: Context Curation (internal, no visible step)
        // Sort citations by priority and similarity
        const sortedCitations = allCitations.sort((a, b) => {
            const priorityDiff = (SOURCE_PRIORITY[b.sourceId] || 0) - (SOURCE_PRIORITY[a.sourceId] || 0);
            if (priorityDiff !== 0) return priorityDiff;
            return b.similarity - a.similarity;
        });

        // Build context for synthesis
        const contextParts = sortedCitations.slice(0, 10).map((citation, idx) => {
            return `[Source ${idx + 1}: ${citation.sourceName}${citation.page ? `, Page ${citation.page}` : ''}]\n${citation.content}`;
        });

        const curatedInfo = sortedCitations.slice(0, 5).map((c, i) =>
            `  [${i + 1}] ${c.sourceName} (${(c.similarity * 100).toFixed(0)}%)`
        ).join('\n');

        // Step 4: Answer Composition
        const synthesisStepId = this.generateStepId();
        steps.push({
            id: synthesisStepId,
            agent: 'Answer-Composer',
            action: `Composing expert response with citations...`,
            details: `Model: ${SYNTHESIS_MODEL} | Sources: ${searchResults.size} | Passages: ${sortedCitations.length}`,
            status: 'running',
            startTime: Date.now(),
        });
        onStepUpdate?.(steps);

        const synthesisPrompt = this.buildSynthesisPrompt(query, contextParts, sortedCitations);

        let finalAnswer: string;
        try {
            const messages: OpenAIChatMessage[] = [
                {
                    role: 'system',
                    content: `You are an expert Islamic Finance Consultant (Mufti/Scholar) specializing in Fiqh Al-Muamalat and Shariah compliance in Malaysia.

IMPORTANT GUIDELINES:
1. Base your answers ONLY on the provided source materials
2. Always cite sources using [1], [2], etc. notation inline with your answer
3. If sources conflict, prioritize BNM Shariah Resolutions > Islamic Financial Act > BNM Contract Framework > Mufti Q&A
4. Be precise, authoritative, yet accessible
5. If the sources don't contain enough information to answer, clearly state this
6. Structure your response with clear sections when appropriate
7. Use both English and Malay terms where relevant (e.g., "Riba (interest)")
8. Format your response with proper markdown: use ## for sections, **bold** for emphasis, and bullet points for lists.
9. When creating tables, YOU MUST use valid Markdown table syntax with a header row AND a separator row (e.g. |---|---|). Do not use pseudo-tables with just pipes.`,
                },
                {
                    role: 'user',
                    content: synthesisPrompt,
                },
            ];

            const response = await openai.chatCompletion(messages, {
                model: SYNTHESIS_MODEL,
                temperature: 0.3,
                maxTokens: 2048,
            });

            finalAnswer = response.choices[0].message.content;

            const tokenInfo = response.usage
                ? `Tokens: ${response.usage.prompt_tokens} in / ${response.usage.completion_tokens} out`
                : 'Token usage not available';

            updateStep(synthesisStepId, {
                status: 'completed',
                result: 'Answer synthesized successfully',
                details: `Model: ${SYNTHESIS_MODEL} | ${tokenInfo}`,
                endTime: Date.now(),
            });
        } catch (error) {
            updateStep(synthesisStepId, {
                status: 'error',
                result: `Synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                endTime: Date.now(),
            });
            finalAnswer = "I apologize, but I encountered an error while synthesizing the answer. Please try again.";
        }

        const endTime = Date.now();

        return {
            answer: finalAnswer,
            citations: sortedCitations.slice(0, 10),
            steps,
            metadata: {
                totalSources: searchResults.size,
                processingTime: endTime - startTime,
                confidenceScore: this.calculateConfidenceScore(sortedCitations),
                model: SYNTHESIS_MODEL,
            },
        };
    }

    private async searchVectorDB(
        table: string,
        embedding: number[],
        limit: number,
        threshold: number
    ): Promise<VectorSearchResult[]> {
        // Using Supabase RPC function for vector similarity search
        // Debug: Hardcoding credentials temporarily to rule out env var loading issues
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wndnznopltyrbiujyhgh.supabase.co';
        const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZG56bm9wbHR5cmJpdWp5aGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzcxNTgsImV4cCI6MjA4NDQ1MzE1OH0.ocAATpsiSFyrX8zJZUlFFXWVuZk_5x220kf-8ixXp5o';

        console.log(`[VectorDB] ENV Check - VITE_SUPABASE_URL: ${SUPABASE_URL ? 'SET' : 'NOT SET'}`);
        console.log(`[VectorDB] ENV Check - VITE_SUPABASE_ANON_KEY: ${SUPABASE_KEY ? 'SET' : 'NOT SET'}`);

        if (!SUPABASE_URL || !SUPABASE_KEY) {
            console.error('[VectorDB] ERROR: Supabase credentials not found in environment variables!');
            console.error('[VectorDB] Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env file');
            return [];
        }

        console.log(`[VectorDB] Searching ${table} with threshold ${threshold}, embedding length: ${embedding.length}`);

        try {
            // First, try with a very low threshold to see what similarities we get
            const debugResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_${table}`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query_embedding: embedding,
                    match_count: 3,
                    match_threshold: 0.0, // Get ANY results to see actual scores
                }),
            });

            if (debugResponse.ok) {
                const debugData = await debugResponse.json();
                console.log(`[VectorDB] ${table} - Raw results (no threshold):`, debugData.length, 'items');
                if (debugData.length > 0) {
                    console.log(`[VectorDB] ${table} - Top similarities:`, debugData.map((d: any) => ({
                        similarity: d.similarity?.toFixed(4),
                        preview: d.content?.substring(0, 80)
                    })));
                }
            } else {
                const errorText = await debugResponse.text();
                console.error(`[VectorDB] ${table} - Debug query failed:`, debugResponse.status, errorText);
            }

            // Now do the actual search with threshold
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_${table}`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query_embedding: embedding,
                    match_count: limit,
                    match_threshold: threshold,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[VectorDB] ${table} - RPC failed:`, response.status, errorText);
                // Fallback: try direct table query with ordering (less accurate but works)
                console.warn(`RPC function match_${table} not found, using fallback`);
                return this.fallbackSearch(table, limit);
            }

            const data = await response.json();
            console.log(`[VectorDB] ${table} - Filtered results (threshold ${threshold}):`, data.length, 'items');

            return data.map((item: any) => ({
                id: item.id,
                content: item.content,
                metadata: item.metadata || {},
                similarity: item.similarity || 0.5,
            }));
        } catch (error) {
            console.error(`[VectorDB] ${table} - Error:`, error);
            return this.fallbackSearch(table, limit);
        }
    }

    private async fallbackSearch(table: string, limit: number): Promise<VectorSearchResult[]> {
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wndnznopltyrbiujyhgh.supabase.co';
        const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZG56bm9wbHR5cmJpdWp5aGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzcxNTgsImV4cCI6MjA4NDQ1MzE1OH0.ocAATpsiSFyrX8zJZUlFFXWVuZk_5x220kf-8ixXp5o';

        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id,content,metadata&limit=${limit}`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
        });

        if (!response.ok) return [];

        const data = await response.json();
        return data.map((item: any) => ({
            id: item.id,
            content: item.content,
            metadata: item.metadata || {},
            similarity: 0.5, // Default similarity for fallback
        }));
    }

    private buildSynthesisPrompt(query: string, contextParts: string[], citations: Citation[]): string {
        return `QUESTION: ${query}

AUTHORITATIVE SOURCES:
${contextParts.join('\n\n---\n\n')}

Based on the above authoritative Islamic finance sources, please provide a comprehensive answer to the question. 
Remember to:
1. Cite sources inline using [1], [2], etc.
2. Be precise and authoritative
3. Explain any relevant Shariah principles
4. Note if there are any conditions or exceptions
5. Use proper markdown formatting for readability
6. If using tables, ENSURE you include the header separator row (e.g. |---|---|)`;
    }

    private calculateConfidenceScore(citations: Citation[]): number {
        if (citations.length === 0) return 0;

        // Weighted average based on similarity and source priority
        let totalWeight = 0;
        let weightedSum = 0;

        citations.slice(0, 5).forEach(citation => {
            const priority = SOURCE_PRIORITY[citation.sourceId] || 50;
            const weight = priority / 100;
            weightedSum += citation.similarity * weight;
            totalWeight += weight;
        });

        return totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
    }
}

export const agentService = new AgentService();
