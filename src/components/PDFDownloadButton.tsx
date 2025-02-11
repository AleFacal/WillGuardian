// File: PDFDownloadButton.tsx
import React from "react";

export interface PDFDownloadButtonProps {
  pdfBytes: Uint8Array;
}

const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({ pdfBytes }) => {
  const handleDownload = () => {
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "will.pdf";
    link.click();
  };

  return (
    <div style={{ textAlign: "center" }}>
      <button
        onClick={handleDownload}
        className="pdfDownloadButton hover:bg-green-600"
        aria-label="Download PDF"
      >
        Download as PDF
      </button>
    </div>
  );
};

export default PDFDownloadButton;
