'use strict';

// 近战职业列表
let meleeJobs = ['PLD', 'WAR', 'DRK', 'GNB', 'MNK', 'DRG', 'NIN', 'SAM'];

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

function gainTargetFromLog(log) {
    // [21:00:46.695] 1A:400001B9:木人 gains the effect of 狂风蚀箭 from 水貂桑 for 30.00 Seconds.
    // [21:01:11.825] 1E:400001B8:木人 loses the effect of 狂风蚀箭 from 水貂桑.
    let m = log.match(Regexes.parse('] 1A:(\\y{ObjectId}):([^:]*?) gains'));
    if (m)
        return m[1] + ':' + m[2];
    return 0;
}

function loseTargetFromLog(log) {
    // [21:00:46.695] 1A:400001B9:木人 gains the effect of 狂风蚀箭 from 水貂桑 for 30.00 Seconds.
    // [21:01:11.825] 1E:400001B8:木人 loses the effect of 狂风蚀箭 from 水貂桑.
    let m = log.match(Regexes.parse('] 1E:(\\y{ObjectId}):([^:]*?) loses'));
    if (m)
        return m[1] + ':' + m[2];
    return 0;
}

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

// 是否为近战职业
function isMeleeJob(job) {
    return meleeJobs.indexOf(job) >= 0;
}

