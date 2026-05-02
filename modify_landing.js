const fs = require('fs');
let content = fs.readFileSync('/Users/aditya/Documents/kasp-hack/frontend/src/components/LandingPage.jsx', 'utf8');

// 1. Update COLORS
content = content.replace(/bg: '#0A0F1E',/, "bg: '#F6F6F7',");
content = content.replace(/card: '#111827',/, "card: '#FFFFFF',");
content = content.replace(/border: '#1F2937',/, "border: '#E1E3E5',");
content = content.replace(/green: '#00C87A',/, "green: '#008060',");
content = content.replace(/greenHover: '#00A866',/, "greenHover: '#005e46',");
content = content.replace(/text: '#F9FAFB',/, "text: '#202223',");
content = content.replace(/textSecondary: '#9CA3AF',/, "textSecondary: '#6D7175',");

// 2. NavBar simplification & logo
content = content.replace(
  /<NavBar onGetStarted={onGetStarted} scrolled={scrolled} \/>/,
  "<NavBar scrolled={scrolled} />"
);

content = content.replace(
  /function NavBar\(\{ onGetStarted, scrolled \}\) \{/,
  "function NavBar({ scrolled }) {"
);

content = content.replace(
  /background: scrolled \? 'rgba\\(10, 15, 30, 0\\.8\\)' : 'transparent',/,
  "background: scrolled ? 'rgba(255, 255, 255, 0.9)' : 'transparent',"
);

content = content.replace(
  /<span style=\{\{ position: 'relative', display: 'inline-flex' \}\}>\s*<span style=\{\{ width: 8, height: 8, borderRadius: '50%', background: COLORS\.green, display: 'inline-block' \}\} \/>\s*<span className="aro-pulse" style=\{\{ position: 'absolute', inset: 0, borderRadius: '50%', background: COLORS\.green \}\} \/>\s*<\/span>/,
  `<img src="/logo.png" alt="AI Rep Optimizer Logo" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />`
);

content = content.replace(
  /<div className="aro-nav-links"[^>]*>[\s\S]*?<\/button>\s*<\/div>\s*<button onClick=\{onGetStarted\} className="aro-btn-primary aro-btn-sm">[\s\S]*?<\/button>/,
  `<div className="aro-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <button onClick={() => scrollToId('features')} className="aro-nav-link">Features</button>
          <button onClick={() => scrollToId('how-it-works')} className="aro-nav-link">How it Works</button>
        </div>`
);

// 3. Update the Footer Logo
content = content.replace(
  /<span style=\{\{ width: 8, height: 8, borderRadius: '50%', background: COLORS\.green, display: 'inline-block' \}\} \/>/,
  `<img src="/logo.png" alt="Logo" style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'cover' }} />`
);

// 4. Update the FloatingAuditCard and critical colors
content = content.replace(/background: 'linear-gradient\\(135deg, #1F2937, #374151\\)'/, "background: '#F6F6F7', border: `1px solid ${COLORS.border}`");
content = content.replace(/#F87171/g, "#D72C0D");
content = content.replace(/rgba\(215, 44, 13, 0\.15\)/g, "rgba(215, 44, 13, 0.1)");
content = content.replace(/boxShadow: '0 20px 60px rgba\\(0, 0, 0, 0\\.5\\), 0 0 0 1px rgba\\(0, 200, 122, 0\\.06\\)'/, "boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 128, 96, 0.06)'");

// 5. Update primary button text color
content = content.replace(/color: #031B11;/, "color: #FFFFFF;");

// 6. Update rgba(0, 200, 122, ...) to rgba(0, 128, 96, ...)
content = content.replace(/rgba\(0, 200, 122,/g, "rgba(0, 128, 96,");

// 7. Update Text Gradients
content = content.replace(/linear-gradient\(135deg, #00C87A, #5EEAD4\)/, "linear-gradient(135deg, #008060, #005E46)");

// 8. Update Section Backgrounds
content = content.replace(/linear-gradient\(180deg, #0A0F1E, #0B1324\)/, "linear-gradient(180deg, #F6F6F7, #FFFFFF)");

// 9. Update Mesh colors to be subtle green and blue on white
content = content.replace(/rgba\(59, 130, 246, 0\.18\)/, "rgba(0, 128, 96, 0.05)");
content = content.replace(/rgba\(168, 85, 247, 0\.14\)/, "rgba(0, 128, 96, 0.03)");

fs.writeFileSync('/Users/aditya/Documents/kasp-hack/frontend/src/components/LandingPage.jsx', content);
