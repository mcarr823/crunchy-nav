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
function initAppBodyObserver(callback){


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
		callback();
	});

	observer.observe(appContents[0], observerConfig);
	
}

function initPageLoadObserver(callback){

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
        initAppBodyObserver(callback);
    });

    // Finally, start observing the page for the initial load.
    pageLoadObserver.observe(pageLoadTarget, pageLoadObserverConfig);

}