// 获取url参数
function getQueryVariable(variable) {
    let query = window.location.search.substring(1);
    let vars = query.split("&");
    for (let i = 0; i < vars.length; i++) {
        let pair = vars[i].split("=");
        if (pair[0] == variable) {
            return pair[1];
        }
    }
    return (false);
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

function makeAuraTimerIcon(name, seconds, opacity, iconWidth, iconHeight, iconText, barHeight, textHeight, textColor, borderSize, borderColor, barColor, auraIcon, buffInfo) {
    let div = document.createElement('div');
    div.style.opacity = opacity;
    div.className = 'buffs'
    // 设置buff详细信息
    div.setAttribute('buffs-value', buffInfo.increases)
    div.setAttribute('buffs-incr-own', buffInfo.incrOwn) // 作用自己
    div.setAttribute('buffs-incr-physical', buffInfo.incrPhysical) // 作用物理
    div.setAttribute('buffs-incr-magic', buffInfo.incrMagic) // 作用魔法

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
                              barHeight, textHeight, textColor, borderSize, borderColor, barColor, auraIcon, info) {
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

    // 根据物理计算还是魔法计算
    if (info.buffType !== undefined && info.buffType === 'physical') {
        let jsp = document.getElementById('jobs-stat-physical');
        let v = jsp.getAttribute('value')
        if (v !== undefined && Number(v) > 0) {
            icon.text = v;
        }
    }
    if (info.buffType !== undefined && info.buffType === 'magic') {
        let jsm = document.getElementById('jobs-stat-magic');
        let v = jsm.getAttribute('value')
        if (v !== undefined && Number(v) > 0) {
            icon.text = v;
        }
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
        let toip = 0; // 自己的物理增伤 (换算成攻击) (1 + a)(1 + b) = 1 + a + b + ab
        let toim = 0; // 自己的魔法增伤 (换算成攻击)
        let tbip = 0; // 对boss的物理增伤
        let tbim = 0; // 对boss的魔法增伤

        for (let i = 0; i < tgs.length; i++) {

            let bio = tgs[i].getAttribute('buffs-incr-own') // 作用自己
            let bip = tgs[i].getAttribute('buffs-incr-physical') // 作用物理
            let bim = tgs[i].getAttribute('buffs-incr-magic') // 作用魔法

            if (bio === undefined || bip === undefined || bim === undefined) {
                continue;
            }

            bip = Number(bip)
            bim = Number(bim)
            if (Boolean(bio) === true) { // 作用自己, 乘法公式
                if (bip > 0) {
                    if (toip <= 0) {
                        toip = bip;
                    } else {
                        toip = toip + bip + ((toip * bip) / 100)
                    }
                }

                if (bim > 0) {
                    if (toim <= 0) {
                        toim = bim;
                    } else {
                        toim = toim + bim + ((toim * bim) / 100)
                    }
                }
            } else { // 对boss增伤
                if (bip > 0) {
                    tbip += bip
                }
                if (bim > 0) {
                    tbim += bim
                }
            }
        }

        let showip = Math.floor((toip + tbip) * 10) / 10
        let showim = Math.floor((toim + tbim) * 10) / 10

        // jobs-stat-physical
        // jobs-stat-magic

        let statp = document.getElementById('jobs-stat-physical');
        if (statp != null) {
            statp.setAttribute('value', showip)
            if (showip <= 0) {
                statp.innerText = '';
            } else {
                statp.innerText = '物: ' + showip + '%';
            }
        }

        let statm = document.getElementById('jobs-stat-magic');
        if (statm != null) {
            statm.setAttribute('value', showim)
            if (showim <= 0) {
                statm.innerText = '';
            } else {
                statm.innerText = '魔: ' + showim + '%';
            }
        }

        // 诗人计算秒数
        if (this.job === 'BRD') {
            let statSec = document.getElementById('jobs-stat-buff-sec');
            if (Number(showip) > 0) {
                statSec.innerText = Math.floor((30 * 900 * (Number(showip) / 100)) / ((1 + (Number(showip) / 100)) * (230 - 100))) + 's';
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
                this.options.DotIconWidth, this.options.DotIconHeight,
                txt,
                this.options.DotBarHeight, 0,
                textColor,
                1,
                this.info.borderColor, this.info.borderColor,
                this.info.icon, this.info);
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
                this.info.icon, this.info);
            list.addElement(key, elem, Math.floor(seconds) + adjustSort);
            aura.addTimeout = null;
            this.buffsCalculation(list)

            // 语音播报
            if (Options.TTS === true && this.info.tts != null && this.info.tts != '') {
                let cmd = {'call': 'cactbotSay', 'text': this.info.tts};
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
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 10, // 物理增伤
                incrMagic: 10, // 魔法增伤
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
                incrOwn: false, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 10, // 物理增伤
                incrMagic: 10, // 魔法增伤
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
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 5, // 物理增伤
                incrMagic: 5, // 魔法增伤
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
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 4, // 物理增伤
                incrMagic: 4, // 魔法增伤
                increases: 4,
                increasesDim: {5: 10, 4: 8, 3: 6, 2: 4, 1: 2}, // 递减
                tts: '鼓励',
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
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 10, // 物理增伤
                incrMagic: 10, // 魔法增伤
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
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 5, // 物理增伤
                incrMagic: 5, // 魔法增伤
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
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 4, // 物理增伤
                incrMagic: 4, // 魔法增伤
                increases: 4,
                tts: '战斗之声',
            },
            lefteye: { // 巨龙左眼
                gainEffect: gLang.kEffect.LeftEye,
                loseEffect: gLang.kEffect.LeftEye,
                useEffectDuration: true,
                icon: 'cactbot/resources/icon/status/dragon-sight.png',
                borderColor: '#FA8737',
                sortKey: 1,
                cooldown: 120,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 5, // 物理增伤
                incrMagic: 5, // 魔法增伤
                increases: 5,
                tts: '左眼',
            },
            righteye: { // 巨龙右眼
                gainEffect: gLang.kEffect.RightEye,
                loseEffect: gLang.kEffect.RightEye,
                useEffectDuration: true,
                icon: 'cactbot/resources/icon/status/dragon-sight.png',
                borderColor: '#FA8737',
                sortKey: 1,
                cooldown: 120,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 10, // 物理增伤
                incrMagic: 10, // 魔法增伤
                increases: 10,
                tts: '右眼',
            },
            brotherhood: { // 义结金兰：斗气/攻击
                gainEffect: gLang.kEffect.Brotherhood,
                loseEffect: gLang.kEffect.Brotherhood,
                useEffectDuration: true,
                icon: 'cactbot/resources/icon/status/brotherhood.png',
                borderColor: '#994200',
                sortKey: 1,
                cooldown: 90,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 5, // 物理增伤
                incrMagic: 0, // 魔法增伤
                increases: 5,
                tts: '桃园',
            },
            devotion: { // 灵护
                gainEffect: gLang.kEffect.Devotion,
                loseEffect: gLang.kEffect.Devotion,
                useEffectDuration: true,
                icon: 'cactbot/resources/icon/status/devotion.png',
                borderColor: '#ffbf00',
                sortKey: 1,
                cooldown: 180,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 5, // 物理增伤
                incrMagic: 5, // 魔法增伤
                increases: 5,
                tts: '灵护',
            },

            raging: { // 猛者
                gainEffect: gLang.kEffect.RagingStrikes,
                loseEffect: gLang.kEffect.RagingStrikes,
                useEffectDuration: true,
                icon: 'https://xivapi.com/i/000000/000352.png',
                borderColor: '#db6509',
                sortKey: 1,
                cooldown: 80,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 10, // 物理增伤
                incrMagic: 10, // 魔法增伤
                increases: 10,
                tts: '猛者',
            },
            stormbite: { // 风
                mobGainsOwnEffect: gLang.kEffect.Stormbite,
                mobLosesOwnEffect: gLang.kEffect.Stormbite,
                useEffectDuration: true,
                icon: 'https://xivapi.com/i/002000/002614.png',
                borderColor: '#3df6fd',
                sortKey: 1,
                buffType: 'physical', // physical, magic
            },
            causticBite: { // 毒
                mobGainsOwnEffect: gLang.kEffect.CausticBite,
                mobLosesOwnEffect: gLang.kEffect.CausticBite,
                useEffectDuration: true,
                icon: 'https://xivapi.com/i/002000/002613.png',
                borderColor: '#e053bb',
                sortKey: 1,
                buffType: 'physical', // physical
            },
            //骑士
            fightOrFlight: { // [22:22:27.085] 1A:1039A1D9:水貂桑 gains the effect of 战逃反应 from xxx for 25.00 Seconds.
                gainEffect: gLang.kEffect.FightOrFlight,
                loseEffect: gLang.kEffect.FightOrFlight,
                useEffectDuration: true,
                icon: 'https://xivapi.com/i/000000/000166.png',
                borderColor: '#cc392a',
                sortKey: 1,
                cooldown: 60,
                incrOwn: true,
                incrPhysical: 25, // 物理增伤
                incrMagic: 0, // 魔法增伤
                // tts: '战逃',
            },
            requiescat: { // [22:45:16.801] 1A:1039A1D9:水貂桑 gains the effect of 安魂祈祷 from xxx for 12.00 Seconds.
                gainEffect: gLang.kEffect.Requiescat,
                loseEffect: gLang.kEffect.Requiescat,
                useEffectDuration: true,
                icon: 'https://xivapi.com/i/002000/002513.png',
                borderColor: '#2e70f5',
                sortKey: 1,
                cooldown: 60,
                incrOwn: true,
                incrPhysical: 0, // 物理增伤
                incrMagic: 50, // 魔法增伤
                // tts: '安魂',
            },
            goringBlade: { // [22:22:30.877] 1A:400001B8:木人 gains the effect of 沥血剑 from xxx for 21.00 Seconds.
                mobGainsOwnEffect: gLang.kEffect.GoringBlade,
                mobLosesOwnEffect: gLang.kEffect.GoringBlade,
                useEffectDuration: true,
                icon: 'https://xivapi.com/i/002000/002506.png',
                borderColor: '#d23e29',
                sortKey: 1,
                buffType: 'physical', // physical
            },
            circleOfScorn: { // [22:39:30.463] 1A:400001B9:木人 gains the effect of 厄运流转 from xxx for 15.00 Seconds.
                mobGainsOwnEffect: gLang.kEffect.CircleOfScorn,
                mobLosesOwnEffect: gLang.kEffect.CircleOfScorn,
                useEffectDuration: true,
                icon: 'https://xivapi.com/i/000000/000161.png',
                borderColor: '#e77d70',
                sortKey: 1,
                buffType: 'physical', // physical
            },
            // 枪刃
            noMercy: { // [22:54:08.026] 1A:1039A1D9:水貂桑 gains the effect of 无情 from xxx for 20.00 Seconds.
                gainEffect: gLang.kEffect.NoMercy,
                loseEffect: gLang.kEffect.NoMercy,
                useEffectDuration: true,
                icon: 'https://xivapi.com/i/003000/003402.png',
                borderColor: '#345ec4',
                sortKey: 1,
                cooldown: 60,
                incrOwn: true,
                incrPhysical: 20, // 物理增伤
                incrMagic: 20, // 魔法增伤
                // tts: '战逃',
            },
            sonicBreak: { //[22:54:09.441] 1A:400001B8:木人 gains the effect of 音速破 from xxx for 30.00 Seconds.
                mobGainsOwnEffect: gLang.kEffect.SonicBreak,
                mobLosesOwnEffect: gLang.kEffect.SonicBreak,
                useEffectDuration: true,
                icon: 'https://xivapi.com/i/003000/003417.png',
                borderColor: '#755cbb',
                sortKey: 1,
                buffType: 'physical', // physical
            },
            bowShock: { //[22:54:10.770] 1A:400001B8:木人 gains the effect of 弓形冲波 from xxx for 15.00 Seconds.
                mobGainsOwnEffect: gLang.kEffect.BowShock,
                mobLosesOwnEffect: gLang.kEffect.BowShock,
                useEffectDuration: true,
                icon: 'https://xivapi.com/i/003000/003423.png',
                borderColor: '#d5d557',
                sortKey: 1,
                buffType: 'physical', // physical
            },
            // 白魔
            dia: { //[23:07:47.882] 1A:400001B8:木人 gains the effect of 天辉 from xxx for 30.00 Seconds.
                mobGainsOwnEffect: gLang.kEffect.Dia,
                mobLosesOwnEffect: gLang.kEffect.Dia,
                useEffectDuration: true,
                icon: 'https://xivapi.com/i/002000/002641.png',
                borderColor: '#3eb9fa',
                sortKey: 1,
                buffType: 'magic', // physical
            },
            // 学者
            chain: { // 连环计
                gainAbility: gLang.kAbility.ChainStratagem,
                durationSeconds: 15,
                icon: 'cactbot/resources/icon/status/chain-stratagem.png',
                // Blue.
                borderColor: '#4674E5',
                sortKey: 1,
                cooldown: 120,
                incrOwn: false, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 5, // 物理增伤
                incrMagic: 5, // 魔法增伤
                tts: '连环计',
            },
            biolysis: { //[23:15:37.240] 1A:400001B8:木人 gains the effect of 蛊毒法 from xxx for 30.00 Seconds.
                mobGainsOwnEffect: gLang.kEffect.Biolysis,
                mobLosesOwnEffect: gLang.kEffect.Biolysis,
                useEffectDuration: true,
                icon: 'https://xivapi.com/i/002000/002820.png',
                borderColor: '#2e1fc4',
                sortKey: 1,
                buffType: 'magic', // physical
            },
            // 占星
            combustIII: { //[23:24:52.095] 1A:400001B8:木人 gains the effect of 焚灼 from xxx for 30.00 Seconds.
                mobGainsOwnEffect: gLang.kEffect.CombustIII,
                mobLosesOwnEffect: gLang.kEffect.CombustIII,
                useEffectDuration: true,
                icon: 'https://xivapi.com/i/003000/003554.png',
                borderColor: '#62daf8',
                sortKey: 1,
                buffType: 'magic', // physical
            },
            divination: { // 占卜
                gainEffect: gLang.kEffect.Divination,
                loseEffect: gLang.kEffect.Divination,
                useEffectDuration: true,
                icon: 'cactbot/resources/icon/status/divination.png',
                borderColor: '#5C1F58',
                sortKey: 1,
                cooldown: 120,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 6, // 物理增伤
                incrMagic: 6, // 魔法增伤
                tts: '占卜',
            },
            arrow: { // 放浪神之箭
                gainEffect: gLang.kEffect.Arrow,
                loseEffect: gLang.kEffect.Arrow,
                useEffectDuration: true,
                icon: 'cactbot/resources/icon/status/arrow.png',
                // Light Blue.
                borderColor: '#37ccee',
                sortKey: 1,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
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
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
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
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
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
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
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
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
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
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
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
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
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
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                increasesJob: {melee: 8, ranged: 4},
                tts: '近卡',
            },
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
            this.onBigBuff('', name, seconds, b, source, false);
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
            this.onBigBuff('', b.name, seconds, b, source, false);
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
            let target = gainTargetFromLog(log);
            this.onBigBuff(target, b.name, seconds, b, source, true);
        }
    }

    onLoseEffect(buffs, log) {
        if (!buffs)
            return;
        for (let b of buffs)
            this.onLoseBigBuff('', b.name, b);
    }

    onLoseOwnEffect(buffs, log) {
        if (!buffs)
            return;
        for (let b of buffs) {
            let target = loseTargetFromLog(log);
            this.onLoseBigBuff(target, b.name, b);
        }
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

    onBigBuff(target, name, seconds, info, source, ownBuff) {
        if (seconds <= 0)
            return;

        let list = this.rightBuffDiv;
        if (info.side == 'left' && this.leftBuffDiv)
            list = this.leftBuffDiv;

        if (info.increasesJob != null) { // 根据远近判断
            if (isMeleeJob(this.job)) {
                info.incrPhysical = info.increasesJob.melee; // 物理增伤
                info.incrMagic = info.increasesJob.melee; // 魔法增伤
            } else {
                info.increases = info.increasesJob.ranged
                info.incrPhysical = info.increasesJob.ranged; // 物理增伤
                info.incrMagic = info.increasesJob.ranged; // 魔法增伤
            }
        }

        let tname = target + "=>" + name
        let buff = this.buffs[tname];
        if (!buff) {
            if (ownBuff === true) {
                this.buffs[tname] = new Buff(this.job, tname, info, this.ownBuffDiv, this.options, true);
            } else {
                this.buffs[tname] = new Buff(this.job, tname, info, list, this.options, false);
            }
            buff = this.buffs[tname];
        }

        let shareList = info.sharesCooldownWith || [];
        for (let share of shareList) {
            let existingBuff = this.buffs[share];
            if (existingBuff)
                existingBuff.clearCooldown(source);
        }
        buff.onGain(seconds, source);
    }

    onLoseBigBuff(target, name) {
        let tname = target + "=>" + name
        let buff = this.buffs[tname];
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
        this.job = '';
        this.o = {};
        this.combo = 0;

        this.comboFuncs = [];
        this.gainEffectFuncMap = {};
        this.loseEffectFuncMap = {};
        this.abilityFuncMap = {};

        let secb = getQueryVariable('brdsec');
        if (secb !== false && secb == 0) { // 关闭sec展示
            this.options.TextBrdSec = false;
        }
    }

    // 统计信息布局
    SetStatLayout() {
        this.o.Stat = document.getElementById('jobs-stat');
        if (this.o.Stat == null) {
            let root = document.getElementById('container');
            this.o.Stat = document.createElement('div');
            this.o.Stat.id = 'jobs-stat';
            this.o.Stat.style.height = Number(this.options.DotIconHeight) + Number(this.options.DotBarHeight)
            root.appendChild(this.o.Stat);
        }
        while (this.o.Stat.childNodes.length)
            this.o.Stat.removeChild(this.o.Stat.childNodes[0]);

        // 物理增伤
        this.o.StatPhysical = document.createElement('div');
        this.o.StatPhysical.id = 'jobs-stat-physical';
        this.o.StatPhysical.style.color = this.options.TextPhysicalTextColor;
        this.o.StatPhysical.style.fontSize = this.options.TextPhysicalFontSize;
        this.o.StatPhysical.setAttribute('value', 0)
        this.o.Stat.appendChild(this.o.StatPhysical)
        // this.o.StatPhysical.innerText = '物: 10%';

        // 魔法增伤
        this.o.StatMagic = document.createElement('div');
        this.o.StatMagic.id = 'jobs-stat-magic';
        this.o.StatMagic.style.color = this.options.TextMagicTextColor;
        this.o.StatMagic.style.fontSize = this.options.TextMagicFontSize;
        this.o.StatMagic.style.top = this.options.TextPhysicalFontSize;
        this.o.StatMagic.setAttribute('value', 0)
        this.o.Stat.appendChild(this.o.StatMagic)
        // this.o.StatMagic.innerText = '魔: 10%';

        // 设置统计div高度
        let sWidth = Number(this.options.TextPhysicalFontSize) * 5
        let dotHeight = Number(this.options.DotIconHeight) + Number(this.options.DotBarHeight)
        let fontHeight = Number(this.options.TextPhysicalFontSize) + Number(this.options.TextPhysicalFontSize) + 5
        if (dotHeight > fontHeight) {
            this.o.Stat.style.height = dotHeight
        } else {
            this.o.Stat.style.height = fontHeight
        }

        // 设置DOT位置
        this.o.StatDot = document.createElement('div');
        this.o.StatDot.id = 'jobs-stat-dot';
        // this.o.StatDot.style.left = sWidth + 10;
        this.o.Stat.appendChild(this.o.StatDot)

        this.o.StatDotList = document.createElement('widget-list');
        this.o.StatDotList.rowcolsize = 1;
        this.o.StatDotList.maxnumber = 20;
        this.o.StatDotList.toward = 'left down';
        this.o.StatDotList.elementwidth = this.options.DotIconWidth + 2;
        this.o.StatDotList.elementheight = this.options.DotIconHeight + this.options.DotBarHeight;
        this.o.StatDot.appendChild(this.o.StatDotList);

        // 设置秒数位置
        this.o.StatBuffSec = document.createElement('div');
        this.o.StatBuffSec.id = 'jobs-stat-buff-sec';
        // this.o.StatBuffSec.style.left = (sWidth + 10) + (this.options.DotIconWidth + 2) * 2 + 10;
        this.o.StatBuffSec.style.left = sWidth + 10;
        this.o.Stat.appendChild(this.o.StatBuffSec);
    }

    // 更新职业(布局)
    UpdateJob() {
        this.comboFuncs = [];
        this.gainEffectFuncMap = {};
        this.loseEffectFuncMap = {};
        this.abilityFuncMap = {};

        // 初始化
        this.o = {};

        // 统计信息布局
        this.SetStatLayout()

        let container = document.getElementById('jobs-container'); // 查找对应ID的元素
        if (container == null) {
            let root = document.getElementById('container');
            container = document.createElement('div');
            container.id = 'jobs-container';
            root.appendChild(container);
        }
        while (container.childNodes.length)
            container.removeChild(container.childNodes[0]);

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

    OnComboChange(skill) {
        for (let i = 0; i < this.comboFuncs.length; ++i)
            this.comboFuncs[i](skill);
    }

    // 切换职业
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
            // Set up the buff tracker after the job bars are created.
            this.buffTracker = new BuffTracker(this.options, this.me, this.job, this.o.leftBuffsList, this.o.rightBuffsList, this.o.StatDotList);
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
        // setTimeout(() => {
        //     let logs = ['[10:10:10.000] 1A:10000000:' + this.me + ' gains the effect of 放浪神之箭 from Okonomi Yaki for 10.00 Seconds.'];
        //     let e = {detail: {logs: logs}};
        //     this.OnLogEvent(e);
        // }, 2000)
        // setTimeout(() => {
        //     let logs = ['[10:10:10.000] 1A:10000000:' + this.me + ' gains the effect of 太阳神之衡 from Okonomi Yaki for 5.00 Seconds.'];
        //     let e = {detail: {logs: logs}};
        //     this.OnLogEvent(e);
        // }, 3000)
        //
        // setTimeout(() => {
        //     let logs = ['[10:10:10.000] 1A:10000000:' + this.me + ' gains the effect of 义结金兰：攻击 from Okonomi Yaki for 25.00 Seconds.'];
        //     let e = {detail: {logs: logs}};
        //     this.OnLogEvent(e);
        // }, 4000)

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

        setTimeout(() => {
            let logs = ['[22:26:37.632] 1A:4000032E:木人 gains the effect of 狂风蚀箭 from ' + this.me + ' for 30.00 Seconds.'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 4000)

        setTimeout(() => {
            let logs = ['[22:26:37.632] 1A:4000032E:木人 gains the effect of 烈毒咬箭 from ' + this.me + ' for 30.00 Seconds.'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 5000)

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

