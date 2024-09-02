console.log("x-image 执行taobao内容脚本");
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
    const th = document.querySelector(node);
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('type', 'text/css');
    link.setAttribute('href', chrome.runtime.getURL(file));
    th.appendChild(link);
};

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === 'GET_TAOBAO_RESPONSE' && sender) {
        const result = getItemData();
        sendResponse(result);
    }
});

function getItemData() {
    let result = {
        name: "", zhu: [], xiang: [], sku: [], url: _url
    };
    try {
        if (_url.indexOf("1688.com") > -1) {
            platform_1688(result);
        } else if (_url.indexOf("alibaba.com") > -1) {
            platform_alibaba(result);
        } else if (_url.indexOf("taobao.com") > -1 || _url.indexOf("tmall.com") > -1 || _url.indexOf("tmall.hk") > -1) {
            platform_taobao(result);
        }

    } catch (e) {
        result.error = e
    }
    return result;
}
const extractName = () => {
    const dom_h1 = document.querySelector('h1') ? document.querySelector('h1').getAttribute('title') : '';
    const name = document.title.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "");
    const match = window.location.href.match(/\/([^\/]+)$/);
    const id = match ? match[1] : null;
    return name || dom_h1 || id
};

function processImageSrc(imgSrc) {
    if (!imgSrc) return '';
    // 判断如果imgSrc不以"http"或"https"开头，则添加"https:"
    if (!/^https?:\/\//.test(imgSrc)) {
        imgSrc = 'https:' + imgSrc;
    }
    imgSrc = imgSrc.replace(/(.+?\.(?:jpg|png)).*/i, '$1');
    // // 执行一系列替换操作以规范化URL
    // imgSrc = imgSrc.replace(/_\.webp/, '')
    //     .replace(/\.png\_\d+x\d+\.png$/, '.png')
    //     .replace(/\.jpg\_\d+x\d+\.jpg$/, '.jpg')
    //     .replace(/_\d+x\d+\.jpg$/, '_800x800.jpg')
    //     .replace(/_\d+x\d+[qQ]\d+\.jpg$/, '')
    //     .replace(/\.\d+x\d+\.jpg$/, '.jpg')
    //     .replace(/\.jpg_\d+x\d+xzq\d+\.jpg$/, '.jpg')
    //     .replace(/_640x0q80_\.webp/, '')
    //     .replace(/_640x0q80$/, '')
    //     .replace(/_\d+x\d+.*/, '');

    return imgSrc;
}
// let platform_1688 = function (result) {
//     // 商品名称
//     result.name = extractName();
//     if (document.querySelector(".title-content .title-first-column .title-text")) {
//         result.name = document.querySelector(".title-content .title-first-column .title-text").innerText;
//     }
//     if (document.querySelector(".title-info-name")) {
//         result.name = document.querySelector(".title-info-name").innerText;
//     }

//     // 视频
//     var d, s = document.querySelector(".mod-detail-version2018-gallery, .mod-detail-gallery");
//     if (s && (d = JSON.parse(s.dataset.modConfig)).userId && d.mainVideoId) {
//         result.videoUrl = "https://cloud.video.taobao.com/play/u/" + d.userId + "/p/1/e/6/t/1/" + d.mainVideoId + ".mp4";
//     }
//     if (result.videoUrl === undefined && document.querySelector(".lib-video video")) {
//         result.videoUrl = document.querySelector(".lib-video video").src;
//     }

//     // 主图
//     let zhuImgs = document.querySelectorAll("img.detail-gallery-img");
//     for (let i = 0; i < zhuImgs.length; i++) {
//         result.zhu.push({ "src": zhuImgs[i].src, "name": "主图_" + (i + 1) });
//     }

//     // 详情图
//     let xiangEle = document.getElementById("detailContentContainer").getElementsByClassName("content-detail")[0].getElementsByTagName("img");
//     for (let i = 0; i < xiangEle.length; i++) {
//         let imgUrl = xiangEle[i].getAttribute("data-lazyload-src") ? xiangEle[i].getAttribute("data-lazyload-src") : xiangEle[i].src;
//         result.xiang.push({ "src": imgUrl, "name": "详情图_" + (i + 1) });
//     }
//     return result;
// };

