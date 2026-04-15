const { GoogleGenerativeAI } = require("@google/generative-ai");
const api = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(api);

const generateRecommendations = async (data) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-flash-latest", //   Updated to available model
  });

  const prompt = `
You are an ESG sustainability advisor.

Based on the following company ESG performance:

Overall Score: ${data.overall}
Environmental: ${data.environmental}
Social: ${data.social}
Governance: ${data.governance}

Carbon Emissions: ${data.carbon}
Energy Consumption: ${data.energy}
Water Usage: ${data.water}
Waste Generated: ${data.waste}

Generate exactly 3 structured sustainability recommendations.

Return ONLY valid JSON array like:

[
  {
    "title": "...",
    "description": "...",
    "impact": "High | Medium | Low",
    "effort": "High | Medium | Low"
  }
]
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log(text);

  // Clean markdown if Gemini adds ```json
  const cleaned = text.replace(/```json|```/g, "").trim();

  return JSON.parse(cleaned);
};

module.exports = { generateRecommendations };