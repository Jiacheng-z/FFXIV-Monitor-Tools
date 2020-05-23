'use strict';

let Options = {
    Language: 'cn',

    // 文字相关
    TextPhysicalTextColor: '#ff8129', // 物理文字颜色
    TextPhysicalFontSize: 20, // 物理文字大小px
    TextMagicTextColor: '#07d5ee', // 魔法文字颜色
    TextMagicFontSize: 20, // 魔法文字大小px

    TextBrdSec: false, // 诗人展示dot刷新秒数

    // DOT相关配置
    DotIconWidth: 32, // DOT图标宽度
    DotIconHeight: 25, // DOT图标高度
    DotBarHeight: 5, // DOT下进度条高度

    // 团辅相关配置
    BigBuffIconWidth: 32,//团辅监控图标宽度（像素）
    BigBuffIconHeight: 20, // 团副监控图标高度（像素）
    BigBuffBorderSize: 0,// 团副监控边框尺寸（像素）
    BigBuffBar30sWidth: function () { // 团辅进度条30s团辅长度 (自动获取当前页面宽度)
        return document.getElementsByTagName('body')[0].clientWidth - this.BigBuffIconWidth - (this.DotIconWidth+1) - 5
    },
    TTS: true, // 是否使用tts播报

    // BigBuffShowCooldownSeconds: 20, // 显示团辅冷却倒计时最小时间

    PerBuffOptions: {
    },
};