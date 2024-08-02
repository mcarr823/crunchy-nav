/**
 * The crunchyroll website currently works by dynamically
 * loading content into individual feeds.
 * 
 * This content can generally be broken up into:
 * - anime series categories
 * - rotating banners
 * - single series highlight banners
 * - video game banners
 * - news feeds
 * 
 * 
 * CrunchyNav works by waiting for that content to be
 * dynamically loaded onto the web page by using observers.
 * 
 * Once the content has loaded, it "cleans" the page by
 * removing everything except for the anime series categories.
 * 
 * It then listens for navigation events (arrow keys) and
 * highlights a category/series in response to that.
 * 
 * 
 * Throughout the source code you will find the following terms:
 * 
 * - row/category. These are the categories into which anime series
 * are divided.
 * eg. It could be a genre (such as Shonen) or a trait (Free To Watch)
 * or some other such description.
 * 
 * - column/series. These are the individual cards, each one representing
 * a single series.
 * They display the series title and image.
 * These are the cards which get highlighted during navigation.
 * 
 */


// These two variables are used to keep track of which
// row (category) and which column (series card)
// is currently highlighted.
var selectedRow = -1;
var selectedColumn = -1;

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

/**
 * Highlights the series card at row `newRow` and column `newColumn`.
 * 
 * This function also removes highlighting from whichever card was
 * previously highlighted (where applicable) and overrides the
 * keypress behavior (if navigation was successful).
 * 
 * @param {KeyboardEvent} e Keyboard event which triggered this function
 * @param {Number} newRow The row index of the card to highlight
 * @param {Number} newColumn The column index of the card to highlight
 */
function highlightCard(e, newRow, newColumn){

	// Start by retrieving the currently highlighted card.
	// If one IS highlighted, remove its styling.
	const oldCard = getColumn(selectedRow, selectedColumn);
	if (oldCard){
		oldCard.style.border = '';
	}

	// Then get the new card which we now want to highlight instead.
	const newCard = getColumn(newRow, newColumn);
	if (newCard){

		// Give the card a white botder and scroll the web page
		// so that the card is visible.
		newCard.style.border = '1px solid white';
		newCard.scrollIntoView();

		// Set the selected row and column to either be
		// the new value passed into this function, OR
		// to be 0.
		// This is because the default values are -1.
		if (newRow < 0)
			selectedRow = 0;
		else
			selectedRow = newRow;
		
		if (newColumn < 0)
			selectedColumn = 0;
		else
			selectedColumn = newColumn;

		// Finally, prevent the keypress behavior from being handled
		// by the web page, since we already did something (highlighted
		// a card) in response to the event.
		// Note that if we DIDN'T highlight a card, then we don't want to
		// consume the event.
		// eg. If the user is already on the first category, and they press
		// the up arrow, then we want the page to scroll up, since there's no
		// previous category we can navigate to anyway.
		e.preventDefault();
	}

}

/**
 * Retrieve all rows (categories) currently visible on the web page.
 * 
 * @returns All rows (categories) on the web page, or false if
 * none are visible.
 */
function getRows(){

	const children = getErcFeed();
	const dynamicFeed = children[1];
	const rows = dynamicFeed.children;

	if (rows.length == 0){
		return false;
	}else{
		return rows;
	}

}

/**
 * Retrieve a single row (category) from the web page at the
 * given index.
 * 
 * @param {Number} rowIndex The index of the row (category) we want
 * to grab.
 * @returns The row at `rowIndex`, OR the row at [0] if the index
 * hasn't been set yet, OR false if the row index is otherwise invalid.
 */
function getRow(rowIndex){

	const rows = getRows();

	// If there are no rows, or the requested row is too high,
	// return false.
	if (rows == false || rowIndex > rows.length - 1){
		return false;
	}
	
	// If the row is -1 (unset), return the first row instead.
	if (rowIndex == -1){
		return rows[0];
	}

	// Otherwise, return the requested row.
	return rows[rowIndex];

}

/**
 * Retrieve all of the columns (series cards) for the given
 * row (category).
 * 
 * @param {Number} rowIndex Index of the row (category) for which to
 * grab the columns (series cards).
 * @returns Columns for the requested row, or false.
 */
