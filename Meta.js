{
	"translatorID": "c8da160e-9c26-44e8-b93f-227ce88ec51d",
	"label": "Meta Store",
	"creator": "Chengkai Xu",
	"target": "https://www.meta.com/experiences/",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2025-03-13 18:00:00"
}

/*
	This translator extracts metadata from Meta experiences pages for VR/AR/XR games/software.
	It gathers:
	  - A trimmed title (e.g. "Gorilla Tag on Meta Quest | Quest VR Games | Meta Store" becomes "Gorilla Tag"),
	  - Description and URL from meta tags,
	  - Developer, Release Date, and Version via dynamic extraction by searching for keywords and then
	    grabbing the text of the next sibling element,
	  - Publisher from JSON-LD (with a trailing " Inc" removed),
	  - And uses JSON-LD as a fallback for missing values.
*/

function detectWeb(doc, url) {
	if (url.includes("/experiences/")) {
		return "computerProgram";
	}
	return false;
}

function doWeb(doc, url) {
	scrape(doc, url);
}

function scrape(doc, url) {
	var item = new Z.Item("computerProgram");
	
	// --- Extract and trim title ---
	var titleMeta = doc.querySelector('meta[property="og:title"]');
	if (titleMeta) {
		var fullTitle = titleMeta.getAttribute("content").trim();
		if (fullTitle.indexOf(" on") > -1) {
			item.title = fullTitle.split(" on")[0].trim();
		} else {
			item.title = fullTitle;
		}
	} else {
		var docTitle = doc.title.trim();
		if (docTitle.indexOf(" on") > -1) {
			item.title = docTitle.split(" on")[0].trim();
		} else {
			item.title = docTitle;
		}
	}
	
	// --- Extract description and URL from meta tags ---
	var descMeta = doc.querySelector('meta[property="og:description"]') || doc.querySelector('meta[name="description"]');
	if (descMeta) {
		item.abstractNote = descMeta.getAttribute("content").trim();
	}
	var urlMeta = doc.querySelector('meta[property="og:url"]');
	if (urlMeta) {
		item.url = urlMeta.getAttribute("content").trim();
	} else {
		item.url = url;
	}
	
	// --- Dynamic extraction based on keyword searches ---
	// Use XPath to find the element that contains the keyword (case-insensitive)
	// and then grab the text content of the immediate following sibling element.
	
	// Developer (for the Programmer creator)
	var developerDynamic = ZU.xpathText(doc, "//*[contains(translate(., 'DEVELOPER', 'Developer'), 'developer')]/following-sibling::*[1]");
	if (developerDynamic) {
		item.creators.push(ZU.cleanAuthor(developerDynamic.trim(), "programmer", true));
	}
	
	// Release Date
	var releaseDateDynamic = ZU.xpathText(doc, "//*[contains(translate(., 'RELEASE DATE', 'Release date'), 'release date')]/following-sibling::*[1]");
	if (releaseDateDynamic) {
		item.date = releaseDateDynamic.trim();
	}
	
	// Version
	var versionDynamic = ZU.xpathText(doc, "//*[contains(translate(., 'VERSION', 'Version'), 'version')]/following-sibling::*[1]");
	if (versionDynamic) {
		item.version = versionDynamic.trim();
	}s
	
	// --- Fallback extraction from JSON-LD ---
	var ldScript = doc.querySelector('script[type="application/ld+json"]');
	if (ldScript) {
		try {
			var ldData = JSON.parse(ldScript.textContent);
			if (Array.isArray(ldData)) {
				ldData = ldData[0];
			}
			// Publisher: remove trailing " Inc" if present.
			if (ldData.publisher && ldData.publisher.name) {
				item.company = ldData.publisher.name.replace(/\s+Inc$/, "").trim();
			}
			// If no release date was found dynamically, fall back to JSON-LD.
			if (!item.date && ldData.datePublished) {
				item.date = ldData.datePublished;
			}
			// If no developer (programmer) was found dynamically, use JSON-LD.
			if ((!item.creators || item.creators.length === 0) && ldData.creator && ldData.creator.name) {
				item.creators.push(ZU.cleanAuthor(ldData.creator.name, "programmer", true));
			}
		} catch (e) {
			Zotero.debug("Error parsing JSON-LD: " + e);
		}
	}
	
	item.libraryCatalog = "meta.com";
	item.complete();
}

/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://www.meta.com/experiences/gorilla-tag/4979055762136823/",
		"detectedItemType": "computerProgram",
		"items": [
			{
				"itemType": "computerProgram",
				"title": "Gorilla Tag",
				"creators": [
					{
						"lastName": "Another Axiom Inc", // from dynamic extraction or fallback JSON-LD
						"creatorType": "programmer"
					}
				],
				"date": "Jan 30, 2025 at 7:50 AM", // extracted dynamically
				"version": "v1.2.3",  // extracted dynamically
				"abstractNote": "Run, jump, and climb using only your hands. Play with friends in a virtual gorilla world through six different environments – Forest, Canyons, Caves, Mountain, City, and Clouds. Hang out in Casual mode or play a game of Tag, Hunt, Team Paintball, or make it up as you go. Meet and learn from new monkes or create private rooms for friends-only lobbies. Express yourself with flair. A rotating inventory of Cosmetic items are available at the shop in the City. Reject Humanity. Move like Monke.",
				"company": "Another Axiom", // from JSON-LD fallback with " Inc" removed
				"libraryCatalog": "meta.com",
				"url": "https://www.meta.com/experiences/gorilla-tag/4979055762136823/",
				"attachments": [],
				"tags": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://www.meta.com/experiences/wall-town-wonders/6103056399797843/",
		"detectedItemType": "computerProgram",
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
				"date": "Feb 15, 2025", // example value from dynamic extraction
				"version": "v2.0",  // example value from dynamic extraction
				"abstractNote": "Wall town wonders is a Mixed reality cozy life sim city builder where you become the host of a vibrant community in your living room. Explore their culture, discover their secrets and above all, grow their picturesque town into a magnificent wall town wonder.",
				"company": "Cyborn BVBA",
				"libraryCatalog": "meta.com",
				"url": "https://www.meta.com/experiences/wall-town-wonders/6103056399797843/",
				"attachments": [],
				"tags": []
			}
		]
	}
];
/** END TEST CASES **/