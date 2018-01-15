function initModal(){

    // Get the modal/modals
    let modal_background = document.getElementById('modal_background');
    let modal_connection = document.getElementById('modal_connection');
    let modal_shareable_link = document.getElementById('modal_shareable_link');
    // let modal_initial_settings = document.getElementById('modal_initial_settings');

    // Get the button that opens the modal/modals
    // add custom event if u want to fire on specific action
    // let modal_show = document.getElementById("modal_show");

    // Get the element that closes the modal/modals
    let modal_background_hide = document.getElementById("modal_background_hide");
    let modal_connection_hide = document.getElementById("modal_connection_hide");
    let modal_shareable_link_hide = document.getElementById("modal_shareable_link_hide");
    // let modal_initial_settings_hide = document.getElementById('modal_initial_settings_hide');

    // When the user clicks the button, open the modal/modals
    // modal_show.onclick = function() {
    //     modal.style.display = "block";
    // };

    // When the user clicks on <span> (x), close the modal//modals
    modal_background_hide.onclick = function() {
        modal_background.style.display = "none";
    };
    modal_connection_hide.onclick = function() {
        modal_connection.style.display = "none";
    };
    modal_shareable_link_hide.onclick = function() {
        modal_shareable_link.style.display = "none";
    };
    // modal_initial_settings_hide.onclick = function(){
    //     modal_initial_settings.style.display = "none";
    // }

    // When the user clicks anywhere outside of the modal//modals, close it
    window.onclick = function(event) {
        if (event.target === modal_connection) {
            modal_background.style.display = "none";
            modal_connection.style.display = "none";
            modal_shareable_link.style.display = "none";
        }
    }
}