// File: PDFGenerator.tsx
import { useEffect, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import "./pdf.css";

// ------------------------
// Page Dimensions
// ------------------------
const PAGE_WIDTH = 600;
const PAGE_HEIGHT = 800;
const COVER_TOP_MARGIN = 80;
const CONTENT_TOP_MARGIN = 60;
const BOTTOM_MARGIN = 60;
const SIDE_MARGIN = 60;
const MAX_TEXT_WIDTH = PAGE_WIDTH - SIDE_MARGIN * 2;

// Spacing
const LINE_SPACING = 22;
const EMPTY_LINE_SPACING = 12;

// ------------------------
// Supported Countries
// ------------------------
export type CountryKey = "us" | "uk" | "de" | "ch" | "fr" | "es";

// ------------------------
// Language Mappings
// Now includes testator signature labels
// ------------------------
const languageMapping: Record<string, any> = {
  English: {
    title: "LAST WILL AND TESTAMENT",
    subtitle: "Declaration of Intent and Legal Provisions",
    disclaimer: "This document is legally binding.",
    sectionLabels: {
      cover: "Testator Details",
      declaration: "Declaration Page",
      articles: "Articles",
      witness: "Witness Section",
      legal: "Legal Notes",
    },
    // New fields for testator signature block
    testatorSignatureLabel: "Testator's Signature:",
    testatorSignatureLine:
      "Signature: _________________________    Date: ___________",
  },
  German: {
    title: "LETZTER WILLE UND TESTAMENT",
    subtitle: "Absichtserklärung und gesetzliche Bestimmungen",
    disclaimer: "Dieses Dokument ist rechtsverbindlich.",
    sectionLabels: {
      cover: "Testatorendetails",
      declaration: "Erklärungsseite",
      articles: "Artikel",
      witness: "Zeugenabschnitt",
      legal: "Rechtliche Hinweise",
    },
    // Translated
    testatorSignatureLabel: "Unterschrift des Erblassers:",
    testatorSignatureLine:
      "Unterschrift: _________________________    Datum: ___________",
  },
  // Add more languages if needed...
};

// ------------------------
// Regex for "Article X" headings
// ------------------------
const universalArticleRegex = new RegExp(
  "^(Article|Artículo|Artikel|Articolo)\\s+(\\d+|[IVXLCDM]+).*",
  "i"
);

// ------------------------
// Section Markers
// ------------------------
const SECTION_MARKERS = {
  cover: "<<<COVER>>>",
  declaration: "<<<DECLARATION>>>",
  articles: "<<<ARTICLES>>>",
  witness: "<<<WITNESS>>>",
  legal: "<<<LEGAL>>>",
};

// ------------------------
// Clean Text
// ------------------------
function cleanTextWithMarkers(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/^-{2,}$/gm, "")
    .replace(/\[Fügen Sie .+?\]/g, "____________________")
    .replace(/^(SEITE|Page)\s*\d+/gim, "")
    .replace(/<<<[^>]+>>>/g, "")
    .trim();
}

// ------------------------
// Parse Sections
// ------------------------
function parseSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = text.split("\n");
  let currentSection = "";
  for (const line of lines) {
    const markerMatch = line.match(
      /<<<(COVER|DECLARATION|ARTICLES|WITNESS|LEGAL)>>>/i
    );
    if (markerMatch) {
      currentSection = markerMatch[1].toLowerCase();
      sections[currentSection] = "";
    } else if (currentSection) {
      sections[currentSection] += line + "\n";
    }
  }
  return sections;
}

// ------------------------
// Wrap a Single Line
// ------------------------
function wrapTextLine(
  text: string,
  font: any,
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  for (const w of words) {
    if (!lines.length) {
      lines.push(w);
    } else {
      const currentLine = lines[lines.length - 1];
      const testLine = currentLine + " " + w;
      if (font.widthOfTextAtSize(testLine, fontSize) < maxWidth) {
        lines[lines.length - 1] = testLine;
      } else {
        lines.push(w);
      }
    }
  }
  return lines;
}

// ------------------------
// Split Lines -> Paragraphs
// ------------------------
function splitIntoParagraphs(lines: string[]): string[][] {
  const paragraphs: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (current.length) paragraphs.push(current);
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length) paragraphs.push(current);
  return paragraphs;
}

