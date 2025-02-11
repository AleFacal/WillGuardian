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

 *   requiresWitnesses: boolean,
 *   hasMinorChildren: boolean,
 *   guardianName: string,
 *   backupGuardianName: string,
 *   useSelfProvingAffidavit: boolean,

 *   ukHasMinorChildren: boolean,
 *   ukGuardianName: string,
 *   ukBackupGuardian: string,
 *   ukAttestationClause: boolean,

 *   deIsHolographic: boolean,
 *   frIsAuthenticWill: boolean,
 *   esIsNotarialWill: boolean,
 *   chIsPublicNotarial: boolean
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
      requiresWitnesses,

      // US
      hasMinorChildren,
      guardianName,
      backupGuardianName,
      useSelfProvingAffidavit,

      // UK
      ukHasMinorChildren,
      ukGuardianName,
      ukBackupGuardian,
      ukAttestationClause,

      // DE
      deIsHolographic,

      // FR
      frIsAuthenticWill,

      // ES
      esIsNotarialWill,

      // CH
      chIsPublicNotarial,
    } = body;

    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key is missing!" },
        { status: 500 }
      );
    }

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

    // If user or logic says we need a witness section
    if (requiresWitnesses) {
      prompt += `
<<<WITNESS>>>
Provide a Witness Section with spaces for at least two witnesses to sign and provide a date.
`;
    }

    prompt += `
<<<LEGAL>>>
Include any additional legal disclaimers or notes that are required.

Please ensure that the output does NOT include any extra markdown symbols (like ** or ---) and that the section markers (the lines with <<<...>>>) appear exactly as specified.

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

    // ---------------------------
    // US
    // ---------------------------
    if (selectedCountry === "us") {
      if (hasMinorChildren) {
        prompt += `
You must include a Guardianship Clause for minor children:
Guardian: ${guardianName}
Backup Guardian: ${backupGuardianName}
`;
      }
      if (useSelfProvingAffidavit) {
        prompt += `
Please include a Self-Proving Affidavit (common in many US states) after the main will content.
`;
      }
    }

    // ---------------------------
    // UK
    // ---------------------------
    if (selectedCountry === "uk") {
      if (ukHasMinorChildren) {
        prompt += `
[UK] Minor Children => Guardian: ${ukGuardianName}, Backup: ${ukBackupGuardian}
`;
      }
      if (ukAttestationClause) {
        prompt += `
[UK] Please add a formal Attestation Clause stating the will was signed in presence of two witnesses.
`;
      }
    }

    // ---------------------------
    // Germany
    // ---------------------------
    if (selectedCountry === "de" && deIsHolographic) {
      prompt += `
[DE] This is a fully handwritten (holographic) will => no witnesses needed.
`;
    }

    // ---------------------------
    // France
    // ---------------------------
    if (selectedCountry === "fr" && frIsAuthenticWill) {
      prompt += `
[FR] This is an authentic (notarial) will => notary + 2 witnesses usually involved.
`;
    }

    // ---------------------------
    // Spain
    // ---------------------------
    if (selectedCountry === "es" && esIsNotarialWill) {
      prompt += `
[ES] This is a notarial will => prepared with a notary in Spain.
`;
    }

    // ---------------------------
    // Switzerland
    // ---------------------------
    if (selectedCountry === "ch" && chIsPublicNotarial) {
      prompt += `
[CH] This is a public notarial will => notary + 2 witnesses in Switzerland.
`;
    }

    // ---------------------------
    // Send to OpenAI
    // ---------------------------
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

    return NextResponse.json({ result: text });
  } catch (error) {
    console.error("Error generating testament:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
