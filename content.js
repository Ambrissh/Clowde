(() => {
  "use strict";

  const CONTEXT_LIMIT = 180000;
  const ALERT_THRESHOLD = 80;
  const UNDERCOUNT_CORRECTION = 2.8;
  const ROOT_ID = "clowde-root";

  const state = {
    active: false,
    lastScore: 0,
    root: null,
    currentUrl: location.href
  };

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function collectTokens() {
    let total = 0;

    document.querySelectorAll('[class*="font-user-message"]').forEach((node) => {
      if (node.closest(`#${ROOT_ID}`)) return;
      total += estimateNodeTokens(node);
    });

    document.querySelectorAll(".standard-markdown").forEach((node) => {
      if (node.closest(`#${ROOT_ID}`)) return;
      total += estimateNodeTokens(node);
    });

    return total;
  }

  function estimateNodeTokens(node) {
    const fullText = getTokenText(node);
    const codeTexts = getCodeElements(node).map((el) => getTokenText(el)).filter(Boolean);
    const codeText = codeTexts.join("");
    const plainText = removeCodeText(fullText, codeTexts);
    const imageTokens = node.querySelectorAll("img, picture").length * 1500;

    return (plainText.length / 4) + ((codeText.length / 4) * 1.5) + imageTokens;
  }

  function getTokenText(node) {
    return (node.textContent || "").trim();
  }

  function getCodeElements(node) {
    const codeNodes = [...node.querySelectorAll("pre, code")];
    return codeNodes.filter((el) => !codeNodes.some((other) => other !== el && other.contains(el)));
  }

  function removeCodeText(fullText, codeTexts) {
    return codeTexts.reduce((plain, code) => {
      if (!code) return plain;
      return plain.replace(code, "");
    }, fullText);
  }

  function getBestText(node) {
    const inner = (node.innerText || "").trim();
    const content = (node.textContent || "").trim();
    return inner.length >= content.length ? inner : content;
  }

  function getHealthScore() {
    const rawTokens = collectTokens();
    const userNodes = [...document.querySelectorAll('[class*="font-user-message"]')]
      .filter((node) => !node.closest(`#${ROOT_ID}`));
    const assistantNodes = [...document.querySelectorAll(".standard-markdown")]
      .filter((node) => !node.closest(`#${ROOT_ID}`));
    const turnCount = userNodes.length + assistantNodes.length;
    const turnBonus = Math.min(15, turnCount * 0.2);
    const rawPercent = (rawTokens / CONTEXT_LIMIT) * 100;
    const correctedPercent = Math.min(100, (rawPercent * UNDERCOUNT_CORRECTION) + turnBonus);
    return Math.min(100, Math.round(correctedPercent));
  }

  function updateScore() {
    const score = getHealthScore();
    if (score > state.lastScore) {
      state.lastScore = score;
      renderScore(state.lastScore);
    }
  }

  function renderScore(score) {
    const fill = document.getElementById("clowde-fill");
    const percent = document.getElementById("clowde-percent");
    const alert = document.getElementById("clowde-alert");
    const statusEl = document.getElementById("clowde-status");

    if (!fill || !percent || !alert) return;

    fill.style.width = `${score}%`;
    percent.textContent = `${score}%`;

    if (score >= ALERT_THRESHOLD) {
      percent.style.color = "#3b82f6";
      fill.style.background = "#3b82f6";
    } else if (score >= 60) {
      percent.style.color = "#f59e0b";
      fill.style.background = "#f59e0b";
    } else {
      percent.style.color = "#9ca3af";
      fill.style.background = "#9ca3af";
    }

    if (score >= ALERT_THRESHOLD) {
      alert.hidden = false;
    }

    if (statusEl && score >= 70 && score < ALERT_THRESHOLD) {
      statusEl.textContent = "Getting full — consider switching soon";
      statusEl.style.color = "#f59e0b";
    }
  }

  function watchNavigation() {
    setInterval(() => {
      if (location.href !== state.currentUrl) {
        state.currentUrl = location.href;
        state.lastScore = 0;
        state.root = null;

        document.getElementById(ROOT_ID)?.remove();

        setTimeout(() => {
          mountBar();
          setTimeout(async () => {
            await preloadMessages();
            updateScore();
          }, 2000);
        }, 800);
      }
    }, 500);
  }

  async function preloadMessages() {
    const scroller = [...document.querySelectorAll("*")].find((el) => {
      const style = window.getComputedStyle(el);
      const scrollable = style.overflowY === "auto" || style.overflowY === "scroll";
      return scrollable && el.scrollHeight > el.clientHeight && el.clientHeight > 400;
    }) || document.documentElement;

    const original = scroller.scrollTop;

    scroller.scrollTop = 0;
    await sleep(300);

    scroller.scrollTop = scroller.scrollHeight;
    await sleep(800);

    scroller.scrollTop = original;
    await sleep(300);
  }

  function detectHighUsage() {
    const turnCount =
      document.querySelectorAll('[class*="font-user-message"]').length +
      document.querySelectorAll(".standard-markdown").length;

    const nativeWarning = [...document.querySelectorAll('[class*="long-conversation"], [class*="context"], [class*="limit"], [class*="warning"]')]
      .some((el) => /long conversation|context limit|context window|reaching the limit/i.test(el.textContent || ""));

    const scroller = [...document.querySelectorAll("*")].find((el) => {
      const style = window.getComputedStyle(el);
      return (style.overflowY === "auto" || style.overflowY === "scroll") &&
        el.scrollHeight > el.clientHeight &&
        el.clientHeight > 400;
    });
    const scrollHeight = scroller?.scrollHeight || 0;

    let detectedPercent = 0;
    if (nativeWarning) detectedPercent = Math.max(detectedPercent, 92);
    if (turnCount > 150) detectedPercent = Math.max(detectedPercent, 88);
    else if (turnCount > 100) detectedPercent = Math.max(detectedPercent, 72);
    else if (turnCount > 60) detectedPercent = Math.max(detectedPercent, 52);
    if (scrollHeight > 80000) detectedPercent = Math.max(detectedPercent, 78);
    else if (scrollHeight > 40000) detectedPercent = Math.max(detectedPercent, 45);

    return detectedPercent;
  }

  function mountBar() {
    if (document.getElementById(ROOT_ID)) {
      state.root = document.getElementById(ROOT_ID);
      return;
    }

    const input = document.querySelector('[contenteditable="true"]');
    if (!input) {
      setTimeout(mountBar, 800);
      return;
    }

    const anchor = input.closest("form") || input.parentElement?.parentElement;
    if (!anchor?.parentNode) {
      setTimeout(mountBar, 800);
      return;
    }

    const root = document.createElement("div");
    root.id = ROOT_ID;
    root.className = "clowde-bar";
    root.innerHTML = `
      <div class="clowde-main">
        <div class="clowde-left">
          <button class="clowde-logo" id="clowde-activate" type="button" aria-label="Activate Clowde">
            <svg viewBox="0 0 64 40" aria-hidden="true">
              <path d="M8 26.5C8 18.6 14.5 12.2 22.6 12.2c2.2-5.1 7.3-8.7 13.3-8.7 8 0 14.4 6.2 14.6 14 4.2.9 7.5 4.6 7.5 9 0 5.3-4.4 9.7-9.9 9.7H19.4C13.1 36.2 8 31.9 8 26.5Z"></path>
              <path d="M18.5 25.9c5.5 4.4 11.9 4.4 17.5 0 4.8-3.7 9.5-3.8 14.2-.1"></path>
            </svg>
            <span id="clowde-status">${state.active ? "Monitoring your session" : "Go, let the learning begin!"}</span>
          </button>
        </div>
        <div class="clowde-center">
          <div class="clowde-track">
            <div class="clowde-fill" id="clowde-fill"></div>
          </div>
          <span class="clowde-percent" id="clowde-percent">0%</span>
        </div>
        <div class="clowde-right">
          <button class="clowde-fresh-btn" id="clowde-fresh" type="button">Generate Handoff</button>
        </div>
      </div>
      <div class="clowde-alert" id="clowde-alert" hidden>
        <span>Hey — I think it's a good time to switch chats. Your flow is worth protecting.</span>
        <button id="clowde-switch" type="button">Switch Now</button>
        <button id="clowde-keep" type="button">Keep Going</button>
      </div>
    `;

    anchor.parentNode.insertBefore(root, anchor);
    state.root = root;
    bindEvents();
    const detectedFloor = detectHighUsage();
    state.lastScore = Math.max(state.lastScore, detectedFloor);
    renderScore(state.lastScore);
  }

  function injectHandoff() {
    const input = document.querySelector('[contenteditable="true"]');
    if (!input) return;

    const prompt = buildHandoffPrompt();

    input.focus();
    input.textContent = prompt;
    input.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function buildHandoffPrompt() {
    const userMessages = [...document.querySelectorAll('[class*="font-user-message"]')]
      .filter((node) => !node.closest(`#${ROOT_ID}`))
      .map((node) => getBestText(node))
      .filter((text) => text.length > 10)
      .filter((text) => !text.startsWith("Before we end this chat"));

    const assistantMessages = [...document.querySelectorAll(".standard-markdown")]
      .filter((node) => !node.closest(`#${ROOT_ID}`))
      .map((node) => getBestText(node))
      .filter((text) => text.length > 10);

    const recentUserMsgs = userMessages.slice(-5);
    const recentAssistantMsgs = assistantMessages.slice(-3);
    const lastTask = userMessages.at(-1) || "";
    const firstFew = userMessages.slice(0, 3);

    const topicSummary = firstFew.map((m) => `- ${m.slice(0, 200)}`).join("\n");
    const recentWork = recentUserMsgs.map((m) => `- ${m.slice(0, 300)}`).join("\n");
    const assistantContext = recentAssistantMsgs.map((m) => `- ${m.slice(0, 400)}`).join("\n");

    return `Before we end this chat, create a COMPLETE continuity summary of EVERYTHING important from this entire conversation so I can paste it into a new chat and continue seamlessly.

IMPORTANT INSTRUCTIONS:
- Do NOT make this short.
- Do NOT overly summarize.
- Do NOT omit technical details, reasoning, decisions, failed attempts, or unfinished work.
- Preserve the full context as accurately as possible.

Include:
- all projects discussed
- all technical implementations
- architecture and stack decisions
- debugging attempts and errors
- workflow preferences
- important motivations affecting decisions
- chronology of how ideas evolved
- unresolved questions
- pending tasks
- next recommended actions
- exact current status of everything

For coding discussions include:
- file structure
- frameworks/tools/apis
- implementation progress
- bugs encountered
- attempted fixes
- current blockers
- what still needs to be built

For brainstorming:
- separate confirmed decisions from speculative ideas.

For strategic discussions:
- preserve the reasoning behind decisions and tradeoffs.

Structure the output clearly with sections and bullet points so another AI assistant can instantly continue the work without asking repetitive onboarding questions.

At the end include:
1. Where we left off
2. Immediate next step
3. Current blockers
4. Important context the next assistant must remember
5. Things the next assistant should NOT repeat or ask again

Treat this as a full state restoration document for continuing an ongoing long-term collaboration.

---

Here is the conversation context for reference:

**Initial topics discussed:**
${topicSummary}

**Recent user messages:**
${recentWork}

**Recent assistant responses (summarized):**
${assistantContext}

**Last active task:**
${lastTask}`;
  }

  function bindEvents() {
    document.getElementById("clowde-activate")?.addEventListener("click", async () => {
      state.active = true;
      document.getElementById("clowde-status").textContent = "Monitoring your session";
      document.getElementById("clowde-activate")?.classList.add("activated");
      await preloadMessages();
      updateScore();
    });

    document.getElementById("clowde-fresh")?.addEventListener("click", () => {
      injectHandoff();
    });

    document.getElementById("clowde-switch")?.addEventListener("click", () => {
      injectHandoff();
      document.getElementById("clowde-alert").hidden = true;
    });

    document.getElementById("clowde-keep")?.addEventListener("click", () => {
      document.getElementById("clowde-alert").hidden = true;
    });
  }

  function init() {
    mountBar();
    watchNavigation();

    setTimeout(async () => {
      await preloadMessages();
      updateScore();
    }, 2000);

    setInterval(updateScore, 3000);
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init();
})();
