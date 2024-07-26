
let getImgBtn = document.getElementById('getImg');
let tips = document.getElementById('tips');
let videoUrl;
let status = 0;
let zipName = "文件";
let imgList = [];
let percent = 0;
getImgBtn.onclick = function (e) {
    doGao('获取资源', (response) => {
        console.log('资源内容', response);
        if (response && (response.zhu.length > 0 || response.xiang.length > 0)) {
            getImgBtn.innerHTML = '已获取数据 √';
            document.getElementById('download').style.cursor = 'pointer';
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
            document.getElementById("imgList").innerHTML = _html;
            tips.innerHTML = `当前选中 0/${imgList.length}`;
            // 添加选中事件
            var items = document.getElementById('imgList').getElementsByTagName('div');
            for (let i = 0; i < items.length; i++) {
                items[i].onclick = function () {
                    if (this.classList.contains('activation')) {
                        //表示含有'checked'这个类名
                        this.classList.remove('activation')
                        let currentSelect = document.getElementById('imgList').querySelectorAll(".activation")
                        tips.innerHTML = `当前选中 ${currentSelect.length}/${imgList.length}`
                    } else {
                        this.classList.add('activation')
                        let currentSelect = document.getElementById('imgList').querySelectorAll(".activation")
                        tips.innerHTML = `当前选中 ${currentSelect.length}/${imgList.length}`
                    }
                }
            }
            status = 0;
        } else {
            status = 0;
            tips.innerHTML = '暂不支持当前页 ×';
        }
    });
}

let downloadBtn = document.getElementById('download');
downloadBtn.onclick = function () {
    if (status === 0) {
        status = 1;
        var list = document.getElementById("imgList").getElementsByClassName("activation") || [];
        var imgUrls = []
        for (let i = 0; i < list.length; i++) {
            imgUrls.push({ src: list[i].getElementsByTagName('img')[0].src, name: list[i].getElementsByTagName('span')[0].innerText })
        }
        if (imgUrls.length === 0) {
            status = 0;
            tips.innerHTML = '未选择图片';
            return;
        }
        tips.innerHTML = '开始打包下载';
        var zip = new JSZip();
        try {
            saveToZip(zip, imgUrls, 0)
        } catch (e) {
            status = 0;
            console.error(e);
        }
    } else {
        tips.innerHTML = '打包中，请勿操作';
    }
};
// 全选
document.getElementById('allSelect').onclick = function () {
    var items = Array.from(document.getElementById('main').getElementsByTagName('div'));
    var flag = items.filter(item => item.classList.contains('activation'));
    if (items.length === 0) {
        tips.innerHTML = '尚未获取图片';
        return;
    }

    if (flag.length === 0) {
        tips.innerHTML = `当前选中 ${imgList.length}/${imgList.length}`;
    } else if (flag.length < items.length) {
        tips.innerHTML = '再次点击取消全选';
    } else {
        tips.innerHTML = `当前选中 ${imgList.length}/${imgList.length}`;
    }
    for (let i = 0; i < items.length; i++) {
        if (flag.length < items.length) {
            items[i].classList.add('activation');
        } else {
            items[i].classList.remove('activation');
        }
    }
};
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
        document.getElementById("progress").value = 100;
    } else {
        percent = parseInt(index / length * 100);
        document.getElementById("progress").value = percent;
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
            if (videoUrl && document.getElementsByName("videoSelect")[0].checked) {
                getResources(index + 1, videoUrl, (data, success) => {
                    if (success) {
                        zip.file(zipName + ".mp4", data);
                    }
                    zip.generateAsync({ type: "blob" }).then(function (content) {
                        saveAs(content, zipName + ".zip");
                        status = 0;
                        tips.innerHTML = '打包完成';
                    });
                });
            } else {
                zip.generateAsync({ type: "blob" }).then(function (content) {
                    saveAs(content, zipName + ".zip");
                    status = 0;
                    tips.innerHTML = '打包完成';
                });
            }
        } else {
            saveToZip(zip, imgUrls, index);
        }
    })
}

function doGao(message, callback) {
    getCurrentTabId((tabId) => {
        chrome.tabs.sendMessage(tabId, message, function (response) {
            if (callback) callback(response);
        });
    });
}

function getCurrentTabId(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (callback) callback(tabs.length ? tabs[0].id : null);
    });
}

