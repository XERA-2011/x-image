console.log("x-image 加载成功!!!")
const _url = window.location.href;
// 注入脚本
const injectScript = (file, node) => {
    return new Promise((resolve, reject) => {
        const th = document.querySelector(node);
        const s = document.createElement('script');
        s.setAttribute('type', 'text/javascript');
        s.setAttribute('src', file);
        s.onload = resolve; // 当脚本加载完成后解析 Promise
        s.onerror = reject; // 当脚本加载失败时拒绝 Promise
        th.appendChild(s);
    });
};
// 注入css
const injectCSS = (file, node) => {
    const th = document.querySelector(node);
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('type', 'text/css');
    link.setAttribute('href', file);
    th.appendChild(link);
};

if (_url.indexOf("xiaohongshu.com") > -1) {
    Promise.all([
        injectScript(chrome.runtime.getURL('script/gm_api.js'), 'body'),
    ]).then(() => {
        // 在所有 脚本加载完成后注入 instagram.js
        return injectScript(chrome.runtime.getURL('script/xiaohongshu.js'), 'body');
    }).catch(error => {
        console.error('脚本加载失败:', error);
    });
}
if (_url.indexOf("instagram.com") > -1) {
    Promise.all([
        injectScript(chrome.runtime.getURL('script/gm_api.js'), 'body'),
        injectScript(chrome.runtime.getURL('utils/jquery-3.7.1.min.js'), 'body'),
    ]).then(() => {
        // 在所有 脚本加载完成后注入 instagram.js
        return injectScript(chrome.runtime.getURL('script/instagram.js'), 'body');
    }).catch(error => {
        console.error('脚本加载失败:', error);
    });
}


