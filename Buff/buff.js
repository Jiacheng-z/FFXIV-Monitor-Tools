'use strict';

// Regexes to be filled out once we know the player's name.
let kYouGainEffectRegex = null;
let kYouLoseEffectRegex = null;
let kYouUseAbilityRegex = null;
let kAnybodyAbilityRegex = null;
let kMobGainsEffectRegex = null;
let kMobLosesEffectRegex = null;
let kMobGainsOwnEffectRegex = null; // 自己给boss上的buff
let kMobLosesOwnEffectRegex = null; // 自己在boss身上丢失的buff

let kStatsRegex = Regexes.statChange();

let kGainSecondsRegex = Regexes.parse('for (\\y{Float}) Seconds\\.');

function gainSecondsFromLog(log) {
    let m = log.match(kGainSecondsRegex);
    if (m)
        return m[1];
    return 0;
}

let kGainSourceRegex = Regexes.parse(' from (\\y{Name}) for');

function gainSourceFromLog(log) {
    let m = log.match(kGainSourceRegex);
    if (m)
        return m[1];
    return null;
}

let kAbilitySourceRegex = Regexes.parse(' 1[56]:\\y{ObjectId}:(\\y{Name}):');

function abilitySourceFromLog(log) {
    let m = log.match(kAbilitySourceRegex);
    if (m)
        return m[1];
    return null;
}

class ComboTracker {
    constructor(comboBreakers, callback) {
        this.comboTimer = null;
        this.comboBreakers = comboBreakers;
        this.comboNodes = {}; // { key => { re: string, next: [node keys], last: bool } }
        this.startList = [];
        this.callback = callback;
        this.current = null;
        this.considerNext = this.startList;
    }

    AddCombo(skillList) {
        if (this.startList.indexOf(skillList[0]) == -1)
            this.startList.push(skillList[0]);

        for (let i = 0; i < skillList.length; ++i) {
            let node = this.comboNodes[skillList[i]];
            if (node == undefined) {
                node = {
                    id: skillList[i],
                    next: [],
                };
                this.comboNodes[skillList[i]] = node;
            }
            if (i != skillList.length - 1)
                node.next.push(skillList[i + 1]);
            else
                node.last = true;
        }
    }

    HandleAbility(id) {
        for (let i = 0; i < this.considerNext.length; ++i) {
            let next = this.considerNext[i];
            if (this.comboNodes[next].id == id) {
                this.StateTransition(next);
                return true;
            }
        }
        if (this.comboBreakers.indexOf(id) >= 0) {
            this.AbortCombo();
            return true;
        }
        return false;
    }

    StateTransition(nextState) {
        if (this.current == null && nextState == null)
            return;

        window.clearTimeout(this.comboTimer);
        this.comboTimer = null;
        this.current = nextState;

        if (nextState == null) {
            this.considerNext = this.startList;
        } else {
            this.considerNext = [];
            Array.prototype.push.apply(this.considerNext, this.comboNodes[nextState].next);
            Array.prototype.push.apply(this.considerNext, this.startList);

            if (!this.comboNodes[nextState].last) {
                let kComboDelayMs = 15000;
                this.comboTimer = window.setTimeout(this.AbortCombo.bind(this), kComboDelayMs);
            }
        }
        this.callback(nextState);
    }

    AbortCombo() {
        this.StateTransition(null);
    }
}

function setupComboTracker(callback) {
    let comboTracker = new ComboTracker(Object.freeze([]), callback);
    // comboTracker.AddCombo([
    //     gLang.kAbility.HeavySwing,
    //     gLang.kAbility.SkullSunder,
    //     gLang.kAbility.ButchersBlock,
    // ]);
    return comboTracker;
}

function setupRegexes(playerName) {
    kYouGainEffectRegex = Regexes.gainsEffect({target: playerName});
    kYouLoseEffectRegex = Regexes.losesEffect({target: playerName});
    kYouUseAbilityRegex = Regexes.ability({source: playerName});
    kAnybodyAbilityRegex = Regexes.ability();
    kMobGainsEffectRegex = Regexes.gainsEffect({targetId: '4.......'});
    kMobLosesEffectRegex = Regexes.losesEffect({targetId: '4.......'});
    kMobGainsOwnEffectRegex = Regexes.gainsEffect({targetId: '4.......', source: playerName})
    kMobLosesOwnEffectRegex = Regexes.losesEffect({targetId: '4.......', source: playerName})
}

function computeBackgroundColorFrom(element, classList) {
    let div = document.createElement('div');
    let classes = classList.split('.');
    for (let i = 0; i < classes.length; ++i)
        div.classList.add(classes[i]);
    element.appendChild(div);
    let color = window.getComputedStyle(div).backgroundColor;
    element.removeChild(div);
    return color;
}

function makeAuraTimerIcon(name, seconds, opacity, iconWidth, iconHeight, iconText, barHeight, textHeight, textColor, borderSize, borderColor, barColor, auraIcon, increases) {
    let div = document.createElement('div');
    div.style.opacity = opacity;
    div.className = 'buffs'
    div.setAttribute('buffs-value', increases)

    let icon = document.createElement('timer-icon');
    icon.width = iconWidth;
    icon.height = iconHeight;
    icon.bordersize = borderSize;
    icon.textcolor = textColor;
    div.appendChild(icon);

    let barDiv = document.createElement('div');
    barDiv.style.position = 'absolute'; //绝对位置
    barDiv.style.left = iconWidth; // 图标位置
    barDiv.style.fontSize = '50%'; // 字体大小
    div.appendChild(barDiv);

    if (seconds >= 0) {
        let c = Options.BigBuffBar30sWidth() / 30
        let width = seconds * c // 动态长度
        let bar = document.createElement('timer-bar');
        bar.width = width;// 进度条宽度
        bar.height = barHeight; // 进度条高度
        bar.fg = barColor;
        bar.duration = seconds;
        bar.lefttext = 'remain';

        barDiv.appendChild(bar);
        // barDiv.getElementById('lefttext').style.cssText += 'font-size: 10px;';
    }

    if (textHeight > 0) {
        let text = document.createElement('div');
        text.classList.add('text');
        text.style.width = iconWidth;
        text.style.height = textHeight;
        text.style.overflow = 'hidden';
        text.style.fontSize = textHeight - 1;
        text.style.whiteSpace = 'pre';
        text.style.position = 'relative';
        text.style.top = iconHeight;
        text.style.fontFamily = 'arial';
        text.style.fontWeight = 'bold';
        text.style.color = textColor;
        text.style.textShadow = '-1px 0 3px black, 0 1px 3px black, 1px 0 3px black, 0 -1px 3px black';
        text.style.paddingBottom = textHeight / 4;

        text.innerText = name;
        div.appendChild(text);
    }

    if (iconText)
        icon.text = iconText;
    icon.bordercolor = borderColor;
    icon.icon = auraIcon;
    // icon.duration = seconds; // 倒计时显示

    return div;
}