// ------------------------
// Split Articles -> Blocks
// ------------------------
function splitArticlesIntoBlocks(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let currentBlock: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (universalArticleRegex.test(trimmed)) {
      if (currentBlock.length) {
        blocks.push(currentBlock);
      }
      currentBlock = [line];
    } else {
      currentBlock.push(line);
    }
  }
  if (currentBlock.length) {
    blocks.push(currentBlock);
  }
  return blocks;
}

// ------------------------
// Ensure Space or Add Page
// ------------------------
function ensureSpace(
  currentY: number,
  requiredHeight: number,
  isCover: boolean,
  addNewPageFn: (isCover: boolean) => any
): { page: any; y: number } {
  if (currentY - requiredHeight < BOTTOM_MARGIN) {
    const newPage = addNewPageFn(isCover);
    return {
      page: newPage,
      y: PAGE_HEIGHT - (isCover ? COVER_TOP_MARGIN : CONTENT_TOP_MARGIN) - 30,
    };
  }
  return { page: null, y: currentY };
}

// ------------------------
// drawCustomWitnessSection
// optional usage
// ------------------------
function drawCustomWitnessSection(
  page: any,
  yPosition: number,
  robotoRegularFont: any,
  robotoBoldFont: any,
  addNewPage: (isCover?: boolean) => any
): number {
  const blockHeight = 160;
  if (yPosition - blockHeight < BOTTOM_MARGIN) {
    page = addNewPage(false);
    yPosition = PAGE_HEIGHT - CONTENT_TOP_MARGIN - 30;
  }
  page.drawText("Witness Section", {
    x: SIDE_MARGIN,
    y: yPosition,
    font: robotoBoldFont,
    size: 16,
  });
  yPosition -= 30;

  for (let i = 1; i <= 2; i++) {
    page.drawText(`Witness ${i}:`, {
      x: SIDE_MARGIN,
      y: yPosition,
      font: robotoBoldFont,
      size: 12,
    });
    yPosition -= 20;

    page.drawText("Name: _____________________________", {
      x: SIDE_MARGIN,
      y: yPosition,
      font: robotoRegularFont,
      size: 12,
    });
    yPosition -= 20;

    page.drawText("Signature: _________________________   Date: ___________", {
      x: SIDE_MARGIN,
      y: yPosition,
      font: robotoRegularFont,
      size: 12,
    });
    yPosition -= 40;
  }
  return yPosition;
}

// ------------------------
// Testator's Signature
// translated version
// ------------------------
function drawTestatorSignatureSection(
  page: any,
  yPosition: number,
  robotoRegularFont: any,
  robotoBoldFont: any,
  addNewPage: (isCover?: boolean) => any,
  selectedLanguage: string
): number {
  const blockHeight = 60;
  if (yPosition - blockHeight < BOTTOM_MARGIN) {
    page = addNewPage(false);
    yPosition = PAGE_HEIGHT - CONTENT_TOP_MARGIN - 30;
  }

  // We retrieve the translations from languageMapping
  const { testatorSignatureLabel, testatorSignatureLine } =
    languageMapping[selectedLanguage] || {};

  // Fallback if language not found
  const label = testatorSignatureLabel || "Testator's Signature:";
  const line =
    testatorSignatureLine ||
    "Signature: _________________________    Date: ___________";

  page.drawText(label, {
    x: SIDE_MARGIN,
    y: yPosition,
    font: robotoBoldFont,
    size: 14,
  });
  yPosition -= 25;

  page.drawText(line, {
    x: SIDE_MARGIN,
    y: yPosition,
    font: robotoRegularFont,
    size: 12,
  });
  yPosition -= 35;

  return yPosition;
}

