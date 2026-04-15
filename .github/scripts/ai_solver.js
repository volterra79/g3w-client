const ModelClient = require("@azure-rest/ai-inference").default;
const { AzureKeyCredential } = require("@azure-rest/ai-inference");
const fs = require('fs');

async function main() {
  const client = new ModelClient(
    "https://azure.com",
    new AzureKeyCredential(process.env.GH_MODELS_TOKEN)
  );

  // Reads index.js (change or extend for other files)
  const fileName = 'index.js'; 
  const code = fs.readFileSync(fileName, 'utf8');

  const systemPrompt = `You are an expert developer. Analyze the issue and correct the code.
  Respond EXCLUSIVELY with a JSON object: {"content": "corrected_code"}`;

  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Issue: ${process.env.ISSUE_TITLE}\nCodice attuale:\n${code}` }
      ],
      model: "gpt-4o",
      response_format: { type: "json_object" }
    }
  });

  const result = JSON.parse(response.body.choices.message.content);
  fs.writeFileSync(fileName, result.content);
  console.log("File updated successfully.");
}

main().catch(err => { console.error(err); process.exit(1); });
