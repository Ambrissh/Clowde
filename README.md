# ☁️ Clowde - Use CLAUDE Infinitely in the free tier !!

**(Claude + Flow = Clowde 😉)**

> Never lose your Claude context again.

Clowde is a tiny Chrome extension that sits right above your Claude.ai input box and watches how full your conversation is getting. When things start getting long, it nudges you to switch chats and generates a full continuity prompt so the next chat picks up exactly where you left off.

No data ever leaves your browser. No API keys. No tracking. Just a calm little bar protecting your flow.

---

## What it looks like

When you open any conversation on Claude.ai, Clowde appears as a sleek dark bar above your input:

```
┌──────────────────────────────────────────────────────────┐
│ ☁ Go, let the learning begin!   ━━━━━━━━━━  92%   [Generate Handoff] │
├──────────────────────────────────────────────────────────┤
│ Hey — it's a good time to switch chats.    [Switch Now] [Keep Going]  │
└──────────────────────────────────────────────────────────┘
```

- **Progress bar** — shows estimated context usage (0–100%)
- **Generate Handoff** — click anytime to create a continuity prompt
- **Switch Now** — appears at 80%+, generates a handoff and dismisses the alert
- **Keep Going** — dismisses the warning if you want to keep pushing

---

## How to use it

1. **Install Clowde** (see below) and open any conversation on [claude.ai](https://claude.ai).
2. You'll see the Clowde bar appear above the input box. Click the cloud icon to activate monitoring.
3. As you chat, the progress bar fills up. Clowde estimates how much of Claude's context window you've used.
4. **At ~70-80%**, a gentle alert appears: *"Hey — I think it's a good time to switch chats. Your flow is worth protecting."*
5. Click **Switch Now** or **Generate Handoff** — Clowde pastes a detailed handoff prompt into the input box.
6. **Send that message to Claude.** Claude will generate a full continuity summary of everything important from your conversation.
7. **Copy that summary**, open a new chat, paste it in, and keep going seamlessly.

That's it. Your flow stays intact, your context stays fresh, and you never lose track of where you were.

---

## The handoff prompt

When you click **Generate Handoff** or **Switch Now**, Clowde injects this into your input:

> *Before we end this chat, create a COMPLETE continuity summary of EVERYTHING important from this entire conversation so I can paste it into a new chat and continue seamlessly.*
>
> *Include: all projects discussed, all technical implementations, architecture decisions, debugging attempts, workflow preferences, unresolved questions, pending tasks, next steps, and exact current status.*
>
> *At the end include: (1) Where we left off, (2) Immediate next step, (3) Current blockers, (4) Important context the next assistant must remember, (5) Things the next assistant should NOT repeat or ask again.*

The prompt also attaches context it scraped from the page — your first few messages (to capture the topic), recent messages (to capture where you are now), and recent assistant responses (to capture decisions already made).

---

## How it estimates context

Clowde reads the visible conversation DOM and makes a local estimate. It's not a precise tokeniser — it's an intentional early-warning system.

- Counts characters in user and assistant messages, estimates ~4 chars per token
- Weights code blocks slightly heavier (1.5x)
- Accounts for images and documents
- Uses turn count and scroll height as secondary signals
- Applies a correction multiplier for off-screen messages. Chrome doesn't fully render

**Clowde intentionally errs early.** A false positive (switching a bit too soon) costs 30 seconds. A false negative (hitting the limit mid-task) costs your entire flow.

---

## Privacy

Zero data leaves your browser. No API calls, no telemetry, no analytics. Everything runs locally in the content script.

---

## Install

1. Open Chrome → `chrome://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked**
4. Select the `clowde` folder
5. Open [claude.ai](https://claude.ai) and start chatting

---


## Built by

**Ambrissh S. Raghav** 

[github.com/Ambrissh](https://github.com/Ambrissh)
