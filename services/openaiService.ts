// OpenAI service for embeddings and chat completions
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export interface EmbeddingResponse {
    embedding: number[];
    usage: {
        prompt_tokens: number;
        total_tokens: number;
    };
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | ContentPart[];
}

export interface ContentPart {
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
        url: string;
        detail?: 'low' | 'high' | 'auto';
    };
}

export interface ChatCompletionResponse {
    id: string;
    choices: {
        index: number;
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

class OpenAIService {
    private apiKey: string;
    private baseUrl: string = 'https://api.openai.com/v1';

    constructor() {
        this.apiKey = OPENAI_API_KEY || '';
    }

    private async fetch(endpoint: string, options: RequestInit = {}) {
        if (!this.apiKey) {
            throw new Error('OpenAI API key is not configured');
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OpenAI error: ${error.error?.message || 'Unknown error'}`);
        }

        return response.json();
    }

    // Generate embeddings for text using text-embedding-3-large
    async createEmbedding(text: string): Promise<number[]> {
        console.log(`[OpenAI] Creating embedding for text: "${text.substring(0, 100)}..."`);
        console.log(`[OpenAI] Using model: text-embedding-3-large, dimensions: 1536`);

        const response = await this.fetch('/embeddings', {
            method: 'POST',
            body: JSON.stringify({
                model: 'text-embedding-3-large',
                input: text,
                dimensions: 1536, // Using 1536 dims to match our vector DB
            }),
        });

        const embedding = response.data[0].embedding;
        console.log(`[OpenAI] Embedding generated, length: ${embedding.length}, first 5 values: [${embedding.slice(0, 5).map((v: number) => v.toFixed(4)).join(', ')}...]`);

        return embedding;
    }

    // Chat completion with optional images for multimodal support
    async chatCompletion(
        messages: ChatMessage[],
        options: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            stream?: boolean;
            response_format?: { type: 'text' | 'json_object' };
        } = {}
    ): Promise<ChatCompletionResponse> {
        const {
            model = 'gpt-4.1-mini',
            temperature = 0.7,
            maxTokens = 4096,
            response_format,
        } = options;

        const response = await this.fetch('/chat/completions', {
            method: 'POST',
            body: JSON.stringify({
                model,
                messages,
                temperature,
                max_tokens: maxTokens,
                response_format,
            }),
        });

        return response;
    }

    // Analyze image with GPT-4o Vision
    async analyzeImage(
        imageBase64: string,
        mimeType: string,
        prompt: string
    ): Promise<string> {
        const messages: ChatMessage[] = [
            {
                role: 'user',
                content: [
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:${mimeType};base64,${imageBase64}`,
                            detail: 'high',
                        },
                    },
                    {
                        type: 'text',
                        text: prompt,
                    },
                ],
            },
        ];

        const response = await this.chatCompletion(messages, {
            model: 'gpt-4o',
            maxTokens: 2048,
        });

        return response.choices[0].message.content;
    }
}

export const openai = new OpenAIService();
