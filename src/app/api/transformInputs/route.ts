// app/api/transformInputs/route.ts

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Get the body of the request (which contains the input data)
    const { inputs } = await request.json();
    const { maritalStatus, identificationNumber, funeralInstructions } = inputs;

    // Generate a prompt for ChatGPT to transform the input data into testament language
    const prompt = `
      Please transform the following text into formal, testament-appropriate language for inclusion in a legal will:
      
      Marital Status: ${maritalStatus}
      Identification Number: ${identificationNumber}
      Funeral Instructions: ${funeralInstructions}

      Return a structured and formal version of these elements, suitable for a Last Will and Testament.
    `;

    // OpenAI API key from environment variables
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API Key is missing!" },
        { status: 500 }
      );
    }

    // Make a call to the OpenAI API to transform the input
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4", // Change the model name if needed
        messages: [
          {
            role: "system",
            content:
              "You are an expert in legal documents specializing in writing last wills in a clear and structured format.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 1000,
      }),
    });

    // Check for errors in the OpenAI response
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || "Unknown error occurred" },
        { status: response.status }
      );
    }

    // Get the transformed text from the response
    const data = await response.json();
    return NextResponse.json({
      transformedInputs: {
        maritalStatus: data.choices?.[0]?.message?.content || "",
        identificationNumber: data.choices?.[0]?.message?.content || "",
        funeralInstructions: data.choices?.[0]?.message?.content || "",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
