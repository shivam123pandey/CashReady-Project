const pptxgen = require('pptxgenjs');
const path = require('path');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'CashReady Project';
pptx.subject = 'CashReady ATM cash management platform';
pptx.title = 'CashReady | Smart cash, stronger banking';
pptx.company = 'CashReady';
pptx.lang = 'en-US';
pptx.theme = {
  headFontFace: 'Aptos Display',
  bodyFontFace: 'Aptos',
  lang: 'en-US',
};
pptx.defineSlideMaster({
  title: 'MASTER',
  background: { color: 'F6F8FB' },
  objects: [
    { rect: { x: 0, y: 7.18, w: 13.333, h: 0.32, fill: { color: '0B233F' }, line: { color: '0B233F' } } },
    { text: { text: 'CASHREADY  /  SMART CASH, STRONGER BANKING', options: { x: 0.55, y: 7.23, w: 7, h: 0.12, fontFace: 'Aptos', fontSize: 6.5, color: 'D9E4F1', margin: 0, bold: true, charSpacing: 1.2 } } },
    { text: { text: '2026', options: { x: 12.1, y: 7.23, w: 0.65, h: 0.12, fontFace: 'Aptos', fontSize: 6.5, color: 'D9E4F1', margin: 0, align: 'right' } } },
  ],
  slideNumber: { x: 12.87, y: 7.22, color: 'D9E4F1', fontFace: 'Aptos', fontSize: 7 },
});

const C = { navy: '0B233F', blue: '1174C8', teal: '0F8B83', mint: 'DDF4EF', sky: 'E8F2FC', ink: '203247', muted: '607287', line: 'D8E2ED', white: 'FFFFFF', amber: 'F4B942', red: 'D95D5D', pale: 'F6F8FB' };
const heroPath = path.join(__dirname, '..', 'src', 'assets', 'hero.png');

function addText(slide, text, x, y, w, h, opts = {}) {
  slide.addText(text, { x, y, w, h, margin: 0, fontFace: opts.fontFace || 'Aptos', fontSize: opts.fontSize || 16, color: opts.color || C.ink, bold: opts.bold || false, breakLine: false, fit: 'shrink', valign: opts.valign || 'mid', align: opts.align || 'left', paraSpaceAfterPt: 0, charSpacing: opts.charSpacing || 0, italic: opts.italic || false, ...opts });
}
function title(slide, kicker, heading, subheading) {
  addText(slide, kicker.toUpperCase(), 0.65, 0.48, 4.5, 0.2, { fontSize: 9, color: C.teal, bold: true, charSpacing: 1.6 });
  addText(slide, heading, 0.65, 0.78, 11.8, 0.55, { fontFace: 'Aptos Display', fontSize: 28, color: C.navy, bold: true });
  if (subheading) addText(slide, subheading, 0.67, 1.42, 10.8, 0.32, { fontSize: 11.5, color: C.muted });
}
function pill(slide, text, x, y, w, color = C.mint, textColor = C.teal) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.28, rectRadius: 0.04, fill: { color }, line: { color, transparency: 100 } });
  addText(slide, text.toUpperCase(), x + 0.1, y + 0.01, w - 0.2, 0.2, { fontSize: 7, color: textColor, bold: true, charSpacing: 0.8, align: 'center' });
}
function card(slide, x, y, w, h, fill = C.white, line = C.line) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.06, fill: { color: fill }, line: { color: line, width: 0.8 } });
}
function iconCircle(slide, label, x, y, color = C.blue) {
  slide.addShape(pptx.ShapeType.ellipse, { x, y, w: 0.46, h: 0.46, fill: { color }, line: { color, transparency: 100 } });
  addText(slide, label, x, y + 0.02, 0.46, 0.36, { fontSize: 15, color: C.white, bold: true, align: 'center' });
}
function line(slide, x1, y1, x2, y2, color = C.line, width = 1.2, dash = 'solid') {
  slide.addShape(pptx.ShapeType.line, { x: x1, y: y1, w: x2 - x1, h: y2 - y1, line: { color, width, dashType: dash, beginArrowType: 'none', endArrowType: 'none' } });
}

