// import modules
import * as filer from "./modules/filer.js";

try {
    var {ipcRenderer} = window.require('electron');
}
catch (err) {
}

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


// show the page
document.querySelector(".main-container").removeAttribute("hidden");

// set sw
setSw();

// set filer events
filer.setEvents();

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