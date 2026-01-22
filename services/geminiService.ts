import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { AnalysisData, ShariahIssue, CompliantElement } from "../types";
import { detectRedFlags, getRedFlagSummary } from "./shariahKeywords";
import { analyzeDocumentMultiAgent } from "./multiAgentService";

// Initialize the API client
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

// System instruction for Islamic finance expertise
const SHARIAH_EXPERT_INSTRUCTION = `You are an Islamic Finance Consultant specializing in Shariah compliance analysis.
You help identify Riba (interest), Gharar (uncertainty), and Maisir (gambling) in business documents.
Suggest Shariah-compliant alternatives like Murabaha, Musharakah, or Ijarah when issues are found.
Be concise and practical in your responses.`;

export const createChatSession = (): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SHARIAH_EXPERT_INSTRUCTION,
    },
  });
};

/**
 * Extract text from document using Gemini's multimodal capability
 */
async function extractDocumentText(fileBase64: string, mimeType: string): Promise<string> {
  console.log("[Shariah Analyzer] Extracting text from document...");

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: fileBase64,
            },
          },
          {
            text: `Extract ALL text content from this document. 
            
Preserve the structure including:
- Headings and section titles
- Clauses and numbered items
- Any financial terms, percentages, or amounts
- All legal/contractual language

Return the extracted text as plain text. Do not analyze it, just extract it.`
          },
        ],
      },
    });

    const extractedText = response.text || "";
    console.log(`[Shariah Analyzer] Extracted ${extractedText.length} characters`);
    return extractedText;

  } catch (error) {
    console.warn("[Shariah Analyzer] Text extraction failed, using placeholder:", error);
    return "[Document content could not be extracted. Proceeding with visual analysis.]";
  }
}

/**
 * Creates the comprehensive analysis prompt for Shariah compliance
 */
function createAnalysisPrompt(documentText: string, redFlagContext: string): string {
  return `Analyze this financial/business document for Shariah compliance.

DOCUMENT CONTENT:
${documentText}

${redFlagContext}

ANALYSIS REQUIREMENTS:

1. IDENTIFY VIOLATIONS - Check for:
   - Riba (interest, fixed returns, late penalties with interest, compound interest)
   - Gharar (excessive uncertainty, ambiguous terms, unclear pricing)
   - Maisir (gambling, speculation, chance-based mechanisms)
   - Haram Industries (alcohol, pork, tobacco, conventional banking, gambling, weapons)

2. IDENTIFY COMPLIANT ELEMENTS - Look for:
   - Profit-loss sharing mechanisms
   - Asset-backed structures
   - Clear ownership and risk allocation
   - Shariah-compliant contracts (Murabaha, Musharakah, Mudarabah, Ijarah, Wakalah)

3. DETERMINE COMPLIANCE STATUS:
   - Score: 0-100 (100 = fully compliant, 0 = major violations)
   - Risk Level: "Low" (score > 80), "Medium" (50-80), "High" (< 50)

4. PROVIDE RECOMMENDATIONS:
   - What needs to change?
   - Suggest specific Islamic finance structures as alternatives

Return your analysis in this EXACT JSON format (no markdown code blocks):
{
  "score": <number 0-100>,
  "risk": "Low" | "Medium" | "High",
  "summary": "<executive summary in 2-3 sentences>",
  "key_points": ["<specific finding 1>", "<specific finding 2>", "..."],
  "issues_detected": [
    {
      "type": "Riba" | "Gharar" | "Maisir" | "Haram Industry" | "Other",
      "severity": "High" | "Medium" | "Low",
      "location": "<section/clause if identifiable>",
      "description": "<what the issue is>",
      "evidence": "<exact quote or reference from document>",
      "shariah_principle": "<relevant Shariah principle, e.g., Quran 2:275>",
      "suggested_fix": "<how to make it compliant>"
    }
  ],
  "compliant_elements": [
    {
      "aspect": "<compliant aspect identified>",
      "explanation": "<why this is Shariah-compliant>"
    }
  ],
  "shariah_verdict": "<overall verdict: what needs to change and recommended structure>",
  "suitable_structures": ["<recommended Islamic finance structures>"]
}

IMPORTANT:
- Be specific - quote exact problematic clauses when possible
- For each issue, explain WHY it violates Shariah principles
- Always suggest practical Shariah-compliant alternatives
- If document is compliant, still provide positive findings in compliant_elements`;
}

/**
 * Parses JSON from Gemini response, handling markdown code blocks
 */
