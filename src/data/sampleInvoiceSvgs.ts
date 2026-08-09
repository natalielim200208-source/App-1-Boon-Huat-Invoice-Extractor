// Helper utility to generate realistic SVG Data URLs for Madam Lim's 7 test sample invoices

function encodeSvg(svgString: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
}

// 1. Clean Match - Tan Brothers Metal Works
export const TAN_BROTHERS_INV_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" style="background:#ffffff; font-family: Arial, sans-serif;">
  <rect width="800" height="1000" fill="#ffffff" />
  <rect x="20" y="20" width="760" height="960" fill="none" stroke="#e2e8f0" stroke-width="2" />
  
  <!-- Header -->
  <rect x="50" y="50" width="60" height="60" fill="#1e3a8a" rx="8" />
  <text x="80" y="90" fill="#ffffff" font-size="32" font-weight="bold" text-anchor="middle">TB</text>
  
  <text x="125" y="70" font-size="22" font-weight="bold" fill="#0f172a">TAN BROTHERS METAL WORKS PTE LTD</text>
  <text x="125" y="90" font-size="12" fill="#475569">18 Gul Avenue, Jurong Industrial Estate, Singapore 629662</text>
  <text x="125" y="105" font-size="12" fill="#475569">Tel: +65 6861 4321 | Reg No: 199804210K | GST Reg: M2-0128459-X</text>
  
  <line x1="50" y1="130" x2="750" y2="130" stroke="#cbd5e1" stroke-width="2" />
  
  <!-- Title & Invoice Info -->
  <text x="50" y="170" font-size="28" font-weight="bold" fill="#1e3a8a">TAX INVOICE</text>
  
  <rect x="480" y="145" width="270" height="110" fill="#f8fafc" stroke="#cbd5e1" rx="6" />
  <text x="495" y="170" font-size="12" font-weight="bold" fill="#334155">INVOICE NO:</text>
  <text x="610" y="170" font-size="13" font-weight="bold" fill="#1e40af">TB-INV-9901</text>
  
  <text x="495" y="192" font-size="12" font-weight="bold" fill="#334155">INVOICE DATE:</text>
  <text x="610" y="192" font-size="12" fill="#0f172a">22/07/2026</text>
  
  <text x="495" y="214" font-size="12" font-weight="bold" fill="#334155">PO NUMBER:</text>
  <text x="610" y="214" font-size="12" font-weight="bold" fill="#1e40af">PO-2026-001</text>
  
  <text x="495" y="236" font-size="12" font-weight="bold" fill="#334155">PAYMENT TERMS:</text>
  <text x="610" y="236" font-size="12" fill="#0f172a">Net 30 Days (21/08/2026)</text>

  <!-- Billed To -->
  <text x="50" y="210" font-size="11" font-weight="bold" fill="#64748b" letter-spacing="1">BILLED TO:</text>
  <text x="50" y="230" font-size="14" font-weight="bold" fill="#0f172a">BOON HUAT HARDWARE &amp; SUPPLIES PTE LTD</text>
  <text x="50" y="248" font-size="12" fill="#334155">Blk 3012 Bedok Industrial Park E #01-2008</text>
  <text x="50" y="264" font-size="12" fill="#334155">Singapore 489978</text>
  <text x="50" y="280" font-size="12" fill="#334155">Attn: Accounts Payable / Madam Lim</text>

  <!-- Line Items Table -->
  <rect x="50" y="310" width="700" height="35" fill="#1e3a8a" rx="4" />
  <text x="70" y="332" font-size="12" font-weight="bold" fill="#ffffff">ITEM / DESCRIPTION</text>
  <text x="450" y="332" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="end">QTY</text>
  <text x="580" y="332" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="end">UNIT PRICE ($)</text>
  <text x="730" y="332" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="end">AMOUNT ($)</text>

  <!-- Item Row 1 -->
  <text x="70" y="375" font-size="13" font-weight="bold" fill="#0f172a">Galvanised Steel Bolts (M12 x 50mm)</text>
  <text x="70" y="395" font-size="11" fill="#64748b">Grade 8.8 High Tensile Steel Hex Head Bolts</text>
  <text x="450" y="375" font-size="13" fill="#0f172a" text-anchor="end">500 pcs</text>
  <text x="580" y="375" font-size="13" fill="#0f172a" text-anchor="end">1.50</text>
  <text x="730" y="375" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="end">750.00</text>
  
  <line x1="50" y1="420" x2="750" y2="420" stroke="#e2e8f0" stroke-width="1" />

  <!-- Totals Section -->
  <rect x="430" y="440" width="320" height="130" fill="#f8fafc" stroke="#cbd5e1" rx="6" />
  
  <text x="450" y="470" font-size="12" fill="#475569">SUBTOTAL:</text>
  <text x="730" y="470" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="end">$750.00</text>
  
  <text x="450" y="495" font-size="12" fill="#475569">GST (9%):</text>
  <text x="730" y="495" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="end">$67.50</text>
  
  <line x1="450" y1="510" x2="730" y2="510" stroke="#cbd5e1" stroke-width="1" />
  
  <text x="450" y="540" font-size="15" font-weight="bold" fill="#1e3a8a">TOTAL AMOUNT DUE:</text>
  <text x="730" y="540" font-size="18" font-weight="bold" fill="#1e3a8a" text-anchor="end">$817.50</text>

  <!-- Bank details -->
  <rect x="50" y="600" width="350" height="120" fill="#f1f5f9" stroke="#cbd5e1" rx="6" />
  <text x="65" y="625" font-size="12" font-weight="bold" fill="#334155">PAYMENT INSTRUCTIONS (DBS BANK)</text>
  <text x="65" y="645" font-size="11" fill="#475569">Bank Name: DBS Bank Ltd</text>
  <text x="65" y="662" font-size="11" fill="#475569">Account Name: Tan Brothers Metal Works Pte Ltd</text>
  <text x="65" y="679" font-size="11" fill="#475569">Account No: 003-901248-1</text>
  <text x="65" y="696" font-size="11" fill="#475569">PayNow UEN: 199804210K</text>

  <!-- Stamp -->
  <g transform="translate(560, 620) rotate(-12)">
    <rect x="0" y="0" width="160" height="60" fill="none" stroke="#dc2626" stroke-width="3" rx="4" stroke-dasharray="8 4" />
    <text x="80" y="25" font-size="14" font-weight="bold" fill="#dc2626" text-anchor="middle">GOODS DELIVERED</text>
    <text x="80" y="45" font-size="11" fill="#dc2626" text-anchor="middle">TAN BROTHERS OFFICIAL</text>
  </g>

  <!-- Footer -->
  <text x="400" y="940" font-size="11" fill="#94a3b8" text-anchor="middle">Thank you for your business! Please quote Invoice No. on all remittance advices.</text>
