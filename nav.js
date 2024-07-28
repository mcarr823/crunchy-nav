/**
 * Attempts to retrieve the 3 main content nodes from the web page.
 * 
 * [0] is the "hero" banner, used to rotate between a few different
 * series and highlight what's popular.
 * 
 * [1] is the main content div which contains all of the series and
 * categories.
 * 
 * [2] is a div containing the web page's "loading" message.
 * 
 * The results of this function are queried several times in several
 * places instead of being cached and reused.
 * This is intentional because the web page is dynamic and its layout
 * changes whenever you scroll to the end of the page.
 * 
 * @returns 3 child nodes if successful. False if unsuccessful.
 */
function getErcFeed(){

	// Try to get the main content div.
	// If it doesn't exist, then the page might not be fully loaded
	// yet, or there might be some other problem displaying the page.
	const feedElements = document.body.getElementsByClassName("erc-feed");
	if (feedElements.length == 0){
		console.error("CrunchyNav: ERC Feed not found. Aborting");
		return false;
	}

	const feed = feedElements[0];
	const children = feed.children;

	// Expected to have exactly 3 children.
	// If it doesn't, the site format has changed, so we should
	// assume this extension is no longer compatible and abort.
	if (children.length != 3){
		console.error("CrunchyNav: Website format has changed. Aborting");
		return false;
	}

	// The second child is expected to be the actual feed of different
	// series and categories.
	const secondChild = children[1];

	// Let's do a basic check to confirm the name of the div.
	// If it's changed, then we might be looking at the wrong div,
	// or the page layout might have changed.
	const isDynamicFeed = secondChild.className.includes('dynamic-feed-wrapper');
	if (!isDynamicFeed){
		console.error("CrunchyNav: Failed to find series feed. Aborting");
		return false;
	}

	// If those checks have passed, then we can probably parse the page.
	// Return those nodes so the other functions can handle them.
	return children;

}