function makeOwnAuraTimerIcon(name, seconds, opacity, iconWidth, iconHeight, iconText,
                              barHeight, textHeight, textColor, borderSize, borderColor, barColor, auraIcon) {
    let div = document.createElement('div');
    div.style.opacity = opacity;

    let icon = document.createElement('timer-icon');
    icon.width = iconWidth;
    icon.height = iconHeight;
    icon.bordersize = borderSize;
    icon.textcolor = textColor;
    div.appendChild(icon);

    let barDiv = document.createElement('div');
    barDiv.style.position = 'relative';
    barDiv.style.top = iconHeight;
    div.appendChild(barDiv);

    if (seconds >= 0) {
        let bar = document.createElement('timer-bar');
        bar.width = iconWidth;
        bar.height = barHeight;
        bar.fg = barColor;
        bar.duration = seconds;
        barDiv.appendChild(bar);
    }

    // 获取当前buff值
    let statTotal = document.getElementById('jobs-buffs-total');
    let v = statTotal.getAttribute('value')
    if (v !== undefined && Number(v) > 0) {
        icon.text = v;
    }
    icon.bordercolor = borderColor;
    icon.icon = auraIcon;

    return div;
}

class Buff {
    constructor(job, name, info, list, options, ownBuff) {
        this.job = job;
        this.name = name;
        this.info = info;
        this.options = options;

        // TODO: these should be different ui elements.
        // TODO: or maybe add some buffer between sections?
        this.ownBuff = ownBuff;
        this.activeList = list;
        this.cooldownList = list;
        this.readyList = list;

        // tracked auras
        this.active = null;
        this.cooldown = {};
        this.ready = {};

        // Hacky numbers to sort active > ready > cooldowns by adjusting sort keys.
        this.readySortKeyBase = 1000;
        this.cooldownSortKeyBase = 2000;
    }

    // addCooldown(source, effectSeconds) {
    //     if (!this.info.cooldown)
    //         return;
    //     if (this.cooldown[source]) {
    //         // Unexpected use of the same cooldown by the same name.
    //         this.cooldown[source].removeCallback();
    //     }
    //
    //     let cooldownKey = 'c:' + this.name + ':' + source;
    //
    //     let secondsUntilShow = this.info.cooldown - this.options.BigBuffShowCooldownSeconds;
    //     secondsUntilShow = Math.min(Math.max(effectSeconds, secondsUntilShow), this.info.cooldown);
    //     let showSeconds = this.info.cooldown - secondsUntilShow;
    //     let addReadyCallback = () => {
    //         this.addReady(source);
    //     };
    //
    //     this.cooldown[source] = this.makeAura(cooldownKey, this.cooldownList, showSeconds,
    //         secondsUntilShow, this.cooldownSortKeyBase, 'grey', '', 0.5, addReadyCallback);
    // }

    // addReady(source) {
    //     if (this.ready[source]) {
    //         // Unexpected use of the same cooldown by the same name.
    //         this.ready[source].removeCallback();
    //     }
    //
    //     // TODO: could consider looking at the party list to make initials unique?
    //     let txt = '';
    //     let initials = source.split(' ');
    //     if (initials.length == 2)
    //         txt = initials[0][0] + initials[1][0];
    //     else
    //         txt = initials[0].slice(0, 3);
    //
    //     let color = this.info.borderColor;
    //
    //     let readyKey = 'r:' + this.name + ':' + source;
    //     this.ready[source] = this.makeAura(readyKey, this.readyList, -1, 0,
    //         this.readySortKeyBase, color, txt, 0.6);
    // }

    // 计算buff, 展示剩余多少时间刷buff是值得
    buffsCalculation(list) {
        let tgs = list.rootElement.getElementsByClassName('buffs');
        let total = 0;
        for (let i = 0; i < tgs.length; i++) {
            let iv = tgs[i].getAttribute('buffs-value');
            if (iv !== undefined && Number(iv) > 0) {
                total = Number(total) + Number(iv);
            }
        }

        let statTotal = document.getElementById('jobs-buffs-total');
        statTotal.setAttribute('value', total)
        if (Number(total) <= 0) {
            statTotal.innerText = '';
        } else {
            statTotal.innerText = 'Total: ' + total + '%';
        }

        // 诗人计算秒数
        if (this.job === 'BRD') {
            let statSec = document.getElementById('jobs-buffs-sec');
            if (Number(total) > 0) {
                statSec.innerText = Math.floor((30 * 900 * (Number(total) / 100)) / ((1 + (Number(total) / 100)) * (230 - 100))) + 's';
            } else {
                statSec.innerText = '';
            }
        }
    }

