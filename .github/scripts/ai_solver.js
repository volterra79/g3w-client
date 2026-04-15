const ModelClient = require("@azure-rest/ai-inference").default;
const aiInference = require("@azure-rest/ai-inference");

// Robust handling of the Credential class import to avoid "not a constructor" error
const AzureKeyCredential = aiInference.AzureKeyCredential;

async function main() {
  console.log("🚀 Starting AI solver script...");

  // Check if the GitHub Models token is available in environment variables
  if (!process.env.GH_MODELS_TOKEN) {
    throw new Error("Error: GH_MODELS_TOKEN not found in secrets!");
  }

  // Initialize the AI client using the GitHub Models endpoint
  const client = new ModelClient(
    "https://azure.com",
    new AzureKeyCredential(process.env.GH_MODELS_TOKEN)
  );

  const fs = require('fs');
  // Specify the file to be analyzed (change this to your main entry point)
  const fileName = 'index.js'; 
  
  // Basic check to ensure the file exists before reading it
  if (!fs.existsSync(fileName)) {
    console.log(`⚠️ File ${fileName} not found. Creating a placeholder file.`);
    fs.writeFileSync(fileName, "// Auto-generated file\nfunction main() {}");
  }

  const code = fs.readFileSync(fileName, 'utf8');

  console.log("🧠 Sending request to GPT-4o model...");
  
  // Requesting a fix from the AI model based on the Issue title
  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        { 
          role: "system", 
          content: "You are an expert developer. Respond ONLY with a valid JSON object: {\"content\": \"the_fixed_code\"}" 
        },
        { 
          role: "user", 
          content: `Analyze this issue: ${process.env.ISSUE_TITLE}\nCurrent code:\n${code}` 
        }
      ],
      model: "gpt-4o",
      response_format: { type: "json_object" } // Enforce JSON response format
    }
  });

  // Handle potential API errors (e.g., rate limits or invalid tokens)
  if (response.status !== "200") {
    console.error("❌ API Error:", response.body.error);
    process.exit(1);
  }

  // Parse the AI response and overwrite the file with the new code
  const result = JSON.parse(response.body.choices[0].message.content);
  fs.writeFileSync(fileName, result.content);
  
  console.log(`✅ ${fileName} has been updated with the AI solution.`);
}

// Global error handling for the async execution
main().catch(err => {
  console.error("❌ Critical error during execution:");
  console.error(err);
  process.exit(1);
});
