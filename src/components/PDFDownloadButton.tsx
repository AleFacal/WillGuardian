// File: PDFGenerator.tsx
import { useEffect, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import "./pdf.css";

// ------------------------
// Dimensions & Constants
// ------------------------
const PAGE_WIDTH = 600;
const PAGE_HEIGHT = 800;
const COVER_TOP_MARGIN = 80;
const CONTENT_TOP_MARGIN = 60;
const BOTTOM_MARGIN = 60;
const SIDE_MARGIN = 60;
const MAX_TEXT_WIDTH = PAGE_WIDTH - SIDE_MARGIN * 2;

const LINE_SPACING = 22;
const EMPTY_LINE_SPACING = 12;

// ------------------------
// Country Types
// ------------------------
export type CountryKey = "us" | "uk" | "de" | "ch" | "fr" | "es";

// ------------------------
// Language Mappings
// (Adjust or expand as needed)
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
  },
  // ...Add more languages if you wish...
};

// ------------------------
// Article Regex
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
// Utility: Clean AI Text
// ------------------------
function cleanTextWithMarkers(text: string): string {
  return text
    .replace(/\*\*/g, "") // remove leftover markdown bold
    .replace(/^-{2,}$/gm, "") // remove lines of repeated dashes
    .replace(/\[Fügen Sie .+?\]/g, "____________________")
    .replace(/^(SEITE|Page)\s*\d+/gim, "")
    .replace(/<<<[^>]+>>>/g, "") // remove leftover markers
    .trim();
}

