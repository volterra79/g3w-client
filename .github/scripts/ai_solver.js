const fs = require('fs');

async function main() {
  console.log("🚀 Starting AI solver script (GitHub Native Endpoint)...");

  const token = process.env.GH_MODELS_TOKEN;
  const issueTitle = process.env.ISSUE_TITLE;
  const fileName = 'index.js';

  if (!token) throw new Error("GH_MODELS_TOKEN is missing!");

  if (!fs.existsSync(fileName)) {
    fs.writeFileSync(fileName, "// Placeholder code\nfunction fixMe() {}");
  }
  const code = fs.readFileSync(fileName, 'utf8');

  // URL NATIVO DI GITHUB MODELS (Standard OpenAI compatibile)
  const url = "https://github.com"; 
  // Se il sopra fallisce, l'alternativa corretta per GitHub Models è:
  const altUrl = "https://azure.com";

  console.log("🧠 Requesting GPT-4o via GitHub...");

  const response = await fetch(altUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "User-Agent": "GitHub-Action"
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: "You are an expert developer. Respond ONLY with a valid JSON: {\"content\": \"fixed_code\"}" },
        { role: "user", content: `Issue: ${issueTitle}\nCurrent code:\n${code}` }
      ],
      model: "gpt-4o",
      response_format: { type: "json_object" }
    })
  });

  const text = await response.text();
  
  try {
    const data = JSON.parse(text);
    if (!response.ok) {
      console.error("❌ API Error Detail:", JSON.stringify(data, null, 2));
      process.exit(1);
    }
    const result = JSON.parse(data.choices[0].message.content);
    fs.writeFileSync(fileName, result.content);
    console.log(`✅ ${fileName} updated successfully!`);
  } catch (e) {
    console.error("❌ Parsing Error. Raw response was:");
    console.log(text.substring(0, 500)); // Mostra solo l'inizio per debug
    process.exit(1);
  }
}

main().catch(err => {
  console.error("❌ Fetch failed:", err.message);
  process.exit(1);
});
