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
 *
 *   requiresWitnesses: boolean,
 *   hasMinorChildren: boolean,
 *   guardianName: string,
 *   backupGuardianName: string,
 *   useSelfProvingAffidavit: boolean,
 *
 *   // US-specific
 *   usState: string,
 *
 *   // UK-specific
 *   ukHasMinorChildren: boolean,
 *   ukGuardianName: string,
 *   ukBackupGuardian: string,
 *   ukAttestationClause: boolean,
 *
 *   // Germany-specific
 *   deIsHolographic: boolean,
 *
 *   // France-specific
 *   frIsAuthenticWill: boolean,
 *   frIsHolographic: boolean,
 *
 *   // Spain-specific
 *   esIsNotarialWill: boolean,
 *   esIsHolographic: boolean,
 *
 *   // Switzerland-specific
 *   chIsPublicNotarial: boolean,
 *   chIsHolographic: boolean
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
      usState,

      // UK
      ukHasMinorChildren,
      ukGuardianName,
      ukBackupGuardian,
      ukAttestationClause,

      // DE
      deIsHolographic,

      // FR
      frIsAuthenticWill,
      frIsHolographic,

      // ES
      esIsNotarialWill,
      esIsHolographic,

      // CH
      chIsPublicNotarial,
      chIsHolographic,
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
- Identification Number (if not provided, output the placeholder [ID_BLANK])
- Marital Status

<<<DECLARATION>>>
Include a clear declaration that this is the Last Will and Testament, revoking all previous wills and codicils.

<<<ARTICLES>>>
List the Articles sequentially (e.g. "Article I", "Article II", etc.) covering at least:
- Executor Instructions (including naming an alternate executor)
- Specific Bequests and Distribution of Assets
- Beneficiaries
- Funeral Instructions
- Legal Provisions (including revocation of previous wills, any witness requirements, and, if applicable, self-proving affidavit or notarial clauses)
`;

    if (requiresWitnesses) {
      prompt += `
<<<WITNESS>>>
Include a Witness Section with spaces for at least two witnesses to sign and provide a date.
`;
    }

    prompt += `
<<<LEGAL>>>
Include any additional legal disclaimers or notes that are required.

--- Testator's Details ---
Full Name: ${userName}
Date of Birth: ${dob}
Residence: ${address}
Nationality: ${nationality}
Identification Number: ${
      identificationNumber ? identificationNumber : "[ID_BLANK]"
    }
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

    if (selectedCountry === "us") {
      if (usState) {
        prompt += `
[US] State: ${usState}. Ensure compliance with notarization and self-proving affidavit requirements.
`;
      }
      if (hasMinorChildren) {
        prompt += `
[US] Minor Children detected. Include a Guardianship Clause with Primary: ${guardianName}, Backup: ${backupGuardianName}.
`;
      }
      if (useSelfProvingAffidavit) {
        prompt += `
[US] Include a Self-Proving Affidavit after the main will content.
`;
      }
    }

    if (selectedCountry === "uk") {
      if (ukHasMinorChildren) {
        prompt += `
[UK] Minor Children detected. Include a Guardianship Clause with Guardian: ${ukGuardianName}, Backup: ${ukBackupGuardian}.
`;
      }
      if (ukAttestationClause) {
        prompt += `
[UK] Include a formal Attestation Clause confirming simultaneous witness signing.
`;
      }
    }

    if (selectedCountry === "de" && deIsHolographic) {
      prompt += `
[DE] This is a fully handwritten (holographic) will; no witnesses required.
`;
    }

    if (selectedCountry === "fr") {
      if (frIsHolographic) {
        prompt += `
[FR] This is a fully handwritten (holographic) will; no witnesses required.
`;
      } else if (frIsAuthenticWill) {
        prompt += `
[FR] This is an authentic (notarial) will; typically, a notary and two witnesses are involved.
`;
      }
    }

    if (selectedCountry === "es") {
      if (esIsHolographic) {
        prompt += `
[ES] This is a fully handwritten (holographic) will; no witnesses required.
`;
      } else if (esIsNotarialWill) {
        prompt += `
[ES] This is a notarial will; notary involvement is required.
`;
      }
    }

    if (selectedCountry === "ch") {
      if (chIsHolographic) {
        prompt += `
[CH] This is a fully handwritten (holographic) will; no notary or witnesses required.
`;
      } else if (chIsPublicNotarial) {
        prompt += `
[CH] This is a public notarial will; a notary and two witnesses are required.
`;
      }
    }

    prompt += `
Country: ${selectedCountry}
Language: ${selectedLanguage}
`;

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
