import core from '@actions/core';
import github from '@actions/github';
import ModelClient from '@azure-rest/ai-inference';
import { isUnexpected } from '@azure-rest/ai-inference';

async function run() {
  try {
    const token = process.env.GITHUB_TOKEN;
    const octokit = github.getOctokit(token);
    const context = github.context;

    const issueTitle = process.env.ISSUE_TITLE;
    const issueBody = process.env.ISSUE_BODY;

    // 1. Configurazione Client GitHub Models
    const client = new ModelClient(
      "https://azure.com",
      { key: token }
    );

    // 2. Chiamata all'IA per generare il codice
    const response = await client.path("/chat/completions").post({
      body: {
        model: "gpt-4o", // Puoi cambiare in "Llama-3-70b" o altri
        messages: [
          { role: "system", content: "Sei un assistente programmatore. Rispondi SOLO con il codice richiesto, senza spiegazioni o blocchi markdown." },
          { role: "user", content: `Crea un fix per questa issue:\nTitolo: ${issueTitle}\nDescrizione: ${issueBody}` }
        ],
        temperature: 0.2
      }
    });

    if (isUnexpected(response)) throw response.body.error;
    const suggestedCode = response.body.choices[0].message.content;

    // 3. Logica Git: Creazione Branch e PR
    const branchName = `ai-fix-issue-${process.env.ISSUE_NUMBER}`;
    const fileName = 'fix_from_ai.md'; // Esempio: puoi renderlo dinamico

    // Prende il riferimento al commit principale
    const { data: ref } = await octokit.rest.git.getRef({
      ...context.repo,
      ref: `heads/${context.payload.repository.default_branch}`
    });

    // Crea il nuovo branch
    await octokit.rest.git.createRef({
      ...context.repo,
      ref: `refs/heads/${branchName}`,
      sha: ref.object.sha
    });

    // Crea o aggiorna il file con il codice dell'IA
    await octokit.rest.repos.createOrUpdateFileContents({
      ...context.repo,
      path: fileName,
      message: `AI fix for issue #${process.env.ISSUE_NUMBER}`,
      content: Buffer.from(suggestedCode).toString('base64'),
      branch: branchName
    });

    // 4. Creazione della Pull Request in DRAFT
    await octokit.rest.pulls.create({
      ...context.repo,
      title: `[AI FIX] ${issueTitle}`,
      head: branchName,
      base: context.payload.repository.default_branch,
      body: `Questa PR è stata generata automaticamente per risolvere la issue #${process.env.ISSUE_NUMBER}.\n\nAI Suggestion:\n${suggestedCode}`,
      draft: true
    });

    console.log("Draft PR creata con successo!");

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
