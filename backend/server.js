const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.post('/api/insights', async (req, res) => {
  const { inventory } = req.body;

  if (!inventory) {
    return res.status(400).json({ error: "Inventory data is required." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key') {
    // Fallback if the user hasn't set up the API key in the backend yet
    return res.json([
      { type: 'warning', message: '[Mock] ORS Packets likely to stock out in 3 days due to rising heatwave in district.' },
      { type: 'redistribution', message: '[Mock] Surplus of Amoxicillin at CHC Balipatna. Recommend transferring 200 units to PHC Kantabada.' }
    ]);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `You are an AI assistant for the National Health Mission (MeraAsptal). 
    Analyze the following inventory for PHC Kantabada: ${JSON.stringify(inventory)}. 
    Generate 2 critical insights: one 'warning' (e.g., predicting stockout based on low threshold) and one 'redistribution' (recommending transferring items from another hypothetical nearby clinic).
    Return ONLY a JSON array of objects with 'type' ('warning' or 'redistribution') and 'message' (string). No markdown or backticks.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '');
    
    res.json(JSON.parse(cleanedText));
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Failed to fetch AI insights from Gemini." });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
