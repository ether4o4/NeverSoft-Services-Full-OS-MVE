# NeverSoft Services — Full OS (MVE)

> NeverSoft Services presents a true user-first, one-size-fits-all experience like
> never before — the last launcher you'll ever need. A brand-new, privacy-focused
> Operating System experience that turns your device into a real, self-contained PC.

This repository is the **canonical combined home** for the NeverSoft OS. It brings the
shell and the engine together into one product:

| Layer | What it is | Source | Status |
|-------|------------|--------|--------|
| **Shell** (this tree) | The Windows-Aero-style React Native desktop — windows, taskbar, start menu, the MVE chat + Linux-sandbox pages, and the **real native Kotlin bridge** (`MveBridgeModule`). | `ether4o4/NeverSoft-OS` (branch `claude/swarm-mve-replacement-i85ve6`, `43bdc27`) | ✅ Seeded here, CI-green |
| **`engine/`** | MorsVitaEst (MVE) — the Kotlin-Multiplatform kernel: Alpine/proot Linux sandbox, on-device LLM, MCP, agents, 24/7 daemon. The bridge delegates to its `MveEngine` facade. | `ether4o4/MorsVitaEst` | ⏳ To be vendored once the repo is granted to the build session |
| **`files/`** | Ghost-Key file engine — auto-tagging, vaults, timeline, analyzer, real FS access. | `ether4o4/Ghost-key-file-explorer` | ⏳ Candidate fold-in as the Files surface |

## Architecture

NeverSoft OS is a **shell + kernel** split: the React Native desktop is the front end
you touch; the MVE engine is the always-on backend ("the cmd of the launcher"). They
share one process / one APK and meet at a native-module **bridge** — the shell calls a
curated facade (`sendMessage` + token stream, sandbox/`runShell` exec, file
list/read/write/search, settings, provider + agent config); everything heavy
(sandbox, local LLM, daemon, MCP, tools) stays native.

Until the `engine/` is vendored, the bridge uses an inline OpenAI-compatible seam
(privacy-first: the user's own key, calling their chosen provider directly) as the
documented stand-in for `MveEngine`.

## Build

The shell builds exactly as it does in `NeverSoft-OS`: React Native 0.81.6, Android
debug APK via `.github/workflows/build-apk.yml` (`assembleDebug`). See `QUICKSTART.md`.

> ℹ️ Seeded as a fresh import of the NeverSoft-OS work tree to keep CI green from the
> first commit. NeverSoft-OS retains its full commit history; engine/ and files/ land
> as follow-up PRs.
