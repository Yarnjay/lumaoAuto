// ==UserScript==
// @name         ONProverAuto
// @namespace    https://onprover.orochi.network/
// @version      2025-04-24
// @description  Happy day
// @author       YuanJay
// @match        https://onprover.orochi.network/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net.cn
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    init();
    function init() {
        let pageLoadDelay = getRandomSeconds(8, 15) * 1000;	//页面加载完成后多长时间执行
        let checkDelay = 2 * 1000; // 2 秒检查 1 次按钮的状态
        let refreshDelay = getRandomSeconds(30, 60) * 60 * 1000;	//页面加载完成后多长时间执行

        console.log('等待[' + convertMilliseconds(pageLoadDelay) + ']后开始启动...');

        setTimeout(() => {
            console.log('页面加载完成');

            let startTime = Date.now();
            let vbutton = document.querySelector('button.group');

            // console.log(vbutton)
            // console.log(vbutton.textContent)
            const buttonStatus = setInterval(() => {
                let currentTime = new Date().toLocaleString();
                let timeDiff = Date.now() - startTime

                if (timeDiff >= refreshDelay) {
                    console.log(`${currentTime} 重新刷新页面 timeDiff=${timeDiff} ｜ refreshDelay=${refreshDelay} ｜${timeDiff >= refreshDelay} ...`)
                    location.reload();
                    // console.log('重新刷新页面...')
                }
                switch (vbutton.textContent) {
                    case 'prover':
                        console.log(`${currentTime} 点击启动`);
                        startTime = Date.now();
                        vbutton.click();
                        break;
                    case 'Canceling...':
                        console.log(`${currentTime} 取消中...`);
                        break;
                    case 'Compiling ...':
                        console.log(`${currentTime} 启动中...`);
                        break;
                    case 'Stop proving':
                        console.log(`${currentTime} 运行中，已运行[${convertMilliseconds(timeDiff)}] | 将在[${convertMilliseconds(refreshDelay - (Date.now() - startTime))}]后重新启动`);
                        break;
                    default:
                        console.log(`未知的按钮状态: ${vbutton.textContent}`);
                        break; // 确保 default 语句后有 break
                }
            }, checkDelay);

        }, pageLoadDelay);
    };

    function getRandomSeconds(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    function convertMilliseconds(ms) {
        const seconds = Math.floor(ms / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        let result = "";
        if (hours > 0) {
            result = `${hours}小时`;
        }
        if (minutes > 0) {
            result = result + `${minutes}分钟`;
        }
        // if (remainingSeconds > 0) {
        //     result = result + `${remainingSeconds}秒`;
        // }
        return result + `${remainingSeconds}秒`;
    };
})();
