
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getMathExplanation = async (expression: string, result: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Explain the mathematical concept or the calculation of: ${expression} = ${result}. Keep the tone futuristic and scientific but easy to understand. Max 100 words.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error connecting to Nova Intelligence. Check your connection.";
  }
};

export const solveComplexQuery = async (query: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Solve this mathematical query or explain this formula: ${query}. Format your response with clear sections: "Solution", "Concept", and "Formula". Use LaTeX-style symbols where appropriate.`,
      config: {
        temperature: 0.8,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to process the query. Our neural networks are experiencing interference.";
  }
};
