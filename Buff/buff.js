'use strict';

// text on the pull countdown.
const kPullText = {
    en: 'Pull',
    de: 'Start',
    ja: 'タゲ取る',
    cn: '开怪',
    ko: '풀링',
};

const kAbility = {
    TrickAttack: '8D2',
    ChainStratagem: '1D0C',
}

const OwnEffectId = {
    // 诗人
    'Stormbite': '4B1', // 风
    'CausticBite': '4B0', // 毒

    // 骑士
    'Requiescat': '558', // 安魂祈祷

    // 白膜
    'Dia': '74F', // 天辉

    // 学者
    'Biolysis': '767', // 蛊毒法
    'ChainStratagem': '4C5', // 连环计

    // 占星
    'CombustIII': '759', // 焚灼

    // 武僧
    'Demolish': 'F6',// 破碎拳
    'RiddleOfFire': '49D', // 红莲极意

    // 龙骑
    'ChaosThrust': '76', // 樱花怒放
    'BattleLitany': '312', // 战斗连祷
    'LeftEye': '5AE', // 巨龙左眼
    'RightEye': '5AD', // 巨龙右眼

    // 忍着
    'TrickAttack': '27E', // 背刺
    'ShadowFang': '1FC', // 影牙

    // 武士
    'Higanbana': '4CC', // 彼岸花
    // 机工
    'Bioblaster': '74A', // 毒菌冲击
    // 黑魔
    'ThunderIII': 'A3', // 暴雷
    // 召唤
    'BioIII': '4BE', // 剧毒菌
    'MiasmaIII': '4BF', // 瘴暍
    // 赤魔
    'EmboldenIsMe': '4D7', // 鼓励 自己给自己
}


// Regexes to be filled out once we know the player's name.
let kYouGainEffectRegex = null;
let kYouLoseEffectRegex = null;
let kMobGainsOwnEffectRegex = null; // 自己给boss上的buff
let kMobLosesOwnEffectRegex = null; // 自己在boss身上丢失的buff
let kMobGainsPartyEffectRegex = null; // 小队给目标身上增加的buff
let kMobLosesPartyEffectRegex = null; // 小队在目标身上丢失的buff

let kYouUseAbilityRegex = null;
let kPartyUseAbilityRegex = null;

// 近战职业列表
let meleeJobs = ['PLD', 'WAR', 'DRK', 'GNB', 'MNK', 'DRG', 'NIN', 'SAM'];

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

// 设置正则匹配
function setupRegexes(playerId, partyTracker) {
    if (playerId === '') {
        return
    }
    // 对自己增加的buff
    kYouGainEffectRegex = NetRegexes.gainsEffect({targetId: playerId});
    kYouLoseEffectRegex = NetRegexes.losesEffect({targetId: playerId});
    // 自己对目标(敌人/宠物)释放的buff/DOT
    kMobGainsOwnEffectRegex = NetRegexes.gainsEffect({targetId: '4.{7}', sourceId: playerId});
    kMobLosesOwnEffectRegex = NetRegexes.losesEffect({targetId: '4.{7}', sourceId: playerId});
    // 小队对目标(敌人/宠物)释放的Buff/DOT
    let partyIds = [];
    for (let id of partyTracker.partyIds) {
        if (id !== playerId) {
            partyIds.push(id);
        }
    }
    let partyIdsStr = partyIds.join("|");
    // kMobGainsPartyEffectRegex = NetRegexes.gainsEffect({targetId: '4.{7}', sourceId: '(' + partyIdsStr + ')'});
    // kMobLosesPartyEffectRegex = NetRegexes.losesEffect({targetId: '4.{7}', sourceId: '(' + partyIdsStr + ')'});
    kYouUseAbilityRegex = NetRegexes.ability({targetId: '4.{7}', sourceId: playerId});
    kPartyUseAbilityRegex = NetRegexes.ability({targetId: '4.{7}', sourceId: '(' + partyIdsStr + ')'});

    console.log(partyTracker, kMobGainsPartyEffectRegex, kPartyUseAbilityRegex);
}

