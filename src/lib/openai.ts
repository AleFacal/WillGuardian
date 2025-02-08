// lib/openai.ts

export async function generateWill(
  userName: string,
  dob: string,
  address: string,
  nationality: string,
  executor: string,
  backupExecutor: string,
  executorInstructions: string,
  assets: string,
  beneficiaries: string,
  witnesses: string,
  legalNotes: string,
  selectedCountry: string,
  selectedLanguage: string
) {
  try {
    const response = await fetch("/api/generateWill", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userName,
        dob,
        address,
        nationality,
        executor,
        backupExecutor,
        executorInstructions,
        assets,
        beneficiaries,
        witnesses,
        legalNotes,
        selectedCountry,
        selectedLanguage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Unknown error occurred");
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error("Error in generateWill:", error);
    throw error;
  }
}
