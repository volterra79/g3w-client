const fs = require('fs');

async function main() {
  console.log("🚀 Starting AI solver script (Direct Fetch)...");

  const token = process.env.GH_MODELS_TOKEN;
  const issueTitle = process.env.ISSUE_TITLE;
  const fileName = 'index.js';

  if (!token) throw new Error("GH_MODELS_TOKEN is missing!");

  if (!fs.existsSync(fileName)) {
    fs.writeFileSync(fileName, "// Placeholder code\nfunction fixMe() {}");
  }
  const code = fs.readFileSync(fileName, 'utf8');

  // URL CORRETTO PER GITHUB MODELS API
  const url = "https://github.ai";

  console.log("🧠 Requesting GPT-4o...");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "User-Agent": "GitHub-Action-AI-Fixer" // Alcuni server lo richiedono
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

  // Leggiamo il testo prima per capire se è HTML o JSON
  const text = await response.text();
  
  try {
    const data = JSON.parse(text);
    if (!response.ok) {
      console.error("❌ API Error:", data);
      process.exit(1);
    }
    const result = JSON.parse(data.choices[0].message.content); // Nota lo [0] aggiunto
    fs.writeFileSync(fileName, result.content);
    console.log(`✅ ${fileName} updated!`);
  } catch (e) {
    console.error("❌ Failed to parse response. Raw response was:");
    console.log(text);
    process.exit(1);
  }
}

main().catch(err => {
  console.error("❌ Critical error:", err.message);
  process.exit(1);
});