function getColumns(rowIndex){

	const row = getRow(rowIndex);

	// If the row doesn't exist, return false
	if (row == false){
		return false;
	}

	const cards = row.querySelectorAll('[data-t="carousel-card-wrapper"]');

	// If there aren't any columns in the given row, return false
	if (cards.length == 0){
		return false;
	}
	
	// Otherwise, return the retrieved columns
	return cards;

}

/**
 * Retrieve a single column (series card) by the row (category)
 * and column index.
 * 
 * @param {Number} rowIndex Index of the row (category) from which to
 * retrieve a column (series card).
 * @param {Number} columnIndex Index of the column (series card) to
 * retrieve.
 * @returns The requested column, OR column [0] if the index isn't set,
 * OR false if it is otherwise invalid.
 */
function getColumn(rowIndex, columnIndex){

	const columns = getColumns(rowIndex);

	// If the columns (series cards) can't be retrieved, or the index
	// is too high, return false.
	if (columns == false || columnIndex > columns.length - 1){
		return false;
	}

	// If the column index is -1 (unset), return the first result.
	if (columnIndex == -1){
		return columns[0];
	}

	// Otherwise, return the result
	return columns[columnIndex];

}

/**
 * Move up to the previous row (category) on the web page.
 * 
 * @param {KeyboardEvent} e Keyboard event which triggered this function
 */
function previousRow(e){

	// If we're already on the first row (category), abort.
	// Let the web page handle the keyboard event by scrolling up,
	// if applicable.
	if (selectedRow == 0){
		return;
	}

	// If the current row is -1 (unset), default to 0.
	// Otherwise, subtract 1 to go to the previous row.
	let newRow;
	if (selectedRow == -1){
		newRow = 0;
	}else{
		newRow = selectedRow - 1;
	}

	// Try to retrieve the given row. Abort if that fails
	const row = getRow(newRow);
	if (row == false){
		return;
	}

	// Highlight the first card in the row
	highlightCard(e, newRow, 0);

}

/**
 * Move down to the next row (category) on the web page.
 * 
 * @param {KeyboardEvent} e Keyboard event which triggered this function
 */
function nextRow(e){

	// Increase the row by 1 to go to the next row.
	// -1 (unset) changes to 0 anyway when incremented,
	// so we don't need to handle that, unlike when going
	// to the previous row.
	// Going out of bounds (> max row length) is handled
	// in getRow, so we don't need to handle that either.
	const newRow = selectedRow + 1;

	// Try to retrieve the given row. Abort if that fails
	const row = getRow(newRow);
	if (row == false){
		return;
	}

	// Highlight the first card in the row
	highlightCard(e, newRow, 0);

}

/**
 * Move left to the previous column (series card) on the web page.
 * 
 * @param {KeyboardEvent} e Keyboard event which triggered this function
 */
function previousColumn(e){

	// If we have already selected the first column, don't do anything.
	// Let the web page handle the left arrow key event by scrolling
	// instead, if applicable.
	if (selectedColumn == 0){
		return;
	}

	// If the current column is -1 (unset), default to 0.
	// Otherwise, subtract 1 to go to the previous column.
	let newColumn;
	if (selectedColumn == -1){
		newColumn = 0;
	}else {
		newColumn = selectedColumn - 1;
	}

	// Try to retrieve the given column. Abort if that fails
	const column = getColumn(selectedRow, newColumn);
	if (column == false){
		return;
	}

	// Highlight the card
	highlightCard(e, selectedRow, newColumn);

}

/**
 * Move right to the next column (series card) on the web page.
 * 
 * @param {KeyboardEvent} e Keyboard event which triggered this function
 */
function nextColumn(e){

	// Increase the column by 1 to go to the next column.
	// -1 (unset) changes to 0 anyway when incremented,
	// so we don't need to handle that, unlike when going
	// to the previous column.
	// Going out of bounds (> max column length) is handled
	// in getColumn, so we don't need to handle that either.
	const newColumn = selectedColumn + 1;

	// Try to retrieve the given column. Abort if that fails
	const column = getColumn(selectedRow, newColumn);
	if (column == false){
		return;
	}

	// Highlight the card
	highlightCard(e, selectedRow, newColumn);

}