function parseGeminiJson(responseText: string): any {
  // Remove markdown code blocks if present
  let cleanText = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    return JSON.parse(cleanText);
  } catch (e) {
    // Try to extract JSON object from text
    const match = cleanText.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("Could not parse JSON from Gemini response");
  }
}

/**
 * Generates key_points from structured issues for backward compatibility
 */
function generateKeyPoints(issues: ShariahIssue[], compliantElements: CompliantElement[]): string[] {
  const points: string[] = [];

  // Add issues as key points
  issues.forEach(issue => {
    const severity = issue.severity === 'High' ? '🔴' : issue.severity === 'Medium' ? '🟡' : '🟢';
    let point = `${severity} ${issue.type}: ${issue.description}`;
    if (issue.location) {
      point = `${severity} ${issue.location} - ${issue.type}: ${issue.description}`;
    }
    points.push(point);
  });

  // Add compliant elements
  compliantElements.forEach(element => {
    points.push(`✅ ${element.aspect}: ${element.explanation}`);
  });

  return points.length > 0 ? points : ["Analysis complete - see summary for details"];
}

/**
 * Main document analysis function
 * Uses multi-agent analysis by default for comprehensive Shariah review
 */
export const analyzeDocument = async (fileBase64: string, mimeType: string): Promise<AnalysisData> => {
  try {
    console.log("[Shariah Analyzer] Starting MULTI-AGENT document analysis...");
    const startTime = Date.now();

    // Step 1: Extract text from document
    const extractedText = await extractDocumentText(fileBase64, mimeType);

    // Step 2: Create document summary for agents
    const documentSummary = extractedText.slice(0, 500);

    // Step 3: Run multi-agent analysis (3 specialists + Gemini aggregator)
    try {
      const multiAgentResult = await analyzeDocumentMultiAgent(extractedText, documentSummary);

      console.log(`[Shariah Analyzer] Multi-agent analysis complete in ${(Date.now() - startTime) / 1000}s`);
      return multiAgentResult;

    } catch (multiAgentError) {
      console.warn("[Shariah Analyzer] Multi-agent failed, falling back to single-agent:", multiAgentError);

      // Fallback to single-agent Gemini analysis
      return await analyzeSingleAgent(fileBase64, mimeType);
    }

  } catch (error) {
    console.error("[Shariah Analyzer] Analysis failed:", error);
    throw error;
  }
};

/**
 * Single-agent fallback analysis using Gemini directly
 */
async function analyzeSingleAgent(fileBase64: string, mimeType: string): Promise<AnalysisData> {
  console.log("[Shariah Analyzer] Running single-agent fallback analysis...");

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: fileBase64,
          },
        },
        {
          text: createAnalysisPrompt(
            "[Document uploaded as file - analyze the content visible in the document]",
            "Perform comprehensive Shariah compliance analysis on this document."
          ),
        },
      ],
    },
    config: {
      systemInstruction: SHARIAH_EXPERT_INSTRUCTION,
    }
  });

  const text = response.text || "";
  console.log("[Shariah Analyzer] Received response, parsing...");

  try {
    const data = parseGeminiJson(text);

    // Ensure backward compatibility - generate key_points if not provided
    if (!data.key_points || data.key_points.length === 0) {
      data.key_points = generateKeyPoints(
        data.issues_detected || [],
        data.compliant_elements || []
      );
    }

    // Validate required fields
    const result: AnalysisData = {
      score: typeof data.score === 'number' ? data.score : 50,
      risk: ['Low', 'Medium', 'High'].includes(data.risk) ? data.risk : 'Medium',
      summary: data.summary || "Analysis complete. Please review the detailed findings.",
      key_points: Array.isArray(data.key_points) ? data.key_points : [],
      issues_detected: data.issues_detected || [],
      compliant_elements: data.compliant_elements || [],
      shariah_verdict: data.shariah_verdict || "",
      suitable_structures: data.suitable_structures || [],
      analysis_type: 'single-agent'
    };

    console.log("[Shariah Analyzer] Single-agent analysis complete. Score:", result.score);
    return result;

  } catch (parseError) {
    console.warn("[Shariah Analyzer] Failed to parse structured JSON, using fallback", parseError);

    // Fallback: extract meaningful content from text response
    return {
      score: 50,
      risk: 'Medium',
      summary: text.slice(0, 500) + (text.length > 500 ? "..." : ""),
      key_points: [
        "Could not parse structured analysis",
        "Raw analysis has been included in summary",
        "Manual review recommended"
      ],
      analysis_type: 'single-agent'
    };
  }
}