function makeAuraTimerIcon(name, seconds, opacity, iconWidth, iconHeight, iconText, barHeight, textHeight, textColor, borderSize, borderColor, barColor, auraIcon, buffInfo) {
    let div = document.createElement('div');
    div.style.opacity = opacity;
    div.className = 'buffs'
    // 设置buff详细信息
    div.setAttribute('buffs-name', name)
    // div.setAttribute('buffs-value', buffInfo.increases)
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

// 寻找Count类型的BUFF
function findCountBuff(domList, tname) {
    let tgs = domList.rootElement.getElementsByClassName('buffs');
    for (let i = 0; i < tgs.length; i++) {
        let bname = tgs[i].getAttribute('buffs-name')
        if (bname === tname) {
            return tgs[i];
        }
    }
    return null;
}

function updateCountBuff(dom, physical, magic) {
    dom.setAttribute('buffs-incr-physical', physical) // 作用物理
    dom.setAttribute('buffs-incr-magic', magic) // 作用魔法
}

// 计算buff, 展示剩余多少时间刷buff是值得
function buffsCalculation(job, options, list) {
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
        if (bio === 'true') { // 作用自己, 乘法公式
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
    if (job === 'BRD' && options.TextBrdSec === true) {
        let statSec = document.getElementById('jobs-stat-buff-sec');
        if (Number(showip) > 0) {
            statSec.innerText = Math.floor((30 * 900 * (Number(showip) / 100)) / ((1 + (Number(showip) / 100)) * (230 - 100))) + 's';
        } else {
            statSec.innerText = '';
        }
    }
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

        // tracked auras
        this.active = null;
        this.cooldown = {};
        this.ready = {};

        // Hacky numbers to sort active > ready > cooldowns by adjusting sort keys.
        this.readySortKeyBase = 1000;
        this.cooldownSortKeyBase = 2000;
    }

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
        if (this.job === 'BRD' && this.options.TextBrdSec === true) {
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
                this.options.DotBorderSize,
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
        if (this.info.gainEffect === EffectId.Medicated && seconds >= 120) {
            return
        }

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
            buffsCalculation(this.job, this.options, list)
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
            buffsCalculation(this.job, this.options, list)

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
            if (this.options.DOT === true) {
                this.active = this.makeOwnAura(this.name, this.activeList, seconds, 0, 0, 'white', '', 1);
            }
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
    constructor(options, playerId, job, leftBuffDiv, rightBuffDiv, ownBuffDiv) {
        this.options = options;
        this.playerId = playerId;
        this.job = job;
        this.ownBuffDiv = ownBuffDiv;
        this.leftBuffDiv = leftBuffDiv;
        this.rightBuffDiv = rightBuffDiv;
        this.buffs = {};

        this.buffInfo = {
            potion: { // 强化药  26|2020-09-20T03:24:38.9810000+08:00|31|强化药|30.00|1039A1D9|水貂桑|1039A1D9|水貂桑|28D6|111340|111340||63c01dd83f9942aec827298ddef1519b
                gainEffect: EffectId.Medicated,
                loseEffect: EffectId.Medicated,
                useEffectDuration: true,
                // icon: 'cactbot/resources/icon/status/potion.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/8/87/%E6%8A%80%E8%83%BD%E5%9B%BE%E6%A0%87_%E8%87%AA%E7%88%86.png',
                icon: '../resources/img/000000.png',
                borderColor: '#AA41B2',
                sortKey: 0,
                cooldown: 270, //CD
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 8, // 物理增伤
                incrMagic: 8, // 魔法增伤
            },
            //骑士   26|2020-09-20T03:16:28.1830000+08:00|4c|战逃反应|25.00|1039A1D9|水貂桑|1039A1D9|水貂桑|00|114648|114648||944a97734ac0fe2928b2e92739402f83
            fightOrFlight: { // [22:22:27.085] 1A:1039A1D9:xxx gains the effect of 战逃反应 from xxx for 25.00 Seconds.
                gainEffect: EffectId.FightOrFlight,
                loseEffect: EffectId.FightOrFlight,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/000000/000166.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/8/8b/000166.png',
                icon: '../resources/img/000166.png',
                borderColor: '#cc392a',
                sortKey: 1,
                cooldown: 60,
                incrOwn: true,
                incrPhysical: 25, // 物理增伤
                incrMagic: 0, // 魔法增伤
                // tts: '战逃',
            },
            // 26|2020-09-20T03:31:40.6740000+08:00|558|安魂祈祷|12.00|1039A1D9|水貂桑|1039A1D9|水貂桑|FF9C|114648|114648||35703e9553d4bf19abcbcd58e0da5257
            requiescat: { // [22:45:16.801] 1A:1039A1D9:xxx gains the effect of 安魂祈祷 from xxx for 12.00 Seconds.
                gainEffect: OwnEffectId.Requiescat,
                loseEffect: OwnEffectId.Requiescat,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/002000/002513.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/d/d5/002513.png',
                icon: '../resources/img/002513.png',
                borderColor: '#2e70f5',
                sortKey: 1,
                cooldown: 60,
                incrOwn: true,
                incrPhysical: 0, // 物理增伤
                incrMagic: 50, // 魔法增伤
                // tts: '安魂',
            },
            // 枪刃
            noMercy: { // [22:54:08.026] 1A:1039A1D9:xxx gains the effect of 无情 from xxx for 20.00 Seconds.
                gainEffect: EffectId.NoMercy,
                loseEffect: EffectId.NoMercy,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/003000/003402.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/6/66/003402.png',
                icon: '../resources/img/003402.png',
                borderColor: '#345ec4',
                sortKey: 1,
                cooldown: 60,
                incrOwn: true,
                incrPhysical: 20, // 物理增伤
                incrMagic: 20, // 魔法增伤
                // tts: '无情',
            },
            // 学者
            // 26|2020-09-20T17:11:46.0110000+08:00|4c5|连环计|15.00|1039A1D9|水貂桑|4000031F|木人|00|7400000|46919||cef9177cfc401552bc4e8155d546096e
            chain: { // 连环计
                gainAbility: kAbility.ChainStratagem,
                durationSeconds: 15,
                // icon: 'cactbot/resources/icon/status/chain-stratagem.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/f/fd/002815.png',
                icon: '../resources/img/002815.png',
                borderColor: '#849dfd',
                sortKey: 1,
                cooldown: 120,
                incrOwn: false, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 5, // 物理增伤
                incrMagic: 5, // 魔法增伤
                tts: '连环计',
            },
            // 占星
            divination: { // 占卜
                gainEffect: EffectId.Divination,
                loseEffect: EffectId.Divination,
                gainNetRegex: NetRegexes.gainsEffect({targetId: this.playerId}), // (AOE-BUFF,会激活宠物buff) 仅限给自己
                useEffectDuration: true,
                // icon: 'cactbot/resources/icon/status/divination.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/f/fc/003553.png',
                icon: '../resources/img/003553.png',
                borderColor: '#e8c353',
                sortKey: 1,
                cooldown: 120,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 6, // 物理增伤
                incrMagic: 6, // 魔法增伤
                tts: '占卜',
            },
            arrow: { // 放浪神之箭
                gainEffect: EffectId.TheArrow,
                loseEffect: EffectId.TheArrow,
                gainNetRegex: NetRegexes.gainsEffect({targetId: this.playerId}), // (AOE-BUFF,会激活宠物buff) 仅限给自己
                useEffectDuration: true,
                // icon: 'cactbot/resources/icon/status/arrow.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/1/10/003113.png',
                icon: '../resources/img/003113.png',
                borderColor: '#37ccee',
                sortKey: 1,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                increasesJob: {melee: 6, ranged: 3},
                tts: '近卡',
            },
            balance: { // 太阳神之衡
                gainEffect: EffectId.TheBalance,
                loseEffect: EffectId.TheBalance,
                gainNetRegex: NetRegexes.gainsEffect({targetId: this.playerId}), // (AOE-BUFF,会激活宠物buff) 仅限给自己
                useEffectDuration: true,
                // icon: 'cactbot/resources/icon/status/balance.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/8/8d/003110.png',
                icon: '../resources/img/003110.png',
                // Orange.
                borderColor: '#ff5900',
                sortKey: 1,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                increasesJob: {melee: 6, ranged: 3},
                tts: '近卡',
            },
            bole: { // 世界树之干
                gainEffect: EffectId.TheBole,
                loseEffect: EffectId.TheBole,
                gainNetRegex: NetRegexes.gainsEffect({targetId: this.playerId}), // (AOE-BUFF,会激活宠物buff) 仅限给自己
                useEffectDuration: true,
                // icon: 'cactbot/resources/icon/status/bole.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/e/e0/003112.png',
                icon: '../resources/img/003112.png',
                borderColor: '#22dd77',
                sortKey: 1,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                increasesJob: {melee: 3, ranged: 6},
                tts: '远卡',
            },
            ewer: { // 河流神之瓶
                gainEffect: EffectId.TheEwer,
                loseEffect: EffectId.TheEwer,
                gainNetRegex: NetRegexes.gainsEffect({targetId: this.playerId}), // (AOE-BUFF,会激活宠物buff) 仅限给自己
                useEffectDuration: true,
                // icon: 'cactbot/resources/icon/status/ewer.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/6/66/003114.png',
                icon: '../resources/img/003114.png',
                borderColor: '#66ccdd',
                sortKey: 1,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                increasesJob: {melee: 3, ranged: 6},
                tts: '远卡',
            },
            spear: { // 战争神之枪
                gainEffect: EffectId.TheSpear,
                loseEffect: EffectId.TheSpear,
                gainNetRegex: NetRegexes.gainsEffect({targetId: this.playerId}), // (AOE-BUFF,会激活宠物buff) 仅限给自己
                useEffectDuration: true,
                // icon: 'cactbot/resources/icon/status/spear.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/5/5d/003111.png',
                icon: '../resources/img/003111.png',
                borderColor: '#4477dd',
                sortKey: 1,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                increasesJob: {melee: 6, ranged: 3},
                tts: '近卡',
            },
            spire: { // 建筑神之塔
                gainEffect: EffectId.TheSpire,
                loseEffect: EffectId.TheSpire,
                gainNetRegex: NetRegexes.gainsEffect({targetId: this.playerId}), // (AOE-BUFF,会激活宠物buff) 仅限给自己
                useEffectDuration: true,
                // icon: 'cactbot/resources/icon/status/spire.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/8/88/003115.png',
                icon: '../resources/img/003115.png',
                borderColor: '#ddd044',
                sortKey: 1,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                increasesJob: {melee: 3, ranged: 6},
                tts: '远卡',
            },
            ladyOfCrowns: { // 王冠之贵妇
                gainEffect: EffectId.LadyOfCrowns,
                loseEffect: EffectId.LadyOfCrowns,
                gainNetRegex: NetRegexes.gainsEffect({targetId: this.playerId}), // (AOE-BUFF,会激活宠物buff) 仅限给自己
                useEffectDuration: true,
                // icon: 'cactbot/resources/icon/status/lady-of-crowns.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/5/59/003146.png',
                icon: '../resources/img/003146.png',
                borderColor: '#9e5599',
                sortKey: 1,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                increasesJob: {melee: 4, ranged: 8},
                tts: '远卡',
            },
            lordOfCrowns: { // 王冠之领主
                gainEffect: EffectId.LordOfCrowns,
                loseEffect: EffectId.LordOfCrowns,
                gainNetRegex: NetRegexes.gainsEffect({targetId: this.playerId}), // (AOE-BUFF,会激活宠物buff) 仅限给自己
                useEffectDuration: true,
                // icon: 'cactbot/resources/icon/status/lord-of-crowns.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/a/a8/003147.png',
                icon: '../resources/img/003147.png',
                borderColor: '#9a2222',
                sortKey: 1,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                increasesJob: {melee: 8, ranged: 4},
                tts: '近卡',
            },
            // 武僧
            riddleOfFire: { // [23:31:04.573] 1A:1039A1D9:xxx gains the effect of 红莲极意 from xxx for 20.00 Seconds.
                gainEffect: OwnEffectId.RiddleOfFire,
                loseEffect: OwnEffectId.RiddleOfFire,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/002000/002541.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/8/8f/002541.png',
                icon: '../resources/img/002541.png',
                borderColor: '#dc625a',
                sortKey: 1,
                cooldown: 90,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 25, // 物理增伤
                incrMagic: 25, // 魔法增伤
            },
            brotherhood: { // 义结金兰：斗气/攻击
                gainEffect: EffectId.Brotherhood,
                loseEffect: EffectId.Brotherhood,
                gainNetRegex: NetRegexes.gainsEffect({targetId: this.playerId}), // (AOE-BUFF,会激活宠物buff) 仅限给自己
                useEffectDuration: true,
                // icon: 'cactbot/resources/icon/status/brotherhood.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/d/db/002542.png',
                icon: '../resources/img/002542.png',
                borderColor: '#994200',
                sortKey: 1,
                cooldown: 90,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 5, // 物理增伤
                incrMagic: 0, // 魔法增伤
                tts: '桃园',
            },
            // 龙骑
            lanceCharge: { // [23:47:03.086] 1A:1039A1D9:xxx gains the effect of 猛枪 from xxx for 20.00 Seconds.
                gainEffect: EffectId.LanceCharge,
                loseEffect: EffectId.LanceCharge,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/000000/000309.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/0/07/000309.png',
                icon: '../resources/img/000309.png',
                borderColor: '#831819',
                sortKey: 1,
                cooldown: 90,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 15, // 物理增伤
                incrMagic: 15, // 魔法增伤
            },
            litany: { //战斗连祷 [23:47:29.214] 1A:1039A1D9:xxx gains the effect of 战斗连祷 from xxx for 20.00 Seconds.
                gainEffect: OwnEffectId.BattleLitany,
                loseEffect: OwnEffectId.BattleLitany,
                gainNetRegex: NetRegexes.gainsEffect({targetId: this.playerId}), // (AOE-BUFF,会激活宠物buff) 仅限给自己
                useEffectDuration: true,
                // icon: 'cactbot/resources/icon/status/battle-litany.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/3/32/002585.png',
                icon: '../resources/img/002585.png',
                borderColor: '#009999',
                sortKey: 1,
                cooldown: 180,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 5, // 物理增伤
                incrMagic: 5, // 魔法增伤
                tts: '连祷',
            },
            lefteye: { // 巨龙左眼
                gainEffect: OwnEffectId.LeftEye,
                loseEffect: OwnEffectId.LeftEye,
                gainNetRegex: NetRegexes.gainsEffect({targetId: this.playerId}), // (AOE-BUFF,会激活宠物buff) 仅限给自己
                useEffectDuration: true,
                // icon: 'cactbot/resources/icon/status/dragon-sight.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/d/de/002587.png',
                icon: '../resources/img/002587.png',
                borderColor: '#f85d48',
                sortKey: 1,
                cooldown: 120,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 5, // 物理增伤
                incrMagic: 5, // 魔法增伤
                tts: '左眼',
            },
            righteye: { // 巨龙右眼
                gainEffect: OwnEffectId.RightEye,
                loseEffect: OwnEffectId.RightEye,
                gainNetRegex: NetRegexes.gainsEffect({targetId: this.playerId}), // (AOE-BUFF,会激活宠物buff) 仅限给自己
                useEffectDuration: true,
                // icon: 'cactbot/resources/icon/status/dragon-sight.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/d/de/002587.png',
                icon: '../resources/img/002587.png',
                borderColor: '#fa5437',
                sortKey: 1,
                cooldown: 120,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 10, // 物理增伤
                incrMagic: 10, // 魔法增伤
            },
            // 忍者
            trick: { // 背刺
                gainAbility: kAbility.TrickAttack,
                durationSeconds: 15,
                // icon: 'cactbot/resources/icon/status/trick-attack.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/8/82/000618.png',
                icon: '../resources/img/000618.png',
                borderColor: '#ff8400',
                sortKey: 1,
                cooldown: 60,
                incrOwn: false, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 5, // 物理增伤
                incrMagic: 5, // 魔法增伤
                tts: '背刺',
            },
            // 舞娘
            devilment: { // 进攻之探戈
                gainEffect: EffectId.Devilment,
                loseEffect: EffectId.Devilment,
                gainNetRegex: NetRegexes.gainsEffect({targetId: this.playerId}), // (AOE-BUFF,会激活宠物buff) 仅限给自己
                durationSeconds: 20,
                // icon: 'cactbot/resources/icon/status/devilment.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/e/ef/003471.png',
                icon: '../resources/img/003471.png',
                borderColor: '#006400',
                sortKey: 1,
                cooldown: 120,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 15, // 物理增伤
                incrMagic: 15, // 魔法增伤
                increases: 15,
                tts: '贪个',
            },
            technicalFinish: { // 技巧舞步结束
                gainEffect: EffectId.TechnicalFinish,
                loseEffect: EffectId.TechnicalFinish,
                gainNetRegex: NetRegexes.gainsEffect({targetId: this.playerId}), // (AOE-BUFF,会激活宠物buff) 仅限给自己
                durationSeconds: 20,
                // icon: 'cactbot/resources/icon/status/technical-finish.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/b/ba/003474.png',
                icon: '../resources/img/003474.png',
                borderColor: '#E0757C',
                sortKey: 1,
                cooldown: 120,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 5, // 物理增伤
                incrMagic: 5, // 魔法增伤
                increases: 5,
                tts: '技巧',
            },
            // 诗人
            raging: { // 猛者 26|2020-09-20T03:48:12.5040000+08:00|7d|猛者强击|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|00|111340|111340||7f5d92a566794a793b65f97686f3699f
                gainEffect: EffectId.RagingStrikes,
                loseEffect: EffectId.RagingStrikes,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/000000/000352.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/2/2a/000352.png',
                icon: '../resources/img/000352.png',
                borderColor: '#db6509',
                sortKey: 1,
                cooldown: 80,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 10, // 物理增伤
                incrMagic: 10, // 魔法增伤
                tts: '猛者',
            },
            battlevoice: { // 战斗之声
                gainEffect: EffectId.BattleVoice,
                loseEffect: EffectId.BattleVoice,
                gainNetRegex: NetRegexes.gainsEffect({targetId: this.playerId}), // (AOE-BUFF,会激活宠物buff) 仅限其他人给自己
                useEffectDuration: true,
                // icon: 'cactbot/resources/icon/status/battlevoice.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/5/55/002601.png',
                icon: '../resources/img/002601.png',
                borderColor: '#D6371E',
                sortKey: 1,
                cooldown: 180,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 4, // 物理增伤
                incrMagic: 4, // 魔法增伤
                increases: 4,
                tts: '战斗之声',
            },
            // 召唤
            devotion: { // 灵护
                gainEffect: EffectId.Devotion,
                loseEffect: EffectId.Devotion,
                gainNetRegex: NetRegexes.gainsEffect({targetId: this.playerId}), // (AOE-BUFF,会激活宠物buff) 仅限其他人给自己
                useEffectDuration: true,
                // icon: 'cactbot/resources/icon/status/devotion.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/2/25/002688.png',
                icon: '../resources/img/002688.png',
                borderColor: '#ffbf00',
                sortKey: 1,
                cooldown: 180,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 5, // 物理增伤
                incrMagic: 5, // 魔法增伤
                tts: '灵护',
            },
            // 赤魔
            // 26|2020-09-20T22:04:03.9440000+08:00|4d7|鼓励|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|05|52289|52289||140096ff8fe52cfc344ee31759a6b422
            // 26|2020-09-20T22:04:04.0780000+08:00|511|鼓励|20.00|1039A1D9|水貂桑|4002759B|陆行鸟|05|76590|52289||cc9ad3416a052b54bbdb68804582dcc5
            // 26|2020-09-20T22:04:07.9110000+08:00|4d7|鼓励|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|04|52289|52289||369bee40aab7cfa72bc77aacd0165e89
            // 26|2020-09-20T22:04:08.0440000+08:00|511|鼓励|20.00|1039A1D9|水貂桑|4002759B|陆行鸟|04|76590|52289||e9c9aec09171bb3d4923e00aafc962db
            // 26|2020-09-20T22:04:11.9220000+08:00|4d7|鼓励|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|03|52289|52289||b132a58f47a1244ea60dc97ed136d1ac
            // 26|2020-09-20T22:04:12.0550000+08:00|511|鼓励|20.00|1039A1D9|水貂桑|4002759B|陆行鸟|03|76590|52289||530cf250118e141c356b6414bd99e237
            // 26|2020-09-20T22:04:15.9350000+08:00|4d7|鼓励|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|02|52289|52289||b6f281d9939cadf98e0a3c4e20971f45
            // 26|2020-09-20T22:04:16.0710000+08:00|511|鼓励|20.00|1039A1D9|水貂桑|4002759B|陆行鸟|02|76590|52289||abe03f69fcb61b9ae37e632b1fcf71eb
            // 26|2020-09-20T22:04:19.9490000+08:00|4d7|鼓励|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|01|52289|52289||ed928b5ff87c09a4538e74809e11cccd
            // 26|2020-09-20T22:04:20.0830000+08:00|511|鼓励|20.00|1039A1D9|水貂桑|4002759B|陆行鸟|01|76590|52289||63e1491deabf976eaa7e16edbb05e3e8
            // 30|2020-09-20T22:04:24.0480000+08:00|511|鼓励|0.00|1039A1D9|水貂桑|4002759B|陆行鸟|01|76590|52289||91727e97f2e91e3b4823830ea6a35adb
            // 30|2020-09-20T22:04:24.0480000+08:00|511|鼓励|0.00|1039A1D9|水貂桑|4002759B|陆行鸟|01|76590|52289||91727e97f2e91e3b4823830ea6a35adb
            emboldenToMe: { // 鼓励(从赤魔得到) 511
                gainEffect: EffectId.Embolden,
                loseEffect: EffectId.Embolden,
                gainNetRegex: NetRegexes.gainsEffect({targetId: this.playerId}), // (AOE-BUFF,会激活宠物buff) 仅限其他人给自己
                useEffectDuration: true,
                // icon: 'cactbot/resources/icon/status/embolden.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/2/2c/003218.png',
                icon: '../resources/img/003218.png',
                // Lime.
                borderColor: '#bcbce3',
                sortKey: 1,
                cooldown: 120,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 0, // 物理增伤
                incrMagic: 0, // 魔法增伤
                incrPhysicalCount: {'05': 10, '04': 8, '03': 6, '02': 4, '01': 2}, // 物理增伤
                incrMagicCount: {'05': 0, '04': 0, '03': 0, '02': 0, '01': 0}, // 魔法增伤
                tts: '鼓励',
            },
            emboldenIsMe: { // 鼓励(自己给自己) 4d7
                gainEffect: OwnEffectId.EmboldenIsMe,
                loseEffect: OwnEffectId.EmboldenIsMe,
                gainNetRegex: NetRegexes.gainsEffect({sourceId: this.playerId, targetId: this.playerId}), // (AOE-BUFF,会激活宠物buff) 仅限其他人给自己
                useEffectDuration: true,
                // icon: 'cactbot/resources/icon/status/embolden.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/2/2c/003218.png',
                icon: '../resources/img/003218.png',
                // Lime.
                borderColor: '#bcbce3',
                sortKey: 1,
                cooldown: 120,
                incrOwn: true, // 自身增伤, 应用乘法叠加, true 自身增伤乘法叠加, false boss增伤加法叠加
                incrPhysical: 0, // 物理增伤
                incrMagic: 0, // 魔法增伤
                incrPhysicalCount: {'05': 0, '04': 0, '03': 0, '02': 0, '01': 0}, // 物理增伤
                incrMagicCount: {'05': 10, '04': 8, '03': 6, '02': 4, '01': 2}, // 魔法增伤
                tts: '鼓励',
            },

            // DOT
            stormbite: { // 风   26|2020-09-20T03:20:11.1660000+08:00|4b1|狂风蚀箭|30.00|1039A1D9|水貂桑|4000031F|木人|28|7400000|111340||dbf0314ef7fed2a2b2285e2a3b17d02f
                mobGainsOwnEffect: OwnEffectId.Stormbite,
                mobLosesOwnEffect: OwnEffectId.Stormbite,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/002000/002614.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/c/c0/002614.png',
                icon: '../resources/img/002614.png',
                borderColor: '#3df6fd',
                sortKey: 1,
                buffType: 'physical', // physical, magic
            },
            causticBite: { // 毒  26|2020-09-20T03:20:13.6610000+08:00|4b0|烈毒咬箭|30.00|1039A1D9|水貂桑|4000031F|木人|28|7400000|111340||2bb99918d00070ccc76dac9d8de81e98
                mobGainsOwnEffect: OwnEffectId.CausticBite,
                mobLosesOwnEffect: OwnEffectId.CausticBite,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/002000/002613.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/4/41/002613.png',
                icon: '../resources/img/002613.png',
                borderColor: '#e053bb',
                sortKey: 1,
                buffType: 'physical', // physical
            },
            goringBlade: { // [22:22:30.877] 1A:400001B8:木人 gains the effect of 沥血剑 from xxx for 21.00 Seconds.
                mobGainsOwnEffect: EffectId.GoringBlade,
                mobLosesOwnEffect: EffectId.GoringBlade,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/002000/002506.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/9/95/002506.png',
                icon: '../resources/img/002506.png',
                borderColor: '#d23e29',
                sortKey: 1,
                buffType: 'physical', // physical
            },
            // circleOfScorn: { // [22:39:30.463] 1A:400001B9:木人 gains the effect of 厄运流转 from xxx for 15.00 Seconds.
            //     mobGainsOwnEffect: EffectId.CircleOfScorn,
            //     mobLosesOwnEffect: EffectId.CircleOfScorn,
            //     useEffectDuration: true,
            //     // icon: 'https://xivapi.com/i/000000/000161.png',
            //     // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/b/b9/000161.png',
            //     icon: '../resources/img/000161.png',
            //     borderColor: '#e77d70',
            //     sortKey: 1,
            //     buffType: 'physical', // physical
            // },
            // sonicBreak: { //[22:54:09.441] 1A:400001B8:木人 gains the effect of 音速破 from xxx for 30.00 Seconds.
            //     mobGainsOwnEffect: EffectId.SonicBreak,
            //     mobLosesOwnEffect: EffectId.SonicBreak,
            //     useEffectDuration: true,
            //     // icon: 'https://xivapi.com/i/003000/003417.png',
            //     // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/1/16/003417.png',
            //     icon: '../resources/img/003417.png',
            //     borderColor: '#755cbb',
            //     sortKey: 1,
            //     buffType: 'physical', // physical
            // },
            // bowShock: { //[22:54:10.770] 1A:400001B8:木人 gains the effect of 弓形冲波 from xxx for 15.00 Seconds.
            //     mobGainsOwnEffect: EffectId.BowShock,
            //     mobLosesOwnEffect: EffectId.BowShock,
            //     useEffectDuration: true,
            //     // icon: 'https://xivapi.com/i/003000/003423.png',
            //     // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/b/b5/003423.png',
            //     icon: '../resources/img/003423.png',
            //     borderColor: '#d5d557',
            //     sortKey: 1,
            //     buffType: 'physical', // physical
            // },
            // 白魔
            dia: { // 26|2020-09-20T17:04:10.5120000+08:00|74f|天辉|30.00|1039A1D9|水貂桑|4000031F|木人|00|7400000|48422||507ae34e5244f9018a0e5fa444c62d7c
                mobGainsOwnEffect: OwnEffectId.Dia,
                mobLosesOwnEffect: OwnEffectId.Dia,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/002000/002641.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/b/ba/002641.png',
                icon: '../resources/img/002641.png',
                borderColor: '#3eb9fa',
                sortKey: 1,
                buffType: 'magic', // physical
            },
            biolysis: { //26|2020-09-20T17:11:43.3880000+08:00|767|蛊毒法|30.00|1039A1D9|水貂桑|4000031F|木人|00|7400000|46919||161fecdddc980c9bfeca7224ccbf98ae
                mobGainsOwnEffect: OwnEffectId.Biolysis,
                mobLosesOwnEffect: OwnEffectId.Biolysis,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/002000/002820.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/7/78/002820.png',
                icon: '../resources/img/002820.png',
                borderColor: '#2e1fc4',
                sortKey: 1,
                buffType: 'magic', // physical
            },
            combustIII: { //[23:24:52.095] 1A:400001B8:木人 gains the effect of 焚灼 from xxx for 30.00 Seconds.
                mobGainsOwnEffect: OwnEffectId.CombustIII,
                mobLosesOwnEffect: OwnEffectId.CombustIII,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/003000/003554.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/4/4d/003554.png',
                icon: '../resources/img/003554.png',
                borderColor: '#62daf8',
                sortKey: 1,
                buffType: 'magic', // physical
            },
            Demolish: { //[23:31:10.291] 1A:400001B8:木人 gains the effect of 破碎拳 from xxx for 18.00 Seconds. f6
                mobGainsOwnEffect: OwnEffectId.Demolish,
                mobLosesOwnEffect: OwnEffectId.Demolish,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/000000/000204.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/2/2b/000204.png',
                icon: '../resources/img/000204.png',
                borderColor: '#f5cc19',
                sortKey: 1,
                buffType: 'physical', // physical
            },
            chaosThrust: { //[23:47:07.481] 1A:400001B8:木人 gains the effect of 樱花怒放 from xxx for 24.00 Seconds.
                mobGainsOwnEffect: OwnEffectId.ChaosThrust,
                mobLosesOwnEffect: OwnEffectId.ChaosThrust,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/000000/000308.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/d/d6/000308.png',
                icon: '../resources/img/000308.png',
                borderColor: '#83598c',
                sortKey: 1,
                buffType: 'physical', // physical
            },
            // shadowFang: { //[00:03:38.355] 1A:400001B8:木人 gains the effect of 影牙 from xxx for 30.00 Seconds.
            //     mobGainsOwnEffect: OwnEffectId.ShadowFang,
            //     mobLosesOwnEffect: OwnEffectId.ShadowFang,
            //     useEffectDuration: true,
            //     // icon: 'https://xivapi.com/i/000000/000606.png',
            //     // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/e/ee/000606.png',
            //     icon: '../resources/img/000606.png',
            //     borderColor: '#08bcfe',
            //     sortKey: 1,
            //     buffType: 'physical', // physical
            // },
            // 武士
            higanbana: { // [00:12:10.091] 1A:400001B8:木人 gains the effect of 彼岸花 from xxx for 60.00 Seconds.
                mobGainsOwnEffect: OwnEffectId.Higanbana,
                mobLosesOwnEffect: OwnEffectId.Higanbana,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/003000/003160.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/6/6b/003160.png',
                icon: '../resources/img/003160.png',
                borderColor: '#d9542a',
                sortKey: 1,
                buffType: 'physical', // physical
            },
            // 机工
            // bioblaster: { // [00:20:02.402] 1A:400001B9:木人 gains the effect of 毒菌冲击 from xxx for 15.00 Seconds.
            //     mobGainsOwnEffect: OwnEffectId.Bioblaster,
            //     mobLosesOwnEffect: OwnEffectId.Bioblaster,
            //     useEffectDuration: true,
            //     // icon: 'https://xivapi.com/i/003000/003044.png',
            //     // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/e/e7/003044.png',
            //     icon: '../resources/img/003044.png',
            //     borderColor: '#acfd19',
            //     sortKey: 1,
            //     buffType: 'physical', // physical
            // },
            // 黑魔
            thunderIII: { // 26|2020-09-20T21:48:04.2490000+08:00|a3|暴雷|24.00|1039A1D9|水貂桑|4002724E|甲鲎|0A|43720|54853||57f87e2b3856ce677285b9ced2ba43fd
                mobGainsOwnEffect: OwnEffectId.ThunderIII,
                mobLosesOwnEffect: OwnEffectId.ThunderIII,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/000000/000459.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/c/c1/000459.png',
                icon: '../resources/img/000459.png',
                borderColor: '#93d5fd',
                sortKey: 1,
                buffType: 'magic', // physical
            },
            // thunderIV: { // [00:32:47.727] 1A:400001B8:木人 gains the effect of 霹雷 from xxx for 18.00 Seconds.
            //     mobGainsOwnEffect: EffectId.ThunderIV,
            //     mobLosesOwnEffect: EffectId.ThunderIV,
            //     useEffectDuration: true,
            //     // icon: 'https://xivapi.com/i/002000/002662.png',
            //     // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/8/82/002662.png',
            //     icon: '../resources/img/002662.png',
            //     borderColor: '#ac6af6',
            //     sortKey: 1,
            //     buffType: 'magic', // physical
            // },
            bioIII: { // 26|2020-09-20T21:37:32.3880000+08:00|4be|剧毒菌|30.00|1039A1D9|水貂桑|40026548|甲鲎|00|43720|54853||7e166dae6aa83b67d37ce587bf0aa656
                mobGainsOwnEffect: OwnEffectId.BioIII,
                mobLosesOwnEffect: OwnEffectId.BioIII,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/002000/002689.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/b/b1/002689.png',
                icon: '../resources/img/002689.png',
                borderColor: '#e3e02d',
                sortKey: 1,
                buffType: 'magic', // physical
            },
            miasmaIII: { // 26|2020-09-20T21:42:37.0400000+08:00|4bf|瘴暍|30.00|1039A1D9|水貂桑|400271AA|甲鲎|00|43720|54853||671edb497f98c18fc37270cef85dd01b
                mobGainsOwnEffect: OwnEffectId.MiasmaIII,
                mobLosesOwnEffect: OwnEffectId.MiasmaIII,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/002000/002690.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/e/e5/002690.png',
                icon: '../resources/img/002690.png',
                borderColor: '#97abe0',
                sortKey: 1,
                buffType: 'magic', // physical
            },
        };

        let keys = Object.keys(this.buffInfo);
        this.gainEffectMap = {};
        this.loseEffectMap = {};
        this.mobGainsOwnEffectMap = {};
        this.mobLosesOwnEffectMap = {};
        this.gainAbilityMap = {};

        let propToMapMap = {
            gainEffect: this.gainEffectMap,
            loseEffect: this.loseEffectMap,
            mobGainsOwnEffect: this.mobGainsOwnEffectMap,
            mobLosesOwnEffect: this.mobLosesOwnEffectMap,
            gainAbility: this.gainAbilityMap,
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
                if (!(prop in buff))
                    continue;

                let key = buff[prop];
                if (typeof key === 'undefined') {
                    console.error('undefined value for key ' + prop + ' for buff ' + buff.name);
                    continue;
                }

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

        for (let key in buffOverrides[this.options.ParserLanguage]) {
            for (let key2 in buffOverrides[this.options.ParserLanguage][key])
                this.buffInfo[key][key2] = buffOverrides[this.options.ParserLanguage][key][key2];
        }
    }

    // 对自己的BUFF、小队对敌人的BUFF
    onGainEffect(buffs, log, matches) {
        if (!buffs)
            return;
        for (let b of buffs) {
            if (b.gainNetRegex && !log.match(b.gainNetRegex))
                continue;

            let seconds = -1;
            if (b.useEffectDuration)
                seconds = parseFloat(matches.duration);
            else if ('durationSeconds' in b)
                seconds = b.durationSeconds;

            if (matches.count !== '00' && b.hasOwnProperty('incrPhysicalCount')) { // 存在物理Count形式buff
                if (b.incrPhysicalCount[matches.count] !== null) {
                    b.incrPhysical = b.incrPhysicalCount[matches.count];
                }
            }
            if (matches.count !== '00' && b.hasOwnProperty('incrMagicCount')) { // 存在魔法Count形式buff
                if (b.incrMagicCount[matches.count] !== null) {
                    b.incrMagic = b.incrMagicCount[matches.count];
                }
            }
            let dom = findCountBuff(this.rightBuffDiv, matches.targetId + "=>" + b.gainEffect);
            if (dom !== null) {  // 不是首次创建
                updateCountBuff(dom, b.incrPhysical, b.incrMagic)
                buffsCalculation(this.job, this.options, this.rightBuffDiv)
                continue;
            }

            this.onBigBuff(matches.targetId, b.gainEffect, seconds, b, matches.source, false);
        }
    }

    onLoseEffect(buffs, matches) {
        if (!buffs)
            return;
        for (let b of buffs)
            this.onLoseBigBuff(matches.targetId, b.gainEffect, b);
    }

    onGainOwnEffect(buffs, matches) {
        if (!buffs)
            return;

        for (let b of buffs) {
            let seconds = -1;
            if (b.useEffectDuration)
                seconds = parseFloat(matches.duration);
            else if ('durationSeconds' in b)
                seconds = b.durationSeconds;

            this.onBigBuff(matches.targetId, b.mobGainsOwnEffect, seconds, b, matches.source, true);
        }
    }


    onLoseOwnEffect(buffs, matches) {
        if (!buffs)
            return;
        for (let b of buffs)
            this.onLoseBigBuff(matches.targetId, b.mobGainsOwnEffect, b);
    }

    onYouGainEffect(name, log, matches) {
        this.onGainEffect(this.gainEffectMap[name], log, matches);
    }

    onYouLoseEffect(name, matches) {
        this.onLoseEffect(this.loseEffectMap[name], matches);
    }

    onMobGainsOwnEffect(name, matches) {
        this.onGainOwnEffect(this.mobGainsOwnEffectMap[name], matches);
    }

    onMobLosesOwnEffect(name, matches) {
        this.onLoseOwnEffect(this.mobLosesOwnEffectMap[name], matches);
    }

    onUseAbility(id, matches) {
        let buffs = this.gainAbilityMap[id];
        if (!buffs)
            return;

        for (let b of buffs)
            this.onBigBuff(matches.targetId, b.gainAbility, b.durationSeconds, b, matches.source, false);
    }

    onBigBuff(targetId, effectId, seconds, info, source, ownBuff) {
        if (seconds <= 0)
            return;

        let list = this.rightBuffDiv;
        if (info.side == 'left' && this.leftBuffDiv)
            list = this.leftBuffDiv;

        if (info.increasesJob != null) { // 根据远近判断
            if (meleeJobs.includes(this.job)) {
                info.incrPhysical = info.increasesJob.melee; // 物理增伤
                info.incrMagic = info.increasesJob.melee; // 魔法增伤
            } else {
                info.increases = info.increasesJob.ranged
                info.incrPhysical = info.increasesJob.ranged; // 物理增伤
                info.incrMagic = info.increasesJob.ranged; // 魔法增伤
            }
        }

        let tname = targetId + "=>" + effectId

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
        this.meId = '';
        this.me = null;
        this.job = '';
        this.o = {};

        this.gainEffectFuncMap = {};
        this.loseEffectFuncMap = {};
        this.partyTracker = new PartyTracker();
        addOverlayListener('PartyChanged', (e) => {
            this.partyTracker.onPartyChanged(e);
            setupRegexes(this.meId, this.partyTracker);
            console.log(e, this.partyTracker);
        });

        this.initConfig();
    }

    // 个性化配置
    initConfig() {
        let urlSet = function (name) {
            let t = getQueryVariable(name);
            if (t !== false) {
                return t;
            }
            return false;
        }

        if (urlSet('scaling')) { //缩放百分比
            let snum = decodeURI(urlSet('scaling'))
            if (snum > 100) {
                snum = snum / 100
                this.options.TextPhysicalFontSize *= snum
                this.options.TextMagicFontSize *= snum
                this.options.TextBrdSecFontSize *= snum

                this.options.DotIconWidth *= snum
                this.options.DotIconHeight *= snum
                this.options.DotBarHeight *= snum

                this.options.BigBuffIconWidth *= snum
                this.options.BigBuffIconHeight *= snum
            }
        }

        // 是否展示诗人buff秒数参考
        if (urlSet('brdsec') === '1') {
            this.options.TextBrdSec = true;
        }
        if (urlSet('brdsecstyle') !== false) {
            let sc = decodeURI(urlSet('brdsecstyle')).split(',', 2) // 字号,颜色
            if (sc.length >= 1) {
                this.options.TextBrdSecFontSize = Number(sc[0]);
            }
            if (sc.length >= 2) {
                this.options.TextBrdSecTextColor = sc[1];
            }
        }
        // 是否开启TTS语音
        if (urlSet('tts') === '0') {
            this.options.TTS = false;
        }
        // 物理文字大小颜色
        if (urlSet('phystyle') !== false) {
            let sc = decodeURI(urlSet('phystyle')).split(',', 2) // 字号,颜色
            if (sc.length >= 1) {
                this.options.TextPhysicalFontSize = Number(sc[0]);
            }
            if (sc.length >= 2) {
                this.options.TextPhysicalTextColor = sc[1];
            }
        }
        // 魔法文字大小颜色
        if (urlSet('magstyle') !== false) {
            let sc = decodeURI(urlSet('magstyle')).split(',', 2) // 字号,颜色
            if (sc.length >= 1) {
                this.options.TextMagicFontSize = Number(sc[0]);
            }
            if (sc.length >= 2) {
                this.options.TextMagicTextColor = sc[1];
            }
        }
        // DOT是否展示
        if (urlSet('dot') === '0') {
            this.options.DOT = false;
        }
        // Dot图标长宽
        if (urlSet('dotstyle') !== false) {
            let wh = decodeURI(urlSet('dotstyle')).split(',', 4) // 宽,高,bar高,边框有无
            if (wh.length >= 1) {
                this.options.DotIconWidth = Number(wh[0]);
            }
            if (wh.length >= 2) {
                this.options.DotIconHeight = Number(wh[1]);
            }
            if (wh.length >= 3) {
                this.options.DotBarHeight = Number(wh[2]);
            }
            if (wh.length >= 4) {
                this.options.DotBorderSize = Number(wh[3]);
            }
        }
        // 团辅最长进度条
        if (urlSet('buffmaxwidth') !== false) {
            this.options.BidBuffBarMaxWidth = urlSet('buffmaxwidth');
        }
        // 团辅图标长宽
        if (urlSet('buffstyle') !== false) {
            let wh = decodeURI(urlSet('buffstyle')).split(',', 3) // 宽,高,边框有无
            if (wh.length >= 1) {
                this.options.BigBuffIconWidth = Number(wh[0]);
            }
            if (wh.length >= 2) {
                this.options.BigBuffIconHeight = Number(wh[1]);
            }
            if (wh.length >= 3) {
                this.options.BigBuffBorderSize = Number(wh[2]);
            }
        }
    }

    // 统计信息布局
    SetStatLayout() {
        this.o.Stat = document.getElementById('jobs-stat');
        if (this.o.Stat == null) {
            let root = document.getElementById('container');
            this.o.Stat = document.createElement('div');
            this.o.Stat.id = 'jobs-stat';
            // this.o.Stat.style.height = Number(this.options.DotIconHeight) + Number(this.options.DotBarHeight)
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
        // let dotHeight = Number(this.options.DotIconHeight) + Number(this.options.DotBarHeight)
        let fontHeight = Number(this.options.TextPhysicalFontSize) + Number(this.options.TextMagicFontSize) + 5
        // if (dotHeight > fontHeight) {
        //     this.o.Stat.style.height = dotHeight
        // } else {
        this.o.Stat.style.height = fontHeight
        // }

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
        this.o.StatBuffSec.style.color = this.options.TextBrdSecTextColor;
        this.o.StatBuffSec.style.fontSize = this.options.TextBrdSecFontSize;
        // this.o.StatBuffSec.style.left = (sWidth + 10) + (this.options.DotIconWidth + 2) * 2 + 10;
        this.o.StatBuffSec.style.left = sWidth + 10;
        this.o.Stat.appendChild(this.o.StatBuffSec);
    }

    // 更新职业(布局)
    UpdateJob() {
        this.gainEffectFuncMap = {};
        this.loseEffectFuncMap = {};

        // 初始化
        this.o = {};
        // 统计信息布局
        this.SetStatLayout();

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
        else if (Util.isDpsJob(this.job))
            barsLayoutContainer.classList.add('dps');
        else if (Util.isCraftingJob(this.job))
            barsLayoutContainer.classList.add('crafting');
        else if (Util.isGatheringJob(this.job))
            barsLayoutContainer.classList.add('gathering');

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
        this.o.pullCountdown.lefttext = kPullText[this.options.DisplayLanguage] || kPullText['en'];
        this.o.pullCountdown.righttext = 'remain';
        this.o.pullCountdown.hideafter = 0;
        this.o.pullCountdown.fg = 'rgb(255, 120, 120)';
        this.o.pullCountdown.classList.add('lang-' + this.options.DisplayLanguage);

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

    OnPartyWipe(e) {
        // TODO: add reset for job-specific ui
        if (this.buffTracker)
            this.buffTracker.clear();
    }

    // 切换区域
    OnChangeZone(e) {
        const zoneInfo = ZoneInfo[e.zoneID];
        this.contentType = zoneInfo ? zoneInfo.contentType : 0;

        if (this.buffTracker)
            this.buffTracker.clear();
    }

    // 切换职业
    OnPlayerChanged(e) {
        if (this.me !== e.detail.name) {
            this.meId = e.detail.id.toString(16).toUpperCase();
            this.me = e.detail.name;
            // setup regexes prior to the combo tracker
            setupRegexes(this.meId, this.partyTracker);
        }

        if (!this.init) {
            this.init = true;
        }

        let updateJob = false;
        if (e.detail.job != this.job) {
            this.job = e.detail.job;
            updateJob = true;
        }

        if (updateJob) {
            this.UpdateJob();
            // Set up the buff tracker after the job bars are created.
            this.buffTracker = new BuffTracker(this.options, e.detail.id.toString(16).toUpperCase(), this.job, this.o.leftBuffsList, this.o.rightBuffsList, this.o.StatDotList);
        }
    }

    OnNetLog(e) {
        if (!this.init)
            return;

        const line = e.line;
        const log = e.rawLine;


        const type = line[0];
        if (type === '26') {
            // 其他人给自己上的buff
            let m = log.match(kYouGainEffectRegex);
            if (m) {
                const effectId = m.groups.effectId.toUpperCase();
                let f = this.gainEffectFuncMap[effectId];
                if (f)
                    f(name, m.groups);
                this.buffTracker.onYouGainEffect(effectId, log, m.groups);
                return;
            }

            // 小队(自己)给(BOSS/宠物)的(BUFF/DOT)
            m = log.match(kMobGainsOwnEffectRegex);
            if (m) {
                const effectId = m.groups.effectId.toUpperCase();
                this.buffTracker.onYouGainEffect(effectId, log, m.groups);
                this.buffTracker.onMobGainsOwnEffect(effectId, m.groups);
                return;
            }

            // 小队(其他人)给(BOSS/宠物)的BUFF
            m = log.match(kMobGainsPartyEffectRegex);
            if (m) {
                const effectId = m.groups.effectId.toUpperCase();
                this.buffTracker.onYouGainEffect(effectId, log, m.groups);
            }

        } else if (type === '30') {
            let m = log.match(kYouLoseEffectRegex);
            if (m) {
                const effectId = m.groups.effectId.toUpperCase();
                let f = this.loseEffectFuncMap[effectId];
                if (f)
                    f(name, m.groups);
                this.buffTracker.onYouLoseEffect(effectId, m.groups);
            }

            // 自己给其他人上的buff
            m = log.match(kMobLosesOwnEffectRegex);
            if (m) {
                const effectId = m.groups.effectId.toUpperCase();
                this.buffTracker.onYouLoseEffect(effectId, m.groups);
                this.buffTracker.onMobLosesOwnEffect(effectId, log);
            }

            m = log.match(kMobLosesPartyEffectRegex);
            if (m) {
                const effectId = m.groups.effectId.toUpperCase();
                this.buffTracker.onYouLoseEffect(effectId, m.groups);
            }
        } else if (type === '21' || type === '22') {
            let m = log.match(kYouUseAbilityRegex);
            if (m) {
                this.buffTracker.onUseAbility(m.groups.id, m.groups);
            } else {
                let m = log.match(kPartyUseAbilityRegex);
                if (m)
                    this.buffTracker.onUseAbility(m.groups.id, m.groups);
            }
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
            }
        }
    }

    Test() {

        // setTimeout(() => {
        //     let line = '26|2020-09-20T03:24:38.9810000+08:00|31|强化药|30.00|1039A1D9|水貂桑|1039A1D9|水貂桑|28D6|111340|111340||63c01dd83f9942aec827298ddef1519b';
        //     this.OnNetLog({line: line.split('|'), rawLine: line})
        // }, 1);

        // // 诗人
        // setTimeout(() => {
        //     let line = '26|2020-09-20T22:44:12.4840000+08:00|8d|战斗之声|20.00|1039A1D9|水貂桑|40027A75|陆行鸟|00|76590|111340||f655b2f774c6675d7991b1e5180462d2';
        //     this.OnNetLog({line: line.split('|'), rawLine: line})
        // }, 100);
        // setTimeout(() => {
        //     let line = '26|2020-09-20T22:44:12.4840000+08:00|8d|战斗之声|20.00|103E4CCF|伊黛亚·李|1039A1D9|水貂桑|00|76590|111340||f655b2f774c6675d7991b1e5180462d2';
        //     this.OnNetLog({line: line.split('|'), rawLine: line})
        // }, 2000);
        // setTimeout(() => {
        //     let line = '26|2020-09-20T02:40:53.5290000+08:00|7d|猛者强击|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|00|111340|111340||8f03e4245a6f867a176cbe211bd1c6c5';
        //     this.OnNetLog({line: line.split('|'), rawLine: line})
        // }, 100);
        setTimeout(() => {
            let line = '26|2020-09-20T03:20:11.1660000+08:00|4b1|狂风蚀箭|30.00|1039A1D9|水貂桑|4000031F|木人|28|7400000|111340||dbf0314ef7fed2a2b2285e2a3b17d02f';
            this.OnNetLog({line: line.split('|'), rawLine: line})
        }, 1000);
        setTimeout(() => {
            let line = '26|2020-09-20T03:20:13.6610000+08:00|4b0|烈毒咬箭|30.00|1039A1D9|水貂桑|4000031F|木人|28|7400000|111340||2bb99918d00070ccc76dac9d8de81e98';
            this.OnNetLog({line: line.split('|'), rawLine: line})
        }, 2000);

        // // 学者
        setTimeout(() => {
            let line = '26|2020-09-20T18:34:48.5250000+08:00|4c5|连环计|15.00|10028650|伊黛亚·李|4000031F|木人|00|176868|93263||ea00b0bcf5bad3afc108c29be0233c9f';
            this.OnNetLog({line: line.split('|'), rawLine: line})
        }, 3000);
        // setTimeout(() => {
        //     let line = '30|2020-09-20T17:46:59.8170000+08:00|4c5|连环计|0.00|103E4CCF|伊黛亚·李|4000031F|木人|00|7400000|97064||d701742e13324007985444a7be589683';
        //     this.OnNetLog({line: line.split('|'), rawLine: line})
        // }, 6000);

        // // 龙骑
        // setTimeout(() => {
        //     let line = '26|2020-09-20T20:28:51.3110000+08:00|5ae|巨龙左眼|20.00|103E4CCF|伊黛亚·李|1039A1D9|水貂桑|00|76590|75581||258897ab642d7a4dd88d77fa8dd43576';
        //     this.OnNetLog({line: line.split('|'), rawLine: line})
        // }, 1000);
        // setTimeout(() => {
        //     let line = '26|2020-09-21T00:47:46.5170000+08:00|5ae|巨龙左眼|20.00|1039A1D9|水貂桑|400287BF|陆行鸟|00|76590|75581||c0d0b4a74b720167676b664b7f882ffb';
        //     this.OnNetLog({line: line.split('|'), rawLine: line})
        // }, 1000);
        // setTimeout(() => {
        //     let line = '26|2020-09-20T20:28:51.3110000+08:00|5ad|巨龙右眼|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|78|75581|75581||0bf27d1121ea2df8f2ac1a67497b008c';
        //     this.OnNetLog({line: line.split('|'), rawLine: line})
        // }, 2000);

        // // 忍着
        // setTimeout(() => {
        //     let line = '26|2020-09-20T20:42:28.6830000+08:00|27e|受伤加重|15.00|1039A1D9|水貂桑|4000031F|木人|00|7400000|55427||a0b1d7a1f64355c3b9e642eab6e64aa0';
        //     this.OnNetLog({line: line.split('|'), rawLine: line})
        // }, 1000);
        // setTimeout(() => {
        //     let line = '30|2020-09-20T17:46:59.8170000+08:00|27e|受伤加重|0.00|1039A1D9|水貂桑|4000031F|木人|00|7400000|55427||d701742e13324007985444a7be589683';
        //     this.OnNetLog({line: line.split('|'), rawLine: line})
        // }, 4000);
        // setTimeout(() => {
        //     let line = '26|2020-09-20T20:42:28.6830000+08:00|27e|受伤加重|15.00|103E4CCF|伊黛亚·李|4000031F|木人|00|7400000|55427||a0b1d7a1f64355c3b9e642eab6e64aa0';
        //     this.OnNetLog({line: line.split('|'), rawLine: line})
        // }, 5000);

        // 26|2020-09-20T22:44:12.4840000+08:00|8d|战斗之声|20.00|1039A1D9|水貂桑|40027A75|陆行鸟|00|76590|111340||f655b2f774c6675d7991b1e5180462d2
        // 26|2020-09-20T21:28:39.0320000+08:00|8d|战斗之声|20.00|1039A1D9|水貂桑|40026FC8|陆行鸟|00|76590|111340||852f0f6be28070f73fd879577cb448d7
        // 26|2020-09-20T21:33:48.1490000+08:00|5ae|巨龙左眼|20.00|1039A1D9|水貂桑|40026FC8|陆行鸟|00|76590|75581||1509fff44f53bb5592a7dd6642ba73fd

        // 赤魔
        // 26|2020-09-20T22:04:03.9440000+08:00|4d7|鼓励|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|05|52289|52289||140096ff8fe52cfc344ee31759a6b422
        // 26|2020-09-20T22:04:04.0780000+08:00|511|鼓励|20.00|1039A1D9|水貂桑|4002759B|陆行鸟|05|76590|52289||cc9ad3416a052b54bbdb68804582dcc5
        // 26|2020-09-20T22:04:07.9110000+08:00|4d7|鼓励|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|04|52289|52289||369bee40aab7cfa72bc77aacd0165e89
        // 26|2020-09-20T22:04:08.0440000+08:00|511|鼓励|20.00|1039A1D9|水貂桑|4002759B|陆行鸟|04|76590|52289||e9c9aec09171bb3d4923e00aafc962db
        // 26|2020-09-20T22:04:11.9220000+08:00|4d7|鼓励|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|03|52289|52289||b132a58f47a1244ea60dc97ed136d1ac
        // 26|2020-09-20T22:04:12.0550000+08:00|511|鼓励|20.00|1039A1D9|水貂桑|4002759B|陆行鸟|03|76590|52289||530cf250118e141c356b6414bd99e237
        // 26|2020-09-20T22:04:15.9350000+08:00|4d7|鼓励|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|02|52289|52289||b6f281d9939cadf98e0a3c4e20971f45
        // 26|2020-09-20T22:04:16.0710000+08:00|511|鼓励|20.00|1039A1D9|水貂桑|4002759B|陆行鸟|02|76590|52289||abe03f69fcb61b9ae37e632b1fcf71eb
        // 26|2020-09-20T22:04:19.9490000+08:00|4d7|鼓励|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|01|52289|52289||ed928b5ff87c09a4538e74809e11cccd
        // 26|2020-09-20T22:04:20.0830000+08:00|511|鼓励|20.00|1039A1D9|水貂桑|4002759B|陆行鸟|01|76590|52289||63e1491deabf976eaa7e16edbb05e3e8
        // 30|2020-09-20T22:04:24.0480000+08:00|4d7|鼓励|0.00|1039A1D9|水貂桑|1039A1D9|水貂桑|01|76590|52289||91727e97f2e91e3b4823830ea6a35adb
        // 30|2020-09-20T22:04:24.0480000+08:00|511|鼓励|0.00|1039A1D9|水貂桑|4002759B|陆行鸟|01|76590|52289||91727e97f2e91e3b4823830ea6a35adb

        // 从别人身上得到
        // setTimeout(() => {
        //     let line = '26|2020-09-20T22:04:04.0780000+08:00|511|鼓励|20.00|103E4CCF|伊黛亚·李|1039A1D9|水貂桑|05|76590|52289||cc9ad3416a052b54bbdb68804582dcc5';
        //     this.OnNetLog({line: line.split('|'), rawLine: line})
        // }, 1)
        //
        // setTimeout(() => {
        //     let line = '26|2020-09-20T22:04:04.0780000+08:00|511|鼓励|20.00|103E4CCF|伊黛亚·李|1039A1D9|水貂桑|04|76590|52289||cc9ad3416a052b54bbdb68804582dcc5';
        //     this.OnNetLog({line: line.split('|'), rawLine: line})
        // }, 4000)
        //
        // setTimeout(() => {
        //     let line = '26|2020-09-20T22:04:04.0780000+08:00|511|鼓励|20.00|103E4CCF|伊黛亚·李|1039A1D9|水貂桑|03|76590|52289||cc9ad3416a052b54bbdb68804582dcc5';
        //     this.OnNetLog({line: line.split('|'), rawLine: line})
        // }, 6000)
        //
        // setTimeout(() => {
        //     let line = '26|2020-09-20T22:04:04.0780000+08:00|511|鼓励|20.00|103E4CCF|伊黛亚·李|1039A1D9|水貂桑|02|76590|52289||cc9ad3416a052b54bbdb68804582dcc5';
        //     this.OnNetLog({line: line.split('|'), rawLine: line})
        // }, 10000)

        // setTimeout(() => {
        //     let line = '26|2020-09-20T22:04:04.0780000+08:00|511|鼓励|20.00|103E4CCF|伊黛亚·李|1039A1D9|水貂桑|01|76590|52289||cc9ad3416a052b54bbdb68804582dcc5';
        //     this.OnNetLog({line: line.split('|'), rawLine: line})
        // }, 14000)

        // setTimeout(() => {
        //     let line = '30|2020-09-20T22:04:24.0480000+08:00|511|鼓励|0.00|103E4CCF|伊黛亚·李|1039A1D9|水貂桑|01|76590|52289||91727e97f2e91e3b4823830ea6a35adb';
        //     this.OnNetLog({line: line.split('|'), rawLine: line})
        // }, 13000)

        // 自己给自己
        // setTimeout(() => {
        //     let line = '26|2020-09-20T22:04:03.9440000+08:00|4d7|鼓励|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|05|52289|52289||140096ff8fe52cfc344ee31759a6b422';
        //     this.OnNetLog({line: line.split('|'), rawLine: line})
        // }, 1)
        //
        // setTimeout(() => {
        //     let line = '26|2020-09-20T22:04:07.9110000+08:00|4d7|鼓励|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|04|52289|52289||369bee40aab7cfa72bc77aacd0165e89';
        //     this.OnNetLog({line: line.split('|'), rawLine: line})
        // }, 4000)
        //
        // setTimeout(() => {
        //     let line = '26|2020-09-20T22:04:11.9220000+08:00|4d7|鼓励|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|03|52289|52289||b132a58f47a1244ea60dc97ed136d1ac';
        //     this.OnNetLog({line: line.split('|'), rawLine: line})
        // }, 6000)
        //
        // setTimeout(() => {
        //     let line = '26|2020-09-20T22:04:15.9350000+08:00|4d7|鼓励|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|02|52289|52289||b6f281d9939cadf98e0a3c4e20971f45';
        //     this.OnNetLog({line: line.split('|'), rawLine: line})
        // }, 10000)
        //
        // setTimeout(() => {
        //     let line = '26|2020-09-20T22:04:19.9490000+08:00|4d7|鼓励|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|01|52289|52289||ed928b5ff87c09a4538e74809e11cccd';
        //     this.OnNetLog({line: line.split('|'), rawLine: line})
        // }, 14000)
        //
        // setTimeout(() => {
        //     let line = '30|2020-09-20T22:04:24.0480000+08:00|4d7|鼓励|0.00|1039A1D9|水貂桑|1039A1D9|水貂桑|01|76590|52289||91727e97f2e91e3b4823830ea6a35adb';
        //     this.OnNetLog({line: line.split('|'), rawLine: line})
        // }, 18000)
    }

    TestChangeJob() {
        // let e = {detail: {job: "MNK", name: "TestName"}}
        let e = {detail: {job: "BRD", name: "TestName"}}
        // let e = {detail: {job: "BRD", name: "xxx"}}
        this.OnPlayerChanged(e)
    }
}

// 结束 从这里开始
let gBrds;

UserConfig.getUserConfigLocation('buff', function () {
    addOverlayListener('onPlayerChangedEvent', function (e) {
        gBrds.OnPlayerChanged(e);
    });
    addOverlayListener('onPartyWipe', function (e) {
        gBrds.OnPartyWipe(e);
    });
    addOverlayListener('ChangeZone', function (e) {
        gBrds.OnChangeZone(e);
    });
    // addOverlayListener('onLogEvent', function (e) {
    //     gBrds.OnLogEvent(e);
    // });
    addOverlayListener('LogLine', (e) => {
        gBrds.OnNetLog(e);
    });

    gBrds = new Brds(Options);
});

// 26|2020-09-20T19:07:04.7520000+08:00|84c|以太复制：防护|9999.00|101ABEBF|年迈的蓝胖|101ABEBF|年迈的蓝胖|00|18607|18607||ed5a3a570030f7eb77a06ddaee47ce43