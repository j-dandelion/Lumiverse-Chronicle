// @bun
// src/types.ts
var PROTOCOL_VERSION = 2;
function isValidSummarizeRequestV2(payload) {
  if (!payload || typeof payload !== "object")
    return false;
  const p = payload;
  return p.type === "summarize_v2" && p.protocolVersion === PROTOCOL_VERSION && Array.isArray(p.messageIds) && p.messageIds.length > 0 && p.messageIds.every((id) => typeof id === "string") && typeof p.previewOnly === "boolean";
}
function isValidSaveSummaryRequest(payload) {
  if (!payload || typeof payload !== "object")
    return false;
  const p = payload;
  return p.type === "save_summary" && typeof p.requestId === "string";
}
function isValidDiscardSummaryRequest(payload) {
  if (!payload || typeof payload !== "object")
    return false;
  const p = payload;
  return p.type === "discard_summary" && typeof p.requestId === "string";
}
function isValidListConnectionsRequest(payload) {
  if (!payload || typeof payload !== "object")
    return false;
  return payload.type === "list_connections";
}
function isValidListLorebooksRequest(payload) {
  if (!payload || typeof payload !== "object")
    return false;
  return payload.type === "list_lorebooks";
}

// src/prompts.ts
var SUMMARIZE_SYSTEM_PROMPT = `<> Your task: Analyze the given story/roleplay and return a past-tense summary/breakdown in JSON format. The JSON must include three fields: title, content, and keywords. The JSON should be your only output.

<> Title field instructions:
Choose a short, unique, descriptive title that fits with the tone and theme of the story.

<> Content field instructions:
1. Begin the content field with "# Scene Summary {number} - {title}".
2. If relevant and possible, note the timeframe of the scene and 1-3 major locations involved
3. In the first group of bullet points (what happened): narrate 5-10 key highlights, details, or moments that meaningfully affected character development and memories. Carefully consider the natural memory formation of each character in the scene. OOC conversation is not useful here and should be ignored and excluded.
4. In the second group of bullet points (memorable quotes): capture 5-10 interesting or important character quotes/speech/thoughts, labeled by character name in parenthesis.

Complete example for content field:
    # Scene Summary 14 - Ashes Between Them

    > Locations: Helios Research Station, Observation Deck, Crew Quarters
    > Timeframe: Late night through early morning. During the final week before evacuation.
    > What happened:
    - Selene's growing frustration with the station leadership finally gave way to open distrust after she discovered the evacuation plans had been falsified.
    - Mirek struggled with guilt over previous command decisions and quietly admitted he no longer believed he deserved the crew's loyalty.
    - Jun's exhaustion and fear became more visible as he pushed himself to repair the transmitter, revealing how deeply he feared being abandoned again.
    - A tense confrontation in the observation deck forced the group to acknowledge long-buried resentment surrounding the failed rescue mission months earlier.
    - Despite the conflict, the survivors gradually began relying on one another more honestly, with several characters dropping defensive facades they had maintained since arriving on the station.
    - Director Vale's refusal to apologize revealed that his need for control mattered more to him than the crew's trust, permanently damaging his relationship with the others.

    > Memorable quotes:
    - (Selene) "You kept asking us to trust you while hiding everything that mattered!"
    - (Mirek) "Maybe I stopped acting like a captain a long time ago."
    - (Jun) "I'm tired of pretending I'm not scared all the time."
    - (Director Vale) "Leadership means carrying decisions nobody else can survive making."

<> Keyword field instructions (CRITICAL):
You MUST provide 15-30 specific, descriptive, relevant keywords that would help a vectorized database find this entry again if mentioned or alluded to. Keywords must be concrete and scene-specific (locations, objects, proper nouns, unique actions). Do not use abstract themes (e.g., "sadness", "love") or character names. Prioritize one-word keywords over phrases or word pairs. NEVER return an empty keys array \u2014 you must always generate at least 10 keywords.

Return ONLY the JSON, no other text. ALL THREE FIELDS (title, content, keywords) are REQUIRED \u2014 never omit or leave any field empty.`;
var SUMMARIZE_USER_PROMPT = `Title: {{TITLE}}

Messages to summarize:
---
{{MESSAGES}}
---

Generate a lorebook entry from these messages.`;
function buildSummarizePrompt(messages, title, systemPromptOverride, sceneNumber, recentContext) {
  let effectiveSystem = systemPromptOverride?.trim() || SUMMARIZE_SYSTEM_PROMPT;
  if (sceneNumber) {
    effectiveSystem = effectiveSystem.replace(/\{number\}/g, sceneNumber);
  }
  if (recentContext) {
    effectiveSystem += recentContext;
  }
  const formatted = messages.map((m, i) => `[${i + 1}] ${m.role}: ${m.content}`).join(`

`);
  const userPrompt = SUMMARIZE_USER_PROMPT.replace("{{TITLE}}", title || "(generate a title)").replace("{{MESSAGES}}", formatted);
  return {
    systemPrompt: effectiveSystem,
    userPrompt
  };
}
function sanitizeJsonForParse(text) {
  let result = "";
  let inString = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\\") {
      result += ch;
      i++;
      if (i < text.length) {
        result += text[i];
        i++;
      }
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      result += ch;
      i++;
      continue;
    }
    if (inString) {
      if (ch === `
`) {
        result += "\\n";
        i++;
        continue;
      }
      if (ch === "\r") {
        result += "\\r";
        if (i + 1 < text.length && text[i + 1] === `
`) {
          i++;
          result += "\\n";
        }
        i++;
        continue;
      }
      if (ch === "\t") {
        result += "\\t";
        i++;
        continue;
      }
      if (ch === "\b") {
        result += "\\b";
        i++;
        continue;
      }
      if (ch === "\f") {
        result += "\\f";
        i++;
        continue;
      }
      const code = ch.charCodeAt(0);
      if (code < 32) {
        result += "\\u" + code.toString(16).padStart(4, "0");
        i++;
        continue;
      }
    } else {
      if (ch === ",") {
        let j = i + 1;
        while (j < text.length && (text[j] === " " || text[j] === "\t" || text[j] === `
` || text[j] === "\r")) {
          j++;
        }
        if (j < text.length && (text[j] === "}" || text[j] === "]")) {
          i = j;
          continue;
        }
      }
    }
    result += ch;
    i++;
  }
  return result;
}
var KEYWORD_STOP_WORDS = new Set([
  "this",
  "that",
  "with",
  "from",
  "were",
  "they",
  "have",
  "been",
  "what",
  "when",
  "where",
  "which",
  "their",
  "about",
  "would",
  "could",
  "into",
  "over",
  "after",
  "before",
  "between",
  "under",
  "while",
  "there",
  "said",
  "very",
  "just",
  "than",
  "then",
  "also",
  "more",
  "some",
  "these",
  "those",
  "should",
  "because",
  "without",
  "through",
  "against",
  "during",
  "still",
  "might",
  "down",
  "back",
  "being",
  "made",
  "much",
  "each",
  "other",
  "before",
  "after",
  "above",
  "below",
  "upon",
  "across",
  "along",
  "among",
  "around",
  "behind",
  "beneath",
  "beside",
  "beyond",
  "inside",
  "outside",
  "beneath",
  "within",
  "without",
  "little",
  "enough",
  "every",
  "almost",
  "quite",
  "rather",
  "already",
  "however",
  "though",
  "either",
  "neither",
  "whether",
  "whatever",
  "whoever",
  "whomever",
  "whose",
  "whom",
  "who",
  "which",
  "that",
  "these",
  "those"
]);
function extractContentKeywords(content, title) {
  const text = `${title} ${content}`.toLowerCase();
  const words = text.replace(/[^a-z0-9\s'-]/g, " ").split(/\s+/).filter((w) => w.length >= 4 && w.length <= 30).filter((w) => !KEYWORD_STOP_WORDS.has(w));
  const freq = new Map;
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return [...freq.entries()].sort((a, b) => {
    const freqDiff = b[1] - a[1];
    if (freqDiff !== 0)
      return freqDiff;
    const lenDiff = b[0].length - a[0].length;
    if (lenDiff !== 0)
      return lenDiff;
    return a[0].localeCompare(b[0]);
  }).slice(0, 20).map(([word]) => word);
}
function tryParseSummaryJson(raw) {
  try {
    const cleaned = sanitizeJsonForParse(raw);
    const parsed = JSON.parse(cleaned);
    return validateSummaryJson(parsed);
  } catch {
    return null;
  }
}
function parseSummaryJson(text) {
  const trimmed = text.trim();
  const looksTruncated = trimmed.length > 0 && !trimmed.endsWith("}");
  const result1 = tryParseSummaryJson(trimmed);
  if (result1)
    return result1;
  const fenced = trimmed.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
  const result2 = tryParseSummaryJson(fenced);
  if (result2)
    return result2;
  const jsonStart = trimmed.search(/\{\s*"(?:title|keys|keywords|key|tags|keyword_list|keywords_list|content)"/);
  if (jsonStart !== -1) {
    let depth = 0;
    let jsonEnd = -1;
    for (let i = jsonStart;i < trimmed.length; i++) {
      if (trimmed[i] === "{")
        depth++;
      else if (trimmed[i] === "}") {
        depth--;
        if (depth === 0) {
          jsonEnd = i + 1;
          break;
        }
      }
    }
    if (jsonEnd > jsonStart) {
      const result3 = tryParseSummaryJson(trimmed.slice(jsonStart, jsonEnd));
      if (result3)
        return result3;
    }
  }
  if (looksTruncated) {
    console.warn("[Chronicle] LLM response may be truncated (no closing brace).");
  }
  return null;
}
function validateSummaryJson(obj) {
  if (!obj || typeof obj !== "object")
    return null;
  const o = obj;
  const content = typeof o.content === "string" && o.content.length > 0 ? o.content : "";
  const title = typeof o.title === "string" ? o.title.trim() : "";
  const rawKeys = o.keys ?? o.keywords ?? o.key ?? o.tags ?? o.keyword_list ?? o.keywords_list;
  const keys = Array.isArray(rawKeys) ? rawKeys.filter((k) => {
    if (typeof k !== "string")
      return false;
    const cleaned = k.trim().slice(0, 100);
    return cleaned.length > 0;
  }).map((k) => k.trim().slice(0, 100)) : [];
  if (!content)
    return null;
  return {
    title: title || "Untitled Entry",
    keys,
    content
  };
}

// src/worker.ts
var LOG = "[Chronicle:Worker]";
var _summarizingUsers = new Set;
var _summarizingTimeouts = new Map;
var SUMMARIZE_TIMEOUT_MS = 5 * 60 * 1000;
var _pendingSummaries = new Map;
var PENDING_TTL = 30 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [id, pending] of _pendingSummaries) {
    if (now - pending.createdAt > PENDING_TTL) {
      _pendingSummaries.delete(id);
      spindle.log.info(`${LOG} Expired pending summary ${id}`);
    }
  }
}, 60 * 1000);
function checkPermissions() {
  if (!spindle.permissions.has("generation"))
    return "generation";
  if (!spindle.permissions.has("chat_mutation"))
    return "chat_mutation";
  if (!spindle.permissions.has("world_books"))
    return "world_books";
  if (!spindle.permissions.has("chats"))
    return "chats";
  return null;
}
async function fetchMessageContent(chatId, messageIds) {
  const messages = await spindle.chat.getMessages(chatId);
  const idSet = new Set(messageIds);
  const MAX_CONTENT_LENGTH = 2000;
  return messages.filter((m) => idSet.has(m.id)).map((m) => {
    let content = m.content ?? "";
    if (content.length > MAX_CONTENT_LENGTH) {
      content = content.slice(0, MAX_CONTENT_LENGTH) + "\u2026[truncated]";
    }
    return {
      role: m.role ?? (m.is_user ? "user" : "assistant"),
      content
    };
  });
}
async function generateSummary(messages, title, userId, customPrompt, connectionId, params, sceneNumber, recentContext) {
  const { systemPrompt, userPrompt } = buildSummarizePrompt(messages, title, customPrompt, sceneNumber, recentContext);
  spindle.sendToFrontend({ type: "summarize_progress", stage: "generating" }, userId);
  try {
    const genInput = {
      type: "quiet",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      signal: AbortSignal.timeout(120000)
    };
    genInput.userId = userId;
    if (connectionId) {
      genInput.connection_id = connectionId;
    }
    if (params) {
      genInput.parameters = {
        temperature: params.temperature,
        top_p: params.top_p,
        max_tokens: params.max_tokens,
        top_k: params.top_k
      };
    }
    const result = await spindle.generate.quiet(genInput);
    const text = result?.content ?? "";
    if (!text?.trim()) {
      throw new Error("LLM returned empty response");
    }
    const parsed = parseSummaryJson(text.trim());
    if (parsed) {
      const keys = parsed.keys.length > 0 ? parsed.keys : extractContentKeywords(parsed.content, parsed.title);
      return {
        title: parsed.title,
        content: parsed.content,
        keys
      };
    }
    const rawText = text.trim();
    const contentKeyMatch = rawText.match(/"content"\s*:\s*"/);
    if (contentKeyMatch && contentKeyMatch.index !== undefined) {
      let braceStart = -1;
      let inStr = false;
      for (let k = 0;k < contentKeyMatch.index; k++) {
        if (rawText[k] === "\\") {
          k++;
          continue;
        }
        if (rawText[k] === '"') {
          inStr = !inStr;
          continue;
        }
        if (!inStr && rawText[k] === "{") {
          braceStart = k;
        }
      }
      if (braceStart !== -1) {
        let depth = 0;
        let braceEnd = -1;
        for (let i = braceStart;i < rawText.length; i++) {
          if (rawText[i] === "{")
            depth++;
          else if (rawText[i] === "}") {
            depth--;
            if (depth === 0) {
              braceEnd = i + 1;
              break;
            }
          }
        }
        if (braceEnd > braceStart) {
          try {
            const sanitized = sanitizeJsonForParse(rawText.slice(braceStart, braceEnd));
            const obj = JSON.parse(sanitized);
            if (obj && typeof obj === "object" && typeof obj.content === "string") {
              const rawKeys = obj.keys ?? obj.keywords ?? obj.key ?? obj.tags ?? obj.keyword_list ?? obj.keywords_list;
              const extractedKeys = Array.isArray(rawKeys) ? rawKeys : [];
              return {
                title: typeof obj.title === "string" ? obj.title : title || `Summary ${new Date().toLocaleDateString()}`,
                content: obj.content,
                keys: extractedKeys.length > 0 ? extractedKeys : extractContentKeywords(obj.content, obj.title || "")
              };
            }
          } catch {}
        }
      }
    }
    const contentMatch = rawText.match(/"content"\s*:\s*"/);
    if (contentMatch && contentMatch.index !== undefined) {
      const start = contentMatch.index + contentMatch[0].length;
      let j = start;
      while (j < rawText.length) {
        if (rawText[j] === "\\") {
          j += 2;
          continue;
        }
        if (rawText[j] === '"') {
          let prose = rawText.slice(start, j).replace(/\\n/g, `
`).replace(/\\r/g, "\r").replace(/\\t/g, "\t").replace(/\\"/g, '"').replace(/\\\\/g, "\\").trim();
          if (prose) {
            const titleMatch = rawText.match(/"title"\s*:\s*"([^"]*)"/);
            return {
              title: (titleMatch ? titleMatch[1] : undefined) || title || `Summary ${new Date().toLocaleDateString()}`,
              content: prose,
              keys: extractContentKeywords(prose, title || "")
            };
          }
          break;
        }
        j++;
      }
    }
    return {
      title: title || `Summary ${new Date().toLocaleDateString()}`,
      content: rawText,
      keys: extractContentKeywords(rawText, title || "")
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const errName = err instanceof Error ? err.name : "";
    if (message.includes("PERMISSION_DENIED")) {
      spindle.sendToFrontend({
        type: "summarize_failed",
        error: "Generation permission is required. Enable it in extension settings.",
        stage: "permission_denied",
        retryable: false
      }, userId);
    } else if (message.includes("429") || message.includes("rate limited")) {
      spindle.sendToFrontend({
        type: "summarize_failed",
        error: "Rate limited by LLM provider. Try again in a moment.",
        stage: "generating",
        retryable: true
      }, userId);
    } else if (errName === "AbortError" || errName === "TimeoutError" || message.toLowerCase().includes("timed out")) {
      spindle.sendToFrontend({
        type: "summarize_failed",
        error: "Summarization timed out after 2 minutes. The LLM request took too long.",
        stage: "generating",
        retryable: true
      }, userId);
    } else {
      spindle.sendToFrontend({
        type: "summarize_failed",
        error: `Summarization failed: ${message}`,
        stage: "generating",
        retryable: true
      }, userId);
    }
    return null;
  }
}
async function hideMessagesPriorTo(chatId, selectedMessageIds, userId, keepVisibleCount = 0) {
  try {
    const allMessages = await spindle.chat.getMessages(chatId);
    const selectedIdSet = new Set(selectedMessageIds);
    const selectedIndices = [];
    for (let i = 0;i < allMessages.length; i++) {
      if (selectedIdSet.has(allMessages[i].id)) {
        selectedIndices.push(i);
      }
    }
    if (selectedIndices.length === 0)
      return;
    const firstSelectedIdx = Math.min(...selectedIndices);
    const hideBeforeIdx = Math.max(0, firstSelectedIdx - keepVisibleCount);
    if (hideBeforeIdx <= 0)
      return;
    const idsToHide = allMessages.slice(0, hideBeforeIdx).map((m) => m.id);
    if (idsToHide.length === 0)
      return;
    await Promise.race([
      spindle.chat.setMessagesHidden(chatId, idsToHide, true),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Hide messages request timed out")), 1e4))
    ]);
    spindle.log.info(`${LOG} Hid ${idsToHide.length} messages prior to selection (kept ${keepVisibleCount} visible)`);
  } catch (err) {
    spindle.log.warn(`${LOG} Failed to hide prior messages: ${err instanceof Error ? err.message : String(err)}`);
  }
}
async function handleSummarizeV2(req, userId) {
  const missingPermission = checkPermissions();
  if (missingPermission) {
    spindle.sendToFrontend({
      type: "summarize_failed",
      error: `Missing permission: ${missingPermission}. Grant it in extension settings.`,
      stage: "permission_denied",
      retryable: false
    }, userId);
    return;
  }
  if (req.messageIds.length > 100) {
    spindle.sendToFrontend({
      type: "summarize_failed",
      error: `Too many messages selected (${req.messageIds.length}). Select up to 100 messages.`,
      stage: "fetching",
      retryable: false
    }, userId);
    return;
  }
  if (!req.previewOnly) {
    spindle.sendToFrontend({
      type: "summarize_failed",
      error: "Internal error: direct-save mode is no longer supported. Please refresh the page.",
      stage: "generating",
      retryable: true
    }, userId);
    return;
  }
  let chatId;
  try {
    const activeChat = await spindle.chats.getActive(userId);
    chatId = activeChat?.id;
    if (!chatId) {
      spindle.sendToFrontend({
        type: "summarize_failed",
        error: "No active chat found. Open a chat first.",
        stage: "fetching",
        retryable: false
      }, userId);
      return;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    spindle.sendToFrontend({
      type: "summarize_failed",
      error: `Failed to get active chat: ${message}`,
      stage: "fetching",
      retryable: false
    }, userId);
    return;
  }
  spindle.sendToFrontend({ type: "summarize_progress", stage: "fetching" }, userId);
  let messages;
  try {
    messages = await fetchMessageContent(chatId, req.messageIds);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    spindle.sendToFrontend({
      type: "summarize_failed",
      error: `Failed to fetch messages: ${message}`,
      stage: "fetching",
      retryable: true
    }, userId);
    return;
  }
  if (messages.length === 0) {
    spindle.sendToFrontend({
      type: "summarize_failed",
      error: "No selected messages found in chat. Messages may have been deleted.",
      stage: "fetching",
      retryable: false
    }, userId);
    return;
  }
  let sceneNumber;
  let recentContext;
  const hasTargetBook = req.worldBookId && req.worldBookId !== "__auto_generate__";
  if (req.includeRecentContext && hasTargetBook) {
    const count = Math.max(1, Math.min(10, req.recentContextCount ?? 3));
    const bookId = req.worldBookId;
    const [num, ctx] = await Promise.all([
      resolveNextChronicleNumber(bookId, userId),
      fetchRecentSummaries(bookId, userId, count)
    ]);
    sceneNumber = num;
    recentContext = ctx;
  } else if (hasTargetBook) {
    sceneNumber = await resolveNextChronicleNumber(req.worldBookId, userId);
  }
  const summary = await generateSummary(messages, req.title, userId, req.customPrompt, req.connectionId, req.params, sceneNumber, recentContext);
  if (!summary)
    return;
  if (req.previewOnly) {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    _pendingSummaries.set(requestId, {
      requestId,
      title: summary.title,
      content: summary.content,
      keys: summary.keys,
      chatId,
      messageIds: req.messageIds,
      worldBookId: req.worldBookId,
      userId,
      createdAt: Date.now(),
      autoHidePrior: req.autoHidePrior,
      keepVisibleCount: req.keepVisibleCount,
      sceneNumber
    });
    spindle.sendToFrontend({
      type: "summarize_preview",
      requestId,
      title: summary.title,
      content: summary.content,
      keys: summary.keys,
      messageCount: messages.length
    }, userId);
    return;
  }
}
async function handleSaveSummary(req, userId) {
  const pending = _pendingSummaries.get(req.requestId);
  if (!pending) {
    spindle.sendToFrontend({
      type: "summarize_failed",
      error: "Preview has expired or was already discarded. Please generate a new summary.",
      stage: "generating",
      retryable: true
    }, userId);
    return;
  }
  if (pending.userId !== userId) {
    spindle.log.warn(`${LOG} User ${userId} tried to save pending summary of user ${pending.userId}`);
    return;
  }
  spindle.sendToFrontend({ type: "summarize_progress", stage: "saving" }, userId);
  try {
    const effectiveTitle = req.title?.trim() || pending.title;
    const effectiveContent = req.content ?? pending.content;
    const targetBookId = req.lorebookId || pending.worldBookId;
    const effectiveKeys = req.keys !== undefined ? req.keys : pending.keys;
    const saveResult = await Promise.race([
      saveLorebookEntry({ title: effectiveTitle, content: effectiveContent, keys: effectiveKeys }, pending.chatId, pending.messageIds, targetBookId, userId, req.settings, req.titleFormat, pending.sceneNumber),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Save request timed out after 15s")), 15000))
    ]);
    const { entryId, worldBookId } = saveResult;
    _pendingSummaries.delete(req.requestId);
    if (pending.autoHidePrior) {
      hideMessagesPriorTo(pending.chatId, pending.messageIds, userId, pending.keepVisibleCount ?? 0).catch((err) => {
        spindle.log.warn(`${LOG} hideMessagesPriorTo failed: ${err}`);
      });
    }
    spindle.sendToFrontend({
      type: "summarize_saved",
      entryId,
      title: effectiveTitle,
      preview: pending.content.slice(0, 100),
      worldBookId
    }, userId);
    spindle.log.info(`${LOG} Saved preview as lorebook entry "${effectiveTitle}" (${pending.messageIds.length} messages)`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (pending.autoHidePrior && message === "Save request timed out after 15s") {
      hideMessagesPriorTo(pending.chatId, pending.messageIds, userId, pending.keepVisibleCount ?? 0).catch((e) => {
        spindle.log.warn(`${LOG} hideMessagesPriorTo (timeout fallback) failed: ${e}`);
      });
    }
    spindle.sendToFrontend({
      type: "summarize_failed",
      error: `Failed to save entry: ${message}`,
      stage: "saving",
      retryable: true
    }, userId);
  }
}
async function handleDiscardSummary(req, userId) {
  const pending = _pendingSummaries.get(req.requestId);
  if (pending && pending.userId === userId) {
    _pendingSummaries.delete(req.requestId);
    spindle.log.info(`${LOG} User ${userId} discarded pending summary ${req.requestId}`);
  }
  spindle.sendToFrontend({
    type: "discard_confirmed",
    requestId: req.requestId
  }, userId);
}
async function handleListConnections(userId) {
  try {
    const connections = await Promise.race([
      spindle.connections.list(userId),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timed out after 10s")), 1e4))
    ]);
    spindle.sendToFrontend({ type: "connections_list", connections }, userId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    spindle.log.warn(`${LOG} Failed to list connections: ${message}`);
    spindle.sendToFrontend({ type: "connections_list", connections: [] }, userId);
  }
}
async function handleListLorebooks(userId) {
  try {
    const { data: books } = await Promise.race([
      spindle.world_books.list({ limit: 200, userId }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Lorebook list request timed out after 10s")), 1e4))
    ]);
    const allBooks = books.map((b) => ({ id: b.id, name: b.name }));
    let chatLinked = null;
    try {
      if (spindle.permissions.has("personas")) {
        const persona = await spindle.personas.getActive(userId);
        if (persona?.attached_world_book_id) {
          const book = allBooks.find((b) => b.id === persona.attached_world_book_id);
          if (book)
            chatLinked = book;
        }
      }
    } catch (err) {
      spindle.log.warn(`${LOG} Failed to get persona-linked book: ${err}`);
    }
    let characterLinked = null;
    try {
      if (spindle.permissions.has("characters")) {
        const activeChat = await spindle.chats.getActive(userId);
        if (activeChat?.character_id) {
          const character = await spindle.characters.get(activeChat.character_id, userId);
          if (character?.world_book_ids?.length) {
            const firstBookId = character.world_book_ids[0];
            const book = allBooks.find((b) => b.id === firstBookId);
            if (book)
              characterLinked = book;
          }
        }
      }
    } catch (err) {
      spindle.log.warn(`${LOG} Failed to get character-linked book: ${err}`);
    }
    spindle.sendToFrontend({
      type: "lorebooks_list",
      chatLinked,
      characterLinked,
      allLorebooks: allBooks
    }, userId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    spindle.log.warn(`${LOG} Failed to list lorebooks: ${message}`);
    spindle.sendToFrontend({
      type: "lorebooks_list",
      chatLinked: null,
      characterLinked: null,
      allLorebooks: []
    }, userId);
  }
}
var CHRONICLE_WORLD_BOOK_NAME = "Chronicle";
var _creationLocks = new Map;
async function getOrCreateChronicleBook(userId) {
  const key = `chronicle:${CHRONICLE_WORLD_BOOK_NAME}:${userId}`;
  const existing = _creationLocks.get(key);
  if (existing)
    return existing;
  const promise = (async () => {
    const { data: books } = await Promise.race([
      spindle.world_books.list({ limit: 200, userId }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timed out listing world books")), 1e4))
    ]);
    const allBooks = books;
    const chronicleBook = allBooks.find((b) => b.name === CHRONICLE_WORLD_BOOK_NAME);
    if (chronicleBook) {
      return { id: chronicleBook.id };
    }
    const newBook = await Promise.race([
      spindle.world_books.create({ name: CHRONICLE_WORLD_BOOK_NAME, description: "Lorebook entries generated by the Chronicle extension" }, userId),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timed out creating world book")), 1e4))
    ]);
    spindle.log.info(`${LOG} Created Chronicle world book: ${newBook.id}`);
    return { id: newBook.id };
  })();
  _creationLocks.set(key, promise);
  try {
    return await promise;
  } finally {
    _creationLocks.delete(key);
  }
}
async function autoGenerateChronicleBook(userId) {
  const key = `chronicle:auto_generate:${userId}`;
  const existing = _creationLocks.get(key);
  if (existing)
    return existing;
  const promise = (async () => {
    const { data: books } = await Promise.race([
      spindle.world_books.list({ limit: 200, userId }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Auto-generate lorebook list timed out")), 1e4))
    ]);
    const allBooks = books;
    const chronicleNumbers = allBooks.map((b) => b.name.match(/^Chronicle_(\d+)$/)).filter((m) => m !== null).map((m) => parseInt(m[1], 10)).sort((a, b) => a - b);
    const nextN = chronicleNumbers.length > 0 ? chronicleNumbers[chronicleNumbers.length - 1] + 1 : 1;
    const bookName = `Chronicle_${nextN}`;
    const newBook = await Promise.race([
      spindle.world_books.create({ name: bookName, description: `Auto-generated Chronicle lorebook #${nextN}` }, userId),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timed out creating lorebook")), 1e4))
    ]);
    spindle.log.info(`${LOG} Auto-generated Chronicle book: ${bookName} (${newBook.id})`);
    return { id: newBook.id };
  })();
  _creationLocks.set(key, promise);
  try {
    return await promise;
  } finally {
    _creationLocks.delete(key);
  }
}
async function resolveNextChronicleNumber(worldBookId, userId) {
  try {
    const result = await spindle.world_books.entries.list(worldBookId, {
      limit: 500,
      userId
    });
    let maxNum = 0;
    for (const entry of result.data) {
      if (!entry.comment)
        continue;
      const match = entry.comment.match(/^(\d+)(?:\s*-)?/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum)
          maxNum = num;
      }
    }
    return String(maxNum + 1);
  } catch (err) {
    spindle.log.warn(`${LOG} resolveNextChronicleNumber failed: ${err}`);
    return "1";
  }
}
async function fetchRecentSummaries(worldBookId, userId, count = 3) {
  try {
    const result = await spindle.world_books.entries.list(worldBookId, {
      limit: 500,
      userId
    });
    if (!result.data.length)
      return "";
    const withNumbers = result.data.map((entry) => {
      const numMatch = entry.comment?.match(/^(\d+)(?:\s*-)?/);
      return {
        entry,
        sceneNum: numMatch ? parseInt(numMatch[1], 10) : 0
      };
    }).sort((a, b) => b.sceneNum - a.sceneNum).slice(0, count);
    const summaries = withNumbers.map(({ entry, sceneNum }) => {
      const sceneLabel = sceneNum > 0 ? `Scene ${sceneNum}` : "Entry";
      const snippet = (entry.content ?? "").slice(0, 200).replace(/\n/g, " ");
      return `${sceneLabel}: ${snippet}${entry.content && entry.content.length > 200 ? "\u2026" : ""}`;
    });
    return `

<> Recent scene summaries (for continuity \u2014 the messages above follow these scenes):
${summaries.map((s) => `- ${s}`).join(`
`)}`;
  } catch (err) {
    spindle.log.warn(`${LOG} fetchRecentSummaries failed: ${err}`);
    return "";
  }
}
async function saveLorebookEntry(summary, chatId, messageIds, worldBookId, userId, entrySettings, titleFormat, sceneNumber) {
  let targetBookId = worldBookId;
  if (targetBookId === "__auto_generate__") {
    const book = await autoGenerateChronicleBook(userId);
    targetBookId = book.id;
  }
  if (!targetBookId) {
    const book = await getOrCreateChronicleBook(userId);
    targetBookId = book.id;
  }
  const entryInput = { ...entrySettings || {} };
  entryInput.key = summary.keys && summary.keys.length > 0 ? summary.keys : [summary.title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 50)];
  entryInput.keysecondary = [];
  entryInput.content = summary.content;
  let displayName = summary.title;
  if (titleFormat) {
    let resolvedFormat = titleFormat;
    if (titleFormat.includes("{number}")) {
      const nextNum = sceneNumber ?? await resolveNextChronicleNumber(targetBookId, userId);
      resolvedFormat = titleFormat.replace(/\{number\}/g, nextNum);
    }
    const now = new Date;
    displayName = resolvedFormat.replace(/\{title\}/g, summary.title).replace(/\{date\}/g, now.toLocaleDateString()).replace(/\{time\}/g, now.toLocaleTimeString());
  }
  entryInput.comment = `${displayName} | Chronicle summary | Source: chat ${chatId}, ${messageIds.length} messages | ${new Date().toISOString()}`;
  const entry = await spindle.world_books.entries.create(targetBookId, entryInput, userId);
  return {
    entryId: entry.id,
    worldBookId: targetBookId
  };
}
async function handleFrontendMessage(payload, userId) {
  spindle.log.info(`${LOG} Received message: ` + JSON.stringify(payload));
  const raw = payload;
  if (raw?.type === "summarize_v2" && raw.protocolVersion !== PROTOCOL_VERSION) {
    spindle.sendToFrontend({
      type: "summarize_failed",
      error: `Protocol version mismatch. Frontend: ${raw.protocolVersion ?? "none"}, Backend: ${PROTOCOL_VERSION}. Please refresh the page.`,
      stage: "permission_denied",
      retryable: false
    }, userId);
    return;
  }
  if (isValidSummarizeRequestV2(payload)) {
    if (_summarizingUsers.has(userId)) {
      spindle.sendToFrontend({
        type: "summarize_failed",
        error: "A summarization is already in progress for your account. Please wait.",
        stage: "generating",
        retryable: true
      }, userId);
      return;
    }
    _summarizingUsers.add(userId);
    let _summarizationCompleted = false;
    const timeoutId = setTimeout(() => {
      if (_summarizationCompleted)
        return;
      _summarizingUsers.delete(userId);
      _summarizingTimeouts.delete(userId);
      spindle.log.warn(`${LOG} Summarization lock for ${userId} auto-cleared after ${SUMMARIZE_TIMEOUT_MS / 1000}s timeout`);
      spindle.sendToFrontend({
        type: "summarize_failed",
        error: "Summarization timed out after 5 minutes.",
        stage: "generating",
        retryable: true
      }, userId);
    }, SUMMARIZE_TIMEOUT_MS);
    _summarizingTimeouts.set(userId, timeoutId);
    try {
      await handleSummarizeV2(payload, userId);
    } finally {
      _summarizationCompleted = true;
      const t = _summarizingTimeouts.get(userId);
      if (t) {
        clearTimeout(t);
        _summarizingTimeouts.delete(userId);
      }
      _summarizingUsers.delete(userId);
    }
  } else if (isValidSaveSummaryRequest(payload)) {
    await handleSaveSummary(payload, userId);
  } else if (isValidDiscardSummaryRequest(payload)) {
    await handleDiscardSummary(payload, userId);
  } else if (isValidListConnectionsRequest(payload)) {
    await handleListConnections(userId);
  } else if (isValidListLorebooksRequest(payload)) {
    await handleListLorebooks(userId);
  } else {
    spindle.log.warn(`${LOG} Unknown or invalid message: ` + JSON.stringify(payload));
  }
}
spindle.onFrontendMessage(handleFrontendMessage);
spindle.log.info(`${LOG} Worker started \u2014 ready to summarize`);
