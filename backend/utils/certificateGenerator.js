const fs = require('fs');
const path = require('path');

/**
 * Generates an SVG certificate.
 * @param {Object} data
 * @param {string} data.name - Student name
 * @param {string} data.eventTitle - Event title
 * @param {string} data.date - Event date (formatted)
 * @param {string} [data.backgroundUrl] - Optional URL or path to background image
 * @returns {string} SVG xml content
 */
const generateCertificateSVG = ({ name, eventTitle, date, backgroundUrl }) => {
  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : 'N/A';

  // Base canvas dimensions: 800 x 600 (standard landscape letter aspect ratio)
  if (backgroundUrl) {
    // If a custom background is provided, embed it and overlay text
    // The backgroundUrl can be a local path or web URL, if local we can serve it or encode it
    return `<?xml version="1.0" standalone="no"?>
      <svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&amp;family=Montserrat:wght@400;600&amp;family=Great+Vibes&amp;display=swap');
            .title { font-family: 'Cinzel', serif; font-weight: 700; fill: #1a1a1a; text-anchor: middle; }
            .subtitle { font-family: 'Montserrat', sans-serif; font-weight: 400; fill: #555555; text-anchor: middle; font-size: 16px; }
            .name { font-family: 'Cinzel', serif; font-weight: 700; fill: #c5a059; text-anchor: middle; font-size: 36px; }
            .event { font-family: 'Montserrat', sans-serif; font-weight: 600; fill: #111111; text-anchor: middle; font-size: 24px; }
            .date { font-family: 'Montserrat', sans-serif; fill: #666666; text-anchor: middle; font-size: 14px; }
          </style>
        </defs>

        <!-- Background Image -->
        <image href="${backgroundUrl}" x="0" y="0" width="800" height="600" preserveAspectRatio="xMidYMid slice" />

        <!-- Certificate Content Overlays -->
        <text x="400" y="160" class="title" font-size="32">CERTIFICATE OF PARTICIPATION</text>
        <text x="400" y="210" class="subtitle">This is proudly presented to</text>
        
        <!-- Recipient Name -->
        <text x="400" y="280" class="name">${name.toUpperCase()}</text>
        
        <text x="400" y="340" class="subtitle">for actively participating and completing the event</text>
        
        <!-- Event Title -->
        <text x="400" y="390" class="event">${eventTitle}</text>
        
        <!-- Date -->
        <text x="400" y="450" class="date">Given on this day, ${formattedDate}</text>
      </svg>
    `;
  }

  // Beautiful gold/navy default border template
  return `<?xml version="1.0" standalone="no"?>
    <svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&amp;family=Montserrat:wght@400;500;600&amp;family=Pinyon+Script&amp;display=swap');
          
          .bg { fill: #fcfbfa; }
          .border-outer { fill: none; stroke: #1b263b; stroke-width: 14; }
          .border-inner { fill: none; stroke: #c5a059; stroke-width: 2; }
          
          .badge-gold { fill: url(#gold-gradient); }
          .seal-ribbon { fill: #e07a5f; }
          
          .cert-title { font-family: 'Cinzel', serif; font-weight: 900; fill: #0d1b2a; text-anchor: middle; font-size: 34px; letter-spacing: 2px; }
          .cert-subtitle { font-family: 'Montserrat', sans-serif; font-weight: 500; fill: #415a77; text-anchor: middle; font-size: 14px; letter-spacing: 4px; }
          .cert-to { font-family: 'Pinyon Script', cursive; fill: #1b263b; text-anchor: middle; font-size: 42px; }
          
          .cert-name { font-family: 'Cinzel', serif; font-weight: 700; fill: #c5a059; text-anchor: middle; font-size: 38px; letter-spacing: 1px; }
          .cert-desc { font-family: 'Montserrat', sans-serif; font-weight: 400; fill: #415a77; text-anchor: middle; font-size: 14px; line-height: 1.6; }
          .cert-event { font-family: 'Cinzel', serif; font-weight: 700; fill: #0d1b2a; text-anchor: middle; font-size: 22px; }
          
          .cert-meta-label { font-family: 'Montserrat', sans-serif; font-weight: 600; fill: #778da9; text-anchor: middle; font-size: 11px; letter-spacing: 1px; }
          .cert-meta-val { font-family: 'Montserrat', sans-serif; font-weight: 500; fill: #1b263b; text-anchor: middle; font-size: 13px; }
          
          .signature-line { stroke: #c5a059; stroke-width: 1.5; }
        </style>
        
        <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#b89742" />
          <stop offset="30%" stop-color="#f3e5ab" />
          <stop offset="70%" stop-color="#d4af37" />
          <stop offset="100%" stop-color="#aa7c11" />
        </linearGradient>
      </defs>

      <!-- Base Canvas Background -->
      <rect width="800" height="600" class="bg" />

      <!-- Ornate Border Layout -->
      <rect x="20" y="20" width="760" height="560" class="border-outer" />
      <rect x="32" y="32" width="736" height="536" class="border-inner" />
      
      <!-- Corner Decorations -->
      <g stroke="#c5a059" stroke-width="2" fill="none">
        <!-- Top Left -->
        <path d="M 32 60 L 60 32 M 32 75 L 75 32 M 32 90 L 90 32" />
        <!-- Top Right -->
        <path d="M 768 60 L 740 32 M 768 75 L 725 32 M 768 90 L 710 32" />
        <!-- Bottom Left -->
        <path d="M 32 540 L 60 568 M 32 525 L 75 568 M 32 510 L 90 568" />
        <!-- Bottom Right -->
        <path d="M 768 540 L 740 568 M 768 525 L 725 568 M 768 510 L 710 568" />
      </g>

      <!-- Certificate Header -->
      <text x="400" y="110" class="cert-title">CERTIFICATE OF EXCELLENCE</text>
      <text x="400" y="140" class="cert-subtitle">THIS IS PROUDLY PRESENTED TO</text>
      
      <!-- Presenter Seal Line -->
      <text x="400" y="200" class="cert-to">Honorable Student</text>

      <!-- Recipient Name -->
      <text x="400" y="260" class="cert-name">${name.toUpperCase()}</text>
      
      <text x="400" y="315" class="cert-desc">for outstanding and active participation in the event</text>
      
      <!-- Event Name -->
      <text x="400" y="365" class="cert-event">${eventTitle}</text>
      
      <text x="400" y="410" class="cert-desc">conducted with highest academic and professional standards.</text>

      <!-- Footer Signatures & Seals -->
      
      <!-- Date Column (Left) -->
      <line x1="120" y1="500" x2="270" y2="500" class="signature-line" />
      <text x="195" y="490" class="cert-meta-val">${formattedDate}</text>
      <text x="195" y="520" class="cert-meta-label">DATE OF CONVICTION</text>

      <!-- Ornate Seal (Center) -->
      <g transform="translate(400, 490) scale(0.8)">
        <!-- Ribbons -->
        <path d="M -15 20 L -30 65 L 0 50 L 30 65 L 15 20 Z" class="seal-ribbon" />
        <path d="M 0 20 L -15 65 L 10 55 L 35 60 L 15 20 Z" class="seal-ribbon" opacity="0.8" />
        
        <!-- Seal Circle -->
        <circle r="32" class="badge-gold" filter="drop-shadow(0px 3px 3px rgba(0,0,0,0.15))" />
        <circle r="26" fill="none" stroke="#aa7c11" stroke-dasharray="3,3" stroke-width="1.5" />
        <polygon points="0,-16 5,-5 16,-5 8,3 11,14 0,7 -11,14 -8,3 -16,-5 -5,-5" fill="#1b263b" transform="scale(0.8)" />
      </g>
      
      <!-- Signature Column (Right) -->
      <line x1="530" y1="500" x2="680" y2="500" class="signature-line" />
      <!-- Signature Placeholder SVG Script -->
      <path d="M 545 490 Q 560 460 590 485 T 630 470 T 670 488" fill="none" stroke="#1b263b" stroke-width="2" />
      <text x="605" y="520" class="cert-meta-label">ORGANIZING CHAIR</text>
    </svg>
  `;
};

module.exports = {
  generateCertificateSVG,
};
