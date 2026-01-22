/**
 * Shariah Compliance Keyword Detection Utility
 * Used for pre-scanning documents before AI analysis
 */

// Riba (Interest/Usury) Keywords
export const RIBA_KEYWORDS = [
    'interest', 'interest rate', 'apr', 'annual percentage rate',
    'compound interest', 'simple interest', 'late fee', 'penalty interest',
    'usury', 'riba', 'fixed return', 'guaranteed return', 'fixed profit',
    'guaranteed profit', 'late payment charge', 'overdue interest',
    'accrued interest', 'interest bearing', 'interest-bearing'
];

// Gharar (Excessive Uncertainty) Keywords
export const GHARAR_KEYWORDS = [
    'subject to change', 'tbd', 'to be determined', 'uncertain',
    'ambiguous', 'unclear', 'unspecified', 'may vary', 'at our discretion',
    'without notice', 'approximate', 'estimated', 'tentative',
    'subject to availability', 'conditions may apply', 'terms may change'
];

// Maisir (Gambling/Speculation) Keywords
export const MAISIR_KEYWORDS = [
    'lottery', 'gambling', 'bet', 'wager', 'speculative',
    'chance-based', 'random', 'jackpot', 'casino', 'lucky draw',
    'raffle', 'sweepstakes', 'speculation', 'derivative', 'futures contract'
];

// Haram Industries Keywords
export const HARAM_INDUSTRY_KEYWORDS = [
    // Alcohol
    'alcohol', 'liquor', 'wine', 'beer', 'spirits', 'brewery', 'distillery',
    // Pork
    'pork', 'pig', 'bacon', 'ham', 'swine',
    // Tobacco
    'tobacco', 'cigarette', 'cigar', 'vaping', 'nicotine',
    // Gambling
    'casino', 'betting', 'bookmaker',
    // Conventional Banking
    'conventional bank', 'interest-based banking', 'usurious',
    // Adult Entertainment
    'adult entertainment', 'pornography', 'nightclub',
    // Weapons
    'weapons manufacturing', 'arms dealer', 'munitions'
];

// Shariah-Compliant Structure Keywords (Positive indicators)
export const COMPLIANT_STRUCTURE_KEYWORDS = [
    // Murabaha
    'murabaha', 'murabahah', 'cost-plus', 'markup financing',
    // Musharakah
    'musharakah', 'musyarakah', 'partnership', 'joint venture', 'profit-loss sharing',
    // Mudarabah
    'mudarabah', 'mudharabah', 'profit sharing', 'silent partnership',
    // Ijarah
    'ijarah', 'ijara', 'leasing', 'rental agreement', 'lease-to-own',
    // Wakalah
    'wakalah', 'wakala', 'agency', 'agent agreement',
    // Sukuk
    'sukuk', 'islamic bond',
    // General
    'shariah compliant', 'sharia compliant', 'islamic finance', 'halal financing',
    'asset-backed', 'profit and loss sharing', 'equity participation'
];

export interface RedFlagResult {
    ribaDetected: boolean;
    ribaMatches: string[];
    ghararDetected: boolean;
    ghararMatches: string[];
    maisirDetected: boolean;
    maisirMatches: string[];
    haramIndustryDetected: boolean;
    haramMatches: string[];
    compliantStructuresDetected: boolean;
    compliantMatches: string[];
}

/**
 * Scans text for Shariah compliance red flags and compliant structures
 * @param text - Document text to analyze
 * @returns Object containing detection results
 */
export function detectRedFlags(text: string): RedFlagResult {
    const textLower = text.toLowerCase();

    const findMatches = (keywords: string[]): string[] => {
        return keywords.filter(keyword => textLower.includes(keyword.toLowerCase()));
    };

    const ribaMatches = findMatches(RIBA_KEYWORDS);
    const ghararMatches = findMatches(GHARAR_KEYWORDS);
    const maisirMatches = findMatches(MAISIR_KEYWORDS);
    const haramMatches = findMatches(HARAM_INDUSTRY_KEYWORDS);
    const compliantMatches = findMatches(COMPLIANT_STRUCTURE_KEYWORDS);

    return {
        ribaDetected: ribaMatches.length > 0,
        ribaMatches,
        ghararDetected: ghararMatches.length > 0,
        ghararMatches,
        maisirDetected: maisirMatches.length > 0,
        maisirMatches,
        haramIndustryDetected: haramMatches.length > 0,
        haramMatches,
        compliantStructuresDetected: compliantMatches.length > 0,
        compliantMatches
    };
}

/**
 * Generates a summary of red flags for AI prompt context
 */
export function getRedFlagSummary(result: RedFlagResult): string {
    const flags: string[] = [];

    if (result.ribaDetected) {
        flags.push(`RIBA indicators found: ${result.ribaMatches.join(', ')}`);
    }
    if (result.ghararDetected) {
        flags.push(`GHARAR indicators found: ${result.ghararMatches.join(', ')}`);
    }
    if (result.maisirDetected) {
        flags.push(`MAISIR indicators found: ${result.maisirMatches.join(', ')}`);
    }
    if (result.haramIndustryDetected) {
        flags.push(`HARAM INDUSTRY indicators found: ${result.haramMatches.join(', ')}`);
    }
    if (result.compliantStructuresDetected) {
        flags.push(`COMPLIANT STRUCTURES found: ${result.compliantMatches.join(', ')}`);
    }

    if (flags.length === 0) {
        return 'No obvious red flags or compliant structures detected in keyword scan.';
    }

    return 'PRELIMINARY KEYWORD SCAN:\n' + flags.join('\n');
}
