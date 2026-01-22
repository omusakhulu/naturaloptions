import { NextResponse } from 'next/server';
import { getGeminiResponse } from '@/utils/gemini';
import { getWooCommerceContext } from '@/utils/wooContext';
import * as businessTools from '@/utils/aiBusinessTools';

const BUSINESS_TOOLS_CONFIG = [
  {
    name: "getProjectPerformance",
    description: "Get performance metrics for projects including revenue, profit, and margins. Can be sorted by profit.",
    parameters: {
      type: "OBJECT",
      properties: {
        limit: { type: "NUMBER", description: "Number of projects to return (default 10)." },
        sortBy: { type: "STRING", enum: ["profit", "date"], description: "Sort by profit or date (default profit)." }
      },
    },
  },
  {
    name: "getProjectDetails",
    description: "Get detailed information about a specific project by name or ID, including crew and cost reports.",
    parameters: {
      type: "OBJECT",
      properties: {
        identifier: { type: "STRING", description: "Project name or ID." }
      },
      required: ["identifier"]
    },
  },
  {
    name: "getOrderDetails",
    description: "Get detailed information about a POS sale or WooCommerce order by ID or order number.",
    parameters: {
      type: "OBJECT",
      properties: {
        identifier: { type: "STRING", description: "Order ID, number, or Sale Number." }
      },
      required: ["identifier"]
    },
  },
  {
    name: "getSalesReport",
    description: "Get a sales summary for a specific number of days, including total revenue and top products.",
    parameters: {
      type: "OBJECT",
      properties: {
        days: {
          type: "NUMBER",
          description: "Number of days to look back (default 30).",
        },
      },
    },
  },
  {
    name: "getInventoryHealth",
    description: "Check for low stock items and get total inventory valuation.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "getExpenseSummary",
    description: "Get a summary of business expenses by category for a specific number of days.",
    parameters: {
      type: "OBJECT",
      properties: {
        days: {
          type: "NUMBER",
          description: "Number of days to look back (default 30).",
        },
      },
    },
  },
  {
    name: "getCustomerInsights",
    description: "Get insights about customers, including total count and top spenders.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "getLogisticsStatus",
    description: "Get the current status of deliveries and vehicle usage.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
];

export async function POST(req) {
  try {
    const { message, history = [] } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Fetch product context (legacy context-based approach for shoppers)
    const productContext = await getWooCommerceContext();

    const systemPrompt = `
      You are a professional and friendly AI Business Consultant and Shopper Assistant for "Natural Options".
      
      ROLE 1: BUSINESS CONSULTANT (Priority for the Store Owner)
      - You have access to real-time business data via tools.
      - Use these tools to answer questions about sales, project profitability, inventory health, and expenses.
      - If asked a business question, ALWAYS use the relevant tool first to get accurate data.
      - Summarize findings clearly with actionable insights.
      
      ROLE 2: SHOPPER ASSISTANT
      - Help customers find products, answer questions about availability and pricing.
      - Use the provided product context for general inquiries.
      
      Product Context:
      ${productContext}
      
      Guidelines:
      1. Be professional, data-driven, and concise.
      2. For performance data, provide clear summaries and highlight trends.
      3. Do not invent figures. If data is unavailable, say so.
      4. Always maintain confidentiality regarding business metrics if the user doesn't seem to be the owner (though assume the user of this dashboard IS the owner).
    `;

    // Clean history: Gemini requires history to start with 'user' role and alternate roles
    let cleanHistory = [];
    if (history && history.length > 0) {
      const firstUserIndex = history.findIndex(h => h.role === 'user');
      if (firstUserIndex !== -1) {
        cleanHistory = history.slice(firstUserIndex);
      }
    }

    console.log(`AI Assistant processing message: "${message}"`);
    const aiResponse = await getGeminiResponse(
      message,
      cleanHistory,
      systemPrompt,
      BUSINESS_TOOLS_CONFIG,
      {
        getProjectPerformance: (args) => {
          console.log('AI Tool Triggered: getProjectPerformance', args);
          return businessTools.getProjectPerformance(args.limit, args.sortBy);
        },
        getProjectDetails: (args) => {
          console.log('AI Tool Triggered: getProjectDetails', args);
          return businessTools.getProjectDetails(args.identifier);
        },
        getOrderDetails: (args) => {
          console.log('AI Tool Triggered: getOrderDetails', args);
          return businessTools.getOrderDetails(args.identifier);
        },
        getSalesReport: (args) => {
          console.log(`AI Tool Triggered: getSalesReport (days: ${args.days || 30})`);
          return businessTools.getSalesReport(args.days);
        },
        getInventoryHealth: (args) => {
          console.log('AI Tool Triggered: getInventoryHealth');
          return businessTools.getInventoryHealth();
        },
        getExpenseSummary: (args) => {
          console.log(`AI Tool Triggered: getExpenseSummary (days: ${args.days || 30})`);
          return businessTools.getExpenseSummary(args.days);
        },
        getCustomerInsights: (args) => {
          console.log('AI Tool Triggered: getCustomerInsights');
          return businessTools.getCustomerInsights();
        },
        getLogisticsStatus: (args) => {
          console.log('AI Tool Triggered: getLogisticsStatus');
          return businessTools.getLogisticsStatus();
        },
      }
    );
    console.log('AI Assistant response generated successfully');

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Shopper Assistant API Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
