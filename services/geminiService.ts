import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ConflictEvent, AnalysisResult, ConflictType } from "../types";

// Initialize Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are a high-level geopolitical intelligence analyst engine. 
Your goal is to generate realistic, grounded conflict data and strategic analysis based on natural language queries.
Since you do not have a live connection to ACLED, you must use your internal knowledge base to generate *representative* and *realistic* data points that closely mimic real-world events for the requested time and region.
If the user asks for current events, generate data based on the most recent information you have, extrapolating reasonable ongoing conflicts.

Output strict JSON.
`;

const ANALYSIS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A concise executive summary of the conflict situation (approx 50-80 words).",
    },
    trend: {
      type: Type.STRING,
      enum: ['escalating', 'de-escalating', 'stable', 'volatile'],
      description: "The overall trend of the conflict."
    },
    keyActors: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of major groups or countries involved."
    },
    events: {
      type: Type.ARRAY,
      description: "A list of 15-30 representative conflict events related to the query.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          date: { type: Type.STRING, description: "YYYY-MM-DD format" },
          type: { 
            type: Type.STRING, 
            enum: [
              'Battle', 
              'Protest', 
              'Riot', 
              'Explosion/Remote violence', 
              'Violence against civilians', 
              'Strategic development'
            ] 
          },
          actor1: { type: Type.STRING, description: "Primary actor" },
          actor2: { type: Type.STRING, description: "Secondary actor (target or opponent)" },
          country: { type: Type.STRING },
          location: { type: Type.STRING, description: "City or specific area name" },
          latitude: { type: Type.NUMBER },
          longitude: { type: Type.NUMBER },
          fatalities: { type: Type.NUMBER, description: "Number of reported fatalities (can be 0)" },
          description: { type: Type.STRING, description: "Brief description of what happened" },
          source: { type: Type.STRING, description: "Likely source (e.g., Local Media, NGO)" }
        },
        required: ["id", "date", "type", "actor1", "country", "location", "latitude", "longitude", "fatalities", "description"]
      }
    }
  },
  required: ["summary", "trend", "keyActors", "events"]
};

export const analyzeConflicts = async (query: string): Promise<AnalysisResult> => {
  try {
    const model = "gemini-2.5-flash";
    
    const response = await ai.models.generateContent({
      model,
      contents: `Analyze and generate conflict data for the following query: "${query}". 
      If the query is vague (e.g., "global"), pick a specific active conflict zone (e.g., Sahel, Ukraine, Myanmar, Gaza) to focus on for better visualization.
      Ensure coordinates are accurate for the named locations.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
        temperature: 0.4, // Lower temperature for more consistent data
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text) as AnalysisResult;
    return data;
  } catch (error) {
    console.error("Error fetching conflict analysis:", error);
    throw error;
  }
};