// 1. Cover
{
  const s = pptx.addSlide('MASTER');
  s.background = { color: C.navy };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 7.18, fill: { color: C.navy }, line: { color: C.navy } });
  s.addShape(pptx.ShapeType.arc, { x: 8.3, y: -1.2, w: 6.3, h: 6.3, adjustPoint: 0.2, line: { color: '1A4E76', width: 2, transparency: 25 }, rotate: 12 });
  s.addShape(pptx.ShapeType.arc, { x: 9.2, y: 3.7, w: 5, h: 5, line: { color: '0F8B83', width: 1.5, transparency: 20 }, rotate: 18 });
  pill(s, 'Project overview', 0.72, 0.72, 1.45, '173A5D', '82D5CB');
  addText(s, 'CashReady', 0.72, 1.35, 6.6, 0.75, { fontFace: 'Aptos Display', fontSize: 42, color: C.white, bold: true });
  addText(s, 'Smart cash,\nstronger banking.', 0.72, 2.23, 6.7, 1.2, { fontFace: 'Aptos Display', fontSize: 30, color: 'DCEAF7', bold: true, breakLine: false, valign: 'top' });
  addText(s, 'A digital platform for finding reliable ATMs, predicting cash demand, and giving banking teams a clear operational view.', 0.75, 3.72, 5.55, 0.82, { fontSize: 15, color: 'AFC6D9', valign: 'top' });
  s.addImage({ path: heroPath, x: 7.15, y: 0.72, w: 5.35, h: 4.9, transparency: 8 });
  card(s, 0.75, 5.38, 5.85, 0.88, '14385A', '2B587A');
  addText(s, 'Customer experience', 1.0, 5.59, 1.65, 0.18, { fontSize: 8, color: '86D7CE', bold: true, charSpacing: 0.8 });
  addText(s, 'Find cash with confidence', 1.0, 5.85, 2.3, 0.2, { fontSize: 13, color: C.white, bold: true });
  addText(s, 'Banker operations', 3.75, 5.59, 1.35, 0.18, { fontSize: 8, color: '86D7CE', bold: true, charSpacing: 0.8 });
  addText(s, 'Act before demand peaks', 3.75, 5.85, 2.2, 0.2, { fontSize: 13, color: C.white, bold: true });
  addText(s, 'React + TypeScript + Vite  |  Node.js API  |  OpenStreetMap', 0.75, 6.63, 7, 0.18, { fontSize: 8.5, color: '86A8C3' });
}

// 2. Problem
{
  const s = pptx.addSlide('MASTER');
  title(s, '01  /  The opportunity', 'Cash access is still a confidence problem.', 'People need to know an ATM can meet their withdrawal request before they make the trip.');
  card(s, 0.7, 2.05, 3.7, 3.75, C.white);
  iconCircle(s, '!', 1.0, 2.38, C.red);
  addText(s, 'Uncertain availability', 1.62, 2.42, 2.25, 0.25, { fontSize: 17, bold: true, color: C.navy });
  addText(s, 'A nearby ATM is not necessarily a useful ATM. Customers need a reliable cash signal, not just a pin on a map.', 1.0, 3.05, 2.95, 0.9, { fontSize: 13, color: C.muted, valign: 'top' });
  line(s, 1.0, 4.35, 3.95, 4.35, C.line);
  addText(s, 'FRICTION', 1.0, 4.6, 1, 0.18, { fontSize: 8, color: C.red, bold: true, charSpacing: 1 });
  addText(s, 'Wasted trips  /  failed withdrawals', 1.0, 4.9, 2.6, 0.25, { fontSize: 12.5, color: C.ink, bold: true });
  card(s, 4.82, 2.05, 3.7, 3.75, C.white);
  iconCircle(s, '↗', 5.12, 2.38, C.amber);
  addText(s, 'Demand is dynamic', 5.74, 2.42, 2.25, 0.25, { fontSize: 17, bold: true, color: C.navy });
  addText(s, 'Cash demand shifts with time, events, location, and withdrawal patterns. Static planning creates avoidable pressure.', 5.12, 3.05, 2.95, 0.9, { fontSize: 13, color: C.muted, valign: 'top' });
  line(s, 5.12, 4.35, 8.07, 4.35, C.line);
  addText(s, 'RISK', 5.12, 4.6, 1, 0.18, { fontSize: 8, color: 'B47A00', bold: true, charSpacing: 1 });
  addText(s, 'Emergency replenishment  /  downtime', 5.12, 4.9, 3.0, 0.25, { fontSize: 12.5, color: C.ink, bold: true });
  card(s, 8.95, 2.05, 3.7, 3.75, C.white);
  iconCircle(s, '◎', 9.25, 2.38, C.blue);
  addText(s, 'Operations need context', 9.87, 2.42, 2.45, 0.25, { fontSize: 17, bold: true, color: C.navy });
  addText(s, 'Banking teams need one view of health, cash levels, priority terminals, and the next best action.', 9.25, 3.05, 2.95, 0.9, { fontSize: 13, color: C.muted, valign: 'top' });
  line(s, 9.25, 4.35, 12.2, 4.35, C.line);
  addText(s, 'VISIBILITY', 9.25, 4.6, 1.2, 0.18, { fontSize: 8, color: C.blue, bold: true, charSpacing: 1 });
  addText(s, 'Signals into decisions', 9.25, 4.9, 2.3, 0.25, { fontSize: 12.5, color: C.ink, bold: true });
  addText(s, 'CashReady connects the customer question “where can I withdraw?” to the operator question “where should we act next?”', 0.75, 6.35, 11.5, 0.35, { fontSize: 16, color: C.navy, bold: true, align: 'center' });
}

