import { NextResponse } from "next/server";

/**
 * Builds a prompt for OpenAI, ensuring placeholders and bullet points
 * for better readability. Also includes country-specific instructions.
 */
function buildPrompt(body: any): string {
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

  // Simple fallback placeholders
  const finalUserName = userName?.trim() || "[No Name Provided]";
  const finalExecutor =
    executor?.trim() || "[No Executor Specified – Please Provide One]";
  const finalIDNumber = identificationNumber?.trim() || "[ID_BLANK]";
  const finalFuneral = funeralInstructions?.trim() || "[No funeral preference]";
  const finalExecutorInstr =
    executorInstructions?.trim() ||
    "The executor shall act in the best interest of the estate, settle all debts, taxes, and expenses, then distribute the remainder.";
  const finalLegalNotes = legalNotes?.trim() || "[No legal notes provided]";
  const finalAssets = assets?.trim() || "[No assets listed]";
  const finalBeneficiaries =
    beneficiaries?.trim() || "[No beneficiaries listed]";

  // Base prompt with instructions to GPT
  let prompt = `
Generate a legally valid and professional Last Will and Testament in ${selectedLanguage} for the legal requirements of ${selectedCountry}.
Use bullet points for specific bequests for clearer readability.

The output MUST follow this exact structure with the following section identifiers (each on a separate line):

<<<COVER>>>
Include Testator Details:
- Full Name
- Date of Birth
- Residence
- Nationality
- Identification Number (if blank, output the placeholder [ID_BLANK])
- Marital Status

<<<DECLARATION>>>
A declaration that this is the Last Will and Testament, revoking all previous wills.

<<<ARTICLES>>>
Sequentially list the Articles (e.g., "Article I", "Article II", etc.) covering:
- Executor Instructions (with backup)
- Specific Bequests (in bullet points)
- Beneficiaries
- Funeral Instructions
- Legal Provisions (revocation, witness requirements, self-proving affidavit or notarial clauses)
`;

  // If witnesses are required, add the marker
  if (requiresWitnesses) {
    prompt += `
<<<WITNESS>>>
Include a Witness Section with spaces for at least two witnesses to sign and date.
`;
  }

  prompt += `
<<<LEGAL>>>
Include any additional legal disclaimers or notes required.

--- Testator's Details ---
Full Name: ${finalUserName}
Date of Birth: ${dob}
Residence: ${address}
Nationality: ${nationality}
Identification Number: ${finalIDNumber}
Marital Status: ${maritalStatus}

Executor: ${finalExecutor}
Backup Executor: ${backupExecutor}
Executor Instructions: ${finalExecutorInstr}
Assets (use bullet points): ${finalAssets}
Beneficiaries: ${finalBeneficiaries}
Witnesses: ${witnesses || "Not Provided"}
Funeral Instructions: ${finalFuneral}
Legal Notes: ${finalLegalNotes}
`;

  // US-specific
  if (selectedCountry === "us") {
    if (usState) {
      prompt += `
[US] State of Residence: ${usState}. Include a clause: "This Will shall be governed by the laws of the State of ${usState}."
`;
    }
    if (hasMinorChildren) {
      prompt += `
[US] Minor Children: Include a Guardianship Clause with Primary: ${guardianName}, Backup: ${backupGuardianName}.
`;
    }
    if (useSelfProvingAffidavit) {
      prompt += `
[US] Include a Self-Proving Affidavit (notary + witnesses).
`;
    }
  }

  // UK-specific
  if (selectedCountry === "uk") {
    if (ukHasMinorChildren) {
      prompt += `
[UK] Minor Children: Guardianship Clause with Guardian: ${ukGuardianName}, Backup: ${ukBackupGuardian}.
`;
    }
    if (ukAttestationClause) {
      prompt += `
[UK] Include a formal Attestation Clause requiring two witnesses to sign simultaneously.
`;
    }
  }

  // DE
  if (selectedCountry === "de" && deIsHolographic) {
    prompt += `
[DE] This is a holographic (handwritten) will; no witnesses required.
`;
  }

  // FR
  if (selectedCountry === "fr") {
    if (frIsHolographic) {
      prompt += `
[FR] Holographic will: entirely handwritten, no witnesses required.
`;
    } else if (frIsAuthenticWill) {
      prompt += `
[FR] Authentic (notarial) will: notary + two witnesses typically involved.
`;
    }
  }

  // ES
  if (selectedCountry === "es") {
    if (esIsHolographic) {
      prompt += `
[ES] Holographic will: entirely handwritten, no witnesses required.
`;
    } else if (esIsNotarialWill) {
      prompt += `
[ES] Notarial will: notary involvement required.
`;
    }
  }

  // CH
  if (selectedCountry === "ch") {
    if (chIsHolographic) {
      prompt += `
[CH] Holographic will: no notary or witnesses required.
`;
    } else if (chIsPublicNotarial) {
      prompt += `
[CH] Public notarial will: notary + two witnesses required.
`;
    }
  }

  // Closing
  prompt += `
Country: ${selectedCountry}
Language: ${selectedLanguage}
`;

  return prompt;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = buildPrompt(body);

    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key is missing!" },
        { status: 500 }
      );
    }

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
        max_tokens: 2500,
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
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
