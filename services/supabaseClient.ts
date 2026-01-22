// Supabase client for vector search and database operations
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface VectorSearchResult {
    id: string;
    content: string;
    metadata: {
        page?: number;
        title?: string;
        file_name?: string;
        source_id?: string;
        url?: string;
        section_header?: string;
        [key: string]: any;
    };
    similarity: number;
}

export interface Citation {
    id: string;
    sourceId: string;
    sourceName: string;
    title: string;
    page?: number;
    url?: string;
    content: string;
    similarity: number;
}

// Vector database configuration
export const VECTOR_DBS = {
    'VDB-01': { table: 'bnm_resolutions', name: 'BNM Shariah Resolutions', description: 'Kompilasi Keputusan Syariah Dalam Kewangan Islam' },
    'VDB-02': { table: 'islamic_financial_act', name: 'Islamic Financial Act', description: 'Bank Negara Islamic Financial Act Documents' },
    'VDB-03': { table: 'shariah_contract_framework', name: 'BNM Shariah Contract Framework', description: 'Official Shariah contract standards and structures' },
    'VDB-04': { table: 'mufti_qa', name: 'Mufti Q&A', description: 'Muamalat Q&A from Mufti offices' },
};

class SupabaseClient {
    private url: string;
    private key: string;

    constructor() {
        this.url = SUPABASE_URL;
        this.key = SUPABASE_ANON_KEY;
    }

    private async fetch(endpoint: string, options: RequestInit = {}) {
        const response = await fetch(`${this.url}${endpoint}`, {
            ...options,
            headers: {
                'apikey': this.key,
                'Authorization': `Bearer ${this.key}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Supabase error: ${error}`);
        }

        return response.json();
    }

    // Perform vector similarity search on a specific table
    async vectorSearch(
        table: string,
        queryEmbedding: number[],
        limit: number = 5,
        threshold: number = 0.3
    ): Promise<VectorSearchResult[]> {
        // Use RPC function for vector search
        const results = await this.fetch('/rest/v1/rpc/match_documents', {
            method: 'POST',
            body: JSON.stringify({
                query_embedding: queryEmbedding,
                table_name: table,
                match_count: limit,
                match_threshold: threshold,
            }),
        });

        return results || [];
    }

    // Search across all vector databases
    async searchAllDatabases(
        queryEmbedding: number[],
        limit: number = 3,
        threshold: number = 0.3
    ): Promise<Map<string, VectorSearchResult[]>> {
        const results = new Map<string, VectorSearchResult[]>();

        const searchPromises = Object.entries(VECTOR_DBS).map(async ([sourceId, config]) => {
            try {
                const dbResults = await this.vectorSearch(config.table, queryEmbedding, limit, threshold);
                return { sourceId, results: dbResults };
            } catch (error) {
                console.warn(`Search failed for ${sourceId}:`, error);
                return { sourceId, results: [] };
            }
        });

        const allResults = await Promise.all(searchPromises);
        allResults.forEach(({ sourceId, results: dbResults }) => {
            results.set(sourceId, dbResults);
        });

        return results;
    }

    // Direct SQL query for simpler searches (fallback)
    async query(table: string, select: string = '*', filters?: Record<string, any>) {
        let endpoint = `/rest/v1/${table}?select=${encodeURIComponent(select)}`;

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                endpoint += `&${key}=eq.${encodeURIComponent(value)}`;
            });
        }

        return this.fetch(endpoint);
    }
}

export const supabase = new SupabaseClient();
