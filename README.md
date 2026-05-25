# Clowde
### Never lose your Claude context again.

## Why I built this

I built Clowde because Claude.ai does not give you a useful early signal when a conversation is approaching the context limit. By the time Claude shows its own warning, usually around 90% or later, the conversation quality has often already started degrading: shorter answers, repeated explanations, forgotten constraints, and that quiet sense that the model is no longer holding the whole thread.

I wanted an early warning system that respects the user's intelligence. Not a panic button, not an onboarding flow, not a dashboard full of fake precision. Just a small bar above the input that says, in effect: your flow matters, and you may want to switch before the work gets brittle.

## How it works

Clowde runs entirely inside the Chrome extension content script on `claude.ai`. It reads the visible Claude conversation DOM and estimates context pressure locally.

The current algorithm:

- Collects user messages with `[class*="font-user-message"]`.
- Collects assistant responses with `.standard-markdown`.
- Reads `textContent`, not `innerText`, for token estimation because Chrome's `content-visibility: auto` can make off-screen `innerText` unreliable.
- Estimates plain text at roughly `chars / 4`.
- Estimates code blocks at `chars / 4 x 1.5` because code is denser than prose.
- Adds `+1500` tokens per image.
- Adds `+800` tokens per estimated document page.
- Applies a correction multiplier of `2.8x` to compensate for DOM truncation from off-screen messages.
- Adds a turn count bonus: `min(15, turnCount x 0.2)` to account for conversation complexity.
- Uses scroll height, turn count, and Claude's own native warning text as proxy signals for already-long conversations on mount.

The final score is:

```text
min(100, (rawPercent x 2.8) + turnBonus)
```

Then Clowde applies a detected floor from proxy signals. For example, a conversation with more than 150 turns is treated as already near the danger zone even if the browser has not rendered all off-screen text yet.

## Algorithm accuracy & known error rate

This is an approximation, not a precise token counter.

In live Claude DOM testing, the measured average assistant node was around `1,162` characters. The actual visible response length for long assistant answers is often closer to `4,000-5,000` characters. That gives an undercount ratio of roughly `3.4-4.3x`.

Clowde currently applies a `2.8x` correction multiplier, then adds a capped turn-count bonus. The residual error is usually around `+/- 15-25%`, depending on the type of conversation. Code-heavy threads, long markdown answers, and chats with many collapsed off-screen nodes are harder to estimate.

Validation so far:

- Short chat, around 5 turns: shows `3-8%` - accurate.
- Medium chat, around 30 turns: shows `18-28%` - reasonable.
- Long chat, 100+ turns and code-heavy: shows `65-80%` - correct range.
- Very long chat, 150+ turns: shows `85-95%` - triggers warning correctly.

Clowde intentionally errs toward early warnings.

A false positive, switching slightly early, costs 30 seconds.

A false negative, hitting the limit mid-task, costs your entire flow.

## The DOM limitation problem

Claude.ai uses `content-visibility: auto` to keep long conversations fast. That is good product engineering, but it creates a real limitation for browser extensions: messages outside the viewport may be present as DOM nodes while still returning partial or unreliable layout text.

Clowde works around this by combining several signals:

- Text length from `textContent`.
- Scroll preloading to force more messages to render.
- Correction multipliers based on measured undercount.
- Turn count as a structural proxy.
- Scroll height as a conversation length proxy.
- Claude's native long-context warning, when present.

That means Clowde is not, and does not pretend to be, a perfect tokenizer. A precise counter would require API access or a model-specific tokenizer with full conversation text. Clowde deliberately avoids that because privacy matters more than fake precision here.

## Privacy

Zero data leaves your browser.

There are no API calls, no telemetry, no analytics, and no tracking. Everything runs locally in the content script. Clowde does not send your conversation anywhere. It measures text length and structural signals in the page so it can estimate context pressure and generate a local handoff prompt.

## Installation

1. Open Chrome and go to `chrome://extensions`.
2. Turn on Developer mode.
3. Click Load unpacked.
4. Select the Clowde extension folder.
5. Open `https://claude.ai` and start or resume a conversation.

## Roadmap

- Firefox support.
- Configurable warning threshold.
- Conversation summary quality improvements.
- Cross-model support for ChatGPT and Gemini.

## Built by

Ambrissh S. Raghav - 3rd year Physics undergrad at IISER Berhampur, building at the intersection of AI and developer tools.

Find me on GitHub: [github.com/Ambrissh](https://github.com/Ambrissh)