    makeOwnAura(key, list, seconds, secondsUntilShow, adjustSort, textColor, txt, opacity, expireCallback) {
        let aura = {};

        aura.removeCallback = () => {
            list.removeElement(key);
            if (aura.addTimeout) {
                window.clearTimeout(aura.addTimeout);
                aura.addTimeout = null;
            }
            if (aura.removeTimeout) {
                window.clearTimeout(aura.removeTimeout);
                aura.removeTimeout = null;
            }
        };
        aura.addCallback = () => {
            let elem = makeOwnAuraTimerIcon(
                key, seconds, opacity,
                this.options.BigBuffIconWidth, this.options.BigBuffIconHeight,
                txt,
                5, 0,
                textColor,
                1,
                this.info.borderColor, this.info.borderColor,
                this.info.icon);
            list.addElement(key, elem, Math.floor(seconds) + adjustSort);
            aura.addTimeout = null;

            if (seconds > 0) {
                aura.removeTimeout = window.setTimeout(() => {
                    aura.removeCallback();
                    if (expireCallback)
                        expireCallback();
                }, seconds * 1000);
            }
        };
        aura.removeTimeout = null;

        if (secondsUntilShow > 0)
            aura.addTimeout = window.setTimeout(aura.addCallback, secondsUntilShow * 1000);
        else
            aura.addCallback();


        return aura;
    }

    makeAura(key, list, seconds, secondsUntilShow, adjustSort, textColor, txt, opacity, expireCallback) {
        let aura = {};

        aura.removeCallback = () => {
            list.removeElement(key);
            if (aura.addTimeout) {
                window.clearTimeout(aura.addTimeout);
                aura.addTimeout = null;
            }
            if (aura.removeTimeout) {
                window.clearTimeout(aura.removeTimeout);
                aura.removeTimeout = null;
            }
            this.buffsCalculation(list)
        };
        aura.addCallback = () => {
            let elem = makeAuraTimerIcon(
                key, seconds, opacity,
                this.options.BigBuffIconWidth, this.options.BigBuffIconHeight,
                txt,
                this.options.BigBuffIconHeight, 0,
                textColor,
                this.options.BigBuffBorderSize,
                this.info.borderColor, this.info.borderColor,
                this.info.icon, this.info.increases);
            list.addElement(key, elem, Math.floor(seconds) + adjustSort);
            aura.addTimeout = null;
            this.buffsCalculation(list)

            // 语音播报
            if (Options.TTS === true && this.info.tts != null && this.info.tts != '') {
                let cmd = { 'call': 'cactbotSay', 'text': this.info.tts };
                window.callOverlayHandler(cmd);
            }

            if (seconds > 0) {
                aura.removeTimeout = window.setTimeout(() => {
                    aura.removeCallback();
                    if (expireCallback)
                        expireCallback();
                }, seconds * 1000);
            }
        };
        aura.removeTimeout = null;

        if (secondsUntilShow > 0)
            aura.addTimeout = window.setTimeout(aura.addCallback, secondsUntilShow * 1000);
        else
            aura.addCallback();


        return aura;
    }

    clear() {
        this.onLose();

        let cooldownKeys = Object.keys(this.cooldown);
        for (let i = 0; i < cooldownKeys.length; ++i)
            this.cooldown[cooldownKeys[i]].removeCallback();

        let readyKeys = Object.keys(this.ready);
        for (let i = 0; i < readyKeys.length; ++i)
            this.ready[readyKeys[i]].removeCallback();
    }

    clearCooldown(source) {
        let ready = this.ready[source];
        if (ready)
            ready.removeCallback();
        let cooldown = this.cooldown[source];
        if (cooldown)
            cooldown.removeCallback();
    }

    onGain(seconds, source) {
        this.onLose();
        this.clearCooldown(source);
        if (this.ownBuff === true) {
            this.active = this.makeOwnAura(this.name, this.activeList, seconds, 0, 0, 'white', '', 1);
        } else {
            this.active = this.makeAura(this.name, this.activeList, seconds, 0, 0, 'white', '', 1);
            // this.addCooldown(source, seconds);
        }
    }

    onLose() {
        if (!this.active)
            return;
        this.active.removeCallback();
        this.active = null;
    }
}

