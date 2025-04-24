# ONProver
网址：https://onprover.orochi.network/

### 启动

1、打开网页：访问 https://onprover.orochi.network/。<br/>
2、打开开发者工具：在 Chrome 中，右键点击网页并选择“检查”或按 F12。<br/>
3、切换到控制台：选择“Console/控制台”标签。<br/>
4、粘贴代码：将上面的代码粘贴到“Console/控制台”中。<br/>
5、执行代码：按下 Enter 键运行代码。<br/>

### 停止
方法 1：关闭打开onprover的网页页签即可<br/>
方法 2：在“Console/控制台”中执行：`stop()；`<br/>
方案 3：刷新页面，重新加载即可停止<br/>


### 代码
```
const interval = 3 * 60 * 1000; // 每X分钟重启一次

// 定义变量存储 setInterval 的返回值
const clickButtonInterval = setInterval(() => {
    clickButton();
}, interval);

// 创建一个函数来点击按钮
function clickButton() {
    const button = document.querySelector('button.group');
    button.click(); // 点击按钮

    let startTime = Date.now(); // 获取当前时间戳
    let stopCount = 0; // 计数器，记录“Stop proving”的次数

    // 使用 setInterval 定期检查按钮状态
    const checkButtonStatus = setInterval(() => {
        let currentTime = new Date().toLocaleString();

        // 检查按钮状态
        if (stopCount >= 2) {
            clearInterval(checkButtonStatus); // 停止检查
            return; // 退出函数
        }

        switch (button.textContent) {
            case 'prover':
                console.log(`${currentTime} 点击启动`);
                button.click();
                break;
            case 'Canceling...':
                console.log(`${currentTime} 取消中...`);
                break;
            case 'Compiling ...':
                console.log(`${currentTime} 启动中...`);
                break;
            case 'Stop proving':
                stopCount++; // 增加计数器
                console.log(`${currentTime} 启动成功，计数: ${stopCount}`);
                break;
            default:
                console.log(`未知的按钮状态: ${button.textContent}`);
                break; // 确保 default 语句后有 break
        }
    }, 1000); // 每 1 秒检查一次按钮状态

}

// 停止定时器的函数
function stop() {
    clearInterval(clickButtonInterval);
    console.log('监控已停止.');
}

// 启动监控
clickButton();
```