</svg>
`);

// 2. Quantity Mismatch - Lian Seng Hardware
export const LIAN_SENG_INV_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" style="background:#ffffff; font-family: Arial, sans-serif;">
  <rect width="800" height="1000" fill="#ffffff" />
  <rect x="20" y="20" width="760" height="960" fill="none" stroke="#e2e8f0" stroke-width="2" />
  
  <text x="50" y="70" font-size="24" font-weight="bold" fill="#15803d">LIAN SENG HARDWARE PTE LTD</text>
  <text x="50" y="90" font-size="12" fill="#475569">45 Kallang Pudding Road #02-01, Singapore 349317</text>
  <text x="50" y="105" font-size="12" fill="#475569">Tel: 6748 9911 | Co. Reg: 200511892M</text>

  <rect x="520" y="45" width="230" height="90" fill="#f0fdf4" stroke="#86efac" rx="6" />
  <text x="535" y="70" font-size="12" font-weight="bold" fill="#166534">INVOICE NO:</text>
  <text x="630" y="70" font-size="14" font-weight="bold" fill="#15803d">LS-2026-442</text>
  <text x="535" y="92" font-size="12" fill="#166534">DATE: 24/07/2026</text>
  <text x="535" y="114" font-size="12" font-weight="bold" fill="#166534">PO REF: PO-2026-002</text>

  <line x1="50" y1="140" x2="750" y2="140" stroke="#bbf7d0" stroke-width="2" />

  <text x="50" y="180" font-size="12" font-weight="bold" fill="#166534">TO: BOON HUAT HARDWARE &amp; SUPPLIES PTE LTD</text>

  <rect x="50" y="220" width="700" height="35" fill="#15803d" rx="4" />
  <text x="70" y="242" font-size="12" font-weight="bold" fill="#ffffff">DESCRIPTION</text>
  <text x="450" y="242" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="end">BILLED QTY</text>
  <text x="580" y="242" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="end">PRICE ($)</text>
  <text x="730" y="242" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="end">TOTAL ($)</text>

  <text x="70" y="280" font-size="13" font-weight="bold" fill="#0f172a">Heavy Duty Brass Valves 2"</text>
  <text x="450" y="280" font-size="13" font-weight="bold" fill="#b91c1c" text-anchor="end">100 pcs</text>
  <text x="580" y="280" font-size="13" fill="#0f172a" text-anchor="end">42.00</text>
  <text x="730" y="280" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="end">4,200.00</text>

  <text x="450" y="340" font-size="12" fill="#475569">SUBTOTAL:</text>
  <text x="730" y="340" font-size="13" font-weight="bold" text-anchor="end">$4,200.00</text>
  <text x="450" y="365" font-size="12" fill="#475569">GST (9%):</text>
  <text x="730" y="365" font-size="13" font-weight="bold" text-anchor="end">$378.00</text>
  <text x="450" y="400" font-size="16" font-weight="bold" fill="#15803d">TOTAL DUE:</text>
  <text x="730" y="400" font-size="18" font-weight="bold" fill="#15803d" text-anchor="end">$4,578.00</text>

  <!-- Warning annotation sticker on image -->
  <g transform="translate(60, 420)">
    <rect x="0" y="0" width="360" height="90" fill="#fef2f2" stroke="#f87171" stroke-width="2" rx="8" />
    <text x="15" y="25" font-size="12" font-weight="bold" fill="#991b1b">⚠️ AUDIT WARNING FOR ACCOUNTS (MADAM LIM):</text>
    <text x="15" y="45" font-size="11" fill="#7f1d1d">Billed for 100 valves on this invoice.</text>
    <text x="15" y="65" font-size="11" font-weight="bold" fill="#b91c1c">GRN-2026-102 confirms store only received 85 valves!</text>
  </g>
</svg>
`);