// 3. Solution
{
  const s = pptx.addSlide('MASTER');
  title(s, '02  /  The solution', 'One platform. Two perspectives. A shared cash signal.', 'CashReady turns location, availability, demand, and operational data into practical next steps.');
  const steps = [
    ['01', 'Search', 'Customer enters a withdrawal amount and confirms the daily limit.'],
    ['02', 'Recommend', 'AI scores nearby ATMs using location, health, and sufficiency.'],
    ['03', 'Navigate', 'Map view shows eligible locations and route guidance.'],
    ['04', 'Operate', 'Bankers monitor fleet health and prioritize replenishment.'],
  ];
  steps.forEach((item, i) => {
    const x = 0.75 + i * 3.1;
    card(s, x, 2.15, 2.65, 2.65, i === 1 ? 'EAF6F3' : C.white, i === 1 ? 'BCE8DE' : C.line);
    addText(s, item[0], x + 0.24, 2.42, 0.45, 0.3, { fontSize: 13, color: i === 1 ? C.teal : C.blue, bold: true });
    line(s, x + 0.24, 2.9, x + 2.35, 2.9, i === 1 ? 'BCE8DE' : C.line);
    addText(s, item[1], x + 0.24, 3.22, 2.0, 0.3, { fontFace: 'Aptos Display', fontSize: 21, color: C.navy, bold: true });
    addText(s, item[2], x + 0.24, 3.75, 2.05, 0.65, { fontSize: 11.5, color: C.muted, valign: 'top' });
    if (i < 3) addText(s, '→', x + 2.7, 3.2, 0.35, 0.3, { fontSize: 20, color: C.teal, bold: true, align: 'center' });
  });
  card(s, 0.75, 5.38, 11.9, 0.78, C.navy, C.navy);
  addText(s, 'Design principle', 1.05, 5.58, 1.3, 0.18, { fontSize: 8, color: '86D7CE', bold: true, charSpacing: 1 });
  addText(s, 'Never fabricate cash availability: when a provider is not configured, the UI says so clearly.', 2.65, 5.53, 8.9, 0.28, { fontSize: 15, color: C.white, bold: true });
}

