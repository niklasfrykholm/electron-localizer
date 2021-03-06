"use strict";

const fs = require('fs');
const path = require('path');
const ipc = require('electron').ipcRenderer;
const sjson = require('./js/sjson');

window.data = window.data || {
    keys: ["file", "edit", "view", "selection", "find", "packages", "help"],
    notes: ["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
    translations: {
        en: ["File", "Edit", "View", "Selection", "Find", "Packages", "Help"],
        fr:  ["Arkiv", "Redigera", "Visa", "Markering", "Sök", "Paket", "Hjälp"],
    },
    statuses: [],
};

window.state = window.state || {
    yOffset: 35,
    rowHeight: 25,
    columnXs: [10, 210, 410, 610, 810],
    columnWidths: [200, 200, 200, 200, null],
    translateTo: "fr",
    index: []
}

// Applies the `style` object to the DOM `element`. Special keys:
// - `text`: Create a text node inside with value text.
// - `html`: Use value as innerHTML for node.
// - `attributes`: Apply supplied table as node attributes.
function applyStyle(e, style)
{
    for (let k in style) {
        const v = style[k];
        if (k == "text")        e.appendChild(document.createTextNode(v));
        else if (k == "html")   e.innerHTML = v;
        else if (k == "className") e.className = v;
        else if (k == "attributes") {for (let a in v) e[a] = v[a];}
        else                    e.style[k] = v;
    }
}

// Create a DOM element with style(s) from arguments.
function e(tag, styles) // styles...
{
    const e = document.createElement(tag);
    for (let i = 1; i < arguments.length; i++) {
        let style = arguments[i];
        applyStyle(e, style);
    }
    return e;
}

function finishEdit()
{
    let state = window.state;
    let data = window.data;
    const body = document.getElementsByTagName("body")[0];
    let col = state.selection.col
    let row = state.selection.row
    const value = state.edit.value;

    if (value != '' || row < state.index.length) {
        while (row >= state.index.length) {
            let i = state.index.length;
            let y = state.yOffset + i * state.rowHeight;
            let col = state.columnXs;
            let idx = data.keys.length;
            state.index[i] = idx;
            data.keys[idx] = "new key";

            state.grid[i] = [];
            body.appendChild( e("div", {className: "row", left: col[0] + "px", top: y + "px"}) );

            state.grid[i][0] = body.appendChild( e("p", {text: data.keys[idx], className: "item", left: col[0] + "px", top: y + "px"}) );
            state.grid[i][1] = body.appendChild( e("p", {className: "item", left: col[1] + "px", top: y + "px"}) );
            state.grid[i][2] = body.appendChild( e("p", {className: "item", left: col[2] + "px", top: y + "px"}) );
            state.grid[i][3] = body.appendChild( e("p", {className: "item", left: col[3] + "px", top: y + "px"}) );
            state.grid[i][4] = body.appendChild( e("p", {className: "item", left: col[4] + "px", top: y + "px"}) );
        }

        var colData = [data.keys, data.notes, data.translations.en, data.translations[state.translateTo], data.statuses];
        const text = colData[col][state.index[row]] || "";
        if (value != text) {
            colData[col][state.index[row]] = value;
            let e = state.grid[row][col];
            if (e.firstChild) e.removeChild(e.firstChild);
            e.appendChild(document.createTextNode(value));
        }
    }

    state.edit.onblur = null;
    body.removeChild(state.edit);
    state.edit = null;
    state.selection = null;
}

function edit(col, row)
{
    let data = window.data
    let state = window.state;
    if (state.edit)
        finishEdit();

    if (col < 0) col = 0;
    if (row < 0) row = 0;
    if (col > 3) col = 3;
    if (row > state.index.length) row = state.index.length;
    if (row == state.index.length)
        col = 0;

    state.selection = {col: col, row: row};
    const x = state.columnXs[col] - 7;
    const y = state.yOffset + state.rowHeight * row;
    let width = state.columnWidths[col] - 8;
    let height = state.rowHeight - 5;
    var colData = [data.keys, data.notes, data.translations.en, data.translations[state.translateTo], data.statuses];
    const text = colData[col][state.index[row]] || "";
    const lineBreaks = text.split("\n").length - 1;
    if (lineBreaks > 0 || text.length * 10 > width) {
        width = width * 2;
        height = state.rowHeight * (lineBreaks + text.length * 10 / width);
    }

    state.edit = e("textarea", {attributes: {value: text},
        position: "absolute", "left": x + "px", "top": y + "px",
        width: width + "px", height: height + "px", marginTop: "-2px",
        paddingLeft: "5px"});
    const body = document.getElementsByTagName("body")[0];
    body.appendChild(state.edit);
    state.edit.setSelectionRange(0, state.edit.value.length);
    state.edit.focus();
    state.edit.onblur = finishEdit;
    state.edit.onkeydown = (e) => {
        if (e.keyCode == 9) {
            if (e.shiftKey)
                col > 0 ? edit(col-1, row) : edit(3, row-1)
            else
                col < 3 ? edit(col+1, row) : edit(0, row+1);
        }
        else if (e.keyCode == 13 && !e.altKey) {
            edit(col, e.shiftKey ? row-1 : row+1);
        }
        else if (e.keyCode == 13) {
            const h = parseInt(state.edit.style.height);
            state.edit.style.height = (h + state.rowHeight) + "px";
            return;
        }
        else if (e.keyCode == 39) {
            edit(col+1, row);
        }
        else if (e.keyCode == 37) {
            edit(col-1, row);
        }
        else if (e.keyCode == 40) {
            edit(col, row+1);
        }
        else if (e.keyCode == 38) {
            edit(col, row-1);
        }
        else
            return;
        e.preventDefault();
    };
    state.edit.onmousedown = (e) => {
        console.log("edit mouse down");
        return;
    };
}

function render()
{
    const body = document.getElementsByTagName("body")[0];
    while (body.lastChild) body.removeChild(body.lastChild);

    let data = window.data;
    let state = window.state;

    // Sort keys alphabetically
    let index = state.index;
    for (let i=0; i<data.keys.length; ++i)
        index[i] = i;
    index.sort( (a,b) => data.keys[a] > data.keys[b] ? 1 : data.keys[a] < data.keys[b] ? -1 : 0 );

    var colHeaders = ["Code", "Note", "English (en)", state.translateTo, "Status"];
    var colData = [data.keys, data.notes, data.translations.en, data.translations[state.translateTo] || [], data.statuses];

    let col = state.columnXs;
    let width = state.columnWidths;
    const rowHeight = state.rowHeight;
    for (let i=0; i<colHeaders.length; ++i)
    {
        let y = 10;
        body.appendChild( e("p", {text: colHeaders[i], className: "header", left: col[i] + "px", top: y + "px"}) );
        body.appendChild( e("div", {className: "column", left: col[i] + "px", top: y + "px"}) );
    }

    let y = state.yOffset;
    state.grid = []
    for (let i = 0; i < index.length; ++i) {
        state.grid[i] = []
        let idx = index[i]
        body.appendChild( e("div", {className: "row", left: col[0] + "px", top: y + "px"}) );

        for (let c = 0; c < colData.length; ++c) {
            state.grid[i][c] = body.appendChild( e("p", {text: colData[c][idx] || "", className: "item",
                left: col[c] + "px", top: y + "px", width: width[c]-10 + "px"}) );
        }
        y = y + rowHeight;
    }
    body.appendChild( e("div", {className: "row", left: col[0] + "px", top: y + "px"}) );

    document.onmousedown = (e) => {
        let row = Math.floor((e.clientY - state.yOffset) / state.rowHeight);
        let col = 0;
        for (let i=0; i<4; ++i) {
            if (e.clientX > state.columnXs[i])
                col = i;
        }
        if (!state.selection || state.selection.col != col || state.selection.row != row) {
            edit(col, row);
            e.preventDefault();
        }
    };

    edit(0,0);
}

function openFile(file)
{
    let data = window.data;
    data.keys = [];
    data.notes = [];
    data.translations = {en: []};
    data.statuses = [];

    var buffer = fs.readFileSync(file);
    const obj = sjson.parse(buffer);
    for (let key of Object.keys(obj)) {
        data.keys.push(key);
        data.translations.en.push(obj[key]);
    }

    let base = path.basename(file, ".strings");
    let languages = ['br-pt', 'de', 'es', 'fr', 'pl', 'ru', 'tr'];

    for (let i=0; i<languages.length; ++i) {
        let lang = languages[i];
        let langFile = path.join(path.dirname(file), base + "." + lang + ".strings");
        if (!fs.existsSync(langFile)) continue;

        var buffer = fs.readFileSync(langFile);
        data.translations[lang] = []
        const obj = sjson.parse(buffer);
        for (let key of Object.keys(obj)) {
            data.translations[lang].push(obj[key]);
        }
    }

    render();
}

ipc.on('open-file', (e,a) => {openFile(a.file);});

window.onload = render;
