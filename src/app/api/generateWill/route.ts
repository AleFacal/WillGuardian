import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Parse the incoming request
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
    } = body;

    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key is missing!" },
        { status: 500 }
      );
    }

    // Build country-specific prompt, incorporating the selected language
    let prompt = `Generate a legally structured will in ${selectedLanguage} according to the legal requirements of ${selectedCountry}.
    The will should be divided into sections with headings like "Article I", "Article II", and so on. Ensure each section has a title and content as per legal requirements.
    The generated Solution should be extensive based on the provided user information.
    
    **Do not include any separator lines (e.g., "---") between articles or sections**. The content should flow continuously from one section to the next without any horizontal lines or breaks. Each article should start with a title (e.g., "Article I"), followed by the content. 

    Name: ${userName}
    Date of Birth: ${dob}
    Address: ${address}
    Nationality: ${nationality}
    Executor: ${executor}
    Backup Executor: ${backupExecutor}
    Executor Instructions: ${executorInstructions}
    Assets: ${assets}
    Beneficiaries: ${beneficiaries}
    Witnesses: ${witnesses}
    Legal Notes: ${legalNotes}
    Marital Status: ${maritalStatus || "Not Provided"}
    Identification Number: ${identificationNumber || "Not Provided"}
    Funeral Instructions: ${funeralInstructions || "Not Provided"}
    
    Ensure proper formatting and legal clauses for ${selectedCountry}, particularly around witness requirements and mandatory clauses for the country. The will should have headings for each section, like "Article I", "Article II", etc., **without including any separator lines like "---**.
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
            content: "You are a legal expert specializing in Last Wills.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || "Error occurred" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      result: data.choices?.[0]?.message?.content || "No response from AI.",
    });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