// ------------------------
// Utility: Parse Sections
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
// Utility: Wrap a single line
// ------------------------
function wrapTextLine(
  text: string,
  font: any,
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  for (let w of words) {
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
// Utility: Split lines -> paragraphs
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
// Utility: Split articles -> blocks
// (Each block starts with "Article X")
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
// Utility: Ensure Space or Add Page
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
// Optional: Custom Witness Layout
// ------------------------
function drawCustomWitnessSection(
  page: any,
  yPosition: number,
  robotoRegularFont: any,
  robotoBoldFont: any,
  addNewPage: (isCover?: boolean) => any
): number {
  // Estimate space
  const blockHeight = 160;
  if (yPosition - blockHeight < BOTTOM_MARGIN) {
    page = addNewPage(false);
    yPosition = PAGE_HEIGHT - CONTENT_TOP_MARGIN - 30;
  }

  // Heading
  page.drawText("Witness Section", {
    x: SIDE_MARGIN,
    y: yPosition,
    font: robotoBoldFont,
    size: 16,
  });
  yPosition -= 30;

  // Create 2 witness blocks
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
// The main "generatePDF" function
// taking a "useCustomWitnessLayout" boolean
// ------------------------
async function generatePDF(
  willText: string,
  selectedLanguage: string,
  selectedCountry: string,
  useCustomWitnessLayout: boolean
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Load fonts
  const [robotoRegularFontBytes, robotoBoldFontBytes] = await Promise.all([
    fetch("/fonts/Roboto-Regular.ttf").then((r) => r.arrayBuffer()),
    fetch("/fonts/Roboto-Bold.ttf").then((r) => r.arrayBuffer()),
  ]);
  const robotoRegularFont = await pdfDoc.embedFont(robotoRegularFontBytes);
  const robotoBoldFont = await pdfDoc.embedFont(robotoBoldFontBytes);

  let currentPageNumber = 1;

  // Helper to create pages
  const addNewPage = (isCover: boolean = false) => {
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    if (isCover) {
      // Cover
      const titleText = languageMapping[selectedLanguage]?.title || "WILL";
      const titleFontSize = 24;
      const titleWidth = robotoBoldFont.widthOfTextAtSize(
        titleText,
        titleFontSize
      );
      page.drawText(titleText, {
        x: (PAGE_WIDTH - titleWidth) / 2,
        y: PAGE_HEIGHT - COVER_TOP_MARGIN,
        font: robotoBoldFont,
        size: titleFontSize,
      });

      const subtitleText =
        languageMapping[selectedLanguage]?.subtitle || "Testament Subtitle";
      const subtitleFontSize = 16;
      const subtitleWidth = robotoRegularFont.widthOfTextAtSize(
        subtitleText,
        subtitleFontSize
      );
      page.drawText(subtitleText, {
        x: (PAGE_WIDTH - subtitleWidth) / 2,
        y: PAGE_HEIGHT - COVER_TOP_MARGIN - 30,
        font: robotoRegularFont,
        size: subtitleFontSize,
      });
    } else {
      // Page number
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

  // Clean & parse the AI text
  const cleanedText = cleanTextWithMarkers(willText);
  let sections = parseSections(cleanedText);

  // If no recognized markers, treat entire text as "cover"
  if (!Object.keys(sections).length) {
    sections.cover = cleanedText;
  }

  // We proceed in the known order
  const sectionOrder = ["cover", "declaration", "articles", "witness", "legal"];
  let page = addNewPage(true);
  let yPosition = PAGE_HEIGHT - COVER_TOP_MARGIN - 80;

  // Helper to render a group of lines
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

  for (const sec of sectionOrder) {
    if (!sections[sec]) continue; // skip if missing

    // If not the cover, draw a heading
    if (sec !== "cover") {
      if (yPosition < CONTENT_TOP_MARGIN + 30) {
        page = addNewPage(false);
        yPosition = PAGE_HEIGHT - CONTENT_TOP_MARGIN - 30;
      }
      const headingText =
        languageMapping[selectedLanguage]?.sectionLabels[sec] ||
        sec.toUpperCase();
      page.drawText(headingText, {
        x: SIDE_MARGIN,
        y: yPosition,
        font: robotoBoldFont,
        size: 16,
      });
      yPosition -= 30;
    }

    if (sec === "articles") {
      // Split by article headings
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
      // If we want to skip the AI text, use custom layout
      if (useCustomWitnessLayout) {
        yPosition = drawCustomWitnessSection(
          page,
          yPosition,
          robotoRegularFont,
          robotoBoldFont,
          addNewPage
        );
      } else {
        // Otherwise, use paragraphs from AI
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
      // cover, declaration, legal -> normal paragraphs
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

  // If no "legal" => add disclaimers at bottom
  if (!sections.legal) {
    const disclaimer = languageMapping[selectedLanguage]?.disclaimer || "";
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

  // Return the final PDF
  return pdfDoc.save();
}

// ------------------------
// PDFGenerator Component
// ------------------------
export interface PDFGeneratorProps {
  willText: string;
  selectedCountry: CountryKey;
  selectedLanguage: string;
  /** If true, automatically downloads PDF on render. Otherwise shows a button. */
  autoGenerate?: boolean;
  /**
   * If true, we ignore any 'witness' text from the AI
   * and forcibly render a 2-witness signature layout.
   * If false or undefined, we use the AI's text if present.
   */
  useCustomWitnessLayout?: boolean;
}

export default function PDFGenerator({
  willText,
  selectedCountry,
  selectedLanguage = "English",
  autoGenerate = false,
  useCustomWitnessLayout = false,
}: PDFGeneratorProps) {
  const pdfCacheRef = useRef<Uint8Array | null>(null);

  const handleDownload = async () => {
    // If we haven't generated the PDF yet, do so now
    if (!pdfCacheRef.current) {
      pdfCacheRef.current = await generatePDF(
        willText,
        selectedLanguage,
        selectedCountry,
        useCustomWitnessLayout
      );
    }
    // Download the PDF from memory
    const blob = new Blob([pdfCacheRef.current], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "will.pdf";
    link.click();
  };

  // If autoGenerate, create & download automatically
  useEffect(() => {
    pdfCacheRef.current = null; // reset cache if props changed
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