// 3. Damaged Goods Flag - Kian Ann
export const KIAN_ANN_INV_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" style="background:#ffffff; font-family: Arial, sans-serif;">
  <rect width="800" height="1000" fill="#ffffff" />
  <rect x="20" y="20" width="760" height="960" fill="none" stroke="#e2e8f0" stroke-width="2" />
  
  <text x="50" y="70" font-size="24" font-weight="bold" fill="#c2410c">KIAN ANN ENGINEERING PTE LTD</text>
  <text x="50" y="90" font-size="12" fill="#475569">10 Pioneer Sector 2, Singapore 628371</text>

  <rect x="520" y="45" width="230" height="90" fill="#fff7ed" stroke="#fdba74" rx="6" />
  <text x="535" y="70" font-size="12" font-weight="bold" fill="#9a3412">INVOICE NO:</text>
  <text x="630" y="70" font-size="14" font-weight="bold" fill="#c2410c">KA-88712</text>
  <text x="535" y="92" font-size="12" fill="#9a3412">DATE: 27/07/2026</text>
  <text x="535" y="114" font-size="12" font-weight="bold" fill="#9a3412">PO REF: PO-2026-008</text>

  <rect x="50" y="220" width="700" height="35" fill="#c2410c" rx="4" />
  <text x="70" y="242" font-size="12" font-weight="bold" fill="#ffffff">DESCRIPTION</text>
  <text x="450" y="242" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="end">QTY</text>
  <text x="580" y="242" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="end">PRICE ($)</text>
  <text x="730" y="242" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="end">TOTAL ($)</text>

  <text x="70" y="280" font-size="13" font-weight="bold" fill="#0f172a">Industrial Rubber Seals (Pack of 10)</text>
  <text x="450" y="280" font-size="13" fill="#0f172a" text-anchor="end">50</text>
  <text x="580" y="280" font-size="13" fill="#0f172a" text-anchor="end">30.00</text>
  <text x="730" y="280" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="end">1,500.00</text>

  <text x="450" y="340" font-size="12" fill="#475569">SUBTOTAL:</text>
  <text x="730" y="340" font-size="13" font-weight="bold" text-anchor="end">$1,500.00</text>
  <text x="450" y="365" font-size="12" fill="#475569">GST (9%):</text>
  <text x="730" y="365" font-size="13" font-weight="bold" text-anchor="end">$135.00</text>
  <text x="450" y="400" font-size="16" font-weight="bold" fill="#c2410c">TOTAL DUE:</text>
  <text x="730" y="400" font-size="18" font-weight="bold" fill="#c2410c" text-anchor="end">$1,635.00</text>

  <!-- Oil stain visual graphic -->
  <circle cx="680" cy="550" r="70" fill="#451a03" opacity="0.15" />
  <circle cx="640" cy="580" r="40" fill="#451a03" opacity="0.2" />
  
  <g transform="translate(60, 450)">
    <rect x="0" y="0" width="360" height="80" fill="#fff7ed" stroke="#f97316" stroke-width="2" rx="8" />
    <text x="15" y="25" font-size="12" font-weight="bold" fill="#c2410c">⚠️ GRN RECEIVING FLAG (GRN-2026-103):</text>
    <text x="15" y="45" font-size="11" fill="#7c2d12">Storeman noted: Packaging arrived oil-contaminated.</text>
    <text x="15" y="65" font-size="11" font-weight="bold" fill="#c2410c">Do not release payment until supplier replaces damaged seals!</text>
  </g>
