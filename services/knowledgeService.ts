import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface KnowledgeContext {
    source: string;
    content: string;
    metadata?: any;
}

/**
 * Fetches relevant knowledge context based on user's query intent
 * This is used to prime the session with relevant Islamic Finance knowledge
 */
export async function fetchRelevantContext(query: string, limit: number = 5): Promise<KnowledgeContext[]> {
    try {
        // Generate embedding for the query using OpenAI
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'text-embedding-3-small',
                input: query
            })
        });

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        // Search across all knowledge bases
        const [bnmResults, actResults, contractResults, muftiqaResults] = await Promise.all([
            supabase.rpc('match_bnm_resolutions', {
                query_embedding: embedding,
                match_threshold: 0.7,
                match_count: limit
            }),
            supabase.rpc('match_islamic_financial_act', {
                query_embedding: embedding,
                match_threshold: 0.7,
                match_count: limit
            }),
            supabase.rpc('match_shariah_contract_framework', {
                query_embedding: embedding,
                match_threshold: 0.7,
                match_count: limit
            }),
            supabase.rpc('match_mufti_qa', {
                query_embedding: embedding,
                match_threshold: 0.7,
                match_count: limit
            })
        ]);

        const contexts: KnowledgeContext[] = [];

        // Combine results from all sources
        if (bnmResults.data) {
            contexts.push(...bnmResults.data.map((item: any) => ({
                source: 'BNM Resolutions',
                content: item.content,
                metadata: item.metadata
            })));
        }

        if (actResults.data) {
            contexts.push(...actResults.data.map((item: any) => ({
                source: 'Islamic Financial Services Act 2013',
                content: item.content,
                metadata: item.metadata
            })));
        }

        if (contractResults.data) {
            contexts.push(...contractResults.data.map((item: any) => ({
                source: 'Shariah Contract Framework',
                content: item.content,
                metadata: item.metadata
            })));
        }

        if (muftiqaResults.data) {
            contexts.push(...muftiqaResults.data.map((item: any) => ({
                source: 'Mufti Q&A',
                content: item.content,
                metadata: item.metadata
            })));
        }

        // Sort by relevance and return top results
        return contexts.slice(0, limit);
    } catch (error) {
        console.error('Error fetching context:', error);
        return [];
    }
}

/**
 * Generates a system instruction with relevant knowledge context
 */
export function generateSystemInstruction(contexts: KnowledgeContext[]): string {
    const baseInstruction = `You are an AI Shariah Consultant specializing in Malaysian Islamic Finance.
Speak professionally and concisely (3-5 sentences).
Use precise Islamic finance terminology but remain accessible.
If interrupted, stop speaking immediately.
Base your answers on the provided knowledge context (BNM, IFSA, Fatwas).`;

    if (contexts.length > 0) {
        const contextSection = contexts.map((ctx, idx) =>
            `[${idx + 1}] ${ctx.source}:\n${ctx.content.substring(0, 500)}...`
        ).join('\n\n');

        return baseInstruction + `\nRELEVANT CONTEXT FOR THIS SESSION:\n${contextSection}\n\nUse this context to provide accurate, grounded answers. If asked about topics outside this context, politely acknowledge the limitation and provide general Islamic Finance principles.`;
    }

    return baseInstruction + '\n\nProvide general Islamic Finance guidance based on established Shariah principles.';
}
