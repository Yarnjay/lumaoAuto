// ==UserScript==
// @name         ONProverAuto
// @namespace    https://onprover.orochi.network/
// @version      v20250430-2
// @description  ONProver 全自动重连脚本
// @author       YuanJay
// @match        https://onprover.orochi.network/*
// @icon         https://onprover.orochi.network/downasaur.svg
// @grant        none
// @updateURL    https://github.com/Yarnjay/lumaoAuto/blob/master/ONProver/ONProverAuto.js
// @downloadURL  https://github.com/Yarnjay/lumaoAuto/blob/master/ONProver/ONProverAuto.js
// @license      AGPL-3.0-only
// ==/UserScript==

(function() {
    'use strict';
    const disconnectTimeout = getRandom(10, 30); // 单位：分钟； 断联超时重新刷新页面的时间

    const pageLoadDelay = getRandom(8, 15);	//单位：秒；8秒 到 15秒取随机数，页面加载后等待一段时间在连，建议8秒以上；
    const checkDelay = 10; // 单位：秒； 状态检测间隔，不建议修改
    let startTime = 0;


    // 创建日志面板
    const logPanel = document.createElement('div');
    Object.assign(logPanel.style, {
        position: 'fixed',
        left: '10px',
        bottom: '10px',
        width: '700px',
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

    // 将日志面板添加到文档中
    document.body.appendChild(logPanel);

    // 保留原始console.log
    const originalLog = console.log;

    // 重写日志方法
    console.log = function(...args) {
        // 原始日志输出
        originalLog.apply(console, args);

        // 面板日志输出
        const logEntry = document.createElement('div');
        logEntry.textContent = args.join(' ');
        logPanel.appendChild(logEntry);

        // 自动滚动和限制条目
        logPanel.scrollTop = logPanel.scrollHeight;
        if(logPanel.childElementCount > 80) {
            logPanel.removeChild(logPanel.firstChild);
        }
    };


    // title.textContent = '断联' + ${disconnectTimeout} + '分钟后刷新'

    console.log("ONProverAuto脚本加载中...")
    start();

    function start() {
        let lastStats = { earned: null, proofs: null, new: null };
        let stuckCounter = 0;
        let stuckTime = 0;

        // 等待页面加载完成后再启动
        console.log('等待[' + formatToChineseTime(pageLoadDelay * 1000) + ']后开始启动...');

        setTimeout(() => {
            console.log(`${currentTime()} 页面加载完成，自动点击[Prover]按钮...`);

            // 使用 async/await 调用
            (async function() {
                const result = await clickProverButton();
                if (result) {
                    console.log(`${currentTime()} 按钮点击成功，继续执行后续操作...`);
                    const interval = setInterval(() => {
                        const current = getStatus();
                        const timeDiff = Date.now() - startTime
                        console.log(`${currentTime()} [状态更新] 收益: ${current.earned} | 验证: ${current.proofs} | 新增: ${current.new} ｜ 已运行[${formatToChineseTime(timeDiff)}]`);

                        if (
                            current.earned === lastStats.earned &&
                            current.proofs === lastStats.proofs &&
                            current.new === lastStats.new
                        ) {
                            stuckCounter++;
                            stuckTime = stuckCounter * checkDelay * 1000

                            if (stuckTime >= 2 * 60 * 1000) {
                                console.log(`${currentTime()} [卡顿警告] ${formatToChineseTime(stuckTime)} 无变化, ${formatToChineseTime(disconnectTimeout * 60 * 1000 - stuckTime)}后重启！`);
                            }

                        } else {
                            stuckCounter = 0;
                            lastStats = current;
                        }

                        if (stuckTime >= disconnectTimeout * 60 * 1000) {
                            console.log(`${currentTime()} [页面刷新] 检测到[${formatToChineseTime(stuckCounter * checkDelay * 1000)}]无响应，正在刷新...`);
                            location.reload();
                        }

                    }, checkDelay * 1000);
                } else {
                    console.log(`${currentTime()} 按钮点击失败，停止执行。`);
                    return;
                }
            })();

        }, pageLoadDelay * 1000);

    };

    function getRandom(min, max) {
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

    // 补零
    function zeroPad(n) {
        return n.toString().padStart(2, '0');
    };

    function currentTime () {
        return new Date().toLocaleString();
    };

    function getStatus() {
        const stats = document.querySelectorAll('p.text-24');
        if (stats.length < 3) return null; // 确保至少有三个统计项
        return {
            earned: stats[0].textContent.trim(),
            proofs: stats[1].textContent.trim(),
            new: stats[2].textContent.trim(),
        };
    };

    async function clickProverButton(retry = 6) {
        const btn = document.querySelector('button.group');
        if (!btn) {
            console.error(`${currentTime()} [错误] 未找到按钮`);
            return false;
        }
        const intervalTime = getRandom(2, 5) * 1000;
        btn.click();
        let attempts = 0;

        return new Promise((resolve) => {
            const interval = setInterval(() => {
                const btnText = btn.textContent.trim().toLowerCase();
                switch (btnText) {
                    case 'prover':
                        console.log(`${currentTime()} 点击 Prover 按钮...`);
                        btn.click();
                        break;
                    case 'canceling...':
                        console.log(`${currentTime()} 取消中...`);
                        attempts = 0;
                        break;
                    case 'compiling ...':
                        console.log(`${currentTime()} 启动中...`);
                        attempts = 0;
                        break;
                    case 'stop proving':
                        startTime = Date.now();
                        clearInterval(interval);
                        resolve(true); // 结束时解析 Promise
                        break;
                    default:
                        console.log(`${currentTime()} [失败] 未知的按钮状态: ${btnText}`);
                        break;
                }
                attempts++;
                if (attempts >= retry) {
                    console.log(`${currentTime()} [失败] 多次尝试未找到按钮`);
                    clearInterval(interval);
                    resolve(false); // 失败时解析 Promise
                }
            }, intervalTime);
        });
    };

})();