</svg>
`);

// 4. No GRN - Guan Hoe Metal Supplies
export const GUAN_HOE_INV_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" style="background:#ffffff; font-family: Arial, sans-serif;">
  <rect width="800" height="1000" fill="#ffffff" />
  <rect x="20" y="20" width="760" height="960" fill="none" stroke="#e2e8f0" stroke-width="2" />
  
  <text x="50" y="70" font-size="24" font-weight="bold" fill="#0369a1">GUAN HOE METAL SUPPLIES PTE LTD</text>
  <text x="50" y="90" font-size="12" fill="#475569">12 Tuas Avenue 8, Singapore 639227</text>

  <rect x="520" y="45" width="230" height="90" fill="#f0f9ff" stroke="#7dd3fc" rx="6" />
  <text x="535" y="70" font-size="12" font-weight="bold" fill="#0369a1">INVOICE NO:</text>
  <text x="630" y="70" font-size="14" font-weight="bold" fill="#0284c7">GH-INV-5510</text>
  <text x="535" y="92" font-size="12" fill="#0369a1">DATE: 28/07/2026</text>
  <text x="535" y="114" font-size="12" font-weight="bold" fill="#0369a1">PO REF: PO-2026-005</text>

  <rect x="50" y="220" width="700" height="35" fill="#0284c7" rx="4" />
  <text x="70" y="242" font-size="12" font-weight="bold" fill="#ffffff">DESCRIPTION</text>
  <text x="450" y="242" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="end">QTY</text>
  <text x="580" y="242" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="end">PRICE ($)</text>
  <text x="730" y="242" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="end">TOTAL ($)</text>

  <text x="70" y="280" font-size="13" font-weight="bold" fill="#0f172a">Aluminum Angle Bars 3x3"</text>
  <text x="450" y="280" font-size="13" fill="#0f172a" text-anchor="end">80</text>
  <text x="580" y="280" font-size="13" fill="#0f172a" text-anchor="end">25.00</text>
  <text x="730" y="280" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="end">2,000.00</text>

  <text x="450" y="340" font-size="12" fill="#475569">SUBTOTAL:</text>
  <text x="730" y="340" font-size="13" font-weight="bold" text-anchor="end">$2,000.00</text>
  <text x="450" y="365" font-size="12" fill="#475569">GST (9%):</text>
  <text x="730" y="365" font-size="13" font-weight="bold" text-anchor="end">$180.00</text>
  <text x="450" y="400" font-size="16" font-weight="bold" fill="#0284c7">TOTAL DUE:</text>
  <text x="730" y="400" font-size="18" font-weight="bold" fill="#0284c7" text-anchor="end">$2,180.00</text>

  <g transform="translate(60, 450)">
    <rect x="0" y="0" width="380" height="80" fill="#fef2f2" stroke="#f87171" stroke-width="2" rx="8" />
    <text x="15" y="25" font-size="12" font-weight="bold" fill="#b91c1c">🚫 NO GRN FOUND IN WAREHOUSE LOG:</text>
    <text x="15" y="45" font-size="11" fill="#7f1d1d">PO-2026-005 exists, but storeman has not issued a GRN.</text>
    <text x="15" y="65" font-size="11" font-weight="bold" fill="#991b1b">Hold invoice until physical goods arrive at warehouse.</text>
  </g>
</svg>
`);

