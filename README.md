[English](README.md) | [简体中文](README.zh-CN.md)

# Meta Store Translator for Zotero

A [Zotero](https://www.zotero.org/) web translator that extracts citation metadata from **Meta experience pages** — VR/AR/XR games and software listed at [`https://www.meta.com/experiences/`](https://www.meta.com/experiences/).

When you visit a Meta Store product page, the Zotero Connector icon will light up with a "computerProgram" item. One click saves all the key metadata.

---

## What It Extracts

| Field | Source |
|---|---|
| **Title** | `document.title` → `h1` → URL slug → JSON‑LD/meta fallback |
| **URL** | Current page URL |
| **Developer** | DOM span-scan → JSON‑LD fallback |
| **Publisher** | DOM span-scan → JSON‑LD fallback |
| **Release Date** | DOM span-scan → JSON‑LD fallback |
| **Version** | DOM span-scan → JSON‑LD fallback |

- **Item Type:** `computerProgram`
- **Library Catalog:** `Meta Store`
- Title is trimmed — `"Gorilla Tag on Meta Quest | Quest VR Games"` becomes `"Gorilla Tag"`.
- **Description/abstract is intentionally omitted** — Zotero Connector caches `<head>` metadata across SPA navigations, which would cause cross-page leakage.

---

## Supported URLs

Any URL matching `https?://(www.)?meta.com/experiences/*`, for example:

- `https://www.meta.com/experiences/gorilla-tag/4979055762136823/`
- `https://www.meta.com/experiences/wall-town-wonders/6103056399797843/`
- `https://www.meta.com/experiences/i-am-cat/6061406827268889/`

---

## Installation

1. **Download** the [`Meta Store.js`](Meta%20Store.js) file.
2. In Zotero, go to **Edit → Preferences → Advanced → Files and Folders** and click **Show Data Directory**.
3. Open the `translators` folder and place `Meta Store.js` inside.
4. In your browser, right-click the Zotero Connector icon → **Options** → **Advanced → Translators** → click **Update Translators**.

---

## How It Works

```
detectWeb()  →  URL matches /experiences/ ?  "computerProgram" : false

doWeb()  →  scrape(doc, url)

scrape():
  1. Title       — document.title (always current on SPA)
                   → trim " on " / " | " suffixes
                   ↓ h1 element
                   ↓ URL slug → capitalise words
                   ↓ JSON‑LD / og:title meta (last resort)

  2. Details     — querySelectorAll("span")
                   → match known labels (Developer, Publisher, …)
                   → walk up DOM to find row container
                      → developer / publisher / release date / version

  4. JSON‑LD     — IdMap lookup for @id references
                   → supplement any unfilled fields
```

The translator follows [Zotero's coding standards](
Note: The translator intentionally does not extract the description/abstract because Meta Store is a React SPA — cached `<head>` metadata (JSON‑LD descriptions, `<meta>` tags) can leak across page navigations when using the Zotero Connector.- Uses `attr()` helper for meta-tag extraction (preferred over raw querySelector)
- Uses `ZU.cleanAuthor()` for creator name parsing
- Uses `Z.debug()` for diagnostic logging
- JSON‑LD `@graph` is always traversed as a supplement to DOM extraction

---

## Real Test Data (as of 2026-05-18)

### Gorilla Tag

| Field | Value |
|---|---|
| Title | Gorilla Tag |
| Developer | Another Axiom Inc |
| Publisher | Another Axiom |
| Release Date | December 15, 2022 |
| Version | 1.1.137 |
| URL | `https://www.meta.com/experiences/gorilla-tag/4979055762136823/` |

### Wall Town Wonders

| Field | Value |
|---|---|
| Title | Wall Town Wonders |
| Developer | Cyborn BVBA |
| Publisher | Cyborn BV |
| Release Date | November 21, 2024 |
| Version | 1.10 |
| URL | `https://www.meta.com/experiences/wall-town-wonders/6103056399797843/` |

### I Am Cat

| Field | Value |
|---|---|
| Title | I Am Cat |
| Developer | NEW FOLDER GAMES LTD |
| Publisher | NEW FOLDER GAMES LTD |
| Release Date | December 5, 2024 |
| Version | 1.4.0.0 |
| URL | `https://www.meta.com/experiences/i-am-cat/6061406827268889/` |

---

## Troubleshooting

- **Title is from the previous page?** This is a known Zotero Connector SPA caching issue. The translator now uses `document.title` (updated by React on every route) as the primary title source instead of cached `<head>` metadata. If the problem persists, ensure you have the latest version of this translator. As a workaround, you can copy the URL and open it in a new browser tab — the Connector will then see a fresh page load with correct metadata.
- **Details not extracted?** Meta may have changed their page layout. The translator scans all `<span>` elements for known labels (Developer, Publisher, etc.) and walks up the DOM to find corresponding values. If Meta changes label text or row structure, the extraction logic may need updating.
- **Debugging:** Open Zotero's debug output (Help → Debug Output Logging) and look for lines starting with `Meta Store:`.

---

## Compatibility

- Zotero 5.0 or above
- Browser connector with translator support (Chrome, Firefox, Edge, Safari)

---

## References

Gualeni, Stefano, Riccardo Fassone, and Jonas Linderoth. 'How to Reference a Digital Game'. In *Proceedings of DiGRA 2019: Game, Play and the Emerging Ludo-Mix*, 17. Kyoto: DiGRA, 2019. <http://www.digra.org/digital-library/publications/how-to-reference-a-digital-game/>.

Kaltman, Eric, Stacey Mason, and Noah Wardrip-Fruin. 'The Game I Mean: Game Reference, Citation and Authoritative Access'. *Game Studies* 21, no. 3 (September 2021). <https://gamestudies.org/2103/articles/kaltman_mason_wardripfruin>.

---

Maintained by **Chengkai Xu**. Last updated: 2026-05-22.
