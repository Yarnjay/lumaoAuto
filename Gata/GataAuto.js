// ==UserScript==
// @name         GataAuto
// @namespace    https://app.gata.xyz/
// @version      v20250429-2
// @description  Gata 自动脚本
// @author       YuanJay
// @match        https://app.gata.xyz/*
// @icon         https://www.gata.xyz/logo.svg
// @grant        none
// @updateURL    https://github.com/Yarnjay/lumaoAuto/blob/master/Gata/GataAuto.js
// @downloadURL  https://github.com/Yarnjay/lumaoAuto/blob/master/Gata/GataAuto.js
// @license      AGPL-3.0-only
// ==/UserScript==

(function() {
    'use strict';
    const minutes = 60 * 1000;
    const seconds = 1 * 1000;

    // 单位：分钟； 断联超时重新刷新页面的时间
    const disconnectTimeout = random(5, 15) * minutes;
    //单位：秒；取随机数，页面加载后等待一段时间在连，建议最小5秒以上；
    const loadDelay = random(5, 10) * seconds;
    // 单位：秒； 状态检测间隔，不建议修改
    const checkDelay = 10 * seconds;

    // 日志面板全局变量
    const originalLog = console.log;
    const logPanel = document.createElement('div');

    let startTime = 0
    let firstClickButton = true;
    let stuckTime = 0
    let startJobs = 0

    console.log('等待[' + msToCNString(loadDelay) + ']后开始启动...');
    setTimeout(() => {
        // 初始化日志面板
        initLog();
        console.log("logPanel");
        main()
    }, loadDelay);

    function main() {
        let lastStats = { jobs: null };
        let runingTimeDiff = 0; // 运行时长

        (async function() {
            const result = await clickButton();
            if (result) {
                console.log("按钮点击成功，继续执行后续操作...");
                const interval = setInterval(() => {
                    runingTimeDiff = Date.now() - startTime
                    const currentStats = getStats();
                    // console.log(`startJobs=${startJobs}, currentStats.jobs=${currentStats.jobs}`);
                    console.log(`[状态更新] 已运行[${msToCNString(runingTimeDiff)}] | Completed ${currentStats.jobs - startJobs} Jobs`);

                    if (currentStats.jobs === lastStats.jobs) {
                        if (stuckTime === 0) {
                            stuckTime = Date.now();
                        };

                        const stuckTimeDiff = Date.now() - stuckTime;
                        // 当卡顿时长达到配置重连时间的 50% 时开始输出报警日志
                        if (stuckTimeDiff >= disconnectTimeout * 0.5) {
                            console.log(`[卡顿警告] 已卡顿${msToCNString(stuckTimeDiff)}, ${msToCNString(disconnectTimeout - stuckTimeDiff)}后刷新页面！`);
                            location.reload();
                        }
                    } else {
                        stuckTime = 0
                        lastStats = currentStats;
                    };
                }, checkDelay);
            } else {
                console.log("按钮点击失败，停止执行。");
            };
        })();

    };

    function getStats() {
        const jobsElm = document.querySelector('span.text-\\[18px\\].leading-\\[21\\.78px\\].text-aggGrey800');
        const jobs = (jobsElm) ? jobsElm.textContent.trim() : null;
        // console.log(jobs)

        if (jobs === null) { return null;};
        return { jobs: +jobs };
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

    function msToCNString(ms) {
        const seconds = Math.floor(ms / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        let result = "";
        if (hours > 0) {
            let hours = (hours >= 10) ? hours : `0${hours}`;
            result = `${hours}小时`;
        }
        if (minutes > 0) {
            let minutes = (minutes >= 10) ? minutes : `0${minutes}`;
            result = result + `${minutes}分钟`;
        }
        if (minutes > 0) {
            let remainingSeconds = (remainingSeconds >= 10) ? remainingSeconds : `0${remainingSeconds}`;
        }
        return result + `${remainingSeconds}秒`;
    };


})();