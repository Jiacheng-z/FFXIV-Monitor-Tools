'use strict';

let Options = {
    Language: 'cn',

    // 文字相关
    TextPhysicalTextColor: '#ff8129', // 物理文字颜色
    TextPhysicalFontSize: 20, // 物理文字大小px
    TextMagicTextColor: '#07d5ee', // 魔法文字颜色
    TextMagicFontSize: 20, // 魔法文字大小px

    TextBrdSec: false, // 诗人展示dot刷新秒数
    TextBrdSecTextColor: 'white', // 文字颜色
    TextBrdSecFontSize: 20, // 物理文字大小px

    // DOT相关配置
    DotIconWidth: 32, // DOT图标宽度
    DotIconHeight: 25, // DOT图标高度
    DotBarHeight: 5, // DOT下进度条高度
    DotBorderSize: 1, // DOT边框
    // DotBarDuration: false, // 是否展示DOT进度条倒计时 true 展示， false 不展示
    DotNoticeLessThanSecond: 7, // <0 取消提醒, >0 剩余n秒时提醒
    DotNoticeTTS: "续DoT", // 提醒语音

    // 团辅相关配置
    BigBuffIconWidth: 32,//团辅监控图标宽度（像素）
    BigBuffIconHeight: 20, // 团副监控图标高度（像素）
    BigBuffBorderSize: 0,// 团副监控边框尺寸（像素）
    BidBuffBarMaxWidth: 250, // 30秒团辅进度条最大宽度
    BigBuffBar30sWidth: function () { // 团辅进度条30s团辅长度 (自动获取当前页面宽度)
        let autoWidth = document.getElementsByTagName('body')[0].clientWidth - this.BigBuffIconWidth - (this.DotIconWidth + 1) - 5;
        if (autoWidth > this.BidBuffBarMaxWidth) {
            return this.BidBuffBarMaxWidth
        }
        return autoWidth;
    },
    TTS: true, // 是否使用tts播报
    DOT: true, // 是否展示DOT

    // BigBuffShowCooldownSeconds: 20, // 显示团辅冷却倒计时最小时间

    PerBuffOptions: {},
};