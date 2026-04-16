import * as core from '@actions/core';
import * as github from '@actions/github';
import createClient from '@azure-rest/ai-inference';
import { isUnexpected } from '@azure-rest/ai-inference';

async function run() {
  try {
    const token = process.env.GITHUB_TOKEN;
    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;

    const issueNumber = process.env.ISSUE_NUMBER;
    const issueTitle = process.env.ISSUE_TITLE;
    const issueBody = process.env.ISSUE_BODY;

    // 1. Configurazione Client (usiamo la factory function createClient)
    const client = createClient(
      "https://azure.com",
      { key: token }
    );

    core.info("Interrogazione modello AI...");

    // 2. Chiamata al modello
    const response = await client.path("/chat/completions").post({
      body: {
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Sei un programmatore esperto. Rispondi solo con il codice richiesto senza spiegazioni." },
          { role: "user", content: `Fix per issue #${issueNumber}: ${issueTitle}\n${issueBody}` }
        ],
        temperature: 0.1
      }
    });

    if (isUnexpected(response)) {
      throw new Error(`AI Error: ${response.body.error.message}`);
    }

    const suggestedCode = response.body.choices[0].message.content;

    // 3. Logica Git
    const branchName = `ai-fix-${issueNumber}`;
    const fileName = 'AI_FIX_SUGGESTION.md';

    // Ottieni lo SHA del branch principale
    const { data: mainRef } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/main` // o 'master' se il tuo branch principale si chiama così
    });

    // Crea Branch
    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: mainRef.object.sha
    });

    // Crea File
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: fileName,
      message: `AI fix for issue #${issueNumber}`,
      content: Buffer.from(suggestedCode).toString('base64'),
      branch: branchName
    });

    // 4. Crea PR in Draft
    const pr = await octokit.rest.pulls.create({
      owner,
      repo,
      title: `[AI] Fix for #${issueNumber}`,
      head: branchName,
      base: 'main',
      body: `Questa è una PR automatica generata dai GitHub Models.\n\n### Suggerimento:\n${suggestedCode}`,
      draft: true
    });

    core.info(`PR creata con successo: ${pr.data.html_url}`);

  } catch (error) {
    core.setFailed(`Errore durante l'esecuzione: ${error.message}`);
  }
}

run();
