// ==UserScript==
// @name         XHS-Downloader
// @namespace    https://github.com/JoeanAmier/XHS-Downloader
// @version      1.5.2
// @description  提取小红书作品/用户链接，下载小红书无水印图文/视频作品文件
// @author       JoeanAmier
// @match        http*://xhslink.com/*
// @match        http*://www.xiaohongshu.com/explore*
// @match        http*://www.xiaohongshu.com/user/profile/*
// @match        http*://www.xiaohongshu.com/search_result*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @license      GNU General Public License v3.0
// @downloadURL https://update.greasyfork.org/scripts/483847/XHS-Downloader.user.js
// @updateURL https://update.greasyfork.org/scripts/483847/XHS-Downloader.meta.js
// ==/UserScript==

(function () {
    let disclaimer = GM_getValue("disclaimer", true);

    const readme = () => {
        const instructions = `
关于 XHS-Downloader 用户脚本的功能说明：

功能清单：

1. 下载小红书无水印作品文件
2. 提取发现页面作品链接
3. 提取账号发布作品链接
4. 提取账号收藏作品链接
5. 提取账号点赞作品链接
6. 提取搜索结果作品链接
7. 提取搜索结果用户链接

详细说明：

1. 下载小红书无水印作品文件时，脚本需要花费时间处理文件，请等待片刻，切勿多次点击下载按钮
2. 无水印图片文件为 PNG 格式；无水印视频文件较大，可能需要较长的时间处理，页面跳转可能会导致下载失败
3. 提取账号发布、收藏、点赞作品链接时，脚本会尝试自动滚动屏幕直至加载全部作品，滚动检测间隔：2.5 秒
4. 提取搜索结果作品、用户链接时，脚本会自动滚动屏幕以尝试加载更多内容，滚动屏幕次数：10 次
5. 可以修改滚动检测间隔、滚动屏幕次数，修改后立即生效；亦可关闭自动滚动屏幕功能，手动滚动屏幕加载内容
6. 使用全局代理工具可能会导致脚本下载文件失败，如有异常，请尝试关闭代理工具，必要时向作者反馈
7. XHS-Downloader 用户脚本仅实现可见即可得的数据采集功能，无任何收费功能和破解功能

项目开源地址：https://github.com/JoeanAmier/XHS-Downloader
`
        const disclaimer_content = `
关于 XHS-Downloader 的 免责声明：

1. 使用者对本项目的使用由使用者自行决定，并自行承担风险。作者对使用者使用本项目所产生的任何损失、责任、或风险概不负责。
2. 本项目的作者提供的代码和功能是基于现有知识和技术的开发成果。作者尽力确保代码的正确性和安全性，但不保证代码完全没有错误或缺陷。
3. 使用者在使用本项目时必须严格遵守 GNU General Public License v3.0 的要求，并在适当的地方注明使用了 GNU General Public License v3.0 的代码。
4. 使用者在任何情况下均不得将本项目的作者、贡献者或其他相关方与使用者的使用行为联系起来，或要求其对使用者使用本项目所产生的任何损失或损害负责。
5. 使用者在使用本项目的代码和功能时，必须自行研究相关法律法规，并确保其使用行为合法合规。任何因违反法律法规而导致的法律责任和风险，均由使用者自行承担。
6. 本项目的作者不会提供 XHS-Downloader 项目的付费版本，也不会提供与 XHS-Downloader 项目相关的任何商业服务。
7. 基于本项目进行的任何二次开发、修改或编译的程序与原创作者无关，原创作者不承担与二次开发行为或其结果相关的任何责任，使用者应自行对因二次开发可能带来的各种情况负全部责任。

在使用本项目的代码和功能之前，请您认真考虑并接受以上免责声明。如果您对上述声明有任何疑问或不同意，请不要使用本项目的代码和功能。如果您使用了本项目的代码和功能，则视为您已完全理解并接受上述免责声明，并自愿承担使用本项目的一切风险和后果。

是否已阅读 XHS-Downloader 功能说明与免责声明(YES/NO)
`
        alert(instructions);
        if (!disclaimer) {
            const answer = prompt(disclaimer_content, "");
            if (answer === null) {
                GM_setValue("disclaimer", false);
                disclaimer = false;
            } else {
                GM_setValue("disclaimer", answer.toUpperCase() === "YES");
                disclaimer = GM_getValue("disclaimer");
                location.reload();
            }
        }
    };

    if (disclaimer === null) {
        readme();
    }

    GM_registerMenuCommand("关于 XHS-Downloader", function () {
        readme();
    });

    let scroll = GM_getValue("scroll", true);

    GM_registerMenuCommand(`自动滚动屏幕功能 ${scroll ? '✔️' : '❌'}`, function () {
        scroll = !scroll;
        GM_setValue("scroll", scroll);
        alert('修改自动滚动屏幕功能成功！');
    });

    let timeout = GM_getValue("timeout", 2500);

    GM_registerMenuCommand("修改滚动检测间隔", function () {
        let data;
        data = prompt("请输入自动滚动屏幕检测间隔：\n如果网络环境不佳导致脚本未能加载全部作品，可以设置较大的检测间隔！", timeout / 1000);
        if (data === null) {
            return
        }
        data = parseFloat(data) || 2.5
        timeout = data * 1000;
        GM_setValue("timeout", timeout);
        alert(`修改自动滚动屏幕检测间隔成功，当前值：${data} 秒`);
    });

    let number = GM_getValue("number", 10);

    GM_registerMenuCommand("修改滚动屏幕次数", function () {
        let data;
        data = prompt("请输入自动滚动屏幕次数：\n仅对【提取搜索结果作品、用户链接】生效！", number);
        if (data === null) {
            return
        }
        number = parseInt(data) || 10;
        GM_setValue("number", number);
        alert(`修改自动滚动屏幕次数成功，当前值：${number} 次`);
    });

    const icon = "https://picasso-static.xiaohongshu.com/fe-platform/f43dc4a8baf03678996c62d8db6ebc01a82256ff.png";

    const about = () => {
        window.open('https://github.com/JoeanAmier/XHS-Downloader', '_blank');
    }

    const abnormal = () => {
        alert("下载无水印作品文件失败！请向作者反馈！\n项目地址：https://github.com/JoeanAmier/XHS-Downloader");
    };

    const generateVideoUrl = note => {
        try {
            return [`https://sns-video-bd.xhscdn.com/${note.video.consumer.originVideoKey}`];
        } catch (error) {
            console.error("Error generating video URL:", error);
            return [];
        }
    };

    const generateImageUrl = note => {
        let images = note.imageList;
        const regex = /http:\/\/sns-webpic-qc\.xhscdn.com\/\d+\/[0-9a-z]+\/(\S+)!/;
        let urls = [];
        try {
            images.forEach((item) => {
                let match = item.urlDefault.match(regex);
                if (match && match[1]) {
                    urls.push(`https://ci.xiaohongshu.com/${match[1]}?imageView2/2/w/format/png`);
                }
            })
            return urls
        } catch (error) {
            console.error("Error generating image URLs:", error);
            return [];
        }
    };

    const download = async (urls, type_) => {
        const name = extractName();
        console.info(`基础文件名称 ${name}`);
        if (type_ === "video") {
            await downloadVideo(urls[0], name);
        } else {
            await downloadImage(urls, name);
        }
    };

    const exploreDeal = async note => {
        try {
            let links;
            if (note.type === "normal") {
                links = generateImageUrl(note);
            } else {
                links = generateVideoUrl(note);
            }
            if (links.length > 0) {
                console.info("无水印文件下载链接", links);
                await download(links, note.type);
            } else {
                abnormal()
            }
        } catch (error) {
            console.error("Error in deal function:", error);
            abnormal();
        }
    };

    const extractNoteInfo = () => {
        const regex = /\/explore\/([^?]+)/;
        const match = window.location.href.match(regex);
        if (match) {
            // let note = Object.values(unsafeWindow.__INITIAL_STATE__.note.noteDetailMap);
            return unsafeWindow.__INITIAL_STATE__.note.noteDetailMap[match[1]]
        } else {
            console.error("使用当前链接提取作品 ID 失败", window.location.href,);
        }
    };

    const extractDownloadLinks = async () => {
        if (window.location.href.includes("https://www.xiaohongshu.com/explore/")) {
            let note = extractNoteInfo();
            if (note.note) {
                await exploreDeal(note.note);
            } else {
                abnormal();
            }
        }
    };

    const downloadFile = async (link, filename) => {
        try {
            // 使用 fetch 获取文件数据
            let response = await fetch(link, {
                method: "GET",
            });

            // 检查响应状态码
            if (!response.ok) {
                console.error(`请求失败，状态码: ${response.status}`, response.status);
                return false
            }

            let blob = await response.blob();

            // 创建 Blob 对象的 URL
            let blobUrl = window.URL.createObjectURL(blob);

            // 创建一个临时链接元素
            let tempLink = document.createElement('a');
            tempLink.href = blobUrl;
            tempLink.download = filename;

            // 模拟点击链接
            tempLink.click();

            // 清理临时链接元素
            window.URL.revokeObjectURL(blobUrl);

            return true
        } catch (error) {
            console.error(`下载失败 (${filename}):`, error);
            return false
        }
    }

    const extractName = () => {
        let name = document.title.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "");
        let match = window.location.href.match(/\/([^\/]+)$/);
        let id = match ? match[1] : null;
        return name === "" ? id : name
    };

    const downloadVideo = async (url, name) => {
        if (!await downloadFile(url, `${name}.mp4`)) {
            abnormal();
        }
    };

    const downloadImage = async (urls, name) => {
        let result = [];
        for (const [index, url] of urls.entries()) {
            result.push(await downloadFile(url, `${name}_${index + 1}.png`));
        }
        if (!result.every(item => item === true)) {
            abnormal();
        }
    };

    const scrollScreen = (callback, feed = false, search = false) => {
        if (!scroll) {
            callback();
        } else if (search) {
            let previousHeight = 0;
            let scrollCount = 0;
            const scrollInterval = setInterval(() => {
                const currentHeight = document.body.scrollHeight;
                if (currentHeight !== previousHeight && scrollCount < number) {
                    window.scrollTo(0, document.body.scrollHeight);
                    previousHeight = currentHeight;
                    scrollCount++;
                } else {
                    clearInterval(scrollInterval);
                    callback();
                }
            }, timeout);
        } else if (!feed) {
            let previousHeight = 0;
            const scrollInterval = setInterval(() => {
                const currentHeight = document.body.scrollHeight;
                if (currentHeight !== previousHeight) {
                    window.scrollTo(0, document.body.scrollHeight);
                    previousHeight = currentHeight;
                } else {
                    clearInterval(scrollInterval);
                    callback();
                }
            }, timeout);
        } else {
            callback();
        }
    };

    const extractNotesInfo = order => {
        const notesRawValue = unsafeWindow.__INITIAL_STATE__.user.notes._rawValue[order];
        return new Set(notesRawValue.map(({id}) => id));
    };

    const extractFeedInfo = () => {
        const notesRawValue = unsafeWindow.__INITIAL_STATE__.feed.feeds._rawValue;
        return new Set(notesRawValue.map(({id}) => id));
    };

    const extractSearchNotes = () => {
        const notesRawValue = unsafeWindow.__INITIAL_STATE__.search.feeds._rawValue;
        return new Set(notesRawValue.map(({id}) => id));
    }

    const extractSearchUsers = () => {
        const notesRawValue = unsafeWindow.__INITIAL_STATE__.search.userLists._rawValue;
        return new Set(notesRawValue.map(({id}) => id));
    }

    const generateNoteUrls = ids => [...ids].map(id => `https://www.xiaohongshu.com/explore/${id}`).join(" ");

    const generateUserUrls = ids => [...ids].map(id => `https://www.xiaohongshu.com/user/profile/${id}`).join(" ");

    const extractAllLinks = (callback, order) => {
        scrollScreen(() => {
            let ids;
            if (order >= 0 && order <= 2) {
                ids = extractNotesInfo(order);
            } else if (order === 3) {
                ids = extractSearchNotes();
            } else if (order === 4) {
                ids = extractSearchUsers();
            } else if (order === -1) {
                ids = extractFeedInfo()
            } else {
                ids = [];
            }
            let urlsString = order !== 4 ? generateNoteUrls(ids) : generateUserUrls(ids);
            callback(urlsString);
        }, order === -1, [3, 4].includes(order))
    };

    const extractAllLinksEvent = (order = 0) => {
        extractAllLinks(urlsString => {
            if (urlsString) {
                GM_setClipboard(urlsString, "text", () => {
                    alert('作品/用户链接已复制到剪贴板！');
                });
            } else {
                alert("未提取到任何作品/用户链接！")
            }
        }, order);
    };

    const createContainer = () => {
        let container = document.createElement('div');
        container.id = 'xhsFunctionContainer';

        let imgTextContainer = document.createElement('div');
        imgTextContainer.id = 'xhsImgTextContainer';

        let img = new Image(48, 48); // 确保 icon 变量已定义
        img.src = icon;
        img.style.borderRadius = '50%';
        img.style.objectFit = 'cover';

        let textDiv = document.createElement('div');
        textDiv.id = 'xhsImgTextContainer__text'
        textDiv.textContent = 'XHS-Downloader';

        imgTextContainer.appendChild(img);
        imgTextContainer.appendChild(textDiv);

        container.appendChild(imgTextContainer);

        document.body.appendChild(container);
        return container;
    };

    const createButton = (id, text, onClick, ...args) => {
        let button = document.createElement('button');
        button.id = id;
        button.textContent = text;
        button.addEventListener('click', () => onClick(...args));
        return button;
    };

    const exclusionButton = ["xhsImgTextContainer", "About"];

    const updateContainer = buttons => {
        let container = document.getElementById('xhsFunctionContainer');
        if (!container) {
            container = createContainer();
        }

        // 移除除了 imgTextContainer 以外的所有子元素
        Array.from(container.children).forEach(child => {
            if (!exclusionButton.includes(child.id)) {
                child.remove();
            }
        });

        // 添加有效按钮
        buttons.forEach(button => {
            container.appendChild(button);
        });
    };

    const buttons = [createButton("Download", "下载无水印作品文件", extractDownloadLinks), createButton("Post", "提取发布作品链接", extractAllLinksEvent, 0), createButton("Collection", "提取收藏作品链接", extractAllLinksEvent, 1), createButton("Favorite", "提取点赞作品链接", extractAllLinksEvent, 2), createButton("Feed", "提取发现作品链接", extractAllLinksEvent, -1), createButton("Search", "提取搜索作品链接", extractAllLinksEvent, 3), createButton("User", "提取搜索用户链接", extractAllLinksEvent, 4), createButton("Disclaimer", "脚本说明及免责声明", readme,), createButton("About", "关于 XHS-Downloader", about,),];

    const run = url => {
        setTimeout(function () {
            if (!disclaimer) {
            } else if (url === "https://www.xiaohongshu.com/explore" || url.includes("https://www.xiaohongshu.com/explore?")) {
                updateContainer(buttons.slice(4, 5));
            } else if (url.includes("https://www.xiaohongshu.com/explore/")) {
                updateContainer(buttons.slice(0, 1));
            } else if (url.includes("https://www.xiaohongshu.com/user/profile/")) {
                updateContainer(buttons.slice(1, 4));
            } else if (url.includes("https://www.xiaohongshu.com/search_result")) {
                updateContainer(buttons.slice(5, 7));
            }
        }, 500)
    }

    let currentUrl = window.location.href;

    updateContainer(buttons.slice(7));

    // 初始化容器
    run(currentUrl)

    // 设置 MutationObserver 来监听 URL 变化
    let observer
    if (disclaimer) {
        observer = new MutationObserver(function () {
            if (currentUrl !== window.location.href) {
                currentUrl = window.location.href;
                run(currentUrl);
            }
        });
        const config = {childList: true, subtree: true};
        observer.observe(document.body, config);
    }

    const buttonStyle = `
    #xhsFunctionContainer {
        position: fixed;
        right: 0;
        bottom: 15%;
        background-color: #fff;
        color: #2f3542;
        padding: 5px 10px;
        border-radius: 32px 0 0 32px;
        box-shadow: 0 3.2px 12px #00000014, 0 5px 24px #0000000a;
        transition: width 0.25s ease-in-out, border-radius 0.25s ease-in-out, height 0.25s ease-in-out;
        overflow: hidden;
        white-space: nowrap;
        width: 65px; /* 初始宽度 */
        height: 60px;
        text-align: center;
        font-size: 16px;
        display: flex;
        flex-direction: column-reverse;
        z-index: 99999;
    }
    
    #xhsFunctionContainer:hover {
        padding: 10px 10px 5px 10px;
        width: 210px; /* hover时的宽度 */
        height: auto;
    }

    #xhsFunctionContainer button {
        cursor: pointer;
        height: 48px;
        color: #ff4757;
        font-size: 14px;
        font-weight: 600;
        border-radius: 32px;
        margin-bottom: 14px;
        border: 3px #ff4757 solid;
    }
    
    #xhsFunctionContainer button:active {
        background-color: #ff4757; /* 点击时的背景颜色 */
    }
    
    #xhsImgTextContainer {
        display: flex;
        align-items: center;
        gap: 14px;
    }
    
    #xhsImgTextContainer__text {
        font-size: 14px;
        font-weight: 600;
    }
    `;

    const head = document.head || document.getElementsByTagName('head')[0];
    const style = document.createElement('style');
    head.appendChild(style);

    style.type = 'text/css';
    style.appendChild(document.createTextNode(buttonStyle));
    console.info("用户接受 XHS-Downloader 免责声明", disclaimer)
})();
