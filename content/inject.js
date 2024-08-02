const _url = window.location.href;

// 注入脚本
const injectScript = (file, node) => {
    return new Promise((resolve, reject) => {
        const th = document.querySelector(node || 'body');
        const s = document.createElement('script');
        s.setAttribute('type', 'text/javascript');
        s.setAttribute('src', chrome.runtime.getURL(file));
        s.onload = resolve; // 当脚本加载完成后解析 Promise
        s.onerror = reject; // 当脚本加载失败时拒绝 Promise
        th.appendChild(s);
    });
};
// 注入css
const injectCSS = (file, node) => {
    const th = document.querySelector(node || 'head');
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('type', 'text/css');
    link.setAttribute('href', chrome.runtime.getURL(file));
    th.appendChild(link);
};

// 小红书
if (_url.indexOf("xiaohongshu.com") > -1) {
    console.log("x-image 注入XHS-Downloader脚本");
    Promise.all([
        injectScript('script/gm_api.js'),
    ]).then(() => {
        return injectScript('script/xiaohongshu.js');
    }).catch(error => {
        console.error('脚本加载失败:', error);
    });
}

// instagram
if (_url.indexOf("instagram.com") > -1) {
    console.log("x-image 注入Instagram_Download_Button脚本");
    Promise.all([
        injectScript('script/gm_api.js'),
        injectScript('utils/jquery-3.7.1.min.js'),
    ]).then(() => {
        return injectScript('script/Instagram_Download_Button.js');
    }).catch(error => {
        console.error('脚本加载失败:', error);
    });
}

// // instagram
// if (_url.indexOf("instagram.com") > -1) {
//     console.log("x-image 注入ig-helper脚本");
//     injectCSS('css/style.css');
//     Promise.all([
//         injectScript('script/gm_api.js'),
//         injectScript('utils/jquery-3.7.1.min.js'),
//     ]).then(() => {
//         return injectScript('script/ig-helper.js');
//     }).catch(error => {
//         console.error('脚本加载失败:', error);
//     });
// }
