import React, { useState, useEffect } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import { Font } from "@react-pdf/renderer";

// Load the bold font manually
Font.register({
  family: "Times-Bold",
  src: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.36/fonts/times-bold.ttf",
});

Font.register({
  family: "Times-Roman",
  src: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.36/fonts/times-roman.ttf",
});

export type CountryKey = "us" | "uk" | "de" | "ch" | "fr" | "es";

interface WillPDFProps {
  willText: string;
  selectedCountry: string;
  selectedLanguage?: string;
}

// Declare currentPageHeightUsed globally
let currentPageHeightUsed = 0;

const pageHeight = 842;
const pageMarginTop = 60;
const pageMarginBottom = 40;
const pageContentHeight = pageHeight - pageMarginTop - pageMarginBottom;

// Styles
const styles = StyleSheet.create({
  page: {
    paddingTop: pageMarginTop,
    paddingBottom: pageMarginBottom,
    paddingHorizontal: 50,
    fontSize: 13,
    fontFamily: "Times-Roman",
    lineHeight: 1.25,
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  header: {
    fontSize: 26, // Fixed font size for all languages
    fontFamily: "Times-Bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  subHeader: {
    fontSize: 20,
    fontFamily: "Times-Bold",
    textAlign: "center",
    marginBottom: 20,
    fontStyle: "italic",
  },
  sectionHeader: {
    fontSize: 14,
    marginTop: 24,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 12,
    marginBottom: 16,
    textAlign: "justify",
    fontFamily: "Times-Roman",
    lineHeight: 1.6,
  },
  boldText: {
    fontFamily: "Times-Bold",
  },
  container: {
    flex: 1,
    flexWrap: "wrap",
    marginBottom: 20,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  witnessContainer: {
    marginTop: 20,
    marginBottom: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 8,
    flexWrap: "nowrap",
    pageBreakBefore: "always",
  },
  witnessTitle: {
    fontSize: 16,
    fontFamily: "Times-Bold",
    fontWeight: "bold",
    marginBottom: 15,
    textDecoration: "underline",
  },
  witnessField: {
    fontSize: 12,
    marginBottom: 12,
    fontFamily: "Times-Roman",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 10,
    fontFamily: "Times-Roman",
  },
  signatureSection: {
    marginTop: 40,
    marginBottom: 40,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#333333",
    paddingTop: 12,
    pageBreakBefore: "always",
  },
});

type LanguageKeys = "English" | "Spanish" | "German" | "French" | "Italian";

// Mapping for article titles, witness labels, and document title in different languages
const languageMapping: Record<
  LanguageKeys,
  {
    title: string;
    subtitle: string;
    witnessLabel: string;
    witness1: string;
    witness2: string;
  }
> = {
  English: {
    title: "LAST WILL AND TESTAMENT",
    subtitle: "Declaration of Intent and Legal Provisions",
    witnessLabel: "Witness",
    witness1: "Witness 1",
    witness2: "Witness 2",
  },
  Spanish: {
    title: "TESTAMENTO",
    subtitle: "Declaración de Intención y Disposiciones Legales",
    witnessLabel: "Testigo",
    witness1: "Testigo 1",
    witness2: "Testigo 2",
  },
  German: {
    title: "TESTAMENT",
    subtitle: "Absichtserklärung und gesetzliche Bestimmungen",
    witnessLabel: "Zeuge",
    witness1: "Zeuge 1",
    witness2: "Zeuge 2",
  },
  French: {
    title: "TESTAMENT",
    subtitle: "Déclaration d'intention et dispositions légales",
    witnessLabel: "Témoin",
    witness1: "Témoin 1",
    witness2: "Témoin 2",
  },
  Italian: {
    title: "TESTAMENTO",
    subtitle: "Dichiarazione di Intenti e Disposizioni Legali",
    witnessLabel: "Testimone",
    witness1: "Testimone 1",
    witness2: "Testimone 2",
  },
};

// Function to parse bold text
const parseBoldText = (text: string) => {
  const regex = /\*\*(.*?)\*\*/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(
        <Text key={lastIndex} style={styles.paragraph}>
          {text.substring(lastIndex, match.index)}
        </Text>
      );
    }
    elements.push(
      <Text key={match.index} style={[styles.paragraph, styles.boldText]}>
        {match[1]}
      </Text>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    elements.push(
      <Text key={lastIndex} style={styles.paragraph}>
        {text.substring(lastIndex)}
      </Text>
    );
  }
  return elements;
};

// Function to estimate content height based on text
const getEstimatedHeight = (
  text: string,
  fontSize: number,
  lineHeight: number
) => {
  const lines = Math.ceil(text.length / 60); // Estimate lines (60 characters per line, adjust as needed)
  return lines * fontSize * lineHeight;
};

// Function to check if content fits on the current page
const shouldMoveToNextPage = (contentHeight: number) => {
  if (currentPageHeightUsed + contentHeight > pageContentHeight) {
    currentPageHeightUsed = 0; // Reset and start a new page when current page exceeds the content height.
    return true; // Force next page.
  }
  currentPageHeightUsed += contentHeight; // Add content height to current page.
  return false; // Content fits on the current page.
};

// Split content by paragraphs
const splitContent = (content: string) => {
  const parts = content.split("\n\n"); // Split by paragraphs
  return parts.map((part, index) => (
    <Text key={index} style={styles.paragraph}>
      {parseBoldText(part)}
    </Text>
  ));
};

// Component for each Article
// Component for each Article
// In the Article component

const Article = ({
  articleTitle,
  articleContent,
}: {
  articleTitle: string;
  articleContent: string;
}) => {
  const estimatedHeight = getEstimatedHeight(articleContent, 12, 1.6);
  const moveToNextPage = shouldMoveToNextPage(estimatedHeight);

  // If the content doesn't fit on the page, move to the next page and keep the title on the first page
  if (moveToNextPage) {
    return (
      <Page size="A4" style={styles.page}>
        <Text style={[styles.sectionHeader, styles.boldText]}>
          {articleTitle}
        </Text>
        {splitContent(articleContent)} {/* Content goes here */}
      </Page>
    );
  }

  // If content fits, render normally in the current view
  return (
    <View style={styles.container}>
      <Text style={[styles.sectionHeader, styles.boldText]}>
        {articleTitle}
      </Text>
      {splitContent(articleContent)} {/* Content goes here */}
    </View>
  );
};

// WillPDF Component
export default function WillPDF({
  willText,
  selectedCountry,
  selectedLanguage = "English",
}: WillPDFProps) {
  const language = selectedLanguage as LanguageKeys;

  const title = languageMapping[language].title;
  const subtitle = languageMapping[language].subtitle;

  const paragraphs = willText.split("\n\n");

  const articleTitle =
    languageMapping[language].title || languageMapping["English"].title;

  const showWitnesses = ["uk", "de", "ch"].includes(selectedCountry);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{title}</Text>
        <Text style={styles.subHeader}>{subtitle}</Text>

        <View style={{ marginTop: 40 }}>
          {paragraphs.map((para, index) => {
            const isArticle = /^ARTICLE\s+/i.test(para);
            if (isArticle) {
              const [title, ...contentParts] = para.split("\n");
              return (
                <Article
                  key={index}
                  articleTitle={`${articleTitle} ${title
                    .replace("ARTICLE", "")
                    .trim()}`}
                  articleContent={contentParts.join("\n")}
                />
              );
            }
            return (
              <Text key={index} style={styles.paragraph}>
                {parseBoldText(para)}
              </Text>
            );
          })}
        </View>

        {showWitnesses && (
          <View style={styles.witnessContainer}>
            <Text style={styles.witnessTitle}>
              {languageMapping[language].witness1}
            </Text>
            <Text style={styles.witnessField}>
              Name: _________________________
            </Text>
            <Text style={styles.witnessField}>
              Address: _________________________
            </Text>
            <Text style={styles.witnessField}>
              Profession: _________________________
            </Text>
            <Text style={styles.witnessField}>
              Date: _________________________
            </Text>
          </View>
        )}

        {showWitnesses && (
          <View style={styles.witnessContainer}>
            <Text style={styles.witnessTitle}>
              {languageMapping[language].witness2}
            </Text>
            <Text style={styles.witnessField}>
              Name: _________________________
            </Text>
            <Text style={styles.witnessField}>
              Address: _________________________
            </Text>
            <Text style={styles.witnessField}>
              Profession: _________________________
            </Text>
            <Text style={styles.witnessField}>
              Date: _________________________
            </Text>
          </View>
        )}

        <View style={styles.signatureSection}>
          <Text>______________________________________</Text>
          <Text style={styles.boldText}>Signature</Text>
        </View>
      </Page>
    </Document>
  );
}
