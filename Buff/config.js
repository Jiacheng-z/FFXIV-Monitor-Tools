'use strict';

let Options = {
    Language: 'cn',

    // DOT相关配置
    DotIconWidth: 44, // DOT图标宽度
    DotIconHeight: 32, // DOT图标高度
    DotBarHeight: 5, // DOT下进度条高度

    // 团辅相关配置
    BigBuffIconWidth: 32,//团辅监控图标宽度（像素）
    BigBuffIconHeight: 20, // 团副监控图标高度（像素）
    BigBuffBorderSize: 0,// 团副监控边框尺寸（像素）
    BigBuffBar30sWidth: function () { // 团辅进度条30s团辅长度
        return document.getElementsByTagName('body')[0].clientWidth - this.BigBuffIconWidth - 5
    },
    TTS: true, // 是否使用tts播报


    // BigBuffShowCooldownSeconds: 20, // 显示团辅冷却倒计时最小时间

    PerBuffOptions: {
    },
};