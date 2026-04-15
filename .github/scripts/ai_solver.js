const aiInference = require("@azure-rest/ai-inference");

/**
 * Robust handling of the SDK exports.
 * Depending on the version, the classes might be under .default or exported directly.
 */
const ModelClient = aiInference.default || aiInference;
const AzureKeyCredential = (aiInference.default && aiInference.default.AzureKeyCredential) 
                           ? aiInference.default.AzureKeyCredential 
                           : aiInference.AzureKeyCredential;

async function main() {
  console.log("🚀 Starting AI solver script...");

  // Verify the existence of the GitHub Models token
  if (!process.env.GH_MODELS_TOKEN) {
    throw new Error("Error: GH_MODELS_TOKEN not found in secrets!");
  }

  // Double-check if AzureKeyCredential was found
  if (!AzureKeyCredential) {
    console.log("Available SDK exports:", Object.keys(aiInference));
    throw new Error("AzureKeyCredential is still undefined. Check SDK version.");
  }

  // Initialize the client (using it as a factory function for maximum compatibility)
  const client = ModelClient(
    "https://azure.com",
    new AzureKeyCredential(process.env.GH_MODELS_TOKEN)
  );

  const fs = require('fs');
  const fileName = 'index.js'; // Ensure this file exists in your repository
  
  if (!fs.existsSync(fileName)) {
    console.log(`⚠️ File ${fileName} not found. Creating a placeholder.`);
    fs.writeFileSync(fileName, "// Placeholder file\nfunction solve() {}");
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

  // Parse the JSON result and overwrite the file
  const result = JSON.parse(response.body.choices[0].message.content);
  fs.writeFileSync(fileName, result.content);
  
  console.log(`✅ ${fileName} successfully updated by AI.`);
}

main().catch(err => {
  console.error("❌ Critical error:");
  console.error(err);
  process.exit(1);
});
