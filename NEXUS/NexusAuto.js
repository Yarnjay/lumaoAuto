// ==UserScript==
// @name         NexusAuto
// @namespace    https://app.nexus.xyz/
// @version      v20250429-1
// @description  Happy day
// @author       YuanJay
// @match        https://app.nexus.xyz/*
// @icon         https://app.nexus.xyz/favicon.ico
// @grant        none
// @license      AGPL-3.0-only
// @charset		 UTF-8

// ==/UserScript==

(function() {
    'use strict';

    // 创建日志面板
    const logPanel = document.createElement('div');
    Object.assign(logPanel.style, {
        position: 'fixed',
        right: '10px',
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

    setTimeout(() => {
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

        // 定义变量存储 setInterval 的返回值
        const interval = setInterval(() => {
            clickButton();
        }, 10 * 1000); // 每 10 秒检查一次
    }, 3 * 1000);

    // 创建一个函数来点击按钮
    function clickButton() {
        const currentTime = new Date().toLocaleString();
        const noConnect = document.querySelector('p.text-center.text-white.font-bold');
        const btn = document.getElementById('connect-toggle-button');
        const speedElm = document.querySelector('#speed-display');
        const balanceElm = document.querySelector('#balance-display');

        if (noConnect) {
            if (btn) {
                btn.click();
                console.log(`${currentTime} [重启] 已自动重启`);
            } else {
                console.log(`${currentTime} [错误] 监控出错了，请联系管理员[未找到按钮]`);
            }
        };

        let speed = (speedElm) ? speedElm.textContent.trim() : 0;
        let balance = (balanceElm) ? balanceElm.textContent.trim() : 0;

        console.log(`${currentTime} [监控中] Balance：${balance}Points | Speed：${speed}Cycles/s`);
    };

})();