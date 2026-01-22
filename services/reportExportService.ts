/**
 * Report Export Service - Export analysis reports to PDF and DOCX
 */

import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import type { DocumentAnalysisReport } from './documentAnalyzerService';

/**
 * Export report as PDF
 */
export async function exportReportAsPDF(
    report: DocumentAnalysisReport,
    documentName: string,
    uploadDate: Date
): Promise<void> {
    const doc = new jsPDF();
    let yPos = 20;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    // Helper to add new page if needed
    const checkPageBreak = (neededSpace: number = 20) => {
        if (yPos + neededSpace > pageHeight - margin) {
            doc.addPage();
            yPos = 20;
        }
    };

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('AL MIZAN - SHARIAH COMPLIANCE AUDIT REPORT', margin, yPos);
    yPos += 15;

    // Document Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Document: ${documentName}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Analysis Date: ${uploadDate.toLocaleDateString()}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Processing Time: ${report.processing_time_seconds.toFixed(2)}s`, margin, yPos);
    yPos += 15;

    // Compliance Status
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPLIANCE STATUS', margin, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Status: ${report.compliance_status}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Overall Score: ${report.overall_score}/100`, margin, yPos);
    yPos += 15;

    // Executive Summary
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE SUMMARY', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(report.executive_summary, 170);
    summaryLines.forEach((line: string) => {
        checkPageBreak();
        doc.text(line, margin, yPos);
        yPos += lineHeight;
    });
    yPos += 10;

    // Problematic Clauses
    if (report.problematic_clauses.length > 0) {
        checkPageBreak(30);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('PROBLEMATIC CLAUSES', margin, yPos);
        yPos += 10;

        report.problematic_clauses.forEach((clause, i) => {
            checkPageBreak(40);

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(`${i + 1}. ${clause.exact_text.substring(0, 80)}...`, margin, yPos);
            yPos += lineHeight;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`Issue: ${clause.issue_description}`, margin + 5, yPos);
            yPos += lineHeight;
            doc.text(`Severity: ${clause.severity}`, margin + 5, yPos);
            yPos += lineHeight;
            doc.text(`Authority: ${clause.authority_reference}`, margin + 5, yPos);
            yPos += lineHeight;
            doc.text(`Detected by: ${clause.detected_by.join(', ')}`, margin + 5, yPos);
            yPos += lineHeight;

            const recLines = doc.splitTextToSize(`Recommendation: ${clause.recommendation}`, 165);
            recLines.forEach((line: string) => {
                checkPageBreak();
                doc.text(line, margin + 5, yPos);
                yPos += lineHeight;
            });
            yPos += 5;
        });
        yPos += 10;
    }

    // Compliant Aspects
    if (report.compliant_aspects.length > 0) {
        checkPageBreak(30);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('COMPLIANT ASPECTS', margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        report.compliant_aspects.forEach((aspect, i) => {
            checkPageBreak();
            doc.text(`${i + 1}. ${aspect}`, margin, yPos);
            yPos += lineHeight;
        });
        yPos += 10;
    }

    // Recommendations
    if (report.recommendations.length > 0) {
        checkPageBreak(30);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('RECOMMENDATIONS', margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        report.recommendations.forEach((rec, i) => {
            checkPageBreak();
            const recLines = doc.splitTextToSize(`${i + 1}. ${rec}`, 170);
            recLines.forEach((line: string) => {
                checkPageBreak();
                doc.text(line, margin, yPos);
                yPos += lineHeight;
            });
        });
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(
            `Generated by Al-Mizan Shariah Compliance Platform - Page ${i} of ${totalPages}`,
            margin,
            pageHeight - 10
        );
    }

    // Save
    doc.save(`Shariah_Compliance_Report_${documentName.replace(/\.[^/.]+$/, '')}.pdf`);
}

/**
 * Export report as DOCX
 */
export async function exportReportAsDOCX(
    report: DocumentAnalysisReport,
    documentName: string,
    uploadDate: Date
): Promise<void> {
    const children: Paragraph[] = [];

    // Title
    children.push(
        new Paragraph({
            text: 'AL MIZAN - SHARIAH COMPLIANCE AUDIT REPORT',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        })
    );

    // Document Info
    children.push(
        new Paragraph({
            children: [
                new TextRun({ text: 'Document: ', bold: true }),
                new TextRun(documentName)
            ],
            spacing: { after: 100 }
        }),
        new Paragraph({
            children: [
                new TextRun({ text: 'Analysis Date: ', bold: true }),
                new TextRun(uploadDate.toLocaleDateString())
            ],
            spacing: { after: 100 }
        }),
        new Paragraph({
            children: [
                new TextRun({ text: 'Processing Time: ', bold: true }),
                new TextRun(`${report.processing_time_seconds.toFixed(2)}s`)
            ],
            spacing: { after: 400 }
        })
    );

    // Compliance Status
    children.push(
        new Paragraph({
            text: 'COMPLIANCE STATUS',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
            children: [
                new TextRun({ text: 'Status: ', bold: true }),
                new TextRun(report.compliance_status)
            ],
            spacing: { after: 100 }
        }),
        new Paragraph({
            children: [
                new TextRun({ text: 'Overall Score: ', bold: true }),
                new TextRun(`${report.overall_score}/100`)
            ],
            spacing: { after: 400 }
        })
    );

    // Executive Summary
    children.push(
        new Paragraph({
            text: 'EXECUTIVE SUMMARY',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
            text: report.executive_summary,
            spacing: { after: 400 }
        })
    );

    // Problematic Clauses
    if (report.problematic_clauses.length > 0) {
        children.push(
            new Paragraph({
                text: 'PROBLEMATIC CLAUSES',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            })
        );

        report.problematic_clauses.forEach((clause, i) => {
            children.push(
                new Paragraph({
                    text: `${i + 1}. ${clause.exact_text}`,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 200, after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: 'Issue: ', bold: true }),
                        new TextRun(clause.issue_description)
                    ],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: 'Severity: ', bold: true }),
                        new TextRun(clause.severity)
                    ],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: 'Authority: ', bold: true }),
                        new TextRun(clause.authority_reference)
                    ],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: 'Detected by: ', bold: true }),
                        new TextRun(clause.detected_by.join(', '))
                    ],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: 'Recommendation: ', bold: true }),
                        new TextRun(clause.recommendation)
                    ],
                    spacing: { after: 200 }
                })
            );
        });
    }

    // Compliant Aspects
    if (report.compliant_aspects.length > 0) {
        children.push(
            new Paragraph({
                text: 'COMPLIANT ASPECTS',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            })
        );

        report.compliant_aspects.forEach((aspect, i) => {
            children.push(
                new Paragraph({
                    text: `${i + 1}. ${aspect}`,
                    spacing: { after: 100 }
                })
            );
        });
    }

    // Recommendations
    if (report.recommendations.length > 0) {
        children.push(
            new Paragraph({
                text: 'RECOMMENDATIONS',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            })
        );

        report.recommendations.forEach((rec, i) => {
            children.push(
                new Paragraph({
                    text: `${i + 1}. ${rec}`,
                    spacing: { after: 100 }
                })
            );
        });
    }

    // Footer
    children.push(
        new Paragraph({
            text: 'Generated by Al-Mizan Shariah Compliance Platform',
            alignment: AlignmentType.CENTER,
            spacing: { before: 800 }
        })
    );

    // Create document
    const doc = new Document({
        sections: [{
            properties: {},
            children: children
        }]
    });

    // Generate and save
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Shariah_Compliance_Report_${documentName.replace(/\.[^/.]+$/, '')}.docx`);
}