let platform_alibaba = function (result) {
    // 商品名称
    result.name = extractName();
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

let platform_1688 = function (result) {
    // 商品名称
    result.name = extractName();
    if ($(".title-content .title-first-column .title-text").length) {
        result.name = $(".title-content .title-first-column .title-text").text();
    }
    if ($(".title-info-name").length) {
        result.name = $(".title-info-name").text();
    }

    // 视频
    var d, s = $(".mod-detail-version2018-gallery, .mod-detail-gallery");
    if (s.length && (d = JSON.parse(s.data("mod-config"))).userId && d.mainVideoId) {
        result.videoUrl = "https://cloud.video.taobao.com/play/u/" + d.userId + "/p/1/e/6/t/1/" + d.mainVideoId + ".mp4";
    }
    if (result.videoUrl === undefined && $(".lib-video video").length) {
        result.videoUrl = $(".lib-video video").attr("src");
    }

    // 主图
    $("img.detail-gallery-img").each(function (i) {
        result.zhu.push({ "src": $(this).attr("src"), "name": "主图_" + (i + 1) });
    });

    // 详情图
    $("#detailContentContainer .content-detail img").each(function (i) {
        let imgUrl = $(this).data("lazyload-src") ? $(this).data("lazyload-src") : $(this).attr("src");
        result.xiang.push({ "src": imgUrl, "name": "详情图_" + (i + 1) });
    });
    return result;
};

// let platform_alibaba = function (result) {
//     // 商品名称
//     result.name = extractName();
//     if ($(".product-title").length) {
//         result.name = $(".product-title").text();
//     }

//     // 主图
//     $(".main-layout .main-list img").each(function (i) {
//         result.zhu.push({ "src": $(this).attr("src").replace("100x100xz.jpg", "720x720q50.jpg"), "name": "主图_" + (i + 1) });
//     });

//     // 视频
//     if ($("#J-dbi-tbplayer video, .image-slider video source, .bc-video-player video, .bc-video-player video source").length) {
//         result.videoUrl = $("#J-dbi-tbplayer video, .image-slider video source, .bc-video-player video, .bc-video-player video source").first().attr("src");
//     }

//     // 详情图
//     $("#module_product_specification img").each(function (i) {
//         let url = $(this).data("src");
//         result.xiang.push({ "src": url.startsWith("http") ? url : "https:" + url, "name": "详情图_" + (i + 1) });
//     });
//     return result;
// };

let platform_taobao = async function (result) {
    // 商品名称
    result.name = extractName();
    if ($(".tb-main-title").length) {
        result.name = $(".tb-main-title").text();
    } else if ($(".ItemHeader--mainTitle--3CIjqW5").length) {
        result.name = $(".ItemHeader--mainTitle--3CIjqW5").text();
    } else if ($(".tb-detail-hd").length) {
        result.name = $(".tb-detail-hd").text();
    } else if ($("[class^=\"ItemTitle--mainTitle--\"]").length) {
        result.name = $("[class^=\"ItemTitle--mainTitle--\"]").text();
    }

    // 日期信息
    let container = $("[class^=\"BaseDropsInfo--tableWrapper--\"]");
    if (container.length) {
        container.find('[class^=\"InfoItem--infoItem--\"]').each(function () {
            let titleElement = $(this).find('[class^=\"InfoItem--infoItemTitle--\"]');
            let title = titleElement.attr('title');
            if (['上市时间', '上市年份季节', '年份季节', '上市年份', '上市季节'].includes(title)) {
                let dateInfo = titleElement.next().attr('title');
                if (dateInfo && result.name) {
                    result.name = dateInfo + '_' + result.name;
                }
                return false; // 相当于 break
            }
        });
    }

    // 主图
    var zhuEles = $("#J_UlThumb img, [class^=\"PicGallery--thumbnails--\"] img");
    zhuEles.each(function (i) {
        var imgSrc = $(this).attr("src");
        imgSrc = processImageSrc(imgSrc);
        result.zhu.push({ "src": imgSrc, "name": "主图_" + (i + 1) });
    });
    // for (let i = 0; i < zhuEles.length; i++) {
    //     var imgSrc = zhuEles[i].src;
    //     imgSrc = imgSrc = processImageSrc(imgSrc);
    //     result.zhu.push({ "src": imgSrc, "name": "主图_" + (i + 1) });
    // }

    // 视频
    var meta = $('meta[name="microscope-data"]'), scripts = $("script"), imgVedioID;
    if (meta.length && (userId = meta.attr("content").match(/userid=(\d+);/), userId)) {
        userId = userId[1];
        scripts.each(function () {
            if ($(this).text() && !imgVedioID && (imgVedioID = $(this).text().match(/"videoId":"(\d+)"/), imgVedioID)) {
                imgVedioID = imgVedioID[1];
                result.videoUrl = "https://cloud.video.taobao.com/play/u/" + userId + "/p/1/e/6/t/1/" + imgVedioID + ".mp4";
                return false; // 相当于 break
            }
        });
    }
    if (result.videoUrl === undefined) {
        $("video").each(function () {
            result.videoUrl = $(this).attr("src");
            if (result.videoUrl && !/^https?:\/\//.test(result.videoUrl)) {
                result.videoUrl = 'https:' + result.videoUrl;
            }
            return false; // 相当于 break
        });
    }
    // if (result.videoUrl === undefined) {
    //     document.querySelectorAll("video").forEach(e => {
    //         result.videoUrl = e.currentSrc;
    //     });
    // }

    if (result.videoUrl !== undefined && result.videoUrl.startsWith("blob")) {
        scripts.each(function () {
            if ($(this).text()) {
                if (imgVedioID = $(this).text().match(/"imgVedioID":"(\d+)"/), imgVedioID && (imgVedioID = imgVedioID[1], userId = $(this).text().match(/"userId":"(\d+)"/), userId = userId ? userId[1] : "", imgVedioID && userId)) {
                    result.videoUrl = "https://cloud.video.taobao.com/play/u/" + userId + "/p/1/e/6/t/1/" + imgVedioID + ".mp4";
                }
                var g = $(this).text().match(/"valFlashUrl".*?"(.*?)"/);
                if (g) {
                    var I = g[1].replace(/(\/\/cloud\.video\.taobao\.com\/play\/u\/\d+\/p\/\d+\/e\/)\d+(\/t\/)\d+(.+)swf/, "$16$21$3mp4");
                    if ((I = I.replace(/^\/\//, "https://")).indexOf(".mp4") > 0) {
                        result.videoUrl = I;
                    }
                }
            }
        });
    }


    // 详情图
    var xiangEles = $("#description .content img, .desc-root img");
    xiangEles.each(function (i) {
        var imgUrl = $(this).data("ks-lazyload") || $(this).data("src") || $(this).attr("src");
        if (!imgUrl.startsWith("http")) {
            imgUrl = "https:" + imgUrl;
        }
        if (imgUrl.indexOf("_!!") > -1) { }
        result.xiang.push({ "src": imgUrl, "name": "详情图_" + (i + 1) });
    });

    var skuEles = $('div[class*="valueItem"] img');
    skuEles.each(function (i) {
        var imgSrc = $(this).attr("src");
        imgSrc = processImageSrc(imgSrc);
        result.sku.push({ "src": imgSrc, "name": "sku_" + (i + 1) });
    });
    // for (let i = 0; i < skuEles.length; i++) {
    //     var imgSrc = skuEles[i].src;
    //     imgSrc = processImageSrc(imgSrc);
    //     result.sku.push({ "src": imgSrc, "name": "sku_" + (i + 1) });
    // }
    return result;
};