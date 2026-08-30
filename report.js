/**
 * Report module — Geração de PDF no formato BACY
 */

export function generatePDF(result, leadData, leadName, leadPhone) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    console.error('jsPDF library not loaded.');
    alert('Erro: biblioteca de PDF não carregada.');
    return null;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 18;
  const CW = W - M * 2;

  const C = {
    primary: [61, 53, 104],
    accent: [59, 130, 246],
    success: [45, 90, 61],
    successBg: [212, 237, 218],
    warning: [243, 156, 18],
    warningBg: [255, 248, 225],
    error: [192, 57, 43],
    errorBg: [253, 237, 236],
    gray: [139, 135, 166],
    lightGray: [241, 240, 245],
    darkGray: [61, 53, 104],
    white: [255, 255, 255],
    bg: [180, 186, 232],
  };

  let y = 0;

  // === PAGE 1: COVER ===
  doc.setFillColor(...C.primary);
  doc.rect(0, 0, W, 130, 'F');

  doc.setFillColor(...C.white);
  doc.rect(0, 128, W, 4, 'F');

  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('Auditoria de', M, 35);
  doc.text('Presenca Digital', M, 47);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text('Elaborado por: BACY Agencia', M, 62);

  doc.setFontSize(11);
  doc.setTextColor(200, 200, 220);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, M, 76);
  doc.text(`Empresa: ${leadData.companyName}`, M, 84);
  doc.text(`Preparado para: ${leadName}`, M, 92);
  doc.text(`Contato: ${leadPhone}`, M, 100);
  doc.text(`Site: ${leadData.websiteUrl || 'N/A'}`, M, 108);
  doc.text(`Instagram: ${leadData.instagramUrl || 'N/A'}`, M, 116);

  // Score box
  const score = result.overallScore || 0;
  doc.setFillColor(...C.white);
  doc.roundedRect(M, 145, 55, 55, 8, 8, 'F');
  const scoreColor = score >= 70 ? C.success : score >= 45 ? C.warning : C.error;
  doc.setFillColor(...scoreColor);
  doc.roundedRect(M + 5, 150, 45, 25, 4, 4, 'F');
  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(`${score}/100`, M + 27.5, 165, { align: 'center' });
  doc.setTextColor(...C.darkGray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Score Geral', M + 27.5, 183, { align: 'center' });

  // Category scores
  const cats = result.categoryScores || {};
  const catLabels = [
    { label: 'Site', val: cats.site },
    { label: 'SEO / Google', val: cats.seo },
    { label: 'Google Meu Negocio', val: cats.gmb },
    { label: 'Redes Sociais', val: cats.socialMedia },
    { label: 'Reputacao', val: cats.reputation },
  ];

  let yScore = 145;
  catLabels.forEach(c => {
    const v = c.val || 0;
    doc.setFillColor(...C.lightGray);
    doc.roundedRect(85, yScore, 95, 8, 2, 2, 'F');
    doc.setFillColor(...(v >= 60 ? C.success : v >= 40 ? C.warning : C.error));
    doc.roundedRect(85, yScore, Math.max(4, 95 * v / 100), 8, 2, 2, 'F');
    doc.setTextColor(...C.darkGray);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(c.label, 88, yScore + 5);
    doc.text(`${v}/100`, 172, yScore + 5, { align: 'right' });
    yScore += 12;
  });

  // === PAGE 2: RESUMO EXECUTIVO ===
  doc.addPage();
  y = 20;

  doc.setFillColor(...C.primary);
  doc.roundedRect(M, y, CW, 10, 2, 2, 'F');
  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Resumo Executivo', M + 5, y + 7);
  y += 16;

  doc.setTextColor(...C.darkGray);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const summaryLines = doc.splitTextToSize(result.expertSummary || 'Resumo nao disponivel.', CW);
  doc.text(summaryLines, M, y);
  y += summaryLines.length * 5 + 10;

  // === ACHADOS POR CATEGORIA ===
  const findings = result.findings || {};
  const categories = [
    { key: 'site', title: '1. Site', color: C.accent },
    { key: 'seo', title: '2. SEO / Descoberta no Google', color: [139, 92, 246] },
    { key: 'gmb', title: '3. Google Meu Negocio / Maps', color: C.success },
    { key: 'socialMedia', title: '4. Instagram e Redes Sociais', color: [193, 53, 132] },
    { key: 'reputation', title: '5. Reputacao (avaliacoes)', color: C.warning },
  ];

  categories.forEach(cat => {
    const f = findings[cat.key];
    if (!f) return;
    if (y > 240) { doc.addPage(); y = 20; }

    // Category header
    doc.setFillColor(...cat.color);
    doc.roundedRect(M, y, CW, 8, 2, 2, 'F');
    doc.setTextColor(...C.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(cat.title, M + 5, y + 5.5);
    y += 12;

    // Status badge
    const statusColor = f.status === 'Bom' || f.status === 'Bom' ? C.success :
                         f.status === 'Critico' ? C.error : C.warning;
    doc.setFillColor(...statusColor);
    doc.roundedRect(M, y, 30, 6, 1, 1, 'F');
    doc.setTextColor(...C.white);
    doc.setFontSize(7);
    doc.text(f.status || 'N/A', M + 3, y + 4);
    y += 10;

    // Evidence
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.darkGray);
    doc.text('Evidencia:', M + 3, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C.gray);
    const evLines = doc.splitTextToSize(f.evidence || 'Nao verificado', CW - 6);
    doc.text(evLines, M + 3, y);
    y += evLines.length * 4 + 3;

    // Risk
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.darkGray);
    doc.text('Risco:', M + 3, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C.error);
    const riskLines = doc.splitTextToSize(f.risk || 'N/A', CW - 6);
    doc.text(riskLines, M + 3, y);
    y += riskLines.length * 4 + 3;

    // Action
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.darkGray);
    doc.text('Acao recomendada:', M + 3, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C.success);
    const actLines = doc.splitTextToSize(f.action || 'N/A', CW - 6);
    doc.text(actLines, M + 3, y);
    y += actLines.length * 4 + 8;
  });

  // === CONCORRENCIA ===
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFillColor(...C.primary);
  doc.roundedRect(M, y, CW, 10, 2, 2, 'F');
  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('6. Concorrencia Local', M + 5, y + 7);
  y += 16;

  const comp = result.competitorAnalysis || {};
  doc.setTextColor(...C.darkGray);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  if (comp.competitors?.length) {
    doc.text(`Concorrentes identificados: ${comp.competitors.join(', ')}`, M, y);
    y += 6;
  }
  if (comp.whatTheyDoBetter) {
    doc.setFont('helvetica', 'bold');
    doc.text('O que fazem melhor:', M, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    const betterLines = doc.splitTextToSize(comp.whatTheyDoBetter, CW);
    doc.text(betterLines, M, y);
    y += betterLines.length * 4 + 3;
  }
  if (comp.identifiedGap) {
    doc.setFont('helvetica', 'bold');
    doc.text('Gap identificado:', M, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    const gapLines = doc.splitTextToSize(comp.identifiedGap, CW);
    doc.text(gapLines, M, y);
    y += gapLines.length * 4 + 5;
  }

  // === PUBLICIDADE PAGA ===
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFillColor(...C.primary);
  doc.roundedRect(M, y, CW, 10, 2, 2, 'F');
  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('7. Publicidade Paga', M + 5, y + 7);
  y += 16;

  const ads = result.paidAds || {};
  doc.setTextColor(...C.darkGray);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Status: ${ads.status || 'Nao verificavel remotamente'}`, M, y);
  y += 5;
  if (ads.evidence) {
    const evLines = doc.splitTextToSize(ads.evidence, CW);
    doc.text(evLines, M, y);
    y += evLines.length * 4 + 5;
  }

  // === PLANO DE ACAO ===
  doc.addPage();
  y = 20;

  doc.setFillColor(...C.primary);
  doc.roundedRect(M, y, CW, 10, 2, 2, 'F');
  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Plano de Acao Priorizado', M + 5, y + 7);
  y += 16;

  const plan = result.actionPlan || {};

  const drawPlanSection = (title, items, color) => {
    if (!items?.length) return;
    if (y > 250) { doc.addPage(); y = 20; }

    doc.setFillColor(...color);
    doc.roundedRect(M, y, CW, 7, 2, 2, 'F');
    doc.setTextColor(...C.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(title, M + 5, y + 5);
    y += 10;

    items.forEach((item, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFillColor(...C.lightGray);
      doc.roundedRect(M, y, CW, 8, 2, 2, 'F');
      doc.setTextColor(...C.darkGray);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const lines = doc.splitTextToSize(`${i + 1}. ${item}`, CW - 10);
      doc.text(lines, M + 5, y + 5.5);
      y += Math.max(10, lines.length * 4 + 6);
    });
    y += 4;
  };

  drawPlanSection('Resolver agora (baixo esforco / alto impacto)', plan.now, C.success);
  drawPlanSection('Medio prazo (1-3 meses)', plan.shortTerm, C.warning);
  drawPlanSection('Estrategico (posicionamento de marca)', plan.strategic, C.accent);

  // === ONDE PODEMOS AJUDAR ===
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFillColor(...C.primary);
  doc.roundedRect(M, y, CW, 10, 2, 2, 'F');
  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Onde a BACY pode ajudar', M + 5, y + 7);
  y += 16;

  doc.setTextColor(...C.darkGray);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const helpLines = doc.splitTextToSize(result.whereWeCanHelp || 'Consulte-nos para um plano personalizado.', CW);
  doc.text(helpLines, M, y);
  y += helpLines.length * 4 + 10;

  // === FOOTER ON LAST PAGE ===
  doc.setFillColor(...C.primary);
  doc.rect(0, H - 20, W, 20, 'F');
  doc.setTextColor(...C.white);
  doc.setFontSize(8);
  doc.text('Auditoria de Presenca Digital - BACY Agencia', W / 2, H - 12, { align: 'center' });
  doc.text('© BACY Agencia - Todos os direitos reservados', W / 2, H - 7, { align: 'center' });

  // Save
  const fileName = `${leadData.companyName.replace(/\s+/g, '_')}_auditoria_bacy.pdf`;
  doc.save(fileName);
  return fileName;
}