// Google Apps Script source the auto-import settings page hands out. It runs inside the
// owner's own Google account (script.google.com), checks for new bank alert emails every
// 5 minutes and forwards them to POST /ingest. Only advances its cursor on a 200, so failed
// sends are retried on the next run.

export const DEFAULT_BANK_SENDERS = ["no-reply@meezanbank.com", "myABL@abl.com", "service@nayapay.com"];

export function buildGmailAppsScript(endpoint: string, token: string | null): string {
  return `// Nexa — forwards bank alert emails for automatic expense tracking.
// 1. Paste this whole file into a new project at https://script.google.com
// 2. Run "setup" once and allow access to Gmail. That's it — it checks every 5 minutes.

const NEXA_URL = ${JSON.stringify(endpoint)};
const NEXA_TOKEN = ${JSON.stringify(token ?? "PASTE_YOUR_NEXA_IMPORT_TOKEN_HERE")};
// Add more bank / wallet alert addresses here if you use them.
const SENDERS = ${JSON.stringify(DEFAULT_BANK_SENDERS)};

function setup() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("forwardBankEmails").timeBased().everyMinutes(5).create();
  // Start from now — older emails are not imported.
  PropertiesService.getScriptProperties().setProperty("LAST_SENT", String(Date.now()));
}

function forwardBankEmails() {
  const props = PropertiesService.getScriptProperties();
  const since = Number(props.getProperty("LAST_SENT") || Date.now());
  const query = "(" + SENDERS.map(function (s) { return "from:" + s; }).join(" OR ") + ") newer_than:2d";

  const messages = [];
  GmailApp.search(query, 0, 50).forEach(function (thread) {
    thread.getMessages().forEach(function (m) {
      if (m.getDate().getTime() > since) messages.push(m);
    });
  });
  messages.sort(function (a, b) { return a.getDate().getTime() - b.getDate().getTime(); });

  let newest = since;
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const res = UrlFetchApp.fetch(NEXA_URL, {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: "Bearer " + NEXA_TOKEN },
      payload: JSON.stringify({ source: "email", text: m.getSubject() + "\\n" + m.getPlainBody() }),
      muteHttpExceptions: true,
    });
    if (res.getResponseCode() !== 200) break; // retry from here next run
    newest = m.getDate().getTime();
  }
  props.setProperty("LAST_SENT", String(newest));
}
`;
}
