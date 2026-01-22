import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const getGeminiResponse = async (prompt, history = [], systemInstruction = '', tools = [], toolImplementations = {}) => {
  try {
    const modelParams = { 
      model: 'gemini-2.0-flash',
    };

    if (systemInstruction) {
      modelParams.systemInstruction = systemInstruction;
    }

    if (tools && tools.length > 0) {
      modelParams.tools = [{ functionDeclarations: tools }];
    }

    const model = genAI.getGenerativeModel(modelParams, { apiVersion: 'v1beta' });

    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 2000,
      },
    });

    let result = await chat.sendMessage(prompt);
    let response = await result.response;
    
    // Check if there are function calls
    let functionCalls = response.functionCalls();
    
    while (functionCalls && functionCalls.length > 0) {
      const toolResults = [];

      for (const call of functionCalls) {
        const { name, args } = call;
        console.log(`AI calling function: ${name} with args:`, args);

        if (toolImplementations[name]) {
          try {
            const resultData = await toolImplementations[name](args);
            toolResults.push({
              functionResponse: {
                name: name,
                response: { content: resultData }
              }
            });
          } catch (toolError) {
            console.error(`Error executing tool ${name}:`, toolError);
            toolResults.push({
              functionResponse: {
                name: name,
                response: { content: { error: toolError.message } }
              }
            });
          }
        } else {
          console.warn(`Tool implementation for ${name} not found.`);
          toolResults.push({
            functionResponse: {
              name: name,
              response: { content: { error: `Tool ${name} not implemented` } }
            }
          });
        }
      }

      // Send the tool results back to the model
      result = await chat.sendMessage(toolResults);
      response = await result.response;
      functionCalls = response.functionCalls();
    }

    return response.text();
  } catch (error) {
    console.error('Error getting Gemini response:', error);
    throw error;
  }
};
