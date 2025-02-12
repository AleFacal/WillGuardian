// template.js
function generateHTML({ willText, selectedLanguage, selectedCountry }) {
  // Helper to convert your raw testament text into structured HTML.
  // Assume that your text uses markers (e.g., <<<Section Title>>>) to denote sections.
  function generateContentHTML(text) {
    // Split by double newline to separate paragraphs/sections.
    const blocks = text
      .split("\n\n")
      .map((block) => block.trim())
      .filter(Boolean);
    let html = "";
    let openSection = false;
    blocks.forEach((block) => {
      if (block.startsWith("<<<") && block.endsWith(">>>")) {
        // If a section is already open, close it.
        if (openSection) {
          html += "</div>";
          openSection = false;
        }
        // Start a new section
        const headerText = block.replace(/<<<|>>>/g, "");
        html += `<div class="section">
            <div class="section-header">${headerText}</div>`;
        openSection = true;
      } else {
        // Normal paragraph
        html += `<div class="paragraph">${block}</div>`;
      }
    });
    if (openSection) {
      html += "</div>";
    }
    return html;
  }

  // Use a CSS style block for layout, typography, and spacing
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Last Will and Testament</title>
    <style>
      /* Import a web font if available, or assume Roboto Serif is installed locally */
      @font-face {
        font-family: 'RobotoSerif';
        src: url('https://yourcdn.com/fonts/RobotoSerif-Regular.ttf') format('truetype');
        font-weight: normal;
      }
      @font-face {
        font-family: 'RobotoSerif';
        src: url('https://yourcdn.com/fonts/RobotoSerif-Bold.ttf') format('truetype');
        font-weight: bold;
      }
      body {
        font-family: 'RobotoSerif', serif;
        margin: 0;
        padding: 20px;
        font-size: 14px;
        color: #333;
        line-height: 1.6;
      }
      .container {
        max-width: 800px;
        margin: 0 auto;
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
      }
      .title {
        font-size: 28px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      .meta {
        font-size: 14px;
        color: #666;
      }
      .section {
        margin-top: 40px;
        page-break-inside: avoid;
      }
      .section-header {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 10px;
        border-bottom: 1px solid #ccc;
        padding-bottom: 5px;
      }
      .paragraph {
        margin-bottom: 15px;
        text-align: justify;
      }
      .footer {
        margin-top: 50px;
        font-size: 12px;
        text-align: center;
        color: #777;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="title">Last Will and Testament</div>
        <div class="meta">Country: ${selectedCountry.toUpperCase()} | Language: ${selectedLanguage}</div>
      </div>
      
      ${generateContentHTML(willText)}
      
      <div class="footer">
        ${getFooterText(selectedCountry)}
      </div>
    </div>
  </body>
  </html>
    `;
}

// Helper: Return footer text based on the country
function getFooterText(selectedCountry) {
  switch (selectedCountry) {
    case "us":
      return "This Will shall be governed by the laws of the applicable US State.";
    case "uk":
      return "This Will shall be governed by the laws of the United Kingdom.";
    case "de":
      return "This Will shall be governed by the laws of Germany.";
    case "fr":
      return "This Will shall be governed by the laws of France.";
    case "es":
      return "This Will shall be governed by the laws of Spain.";
    case "ch":
      return "This Will shall be governed by the laws of Switzerland.";
    default:
      return "";
  }
}

module.exports = { generateHTML };
