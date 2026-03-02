import { jsPDF } from 'jspdf';

const COLORS = {
  ink: [26, 26, 46],
  inkLight: [61, 61, 86],
  inkMuted: [107, 107, 130],
  gold: [201, 168, 76],
  goldMuted: [184, 154, 69],
  parchment: [247, 245, 240],
  parchmentWarm: [240, 236, 228],
  red: [201, 76, 76],
  orange: [212, 133, 90],
  yellow: [201, 168, 76],
  green: [90, 158, 111],
  white: [255, 255, 255],
};

function getRiskLevel(score, max = 15) {
  const pct = (score / max) * 100;
  if (pct >= 73) return { label: "HIGH RISK", color: COLORS.red };
  if (pct >= 47) return { label: "MODERATE RISK", color: COLORS.orange };
  if (pct >= 27) return { label: "LOW RISK", color: COLORS.yellow };
  return { label: "HEALTHY", color: COLORS.green };
}

function getOverallLabel(pct) {
  if (pct >= 70) return "Significant meaning risk detected";
  if (pct >= 45) return "Moderate meaning risk — repair opportunities exist";
  if (pct >= 25) return "Below-average meaning risk — some areas to watch";
  return "Low meaning risk — strong communication foundations";
}

export function generatePDF(scores, failureTypes, context, answers, questions) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 22;
  const contentW = pageW - margin * 2;
  let y = 0;

  // ── COVER PAGE ──────────────────────────────────────────────
  // Dark header band
  doc.setFillColor(...COLORS.ink);
  doc.rect(0, 0, pageW, 100, 'F');

  // Gold accent line
  doc.setFillColor(...COLORS.gold);
  doc.rect(margin, 28, 30, 1, 'F');

  // Masthead
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gold);
  doc.text('WHAT TIME BINDS — MEANING REPAIR FOR HIGH-STAKES TEAMS', margin, 24);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...COLORS.parchment);
  doc.text('Meaning Risk', margin, 48);
  doc.text('Snapshot', margin, 60);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(200, 198, 190);
  doc.text('Personal Assessment Report', margin, 72);

  // Date & context
  doc.setFontSize(9);
  doc.setTextColor(160, 158, 150);
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(dateStr, margin, 82);
  if (context?.role) {
    doc.text(`${context.role}  ·  Team of ${context.teamSize || 'unspecified'}`, margin, 89);
  }

  // Overall score block
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const overallPct = Math.round((totalScore / 90) * 100);
  const overallRisk = getRiskLevel(totalScore, 90);

  y = 120;
  doc.setFillColor(250, 248, 244);
  doc.rect(margin, y - 5, contentW, 45, 'F');
  doc.setDrawColor(230, 226, 218);
  doc.rect(margin, y - 5, contentW, 45, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(42);
  doc.setTextColor(...overallRisk.color);
  doc.text(`${overallPct}%`, margin + 12, y + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.inkMuted);
  doc.text('OVERALL MEANING RISK INDEX', margin + 50, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.inkLight);
  const overallLabel = getOverallLabel(overallPct);
  doc.text(overallLabel, margin + 50, y + 20);

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.inkMuted);
  doc.text('Based on 18 scenario-based questions across 6 MRCI failure types', margin + 50, y + 29);

  // ── HEATMAP SECTION ─────────────────────────────────────────
  y = 185;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.ink);
  doc.text('Risk Heatmap by Failure Type', margin, y);

  doc.setFillColor(...COLORS.gold);
  doc.rect(margin, y + 3, 20, 0.8, 'F');

  y += 14;
  const sortedTypes = [...failureTypes].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));

  sortedTypes.forEach((ft, i) => {
    const score = scores[ft.id] || 0;
    const pct = (score / 15) * 100;
    const risk = getRiskLevel(score);
    const rowY = y + i * 14;

    // Background bar (full width)
    doc.setFillColor(245, 243, 238);
    doc.rect(margin + 42, rowY - 3, contentW - 42 - 28, 9, 'F');

    // Filled bar
    const barWidth = ((contentW - 42 - 28) * pct) / 100;
    doc.setFillColor(...risk.color);
    doc.roundedRect(margin + 42, rowY - 3, Math.max(barWidth, 1), 9, 1, 1, 'F');

    // Icon + Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.inkLight);
    doc.text(`${ft.icon} ${ft.short}`, margin, rowY + 3);

    // Risk label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...risk.color);
    doc.text(risk.label, pageW - margin, rowY + 3, { align: 'right' });
  });

  // Legend
  y += sortedTypes.length * 14 + 8;
  const legends = [
    { label: 'High Risk', color: COLORS.red },
    { label: 'Moderate', color: COLORS.orange },
    { label: 'Low Risk', color: COLORS.yellow },
    { label: 'Healthy', color: COLORS.green },
  ];
  let lx = margin;
  legends.forEach(leg => {
    doc.setFillColor(...leg.color);
    doc.circle(lx + 2, y, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.inkMuted);
    doc.text(leg.label, lx + 6, y + 1.5);
    lx += 30;
  });

  // ── PAGE 2: DETAILED ANALYSIS ───────────────────────────────
  doc.addPage();
  y = 25;

  // Header bar
  doc.setFillColor(...COLORS.ink);
  doc.rect(0, 0, pageW, 14, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gold);
  doc.text('MEANING RISK SNAPSHOT — DETAILED ANALYSIS', margin, 9);
  doc.setTextColor(160, 158, 150);
  doc.text(dateStr, pageW - margin, 9, { align: 'right' });

  // Top 2 risks
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.ink);
  doc.text('Your Top Two Risk Areas', margin, y);
  doc.setFillColor(...COLORS.gold);
  doc.rect(margin, y + 3, 20, 0.8, 'F');
  y += 14;

  const topTwo = sortedTypes.slice(0, 2);
  topTwo.forEach((ft, idx) => {
    if (y > pageH - 60) {
      doc.addPage();
      y = 25;
      doc.setFillColor(...COLORS.ink);
      doc.rect(0, 0, pageW, 14, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.gold);
      doc.text('MEANING RISK SNAPSHOT — DETAILED ANALYSIS', margin, 9);
    }

    const risk = getRiskLevel(scores[ft.id]);

    // Failure type name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.ink);
    doc.text(`${ft.icon}  ${ft.name}`, margin, y);
    y += 6;

    // Definition
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.inkMuted);
    const defLines = doc.splitTextToSize(ft.definition, contentW);
    doc.text(defLines, margin, y);
    y += defLines.length * 4.5 + 4;

    // Repair box
    const repairColor = risk.color;
    doc.setFillColor(repairColor[0], repairColor[1], repairColor[2], 0.06);
    doc.setFillColor(250, 248, 244);

    const repairLines = doc.splitTextToSize(ft.repairDetail, contentW - 16);
    const boxH = repairLines.length * 4.5 + 18;

    doc.setFillColor(250, 248, 244);
    doc.rect(margin, y - 2, contentW, boxH, 'F');
    doc.setFillColor(...repairColor);
    doc.rect(margin, y - 2, 1.5, boxH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...repairColor);
    doc.text('RECOMMENDED REPAIR MOVES', margin + 8, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.inkLight);
    doc.text(repairLines, margin + 8, y + 12);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.inkMuted);
    doc.text(`Protocols: ${ft.repairMoves.join(' · ')}  —  See ${ft.moduleLink}`, margin + 8, y + boxH - 5);

    y += boxH + 12;

    if (idx === 0) {
      doc.setDrawColor(230, 226, 218);
      doc.line(margin, y - 6, pageW - margin, y - 6);
    }
  });

  // Strength area
  const healthiest = sortedTypes[sortedTypes.length - 1];
  y += 4;

  if (y > pageH - 50) {
    doc.addPage();
    y = 25;
  }

  doc.setFillColor(235, 248, 240);
  doc.rect(margin, y - 2, contentW, 22, 'F');
  doc.setFillColor(...COLORS.green);
  doc.rect(margin, y - 2, 1.5, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.green);
  doc.text(`${healthiest.icon}  Strongest Area: ${healthiest.name}`, margin + 8, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.inkMuted);
  const strengthText = 'This is where your team\'s shared understanding is most intact. Notice what practices maintain alignment here and consider applying them to your higher-risk areas.';
  const strengthLines = doc.splitTextToSize(strengthText, contentW - 16);
  doc.text(strengthLines, margin + 8, y + 13);

  // ── PAGE 3: REPAIR CONVERSATION GUIDE ───────────────────────
  doc.addPage();
  y = 25;

  doc.setFillColor(...COLORS.ink);
  doc.rect(0, 0, pageW, 14, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gold);
  doc.text('MEANING RISK SNAPSHOT — REPAIR CONVERSATION GUIDE', margin, 9);
  doc.setTextColor(160, 158, 150);
  doc.text(dateStr, pageW - margin, 9, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.ink);
  doc.text('Your 3-Step Repair Conversation', margin, y);
  doc.setFillColor(...COLORS.gold);
  doc.rect(margin, y + 3, 20, 0.8, 'F');
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.inkMuted);
  const introText = `Based on your Snapshot results (${overallPct}% overall risk), here is a structured conversation you can have with your team this week. The entire conversation takes 15–20 minutes.`;
  const introLines = doc.splitTextToSize(introText, contentW);
  doc.text(introLines, margin, y);
  y += introLines.length * 4.5 + 8;

  const steps = [
    {
      num: "1",
      title: `Name it: "${topTwo[0].name}"`,
      body: `Share with your team: "I took a team communication diagnostic, and it flagged ${topTwo[0].name.toLowerCase()} as our biggest risk area." Then read this definition aloud: "${topTwo[0].definition}" Ask: "Does this resonate? Can anyone think of a recent example?"`
    },
    {
      num: "2",
      title: "Try one repair move this week",
      body: `Pick one move from the recommended set: ${topTwo[0].repairMoves.join(", ")}. ${topTwo[0].repairDetail.split(".").slice(0, 2).join(".")}. Commit to using it in one meeting or handoff this week.`
    },
    {
      num: "3",
      title: "Debrief in 7 days",
      body: `Revisit with your team: "Last week we tried [repair move]. What happened? Did it surface anything we weren't seeing before?" Document what you learn. This is the beginning of your Meaning Repair Operating System.`
    }
  ];

  steps.forEach((step, i) => {
    if (y > pageH - 50) {
      doc.addPage();
      y = 25;
    }

    // Step number circle
    doc.setFillColor(...COLORS.ink);
    doc.circle(margin + 5, y + 3, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.parchment);
    doc.text(step.num, margin + 5, y + 5, { align: 'center' });

    // Step title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.ink);
    doc.text(step.title, margin + 14, y + 5);
    y += 10;

    // Step body
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.inkLight);
    const bodyLines = doc.splitTextToSize(step.body, contentW - 14);
    doc.text(bodyLines, margin + 14, y);
    y += bodyLines.length * 4.5 + 10;

    if (i < steps.length - 1) {
      doc.setDrawColor(230, 226, 218);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(margin + 5, y - 5, margin + 5, y - 1);
      doc.setLineDashPattern([], 0);
    }
  });

  // CTA box
  y += 8;
  if (y > pageH - 40) {
    doc.addPage();
    y = 25;
  }

  doc.setFillColor(...COLORS.ink);
  doc.rect(margin, y, contentW, 30, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.parchment);
  doc.text('Continue with What Time Binds', margin + contentW / 2, y + 11, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(200, 198, 190);
  const ctaText = 'The Meaning Risk Snapshot is Module 1 of Meaning Repair for High-Stakes Teams. Modules 2-10 build your complete Meaning Repair Operating System.';
  const ctaLines = doc.splitTextToSize(ctaText, contentW - 30);
  doc.text(ctaLines, margin + contentW / 2, y + 18, { align: 'center' });

  // Footer on last page
  const lastY = pageH - 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.inkMuted);
  doc.text(`© ${new Date().getFullYear()} What Time Binds · Jerry W Washington, Ed.D. · Meaning Repair for High-Stakes Teams`, margin, lastY);
  doc.text('what-time-binds.com', pageW - margin, lastY, { align: 'right' });

  // Save
  doc.save('Meaning-Risk-Snapshot-Report.pdf');
}
