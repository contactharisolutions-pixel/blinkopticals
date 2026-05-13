const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.development' });

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // The SDK doesn't have a direct listModels but we can try to fetch a known one or use the REST API
        console.log("Testing with gemini-2.5-pro...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
        const result = await model.generateContent("Hello");
        console.log("Success:", (await result.response).text());
    } catch (err) {
        console.error("Error Detail:", err);
    }
}

listModels();
