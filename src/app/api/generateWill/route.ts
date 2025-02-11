// File: /app/api/generateTestament/route.ts
import { NextResponse } from "next/server";

/**
 * Example request body structure:
 * {
 *   userName: string,
 *   dob: string,
 *   address: string,
 *   nationality: string,
 *   executor: string,
 *   backupExecutor: string,
 *   executorInstructions: string,
 *   assets: string,
 *   beneficiaries: string,
 *   witnesses: string,
 *   legalNotes: string,
 *   maritalStatus: string,
 *   identificationNumber: string,
 *   funeralInstructions: string,
 *   selectedCountry: string,
 *   selectedLanguage: string,
 *   requiresWitnesses: boolean
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
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
      maritalStatus,
      identificationNumber,
      funeralInstructions,
      selectedCountry,
      selectedLanguage,
      requiresWitnesses, // <-- pass true/false from client
    } = body;

    // Validate or fallback
    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "API Key is missing!" },
        { status: 500 }
      );
    }
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    // Build prompt
    let prompt = `
Generate a legally valid and professional Last Will and Testament in ${selectedLanguage} for the legal requirements of ${selectedCountry}.
The output MUST follow this exact structure with the given section identifiers (each on a separate line):

<<<COVER>>>
Provide the Testator's Details including:
- Full Name
- Date of Birth
- Residence
- Nationality
- Identification Number (if not provided, leave as blank underline)
- Marital Status

<<<DECLARATION>>>
Provide a clear declaration that this is the Last Will and Testament which revokes all previous wills and codicils.

<<<ARTICLES>>>
List the Articles sequentially (e.g. "Article I", "Article II", etc.) covering at least:
- Executor Instructions (including naming an alternate executor)
- Specific Bequests and Distribution of Assets
- Beneficiaries
- Funeral Instructions
- Legal Provisions (including revocation of previous wills and any witness requirements)
`;

    // Conditionally include the WITNESS section
    if (requiresWitnesses) {
      prompt += `
<<<WITNESS>>>
Provide a Witness Section with spaces for at least two witnesses to sign and provide a date.
`;
    }

    // Always include LEGAL section
    prompt += `
<<<LEGAL>>>
Include any additional legal disclaimers or notes that are required.

Please ensure that the output does not include any extra markdown symbols (like ** or ---) and that the section markers (the lines with <<<...>>>) appear exactly as specified.

Testator's Details:
Full Name: ${userName}
Date of Birth: ${dob}
Residence: ${address}
Nationality: ${nationality}
Identification Number: ${identificationNumber}
Marital Status: ${maritalStatus}

Executor: ${executor}
Backup Executor: ${backupExecutor}
Executor Instructions: ${executorInstructions}
Assets: ${assets}
Beneficiaries: ${beneficiaries}
Witnesses: ${witnesses}
Funeral Instructions: ${funeralInstructions || "Not Provided"}
Legal Notes: ${legalNotes}
`;

    // Call OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a legal expert specializing in drafting Last Wills and Testaments.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || "OpenAI request failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "No response from AI.";

    return NextResponse.json({
      result: text,
    });
  } catch (error) {
    console.error("Error generating testament:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
