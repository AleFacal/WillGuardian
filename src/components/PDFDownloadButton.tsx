// PDFDownloadButton.tsx
import React from "react";

interface PDFDownloadButtonProps {
  pdfBytes: Uint8Array;
}

export default function PDFDownloadButton({
  pdfBytes,
}: PDFDownloadButtonProps) {
  const downloadPDF = () => {
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "last_will_and_testament.pdf";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 10000);
  };

  return (
    <button type="button" onClick={downloadPDF} className="download-button">
      Download PDF
    </button>
  );
}
