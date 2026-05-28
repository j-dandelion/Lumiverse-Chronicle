## 📖 Chronicle

Similar to the MemoryBooks extension for SillyTavern, this extension provides a quick and easy way to take a scene or arc and create a customizable summary or memory (saved as a lorebook entry).

And not just summaries/memories: technically, you can feed a set of messages into context for any kind of prompt you want. So it can be useful for all sorts of memory and context management techniques.

## What it adds

There's a **Select messages** button built into Lumiverse at the top-right of chat. It opens a message selection bar.

Chronicle adds a button to that bar:
- **Summarize button** (Opens a pop-up menu with settings/presets and a button to generate summary preview)

Everything else is inside that menu.

## Features included so far

- **Auto-hide**: After summary is finalized, automatically hide summarized messages and/or all previous messages from context. (Applies to database, no need to scroll up and load messages)
- **Preserve recent messages**: Choose a number of recent messages to keep visible when auto-hide is used. (Helps with coherence)
- **Generation preview**: See and edit results before saving to lorebook.
- **Generate in background**: Use Lumiverse freely while summary is generating.
- **Recent memories in context**: Choose to include previous summaries/memories from the lorebook in context.
- **Theme consistent**: All UI is integrated with Lumiverse's built-in theming and visual settings.
- **Connection profiles**: Choose a different provider/model to use for summaries.
- **Parameter controls**: Control temperature, top p, top k, and max tokens.
- **Prompt presets**: Save different summarization prompts and switch between them.
- **Lorebook settings presets**: Save sets of lorebook settings and switch between them.
- **Preset export and import**: Save presets as files to share, import on another device, or use as backups.

## Screenshots

<p align="center">
  <img width="800" alt="Summarize modal with message selection"
src="https://github.com/user-attachments/assets/3efde716-e072-4728-918c-990ab5661d5c" />
</p>

<br/>

<table>
  <tr>
    <td align="center">
      <img width="400" alt="Prompt preset editor" src="https://github.com/user-attachments/assets/60ca1457-8a0f-4ed9-b7ec-e0b001f74afe" />
    </td>
    <td align="center">
      <img width="400" alt="Lorebook and settings management"
src="https://github.com/user-attachments/assets/5db61426-496a-4962-8705-cf03c99e1c87" />
    </td>
  </tr>
</table>

## FYI

> 📕 Like all lorebook entries, your summaries/memories can be always-active (constant), triggered by keywords, or vectorized.

> 🧠 You can use it standalone or alongside the default Lumiverse Summarize, Memory Cortex, and other extensions like Lore Recall. They all do different things and can harmonize pretty well with the right setup.

> ⚠️ Vibecoded with high-end models, a custom harness, and a careful workflow. But still, obviously not ideal, you know how it goes. If someone develops something better, I'll happily defer to them.

> 🛠️ Any reported bugs should be fixed within a day or two. Requests, suggestions, and criticism are welcome.