chrome.runtime.onMessage.addListener(function (data, sender, sendResponse) {
    let result = builder();
    console.log(result);
    sendResponse(result);
});
function builder() {
    let result = {
        name: "", zhu: [], xiang: [], sku: [], url: _url
    };
    try {
        if (_url.indexOf("1688.com") > -1) {
            return platform_1688(_url, result);
        }
        if (_url.indexOf("alibaba.com") > -1) {
            platform_alibaba(_url, result);
        }
        if (_url.indexOf("taobao.com") > -1 || _url.indexOf("tmall.com") > -1 || _url.indexOf("tmall.hk") > -1) {
            platform_taobao(_url, result);
        }

    } catch (e) {
        result.error = e
    }
    return result;
}
let platform_1688 = function (_url, result) {
    // 商品名称
    result.name = _url;
    if (document.querySelector(".title-content .title-first-column .title-text")) {
        result.name = document.querySelector(".title-content .title-first-column .title-text").innerText;
    }
    if (document.querySelector(".title-info-name")) {
        result.name = document.querySelector(".title-info-name").innerText;
    }

    // 视频
    var d, s = document.querySelector(".mod-detail-version2018-gallery, .mod-detail-gallery");
    if (s && (d = JSON.parse(s.dataset.modConfig)).userId && d.mainVideoId) {
        result.videoUrl = "https://cloud.video.taobao.com/play/u/" + d.userId + "/p/1/e/6/t/1/" + d.mainVideoId + ".mp4";
    }
    if (result.videoUrl === undefined && document.querySelector(".lib-video video")) {
        result.videoUrl = document.querySelector(".lib-video video").src;
    }

    // 主图
    let zhuImgs = document.querySelectorAll("img.detail-gallery-img");
    for (let i = 0; i < zhuImgs.length; i++) {
        result.zhu.push({ "src": zhuImgs[i].src, "name": "主图_" + (i + 1) });
    }

    // 详情图
    let xiangEle = document.getElementById("detailContentContainer").getElementsByClassName("content-detail")[0].getElementsByTagName("img");
    for (let i = 0; i < xiangEle.length; i++) {
        let imgUrl = xiangEle[i].getAttribute("data-lazyload-src") ? xiangEle[i].getAttribute("data-lazyload-src") : xiangEle[i].src;
        result.xiang.push({ "src": imgUrl, "name": "详情图_" + (i + 1) });
    }
    return result;
};
let platform_alibaba = function (_url, result) {
    // 商品名称
    result.name = _url;
    if (document.querySelector(".product-title")) {
        result.name = document.querySelector(".product-title").innerText;
    }

    // 主图
    var zhuImgs = document.querySelectorAll(".main-layout .main-list img");
    for (let i = 0; i < zhuImgs.length; i++) {
        result.zhu.push({ "src": zhuImgs[i].src.replace("100x100xz.jpg", "720x720q50.jpg"), "name": "主图_" + (i + 1) });
    }

    // 视频
    if (document.querySelectorAll("#J-dbi-tbplayer video,.image-slider video source, .bc-video-player video, .bc-video-player video source")[0]) {
        result.videoUrl = document.querySelectorAll("#J-dbi-tbplayer video,.image-slider video source, .bc-video-player video, .bc-video-player video source")[0].src;
    }

    // 详情图
    let xiangEle = document.getElementById("module_product_specification").getElementsByTagName("img");
    for (let i = 0; i < xiangEle.length; i++) {
        let url = xiangEle[i].getAttribute("data-src")
        result.xiang.push({ "src": url.startsWith("http") ? url : "https:" + url, "name": "详情图_" + (i + 1) });
    }
    return result;
};
let platform_taobao = async function (_url, result) {
    // 商品名称
    result.name = document.querySelector('h1') ? document.querySelector('h1').getAttribute('title') : _url;
    if (document.querySelector(".tb-main-title")) {
        result.name = document.querySelector(".tb-main-title").innerText;
    } else if (document.querySelector(".ItemHeader--mainTitle--3CIjqW5")) {
        result.name = document.querySelector(".ItemHeader--mainTitle--3CIjqW5").innerText;
    } else if (document.querySelector(".tb-detail-hd")) {
        result.name = document.querySelector(".tb-detail-hd").innerText;
    } else if (document.querySelector("[class^=\"ItemTitle--mainTitle--\"]")) {
        result.name = document.querySelector("[class^=\"ItemTitle--mainTitle--\"]").innerText;
    }

    // 日期信息
    let container = document.querySelector("[class^=\"BaseDropsInfo--tableWrapper--\"]");
    if (container) {
        // 获取所有信息项
        let infoItems = container.querySelectorAll('[class^=\"InfoItem--infoItem--\"]');
        // 遍历每个信息项
        for (let i = 0; i < infoItems.length; i++) {
            // 获取当前信息项的标题元素
            let titleElement = infoItems[i].querySelector('[class^=\"InfoItem--infoItemTitle--\"]');
            // 检查标题元素的title属性是否为"上市时间"
            let title = titleElement && titleElement.getAttribute('title')
            if (['上市时间', '上市年份季节', '年份季节', '上市年份', '上市季节',].includes(title)) {
                // 获取对应的日期信息元素
                let dateElement = titleElement.nextElementSibling;
                // 获取日期信息
                let dateInfo = dateElement.getAttribute('title');
                // 输出日期信息
                if (dateInfo && result.name) {
                    result.name = dateInfo + '_' + result.name;
                }
                break;
            }
        }
    }

    // 主图
    var zhuEles = [];
    if (document.getElementById("J_UlThumb") && document.getElementById("J_UlThumb").getElementsByTagName("img")) {
        zhuEles = document.getElementById("J_UlThumb").getElementsByTagName("img");
    } else if (document.querySelector("[class^=\"PicGallery--thumbnails--\"]") && document.querySelector("[class^=\"PicGallery--thumbnails--\"]").getElementsByTagName("img")) {
        zhuEles = document.querySelector("[class^=\"PicGallery--thumbnails--\"]").getElementsByTagName("img");
    }
    for (let i = 0; i < zhuEles.length; i++) {
        var imgSrc = zhuEles[i].src;
        imgSrc = imgSrc.replace(/_\.webp/, '').replace(/\.png\_\d+x\d+\.png$/, '.png').replace(/\.jpg\_\d+x\d+\.jpg$/, '.jpg').replace(/_\d+x\d+\.jpg$/, '_800x800.jpg').replace(/_\d+x\d+[qQ]\d+\.jpg$/, '').replace(/\.\d+x\d+\.jpg$/, '.jpg').replace(/\.jpg_\d+x\d+xzq\d+\.jpg$/, '.jpg').replace(/_640x0q80_\.webp/, '').replace(/_640x0q80$/, '').replace(/_\d+x\d+.*/, '');
        result.zhu.push({ "src": imgSrc, "name": "主图_" + (i + 1) });
    }

    // 视频
    var meta = document.querySelector('meta[name="microscope-data"]'), scripts = document.querySelectorAll("script"), imgVedioID;
    if (meta && (userId = meta.content.match(/userid=(\d+);/), userId)) {
        userId = userId[1];
        for (var i = 0; i < scripts.length; i++) {
            if (scripts[i].innerText && !imgVedioID && (imgVedioID = scripts[i].innerText.match(/"videoId":"(\d+)"/), imgVedioID)) {
                imgVedioID = imgVedioID[1];
                result.videoUrl = "https://cloud.video.taobao.com/play/u/" + userId + "/p/1/e/6/t/1/" + imgVedioID + ".mp4";
            }
        }
    }
    if (result.videoUrl === undefined) {
        document.querySelectorAll("video").forEach(e => {
            result.videoUrl = e.currentSrc;
        });
    }

    if (result.videoUrl !== undefined && result.videoUrl.startsWith("blob")) {
        for (var l = document.querySelectorAll("script"), p = 0; p < l.length; p++) if (l[p].innerText) {
            if (imgVedioID = l[p].innerText.match(/"imgVedioID":"(\d+)"/), imgVedioID && (imgVedioID = imgVedioID[1], userId = l[p].innerText.match(/"userId":"(\d+)"/), userId = userId ? userId[1] : "", imgVedioID && userId)) {
                result.videoUrl = "https://cloud.video.taobao.com/play/u/" + userId + "/p/1/e/6/t/1/" + imgVedioID + ".mp4";
            }
            var g = l[p].innerText.match(/"valFlashUrl".*?"(.*?)"/);
            if (g) {
                var I = g[1].replace(/(\/\/cloud\.video\.taobao\.com\/play\/u\/\d+\/p\/\d+\/e\/)\d+(\/t\/)\d+(.+)swf/, "$16$21$3mp4");
                if ((I = I.replace(/^\/\//, "https://")).indexOf(".mp4") > 0) {
                    result.videoUrl = I;
                }
            }
        }
    }

    // 详情图
    var xiangEles = [];
    if (document.getElementById("description")) {
        xiangEles = document.getElementById("description").getElementsByClassName("content")[0].getElementsByTagName("img");
    } else if (document.querySelector(".desc-root")) {
        xiangEles = document.querySelector(".desc-root").querySelectorAll("img");
    }
    for (let i = 0; i < xiangEles.length; i++) {
        var ele = xiangEles[i];
        var imgUrl = "";
        if (ele.getAttribute("data-ks-lazyload")) {
            imgUrl = ele.getAttribute("data-ks-lazyload")
        } else if (ele.getAttribute("data-src")) {
            imgUrl = ele.getAttribute("data-src");
        } else {
            imgUrl = ele.src;
        }
        if (!imgUrl.startsWith("http")) {
            imgUrl = "https:" + imgUrl;
        }
        if (imgUrl.indexOf("_!!") > -1) { } result.xiang.push({ "src": imgUrl, "name": "详情图_" + (i + 1) });
    }

    var skuEles = [];
    if (document.querySelector("[class^=\"SkuContent--content--\"]")) {
        skuEles = document.querySelector("[class^=\"SkuContent--content--\"]").getElementsByTagName("img");
    }
    for (let i = 0; i < skuEles.length; i++) {
        var imgSrc = skuEles[i].src;
        imgSrc = imgSrc.replace(/_\.webp/, '').replace(/\.png\_\d+x\d+\.png$/, '.png').replace(/\.jpg\_\d+x\d+\.jpg$/, '.jpg').replace(/_\d+x\d+\.jpg$/, '_800x800.jpg').replace(/_\d+x\d+[qQ]\d+\.jpg$/, '').replace(/\.\d+x\d+\.jpg$/, '.jpg').replace(/\.jpg_\d+x\d+xzq\d+\.jpg$/, '.jpg').replace(/_640x0q80_\.webp/, '').replace(/_640x0q80$/, '').replace(/_\d+x\d+.*/, '');
        result.sku.push({ "src": imgSrc, "name": "sku_" + (i + 1) });
    }
    return result;
};