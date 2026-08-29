/**
 * Report module - Geração de PDF profissional
 */

export function generatePDF(result, leadData, leadName, leadPhone) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    console.error('jsPDF library not loaded. window.jspdf:', window.jspdf);
    alert('Erro: biblioteca de PDF não carregada. Verifique sua conexão com a internet.');
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

  // === PAGE 1: Cover ===
  doc.setFillColor(...C.primary);
  doc.rect(0, 0, W, 120, 'F');

  doc.setFillColor(...C.white);
  doc.rect(0, 118, W, 4, 'F');

  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('Relatorio de', M, 40);
  doc.text('Investigacao Digital', M, 52);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Analise completa da presenca digital da empresa', M, 68);

  doc.setFontSize(11);
  doc.setTextColor(200, 200, 220);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, M, 82);
  doc.text(`Preparado para: ${leadName}`, M, 90);
  doc.text(`Empresa: ${leadData.companyName}`, M, 98);
  doc.text(`Telefone: ${leadPhone}`, M, 106);

  // Score on cover
  doc.setFillColor(...C.white);
  doc.roundedRect(M, 135, 55, 55, 8, 8, 'F');
  const scoreColor = result.overallScore >= 70 ? C.success : result.overallScore >= 45 ? C.warning : C.error;
  doc.setFillColor(...scoreColor);
  doc.roundedRect(M + 5, 140, 45, 25, 4, 4, 'F');
  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(`${result.overallScore}/100`, M + 27.5, 155, { align: 'center' });
  doc.setTextColor(...C.darkGray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Score Geral', M + 27.5, 173, { align: 'center' });
  doc.text('Presenca Digital', M + 27.5, 180, { align: 'center' });

  // Mini scores right side
  let yScore = 140;
  const cats = [
    { label: 'Presenca Digital', val: result.categoryScores?.digitalPresence || 50 },
    { label: 'Engajamento', val: result.categoryScores?.engagement || 50 },
    { label: 'SEO & Site', val: result.categoryScores?.seo || 50 },
    { label: 'Reputacao', val: result.categoryScores?.reputation || 50 },
    { label: 'Operacional', val: result.categoryScores?.operational || 50 },
  ];

  cats.forEach(c => {
    doc.setFillColor(...C.lightGray);
    doc.roundedRect(85, yScore, 95, 8, 2, 2, 'F');
    doc.setFillColor(...(c.val >= 60 ? C.success : c.val >= 40 ? C.warning : C.error));
    doc.roundedRect(85, yScore, Math.max(4, 95 * c.val / 100), 8, 2, 2, 'F');
    doc.setTextColor(...C.darkGray);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(c.label, 88, yScore + 5);
    doc.text(`${c.val}/100`, 172, yScore + 5, { align: 'right' });
    yScore += 12;
  });

  // Contact info
  doc.setTextColor(...C.gray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Dados do lead:', M, 210);
  doc.text(`Telefone: ${leadPhone}`, M, 218);
  doc.text(`Instagram: ${leadData.instagramUrl || 'N/A'}`, M, 226);
  doc.text(`Site: ${leadData.websiteUrl || 'N/A'}`, M, 234);

  // === PAGE 2: Strengths, Weaknesses, Opportunities ===
  doc.addPage();
  doc.setFillColor(...C.white);
  doc.rect(0, 0, W, H, 'F');

  let y = 20;

  const drawSection = (title, items, color, bgColor) => {
    if (!items || items.length === 0) return;
    doc.setFillColor(...color);
    doc.roundedRect(M, y, CW, 8, 2, 2, 'F');
    doc.setTextColor(...C.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(title, M + 5, y + 5.5);
    y += 14;

    items.forEach((item, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFillColor(...bgColor);
      doc.roundedRect(M, y, CW, 10, 2, 2, 'F');
      doc.setTextColor(...C.darkGray);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(`${i + 1}. ${item}`, CW - 10);
      doc.text(lines, M + 5, y + 6.5);
      y += Math.max(13, lines.length * 5 + 8);
    });
    y += 5;
  };

  drawSection('Pontos Fortes', result.strengths, C.success, C.successBg);
  drawSection('Problemas Identificados', result.weaknesses, C.error, C.errorBg);
  drawSection('Oportunidades de Melhoria', result.opportunities, C.warning, C.warningBg);

  // === AI RECOMMENDATIONS ===
  if (result.aiRecommendations && result.aiRecommendations.length > 0) {
    doc.addPage();
    doc.setFillColor(...C.white);
    doc.rect(0, 0, W, H, 'F');
    y = 20;

    doc.setFillColor(...C.primary);
    doc.roundedRect(M, y, CW, 10, 2, 2, 'F');
    doc.setTextColor(...C.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Recomendacoes de IA para o Negocio', M + 5, y + 7);
    y += 18;

    result.aiRecommendations.forEach((rec, i) => {
      if (y > 250) { doc.addPage(); y = 20; }

      const impactColor = rec.impact === 'alto' ? C.success : rec.impact === 'medio' ? C.warning : C.error;
      const implColor = rec.implementation === 'facil' ? C.success : rec.implementation === 'medio' ? C.warning : C.error;

      doc.setFillColor(...C.lightGray);
      doc.roundedRect(M, y, CW, 28, 3, 3, 'F');

      doc.setFillColor(...C.primary);
      doc.roundedRect(M + 3, y + 3, 2, 22, 1, 1, 'F');

      doc.setTextColor(...C.darkGray);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${i + 1}. ${rec.title}`, M + 10, y + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...C.gray);
      const lines = doc.splitTextToSize(rec.description, CW - 15);
      doc.text(lines, M + 10, y + 14);

      // Tags
      doc.setFillColor(...impactColor);
      doc.roundedRect(M + 10, y + 22, 30, 4, 1, 1, 'F');
      doc.setTextColor(...C.white);
      doc.setFontSize(6);
      doc.text(`Impacto: ${rec.impact}`, M + 13, y + 25);

      doc.setFillColor(...implColor);
      doc.roundedRect(M + 44, y + 22, 45, 4, 1, 1, 'F');
      doc.setTextColor(...C.white);
      doc.text(`Implantacao: ${rec.implementation}`, M + 47, y + 25);

      if (rec.expectedROI) {
        doc.setTextColor(...C.gray);
        doc.setFontSize(7);
        doc.text(`ROI: ${rec.expectedROI}`, M + 95, y + 25);
      }

      y += 33;
    });
  }

  // === PRIORITY ACTIONS ===
  if (result.priorityActions && result.priorityActions.length > 0) {
    doc.addPage();
    doc.setFillColor(...C.white);
    doc.rect(0, 0, W, H, 'F');
    y = 20;

    doc.setFillColor(...C.primary);
    doc.roundedRect(M, y, CW, 10, 2, 2, 'F');
    doc.setTextColor(...C.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Acoes Prioritarias (30 dias)', M + 5, y + 7);
    y += 18;

    result.priorityActions.forEach((action, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFillColor(...C.lightGray);
      doc.roundedRect(M, y, CW, 10, 2, 2, 'F');
      doc.setTextColor(...C.darkGray);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`${i + 1}.`, M + 5, y + 6.5);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(action, CW - 15);
      doc.text(lines, M + 12, y + 6.5);
      y += Math.max(13, lines.length * 5 + 8);
    });
  }

  // === COMPETITOR INSIGHTS ===
  if (result.competitorInsights) {
    if (y > 240) { doc.addPage(); y = 20; }
    y += 10;
    doc.setFillColor(...C.primary);
    doc.roundedRect(M, y, CW, 10, 2, 2, 'F');
    doc.setTextColor(...C.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Analise Competitiva', M + 5, y + 7);
    y += 18;

    doc.setTextColor(...C.darkGray);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const compLines = doc.splitTextToSize(result.competitorInsights, CW);
    doc.text(compLines, M, y);
    y += compLines.length * 5;
  }

  // === WEB RESULTS ===
  if (result.webResults && result.webResults.length > 0) {
    doc.addPage();
    doc.setFillColor(...C.white);
    doc.rect(0, 0, W, H, 'F');
    y = 20;

    doc.setFillColor(...C.primary);
    doc.roundedRect(M, y, CW, 10, 2, 2, 'F');
    doc.setTextColor(...C.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Resultados da Pesquisa Web', M + 5, y + 7);
    y += 18;

    result.webResults.forEach((r, i) => {
      if (y > 260) { doc.addPage(); y = 20; }

      doc.setFillColor(...C.lightGray);
      doc.roundedRect(M, y, CW, 18, 2, 2, 'F');

      const srcColor = r.source === 'instagram' ? [193, 53, 132] :
                       r.source === 'website' ? C.accent :
                       r.source === 'market' ? [139, 92, 246] : C.gray;

      doc.setFillColor(...srcColor);
      doc.roundedRect(M + 3, y + 3, 3, 12, 1, 1, 'F');

      doc.setTextColor(...C.darkGray);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`${i + 1}. ${r.title}`, M + 10, y + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...C.gray);
      const descLines = doc.splitTextToSize(r.description, CW - 15);
      doc.text(descLines, M + 10, y + 12);

      y += 22;
    });
  }

  // Footer on last page
  y = H - 15;
  doc.setFillColor(...C.primary);
  doc.rect(0, y - 5, W, 20, 'F');
  doc.setTextColor(...C.white);
  doc.setFontSize(8);
  doc.text('Investigacao Digital Empresarial - Relatorio Gerado Automaticamente', W / 2, y + 3, { align: 'center' });
  doc.text('© Agencia Global - Todos os direitos reservados', W / 2, y + 9, { align: 'center' });

  // Save
  const fileName = `${leadData.companyName.replace(/\s+/g, '_')}_diagnostico_digital.pdf`;
  doc.save(fileName);

  return fileName;
}