/**
 * Add a DOM event listener to trigger events on keypress.
 * 
 * This function is responsible for performing actions based
 * on which key the user presses.
 */
function initiateKeypressObserver(){

	document.addEventListener("keydown", e => {
		if (e.code == "ArrowLeft"){
			previousColumn(e);
		}else if (e.code == "ArrowRight"){
			nextColumn(e);
		}else if (e.code == "ArrowUp"){
			previousRow(e);
		}else if (e.code == "ArrowDown"){
			nextRow(e);
		}else if (e.code == "Enter"){
			console.log('Select show');
			// TODO implement this
		}else if (e.code == "Escape"){
			console.log('Back');
			// TODO implement this
		}
	});

}

/**
 * Initializes CrunchyNav by performing all of the expected
 * initial events in order.
 * 
 * This function should be called once the web page has
 * fully loaded.
 */
function init() {

	console.log("Init");

	// Grab the feed for the first time.
	// If it fails, abort.
	//
	// Note that this is the only time we actually check
	// for a value of false from this function.
	// That is because we don't progress any further if it
	// returns false. And if it isn't false during init,
	// then it shouldn't be false at any point afterwards.
	//
	// Also note that the console.error statements run within
	// getErcFeed instead of here.
	// That's because there's more than one reason why the function
	// might return false.
	const initialFeed = getErcFeed();
	if (initialFeed == false){
		return;
	}

	// Clean the feed for the first time.
	// The feed might not actually exist yet, since the web page
	// loads in a staggered manner.
	// But we re-clean the page whenever new content is loaded by using
	// an observer anyway, so there's no harm in running it here as well,
	// just in case the feed loaded before the observer.
	cleanDynamicFeed();

	// Hide the banner
	hideHeroBanner();

	// Initialize the dynamic feed observer and the keypress observer
	initiateFeedObserver();
	initiateKeypressObserver();

}

/**
 * Adds an observer to the 'app' body.
 * 
 * The crunchyroll web page loads in a staggered fashion.
 *
 * It starts with an empty "content" div, which it loads content
 * into (pageLoadObserver handles this).
 * Once that loads it then requests data to populate the "app-body-wrapper".
 * 
 * This function observes the latter, waiting for it to get content.
 *
 * For more information on the observer config and mutator, check the
 * pageLoadTarget/Observer instead, since it works the same way.
 */
function initAppBodyObserver(){

	const appContents = document.body.getElementsByClassName("app-body-wrapper");

	// This should always exist... unless the website has changed
	// in some way.
	// But let's check for it anyway.
	if (appContents.length == 0){
		console.error("CrunchyNav: App body not found. Aborting");
		return false;
	}

	const observerConfig = {
		childList: true,
		subtree: false,
		characterData: false
	};

	const observer = new MutationObserver(() => {
		observer.disconnect();
		init();
	});

	observer.observe(appContents[0], observerConfig);
	
}

console.log("Loading extension");


// Below this point is the code for actually starting the
// extension and kicking things off.

// First is the target.
// The target is the "content" div, which initially just shows
// a loading dialog.
// Its content will change once the page fully loads, so this
// is the element we want to observe to determine whether the
// page has loaded yet or not.
const pageLoadTarget = document.getElementById("content");

// Second is the observer config.
// We set it to only listen for changes to immediate children,
// since that's as deep as we need to go in order to determine
// whether the page has loaded or not.
const pageLoadObserverConfig = {
	childList: true,
	subtree: false,
	characterData: false
};

// Third is the observer itself.
// As soon as the content div changes, the observer runs
// initAppBodyObserver() in order to create a new observer
// for the loaded content.
// This is because of the staggered manner in which the
// crunchyroll web page loads.
const pageLoadObserver = new MutationObserver(() => {
	pageLoadObserver.disconnect();
  	initAppBodyObserver();
});

// Finally, start observing the page for the initial load.
pageLoadObserver.observe(pageLoadTarget, pageLoadObserverConfig);
