let getImgBtn = $('#getImg');
let tips = $('#tips');
let videoUrl = "";
let downloadStatus = 0;
let zipName = "文件";
let imgList = [];
let percent = 0;

getImgBtn.on('click', function (e) {
    getResponse((response) => {
        if (imgList.length > 0) return;
        console.log('资源内容', response);
        if (response && (response.zhu.length > 0 || response.xiang.length > 0)) {
            getImgBtn.html('已获取数据 √');
            getImgBtn.css({ 'color': '#ccc', 'cursor': 'no-drop' });
            $('#download').css('cursor', 'pointer');
            if (response.name !== "") {
                zipName = response.name.replaceAll(" ", "").replaceAll("\n", "").replaceAll("/", "_")
            }
            videoUrl = response.videoUrl;
            var zhu = response.zhu || [];
            var xiang = response.xiang || [];
            var sku = response.sku || [];
            imgList = [...zhu, ...xiang, ...sku];

            let _html = "";
            for (let i = 0; i < zhu.length; i++) {
                _html += `
                <div><img src="${zhu[i].src}"/><span>${zhu[i].name}</span></div>
                `
            }
            for (let i = 0; i < xiang.length; i++) {
                _html += `
                <div><img src="${xiang[i].src}"/><span>${xiang[i].name}</span></div>
                `
            }
            for (let i = 0; i < sku.length; i++) {
                _html += `
                <div><img src="${sku[i].src}"/><span>${sku[i].name}</span></div>
                `
            }
            $("#imgList").html(_html);
            tips.html(`当前选中 0/${imgList.length}`);
            // 添加选中事件
            $('#imgList').find('div').on('click', function () {
                // 如果指定的类存在，则移除；如果不存在，则添加
                $(this).toggleClass('activation');
                let currentSelect = $('#imgList').find(".activation").length;
                tips.html(`当前选中 ${currentSelect}/${imgList.length}`);
            });
            downloadStatus = 0;
        } else {
            downloadStatus = 0;
            tips.html('暂不支持当前页 ×');
        }
    });
});

let downloadBtn = $('#download');
downloadBtn.on('click', function () {
    if (downloadStatus === 0) {
        downloadStatus = 1;
        var list = $("#imgList").find(".activation") || [];
        var imgUrls = []
        list.each(function () {
            let img = $(this).find('img');
            let span = $(this).find('span');
            imgUrls.push({ src: img.attr('src'), name: span.text() });
        });
        if (imgUrls.length === 0) {
            downloadStatus = 0;
            tips.html('未选择图片');
            return;
        }
        tips.html('正在打包中...');
        var zip = new JSZip();
        try {
            saveToZip(zip, imgUrls, 0)
        } catch (e) {
            downloadStatus = 0;
            console.error(e);
        }
    } else {
        tips.html('打包中，请勿操作');
    }
});

// 全选
let allSelect = $('#allSelect');
allSelect.on('click', function () {
    let items = $('#imgList').find('div');
    let flag = items.filter('.activation');
    if (items.length === 0) {
        tips.html('尚未获取图片');
        return;
    }
    // for (let i = 0; i < items.length; i++) {
    //     if (flag.length < items.length) {
    //         items[i].classList.add('activation');
    //     } else {
    //         items[i].classList.remove('activation');
    //     }
    // }
    items.each(function () {
        if (flag.length < items.length) {
            $(this).addClass('activation');
        } else {
            $(this).removeClass('activation');
        }
    });
    flag = items.filter('.activation');
    tips.html(`当前选中 ${flag.length}/${imgList.length}`);
    if (flag.length === 0) {
        allSelect.html('全选图片');
    } else {
        allSelect.html('取消全选图片');
    }
});

function getResources(index, url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open("get", url, true);
    xhr.responseType = "blob";
    xhr.onload = function () {
        if (this.status == 200 || this.status == 304) {
            callback(this.response, true);
        }
    };
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status !== 200) {
                console.log('发生了错误：', xhr.status, xhr.statusText);
                callback("", false);
            }
        }
    };
    xhr.send();
}

function setPercent(index, length) {
    if (index === (length.length - 1)) {
        $("#progress").val(100);
    } else {
        percent = parseInt(index / length * 100);
        $("#progress").val(percent);
    }
}

function saveToZip(zip, imgUrls, index) {
    getResources(index + 1, imgUrls[index].src, (data, success) => {
        if (success) {
            let suffix = data.type.split('/')[1];
            if (suffix.toLocaleUpperCase() === 'JPEG' || suffix.toLocaleUpperCase() === 'WEBP' || suffix.toLocaleUpperCase() === 'AVIF') {
                suffix = 'jpg';
            }
            let fileName = imgUrls[index].name;
            zip.file(fileName + "." + suffix, data);
        }
        index++;
        setPercent(index, imgUrls.length)
        if (index >= imgUrls.length) {
            // 是否需要下载视频
            if (videoUrl && $("input[name='videoSelect']").prop('checked')) {
                getResources(index + 1, videoUrl, (data, success) => {
                    if (success) {
                        zip.file(zipName + ".mp4", data);
                    }
                    zip.generateAsync({ type: "blob" }).then(function (content) {
                        saveAs(content, zipName + ".zip");
                        downloadStatus = 0;
                        tips.html('打包完成');
                    });
                });
            } else {
                zip.generateAsync({ type: "blob" }).then(function (content) {
                    saveAs(content, zipName + ".zip");
                    downloadStatus = 0;
                    tips.html('打包完成');
                });
            }
        } else {
            saveToZip(zip, imgUrls, index);
        }
    })
}

/**
 * 获取当前激活标签页的淘宝响应数据
 *
 * 此函数通过chrome扩展API查询当前窗口的激活标签页，并发送消息获取淘宝相关响应数据
 * 使用场景：当需要从内容脚本中获取特定数据时，可以通过此函数实现
 *
 * @param {Function} callback - 回调函数，接收从内容脚本返回的响应数据
 */
function getResponse(callback) {
    // 查询当前窗口的激活标签页
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        // 向查询到的第一个标签页发送消息，请求淘宝响应数据
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_TAOBAO_RESPONSE' }, function (response) {
            // 如果回调函数存在，则将获取到的响应数据传递给回调函数处理
            callback && callback(response);
        });
    });
}