// 5. Duplicate Check - Tan Brothers INV-2026-089
export const DUPLICATE_INV_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" style="background:#ffffff; font-family: Arial, sans-serif;">
  <rect width="800" height="1000" fill="#ffffff" />
  <rect x="20" y="20" width="760" height="960" fill="none" stroke="#e2e8f0" stroke-width="2" />
  
  <text x="50" y="70" font-size="24" font-weight="bold" fill="#1e3a8a">TAN BROTHERS METAL WORKS PTE LTD</text>
  
  <rect x="520" y="45" width="230" height="90" fill="#fef2f2" stroke="#f87171" rx="6" />
  <text x="535" y="70" font-size="12" font-weight="bold" fill="#991b1b">INVOICE NO:</text>
  <text x="630" y="70" font-size="14" font-weight="bold" fill="#dc2626">INV-2026-089</text>
  <text x="535" y="92" font-size="12" fill="#991b1b">DATE: 02/07/2026</text>
  <text x="535" y="114" font-size="12" font-weight="bold" fill="#991b1b">PO REF: PO-2026-000</text>

  <rect x="50" y="220" width="700" height="35" fill="#dc2626" rx="4" />
  <text x="70" y="242" font-size="12" font-weight="bold" fill="#ffffff">DESCRIPTION</text>
  <text x="450" y="242" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="end">QTY</text>
  <text x="580" y="242" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="end">PRICE ($)</text>
  <text x="730" y="242" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="end">TOTAL ($)</text>

  <text x="70" y="280" font-size="13" font-weight="bold" fill="#0f172a">Mild Steel Sheets 4x8ft (x20)</text>
  <text x="450" y="280" font-size="13" fill="#0f172a" text-anchor="end">20</text>
  <text x="580" y="280" font-size="13" fill="#0f172a" text-anchor="end">155.96</text>
  <text x="730" y="280" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="end">3,119.27</text>

  <text x="450" y="340" font-size="12" fill="#475569">SUBTOTAL:</text>
  <text x="730" y="340" font-size="13" font-weight="bold" text-anchor="end">$3,119.27</text>
  <text x="450" y="365" font-size="12" fill="#475569">GST (9%):</text>
  <text x="730" y="365" font-size="13" font-weight="bold" text-anchor="end">$280.73</text>
  <text x="450" y="400" font-size="16" font-weight="bold" fill="#dc2626">TOTAL DUE:</text>
  <text x="730" y="400" font-size="18" font-weight="bold" fill="#dc2626" text-anchor="end">$3,400.00</text>

  <!-- Big Red DUPLICATE stamp -->
  <g transform="translate(180, 480) rotate(-20)">
    <rect x="0" y="0" width="440" height="110" fill="none" stroke="#dc2626" stroke-width="6" rx="10" />
    <text x="220" y="60" font-size="42" font-weight="bold" fill="#dc2626" text-anchor="middle">DUPLICATE INVOICE</text>
    <text x="220" y="90" font-size="16" font-weight="bold" fill="#dc2626" text-anchor="middle">ALREADY PAID ON 05/07/2026 - DO NOT RE-PROCESS</text>
  </g>
