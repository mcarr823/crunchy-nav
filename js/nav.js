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
 * Cleans the web page's content feed by hiding anything
 * which we're not interested in, or which we can't currently
 * parse or traverse.
 * 
 * This is used to hide anything apart from the actual anime
 * series we want to navigate through.
 * 
 * eg. It hides video game banners, recommendations, and news feeds,
 * leaving behind only the series' cards.
 * 
 * This function hides the offending divs instead of removing them.
 * This is because the crunchyroll web page throws some errors if
 * they're removed.
 * They aren't critical errors, but they do slow the web page down,
 * especially when new content is being loaded. So it's better to
 * hide the divs instead of removing them altogether.
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
	for (let i = 0; i < dynamicFeedChildren.length - 1; i++) {

		// Get the current category and its children
		const category = dynamicFeedChildren[i];
		const categoryChildren = category.children;

		// If it has no children (series cards), hide it
		if (categoryChildren.length != 1){
			category.style.display = 'none';
			continue;
		}

		const categoryContent = categoryChildren[0];
		const categoryContentChildren = categoryContent.children;

		// If the child is a news item, hide it
		if (categoryContent.className.includes('news-and-editorial')){
			category.style.display = 'none';
			continue;
		}

		// If the category has != 2 children, hide it.
		// This is because a category should have 2 divs:
		// 1. the title of the category
		// 2. the series cards
		// In the future this should be changed to allow for
		// banner-style series highlights as well.
		if (categoryContentChildren.length != 2){
			category.style.display = 'none';
			continue;
		}
	}

}

/**
 * Retrieves the content of the dynamic series feed div.
 *
 * It only returns visible results. ie. Those not hidden by
 * the cleanDynamicFeed() function.
 *
 * @returns All visible divs inside of the dynamic feed section
 */
function getDynamicFeed(){

	const children = getErcFeed();

	// The second child div contains the series' cards.
	const dynamicFeed = children[1];

	// The dynamic feed should have several children, each one representing
	// a different category or genre.
	var dynamicFeedChildren = dynamicFeed.children;

	var returnData = [];

	// Traverse the list by index, since node lists aren't actually arrays
	// and don't have the usual array functions.
	for (let i = 0; i < dynamicFeedChildren.length - 1; i++) {

		// Get the current category and its children
		const category = dynamicFeedChildren[i];

		// If the category isn't hidden, add it to the return data
		if (category.style.display != 'none'){
			returnData.push(category);
		}
	}

	// Return all of the non-hidden items
	return returnData;

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

	const rows = getDynamicFeed();

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
			selectSeries(e);
		}
	});

}

/**
 * Loads the selected series, if one is actually highlighted.
 *
 * Grabs the anchor link associated with a given series card
 * and navigates to that page, which should be the series page
 * containing a description of the series, buttons to add it
 * to your watchlist or play it, and so on.
 */
function selectSeries(e){

	// Grab the highlighted series card
	const series = getColumn(selectedRow, selectedColumn);

	if (series){

		// Grab any anchor links within that card
		const anchors = series.getElementsByTagName('a');
		if (anchors.length > 0){

			// The first anchor link should be the series link.
			// eg. https://www.crunchyroll.com/series/[seriesName]
			// Navigate to that page
			const anchor = anchors[0];
			location.href = anchor.href;
			return;

		}
		
	}

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

console.log("Loading extension nav.js");

initPageLoadObserver(() => {
	init();
});
