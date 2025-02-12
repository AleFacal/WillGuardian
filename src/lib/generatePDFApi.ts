// lib/generatePDFApi.ts
import { CountryKey } from "@/lib/types";

interface TestatorInfo {
  name: string;
  dob: string;
  nationality: string;
}

interface ExecutorInfo {
  executor: string;
  backupExecutor: string;
}

interface GeneratePDFParams {
  willText: string;
  selectedLanguage: string;
  selectedCountry: CountryKey;
  testatorInfo: TestatorInfo;
  executorInfo: ExecutorInfo;
  bequests: string[];
  funeralInstructions: string;
}

export async function generatePDFApi(
  params: GeneratePDFParams
): Promise<Uint8Array> {
  const response = await fetch("/api/generatePDF", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error("Failed to generate PDF");
  }
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}
