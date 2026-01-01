import { NextRequest, NextResponse } from "next/server";

// Fixed business context that guides the assistant behavior.
const BUSINESS_CONTEXT = `You are the WhatsApp business assistant for BrightPath Studio.
Business name: BrightPath Studio.
Services: Brand design, social media content, product photography, short-form video.
Location: Austin, Texas.
Contact: hello@brightpath.studio, +1 (512) 555-0199.
Tone: Friendly, professional, concise.
Behavior rules:
- Answer using only the business context.
- If the user asks about something not in context, ask exactly one short clarifying question.
- Keep replies natural and under 3 short sentences.`;

export async function POST(request: NextRequest) {
  try {
    // Parse the client message history.
    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];

    // Server-side call to OpenAI; the API key never reaches the client.
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: BUSINESS_CONTEXT },
          ...messages.map((message: { role: string; content: string }) => ({
            role: message.role,
            content: message.content,
          })),
        ],
        temperature: 0.6,
        max_tokens: 180,
      }),
    });

    if (!response.ok) {
      // Return a gentle fallback message if OpenAI fails.
      return NextResponse.json(
        { reply: "Sorry, I couldn't respond right now." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    // Send the assistant response back to the client.
    return NextResponse.json({ reply });
  } catch {
    // Fail safely if parsing or network requests fail.
    return NextResponse.json(
      { reply: "Sorry, I couldn't respond right now." },
      { status: 500 }
    );
  }
}