class BuffTracker {
    constructor(options, playerName, job, leftBuffDiv, rightBuffDiv, ownBuffDiv) {
        this.options = options;
        this.playerName = playerName;
        this.job = job;
        this.ownBuffDiv = ownBuffDiv;
        this.leftBuffDiv = leftBuffDiv;
        this.rightBuffDiv = rightBuffDiv;
        this.buffs = {};

        this.buffInfo = {
            potion: { // 强化药
                gainEffect: gLang.kEffect.Medicated,
                loseEffect: gLang.kEffect.Medicated,
                useEffectDuration: true,
                icon: 'cactbot/resources/icon/status/potion.png',
                borderColor: '#AA41B2',
                sortKey: 0,
                cooldown: 270, //CD
                increases: 10,
            },
            trick: { // 背刺
                gainAbility: gLang.kAbility.TrickAttack,
                gainRegex: Regexes.ability({id: gLang.kAbility.TrickAttack}),
                durationSeconds: 15,
                icon: 'cactbot/resources/icon/status/trick-attack.png',
                // Magenta.
                borderColor: '#FC4AE6',
                sortKey: 1,
                cooldown: 60,
                increases: 5,
                tts: '背刺',
            },
            litany: { //战斗连祷
                gainEffect: gLang.kEffect.BattleLitany,
                loseEffect: gLang.kEffect.BattleLitany,
                useEffectDuration: true,
                icon: 'cactbot/resources/icon/status/battle-litany.png',
                // Cyan.
                borderColor: '#099',
                sortKey: 1,
                cooldown: 180,
                increases: 5,
                tts: '连祷',
            },
            embolden: { // 鼓励
                // Embolden is special and has some extra text at the end, depending on embolden stage:
                // Potato Chippy gains the effect of Embolden from Tater Tot for 20.00 Seconds. (5)
                // Instead, use somebody using the effect on you:
                //   16:106C22EF:Tater Tot:1D60:Embolden:106C22EF:Potato Chippy:500020F:4D7: etc etc
                gainAbility: gLang.kAbility.Embolden,
                gainRegex: Regexes.abilityFull({id: gLang.kAbility.Embolden, target: this.playerName}),
                loseEffect: gLang.kEffect.Embolden,
                durationSeconds: 20,
                icon: 'cactbot/resources/icon/status/embolden.png',
                // Lime.
                borderColor: '#57FC4A',
                sortKey: 1,
                cooldown: 120,
                increases: 4,
                increasesDim: {5: 10, 4: 8, 3: 6, 2: 4, 1: 2}, // 递减
                tts: '鼓励',
            },
            arrow: { // 放浪神之箭
                gainEffect: gLang.kEffect.Arrow,
                loseEffect: gLang.kEffect.Arrow,
                useEffectDuration: true,
                icon: 'cactbot/resources/icon/status/arrow.png',
                // Light Blue.
                borderColor: '#37ccee',
                sortKey: 1,
                increasesJob: {melee: 6, ranged: 3},
                tts: '近卡',
            },
            balance: { // 太阳神之衡
                gainEffect: gLang.kEffect.Balance,
                loseEffect: gLang.kEffect.Balance,
                useEffectDuration: true,
                icon: 'cactbot/resources/icon/status/balance.png',
                // Orange.
                borderColor: '#ff9900',
                sortKey: 1,
                increasesJob: {melee: 6, ranged: 3},
                tts: '近卡',
            },
            bole: { // 世界树之干
                gainEffect: gLang.kEffect.Bole,
                loseEffect: gLang.kEffect.Bole,
                useEffectDuration: true,
                icon: 'cactbot/resources/icon/status/bole.png',
                // Green.
                borderColor: '#22dd77',
                sortKey: 1,
                increasesJob: {melee: 3, ranged: 6},
                tts: '远卡',
            },
            ewer: { // 河流神之瓶
                gainEffect: gLang.kEffect.Ewer,
                loseEffect: gLang.kEffect.Ewer,
                useEffectDuration: true,
                icon: 'cactbot/resources/icon/status/ewer.png',
                // Light Blue.
                borderColor: '#66ccdd',
                sortKey: 1,
                increasesJob: {melee: 3, ranged: 6},
                tts: '远卡',
            },
            spear: { // 战争神之枪
                gainEffect: gLang.kEffect.Spear,
                loseEffect: gLang.kEffect.Spear,
                useEffectDuration: true,
                icon: 'cactbot/resources/icon/status/spear.png',
                // Dark Blue.
                borderColor: '#4477dd',
                sortKey: 1,
                increasesJob: {melee: 6, ranged: 3},
                tts: '近卡',
            },
            spire: { // 建筑神之塔
                gainEffect: gLang.kEffect.Spire,
                loseEffect: gLang.kEffect.Spire,
                useEffectDuration: true,
                icon: 'cactbot/resources/icon/status/spire.png',
                // Yellow.
                borderColor: '#ddd044',
                sortKey: 1,
                increasesJob: {melee: 3, ranged: 6},
                tts: '远卡',
            },
            ladyOfCrowns: { // 王冠之贵妇
                gainEffect: gLang.kEffect.LadyOfCrowns,
                loseEffect: gLang.kEffect.LadyOfCrowns,
                useEffectDuration: true,
                icon: 'cactbot/resources/icon/status/lady-of-crowns.png',
                // Purple.
                borderColor: '#9e5599',
                sortKey: 1,
                increasesJob: {melee: 4, ranged: 8},
                tts: '远卡',
            },
            lordOfCrowns: { // 王冠之领主
                gainEffect: gLang.kEffect.LordOfCrowns,
                loseEffect: gLang.kEffect.LordOfCrowns,
                useEffectDuration: true,
                icon: 'cactbot/resources/icon/status/lord-of-crowns.png',
                // Dark Red.
                borderColor: '#9a2222',
                sortKey: 1,
                increasesJob: {melee: 8, ranged: 4},
                tts: '近卡',
            },
            devilment: { // 进攻之探戈
                gainEffect: gLang.kEffect.Devilment,
                loseEffect: gLang.kEffect.Devilment,
                durationSeconds: 20,
                icon: 'cactbot/resources/icon/status/devilment.png',
                // Dark Green.
                borderColor: '#006400',
                sortKey: 1,
                cooldown: 120,
                increases: 10,
                tts: '探戈',
            },
            technicalFinish: { // 技巧舞步结束
                gainEffect: gLang.kEffect.TechnicalFinish,
                loseEffect: gLang.kEffect.TechnicalFinish,
                durationSeconds: 20,
                icon: 'cactbot/resources/icon/status/technical-finish.png',
                // Dark Peach.
                borderColor: '#E0757C',
                sortKey: 1,
                cooldown: 120,
                increases: 5,
                tts: '技巧',
            },
            battlevoice: { // 战斗之声
                gainEffect: gLang.kEffect.BattleVoice,
                loseEffect: gLang.kEffect.BattleVoice,
                useEffectDuration: true,
                icon: 'cactbot/resources/icon/status/battlevoice.png',
                // Red.
                borderColor: '#D6371E',
                sortKey: 1,
                cooldown: 180,
                increases: 4,
                tts: '战斗之声',
            },
            chain: { // 连环计
                gainAbility: gLang.kAbility.ChainStratagem,
                durationSeconds: 15,
                icon: 'cactbot/resources/icon/status/chain-stratagem.png',
                // Blue.
                borderColor: '#4674E5',
                sortKey: 1,
                cooldown: 120,
                increases: 5,
                tts: '连环计',
            },
            lefteye: { // 巨龙左眼
                gainEffect: gLang.kEffect.LeftEye,
                loseEffect: gLang.kEffect.LeftEye,
                useEffectDuration: true,
                icon: 'cactbot/resources/icon/status/dragon-sight.png',
                // Orange.
                borderColor: '#FA8737',
                sortKey: 1,
                cooldown: 120,
                increases: 5,
                tts: '左眼',
            },
            righteye: { // 巨龙右眼
                gainEffect: gLang.kEffect.RightEye,
                loseEffect: gLang.kEffect.RightEye,
                useEffectDuration: true,
                icon: 'cactbot/resources/icon/status/dragon-sight.png',
                // Orange.
                borderColor: '#FA8737',
                sortKey: 1,
                cooldown: 120,
                increases: 10,
                tts: '右眼',
            },
            brotherhood: { // 义结金兰：斗气/攻击
                gainEffect: gLang.kEffect.Brotherhood,
                loseEffect: gLang.kEffect.Brotherhood,
                useEffectDuration: true,
                icon: 'cactbot/resources/icon/status/brotherhood.png',
                // Dark Orange.
                borderColor: '#994200',
                sortKey: 1,
                cooldown: 90,
                increases: 5,
                tts: '桃园',
            },
            devotion: { // 灵护
                gainEffect: gLang.kEffect.Devotion,
                loseEffect: gLang.kEffect.Devotion,
                useEffectDuration: true,
                icon: 'cactbot/resources/icon/status/devotion.png',
                // Yellow.
                borderColor: '#ffbf00',
                sortKey: 1,
                cooldown: 180,
                increases: 5,
                tts: '灵护',
            },
            divination: { // 占卜
                gainEffect: gLang.kEffect.Divination,
                loseEffect: gLang.kEffect.Divination,
                useEffectDuration: true,
                icon: 'cactbot/resources/icon/status/divination.png',
                // Dark purple.
                borderColor: '#5C1F58',
                sortKey: 1,
                cooldown: 120,
                increases: 6,
                tts: '占卜',
            },
            raging: { // 猛者
                gainEffect: gLang.kEffect.RagingStrikes,
                loseEffect: gLang.kEffect.RagingStrikes,
                useEffectDuration: true,
                // icon: 'cactbot/resources/icon/status/raging-strikes.png',
                icon: 'https://xivapi.com/i/000000/000352.png',
                // Dark purple.
                borderColor: '#db6509',
                sortKey: 1,
                cooldown: 80,
                increases: 10,
                tts: '猛者',
            },
            stormbite: {
                mobGainsOwnEffect: gLang.kEffect.Stormbite,
                mobLosesOwnEffect: gLang.kEffect.Stormbite,
                useEffectDuration: true,
                icon: 'https://xivapi.com/i/002000/002614.png',
                borderColor: '#3df6fd',
                sortKey: 1,
            },
            causticBite: {
                mobGainsOwnEffect: gLang.kEffect.CausticBite,
                mobLosesOwnEffect: gLang.kEffect.CausticBite,
                useEffectDuration: true,
                icon: 'https://xivapi.com/i/002000/002613.png',
                borderColor: '#e053bb',
                sortKey: 1,
            }
        };

        let keys = Object.keys(this.buffInfo);
        this.gainEffectMap = {};
        this.loseEffectMap = {};
        this.gainAbilityMap = {};
        this.mobGainsEffectMap = {};
        this.mobLosesEffectMap = {};
        this.mobGainsOwnEffectMap = {};
        this.mobLosesOwnEffectMap = {};

        let propToMapMap = {
            gainEffect: this.gainEffectMap,
            loseEffect: this.loseEffectMap,
            gainAbility: this.gainAbilityMap,
            mobGainsEffect: this.mobGainsEffectMap,
            mobLosesEffect: this.mobLosesEffectMap,
            mobGainsOwnEffect: this.mobGainsOwnEffectMap,
            mobLosesOwnEffect: this.mobLosesOwnEffectMap,
        };

        for (let i = 0; i < keys.length; ++i) {
            let buff = this.buffInfo[keys[i]];
            buff.name = keys[i];

            let overrides = this.options.PerBuffOptions[buff.name] || {};
            buff.borderColor = overrides.borderColor || buff.borderColor;
            buff.icon = overrides.icon || buff.icon;
            buff.side = overrides.side || buff.side || 'right';
            buff.sortKey = overrides.sortKey || buff.sortKey;
            buff.hide = overrides.hide === undefined ? buff.hide : overrides.hide;

            for (let prop in propToMapMap) {
                let key = buff[prop];
                if (!key)
                    continue;
                let map = propToMapMap[prop];
                map[key] = map[key] || [];
                map[key].push(buff);
            }
        }

        const v520 = {
            // identical with latest patch
            /* example
            trick: {
              durationSeconds: 10,
            },
            */
        };

        let buffOverrides = {
            ko: v520,
            cn: v520,
        };

        for (let key in buffOverrides[this.options.Language]) {
            for (let key2 in buffOverrides[this.options.Language][key])
                this.buffInfo[key][key2] = buffOverrides[this.options.Language][key][key2];
        }
    }