// 4. Customer journey
{
  const s = pptx.addSlide('MASTER');
  title(s, '03  /  Customer experience', 'From “How much do I need?” to “I know where to go.”', 'The customer flow is designed to reduce uncertainty before the journey begins.');
  const phases = [
    ['1', 'Set intent', 'Enter amount', '₹50,000'],
    ['2', 'Validate', 'Check limit', '₹75,000 daily'],
    ['3', 'Match', 'Receive eligible ATMs', 'AI score + distance'],
    ['4', 'Move', 'Open live map', 'Route to cash'],
  ];
  phases.forEach((p, i) => {
    const x = 0.88 + i * 3.05;
    iconCircle(s, p[0], x, 2.25, i === 2 ? C.teal : C.blue);
    if (i < 3) line(s, x + 0.47, 2.48, x + 2.58, 2.48, C.teal, 1.5);
    addText(s, p[1], x, 3.0, 2.25, 0.25, { fontSize: 16, color: C.navy, bold: true });
    addText(s, p[2], x, 3.42, 2.25, 0.22, { fontSize: 11, color: C.muted });
    card(s, x, 3.92, 2.35, 0.82, i === 2 ? 'EAF6F3' : C.white, i === 2 ? 'BCE8DE' : C.line);
    addText(s, p[3], x + 0.16, 4.18, 2.03, 0.2, { fontSize: 13, color: i === 2 ? C.teal : C.ink, bold: true, align: 'center' });
  });
  card(s, 0.88, 5.55, 11.85, 0.58, C.sky, C.sky);
  addText(s, 'Built-in guardrail', 1.12, 5.74, 1.25, 0.15, { fontSize: 8, color: C.blue, bold: true, charSpacing: 0.8 });
  addText(s, 'Requests above the daily limit are rejected before recommendation begins.', 2.65, 5.68, 8.6, 0.25, { fontSize: 13, color: C.navy, bold: true });
}

// 5. Intelligence
{
  const s = pptx.addSlide('MASTER');
  title(s, '04  /  Intelligence layer', 'Recommendations are explainable by design.', 'CashReady combines live context and historical signals without hiding the reason behind a recommendation.');
  card(s, 0.75, 2.08, 5.25, 3.9, C.navy, C.navy);
  addText(s, 'RECOMMENDATION INPUTS', 1.08, 2.4, 2.5, 0.2, { fontSize: 8, color: '86D7CE', bold: true, charSpacing: 1.2 });
  const inputs = [['⌖', 'Customer location'], ['₹', 'Requested amount'], ['◷', 'ATM health'], ['↗', 'Historical usage']];
  inputs.forEach((item, i) => {
    const y = 2.92 + i * 0.64;
    iconCircle(s, item[0], 1.08, y, i % 2 ? C.teal : C.blue);
    addText(s, item[1], 1.72, y + 0.1, 2.8, 0.22, { fontSize: 13, color: C.white, bold: true });
    line(s, 4.35, y + 0.23, 5.5, y + 0.23, '315473', 1, 'dash');
  });
  card(s, 6.45, 2.08, 6.18, 3.9, C.white);
  addText(s, 'EXAMPLE RESULT', 6.8, 2.4, 2.2, 0.2, { fontSize: 8, color: C.teal, bold: true, charSpacing: 1.2 });
  addText(s, 'Best match near you', 6.8, 2.82, 3.4, 0.3, { fontSize: 19, color: C.navy, bold: true });
  addText(s, 'HDFC Bank ATM  ·  1.8 KM', 6.8, 3.22, 3.8, 0.22, { fontSize: 12, color: C.muted });
  card(s, 6.8, 3.72, 2.0, 0.82, 'EAF6F3', 'BCE8DE');
  addText(s, '92', 7.0, 3.87, 0.8, 0.35, { fontSize: 26, color: C.teal, bold: true });
  addText(s, 'sufficiency\nscore', 7.85, 3.88, 0.68, 0.35, { fontSize: 9, color: C.teal, bold: true, valign: 'mid' });
  addText(s, 'Why this match?', 9.25, 3.76, 2.1, 0.2, { fontSize: 11, color: C.navy, bold: true });
  addText(s, '• Nearby\n• Cash likely sufficient\n• Healthy terminal signal', 9.25, 4.08, 2.4, 0.85, { fontSize: 11.5, color: C.muted, valign: 'top' });
  line(s, 6.8, 5.25, 12.15, 5.25, C.line);
  addText(s, 'Provider truth matters', 6.8, 5.45, 1.65, 0.18, { fontSize: 9, color: C.blue, bold: true });
  addText(s, 'The API proxy protects provider credentials and keeps unavailable data visibly unavailable.', 8.58, 5.4, 3.3, 0.3, { fontSize: 10.5, color: C.ink, bold: true });
}

