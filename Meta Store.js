{
	"translatorID": "c8da160e-9c26-44e8-b93f-227ce88ec51d",
	"label": "Meta Store",
	"creator": "Chengkai Xu",
	"target": "^https://www\\.meta\\.com/experiences/",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2025-03-28 18:00:00"
}

/*
	This translator extracts metadata from Meta Store experience pages for VR/AR/XR games/software.
	It gathers:
	  - A trimmed title (e.g. "Gorilla Tag on Meta Quest | Quest VR Games | Meta Store" becomes "Gorilla Tag"),
	  - Description and URL from meta tags,
	  - Developer, Publisher, Release Date, and Version via dynamic extraction by searching for an "Additional details" section.
	    In that section, the details are grouped into containers where the first row contains the label and the second row the value.
	    (Developer is added as a Zotero creator of type "programmer" and Publisher is saved as the Company.)
	  - And uses JSON‑LD as a fallback for missing values.
*/

function detectWeb(doc, url) {
	if (url.match(/^https:\/\/www\.meta\.com\/experiences\//)) {
		return "computerProgram";
	}
	return false;
}

function doWeb(doc, url) {
	scrape(doc, url);
}

function scrape(doc, url) {
	// --- Title Extraction ---
	var metaTitleTag = doc.querySelector('meta[property="og:title"]');
	var rawTitle = metaTitleTag ? metaTitleTag.getAttribute("content") : "";
	var title = rawTitle;
	// Trim title: remove suffix after " on " or " | "
	if (title.indexOf(" on ") > -1) {
		title = title.split(" on ")[0].trim();
	} else if (title.indexOf(" | ") > -1) {
		title = title.split(" | ")[0].trim();
	}

	// --- Description ---
	var metaDescTag = doc.querySelector('meta[name="description"]');
	var description = metaDescTag ? metaDescTag.getAttribute("content") : "";

	// --- Create Item ---
	var item = new Z.Item("computerProgram");
	item.title = title;
	Zotero.debug("Title: " + title);
	item.abstractNote = description;
	item.url = url;
	item.libraryCatalog = "Meta Store";

	// --- Title Extraction ---
	var metaTitleTag = doc.querySelector('meta[property="og:title"]') || doc.querySelector('meta[name="og:title"]');
	var rawTitle = "";
	if (metaTitleTag) {
		rawTitle = metaTitleTag.getAttribute("content");
	}
	// Fallback: use document.title if rawTitle is empty
	if (!rawTitle) {
		rawTitle = doc.title || "";
	}
	// Fallback: try JSON‑LD if still empty
	if (!rawTitle) {
		var ldJson = doc.querySelector('script[type="application/ld+json"]');
		if (ldJson) {
			try {
				var ldData = JSON.parse(ldJson.textContent);
				if (ldData.name) {
					rawTitle = ldData.name;
				}
			} catch(e) {
				// JSON parse error; do nothing
			}
		}
	}

	var title = rawTitle;
	// Trim title: remove suffix after " on " or " | " if present
	if (title.indexOf(" on ") > -1) {
		title = title.split(" on ")[0].trim();
	} else if (title.indexOf(" | ") > -1) {
		title = title.split(" | ")[0].trim();
	}

	// Set the title in the item
	item.title = title;


	// --- Additional details extraction ---
	// First, try to locate the header with text "Additional details"
	var detailsHeader = ZU.xpath(doc, "//div[contains(text(), 'Additional details')]");
	if (detailsHeader.length) {
		// Assume the container immediately following the header holds the details
		var detailsContainer = detailsHeader[0].nextElementSibling;
		if (detailsContainer) {
			// The details are grouped into containers (each group has two rows: label then value)
			// We select each group by a common class pattern (here we assume the outer groups have class "x78zum5")
			var detailGroups = detailsContainer.querySelectorAll("div.x78zum5");
			for (let group of detailGroups) {
				// Within each group, get the first and last child that contain the label and value respectively
				let labelElem = group.querySelector("div.x193iq5w:first-child span");
				let valueElem = group.querySelector("div.x193iq5w:last-child span");
				if (!labelElem || !valueElem) continue;
				let label = labelElem.textContent.trim().toLowerCase();
				let value = valueElem.textContent.trim();
				// Process based on label
				if (label === "developer") {
					item.creators.push(ZU.cleanAuthor(value, "programmer", true));
				} else if (label.indexOf("publisher") !== -1) {
					item.company = value;
				} else if (label.indexOf("release date") !== -1) {
					item.date = value;
				} else if (label.indexOf("version") !== -1) {
					item.version = value;
				}
			}
		}
	} else {
		// --- Fallback: JSON‑LD ---
		var ldJson = doc.querySelector('script[type="application/ld+json"]');
		if (ldJson) {
			try {
				var ldData = JSON.parse(ldJson.textContent);
				if (ldData.creator && ldData.creator.name) {
					item.creators.push(ZU.cleanAuthor(ldData.creator.name, "programmer", true));
				}
				if (ldData.publisher && ldData.publisher.name) {
					item.company = ldData.publisher.name;
				}
				if (ldData.releaseDate) {
					item.date = ldData.releaseDate;
				}
				if (ldData.version) {
					item.version = ldData.version;
				}
			} catch(e) {
				// JSON parse error; do nothing
			}
		}
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
						"lastName": "Example Developer Name",
						"creatorType": "programmer"
					}
				],
				"date": "Example Release Date",
				"abstractNote": "Run, jump, and climb using only your hands. Play with friends in a virtual gorilla world …",
				"company": "Example Publisher Name",
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
						"lastName": "Example Developer Name",
						"creatorType": "programmer"
					}
				],
				"date": "Example Release Date",
				"abstractNote": "Wall town wonders is a Mixed reality cozy life sim city builder …",
				"company": "Example Publisher Name",
				"libraryCatalog": "Meta Store",
				"url": "https://www.meta.com/experiences/wall-town-wonders/6103056399797843/"
			}
		]
	}
];