    onUseAbility(id, log) {
        let buffs = this.gainAbilityMap[id];
        if (!buffs)
            return;

        for (let b of buffs) {
            if (b.gainRegex && !log.match(b.gainRegex))
                continue;

            let seconds = b.durationSeconds;
            let source = abilitySourceFromLog(log);
            this.onBigBuff(b.name, seconds, b, source, false);
        }
    }

    onGainEffect(buffs, log) {
        if (!buffs)
            return;
        for (let b of buffs) {
            let seconds = -1;
            if (b.useEffectDuration)
                seconds = gainSecondsFromLog(log);
            else if ('durationSeconds' in b)
                seconds = b.durationSeconds;

            let source = gainSourceFromLog(log);
            this.onBigBuff(b.name, seconds, b, source, false);
        }
    }

    onGainOwnEffect(buffs, log) {
        if (!buffs)
            return;
        for (let b of buffs) {
            let seconds = -1;
            if (b.useEffectDuration)
                seconds = gainSecondsFromLog(log);
            else if ('durationSeconds' in b)
                seconds = b.durationSeconds;

            let source = gainSourceFromLog(log);
            this.onBigBuff(b.name, seconds, b, source, true);
        }
    }

    onLoseEffect(buffs, log) {
        if (!buffs)
            return;
        for (let b of buffs)
            this.onLoseBigBuff(b.name, b);
    }

