// 这里本打算 弄非指定网页 则置灰的，但tab.url总是不稳定获取
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     if (changeInfo.status === 'complete') {
//         updateIcon(tab);
//     }
// });

// chrome.tabs.onActivated.addListener(activeInfo => {
//     chrome.tabs.get(activeInfo.tabId, tab => {
//         updateIcon(tab);
//     });
// });

function updateIcon(tab) {
    const url = tab.url;

    // 定义需要匹配的网址模式数组
    const matchingPatterns = [
        /:\/\/.*\.1688\.com\//,
        /:\/\/.*\.alibaba\.com\//,
        /:\/\/.*\.taobao\.com\//,
        /:\/\/.*\.tmall\.com\//,
        /:\/\/.*\.detail.tmall\.com\//,
        /:\/\/.*\.tmall\.hk\//,
        /:\/\/.*\.xiaohongshu\.com\//,
        /:\/\/.*\.instagram\.com\//,
    ];

    // 检查当前URL是否与匹配模式中的任何一个一致
    const matches = matchingPatterns.some(pattern => pattern.test(url));

    if (matches) {
        chrome.action.setIcon({
            path: {
                "16": "icons/icon_16.png",
                "128": "icons/icon_128.png"
            },
            tabId: tab.id
        });
    }
    else {
        chrome.action.setIcon({
            path: {
                "16": "icons/icon_gray_16.png",
                "128": "icons/icon_gray_128.png"
            },
            tabId: tab.id
        });
    }
}
