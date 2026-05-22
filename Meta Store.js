{
	"translatorID": "c8da160e-9c26-44e8-b93f-227ce88ec51d",
	"label": "Meta Store",
	"creator": "Chengkai Xu",
	"target": "https?://(www\\.)?meta\\.com/experiences/",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2026-05-18 00:00:00"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2026 Chengkai Xu

	This file is part of Zotero.

	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with Zotero. If not, see <http://www.gnu.org/licenses/>.

	***** END LICENSE BLOCK *****
*/

/*
	Meta Store Translator — extracts citation metadata from Meta experience pages
	(https://www.meta.com/experiences/...) for VR/AR/XR games and software.

	Extracted fields:
	  - Title:       from document.title → h1 → URL slug → JSON‑LD/meta
	  - URL:         from the page URL
	  - Developer:   from DOM span-scan → JSON‑LD fallback
	  - Publisher:   from DOM span-scan → JSON‑LD fallback
	  - Release Date: from DOM span-scan → JSON‑LD fallback
	  - Version:     from DOM span-scan → JSON‑LD fallback

	Note: Description/abstract is intentionally not extracted — Meta Store is
	a React SPA and the Zotero Connector caches <head> metadata across
	client-side navigations, causing cross-page leakage.

	Item type:  computerProgram
	Catalog:    Meta Store

	Follows Zotero translator coding standards:
	  - Uses attr() helper for meta tag extraction (preferred over raw querySelector)
	  - Uses ZU.cleanAuthor() for creator name parsing
	  - Uses Z.debug() for diagnostic logging
	  - JSON‑LD @graph is always traversed as a supplement to DOM extraction
*/

function detectWeb(doc, url) {
	if (url.match(/https?:\/\/(www\.)?meta\.com\/experiences\//)) {
		return "computerProgram";
	}
	return false;
}

function doWeb(doc, url) {
	scrape(doc, url);
}

function scrape(doc, url) {
	// --- Phase 0: Parse JSON‑LD once ---
	// JSON‑LD lives in <head> and may be stale during SPA client-side
	// navigations.  It is still useful as a supplementary source for fields
	// that DOM extraction misses, and it is correct on direct page visits.
	var ldData = null;
	var ldGraph = [];
	var ldJson = doc.querySelector('script[type="application/ld+json"]');
	if (ldJson) {
		try {
			ldData = JSON.parse(ldJson.textContent);
			ldGraph = ldData["@graph"] || [];
		} catch(e) {
			Z.debug("Meta Store: JSON‑LD parse error — " + e.message);
		}
	}

	// --- Title Extraction ---
	// Priority: document.title → h1 → URL slug → JSON‑LD/meta
	// document.title is the ONLY source that stays current during React SPA
	// client-side navigations.  JSON‑LD lives in <head> and is cached by the
	// Zotero Connector across route changes; h1 lives in <body> and is fresh.

	// Helper: capitalise each word of a slug ("gorilla-tag" → "Gorilla Tag")
	function slugToTitle(slug) {
		return slug.replace(/-/g, ' ').replace(/\b\w/g, function(ch) {
			return ch.toUpperCase();
		});
	}

	var title = "";

	// 1. document.title — always current (React updates <title> on every route)
	var dt = doc.title || "";
	if (dt) {
		// "Gorilla Tag on Meta Quest | Quest VR Games | Meta Store" → "Gorilla Tag"
		var pipeIdx = dt.indexOf(" | ");
		if (pipeIdx > -1) {
			dt = dt.substring(0, pipeIdx);
		}
		var onIdx = dt.indexOf(" on ");
		if (onIdx > -1) {
			dt = dt.substring(0, onIdx);
		}
		title = dt.trim();
	}

	// 2. h1 heading — visible title in the page body
	if (!title) {
		var h1 = doc.querySelector("h1");
		if (h1) title = ZU.trimInternal(h1.textContent);
	}

	// 3. URL slug — always reliable, but loses original casing
	if (!title) {
		var m = url.match(/\/experiences\/([^/]+)\//);
		if (m) title = slugToTitle(m[1]);
	}

	// 4. og:title meta / JSON‑LD (may be stale on SPA, last resort)
	if (!title) {
		title = attr(doc, 'meta[property="og:title"]', 'content')
			|| attr(doc, 'meta[name="og:title"]', 'content') || "";
		if (!title && ldGraph.length) {
			for (var gi = 0; gi < ldGraph.length; gi++) {
				var tnode = ldGraph[gi];
				var ttype = tnode["@type"];
				var isIP = (ttype === "ItemPage") ||
					(Array.isArray(ttype) && ttype.indexOf("ItemPage") !== -1);
				if (isIP && tnode.name) {
					title = tnode.name;
					break;
				}
			}
		}
		if (title.indexOf(" on ") > -1) {
			title = title.split(" on ")[0].trim();
		} else if (title.indexOf(" | ") > -1) {
			title = title.split(" | ")[0].trim();
		}
	}

	Z.debug("Meta Store: title = " + title);

	// --- Create Item ---
	var item = new Z.Item("computerProgram");
	item.title = title;
	item.url = url;
	item.libraryCatalog = "Meta Store";


	// --- Metadata extraction ---
	// Strategy: hunt for known label <span> elements anywhere in the page.
	// For each found label, walk up to the row container (DIV.x78zum5 with 2 children
	// of class x193iq5w) and read the value from the sibling cell.
	// This approach avoids brittle XPath section detection and is tolerant of
	// Meta's frequent CSS class changes (x78zum5 / x193iq5w are stable flex layout atoms).

	var fieldMap = {
		"developer":      { type: "creator", creatorType: "programmer" },
		"publisher":      { type: "company" },
		"release date":   { type: "date" },
		"version":        { type: "version" }
	};

	var allSpans = doc.querySelectorAll("span");
	var processedLabels = {};

	for (var si = 0; si < allSpans.length; si++) {
		var spanText = ZU.trimInternal(allSpans[si].textContent);
		var labelKey = spanText.toLowerCase();
		var mapping = fieldMap[labelKey];
		if (!mapping || processedLabels[labelKey]) continue;
		processedLabels[labelKey] = true;

		// Walk up from <span> to find the row: SPAN → DIV.xeuugli → DIV.x193iq5w → DIV.x78zum5 (row)
		var cell = allSpans[si].parentElement;       // DIV.xeuugli
		if (!cell) continue;
		cell = cell.parentElement;                    // DIV.x193iq5w (label cell)
		if (!cell) continue;
		var row = cell.parentElement;                 // DIV.x78zum5 (row)
		if (!row || row.children.length < 2) continue;

		// The value is in the second child DIV.x193iq5w of the row
		var valueCell = row.children[1];
		if (!valueCell) continue;
		var value = ZU.trimInternal(valueCell.textContent);
		if (!value || value.toLowerCase() === labelKey) continue; // skip if value equals label (row misidentified)

		Z.debug("Meta Store: DOM — " + labelKey + " = " + value);

		switch (mapping.type) {
			case "creator":
				item.creators.push(ZU.cleanAuthor(value, mapping.creatorType, true));
				break;
			case "company":
				item.company = value;
				break;
			case "date":
				item.date = value;
				break;
			case "version":
				item.version = value;
				break;
		}
	}

	// --- JSON‑LD supplement ---
	// Reuse ldGraph from Phase 0.  Build an @id → node lookup, then resolve
	// SoftwareApplication → creator/publisher references to get organization names.
	// Also checks for releaseDate/version as fallback (though these are DOM‑only on current pages).

	if (ldGraph.length) {
		// Build @id → node lookup for resolving references
		var idMap = {};
		for (var gk = 0; gk < ldGraph.length; gk++) {
			var refNode = ldGraph[gk];
			if (refNode["@id"]) {
				idMap[refNode["@id"]] = refNode;
			}
		}

		// Helper: resolve an @id reference or inline object to its name
		var resolveName = function(ref) {
			if (!ref) return null;
			if (ref.name) return ref.name;
			if (ref["@id"]) {
				var resolved = idMap[ref["@id"]];
				return resolved ? resolved.name : null;
			}
			return null;
		};

		// Find the main entity node (SoftwareApplication / VideoGame / Product)
		for (var gl = 0; gl < ldGraph.length; gl++) {
			var appNode = ldGraph[gl];
			var appType = appNode["@type"];
			var types = Array.isArray(appType) ? appType : [appType];
			var isApp = types.indexOf("SoftwareApplication") !== -1
				|| types.indexOf("VideoGame") !== -1;

			if (isApp) {
				// Developer / creator
				if (!item.creators.length) {
					var devName = resolveName(appNode.creator) || resolveName(appNode.author);
					if (devName) {
						item.creators.push(ZU.cleanAuthor(devName, "programmer", true));
						Z.debug("Meta Store: JSON‑LD — creator = " + devName);
					}
				}

				// Publisher
				if (!item.company) {
					var pubName = resolveName(appNode.publisher);
					if (pubName) {
						item.company = pubName;
						Z.debug("Meta Store: JSON‑LD — publisher = " + pubName);
					}
				}

				// Release date (not always present in JSON‑LD; DOM takes priority)
				if (!item.date) {
					var dateVal = appNode.releaseDate || appNode.datePublished;
					if (dateVal) {
						item.date = dateVal;
						Z.debug("Meta Store: JSON‑LD — date = " + dateVal);
					}
				}

				// Version
				if (!item.version) {
					var verVal = appNode.version || appNode.softwareVersion;
					if (verVal) {
						item.version = verVal;
						Z.debug("Meta Store: JSON‑LD — version = " + verVal);
					}
				}

				break; // only one main entity expected
			}
		}
	} else {
		Z.debug("Meta Store: no JSON‑LD found on page");
	}

	item.complete();
}

/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://www.meta.com/experiences/gorilla-tag/4979055762136823/",
		"items": [
			{
				"itemType": "computerProgram",
				"title": "Gorilla Tag",
				"creators": [
					{
						"lastName": "Another Axiom Inc",
						"creatorType": "programmer"
					}
				],
				"date": "December 15, 2022",
				"company": "Another Axiom",
				"version": "1.1.137",
				"libraryCatalog": "Meta Store",
				"url": "https://www.meta.com/experiences/gorilla-tag/4979055762136823/"
			}
		]
	},
	{
		"type": "web",
		"url": "https://www.meta.com/experiences/wall-town-wonders/6103056399797843/",
		"items": [
			{
				"itemType": "computerProgram",
				"title": "Wall Town Wonders",
				"creators": [
					{
						"lastName": "Cyborn BVBA",
						"creatorType": "programmer"
					}
				],
				"date": "November 21, 2024",
				"company": "Cyborn BV",
				"version": "1.10",
				"libraryCatalog": "Meta Store",
				"url": "https://www.meta.com/experiences/wall-town-wonders/6103056399797843/"
			}
		]
	},
	{
		"type": "web",
		"url": "https://www.meta.com/experiences/i-am-cat/6061406827268889/",
		"items": [
			{
				"itemType": "computerProgram",
				"title": "I Am Cat",
				"creators": [
					{
						"lastName": "NEW FOLDER GAMES LTD",
						"creatorType": "programmer"
					}
				],
				"date": "December 5, 2024",
				"version": "1.4.0.0",
				"libraryCatalog": "Meta Store",
				"url": "https://www.meta.com/experiences/i-am-cat/6061406827268889/"
			}
		]
	}
];
/** END TEST CASES **/
