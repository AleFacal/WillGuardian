import { useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import WillPDF, { CountryKey } from "./WillPDF";
import "./pdf.css";

interface PDFDownloadButtonProps {
  willText: string;
  selectedCountry: CountryKey;
  selectedLanguage?: string;
}

export default function PDFDownloadButton({
  willText,
  selectedCountry,
  selectedLanguage,
}: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <div className="text-center">
      <PDFDownloadLink
        document={
          <WillPDF
            willText={willText}
            selectedCountry={selectedCountry}
            selectedLanguage={selectedLanguage}
          />
        }
        fileName="My_Will.pdf"
        className="inline-block"
        onClick={() => setIsGenerating(true)}
      >
        <DownloadButton isGenerating={isGenerating} />
      </PDFDownloadLink>
    </div>
  );
}

function DownloadButton({ isGenerating }: { isGenerating: boolean }) {
  return (
    <div className="buttonContainer">
      <button
        className={`pdfDownloadButton ${
          isGenerating ? "opacity-50 cursor-not-allowed" : "hover:bg-green-600"
        }`}
        disabled={isGenerating}
      >
        {isGenerating ? "Preparing PDF..." : "Download as PDF"}
      </button>
    </div>
  );
}
