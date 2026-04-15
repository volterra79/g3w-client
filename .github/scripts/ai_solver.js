const fs = require('fs');

async function main() {
  console.log("🚀 Starting AI solver script (Fetch Mode)...");

  const token = process.env.GH_MODELS_TOKEN;
  const issueTitle = process.env.ISSUE_TITLE;
  const fileName = 'index.js';

  if (!token) throw new Error("GH_MODELS_TOKEN is missing!");

  // Ensure the file exists
  if (!fs.existsSync(fileName)) {
    console.log(`⚠️ Creating ${fileName}...`);
    fs.writeFileSync(fileName, "// Placeholder code\nfunction fixMe() {}");
  }
  const code = fs.readFileSync(fileName, 'utf8');

  console.log("🧠 Sending request to GitHub Models...");

  const response = await fetch("https://azure.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: "You are an expert developer. Respond ONLY with a valid JSON object: {\"content\": \"fixed_code\"}" },
        { role: "user", content: `Issue: ${issueTitle}\nCurrent code:\n${code}` }
      ],
      model: "gpt-4o",
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ API Error:", data);
    process.exit(1);
  }

  // Extract the content from the standard OpenAI-like response structure
  const result = JSON.parse(data.choices[0].message.content);
  fs.writeFileSync(fileName, result.content);
  
  console.log(`✅ ${fileName} updated successfully!`);
}

main().catch(err => {
  console.error("❌ Critical error:", err.message);
  process.exit(1);
});
