// app/api/generatePDF/route.ts
import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

interface GenerateHTMLProps {
  willText: string;
  selectedLanguage: string;
  selectedCountry: string;
  testatorInfo: { name: string; dob: string; nationality: string };
  executorInfo: { executor: string; backupExecutor: string };
  bequests: string[];
  funeralInstructions: string;
}

/**
 * Build an HTML template for the testament using inline CSS.
 */
function generateHTML({
  willText,
  selectedLanguage,
  selectedCountry,
  testatorInfo,
  executorInfo,
  bequests,
  funeralInstructions,
}: GenerateHTMLProps): string {
  // Helper: Get footer text based on country.
  function getFooterText(country: string): string {
    switch (country) {
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

  // Helper: Generate the Testator Details block.
  function generateTestatorDetails(): string {
    return `
      <div class="section">
        <div class="section-header">Testator Details</div>
        <div class="paragraph">Name: ${testatorInfo.name}</div>
        <div class="paragraph">Date of Birth: ${testatorInfo.dob}</div>
        <div class="paragraph">Nationality: ${testatorInfo.nationality}</div>
      </div>`;
  }

  // Helper: Generate the Executor & Bequests block.
  function generateExecutorAndBequests(): string {
    return `
      <div class="section">
        <div class="section-header">Executor & Bequests</div>
        <div class="paragraph">Executor: ${executorInfo.executor}</div>
        <div class="paragraph">Backup Executor: ${
          executorInfo.backupExecutor
        }</div>
        <div class="paragraph">Bequests:</div>
        <ul>
          ${bequests.map((b) => `<li>${b}</li>`).join("")}
        </ul>
      </div>`;
  }

  // Helper: Generate the Funeral Instructions block.
  function generateFuneralInstructions(): string {
    return `
      <div class="section">
        <div class="section-header">Funeral Instructions</div>
        <div class="paragraph">${
          funeralInstructions || "No funeral instructions provided."
        }</div>
      </div>`;
  }

  // Helper: Convert the raw AI will text into HTML sections.
  function generateContentHTML(text: string): string {
    // Split the text by double newlines to detect blocks.
    const blocks = text
      .split("\n\n")
      .map((block) => block.trim())
      .filter(Boolean);
    let html = "";
    let openSection = false;
    blocks.forEach((block) => {
      // Look for section markers such as <<<SECTION>>>.
      if (block.startsWith("<<<") && block.endsWith(">>>")) {
        if (openSection) {
          html += "</div>"; // Close previous section.
          openSection = false;
        }
        const headerText = block.replace(/<<<|>>>/g, "");
        html += `<div class="section">
  <div class="section-header">${headerText}</div>`;
        openSection = true;
      } else {
        // Regular paragraph: if inside a section, add a paragraph.
        if (openSection) {
          html += `<div class="paragraph">${block}</div>`;
        } else {
          html += `<div class="paragraph">${block}</div>`;
        }
      }
    });
    if (openSection) {
      html += "</div>";
    }
    return html;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Last Will and Testament</title>
  <style>
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
      padding: 0;
      background: #f7f7f7;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      margin: 10mm auto;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      position: relative;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #333;
      padding-bottom: 10px;
    }
    .title {
      font-size: 32px;
      font-weight: bold;
      margin: 0;
      letter-spacing: 1px;
    }
    .meta {
      font-size: 14px;
      color: #666;
      margin-top: 5px;
    }
    .content {
      margin-top: 20px;
    }
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .section-header {
      font-size: 20px;
      font-weight: bold;
      border-bottom: 1px solid #ccc;
      padding-bottom: 5px;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .paragraph {
      margin-bottom: 15px;
      text-align: justify;
      line-height: 1.6;
    }
    ul {
      list-style-type: square;
      margin-left: 20px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #777;
      border-top: 1px solid #ccc;
      padding-top: 10px;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="title">Last Will and Testament</div>
      <div class="meta">Country: ${selectedCountry.toUpperCase()} | Language: ${selectedLanguage}</div>
    </div>
    <div class="content">
      ${generateTestatorDetails()}
      ${generateContentHTML(willText)}
      ${generateExecutorAndBequests()}
      ${generateFuneralInstructions()}
    </div>
    <div class="footer">
      ${getFooterText(selectedCountry)}
    </div>
  </div>
</body>
</html>`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      willText,
      selectedLanguage,
      selectedCountry,
      testatorInfo,
      executorInfo,
      bequests,
      funeralInstructions,
    } = body;

    if (
      !willText ||
      !selectedLanguage ||
      !selectedCountry ||
      !testatorInfo ||
      !executorInfo
    ) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Generate the HTML for the PDF
    const html = generateHTML({
      willText,
      selectedLanguage,
      selectedCountry,
      testatorInfo,
      executorInfo,
      bequests,
      funeralInstructions,
    });

    // Launch Puppeteer and generate the PDF
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    // Wait for any web fonts to load
    await page.evaluateHandle("document.fonts.ready");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
    });
    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: { "Content-Type": "application/pdf" },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