</svg>
`);

// 6. Handwritten Docket - Hock Seng Welding
export const HOCK_SENG_INV_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" style="background:#fffbeb; font-family: 'Courier New', Georgia, serif;">
  <!-- Yellowish pad paper background -->
  <rect width="800" height="1000" fill="#fffbeb" />
  
  <!-- Lined notebook paper effect -->
  <line x1="100" y1="0" x2="100" y2="1000" stroke="#fca5a5" stroke-width="2" />
  
  <g stroke="#e2e8f0" stroke-width="1">
    <line x1="0" y1="120" x2="800" y2="120" />
    <line x1="0" y1="160" x2="800" y2="160" />
    <line x1="0" y1="200" x2="800" y2="200" />
    <line x1="0" y1="240" x2="800" y2="240" />
    <line x1="0" y1="280" x2="800" y2="280" />
    <line x1="0" y1="320" x2="800" y2="320" />
    <line x1="0" y1="360" x2="800" y2="360" />
    <line x1="0" y1="400" x2="800" y2="400" />
    <line x1="0" y1="440" x2="800" y2="440" />
    <line x1="0" y1="480" x2="800" y2="480" />
    <line x1="0" y1="520" x2="800" y2="520" />
    <line x1="0" y1="560" x2="800" y2="560" />
    <line x1="0" y1="600" x2="800" y2="600" />
    <line x1="0" y1="640" x2="800" y2="640" />
  </g>

  <!-- Handwritten header -->
  <text x="120" y="80" font-size="26" font-weight="bold" fill="#1e1b4b" font-family="'Brush Script MT', cursive, sans-serif">Hock Seng Welding &amp; Repair Service</text>
  <text x="120" y="110" font-size="14" fill="#312e81">Hp: 9188 3321 (Ah Seng) | Defu Lane 10 #01-44</text>

  <!-- Docket number & Date -->
  <text x="120" y="152" font-size="16" font-weight="bold" fill="#1e40af">DOCKET NO: HS-WELD-007</text>
  
  <!-- Faint / Smudged date area -->
  <text x="480" y="152" font-size="16" font-weight="bold" fill="#1e40af">DATE:</text>
  <text x="540" y="152" font-size="18" font-weight="bold" fill="#0f172a">2026-07-29</text>
  
  <!-- Grease smudge graphic over date -->
  <ellipse cx="570" cy="150" rx="45" ry="25" fill="#78350f" opacity="0.4" />
  
  <text x="120" y="192" font-size="15" font-weight="bold" fill="#374151">CUSTOMER: Boon Huat Hardware</text>
  <text x="120" y="232" font-size="14" fill="#374151">PO NO: <tspan fill="#dc2626" font-weight="bold">(NONE STATED - EMERGENCY JOB)</tspan></text>

  <!-- Handwritten items -->
  <text x="120" y="312" font-size="18" font-weight="bold" fill="#1e1b4b" font-family="'Comic Sans MS', cursive">1. On-Site Emergency Welding Repair for Forklift Frame</text>
  <text x="140" y="352" font-size="14" fill="#4b5563">   - Re-welded cracked hydraulic arm bracket</text>
  <text x="140" y="392" font-size="14" fill="#4b5563">   - Transport + 2 hours labor included</text>

  <text x="620" y="312" font-size="20" font-weight="bold" fill="#1e1b4b">$450.00</text>

  <!-- Handwritten total -->
  <line x1="450" y1="460" x2="720" y2="460" stroke="#1e1b4b" stroke-width="2" />
  <text x="450" y="500" font-size="20" font-weight="bold" fill="#1e1b4b">TOTAL CASH DUE:</text>
  <text x="620" y="500" font-size="24" font-weight="bold" fill="#b91c1c">$450.00</text>

  <!-- Red CASH RECEIVED STAMP -->
  <g transform="translate(140, 520) rotate(-8)">
    <rect x="0" y="0" width="220" height="70" fill="none" stroke="#b91c1c" stroke-width="4" rx="6" />
    <text x="110" y="32" font-size="20" font-weight="bold" fill="#b91c1c" text-anchor="middle">PAID IN CASH</text>
    <text x="110" y="54" font-size="14" font-weight="bold" fill="#b91c1c" text-anchor="middle">SIGN: Ah Seng</text>
  </g>

  <!-- Warning callout -->
  <g transform="translate(100, 680)">
    <rect x="0" y="0" width="600" height="75" fill="#fef3c7" stroke="#f59e0b" stroke-width="2" rx="8" />
    <text x="15" y="25" font-size="12" font-weight="bold" fill="#92400e">⚠️ LOW CONFIDENCE FIELD NOTICE (AI VISION AUDIT):</text>
    <text x="15" y="45" font-size="11" fill="#78350f">Grease smudge on date line ("2026-07-??").</text>
    <text x="15" y="62" font-size="11" font-weight="bold" fill="#92400e">Madam Lim: Please inspect original receipt paper to verify date &amp; amount.</text>
  </g>
</svg>
`);

