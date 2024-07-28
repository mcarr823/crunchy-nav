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

/**
 * Cleans the web page's content feed by removing anything
 * which we're not interested in, or which we can't currently
 * parse or traverse.
 * 
 * This is used to remove anything apart from the actual anime
 * series we want to navigate through.
 * 
 * eg. It removes video game banners, recommendations, and news feeds,
 * leaving behind only the series' cards.
 * 
 * Currently this function removes the offending divs from the DOM.
 * In the future it should be changed to just hide them instead, since
 * the crunchyroll web page throws some (non-critical) errors after
 * they're removed.
 * 
 * @returns The number of items in the field after being cleaned
 */
function cleanDynamicFeed(){

	const children = getErcFeed();

	// The second child div contains the series' cards.
	const dynamicFeed = children[1];

	// The dynamic feed should have several children, each one representing
	// a different category or genre.
	var dynamicFeedChildren = dynamicFeed.children;

	// Traverse the list by index, since node lists aren't actually arrays
	// and don't have the usual array functions.
	for (let i = dynamicFeedChildren.length - 1; i >= 0; i--) {

		// Get the current category and its children
		const category = dynamicFeedChildren[i];
		const categoryChildren = category.children;

		// If it has no children (series cards), remove it
		if (categoryChildren.length != 1){
			category.remove();
			continue;
		}

		const categoryContent = categoryChildren[0];
		const categoryContentChildren = categoryContent.children;

		// If the child is a news item, remove it
		if (categoryContent.className.includes('news-and-editorial')){
			category.remove();
			continue;
		}

		// If the category has != 2 children, remove it.
		// This is because a category should have 2 divs:
		// 1. the title of the category
		// 2. the series cards
		// In the future this should be changed to allow for
		// banner-style series highlights as well.
		if (categoryContentChildren.length != 2){
			category.remove();
			continue;
		}
	}

	// Return the number of categories still remaining after
	// we've removed the ones we don't want.
	return dynamicFeedChildren.length;

}

/**
 * Hides the "hero" banner at the top of the web page.
 * 
 * It's a rotating carousel of series which takes up a lot of space,
 * so hiding it makes the page easier to navigate.
 * 
 * It could be added back in the future, or modified into a new category
 * or something instead of being removed.
 * 
 * But for now, this function hides it altogether, just to keep
 * things simple.
 */
function hideHeroBanner(){

	const children = getErcFeed();

	// The first child is expected to be the "hero" banner, which
	// rotates and shows a bunch of different shows.
	const heroBanner = children[0];

	// If the hero banner matches our expectations (first div, no class name),
	// then let's hide it for the sake of freeing up screen space and simplifying
	// navigation.
	// This could be added back in later.
	const canRemoveHeroBanner = heroBanner.className == '';
	if (canRemoveHeroBanner){
		heroBanner.style.display = 'none';
	}

}

/**
 * Adds an observer to the dynamic content feed.
 * 
 * The crunchyroll web page is an "infinite scrolling" page
 * which dynamically adds more content as you scroll.
 * 
 * In order to cater for this, we add an observer, so we can
 * modify the page whenever new content is added to it.
 */
function initiateFeedObserver(){

	const children = getErcFeed();
	const dynamicFeed = children[1];

	// Only observe the child list.
	// We don't need deep or complex observing behavior.
	const feedObserverConfig = {
		childList: true,
		subtree: false,
		characterData: false
	};

	const feedObserver = new MutationObserver(mutations => {
	  
		const nodesAdded = mutations.some(mutation => mutation.addedNodes.length > 0);
		if (nodesAdded){

			// Whenever new nodes are added, clean the web page again
			// to make the new categories easier to navigate.
			cleanDynamicFeed();

		}

	});

	feedObserver.observe(dynamicFeed, feedObserverConfig);

}
