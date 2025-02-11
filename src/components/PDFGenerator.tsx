// File: PDFGenerator.ts
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import "./pdf.css";

// =====================================================
// CONSTANTS & CONFIGURATION
// =====================================================
const PAGE_WIDTH = 600;
const PAGE_HEIGHT = 800;
const MARGINS = { top: 60, bottom: 60, side: 60 };
const MAX_TEXT_WIDTH = PAGE_WIDTH - MARGINS.side * 2;
const LINE_SPACING = 22;
const EMPTY_LINE_SPACING = 12;

export type CountryKey = "us" | "uk" | "de" | "ch" | "fr" | "es";

// Language-specific strings & section labels
const LANGUAGE_MAPPING: Record<string, any> = {
  English: {
    title: "LAST WILL AND TESTAMENT",
    subtitle: "Declaration of Intent and Legal Provisions",
    disclaimer: "This document is legally binding.",
    sectionLabels: {
      cover: "Testator Details",
      declaration: "Declaration",
      articles: "Articles",
      witness: "Witness",
      legal: "Legal Notes",
    },
    testatorSignatureLabel: "Testator's Signature:",
    testatorSignatureLine:
      "Signature: _________________________    Date: ___________",
  },
  // Extend for other languages as needed…
};

// Markers used by the AI to structure sections (not printed)
const SECTION_MARKERS = {
  cover: "<<<COVER>>>",
  declaration: "<<<DECLARATION>>>",
  articles: "<<<ARTICLES>>>",
  witness: "<<<WITNESS>>>",
  legal: "<<<LEGAL>>>",
};

// Regex to detect article headings in various languages
const ARTICLE_REGEX =
  /^(Article|Artículo|Artikel|Articolo)\s+(?:\d+|[IVXLCDM]+).*$/i;

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Returns country-specific PDF settings.
 */
function getCountrySettings(country: CountryKey) {
  // For example, Germany (de) does not require a witness section.
  return {
    showWitness: country !== "de",
    coverTopMargin: 80, // Adjust per country if needed.
  };
}

/**
 * Cleans the raw text by removing markers and extraneous content.
 */
function cleanText(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/^-{2,}$/gm, "")
    .replace(/<<<[^>]+>>>/g, "")
    .replace(/^(SEITE|Page)\s*\d+/gim, "")
    .trim();
}

/**
 * Parses the text into sections based on our markers.
 */
function parseSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = text.split("\n");
  let currentSection: string | null = null;
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

/**
 * Wraps a given text into lines that fit within the specified width.
 */
function wrapText(
  text: string,
  font: any,
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  for (const word of words) {
    if (!lines.length) {
      lines.push(word);
    } else {
      const testLine = lines[lines.length - 1] + " " + word;
      if (font.widthOfTextAtSize(testLine, fontSize) < maxWidth) {
        lines[lines.length - 1] = testLine;
      } else {
        lines.push(word);
      }
    }
  }
  return lines;
}

/**
 * Splits text into paragraphs separated by blank lines.
 */
function splitParagraphs(text: string): string[][] {
  const lines = text.split("\n");
  const paragraphs: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (line.trim() === "") {
      if (current.length) {
        paragraphs.push(current);
        current = [];
      }
    } else {
      current.push(line);
    }
  }
  if (current.length) paragraphs.push(current);
  return paragraphs;
}

/**
 * Splits article text into blocks based on headings.
 */
function splitArticles(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (ARTICLE_REGEX.test(line.trim())) {
      if (current.length) blocks.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current);
  return blocks;
}

/**
 * Draws a section header (title with an underline) on the page.
 */