// 6. Banker dashboard
{
  const s = pptx.addSlide('MASTER');
  title(s, '05  /  Banker operations', 'A live command view for the ATM network.', 'Bank Analytics turns fleet signals into a prioritized operating rhythm.');
  const kpis = [['ATMs monitored', '2,450', 'Live network count', C.blue], ['Cash availability', '98.7%', 'Provider signal', C.teal], ['Daily withdrawals', '₹12.4M', 'Delhi NCR estimate', C.blue], ['Needs attention', '5', '2 critical terminals', C.red]];
  kpis.forEach((k, i) => { const x = 0.75 + i * 3.02; card(s, x, 2.05, 2.68, 1.0, C.white); addText(s, k[0].toUpperCase(), x + 0.18, 2.25, 2.2, 0.14, { fontSize: 7.5, color: C.muted, bold: true, charSpacing: 0.7 }); addText(s, k[1], x + 0.18, 2.5, 1.45, 0.3, { fontSize: 23, color: k[3], bold: true }); addText(s, k[2], x + 0.18, 2.86, 2.1, 0.14, { fontSize: 8.5, color: C.muted }); });
  card(s, 0.75, 3.42, 7.15, 2.35, C.white);
  addText(s, 'CASH DEMAND TREND', 1.0, 3.7, 2.1, 0.17, { fontSize: 8, color: C.blue, bold: true, charSpacing: 1 });
  addText(s, 'Average cash dispensed, ₹ thousands', 1.0, 3.98, 3.3, 0.18, { fontSize: 10, color: C.muted });
  const bars = [0.72, 0.9, 0.64, 1.16, 0.98, 1.38];
  bars.forEach((height, i) => { const x = 1.1 + i * 0.75; const h = height; s.addShape(pptx.ShapeType.rect, { x, y: 5.28 - h, w: 0.38, h, fill: { color: i === 5 ? C.teal : C.blue, transparency: i === 5 ? 0 : 18 }, line: { color: i === 5 ? C.teal : C.blue, transparency: 100 } }); addText(s, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i], x - 0.05, 5.4, 0.5, 0.15, { fontSize: 8, color: C.muted, align: 'center' }); });
  line(s, 1.05, 5.3, 5.9, 5.3, C.line);
  card(s, 8.18, 3.42, 4.45, 2.35, C.white);
  addText(s, 'ATM HEALTH', 8.48, 3.7, 1.3, 0.17, { fontSize: 8, color: C.teal, bold: true, charSpacing: 1 });
  s.addShape(pptx.ShapeType.arc, { x: 8.7, y: 4.12, w: 1.35, h: 1.35, line: { color: C.teal, width: 12 }, adjustPoint: 0.2, rotate: 35 });
  s.addShape(pptx.ShapeType.arc, { x: 8.7, y: 4.12, w: 1.35, h: 1.35, line: { color: C.amber, width: 12 }, adjustPoint: 0.2, rotate: 145 });
  s.addShape(pptx.ShapeType.arc, { x: 8.7, y: 4.12, w: 1.35, h: 1.35, line: { color: C.red, width: 12 }, adjustPoint: 0.2, rotate: 220 });
  addText(s, '140', 9.03, 4.55, 0.7, 0.25, { fontSize: 19, color: C.navy, bold: true, align: 'center' });
  addText(s, 'active ATMs', 8.85, 4.88, 1.1, 0.15, { fontSize: 8, color: C.muted, align: 'center' });
  addText(s, 'Healthy  132', 10.45, 4.25, 1.55, 0.18, { fontSize: 10.5, color: C.ink, bold: true });
  addText(s, 'Low cash  6', 10.45, 4.58, 1.55, 0.18, { fontSize: 10.5, color: 'B47A00', bold: true });
  addText(s, 'Critical  2', 10.45, 4.91, 1.55, 0.18, { fontSize: 10.5, color: C.red, bold: true });
}

