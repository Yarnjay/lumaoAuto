# NEXUS
网址：https://app.nexus.xyz/

### 启动

1、打开网页：访问 https://app.nexus.xyz/ <br/>
2、打开开发者工具：在 Chrome 中，右键点击网页并选择“检查”或按 F12。<br/>
3、切换到控制台：选择“Console/控制台”标签。<br/>
4、粘贴代码：将上面的代码粘贴到“Console/控制台”中。<br/>
5、执行代码：按下 Enter 键运行代码。<br/>

### 停止
关闭打开 nexus 的网页页签即可

### 代码
```
// 定义变量存储 setInterval 的返回值
const clickButtonInterval = setInterval(() => {
    clickButton();
}, 30*1000); // 每 30 秒检查一次

// 创建一个函数来点击按钮
function clickButton() {
    const currentTime = new Date().toLocaleString();
    const statusElement = document.querySelector('p.text-center.text-white.font-bold');
    if (statusElement) {
        const button = document.getElementById('connect-toggle-button');
        if (button) {
            button.click();
            console.log(`[${currentTime}] ！！！已重启！！！`);
        } else {
            console.log('未找到按钮');
        }
    };
    //console.log(`[${currentTime}]`);
}

// 启动监控
clickButton()
```