    onLoseOwnEffect(buffs, log) {
        if (!buffs)
            return;
        for (let b of buffs)
            this.onLoseBigBuff(b.name, b);
    }

    onYouGainEffect(name, log) {
        this.onGainEffect(this.gainEffectMap[name], log);
    }

    onYouLoseEffect(name, log) {
        this.onLoseEffect(this.loseEffectMap[name], log);
    }

    onMobGainsEffect(name, log) {
        this.onGainEffect(this.mobGainsEffectMap[name], log);
    }

    onMobLosesEffect(name, log) {
        this.onLoseEffect(this.mobLosesEffectMap[name], log);
    }

    onMobGainsOwnEffect(name, log) {
        this.onGainOwnEffect(this.mobGainsOwnEffectMap[name], log);
    }

    onMobLosesOwnEffect(name, log) {
        this.onLoseOwnEffect(this.mobLosesOwnEffectMap[name], log);
    }

    onBigBuff(name, seconds, info, source, ownBuff) {
        if (seconds <= 0)
            return;

        let list = this.rightBuffDiv;
        if (info.side == 'left' && this.leftBuffDiv)
            list = this.leftBuffDiv;

        let melee = this.job.match('(PLD|WAR|DRK|GNB|MNK|DRG|NIN|SAM)');
        if (info.increasesJob != null) { // 根据远近判断
            if (melee != null) {
                info.increases = info.increasesJob.melee
            } else {
                info.increases = info.increasesJob.ranged
            }
        }

        let buff = this.buffs[name];
        if (!buff) {
            if (ownBuff === true) {
                this.buffs[name] = new Buff(this.job, name, info, this.ownBuffDiv, this.options, true);
            } else {
                this.buffs[name] = new Buff(this.job, name, info, list, this.options, false);
            }
            buff = this.buffs[name];
        }

        let shareList = info.sharesCooldownWith || [];
        for (let share of shareList) {
            let existingBuff = this.buffs[share];
            if (existingBuff)
                existingBuff.clearCooldown(source);
        }
        buff.onGain(seconds, source);
    }

    onLoseBigBuff(name) {
        let buff = this.buffs[name];
        if (!buff)
            return;
        buff.onLose();
    }

    clear() {
        let keys = Object.keys(this.buffs);
        for (let i = 0; i < keys.length; ++i)
            this.buffs[keys[i]].clear();
    }
}

class Brds {
    constructor(options) {
        this.options = options;
        this.init = false;
        this.me = null;
        this.o = {};
        this.casting = {};
        this.job = '';
        this.hp = 0;
        this.maxHP = 0;
        this.currentShield = 0;
        this.mp = 0;
        this.prevMP = 0;
        this.maxMP = 0;
        this.level = 0;
        this.distance = -1;
        this.whiteMana = -1;
        this.blackMana = -1;
        this.oath = -1;
        this.umbralStacks = 0;
        this.inCombat = false;
        this.combo = 0;
        this.comboTimer = null;

        this.presenceOfMind = 0;
        this.shifu = 0;
        this.huton = 0;
        this.lightningStacks = 0;
        this.paeonStacks = 0;
        this.museStacks = 0;
        this.circleOfPower = 0;

        this.comboFuncs = [];
        this.gainEffectFuncMap = {};
        this.loseEffectFuncMap = {};
        this.statChangeFuncMap = {};
        this.abilityFuncMap = {};
    }

    // 更新职业(布局)
    UpdateJob() {
        this.comboFuncs = [];
        this.jobFuncs = [];
        this.gainEffectFuncMap = {};
        this.loseEffectFuncMap = {};
        this.statChangeFuncMap = {};
        this.abilityFuncMap = {};

        // 统计信息布局
        let stat = document.getElementById('jobs-stat'); // 统计
        if (stat == null) {
            let root = document.getElementById('container');
            stat = document.createElement('div');
            stat.id = 'jobs-stat';
            root.appendChild(stat);
        }
        while (stat.childNodes.length)
            stat.removeChild(stat.childNodes[0]);

        let statLayoutTotal = document.createElement('div');
        statLayoutTotal.id = 'jobs-buffs-total';
        let statLayoutSec = document.createElement('div');
        statLayoutSec.id = 'jobs-buffs-sec';
        let statLayoutNow = document.createElement('div');
        statLayoutNow.id = 'jobs-buffs-now';
        let ownDotLayoutNow = document.createElement('div');
        ownDotLayoutNow.id = 'jobs-own-dot';
        stat.appendChild(statLayoutTotal);
        stat.appendChild(statLayoutSec);
        stat.appendChild(statLayoutNow);
        stat.appendChild(ownDotLayoutNow);

        let container = document.getElementById('jobs-container'); // 查找对应ID的元素
        if (container == null) {
            let root = document.getElementById('container');
            container = document.createElement('div');
            container.id = 'jobs-container';
            root.appendChild(container);
        }
        while (container.childNodes.length)
            container.removeChild(container.childNodes[0]);

        this.o = {};

        let barsLayoutContainer = document.createElement('div');
        barsLayoutContainer.id = 'jobs';
        container.appendChild(barsLayoutContainer);

        barsLayoutContainer.classList.add(this.job.toLowerCase());
        if (Util.isTankJob(this.job))
            barsLayoutContainer.classList.add('tank');
        else if (Util.isHealerJob(this.job))
            barsLayoutContainer.classList.add('healer');
        else if (Util.isCombatJob(this.job))
            barsLayoutContainer.classList.add('dps');

        let pullCountdownContainer = document.createElement('div');
        pullCountdownContainer.id = 'pull-bar';
        // Pull counter not affected by opacity option.
        barsLayoutContainer.appendChild(pullCountdownContainer);
        this.o.pullCountdown = document.createElement('timer-bar');
        pullCountdownContainer.appendChild(this.o.pullCountdown);

        let opacityContainer = document.createElement('div');
        opacityContainer.id = 'opacity-container';
        barsLayoutContainer.appendChild(opacityContainer);

        // Holds health/mana.
        let barsContainer = document.createElement('div');
        barsContainer.id = 'bars';
        opacityContainer.appendChild(barsContainer);

        this.o.pullCountdown.width = window.getComputedStyle(pullCountdownContainer).width;
        this.o.pullCountdown.height = window.getComputedStyle(pullCountdownContainer).height;
        this.o.pullCountdown.lefttext = gLang.kUIStrings.Pull;
        this.o.pullCountdown.righttext = 'remain';
        this.o.pullCountdown.hideafter = 0;
        this.o.pullCountdown.fg = 'rgb(255, 120, 120)';
        this.o.pullCountdown.classList.add('lang-' + (gLang.lang || 'cn'));

        this.o.rightBuffsContainer = document.createElement('div');
        this.o.rightBuffsContainer.id = 'right-side-icons';
        barsContainer.appendChild(this.o.rightBuffsContainer);

        this.o.rightBuffsList = document.createElement('widget-list');
        this.o.rightBuffsContainer.appendChild(this.o.rightBuffsList);

        this.o.ownDotList = document.createElement('widget-list');
        this.o.ownDotList.rowcolsize = 2;
        this.o.ownDotList.maxnumber = 2;
        this.o.ownDotList.toward = 'left down';
        this.o.ownDotList.elementwidth = this.options.BigBuffIconWidth + 2;
        ownDotLayoutNow.appendChild(this.o.ownDotList);

        this.o.rightBuffsList.rowcolsize = 7;
        this.o.rightBuffsList.maxnumber = 7;
        this.o.rightBuffsList.toward = 'down right';
        // this.o.rightBuffsList.elementwidth = this.options.BigBuffIconWidth + 2;
        this.o.rightBuffsList.elementheight = this.options.BigBuffIconHeight + 1;

        // Just alias these two together so the rest of the code doesn't have
        // to care that they're the same thing.
        this.o.leftBuffsList = this.o.rightBuffsList;
        this.o.rightBuffsList.rowcolsize = 20;
        this.o.rightBuffsList.maxnumber = 20;
        // Hoist the buffs up to hide everything else.
        barsLayoutContainer.appendChild(this.o.rightBuffsContainer);
        barsLayoutContainer.classList.add('justbuffs');
    }

