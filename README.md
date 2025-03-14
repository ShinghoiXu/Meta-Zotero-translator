# Meta Store Translator for Meta Store Experiences

This translator is designed for [Zotero](https://www.zotero.org/), the free, open-source reference manager. It extracts citation metadata from Meta experiences pages (covering VR/AR/XR games and software) available at `https://www.meta.com/experiences/`.

The translator gathers key details such as a trimmed title, description, URL, developer, release date, version, and publisher. It uses a combination of static meta tag extraction, dynamic keyword-based searches, and fallback parsing of JSON-LD data to build a comprehensive citation record.

---

## Features

- **Title Extraction:**  
  The translator retrieves the full title from the `og:title` meta tag or document title and trims it by removing any trailing text (e.g., text after " on"). 

- **Description & URL:**  
  It extracts the page description from the `og:description` or standard description meta tag, and uses the `og:url` tag (or falls back to the current URL) for accurate citation linking.

- **Dynamic Data Extraction:**  
  - **Developer:** Searches the document using XPath for a keyword match (e.g. "developer") and captures the following sibling element’s text.
  - **Release Date:** Similarly, it dynamically locates and extracts the release date.
  - **Version:** Uses a keyword search to extract the version information.

- **Fallback via JSON-LD:**  
  If certain fields (such as publisher, release date, or developer) are not found dynamically, the translator falls back to parsing JSON-LD data. It also cleans the publisher’s name by removing any trailing " Inc" if present.

- **Item Type:**  
  The translator sets the item type as "computerProgram" to match Zotero's software entry requirements.

- **Library Catalog:**  
  The record is marked with a library catalog value of `"meta.com"`.

---

## Supported URLs

The translator is activated on Meta experiences pages. It detects a valid page if the URL includes `/experiences/`.

---

## Installation

1. **Download the Translator:**  
   Save the `Meta.js` file on your computer.

2. **Locate Zotero Translators Folder:**  
   In Zotero, navigate to **Edit > Preferences > Advanced > Files and Folders** and click **Show Data Directory**. Open the `translators` folder.

3. **Copy the File:**  
   Paste the `Meta.js` file into the `translators` folder.

4. **Update Translators:**  
   In your browser, right-click the Zotero Connector icon, select **Options** (or **Manage Extension/Options**), navigate to **Advanced > Translators**, and click **Update Translators**. This will refresh your list to include the new Meta Store translator.

---

## How It Works

When you visit a Meta experiences page (e.g., `https://www.meta.com/experiences/gorilla-tag/4979055762136823/`), the Zotero Connector icon will indicate that a computer program item is available. Clicking the icon will automatically extract the metadata, including:

- **Title:** Trimmed from the `og:title` meta tag or document title.
- **Abstract/Description:** Pulled from the description meta tags.
- **URL:** From the `og:url` meta tag (or the current page URL).
- **Developer, Release Date & Version:** Dynamically extracted via XPath searches.
- **Publisher:** Retrieved from JSON-LD data (with any trailing " Inc" removed).

The translator then creates a complete citation record for the experience.

---

## Sample Test Cases

Here are two examples of how the translator processes pages:

- **Gorilla Tag:**  
  - **Title:** Gorilla Tag  
  - **Developer:** Extracted dynamically (or via JSON-LD fallback)  
  - **Release Date:** e.g., "Jan 30, 2025 at 7:50 AM"  
  - **Version:** e.g., "v1.2.3"  
  - **Publisher:** e.g., "Another Axiom" (cleaned from "Another Axiom Inc")  
  - **URL:** Direct link to the Gorilla Tag page

- **Wall Town Wonders:**  
  - **Title:** Wall Town Wonders  
  - **Developer:** Extracted dynamically  
  - **Release Date:** e.g., "Feb 15, 2025"  
  - **Version:** e.g., "v2.0"  
  - **Publisher:** Retrieved from JSON-LD data  
  - **URL:** Direct link to the Wall Town Wonders page

For more details, refer to the test cases embedded within the translator code.

---

## Troubleshooting & Notes

- **Dynamic Extraction:**  
  The translator uses case-insensitive XPath queries to locate keywords like "developer", "release date", and "version". If the page structure changes, these extractions might require adjustments.

- **Fallback Mechanism:**  
  When dynamic extraction fails, JSON-LD parsing provides a backup to ensure key fields are still captured.

- **Compatibility:**  
  The translator requires Zotero version 5.0 or above.

- **Feedback:**  
  If you encounter any issues or have suggestions, please report them on the Zotero Translators repository.

---

This translator is maintained by Chengkai Xu and last updated on March 12, 2025. Enjoy citing your Meta experiences seamlessly!