// 7. Clean Match - Apex Abrasives
export const APEX_ABRASIVES_INV_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" style="background:#ffffff; font-family: Arial, sans-serif;">
  <rect width="800" height="1000" fill="#ffffff" />
  <rect x="20" y="20" width="760" height="960" fill="none" stroke="#e2e8f0" stroke-width="2" />
  
  <text x="50" y="70" font-size="24" font-weight="bold" fill="#4338ca">APEX ABRASIVES PTE LTD</text>
  <text x="50" y="90" font-size="12" fill="#475569">8 Loyang Way 4, Singapore 507022</text>

  <rect x="520" y="45" width="230" height="90" fill="#eef2ff" stroke="#a5b4fc" rx="6" />
  <text x="535" y="70" font-size="12" font-weight="bold" fill="#3730a3">INVOICE NO:</text>
  <text x="630" y="70" font-size="14" font-weight="bold" fill="#4338ca">AA-INV-2026-09</text>
  <text x="535" y="92" font-size="12" fill="#3730a3">DATE: 29/07/2026</text>
  <text x="535" y="114" font-size="12" font-weight="bold" fill="#3730a3">PO REF: PO-2026-009</text>

  <rect x="50" y="220" width="700" height="35" fill="#4338ca" rx="4" />
  <text x="70" y="242" font-size="12" font-weight="bold" fill="#ffffff">DESCRIPTION</text>
  <text x="450" y="242" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="end">QTY</text>
  <text x="580" y="242" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="end">PRICE ($)</text>
  <text x="730" y="242" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="end">TOTAL ($)</text>

  <text x="70" y="280" font-size="13" font-weight="bold" fill="#0f172a">Grinding Discs (Box of 25)</text>
  <text x="450" y="280" font-size="13" fill="#0f172a" text-anchor="end">40</text>
  <text x="580" y="280" font-size="13" fill="#0f172a" text-anchor="end">27.00</text>
  <text x="730" y="280" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="end">1,080.00</text>

  <text x="450" y="340" font-size="12" fill="#475569">SUBTOTAL:</text>
  <text x="730" y="340" font-size="13" font-weight="bold" text-anchor="end">$1,080.00</text>
  <text x="450" y="365" font-size="12" fill="#475569">GST (9%):</text>
  <text x="730" y="365" font-size="13" font-weight="bold" text-anchor="end">$97.20</text>
  <text x="450" y="400" font-size="16" font-weight="bold" fill="#4338ca">TOTAL DUE:</text>
  <text x="730" y="400" font-size="18" font-weight="bold" fill="#4338ca" text-anchor="end">$1,177.20</text>

  <g transform="translate(560, 480) rotate(-10)">
    <rect x="0" y="0" width="160" height="50" fill="none" stroke="#16a34a" stroke-width="3" rx="4" />
    <text x="80" y="30" font-size="14" font-weight="bold" fill="#16a34a" text-anchor="middle">VERIFIED 100%</text>
  </g>
</svg>
`);