// ------------------------
// Main PDF Generation
// ------------------------
async function generatePDF(
  willText: string,
  selectedLanguage: string,
  selectedCountry: string,
  useCustomWitnessLayout: boolean
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const [robotoRegularFontBytes, robotoBoldFontBytes] = await Promise.all([
    fetch("/fonts/Roboto-Regular.ttf").then((r) => r.arrayBuffer()),
    fetch("/fonts/Roboto-Bold.ttf").then((r) => r.arrayBuffer()),
  ]);
  const robotoRegularFont = await pdfDoc.embedFont(robotoRegularFontBytes);
  const robotoBoldFont = await pdfDoc.embedFont(robotoBoldFontBytes);

  let currentPageNumber = 1;
  const addNewPage = (isCover: boolean = false) => {
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    if (isCover) {
      const { title = "WILL", subtitle = "Testament Subtitle" } =
        languageMapping[selectedLanguage] || {};

      // Title
      const titleFontSize = 24;
      const titleWidth = robotoBoldFont.widthOfTextAtSize(title, titleFontSize);
      page.drawText(title, {
        x: (PAGE_WIDTH - titleWidth) / 2,
        y: PAGE_HEIGHT - COVER_TOP_MARGIN,
        font: robotoBoldFont,
        size: titleFontSize,
      });

      // Subtitle
      const subtitleFontSize = 16;
      const subWidth = robotoRegularFont.widthOfTextAtSize(
        subtitle,
        subtitleFontSize
      );
      page.drawText(subtitle, {
        x: (PAGE_WIDTH - subWidth) / 2,
        y: PAGE_HEIGHT - COVER_TOP_MARGIN - 30,
        font: robotoRegularFont,
        size: subtitleFontSize,
      });
    } else {
      page.drawText(`Page ${currentPageNumber}`, {
        x: PAGE_WIDTH - SIDE_MARGIN - 50,
        y: PAGE_HEIGHT - 30,
        font: robotoRegularFont,
        size: 10,
      });
    }
    currentPageNumber++;
    return page;
  };

  const cleanedText = cleanTextWithMarkers(willText);
  let sections = parseSections(cleanedText);
  if (!Object.keys(sections).length) {
    sections.cover = cleanedText;
  }

  const sectionOrder = ["cover", "declaration", "articles", "witness", "legal"];
  let page = addNewPage(true);
  let yPosition = PAGE_HEIGHT - COVER_TOP_MARGIN - 80;

  function renderBlock(blockLines: { text: string; isBold: boolean }[]) {
    const blockHeight = blockLines.length * LINE_SPACING;
    if (yPosition - blockHeight < BOTTOM_MARGIN) {
      page = addNewPage(false);
      yPosition = PAGE_HEIGHT - CONTENT_TOP_MARGIN - 30;
    }
    for (const lineObj of blockLines) {
      const fontToUse = lineObj.isBold ? robotoBoldFont : robotoRegularFont;
      page.drawText(lineObj.text, {
        x: SIDE_MARGIN,
        y: yPosition,
        font: fontToUse,
        size: 12,
      });
      yPosition -= LINE_SPACING;
    }
    yPosition -= EMPTY_LINE_SPACING;
  }

  // Render sections in order
  for (const sec of sectionOrder) {
    if (!sections[sec]) continue;

    // If not cover, add heading
    if (sec !== "cover") {
      if (yPosition < CONTENT_TOP_MARGIN + 30) {
        page = addNewPage(false);
        yPosition = PAGE_HEIGHT - CONTENT_TOP_MARGIN - 30;
      }
      // Retrieve localized label or fallback
      const labelMapping = languageMapping[selectedLanguage]?.sectionLabels;
      const headingText = labelMapping?.[sec] || sec.toUpperCase();

      page.drawText(headingText, {
        x: SIDE_MARGIN,
        y: yPosition,
        font: robotoBoldFont,
        size: 16,
      });
      yPosition -= 30;
    }

    // If articles => block approach
    if (sec === "articles") {
      const lines = sections[sec].split("\n");
      const articleBlocks = splitArticlesIntoBlocks(lines);
      for (const blk of articleBlocks) {
        const wrapped: { text: string; isBold: boolean }[] = [];
        for (const rawLine of blk) {
          const trimmed = rawLine.trim();
          if (!trimmed) {
            wrapped.push({ text: "", isBold: false });
            continue;
          }
          const isHeading = universalArticleRegex.test(trimmed);
          const subLines = wrapTextLine(
            trimmed,
            isHeading ? robotoBoldFont : robotoRegularFont,
            12,
            MAX_TEXT_WIDTH
          );
          for (const sl of subLines) {
            wrapped.push({ text: sl, isBold: isHeading });
          }
        }
        renderBlock(wrapped);
      }
    } else if (sec === "witness") {
      // If user wants custom layout
      if (useCustomWitnessLayout) {
        yPosition = drawCustomWitnessSection(
          page,
          yPosition,
          robotoRegularFont,
          robotoBoldFont,
          addNewPage
        );
      } else {
        // Use AI text
        const lines = sections[sec].split("\n");
        const paragraphs = splitIntoParagraphs(lines);
        for (const para of paragraphs) {
          const wrappedParagraph: { text: string; isBold: boolean }[] = [];
          for (const rawLine of para) {
            const trimmed = rawLine.trim();
            if (!trimmed) continue;
            const isHeading = universalArticleRegex.test(trimmed);
            const subLines = wrapTextLine(
              trimmed,
              isHeading ? robotoBoldFont : robotoRegularFont,
              12,
              MAX_TEXT_WIDTH
            );
            for (const sl of subLines) {
              wrappedParagraph.push({ text: sl, isBold: isHeading });
            }
          }
          renderBlock(wrappedParagraph);
        }
      }
    } else {
      // cover, declaration, legal => normal paragraphs
      const lines = sections[sec].split("\n");
      const paragraphs = splitIntoParagraphs(lines);
      for (const para of paragraphs) {
        const wrappedParagraph: { text: string; isBold: boolean }[] = [];
        for (const rawLine of para) {
          const trimmed = rawLine.trim();
          if (!trimmed) continue;
          const isHeading = universalArticleRegex.test(trimmed);
          const subLines = wrapTextLine(
            trimmed,
            isHeading ? robotoBoldFont : robotoRegularFont,
            12,
            MAX_TEXT_WIDTH
          );
          for (const sl of subLines) {
            wrappedParagraph.push({ text: sl, isBold: isHeading });
          }
        }
        renderBlock(wrappedParagraph);
      }
    }
  }

  // If no "legal" => disclaimers
  if (!sections.legal) {
    const { disclaimer = "" } = languageMapping[selectedLanguage] || {};
    if (disclaimer) {
      const discWidth = robotoRegularFont.widthOfTextAtSize(disclaimer, 12);
      if (yPosition - 12 - 20 < BOTTOM_MARGIN) {
        page = addNewPage(false);
        yPosition = PAGE_HEIGHT - CONTENT_TOP_MARGIN - 30;
      }
      const centerX = (PAGE_WIDTH - discWidth) / 2;
      page.drawText(disclaimer, {
        x: centerX,
        y: BOTTOM_MARGIN,
        font: robotoRegularFont,
        size: 12,
      });
    }
  }

  // Final step: draw testator signature line in selected language
  yPosition = drawTestatorSignatureSection(
    page,
    yPosition,
    robotoRegularFont,
    robotoBoldFont,
    addNewPage,
    selectedLanguage
  );

  return await pdfDoc.save();
}

