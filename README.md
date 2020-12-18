# FFXIV-Monitor-Tools
FFXIV监控工具

## 团辅Buff计算监控

计算目前团辅提供的增伤. 如果是诗人会计算buff刷新时机, 以及当前DOT快照的增伤情况.

![image](buff_show.gif)

### 使用方式：
- 依赖ACT插件: cacbot + ngld.
- 添加新的自定悬浮窗.
- 在悬浮窗路径中填写：`https://jiacheng-z.github.io/FFXIV-Monitor-Tools/Buff/buff.html`

### DOT提示说明
- DOT的剩余TTS提示目前仅针对以下职业技能有效: `诗人:狂风蚀箭`, `白魔:天辉`, `学者:蛊毒法`, `占星:焚灼`, `武士:彼岸花`, `黑魔:暴雷`, `召唤:剧毒菌`
- 剩余职业DOT技能没有添加原因多为`必要性不大`或`DOT本身持续时间太短(骑士)`或`规划在正常循环中(如武僧)`

### 游戏内测试
使用宏: `/e :test:jobs:`

### 个性化配置
使用url参数进行配置修改.

样例: 

开启秒数参考+关闭TTS+DOT样式修改: `https://jiacheng-z.github.io/FFXIV-Monitor-Tools/Buff/buff.html?brdsec=1&tts=0&dotstyle=44,32`

参数:
- 开关类:
    - `tts`: 是否使用TTS进行团辅出现提示. 1: 提醒, 0: 静音. 默认: 1(提醒)
    - `dot`: 是否展示DOT增伤信息. 1: 展示, 0: 不展示. 默认: 1(展示)
    - `brdsec`: 是否展示诗人DOT刷新秒数参考. 1: 展示, 0: 隐藏. 默认: 0(隐藏)
- 样式类：
    - `scaling`: 悬浮窗元素缩放比例整体调整, 如果你是2K屏幕简易调整到 `125`. 数值(number) 默认: `100`
    - `buffmaxwidth`: 团辅进度条最大长度. 数值(number)  默认: `250`, 页面宽度小于250px时会自适应.
    - `buffstyle`: 团辅展示样式. 字符串(string)  格式: `<图标宽>,<图标高>,<边框>` 默认: `32,20,0`
    - `dotstyle`: DOT图标样式. 字符串(string) 格式: `<图标宽>,<图标高>,<进度条高>,<边框>` 默认: `32,25,5,1`
    - `phystyle`: 物攻文字样式. 字符串(string) 格式: `<字号>,<颜色>` 默认: `20,ff8129`
    - `magstyle`: 魔攻文字样式. 字符串(string) 格式: `<字号>,<颜色>` 默认: `20,07d5ee`
    - `brdsecstyle`: 诗人刷新参考文字样式. 字符串(string) 格式: `<字号>,<颜色>` 默认: `20,white`
- DOT(新增)
    - `dotnoticeless`: DOT剩余时间小于N秒时触发TTS语音提示. 数值(number) 默认: `7`.  说明: 当值<=0时，关闭提示。
    - `dotnoticetts`: DOT结束前TTS提示的文本内容. 字符串(string) 默认: `续DoT`. 建议修改为 `续buff` 或其他你自己喜欢的语音. 续DoT的发音很怪, 但是为了保证正确性, 默认值不得不设置成这个.. 请大家自行修改吧.. 