// import modules
import * as filer from "./modules/filer.js";

try {
    var {ipcRenderer} = window.require('electron');
}
catch (err) {
    console.log("not in electron environment 1", err);
}

// show the page
document.querySelector(".main-container").removeAttribute("hidden");

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
    console.log("not in electron environment 2", err);
}