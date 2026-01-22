export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface ShariahIssue {
  type: 'Riba' | 'Gharar' | 'Maisir' | 'Haram Industry' | 'Other';
  severity: 'High' | 'Medium' | 'Low';
  location?: string;
  description: string;
  evidence?: string;
  shariah_principle?: string;
  suggested_fix?: string;
}

export interface CompliantElement {
  aspect: string;
  explanation: string;
}

export interface AnalysisData {
  score: number;
  risk: 'Low' | 'Medium' | 'High';
  summary: string;
  key_points: string[];
  // Enhanced Shariah compliance fields (optional for backward compatibility)
  issues_detected?: ShariahIssue[];
  compliant_elements?: CompliantElement[];
  shariah_verdict?: string;
  suitable_structures?: string[];
  // Multi-agent analysis fields (optional)
  analysis_type?: 'single-agent' | 'multi-agent';
  multi_agent_data?: MultiAgentAnalysisData;
}

// Multi-Agent Analysis Types
export interface AgentFinding {
  finding: string;
  severity: 'High' | 'Medium' | 'Low';
  evidence?: string;
  reference?: string;
}

export interface AgentIssue {
  type: 'Riba' | 'Gharar' | 'Maisir' | 'Regulatory' | 'Governance' | 'Ethical' | 'Other';
  description: string;
  location?: string;
  suggested_fix?: string;
}

export interface AgentAnalysis {
  agent_name: 'IFSA' | 'Shariah_Resolutions' | 'Mufti';
  compliance_status: 'Compliant' | 'Partially Compliant' | 'Non-Compliant';
  confidence_score: number;
  key_findings: AgentFinding[];
  issues_detected: AgentIssue[];
  compliant_aspects: string[];
  recommendations: string[];
  summary: string;
}

export interface MultiAgentVerdict {
  status: 'Compliant' | 'Partially Compliant' | 'Non-Compliant';
  confidence: number;
  risk_level: 'Low' | 'Medium' | 'High';
  summary: string;
}

export interface ConsensusAnalysis {
  level: 'All agents agree' | 'Majority agree' | 'Split opinion';
  agreement_areas: string[];
  disagreement_areas: string[];
  resolution?: string;
}

export interface ConsolidatedIssue {
  issue_type: 'Riba' | 'Gharar' | 'Maisir' | 'Regulatory' | 'Governance' | 'Ethical' | 'Other';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  detected_by: string[];
  description: string;
  evidence?: string;
  shariah_basis?: string;
  suggested_fix?: string;
  compliant_alternative?: string;
}

export interface MultiAgentStrength {
  aspect: string;
  validated_by: string[];
  explanation: string;
}

export interface MultiAgentRecommendation {
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  action: string;
  impact?: string;
  responsible_party?: string;
}

export interface SuitableStructure {
  structure: 'Murabaha' | 'Musharakah' | 'Mudarabah' | 'Ijarah' | 'Wakalah' | 'Sukuk' | 'Other';
  applicability: string;
  conversion_steps?: string[];
}

export interface MultiAgentAnalysisData {
  overall_verdict: MultiAgentVerdict;
  consensus_analysis: ConsensusAnalysis;
  agent_analyses: {
    ifsa: AgentAnalysis;
    shariah_resolutions: AgentAnalysis;
    mufti: AgentAnalysis;
  };
  consolidated_issues: ConsolidatedIssue[];
  strengths: MultiAgentStrength[];
  recommendations: MultiAgentRecommendation[];
  final_shariah_verdict: string;
  suitable_islamic_structures: SuitableStructure[];
  next_steps: string[];
  processing_time_seconds: number;
  agents_consulted: string[];
}

export interface DocumentFile {
  id: string;
  name: string;
  type: string;
  uploadDate: Date;
  status: 'analyzing' | 'completed' | 'error' | 'pending';
  summary?: string;
  complianceStatus?: 'compliant' | 'non-compliant' | 'warning';
  analysisData?: AnalysisData;
}

export enum AppRoute {
  LANDING = '/',
  DASHBOARD = '/dashboard',
  CHAT = '/dashboard/chat',
  DOCUMENTS = '/dashboard/documents',
  CONSULTANT = '/dashboard/consultant',
  CREDITS = '/dashboard/credits',
  PROFILE = '/dashboard/profile',
}

export interface NavItem {
  label: string;
  icon: any;
  route: AppRoute;
}