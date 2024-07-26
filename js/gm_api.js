// 模拟 GM_setValue 和 GM_getValue
const GM_storage = {};

function GM_setValue(key, value) {
    GM_storage[key] = value;
}

function GM_getValue(key, defaultValue) {
    return GM_storage.hasOwnProperty(key) ? GM_storage[key] : defaultValue;
}

// 模拟 unsafeWindow
const unsafeWindow = window;

// 模拟 GM_setClipboard
function GM_setClipboard(text) {
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.value = text;
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
}

// 模拟 GM_registerMenuCommand
function GM_registerMenuCommand(name, fn) {
    const menuItem = document.createElement("div");
    menuItem.textContent = name;
    menuItem.style.cursor = "pointer";
    menuItem.style.padding = "5px";
    menuItem.style.border = "1px solid #ccc";
    menuItem.style.margin = "5px";
    document.body.appendChild(menuItem);
    menuItem.addEventListener("click", fn);
}



function GM_addStyle(css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.append(style);
}

function GM_xmlhttpRequest(details) {
    const { method = 'GET', url, headers = {}, data, onload, onerror } = details;
    fetch(url, {
        method,
        headers,
        body: data
    })
        .then(response => response.text())
        .then(onload)
        .catch(onerror);
}

function GM_getResourceText(name) {
    // console.log(`Get resource text: ${name}`);
    return ''; // This would need to be implemented properly
}

async function GM_fetchResource(resourcePath) {
    try {
        //   const url = chrome.runtime.getURL(resourcePath);
        const response = await fetch(resourcePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        console.error('Error fetching resource:', error);
        return null;
    }
}

function GM_openInTab(url) {
    window.open(url, '_blank');
}