// 7. Architecture
{
  const s = pptx.addSlide('MASTER');
  title(s, '06  /  Product architecture', 'A focused full-stack foundation.', 'The current implementation keeps user experience, recommendation logic, and provider access cleanly separated.');
  const cols = [
    { x: 0.75, name: 'Experience', color: C.blue, items: ['React 19', 'TypeScript', 'React Router', 'Material UI', 'Leaflet maps', 'Recharts'] },
    { x: 4.62, name: 'Application API', color: C.teal, items: ['Node.js HTTP server', 'Auth + sessions', 'ATM recommendation', 'Banker dashboard', 'Contact submissions', 'Rate limiting'] },
    { x: 8.49, name: 'Data + providers', color: C.amber, items: ['SQLite + WAL', 'scrypt password hashes', 'OpenStreetMap / Nominatim', 'ATM provider proxy', 'Forecast persistence', 'Environment secrets'] },
  ];
  cols.forEach((col, i) => {
    card(s, col.x, 2.0, 3.35, 3.8, C.white);
    s.addShape(pptx.ShapeType.rect, { x: col.x, y: 2.0, w: 3.35, h: 0.12, fill: { color: col.color }, line: { color: col.color } });
    addText(s, col.name, col.x + 0.27, 2.42, 2.6, 0.28, { fontFace: 'Aptos Display', fontSize: 20, color: C.navy, bold: true });
    col.items.forEach((item, j) => { iconCircle(s, '·', col.x + 0.27, 3.0 + j * 0.39, col.color); addText(s, item, col.x + 0.9, 3.08 + j * 0.39, 2.1, 0.18, { fontSize: 11.5, color: C.ink, bold: j === 0 }); });
    if (i < 2) addText(s, '→', col.x + 3.45, 3.65, 0.35, 0.28, { fontSize: 22, color: C.teal, bold: true, align: 'center' });
  });
  addText(s, 'Browser', 1.88, 6.2, 1, 0.18, { fontSize: 9, color: C.blue, bold: true, align: 'center' });
  addText(s, 'Protected API boundary', 5.3, 6.2, 2.1, 0.18, { fontSize: 9, color: C.teal, bold: true, align: 'center' });
  addText(s, 'Operational data', 9.6, 6.2, 1.7, 0.18, { fontSize: 9, color: 'B47A00', bold: true, align: 'center' });
}

// 8. Security and roadmap
{
  const s = pptx.addSlide('MASTER');
  title(s, '07  /  Readiness', 'A strong demo foundation with a clear path to production.', 'The project already demonstrates the core workflow; the next step is hardening the surrounding operating model.');
  card(s, 0.75, 2.05, 5.55, 3.75, C.white);
  addText(s, 'Already in place', 1.08, 2.4, 2.4, 0.3, { fontFace: 'Aptos Display', fontSize: 21, color: C.navy, bold: true });
  const done = ['Role-based customer and banker login', 'scrypt password hashing and bearer sessions', 'Provider credentials kept server-side', 'Live location and map fallback behavior', 'ATM recommendation and forecast persistence'];
  done.forEach((item, i) => { iconCircle(s, '✓', 1.08, 2.98 + i * 0.46, C.teal); addText(s, item, 1.72, 3.08 + i * 0.46, 3.95, 0.18, { fontSize: 11.5, color: C.ink, bold: i === 0 }); });
  card(s, 6.62, 2.05, 6.0, 3.75, C.navy, C.navy);
  addText(s, 'Production next steps', 6.95, 2.4, 3.3, 0.3, { fontFace: 'Aptos Display', fontSize: 21, color: C.white, bold: true });
  const next = [['01', 'Connect a managed ATM provider'], ['02', 'Move local data to managed storage'], ['03', 'Add observability and alerting'], ['04', 'Expand automated test coverage']];
  next.forEach((item, i) => { addText(s, item[0], 6.95, 3.02 + i * 0.52, 0.38, 0.18, { fontSize: 9, color: '86D7CE', bold: true }); addText(s, item[1], 7.52, 3.0 + i * 0.52, 4.35, 0.22, { fontSize: 12.5, color: C.white, bold: true }); line(s, 7.52, 3.35 + i * 0.52, 12.05, 3.35 + i * 0.52, '315473', 0.8); });
  addText(s, 'CashReady makes the invisible infrastructure of cash visible, actionable, and easier to trust.', 0.9, 6.35, 11.55, 0.35, { fontFace: 'Aptos Display', fontSize: 20, color: C.navy, bold: true, align: 'center' });
}

const output = path.join(__dirname, '..', 'CashReady-Project-Presentation.pptx');
pptx.writeFile({ fileName: output });
console.log(`Created ${output}`);