function drawSectionHeader(
  page: any,
  y: number,
  title: string,
  font: any,
  fontSize = 16
): number {
  page.drawText(title, { x: MARGINS.side, y, font, size: fontSize });
  y -= fontSize + 5;
  page.drawLine({
    start: { x: MARGINS.side, y },
    end: { x: PAGE_WIDTH - MARGINS.side, y },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  return y - fontSize;
}

/**
 * Creates a new page. If 'isCover' is true, draws the cover title and subtitle,
 * and returns a Y coordinate that leaves extra space below them.
 */
function addNewPage(
  pdfDoc: PDFDocument,
  pageNumber: number,
  isCover: boolean,
  robotoRegular: any,
  robotoBold: any,
  selectedLanguage: string,
  coverTopMargin: number
): { page: any; newPageNumber: number; y: number } {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  if (isCover) {
    const { title, subtitle } = LANGUAGE_MAPPING[selectedLanguage];
    const titleSize = 24;
    const titleWidth = robotoBold.widthOfTextAtSize(title, titleSize);
    page.drawText(title, {
      x: (PAGE_WIDTH - titleWidth) / 2,
      y: PAGE_HEIGHT - coverTopMargin,
      font: robotoBold,
      size: titleSize,
    });
    const subSize = 16;
    const subWidth = robotoRegular.widthOfTextAtSize(subtitle, subSize);
    page.drawText(subtitle, {
      x: (PAGE_WIDTH - subWidth) / 2,
      y: PAGE_HEIGHT - coverTopMargin - 30,
      font: robotoRegular,
      size: subSize,
    });
    // Leave extra space (70 points) below the title/subtitle
    return {
      page,
      newPageNumber: pageNumber + 1,
      y: PAGE_HEIGHT - coverTopMargin - 70,
    };
  } else {
    page.drawText(`Page ${pageNumber}`, {
      x: PAGE_WIDTH - MARGINS.side - 50,
      y: PAGE_HEIGHT - 30,
      font: robotoRegular,
      size: 10,
    });
  }
  return {
    page,
    newPageNumber: pageNumber + 1,
    y: PAGE_HEIGHT - MARGINS.top - 30,
  };
}

/**
 * Draws a block of text (wrapped into lines) starting at the given Y position.
 */
function drawTextBlock(
  page: any,
  text: string,
  font: any,
  fontSize: number,
  startY: number
): number {
  const lines = wrapText(text, font, fontSize, MAX_TEXT_WIDTH);
  for (const line of lines) {
    page.drawText(line, { x: MARGINS.side, y: startY, font, size: fontSize });
    startY -= LINE_SPACING;
  }
  return startY - EMPTY_LINE_SPACING;
}

/**
 * Draws the testator’s signature block.
 */
function drawTestatorSignature(
  page: any,
  y: number,
  robotoRegular: any,
  robotoBold: any,
  selectedLanguage: string
): number {
  const { testatorSignatureLabel, testatorSignatureLine } =
    LANGUAGE_MAPPING[selectedLanguage];
  page.drawText(testatorSignatureLabel, {
    x: MARGINS.side,
    y,
    font: robotoBold,
    size: 14,
  });
  y -= 25;
  page.drawText(testatorSignatureLine, {
    x: MARGINS.side,
    y,
    font: robotoRegular,
    size: 12,
  });
  return y - 35;
}

/**
 * Draws a custom two-column witness section.
 */
function drawWitnessSection(
  page: any,
  y: number,
  robotoRegular: any,
  robotoBold: any
): number {
  const gap = 10;
  const blockWidth = (PAGE_WIDTH - MARGINS.side * 2 - gap) / 2;

  // Witness 1
  page.drawText("Witness 1:", {
    x: MARGINS.side,
    y,
    font: robotoBold,
    size: 12,
  });
  const w1LabelWidth = robotoBold.widthOfTextAtSize("Witness 1:", 12);
  page.drawLine({
    start: { x: MARGINS.side + w1LabelWidth + 8, y: y - 2 },
    end: { x: MARGINS.side + blockWidth, y: y - 2 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  let w1Y = y - 20;
  page.drawText("Date:", {
    x: MARGINS.side,
    y: w1Y,
    font: robotoBold,
    size: 12,
  });
  const dateWidth = robotoBold.widthOfTextAtSize("Date:", 12);
  page.drawLine({
    start: { x: MARGINS.side + dateWidth + 8, y: w1Y - 2 },
    end: { x: MARGINS.side + blockWidth, y: w1Y - 2 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // Witness 2
  const xWitness2 = MARGINS.side + blockWidth + gap;
  page.drawText("Witness 2:", { x: xWitness2, y, font: robotoBold, size: 12 });
  const w2LabelWidth = robotoBold.widthOfTextAtSize("Witness 2:", 12);
  page.drawLine({
    start: { x: xWitness2 + w2LabelWidth + 8, y: y - 2 },
    end: { x: xWitness2 + blockWidth, y: y - 2 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  let w2Y = y - 20;
  page.drawText("Date:", { x: xWitness2, y: w2Y, font: robotoBold, size: 12 });
  const w2DateWidth = robotoBold.widthOfTextAtSize("Date:", 12);
  page.drawLine({
    start: { x: xWitness2 + w2DateWidth + 8, y: w2Y - 2 },
    end: { x: xWitness2 + blockWidth, y: w2Y - 2 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  return Math.min(w1Y, w2Y) - 20;
}

/**
 * Helper to ensure there is enough vertical space on the current page for an entire block.
 * If not, adds a new page and returns the new page and starting Y.
 */
function ensureBlockSpace(
  requiredHeight: number,
  currentPage: any,
  pdfDoc: PDFDocument,
  currentPageNumber: number,
  robotoRegular: any,
  robotoBold: any,
  selectedLanguage: string,
  countrySettings: ReturnType<typeof getCountrySettings>,
  currentY: number
): { page: any; y: number; currentPageNumber: number } {
  if (currentY - requiredHeight < MARGINS.bottom) {
    const result = addNewPage(
      pdfDoc,
      currentPageNumber,
      false,
      robotoRegular,
      robotoBold,
      selectedLanguage,
      countrySettings.coverTopMargin
    );
    return {
      page: result.page,
      y: result.y,
      currentPageNumber: result.newPageNumber,
    };
  }
  return { page: currentPage, y: currentY, currentPageNumber };
}

// =====================================================
// MAIN PDF GENERATION FUNCTION
// =====================================================

export async function generatePDF(
  willText: string,
  selectedLanguage: string,
  selectedCountry: CountryKey,
  useCustomWitnessLayout: boolean = true
): Promise<Uint8Array> {
  // Create the PDF document and register the font kit
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Load and embed fonts
  const [regularBytes, boldBytes] = await Promise.all([
    fetch("/fonts/Roboto-Regular.ttf").then((r) => r.arrayBuffer()),
    fetch("/fonts/Roboto-Bold.ttf").then((r) => r.arrayBuffer()),
  ]);
  const robotoRegular = await pdfDoc.embedFont(regularBytes);
  const robotoBold = await pdfDoc.embedFont(boldBytes);

  const countrySettings = getCountrySettings(selectedCountry);
  let currentPageNumber = 1;
  let { page, newPageNumber, y } = addNewPage(
    pdfDoc,
    currentPageNumber,
    true,
    robotoRegular,
    robotoBold,
    selectedLanguage,
    countrySettings.coverTopMargin
  );
  currentPageNumber = newPageNumber;

  // Clean and parse the AI-generated text
  const cleaned = cleanText(willText);
  let sections = parseSections(willText);
  if (Object.keys(sections).length === 0) {
    // Fallback: if no markers are found, treat the entire text as the cover section.
    sections.cover = cleaned;
  }

  // Process special legal notes (lines starting with "*NOTE:") if present
  let legalNotesBottom = "";
  if (sections.legal) {
    const legalLines = sections.legal.split("\n");
    const mainLines: string[] = [];
    const noteLines: string[] = [];
    for (const line of legalLines) {
      if (line.trim().startsWith("*NOTE:")) {
        noteLines.push(line.trim());
      } else {
        mainLines.push(line);
      }
    }
    sections.legal = mainLines.join("\n");
    legalNotesBottom = noteLines.join("\n");
  }

  // =====================================================
  // Section 1: Cover Page (Testator Details)
  // =====================================================
  if (sections.cover) {
    const coverContent = sections.cover.trim();
    // Ensure there is enough space on the current page for the entire cover block
    ({ page, y, currentPageNumber } = ensureBlockSpace(
      50,
      page,
      pdfDoc,
      currentPageNumber,
      robotoRegular,
      robotoBold,
      selectedLanguage,
      countrySettings,
      y
    ));
    y = drawTextBlock(page, coverContent, robotoRegular, 12, y);
  }

  // =====================================================
  // Section 2: Declaration Section
  // =====================================================
  if (sections.declaration) {
    ({ page, y, currentPageNumber } = ensureBlockSpace(
      50,
      page,
      pdfDoc,
      currentPageNumber,
      robotoRegular,
      robotoBold,
      selectedLanguage,
      countrySettings,
      y
    ));
    y = drawSectionHeader(
      page,
      y,
      LANGUAGE_MAPPING[selectedLanguage].sectionLabels.declaration,
      robotoBold
    );
    const declContent = sections.declaration.trim();
    y = drawTextBlock(page, declContent, robotoRegular, 12, y);
  }

  // =====================================================
  // Section 3: Articles Section (Core Provisions)
  // =====================================================
  if (sections.articles) {
    ({ page, y, currentPageNumber } = ensureBlockSpace(
      50,
      page,
      pdfDoc,
      currentPageNumber,
      robotoRegular,
      robotoBold,
      selectedLanguage,
      countrySettings,
      y
    ));
    y = drawSectionHeader(
      page,
      y,
      LANGUAGE_MAPPING[selectedLanguage].sectionLabels.articles,
      robotoBold
    );
    const articleLines = sections.articles.split("\n");
    const articleBlocks = splitArticles(articleLines);
    for (const block of articleBlocks) {
      // Build wrapped lines for the entire article block.
      const wrappedLines: { text: string; bold: boolean }[] = [];
      if (block.length && ARTICLE_REGEX.test(block[0].trim())) {
        // Combine heading lines if needed
        let heading = block[0].trim();
        if (
          block.length > 1 &&
          block[1].trim() === block[1].trim().toUpperCase()
        ) {
          heading += " - " + block[1].trim();
          block.splice(1, 1);
        }
        wrapText(heading, robotoBold, 12, MAX_TEXT_WIDTH).forEach((l) =>
          wrappedLines.push({ text: l, bold: true })
        );
        wrappedLines.push({ text: "", bold: false });
        for (let i = 1; i < block.length; i++) {
          wrapText(block[i].trim(), robotoRegular, 12, MAX_TEXT_WIDTH).forEach(
            (l) => wrappedLines.push({ text: l, bold: false })
          );
        }
      } else {
        for (const raw of block) {
          const trimmed = raw.trim();
          if (trimmed) {
            const isHeading = ARTICLE_REGEX.test(trimmed);
            wrapText(
              trimmed,
              isHeading ? robotoBold : robotoRegular,
              12,
              MAX_TEXT_WIDTH
            ).forEach((l) => wrappedLines.push({ text: l, bold: isHeading }));
          }
        }
      }
      // Estimate block height for this article block.
      const blockHeight =
        wrappedLines.length * LINE_SPACING + EMPTY_LINE_SPACING;
      // If the entire block won't fit, add a new page.
      ({ page, y, currentPageNumber } = ensureBlockSpace(
        blockHeight,
        page,
        pdfDoc,
        currentPageNumber,
        robotoRegular,
        robotoBold,
        selectedLanguage,
        countrySettings,
        y
      ));
      // Draw the article block.
      for (const lineObj of wrappedLines) {
        page.drawText(lineObj.text, {
          x: MARGINS.side,
          y,
          font: lineObj.bold ? robotoBold : robotoRegular,
          size: 12,
        });
        y -= LINE_SPACING;
      }
      y -= EMPTY_LINE_SPACING;
    }
  }

  // =====================================================
  // Section 4: Witness Section (if applicable)
  // =====================================================
  if (countrySettings.showWitness && sections.witness) {
    ({ page, y, currentPageNumber } = ensureBlockSpace(
      50,
      page,
      pdfDoc,
      currentPageNumber,
      robotoRegular,
      robotoBold,
      selectedLanguage,
      countrySettings,
      y
    ));
    y = drawSectionHeader(
      page,
      y,
      LANGUAGE_MAPPING[selectedLanguage].sectionLabels.witness,
      robotoBold
    );
    if (useCustomWitnessLayout) {
      y = drawWitnessSection(page, y, robotoRegular, robotoBold);
    } else {
      const paragraphs = splitParagraphs(sections.witness);
      for (const para of paragraphs) {
        const paraText = para.join(" ");
        // Ensure the entire paragraph fits.
        const paraHeight =
          wrapText(paraText, robotoRegular, 12, MAX_TEXT_WIDTH).length *
            LINE_SPACING +
          EMPTY_LINE_SPACING;
        ({ page, y, currentPageNumber } = ensureBlockSpace(
          paraHeight,
          page,
          pdfDoc,
          currentPageNumber,
          robotoRegular,
          robotoBold,
          selectedLanguage,
          countrySettings,
          y
        ));
        y = drawTextBlock(page, paraText, robotoRegular, 12, y);
      }
    }
  }

  // =====================================================
  // Section 5: Legal Notes Section
  // =====================================================
  if (sections.legal) {
    ({ page, y, currentPageNumber } = ensureBlockSpace(
      50,
      page,
      pdfDoc,
      currentPageNumber,
      robotoRegular,
      robotoBold,
      selectedLanguage,
      countrySettings,
      y
    ));
    y = drawSectionHeader(
      page,
      y,
      LANGUAGE_MAPPING[selectedLanguage].sectionLabels.legal,
      robotoBold
    );
    const legalContent = sections.legal.trim();
    y = drawTextBlock(page, legalContent, robotoRegular, 12, y);
    // Render any special legal note lines (e.g. those starting with "*NOTE:")
    if (legalNotesBottom) {
      const noteLines = wrapText(
        legalNotesBottom,
        robotoRegular,
        12,
        MAX_TEXT_WIDTH
      );
      for (const note of noteLines) {
        page.drawText(note, {
          x: MARGINS.side,
          y,
          font: robotoRegular,
          size: 12,
        });
        y -= LINE_SPACING;
      }
      y -= EMPTY_LINE_SPACING;
    }
  } else {
    // If no legal section provided, output the disclaimer at the bottom.
    const disclaimer = LANGUAGE_MAPPING[selectedLanguage].disclaimer;
    if (disclaimer) {
      const discWidth = robotoRegular.widthOfTextAtSize(disclaimer, 12);
      if (y - 12 - 20 < MARGINS.bottom) {
        const result = addNewPage(
          pdfDoc,
          currentPageNumber,
          false,
          robotoRegular,
          robotoBold,
          selectedLanguage,
          countrySettings.coverTopMargin
        );
        page = result.page;
        y = result.y;
        currentPageNumber = result.newPageNumber;
      }
      page.drawText(disclaimer, {
        x: (PAGE_WIDTH - discWidth) / 2,
        y: MARGINS.bottom,
        font: robotoRegular,
        size: 12,
      });
    }
  }

  // =====================================================
  // Section 6: Testator’s Signature Section
  // =====================================================
  if (y < MARGINS.bottom + 50) {
    const result = addNewPage(
      pdfDoc,
      currentPageNumber,
      false,
      robotoRegular,
      robotoBold,
      selectedLanguage,
      countrySettings.coverTopMargin
    );
    page = result.page;
    y = result.y;
    currentPageNumber = result.newPageNumber;
  }
  y = drawTestatorSignature(
    page,
    y,
    robotoRegular,
    robotoBold,
    selectedLanguage
  );

  return await pdfDoc.save();
}
