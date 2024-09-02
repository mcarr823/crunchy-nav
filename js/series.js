var selectedButton = -1;

function getActionButtons(){
    const actionButtonsDiv = document.body.getElementsByClassName("action-buttons");
    if (actionButtonsDiv.length == 1){
        return actionButtonsDiv[0].children;
    }else{
        return false;
    }
}

/**
 * Move one button to the left
 * @returns 
 */
function previousButton(e){

    if (selectedButton == 0){
        return;
    }

    const buttons = getActionButtons();
    if (buttons == false){
        return;
    }

    if (selectedButton == -1)
        selectedButton = 1;
    else
        buttons[selectedButton].classList.remove('active');

    selectedButton--;

    buttons[selectedButton].classList.add('active');

    e.preventDefault();

}

function nextButton(e){

    const buttons = getActionButtons();
    if (buttons == false){
        return;
    }

    if (selectedButton == buttons.length - 1){
        return;
    }

    if (selectedButton != -1)
        buttons[selectedButton].classList.remove('active');
    
    selectedButton++;

    buttons[selectedButton].classList.add('active');

    e.preventDefault();

}

function submitButton(e){

    if (selectedButton == -1){
        return;
    }

    // TODO button click
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
			previousButton(e);
		}else if (e.code == "ArrowRight"){
			nextButton(e);
		}else if (e.code == "Enter"){
			submitButton(e);
		}else if (e.code == "Backspace"){
            // TODO history.back instead?
            location.href = "https://www.crunchyroll.com";
        }
	});

}

function init(){

    const actionButtons = getActionButtons();
    if (actionButtons == false){
        console.error("CrunchyNav: Action buttons not found. Aborting");
        return;
    }

    const playButton = document.body.getElementsByClassName("up-next-section-button");
    if (playButton.length != 1){
        console.error("CrunchyNav: Play button not found. Aborting");
        return;
    }

    // Clone the Play button into the actions-buttons div where the other buttons reside.
    const actionButtonsDiv = document.body.getElementsByClassName("action-buttons");
    const newPlayButton = playButton[0].cloneNode(true);
    newPlayButton.removeAttribute('data-t');
    newPlayButton.classList.remove('up-next-section-button');
    newPlayButton.classList.add('up-next-section-button-clone');
    actionButtonsDiv[0].prepend(newPlayButton);

    // Expand the description
    document.querySelector("[data-t=expandable-btn]").click();

    initiateKeypressObserver();
    
}

/**
 * Wait for the "up next" section to load before running the
 * rest of the initialization logic.
 */
function waitForThumbnail(){
    
    const upNext = document.body.getElementsByClassName("up-next-section");

    observeElement(upNext[0], () => {
        init();
    });

}

console.log("Loading extension series.js");

initPageLoadObserver(() => {
    waitForThumbnail();
});
