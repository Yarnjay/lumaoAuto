#!/bin/bash

#AIOS_KERNEL="/Applications/Hyperspace.app/Contents/MacOS/Hyperspace"
APP_LOG_FILE="/tmp/aios/aios-Hyperspace.log"
MONITOR_LOG_FILE="/tmp/aios/aios-monitor.log"
SCRIPT_NAME=$(basename $(readlink -f $0 2>/dev/null || echo $0))

# 创建临时目录
[ ! -d "/tmp/aios" ] && mkdir -p /tmp/aios

# 主菜单函数
function main_menu() {
    while true; do
        clear
        check
        echo "================================================================"
        echo "退出脚本，请按键盘 ctrl + C 退出即可"
        echo "请选择要执行的操作:"
        echo "1. 启动监控"
        echo "2. 关闭监控"
        echo "3. 查看APP运行的日志（单次）"
        echo "4. 查看APP运行的日志（持续监控）"
        echo "5. 查看监控脚本的日志"
        echo "6. 退出脚本"
        echo "================================================================"
        read -p "请输入选择 (1/2/3/4/5/6): " choice

        case $choice in
            1)  run_monitor ;;
            2)  close_monitor ;;
            3)  view_app_logs ;;
            4)  view_app_auto_logs;;
            5)  view_monitor_logs ;;
            6)  exit_script ;;
            *)  echo "无效选择，请重新输入！"; sleep 2 ;;
        esac
    done
}

function check() {

    if [ "$SCRIPT_NAME" != "aios-apple-monitor.sh" ]; then
        echo "出错了，脚本名称必须为 aios-apple-monitor.sh 请修改文件名称！"
        echo "当前脚本名称为：$SCRIPT_NAME"
        exit 0
    fi

    if ps -efw | grep "aios-apple-monitor.sh monitor" | grep -v grep > /dev/null; then
       echo "运行状态：✅（监控脚本运行中）"
    else
       echo "运行状态：❌（监控脚本未运行）"
    fi
}

function start_aios() {
    echo "$(date "+%Y-%m-%d %H:%M:%S"): 清理旧日志..." > "$APP_LOG_FILE"
    # 关闭APP
    ps -efw | grep "/Applications/Hyperspace.app/Contents/MacOS/Hyperspace" | grep -v grep | awk '{print $2}' | xargs kill
    # 重新启动APP
    nohup "/Applications/Hyperspace.app/Contents/MacOS/Hyperspace" > $APP_LOG_FILE 2>&1 &
    sleep 6
}

