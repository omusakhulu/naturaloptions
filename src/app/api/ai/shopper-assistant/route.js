import { NextResponse } from 'next/server';
import { getGeminiResponse } from '@/utils/gemini';
import { getWooCommerceContext } from '@/utils/wooContext';

export async function POST(req) {
  try {
    const { message, history = [] } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Fetch product context
    const productContext = await getWooCommerceContext();

    const systemPrompt = `
      You are a professional and friendly AI Shopper and Store Assistant for "Natural Options".
      Your goal is to help customers find products, answer questions about availability and pricing, and provide recommendations.
      Additionally, you can provide the store owner with high-level performance information if they ask about sales or shop performance.
      
      Use the following shop and product information as your primary source of truth:
      ${productContext}
      
      Guidelines:
      1. Be helpful, polite, and concise.
      2. If a product is mentioned, you can provide its price and link.
      3. If you don't know the answer or the data isn't in the list, politely inform the user.
      4. Always maintain a professional yet warm tone.
      5. Do not invent products or performance figures that are not in the context.
      6. For performance data, summarize it clearly for the owner.
    `;

    // Clean history: Gemini requires history to start with 'user' role and alternate roles
    let cleanHistory = [];
    if (history && history.length > 0) {
      // Find the first user message index
      const firstUserIndex = history.findIndex(h => h.role === 'user');
      if (firstUserIndex !== -1) {
        cleanHistory = history.slice(firstUserIndex);
      }
    }

    const response = await getGeminiResponse(message, cleanHistory, systemPrompt);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Shopper Assistant API Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