    UpdateOpacity() {
        let opacityContainer = document.getElementById('opacity-container');
        if (!opacityContainer)
            return;
        if (this.inCombat || !this.options.LowerOpacityOutOfCombat)
            opacityContainer.style.opacity = 1.0;
        else
            opacityContainer.style.opacity = this.options.OpacityOutOfCombat;
    }

    OnComboChange(skill) {
        for (let i = 0; i < this.comboFuncs.length; ++i)
            this.comboFuncs[i](skill);
    }

    OnPlayerChanged(e) {
        if (this.me !== e.detail.name) {
            this.me = e.detail.name;
            // setup regexes prior to the combo tracker
            setupRegexes(this.me);
        }

        if (!this.init) {
            this.combo = setupComboTracker(this.OnComboChange.bind(this));
            this.init = true;
        }

        let updateJob = false;
        if (e.detail.job != this.job) {
            this.job = e.detail.job;
            // Combos are job specific.
            this.combo.AbortCombo();
            updateJob = true;
        }

        if (updateJob) {
            this.UpdateJob();
            // On reload, we need to set the opacity after setting up the job bars.
            this.UpdateOpacity();
            // Set up the buff tracker after the job bars are created.
            this.buffTracker = new BuffTracker(this.options, this.me, this.job, this.o.leftBuffsList, this.o.rightBuffsList, this.o.ownDotList);
        }
    }

    OnLogEvent(e) {
        if (!this.init)
            return;

        for (let i = 0; i < e.detail.logs.length; i++) {
            let log = e.detail.logs[i];

            // TODO: only consider this when not in battle.
            if (log[15] == '0') {
                if (log.search(/:test:jobs:/) >= 0) {
                    this.Test();
                    continue;
                }
                if (log[16] == 'C') {
                    let stats = log.match(kStatsRegex).groups;
                    this.skillSpeed = stats.skillSpeed;
                    this.spellSpeed = stats.spellSpeed;
                    continue;
                }
            } else if (log[15] == '1') {
                if (log[16] == 'A') {
                    let m = log.match(kYouGainEffectRegex);
                    if (m) {
                        let name = m.groups.effect;
                        let f = this.gainEffectFuncMap[name];
                        if (f)
                            f(name, log);
                        this.buffTracker.onYouGainEffect(name, log);
                    }
                    m = log.match(kMobGainsEffectRegex);
                    if (m)
                        this.buffTracker.onMobGainsEffect(m.groups.effect, log);

                    m = log.match(kMobGainsOwnEffectRegex);
                    if (m)
                        this.buffTracker.onMobGainsOwnEffect(m.groups.effect, log);

                } else if (log[16] == 'E') {
                    let m = log.match(kYouLoseEffectRegex);
                    if (m) {
                        let name = m.groups.effect;
                        let f = this.loseEffectFuncMap[name];
                        if (f)
                            f(name, log);
                        this.buffTracker.onYouLoseEffect(name, log);
                    }
                    m = log.match(kMobLosesEffectRegex);
                    if (m)
                        this.buffTracker.onMobLosesEffect(m.groups.effect, log);

                    m = log.match(kMobLosesOwnEffectRegex);
                    if (m)
                        this.buffTracker.onMobLosesOwnEffect(m.groups.effect, log);
                }
                // TODO: consider flags for missing.
                // flags:damage is 1:0 in most misses.
                if (log[16] == '5' || log[16] == '6') {
                    let m = log.match(kYouUseAbilityRegex);
                    if (m) {
                        let id = m.groups.id;
                        this.combo.HandleAbility(id);
                        let f = this.abilityFuncMap[id];
                        if (f)
                            f(id);
                        this.buffTracker.onUseAbility(id, log);
                    } else {
                        let m = log.match(kAnybodyAbilityRegex);
                        if (m)
                            this.buffTracker.onUseAbility(m.groups.id, log);
                    }
                    // use of GP Potion
                    let cordialRegex = Regexes.ability({source: this.me, id: '20(017FD|F5A3D|F844F|0420F|0317D)'});
                    if (log.match(cordialRegex)) {
                        this.gpPotion = true;
                        setTimeout(() => {
                            this.gpPotion = false;
                        }, 2000);
                    }
                }
            }
        }
    }

