// File: PDFGenerator.tsx
import { useEffect, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import "./pdf.css";

const PAGE_WIDTH = 600;
const PAGE_HEIGHT = 800;
const COVER_TOP_MARGIN = 80;
const CONTENT_TOP_MARGIN = 60;
const BOTTOM_MARGIN = 60;
const SIDE_MARGIN = 60;
const MAX_TEXT_WIDTH = PAGE_WIDTH - SIDE_MARGIN * 2;

const LINE_SPACING = 22;
const EMPTY_LINE_SPACING = 12;

export type CountryKey = "us" | "uk" | "de" | "ch" | "fr" | "es";

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
  // ... add more languages as needed ...
};

// This regex detects lines starting with "Article", "Artículo", "Artikel", "Articolo",
// plus a Roman/Arabic numeral, e.g. "Article I", "Artículo III:", "Artikel 2 - ...", etc.
const universalArticleRegex = new RegExp(
  "^(Article|Artículo|Artikel|Articolo)\\s+(\\d+|[IVXLCDM]+).*",
  "i"
);

const SECTION_MARKERS = {
  cover: "<<<COVER>>>",
  declaration: "<<<DECLARATION>>>",
  articles: "<<<ARTICLES>>>",
  witness: "<<<WITNESS>>>",
  legal: "<<<LEGAL>>>",
};

function cleanTextWithMarkers(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/^-{2,}$/gm, "")
    .replace(/\[Fügen Sie .+?\]/g, "____________________")
    .replace(/^(SEITE|Page)\s*\d+/gim, "")
    .replace(/<<<[^>]+>>>/g, "")
    .trim();
}

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

/** Splits any text lines into paragraphs by blank lines. */
function splitIntoParagraphs(lines: string[]): string[][] {
  const paragraphs: string[][] = [];
  let currentParagraph: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentParagraph.length) {
        paragraphs.push(currentParagraph);
        currentParagraph = [];
      }
    } else {
      currentParagraph.push(line);
    }
  }
  if (currentParagraph.length) {
    paragraphs.push(currentParagraph);
  }
  return paragraphs;
}

/** For articles, we want "Article X" + subsequent lines as a block. */
function splitArticlesIntoBlocks(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let currentBlock: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (universalArticleRegex.test(trimmed)) {
      // new article block
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

/** Optional custom witness layout if we want to override AI text. */
function drawCustomWitnessSection(
  page: any,
  yPosition: number,
  robotoRegularFont: any,
  robotoBoldFont: any,
  addNewPage: (isCover?: boolean) => any
): number {
  // Approx total block size
  const blockHeight = 160; // rough estimate for 2 lines
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

  // 2 Witness blocks
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

async function generatePDF(
  willText: string,
  selectedLanguage: string,
  selectedCountry: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Load fonts
  const [robotoRegularFontBytes, robotoBoldFontBytes] = await Promise.all([
    fetch("/fonts/Roboto-Regular.ttf").then((res) => res.arrayBuffer()),
    fetch("/fonts/Roboto-Bold.ttf").then((res) => res.arrayBuffer()),
  ]);
  const robotoRegularFont = await pdfDoc.embedFont(robotoRegularFontBytes);
  const robotoBoldFont = await pdfDoc.embedFont(robotoBoldFontBytes);

  let currentPageNumber = 1;
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
      const titleX = (PAGE_WIDTH - titleWidth) / 2;
      page.drawText(titleText, {
        x: titleX,
        y: PAGE_HEIGHT - COVER_TOP_MARGIN,
        font: robotoBoldFont,
        size: titleFontSize,
      });

      // Subtitle
      const subtitleText =
        languageMapping[selectedLanguage]?.subtitle || "Testament Subtitle";
      const subtitleFontSize = 16;
      const subWidth = robotoRegularFont.widthOfTextAtSize(
        subtitleText,
        subtitleFontSize
      );
      const subX = (PAGE_WIDTH - subWidth) / 2;
      page.drawText(subtitleText, {
        x: subX,
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

  // If you want to forcibly override AI's witness text:
  const useCustomWitnessLayout = true;

  // Clean text & parse
  const cleanedText = cleanTextWithMarkers(willText);
  let sections = parseSections(cleanedText);
  if (!Object.keys(sections).length) {
    // If no markers found, treat entire text as cover
    sections.cover = cleanedText;
  }

  const sectionOrder = ["cover", "declaration", "articles", "witness", "legal"];
  let page = addNewPage(true);
  let yPosition = PAGE_HEIGHT - COVER_TOP_MARGIN - 80;

  // Helper: Render a block of lines
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
    if (!sections[sec]) continue;

    // If not cover, add heading
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

    // "articles" -> article blocks
    // "witness" -> possibly override
    // else -> paragraph-based

    if (sec === "articles") {
      const lines = sections[sec].split("\n");
      const articleBlocks = splitArticlesIntoBlocks(lines);

      for (const blk of articleBlocks) {
        const wrapped: { text: string; isBold: boolean }[] = [];
        for (const rawLine of blk) {
          const trimmed = rawLine.trim();
          if (!trimmed) {
            // blank line => keep as empty line
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
      if (useCustomWitnessLayout) {
        // Skip AI text, just draw your own lines
        yPosition = drawCustomWitnessSection(
          page,
          yPosition,
          robotoRegularFont,
          robotoBoldFont,
          addNewPage
        );
      } else {
        // Use paragraph approach on the AI text
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
      // Normal paragraph approach
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

  // If no "legal" -> add disclaimers
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

  return await pdfDoc.save();
}

// -----------------------
// Exported Component
// -----------------------
export interface PDFGeneratorProps {
  willText: string;
  selectedCountry: CountryKey;
  selectedLanguage: string;
  autoGenerate?: boolean;
}

export default function PDFGenerator({
  willText,
  selectedCountry,
  selectedLanguage = "English",
  autoGenerate = false,
}: PDFGeneratorProps) {
  const pdfCacheRef = useRef<Uint8Array | null>(null);

  const handleDownload = async () => {
    if (!pdfCacheRef.current) {
      pdfCacheRef.current = await generatePDF(
        willText,
        selectedLanguage,
        selectedCountry
      );
    }
    const blob = new Blob([pdfCacheRef.current], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "will.pdf";
    link.click();
  };

  useEffect(() => {
    pdfCacheRef.current = null; // clear cache if text changes
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
