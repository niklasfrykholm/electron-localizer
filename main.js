"use strict";

const electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
var ipc = electron.ipcMain;
var dialog = electron.dialog;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  //if (process.platform != 'darwin') {
    app.quit();
  //}
});

function openFile(window)
{
    dialog.showOpenDialog({filters: [{name: 'Strings', extensions: ['strings']}]},
        (files) => files && files[0] && window.webContents.send('open-file', {file: files[0]})
    );
}

let menuTemplate =
[
    {
        label: 'File',
        submenu: [
            {label: 'New File', accelerator: 'CmdOrCtrl+N'},
            {type: 'separator'},
            {label: 'Open File', accelerator: 'CmdOrCtrl+O', click: (item, window) => openFile(window)},
            {label: 'Save', accelerator: 'CmdOrCtrl+S'},
            {label: 'Save As...', accelerator: 'Shift+CmdOrCtrl+S'},
            {type: 'separator'},
            {label: 'Exit'}
        ]
    },
    {
        label: 'Edit',
        submenu: [
            {label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo'},
            {label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo'},
            {type: 'separator'},
            {label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut'},
            {label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy'},
            {label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste'},
            {label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectall'}
        ]
    },
    {
        label: 'Development',
        submenu: [
            {label: 'Reload', accelerator: 'CmdOrCtrl+R',
                click: function (item, window) {
                    window && window.reload();
                }
            },
            {label: 'Toggle Developer Tools', accelerator: 'Ctrl+Shift+I',
                click: function (item, window) {
                    window && window.toggleDevTools();
                }
            },
        ]
    }

];

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)

  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1000, height: 625});

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});
