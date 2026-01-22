import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, XCircle, Loader2, Download, ArrowLeft, Eye, Plus, ShieldAlert, ShieldCheck, ArrowRight, Clock, Activity, Play } from 'lucide-react';
import { analyzeDocumentWithAgents, DocumentAnalysisReport, AgentProgressCallback } from '../services/documentAnalyzerService';
import { exportReportAsPDF, exportReportAsDOCX } from '../services/reportExportService';

interface DocumentAnalyzerProps {
  notificationActive?: boolean;
}

interface AgentStatus {
  name: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  message?: string;
  progress?: number; // 0-100
}

interface UploadedFile {
  file: File;
  base64: string;
  previewUrl: string;
}

interface AnalyzedDocument {
  id: string;
  name: string;
  type: string;
  uploadDate: Date;
  report: DocumentAnalysisReport;
  fileUrl?: string;
}

const DocumentAnalyzer: React.FC<DocumentAnalyzerProps> = ({ notificationActive }) => {
  // State for View Management
  const [viewMode, setViewMode] = useState<'dashboard' | 'workspace'>('dashboard');

  // State for Document Handling
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [activeDoc, setActiveDoc] = useState<AnalyzedDocument | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [highlightedClause, setHighlightedClause] = useState<number | null>(null);

  // Document History
  const [documents, setDocuments] = useState<AnalyzedDocument[]>([]);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (uploadedFile?.previewUrl) {
        URL.revokeObjectURL(uploadedFile.previewUrl);
      }
    };
  }, [uploadedFile]);

  const handleStartAnalysis = () => {
    setActiveDoc(null);
    setUploadedFile(null);
    setViewMode('workspace');
  };

  const handleViewDocument = (doc: AnalyzedDocument) => {
    setActiveDoc(doc);
    setUploadedFile(null);
    setViewMode('workspace');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      console.log('[DocumentAnalyzer] File selected:', file.name, file.type, file.size);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);

      // Convert to base64
      const base64 = await fileToBase64(file);
      console.log('[DocumentAnalyzer] File converted to base64, length:', base64.length);

      // Set uploaded file (but don't analyze yet)
      setUploadedFile({
        file,
        base64,
        previewUrl
      });

      // Clear any previous analysis
      setActiveDoc(null);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) return;

    console.log('[DocumentAnalyzer] Starting analysis...');
    setIsAnalyzing(true);

    // Initialize agent statuses with extraction phase
    setAgentStatuses([
      { name: 'Document Extraction', status: 'analyzing', message: 'Reading document...', progress: 0 },
      { name: 'BNM Shariah Resolutions', status: 'pending' },
      { name: 'Islamic Financial Services Act 2013', status: 'pending' },
      { name: 'BNM Contract Framework', status: 'pending' },
      { name: 'Mufti Fatwas', status: 'pending' },
      { name: 'Final Synthesis', status: 'pending' }
    ]);

    // Simulate extraction progress (since Gemini doesn't provide progress)
    const extractionProgressInterval = setInterval(() => {
      setAgentStatuses(prev => {
        const extractionAgent = prev.find(a => a.name === 'Document Extraction');
        if (extractionAgent && extractionAgent.status === 'analyzing') {
          const currentProgress = extractionAgent.progress || 0;
          if (currentProgress < 90) {
            return prev.map(agent =>
              agent.name === 'Document Extraction'
                ? {
                  ...agent,
                  progress: Math.min(90, currentProgress + Math.random() * 15),
                  message: currentProgress < 30 ? 'Reading document...' :
                    currentProgress < 60 ? 'Extracting text...' :
                      'Processing content...'
                }
                : agent
            );
          }
        }
        return prev;
      });
    }, 800);

    try {
      // Run multi-agent analysis with progress tracking
      const progressCallback: AgentProgressCallback = (agentName, status, message) => {
        console.log(`[DocumentAnalyzer] Agent progress: ${agentName} - ${status} - ${message}`);

        // Clear extraction interval when we move to agents
        if (agentName !== 'System' && agentName !== 'Document Extraction') {
          clearInterval(extractionProgressInterval);
          setAgentStatuses(prev => prev.map(agent =>
            agent.name === 'Document Extraction'
              ? { ...agent, status: 'completed', message: 'Extraction complete', progress: 100 }
              : agent
          ));
        }

        setAgentStatuses(prev => prev.map(agent =>
          agent.name === agentName ? { ...agent, status, message } : agent
        ));
      };

      // Pass file directly to the analysis function
      const report = await analyzeDocumentWithAgents(
        uploadedFile.base64,
        uploadedFile.file.type,
        progressCallback
      );

      clearInterval(extractionProgressInterval);
      console.log('[DocumentAnalyzer] Analysis complete:', report);

      // Create analyzed document
      const analyzedDoc: AnalyzedDocument = {
        id: Date.now().toString(),
        name: uploadedFile.file.name,
        type: uploadedFile.file.type,
        uploadDate: new Date(),
        report,
        fileUrl: uploadedFile.previewUrl
      };

      setActiveDoc(analyzedDoc);
      setDocuments(prev => [analyzedDoc, ...prev]);

    } catch (error) {
      console.error('[DocumentAnalyzer] Analysis failed:', error);
      alert("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const downloadReportPDF = () => {
    if (!activeDoc) return;

    const { report } = activeDoc;
    const element = document.createElement("a");
    const fileContent = `
AL MIZAN - SHARIAH COMPLIANCE AUDIT REPORT
==========================================

Document: ${activeDoc.name}
Analysis Date: ${activeDoc.uploadDate.toLocaleDateString()}
Processing Time: ${report.processing_time_seconds.toFixed(2)}s

COMPLIANCE STATUS: ${report.compliance_status}
Overall Score: ${report.overall_score}/100

EXECUTIVE SUMMARY
-----------------
${report.executive_summary}

PROBLEMATIC CLAUSES
-------------------
${report.problematic_clauses.map((clause, i) => `
${i + 1}. ${clause.exact_text}
   Issue: ${clause.issue_description}
   Severity: ${clause.severity}
   Authority: ${clause.authority_reference}
   Detected by: ${clause.detected_by.join(', ')}
   Recommendation: ${clause.recommendation}
`).join('\n')}

COMPLIANT ASPECTS
-----------------
${report.compliant_aspects.map((aspect, i) => `${i + 1}. ${aspect}`).join('\n')}

RECOMMENDATIONS
---------------
${report.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

AGENT ANALYSES
--------------

BNM Shariah Resolutions:
Status: ${report.agent_analyses.bnm_resolutions.status}
${report.agent_analyses.bnm_resolutions.summary}

IFSA 2013:
Status: ${report.agent_analyses.ifsa.status}
${report.agent_analyses.ifsa.summary}

BNM Contract Framework:
Status: ${report.agent_analyses.contract_framework.status}
${report.agent_analyses.contract_framework.summary}

Mufti Fatwas:
Status: ${report.agent_analyses.mufti_fatwas.status}
${report.agent_analyses.mufti_fatwas.summary}

---
Generated by Al-Mizan Shariah Compliance Platform
    `;

    const file = new Blob([fileContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Shariah_Compliance_Report_${activeDoc.name}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Compliant': return 'text-emerald-700 bg-emerald-100';
      case 'Compliant with Conditions': return 'text-amber-700 bg-amber-100';
      case 'Non-Compliant': return 'text-red-700 bg-red-100';
      default: return 'text-slate-700 bg-slate-100';
    }
  };

  // Get preview URL (from uploaded file or active document)
  const previewUrl = uploadedFile?.previewUrl || activeDoc?.fileUrl;
  const previewType = uploadedFile?.file.type || activeDoc?.type;

  // --- VIEW: DASHBOARD ---
  if (viewMode === 'dashboard') {
    return (
      <div className="space-y-10 animate-fade-in pb-10">
        {/* Banner */}
        <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden group">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider mb-6 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck size={14} />
              <span>Multi-Agent Analysis Engine</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight leading-tight">
              Shariah Document <br />
              <span className="text-blue-400">Analyzer</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-xl">
              Automated compliance review using 4 specialized agents: BNM Resolutions, IFSA 2013, Contract Framework, and Mufti Fatwas.
            </p>

            <button
              onClick={handleStartAnalysis}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-600/20 flex items-center gap-3 transition-all hover:scale-105 active:scale-95 group/btn"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center group-hover/btn:bg-white group-hover/btn:text-blue-600 transition-colors">
                <Plus size={20} strokeWidth={3} />
              </div>
              New Analysis
            </button>
          </div>

          {/* Decorative Elements */}
          <div className="absolute right-0 top-0 h-full w-full bg-[radial-gradient(circle_at_80%_20%,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent pointer-events-none"></div>
          <div className="absolute -right-20 -top-20 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        </div>

        {/* Recent Analyses */}
        {documents.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Recent Analyses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleViewDocument(doc)}
                  className="bg-white rounded-2xl p-6 transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer group relative overflow-hidden border border-slate-100 hover:border-blue-100"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${doc.report.overall_score > 80 ? 'bg-emerald-50 text-emerald-600' :
                      doc.report.overall_score > 50 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                      }`}>
                      <FileText size={26} />
                    </div>
                    <div className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(doc.report.compliance_status)}`}>
                      {doc.report.compliance_status}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-slate-800 mb-1 truncate" title={doc.name}>{doc.name}</h4>
                    <span className="text-xs text-slate-400 font-medium">{doc.uploadDate.toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Score</span>
                      <span className="text-xl font-black text-slate-700">{doc.report.overall_score}<span className="text-sm text-slate-300 font-medium">/100</span></span>
                    </div>
                    <button className="w-10 h-10 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-full flex items-center justify-center text-slate-400 transition-colors">
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- VIEW: WORKSPACE ---
  return (
    <div className="flex flex-col h-full -m-8 animate-in slide-in-from-bottom-4 duration-500 bg-white">
      {/* Header */}
      <div className="h-16 border-b border-slate-200 px-6 flex items-center justify-between shrink-0 bg-white z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setViewMode('dashboard');
              setUploadedFile(null);
              setActiveDoc(null);
            }}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="h-8 w-px bg-slate-200"></div>
          <div>
            <h2 className="font-bold text-slate-800 truncate max-w-md flex items-center gap-2">
              <FileText size={16} className="text-blue-500" />
              {activeDoc?.name || uploadedFile?.file.name || 'New Analysis'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Analyze Button - Only show when file is uploaded but not analyzed */}
          {uploadedFile && !activeDoc && !isAnalyzing && (
            <button
              onClick={handleAnalyze}
              className="flex items-center gap-2 text-sm bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-500 transition-colors font-bold shadow-lg shadow-blue-600/20"
            >
              <Play size={18} /> Analyze Document
            </button>
          )}

          {/* Export Buttons */}
          {activeDoc && (
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    await exportReportAsPDF(activeDoc.report, activeDoc.name, activeDoc.uploadDate);
                  } catch (error) {
                    console.error('PDF export failed:', error);
                    alert('Failed to export PDF');
                  }
                }}
                className="flex items-center gap-2 text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition-colors font-medium"
              >
                <Download size={16} /> Export PDF
              </button>
              <button
                onClick={async () => {
                  try {
                    await exportReportAsDOCX(activeDoc.report, activeDoc.name, activeDoc.uploadDate);
                  } catch (error) {
                    console.error('DOCX export failed:', error);
                    alert('Failed to export DOCX');
                  }
                }}
                className="flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors font-medium"
              >
                <Download size={16} /> Export DOCX
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Document Viewer */}
        <div className="w-1/2 bg-slate-100/50 border-r border-slate-200 relative flex flex-col items-center justify-center p-8 overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

          {!previewUrl ? (
            // Upload State
            <label className="cursor-pointer group relative z-10">
              <div className="w-full max-w-lg border-2 border-dashed border-slate-300 bg-white rounded-[2rem] p-16 text-center hover:border-blue-500 hover:bg-blue-50/10 hover:shadow-2xl transition-all duration-300">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-lg">
                  <Upload size={36} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">Upload Document</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
                  PDF, DOCX, or Images<br />Maximum 10MB
                </p>
              </div>
            </label>
          ) : (
            // Document Preview
            <div className="w-full h-full flex flex-col relative z-10">
              {/* Preview Header */}
              {uploadedFile && !activeDoc && (
                <div className="bg-white rounded-t-xl border border-b-0 border-slate-200 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    📄 {uploadedFile.file.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              )}

              {/* PDF Preview */}
              {previewType === 'application/pdf' ? (
                <iframe
                  src={previewUrl}
                  className="w-full flex-1 rounded-b-xl shadow-xl border border-slate-200 bg-white"
                  title="Document Preview"
                />
              ) : previewType?.startsWith('image/') ? (
                // Image Preview
                <div className="w-full flex-1 flex items-center justify-center overflow-auto bg-white rounded-b-xl border border-slate-200 shadow-xl">
                  <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain p-4" />
                </div>
              ) : (
                // DOCX/Other Preview Placeholder
                <div className="w-full flex-1 flex flex-col items-center justify-center bg-white rounded-b-xl border border-slate-200 shadow-xl">
                  <FileText size={64} className="text-slate-300 mb-4" />
                  <h3 className="text-lg font-bold text-slate-700 mb-2">Document Ready</h3>
                  <p className="text-sm text-slate-500 text-center max-w-xs">
                    {uploadedFile?.file.name || activeDoc?.name}
                    <br />
                    <span className="text-xs text-slate-400">
                      Preview not available for this format. Click "Analyze Document" to proceed.
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Analysis Results */}
        <div className="w-1/2 bg-white flex flex-col h-full overflow-hidden">
          {isAnalyzing ? (
            // Analysis in Progress
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="w-full max-w-md mx-auto p-8 space-y-6">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Multi-Agent Analysis in Progress</h3>
                  <p className="text-slate-500 text-sm">Running 4 specialist agents in parallel...</p>
                </div>

                {/* Rotating Tips */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">💡</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-900 mb-1">Did you know?</p>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        Our AI analyzes your document against 4 different Shariah knowledge bases simultaneously, ensuring comprehensive compliance review.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Agent Progress */}
                <div className="space-y-3">
                  {agentStatuses
                    .filter(agent => {
                      // Hide agents that completed with 0 findings
                      if (agent.status === 'completed' && agent.message?.includes('Found 0 findings')) {
                        return false;
                      }
                      return true;
                    })
                    .map((agent, i) => (
                      <div
                        key={i}
                        className={`bg-slate-50 rounded-xl p-4 border transition-all duration-300 ${agent.status === 'analyzing' ? 'border-blue-200 bg-blue-50/50 shadow-md' :
                          agent.status === 'completed' ? 'border-emerald-200 bg-emerald-50/30' :
                            'border-slate-100'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-slate-700">{agent.name}</span>
                          {agent.status === 'completed' && <CheckCircle size={16} className="text-emerald-600" />}
                          {agent.status === 'analyzing' && <Activity size={16} className="text-blue-600 animate-pulse" />}
                          {agent.status === 'error' && <XCircle size={16} className="text-red-600" />}
                          {agent.status === 'pending' && <Clock size={16} className="text-slate-400" />}
                        </div>
                        {agent.message && (
                          <p className="text-xs text-slate-500 mb-2">{agent.message}</p>
                        )}
                        {/* Progress bar for extraction */}
                        {agent.name === 'Document Extraction' && agent.progress !== undefined && (
                          <div className="mt-2">
                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${agent.progress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 text-right">{Math.round(agent.progress)}%</p>
                          </div>
                        )}
                      </div>
                    ))}

                  {/* Show "Thinking..." if all specialist agents are hidden */}
                  {agentStatuses.filter(a =>
                    a.status === 'completed' &&
                    a.message?.includes('Found 0 findings') &&
                    a.name !== 'Document Extraction' &&
                    a.name !== 'Final Synthesis'
                  ).length > 0 && (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-white text-xs">🤔</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-purple-900">Deep Analysis</p>
                            <p className="text-xs text-purple-700">Analyzing document structure and compliance patterns...</p>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          ) : activeDoc?.report ? (
            // Results Display
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-8 space-y-8">
                {/* Compliance Status */}
                <div className={`rounded-2xl p-6 border ${activeDoc.report.overall_score > 80 ? 'bg-emerald-50 border-emerald-100' :
                  activeDoc.report.overall_score > 50 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'
                  }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${activeDoc.report.overall_score > 80 ? 'bg-emerald-200 text-emerald-800' :
                        activeDoc.report.overall_score > 50 ? 'bg-amber-200 text-amber-800' : 'bg-red-200 text-red-800'
                        }`}>
                        {activeDoc.report.overall_score > 80 ? <CheckCircle size={20} /> : <ShieldAlert size={20} />}
                      </div>
                      <span className={`font-bold text-lg ${activeDoc.report.overall_score > 80 ? 'text-emerald-900' :
                        activeDoc.report.overall_score > 50 ? 'text-amber-900' : 'text-red-900'
                        }`}>
                        {activeDoc.report.compliance_status}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs font-bold uppercase opacity-60">Score</span>
                      <span className="text-3xl font-black">{activeDoc.report.overall_score}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-white/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${activeDoc.report.overall_score > 80 ? 'bg-emerald-500' :
                        activeDoc.report.overall_score > 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                      style={{ width: `${activeDoc.report.overall_score}%` }}
                    ></div>
                  </div>
                </div>

                {/* Executive Summary */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Executive Summary</h3>
                  <p className="text-slate-600 leading-relaxed">{activeDoc.report.executive_summary}</p>
                </div>

                {/* Problematic Clauses */}
                {activeDoc.report.problematic_clauses.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                      Problematic Clauses ({activeDoc.report.problematic_clauses.length})
                    </h3>
                    <div className="space-y-4">
                      {activeDoc.report.problematic_clauses.map((clause, i) => (
                        <div
                          key={i}
                          onClick={() => setHighlightedClause(i === highlightedClause ? null : i)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${highlightedClause === i ? 'border-blue-500 bg-blue-50 shadow-lg' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                            }`}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`px-2 py-1 rounded text-xs font-bold border ${getSeverityColor(clause.severity)}`}>
                              {clause.severity}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-800 mb-1">{clause.issue_description}</p>
                              <p className="text-xs text-slate-500 italic">"{clause.exact_text}"</p>
                            </div>
                          </div>
                          <div className="text-xs text-slate-600 space-y-1 pl-3 border-l-2 border-slate-200">
                            <p><strong>Authority:</strong> {clause.authority_reference}</p>
                            <p><strong>Detected by:</strong> {clause.detected_by.join(', ')}</p>
                            <p><strong>Recommendation:</strong> {clause.recommendation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compliant Aspects */}
                {activeDoc.report.compliant_aspects.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Compliant Aspects</h3>
                    <div className="space-y-2">
                      {activeDoc.report.compliant_aspects.map((aspect, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <CheckCircle size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                          <span>{aspect}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {activeDoc.report.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Recommendations</h3>
                    <div className="space-y-2">
                      {activeDoc.report.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : uploadedFile ? (
            // File uploaded, waiting for analysis
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <FileText size={48} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Document Ready</h3>
              <p className="text-slate-500 text-sm max-w-xs mb-8">
                Click the <strong>"Analyze Document"</strong> button above to start the multi-agent Shariah compliance review.
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock size={14} />
                <span>Estimated time: 30-60 seconds</span>
              </div>
            </div>
          ) : (
            // Empty State
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-300">
              <ShieldCheck size={80} className="mb-6 opacity-30 stroke-1" />
              <h3 className="text-xl font-medium text-slate-400">Ready to Analyze</h3>
              <p className="text-sm">Upload a document to begin multi-agent analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentAnalyzer;