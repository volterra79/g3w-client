const aiInference = require("@azure-rest/ai-inference");

// The debug output showed that everything is inside .default
const sdk = aiInference.default;
const ModelClient = sdk.default || sdk; // Standard pattern for this SDK
const AzureKeyCredential = sdk.AzureKeyCredential;

async function main() {
  console.log("🚀 Starting AI solver script...");

  if (!process.env.GH_MODELS_TOKEN) {
    throw new Error("Error: GH_MODELS_TOKEN not found in secrets!");
  }

  // Double check if we finally have the class
  if (!AzureKeyCredential) {
    throw new Error("AzureKeyCredential is still undefined. SDK structure is unexpected.");
  }

  const client = ModelClient(
    "https://azure.com",
    new AzureKeyCredential(process.env.GH_MODELS_TOKEN)
  );

  const fs = require('fs');
  const fileName = 'index.js'; 
  
  if (!fs.existsSync(fileName)) {
    console.log(`⚠️ File ${fileName} not found. Creating placeholder.`);
    fs.writeFileSync(fileName, "// Placeholder\nfunction solve() {}");
  }

  const code = fs.readFileSync(fileName, 'utf8');

  console.log("🧠 Requesting fix from GPT-4o...");
  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        { 
          role: "system", 
          content: "You are an expert developer. Respond ONLY with a valid JSON: {\"content\": \"fixed_code\"}" 
        },
        { 
          role: "user", 
          content: `Analyze this issue: ${process.env.ISSUE_TITLE}\nCurrent code:\n${code}` 
        }
      ],
      model: "gpt-4o",
      response_format: { type: "json_object" }
    }
  });

  if (response.status !== "200") {
    console.error("❌ API Error:", response.body.error);
    process.exit(1);
  }

  const result = JSON.parse(response.body.choices[0].message.content);
  fs.writeFileSync(fileName, result.content);
  
  console.log(`✅ ${fileName} successfully updated.`);
}

main().catch(err => {
  console.error("❌ Critical error:");
  console.error(err);
  process.exit(1);
});