// ------------------------
// Props for PDFGenerator
// ------------------------
export interface PDFGeneratorProps {
  willText: string;
  selectedCountry: CountryKey;
  selectedLanguage: string;
  autoGenerate?: boolean;
  /** If true, skip AI text for witness and use custom layout. */
  useCustomWitnessLayout?: boolean;
}

// ------------------------
// PDFGenerator Component
// ------------------------
export default function PDFGenerator({
  willText,
  selectedCountry,
  selectedLanguage = "English",
  autoGenerate = false,
  useCustomWitnessLayout = false,
}: PDFGeneratorProps) {
  const pdfCacheRef = useRef<Uint8Array | null>(null);

  const handleDownload = async () => {
    if (!pdfCacheRef.current) {
      pdfCacheRef.current = await generatePDF(
        willText,
        selectedLanguage,
        selectedCountry,
        useCustomWitnessLayout
      );
    }
    const blob = new Blob([pdfCacheRef.current], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "will.pdf";
    link.click();
  };

  useEffect(() => {
    pdfCacheRef.current = null;
    if (autoGenerate && willText) {
      handleDownload();
    }
  }, [willText, selectedLanguage, selectedCountry, autoGenerate]);

  if (autoGenerate) return null;

  return (
    <div style={{ textAlign: "center" }}>
      <button
        onClick={handleDownload}
        className="pdfDownloadButton hover:bg-green-600"
      >
        Download as PDF
      </button>
    </div>
  );
}