    Test() {
        this.TestChangeJob();

        let logs = [];
        let t = '[10:10:10.000] ';
        // logs.push(t + '1A:10000000:' + this.me + ' gains the effect of 强化药 from ' + this.me + ' for 30.00 Seconds.');
        // logs.push(t + '1A:10000000:' + this.me + ' gains the effect of 猛者强击 from ' + this.me + ' for 20.00 Seconds.');
        // logs.push(t + '15:10000000:Tako Yaki:1D60:Embolden:10000000:' + this.me + ':500020F:4D70000:0:0:0:0:0:0:0:0:0:0:0:0:0:0:42194:42194:10000:10000:0:1000:-655.3301:-838.5481:29.80905:0.523459:42194:42194:10000:10000:0:1000:-655.3301:-838.5481:29.80905:0.523459:00001DE7');
        // logs.push(t + '1A:10000000:' + this.me + ' gains the effect of Battle Litany from  for 25 Seconds.');
        // logs.push(t + '1A:10000000:' + this.me + ' gains the effect of The Balance from  for 12 Seconds.');
        // logs.push(t + '1A:10000000:Okonomi Yaki gains the effect of Foe Requiem from Okonomi Yaki for 9999.00 Seconds.');
        // logs.push(t + '15:1048638C:Okonomi Yaki:8D2:Trick Attack:40000C96:Striking Dummy:20710103:154B:');
        // logs.push(t + '1A:10000000:' + this.me + ' gains the effect of Left Eye from That Guy for 15.0 Seconds.');
        // logs.push(t + '1A:10000000:' + this.me + ' gains the effect of Right Eye from That Guy for 15.0 Seconds.');
        // logs.push(t + '15:1048638C:Tako Yaki:1D0C:Chain Stratagem:40000C96:Striking Dummy:28710103:154B:');
        // logs.push(t + '15:1048638C:Tako Yaki:B45:Hypercharge:40000C96:Striking Dummy:28710103:154B:');
        // logs.push(t + '1A:10000000:' + this.me + ' gains the effect of Devotion from That Guy for 15.0 Seconds.');
        // logs.push(t + '1A:10000000:' + this.me + ' gains the effect of Brotherhood from That Guy for 15.0 Seconds.');
        // logs.push(t + '1A:10000000:' + this.me + ' gains the effect of Brotherhood from Other Guy for 15.0 Seconds.');
        // let e = {detail: {logs: logs}};
        // this.OnLogEvent(e);

        setTimeout(() => {
            let logs = ['[01:05:59.585] 15:1039A1D9:' + this.me + ':8D2:攻其不备:4000031E:木人:1E710003:384B0000:5050F:27E0000:0:0:0:0:0:0:0:0:0:0:0:0:7400000:7400000:0:0:0:1000:-603.1267:-762.9036:25.02:2.283125:82278:82278:10000:10000:0:1000:-604.8576:-761.8551:25:2.115644:00003E39'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 1)

        setTimeout(() => {
            let logs = ['[10:10:10.000] 1A:10000000:' + this.me + ' gains the effect of 强化药 from ' + this.me + ' for 30.00 Seconds.'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 1)
        setTimeout(() => {
            let logs = ['[10:10:10.000] 1A:10000000:' + this.me + ' gains the effect of 猛者强击 from ' + this.me + ' for 15.00 Seconds.'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 1000)
        setTimeout(() => {
            let logs = ['[10:10:10.000] 1A:10000000:' + this.me + ' gains the effect of 放浪神之箭 from Okonomi Yaki for 10.00 Seconds.'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 2000)
        setTimeout(() => {
            let logs = ['[10:10:10.000] 1A:10000000:' + this.me + ' gains the effect of 太阳神之衡 from Okonomi Yaki for 5.00 Seconds.'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 3000)

        setTimeout(() => {
            let logs = ['[10:10:10.000] 1A:10000000:' + this.me + ' gains the effect of 义结金兰：攻击 from Okonomi Yaki for 25.00 Seconds.'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 4000)

        setTimeout(() => {
            let logs = ['[22:26:37.632] 1A:4000031E:木人 gains the effect of 狂风蚀箭 from ' + this.me + ' for 30.00 Seconds.'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 2000)

        setTimeout(() => {
            let logs = ['[22:26:37.632] 1A:4000031E:木人 gains the effect of 烈毒咬箭 from ' + this.me + ' for 30.00 Seconds.'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 3000)

        // setTimeout(() => {
        //     let logs = ['[22:26:37.632] 1E:4000031E:木人 loses the effect of 狂风蚀箭 from ' + this.me + '.'];
        //     let e = {detail: {logs: logs}};
        //     this.OnLogEvent(e);
        // }, 8000)
        // setTimeout(() => {
        //     let logs = ['[22:26:37.632] 1E:4000031E:木人 loses the effect of 烈毒咬箭 from ' + this.me + '.'];
        //     let e = {detail: {logs: logs}};
        //     this.OnLogEvent(e);
        // }, 9000)
    }

    TestChangeJob() {
        // let e = {detail: {job: "MNK", name: "TestName"}}
        let e = {detail: {job: "BRD", name: "TestName"}}
        this.OnPlayerChanged(e)
    }
}

// 结束 从这里开始
let gBrds;

UserConfig.getUserConfigLocation('buff', function () {
    addOverlayListener('onPlayerChangedEvent', function (e) {
        gBrds.OnPlayerChanged(e);
    });
    addOverlayListener('onLogEvent', function (e) {
        gBrds.OnLogEvent(e);
    });

    gBrds = new Brds(Options);
});