# 启动监控
function start_monitor() {
    echo "$(date "+%Y-%m-%d %H:%M:%S"): 监控程序已启动，自动监控中..." >> $MONITOR_LOG_FILE
    mkdir -p /tmp/aios

    # 重启APP确保时使用后台方式启动
    start_aios
    MIN_RESTART_INTERVAL=300
    LAST_RESTART_TIME=$(date +%s)
    LAST_ERROR_TIME=0
    while true; do
        current_time=$(date +%s)
        if ! ps -efw | grep "/Applications/Hyperspace.app/Contents/MacOS/Hyperspace" | grep -v grep > /dev/null; then
            start_aios
        fi

        # 定义错误模式
        error_patterns="Endpoint request timed out|Internal server error|Error while reconnecting|Last pong received.*Sending reconnect signal|Failed to authenticate|Failed to connect to Hive|Another instance is already running"

        # 获取日志文件最后 4 行
        last_log=$(tail -n 4 "$APP_LOG_FILE")

        # 检查错误并重启服务
        if echo "$last_log" | grep -Eq "$error_patterns" && [ $((current_time - LAST_RESTART_TIME)) -gt $MIN_RESTART_INTERVAL ]; then
            echo "$(date "+%Y-%m-%d %H:%M:%S"): 检测到错误,正在重启服务..." >> $MONITOR_LOG_FILE
            # 启动 aios
            start_aios

            LAST_RESTART_TIME=$current_time
            echo "$(date "+%Y-%m-%d %H:%M:%S"): 服务已重启" >> $MONITOR_LOG_FILE

            sleep 3
            continue
        fi
#        continue

        # 获取最后1行日志
        last_log=$(tail -n 1 "$APP_LOG_FILE")

        last_log_time_str=$(echo $last_log | awk -F'[][]' '{print $4}')
        last_log_time_unix=$(date -j -f "%Y-%m-%d %H:%M:%S" "${last_log_time_str}" +%s 2>/dev/null || echo "error")

#        echo last_log_time_unix=${last_log_time_unix} date -j -f "%Y-%m-%d %H:%M:%S" "${last_log_time_str}" +%s  >> $MONITOR_LOG_FILE

        # 用于判断日志是否一直卡住，若卡住也判断为断连了
        if [[ "$last_log_time_unix" == "error" ]] ; then
          if [ "$LAST_ERROR_TIME" == "0" ]; then
            LAST_ERROR_TIME=$current_time
          fi
          last_log_time_unix=$LAST_ERROR_TIME
#          echo "$(date "+%Y-%m-%d %H:%M:%S"):  出错了，出错时间[ $(date -r $last_log_time_unix +"%Y-%m-%d %H:%M:%S") ]" >> $MONITOR_LOG_FILE
        else
          # 重置出错标志的时间
          LAST_ERROR_TIME=0
          # 转成 +8 的时间
          last_log_time_unix=$(( last_log_time_unix + 8*60*60 ))
        fi

        # 计算时间差（单位：秒）
        time_difference=$((current_time - last_log_time_unix))

        echo "$(date "+%Y-%m-%d %H:%M:%S"):获取到的最后日志时间[$last_log_time_str] +8 [$(date -r $last_log_time_unix +"%Y-%m-%d %H:%M:%S" )]  时间差=[$time_difference]秒" >> $MONITOR_LOG_FILE

        if [ $time_difference -gt $MIN_RESTART_INTERVAL ]; then
            LAST_ERROR_TIME=0
            start_aios
            echo "$(date "+%Y-%m-%d %H:%M:%S"):  重新启动，[$(date -r ${current_time} +"%Y-%m-%d %H:%M:%S")]-[$(date -r ${last_log_time_unix} +"%Y-%m-%d %H:%M:%S")]=${time_difference}" >> $MONITOR_LOG_FILE
        fi

        sleep 30
#       sleep 3
    done
}

function close_monitor() {
    ps -efw | grep "aios-apple-monitor.sh monitor" | grep -v grep | awk '{print $2}' | xargs kill
    echo "已退出监控。"
    sleep 2
    main_menu
    # && ps -efw | grep "/Applications/Hyperspace.app/Contents/MacOS/Hyperspace" | grep -v grep | awk '{print $2}' | xargs kill
}

function run_monitor() {
    ps -efw | grep "aios-apple-monitor.sh monitor" | grep -v grep | awk '{print $2}' | xargs kill
    nohup ./aios-apple-monitor.sh monitor > /tmp/aios/aios-monitor.log 2>&1 &
}

# 查看日志
function view_app_logs() {
    echo "正在查看日志..."

    if [ -f "$APP_LOG_FILE" ]; then
        echo "显示日志的最后 200 行:"
        tail -n 200 "$APP_LOG_FILE"   # 显示最后 200 行日志
    else
        echo "日志文件不存在: $APP_LOG_FILE"
    fi

    # 提示用户按任意键返回主菜单
    read -n 1 -s -r -p "按任意键返回主菜单..."
    main_menu
}

function view_app_auto_logs() {
    if [ -f "$APP_LOG_FILE" ]; then
        echo "持续监控日志，按CRTL+C退出"
        sleep 2

        tail -f "$APP_LOG_FILE"   # 显示最后 200 行日志
    else
        echo "日志文件不存在: $APP_LOG_FILE"
    fi

}

# 查看日志
function view_monitor_logs() {
    echo "正在查看日志..."

    if [ -f "$MONITOR_LOG_FILE" ]; then
        echo "显示日志的最后 200 行:"
        tail -n 200 "$MONITOR_LOG_FILE"   # 显示最后 200 行日志
    else
        echo "日志文件不存在: $MONITOR_LOG_FILE"
    fi

    # 提示用户按任意键返回主菜单
    read -n 1 -s -r -p "按任意键返回主菜单..."
    main_menu
}

# 退出脚本
function exit_script() {
    echo "退出脚本..."
    exit 0
}



if [ "$1" = "monitor" ]; then
    start_monitor
else
    main_menu
fi