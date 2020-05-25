# FFXIV-Monitor-Tools
FFXIV监控工具

## 团辅Buff计算监控

计算目前团辅提供的增伤. 如果是诗人会计算buff刷新时机, 以及当前DOT快照的增伤情况.

![image](buff_show.gif)

### 使用方式：
- 依赖ACT插件: cacbot + ngld.
- 添加新的自定悬浮窗.
- 在悬浮窗路径中填写：`https://jiacheng-z.github.io/FFXIV-Monitor-Tools/Buff/buff.html`

### 游戏内测试
使用宏: `/e :test:jobs:`

### 个性化配置
使用url参数进行配置修改.

样例: 

开启秒数参考+关闭TTS+DOT样式修改: `https://jiacheng-z.github.io/FFXIV-Monitor-Tools/Buff/buff.html?brdsec=1&tts=0&dotstyle=44,32`

参数:
- 开关类:
    - `brdsec`: 是否展示诗人DOT刷新秒数参考. 1: 展示, 0: 隐藏. 默认: 0(隐藏)
    - `tts`: 是否使用TTS进行团辅出现提示. 1: 提醒, 0: 静音. 默认: 1(提醒)
- 样式类：
    - `buffmaxwidth`: 团辅进度条最大长度. 数值(number)  默认: `250`, 页面宽度小于250px时会自适应.
    - `buffstyle`: 团辅展示样式. 字符串(string)  格式: `<图标宽>,<图标高>,<边框>` 默认: `32,20,0`
    - `dotstyle`: DOT图标样式. 字符串(string) 格式: `<图标宽>,<图标高>,<进度条高>,<边框>` 默认: `32,25,5,1`
    - `phystyle`: 物攻文字样式. 字符串(string) 格式: `<字号>,<颜色>` 默认: `20,ff8129`
    - `magstyle`: 魔攻文字样式. 字符串(string) 格式: `<字号>,<颜色>` 默认: `20,07d5ee`
    - `brdsecstyle`: 诗人刷新参考文字样式. 字符串(string) 格式: `<字号>,<颜色>` 默认: `20,white`