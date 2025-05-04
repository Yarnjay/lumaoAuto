// ==UserScript==
// @name         GataAuto
// @namespace    https://app.gata.xyz/
// @version      v20250504-1
// @description  Gata 全自动重连脚本
// @author       YuanJay
// @match        https://app.gata.xyz/*
// @icon         https://www.gata.xyz/logo.svg
// @grant        none
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// @updateURL    https://github.com/Yarnjay/lumaoAuto/blob/master/Gata/GataAuto.js
// @downloadURL  https://github.com/Yarnjay/lumaoAuto/blob/master/Gata/GataAuto.js
// @license      AGPL-3.0-only
// ==/UserScript==

(function() {
    'use strict';
    const minutes = 60 * 1000;
    const seconds = 1 * 1000;

    // ######  告警信息配置 ########
    const wecom = true //true 或者 false ，true时开启通过企业微信的应用接收告警
    const wecomAPIUrl = ""; // API URL
    const wecomAPIKey = ""; // 用户的 apikey
    const deviceName = ""; // 设备名称
    const appName = "Gata";

    // 单位：分钟； 断联超时重新刷新页面的时间
    const disconnectTimeout = random(5, 15) * random(1, 59) * seconds;
    const warningThreshold = 0.5; // 50%时触发告警的日志输出以及一次微信告警
    const reloadThreshold = 1; // 100%时触发自动刷新

    // 自动点击失败后重试的时间
    const clickAvailableReloadDelay = random(3, 6) * random(1, 59) * seconds;
    //单位：秒；取随机数，页面加载后等待一段时间在连，建议最小5秒以上；
    const loadDelay = random(5, 10) * seconds;
    // 单位：秒； 状态检测间隔，不建议修改
    const checkDelay = 10 * seconds;

    // 日志面板全局变量
    const originalLog = console.log;
    const logPanel = document.createElement('div');

    let startTime = 0;
    let stuckTime = 0;
    let startJobs = 0;
    let sendCount = 0;

    console.log('等待[' + formatToChineseTime(loadDelay) + ']后开始启动...');
    setTimeout(() => {
        // 禁用刷新时的弹窗提示
        window.addEventListener('beforeunload', function(event) {
            event.stopImmediatePropagation();
        });

        // 初始化日志面板
        initLog();
        main();
    }, loadDelay);

    function main() {
        let lastStats = { jobs: null };
        let runingTimeDiff = 0; // 运行时长

        (async function() {
            const result = await clickButton();
            if (result) {
                console.log("按钮点击成功，继续执行后续操作...");
                if (wecom) {sendWecomMessage(`✅ ${appName} | ${deviceName}\n成功启动！`);}

                const interval = setInterval(() => {
                    runingTimeDiff = Date.now() - startTime;
                    const currentStats = getStats();
                    // console.log(`startJobs=${startJobs}, currentStats.jobs=${currentStats.jobs}`);
                    const status = `共运行${formatToChineseTime(runingTimeDiff)} | Completed ${currentStats.jobs - startJobs} Jobs`;
                    console.log(`[状态更新] ${status}`);

                    if (currentStats.jobs === lastStats.jobs) {
                        if (stuckTime === 0) {
                            stuckTime = Date.now();
                        };
                        const stuckTimeDiff = Date.now() - stuckTime;
                        let remainingTime = disconnectTimeout - stuckTimeDiff;
                        if (remainingTime <= 0) {remainingTime = 0;};
                        const message = `已卡顿${formatToChineseTime(stuckTimeDiff)}, ${formatToChineseTime(remainingTime)}后刷新页面！`;

                        if (stuckTimeDiff >= disconnectTimeout * warningThreshold) {
                            console.log(`[卡顿警告] ${message}`);
                            if (wecom && (sendCount === 1 || sendCount % 5 === 0)) {
                                sendWecomMessage(`⚠️ ${appName} | ${deviceName} \n${message}\n${status}`);
                                sendCount++;
                            };
                        };

                        if (stuckTimeDiff >= disconnectTimeout * reloadThreshold) {
                            if (wecom) {sendWecomMessage(`${appName} | ${deviceName}：${message}\n${status}`)};
                            location.reload();
                        };
                    } else {
                        stuckTime = 0
                        lastStats = currentStats;
                    };
                }, checkDelay);
            } else {
                const warnMessage = `重启失败，${formatToChineseTime(clickAvailableReloadDelay)}后自动重试`
                console.log(warnMessage);
                if (wecom) {sendWecomMessage(`⚠️⚠️ ${appName} | ${deviceName}：\n重启失败，${formatToChineseTime(clickAvailableReloadDelay)}后自动重试\n可能已触发验证机制，需人工介入`);};
                setTimeout(() => {
                    location.reload();
                }, clickAvailableReloadDelay);
            };
        })();

    };

    function getStats() {
        const jobsElm = document.querySelector('span.text-\\[18px\\].leading-\\[21\\.78px\\].text-aggGrey800');
        const jobs = (jobsElm) ? jobsElm.textContent.trim() : null;
        // console.log(jobs)

        if (jobs === null || isNaN(Number(jobs))) { return null;};
        return { jobs: jobs };
    };

    async function clickButton(retry = 10) {
        let attempts = 0;

        return new Promise((resolve) => {
            const btn = document.querySelector('button.group');

            if (!btn) {
                console.error("[错误] 未找到按钮");
                return resolve(false); // 直接返回
            }

            btn.click();
            const interval = setInterval(() => {
                const state = getStats();

                if (state) {
                    if (startTime === 0) { // 只在第一次点击时记录时间
                        startTime = Date.now();
                        startJobs = state.jobs;
                    }
                    clearInterval(interval); // 成功后清除定时器
                    return resolve(true);
                }

                attempts++;
                if (attempts >= retry) {
                    console.log("[出错] 多次尝试未找到状态");
                    clearInterval(interval);
                    return resolve(false); // 失败时解析 Promise
                }
            }, 2000); // 直接使用毫秒数
        });
    }

    function initLog() {
        // 创建日志面板
        Object.assign(logPanel.style, {
            position: 'fixed',
            right: '10px',
            bottom: '10px',
            width: '850px',
            height: '200px',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: '10px',
            overflowY: 'auto',
            zIndex: 9999,
            borderRadius: '5px',
            fontSize: '12px',
            lineHeight: '1.5',
            fontFamily: 'monospace'
        });
        document.body.appendChild(logPanel);
        // 重写日志方法
        console.log = function(...args) {
            const now = new Date().toLocaleString();
            // 原始日志输出
            originalLog.apply(console, [`${now}`, ...args]);

            // 面板日志输出
            const logEntry = document.createElement('div');
            logEntry.textContent = `${now} ${args.join(' ')}`;
            logPanel.appendChild(logEntry);

            // 自动滚动和限制条目
            logPanel.scrollTop = logPanel.scrollHeight;
            if(logPanel.childElementCount > 80) {
                logPanel.removeChild(logPanel.firstChild);
            }
        };
    };

    function random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    function formatToChineseTime(ms) {
        if (isNaN(ms)) return "";

        const seconds = Math.floor(ms / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        const parts = [];
        if (hours > 0) parts.push(`${zeroPad(hours)}小时`);
        if (minutes > 0) parts.push(`${zeroPad(minutes)}分钟`);
        parts.push(`${zeroPad(remainingSeconds)}秒`);

        return parts.join('');
    };

    function zeroPad(n) { // 补零
        return n.toString().padStart(2, '0');
    };

    function sendWecomMessage(msg) {
        $.ajax({
            url: wecomAPIUrl,
            type: "POST",  // 建议明确指定请求方法
            headers: {
                'Content-Type': 'application/json',  // 注意大小写规范
                'X-API-Key': wecomAPIKey
            },
            data: JSON.stringify({  // 需要将数据转为JSON字符串
                'content': `${msg}\n${new Date().toLocaleString()}`,
            }),
            success: function(result) {
                console.log("发送成功:", result.responseText);
            },
            error: function(xhr, status, error) {
                console.log("❌发送失败:", error);
                console.error("发送失败:", error);
            }
        });
    };
})();
