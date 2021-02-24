// import modules
import * as filer from "./modules/filer.js";

try {
    var { ipcRenderer } = window.require('electron');
}
catch (err) {
}

// set service worker
const setSw = () => {
    if (navigator.serviceWorker) {
        navigator.serviceWorker.register("../sw.js")
            .then(function (registration) {
                navigator.serviceWorker.addEventListener("message", event => {
                    //window.location.reload();
                });
            }).catch(function (error) {
                console.log("ServiceWorker registration failed:", error);
            });
    }
}

// deferred prompt variable
let _deferredPrompt;

// installApp function
const installApp = (e) => {
    _deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    _deferredPrompt.userChoice
        .then(choiceResult => {
            if (choiceResult.outcome === 'accepted') {
                document.querySelector('[install]').setAttribute('hidden', '');
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
        });

}

// show the page
document.querySelector(".main-container").removeAttribute("hidden");

// set sw
setSw();

// set filer events
filer.setEvents();


// install event listener
document.querySelector(".install").addEventListener("click", installApp)

// before install prompt
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    console.log('beforeintsallprompt');
    _deferredPrompt = e;
    document.querySelector('.install').removeAttribute('hidden');
});

window.addEventListener('appinstalled', (e) => {
    console.log('appinstallprompt');
    document.querySelector('.install').setAttribute('hidden', '');
});



// listen to data from electron
try {
    ipcRenderer.on("fileinfo", (event, fileinfo) => {
        const _filename = fileinfo.filepath.split(/(\\|\/)/).pop();
        const _buffer = fileinfo.buffer;
        const _file = new File([_buffer], _filename);
        if (!_file) return;

        document.querySelector("[open-button]").innerHTML = "loading ...";
        filer.loadFile(_file, "");
    });
}
catch (err) {
}