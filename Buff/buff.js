'use strict';

// text on the pull countdown.
const kPullText = {
    en: 'Pull',
    de: 'Start',
    ja: 'タゲ取る',
    cn: '开怪',
    ko: '풀링',
};

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
    'ChainStratagem': '4C5' // 连环计
}

const kAbility = {
    DragonKick: '4A',
    TwinSnakes: '3D',
    Demolish: '42',
    Verstone: '1D57',
    Verfire: '1D56',
    Veraero: '1D53',
    Verthunder: '1D51',
    Verholy: '1D66',
    Verflare: '1D65',
    Jolt2: '1D64',
    Jolt: '1D4F',
    Impact: '1D62',
    Scatter: '1D55',
    Vercure: '1D5A',
    Verraise: '1D63',
    Riposte: '1D50',
    Zwerchhau: '1D58',
    Redoublement: '1D5C',
    Moulinet: '1D59',
    EnchantedRiposte: '1D67',
    EnchantedZwerchhau: '1D68',
    EnchantedRedoublement: '1D69',
    EnchantedMoulinet: '1D6A',
    Tomahawk: '2E',
    Overpower: '29',
    HeavySwing: '1F',
    SkullSunder: '23',
    ButchersBlock: '2F',
    Maim: '25',
    StormsEye: '2D',
    StormsPath: '2A',
    InnerRelease: '1CDD',
    TrickAttack: '8D2',
    Embolden: '1D60',
    Aetherflow: 'A6',
    ChainStratagem: '1D0C',
    Hypercharge: 'B45',
    Adloquium: 'B9',
    RabbitMedium: '8E0',
    OneIlmPunch: '48',
    Bootshine: '35',
    FastBlade: '09',
    RiotBlade: '0F',
    GoringBlade: 'DD2',
    RoyalAuthority: 'DD3',
    RageOfHalone: '15',
    SavageBlade: '0B',
    ShieldLob: '18',
    Requiescat: '1CD7',
    HolySpirit: '1CD8',
    TotalEclipse: '1CD5',
    Clemency: 'DD5',
    ShieldBash: '10',
    ShieldSwipe: '19',
    FightOrFlight: '14',
    BloodWeapon: 'E29',
    Souleater: 'E30',
    SyphonStrike: 'E27',
    HardSlash: 'E21',
    CarveAndSpit: 'E3B',
    Plunge: 'E38',
    Unmend: 'E28',
    AbyssalDrain: 'E39',
    PowerSlash: 'E2B',
    SpinningSlash: 'E23',
    BloodPrice: 'E2F',
    TheBlackestNight: '1CE1',
    Delirium: '1CDE',
    Combust: 'E0F',
    Combust2: 'E18',
    Combust3: '40AA',
    Draw: 'E06',
    AspectedBenefic: 'E0B',
    AspectedHelios: 'E11',
    Bio: '45C8',
    Bio2: '45C9',
    Biolysis: '409C',
    Contagion: '31B',
    OffGuard: '2C93',
    SongOfTorment: '2C7A',
    PeculiarLight: '2C9D',
    MythrilTempest: '404E',
    Prominence: '4049',
    HolyCircle: '404A',
    Confiteor: '404B',
    FourPointFury: '4059',
    TechnicalFinish: '3F44',
    Thunder1: '90',
    Thunder2: '94',
    Thunder3: '99',
    Thunder4: '1CFC',
    Divination: '40A8',
    LucidDreaming: '1D8A',
    Miasma: 'A8',
    Miasma3: '1D01',
    BioSmn: 'A4',
    BioSmn2: 'B2',
    Bio3: '1D00',
    Tridisaster: 'DFC',
    EnergyDrain: '407C',
    EnergySiphon: '407E',
    DreadwyrmTrance: 'DFD',
    FirebirdTrance: '40A5',

    RagingStrikes: '65', // 猛者
};

// 近战职业列表
let meleeJobs = ['PLD', 'WAR', 'DRK', 'GNB', 'MNK', 'DRG', 'NIN', 'SAM'];

// Regexes to be filled out once we know the player's name.
let kYouGainEffectRegex = null;
let kYouLoseEffectRegex = null;
let kMobGainsOwnEffectRegex = null; // 自己给boss上的buff
let kMobLosesOwnEffectRegex = null; // 自己在boss身上丢失的buff
let kMobGainsPartyEffectRegex = null; // 小队给目标身上增加的buff
let kMobLosesPartyEffectRegex = null; // 小队在目标身上丢失的buff

let kYouUseAbilityRegex = null;
let kAnybodyAbilityRegex = null;
let kMobGainsEffectRegex = null;
let kMobLosesEffectRegex = null;


let kStatsRegex = Regexes.statChange();

function loseTargetFromLog(log) {
    let m = log.match(Regexes.parse('] 1E:(\\y{ObjectId}):([^:]*?) loses'));
    if (m)
        return m[1] + ':' + m[2];
    return 0;
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

function setupRegexes(playerId, playerName, partyTracker) {
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
    console.log(playerId, playerName, partyTracker);
    kMobGainsPartyEffectRegex = NetRegexes.gainsEffect({targetId: '4.{7}', sourceId: '(' + partyIdsStr + ')'});
    kMobLosesPartyEffectRegex = NetRegexes.losesEffect({targetId: '4.{7}', sourceId: '(' + partyIdsStr + ')'});

    // 自己释放的能力
    kYouUseAbilityRegex = NetRegexes.ability({source: playerName});
    // 任何人释放的能力
    // kAnybodyAbilityRegex = NetRegexes.ability();
    // 对目标释放的技能
    // kMobGainsEffectRegex = NetRegexes.gainsEffect({targetId: '4.{7}'});
    // kMobLosesEffectRegex = NetRegexes.losesEffect({targetId: '4.{7}'});
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

function changeEmbolden(isMe, num, list) {
    let listDim = {5: 10, 4: 8, 3: 6, 2: 4, 1: 2};
    let tgs = list.rootElement.getElementsByClassName('buffs');
    for (let i = 0; i < tgs.length; i++) {
        let bname = tgs[i].getAttribute('buffs-name')
        if (bname === '=>embolden') {
            if (isMe === true) {
                tgs[i].setAttribute('buffs-incr-physical', 0) // 作用物理
                tgs[i].setAttribute('buffs-incr-magic', listDim[num]) // 作用魔法
            } else {
                tgs[i].setAttribute('buffs-incr-physical', listDim[num]) // 作用物理
                tgs[i].setAttribute('buffs-incr-magic', 0) // 作用魔法
            }
            break;
        }
    }
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
        if (this.info.gainEffect == gLang.kEffect.Medicated && seconds >= 120) {
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
    constructor(options, playerName, job, leftBuffDiv, rightBuffDiv, ownBuffDiv) {
        this.options = options;
        this.playerName = playerName;
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
            // 学者
            // 26|2020-09-20T17:11:46.0110000+08:00|4c5|连环计|15.00|1039A1D9|水貂桑|4000031F|木人|00|7400000|46919||cef9177cfc401552bc4e8155d546096e
            // 21|2020-09-20T17:11:45.2110000+08:00|1039A1D9|水貂桑|1D0C|连环计|4000031F|木人|F60E|4C50000|0|0|0|0|0|0|0|0|0|0|0|0|0|0|7400000|7400000|0|10000|0|1000|-603.1267|-762.9036|25.02|2.283125|46919|46919|9819|10000|0|1000|-598.9421|-772.7528|25.02|-0.4017591|0000335B|131b13cb7c37d87af35d4b9ca6a2f444
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
            // 占星
            combustIII: { //[23:24:52.095] 1A:400001B8:木人 gains the effect of 焚灼 from xxx for 30.00 Seconds.
                mobGainsOwnEffect: gLang.kEffect.CombustIII,
                mobLosesOwnEffect: gLang.kEffect.CombustIII,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/003000/003554.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/4/4d/003554.png',
                icon: '../resources/img/003554.png',
                borderColor: '#62daf8',
                sortKey: 1,
                buffType: 'magic', // physical
            },
            divination: { // 占卜
                gainEffect: EffectId.Divination,
                loseEffect: EffectId.Divination,
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
            // 武僧  [23:31:06.105] 1A:1039A1D9:xxx gains the effect of 义结金兰：攻击 from xxx for 15.00 Seconds.
            Demolish: { //[23:31:10.291] 1A:400001B8:木人 gains the effect of 破碎拳 from xxx for 18.00 Seconds.
                mobGainsOwnEffect: gLang.kEffect.Demolish,
                mobLosesOwnEffect: gLang.kEffect.Demolish,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/000000/000204.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/2/2b/000204.png',
                icon: '../resources/img/000204.png',
                borderColor: '#f5cc19',
                sortKey: 1,
                buffType: 'physical', // physical
            },
            riddleOfFire: { // [23:31:04.573] 1A:1039A1D9:xxx gains the effect of 红莲极意 from xxx for 20.00 Seconds.
                gainEffect: gLang.kEffect.RiddleOfFire,
                loseEffect: gLang.kEffect.RiddleOfFire,
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
            // [23:47:39.159] 1A:1039A1D9:xxx gains the effect of 巨龙右眼 from xxx for 20.00 Seconds.
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
            chaosThrust: { //[23:47:07.481] 1A:400001B8:木人 gains the effect of 樱花怒放 from xxx for 24.00 Seconds.
                mobGainsOwnEffect: gLang.kEffect.ChaosThrust,
                mobLosesOwnEffect: gLang.kEffect.ChaosThrust,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/000000/000308.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/d/d6/000308.png',
                icon: '../resources/img/000308.png',
                borderColor: '#83598c',
                sortKey: 1,
                buffType: 'physical', // physical
            },
            litany: { //战斗连祷 [23:47:29.214] 1A:1039A1D9:xxx gains the effect of 战斗连祷 from xxx for 20.00 Seconds.
                gainEffect: gLang.kEffect.BattleLitany,
                loseEffect: gLang.kEffect.BattleLitany,
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
                gainEffect: gLang.kEffect.LeftEye,
                loseEffect: gLang.kEffect.LeftEye,
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
                gainEffect: gLang.kEffect.RightEye,
                loseEffect: gLang.kEffect.RightEye,
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
                // gainRegex: Regexes.ability({id: gLang.kAbility.TrickAttack}),
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
            // shadowFang: { //[00:03:38.355] 1A:400001B8:木人 gains the effect of 影牙 from xxx for 30.00 Seconds.
            //     mobGainsOwnEffect: gLang.kEffect.ShadowFang,
            //     mobLosesOwnEffect: gLang.kEffect.ShadowFang,
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
                mobGainsOwnEffect: gLang.kEffect.Higanbana,
                mobLosesOwnEffect: gLang.kEffect.Higanbana,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/003000/003160.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/6/6b/003160.png',
                icon: '../resources/img/003160.png',
                borderColor: '#d9542a',
                sortKey: 1,
                buffType: 'physical', // physical
            },
            // 诗人
            // 机工
            // bioblaster: { // [00:20:02.402] 1A:400001B9:木人 gains the effect of 毒菌冲击 from xxx for 15.00 Seconds.
            //     mobGainsOwnEffect: gLang.kEffect.Bioblaster,
            //     mobLosesOwnEffect: gLang.kEffect.Bioblaster,
            //     useEffectDuration: true,
            //     // icon: 'https://xivapi.com/i/003000/003044.png',
            //     // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/e/e7/003044.png',
            //     icon: '../resources/img/003044.png',
            //     borderColor: '#acfd19',
            //     sortKey: 1,
            //     buffType: 'physical', // physical
            // },
            // 舞娘
            devilment: { // 进攻之探戈
                gainEffect: gLang.kEffect.Devilment,
                loseEffect: gLang.kEffect.Devilment,
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
                gainEffect: gLang.kEffect.TechnicalFinish,
                loseEffect: gLang.kEffect.TechnicalFinish,
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
            battlevoice: { // 战斗之声
                gainEffect: gLang.kEffect.BattleVoice,
                loseEffect: gLang.kEffect.BattleVoice,
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
            // 黑魔
            thunderIII: { // [00:32:47.727] 1A:400001B8:木人 gains the effect of 暴雷 from xxx for 24.00 Seconds.
                mobGainsOwnEffect: gLang.kEffect.ThunderIII,
                mobLosesOwnEffect: gLang.kEffect.ThunderIII,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/000000/000459.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/c/c1/000459.png',
                icon: '../resources/img/000459.png',
                borderColor: '#93d5fd',
                sortKey: 1,
                buffType: 'magic', // physical
            },
            // thunderIV: { // [00:32:47.727] 1A:400001B8:木人 gains the effect of 霹雷 from xxx for 18.00 Seconds.
            //     mobGainsOwnEffect: gLang.kEffect.ThunderIV,
            //     mobLosesOwnEffect: gLang.kEffect.ThunderIV,
            //     useEffectDuration: true,
            //     // icon: 'https://xivapi.com/i/002000/002662.png',
            //     // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/8/82/002662.png',
            //     icon: '../resources/img/002662.png',
            //     borderColor: '#ac6af6',
            //     sortKey: 1,
            //     buffType: 'magic', // physical
            // },
            // 召唤
            bioIII: { // [00:40:15.962] 1A:400001B8:木人 gains the effect of 剧毒菌 from xxx for 30.00 Seconds.
                mobGainsOwnEffect: gLang.kEffect.BioIII,
                mobLosesOwnEffect: gLang.kEffect.BioIII,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/002000/002689.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/b/b1/002689.png',
                icon: '../resources/img/002689.png',
                borderColor: '#e3e02d',
                sortKey: 1,
                buffType: 'magic', // physical
            },
            miasmaIII: { // [00:40:20.731] 1A:400001B8:木人 gains the effect of 瘴暍 from xxx for 30.00 Seconds.
                mobGainsOwnEffect: gLang.kEffect.MiasmaIII,
                mobLosesOwnEffect: gLang.kEffect.MiasmaIII,
                useEffectDuration: true,
                // icon: 'https://xivapi.com/i/002000/002690.png',
                // icon: 'https://huiji-public.huijistatic.com/ff14/uploads/e/e5/002690.png',
                icon: '../resources/img/002690.png',
                borderColor: '#97abe0',
                sortKey: 1,
                buffType: 'magic', // physical
            },
            devotion: { // 灵护
                gainEffect: gLang.kEffect.Devotion,
                loseEffect: gLang.kEffect.Devotion,
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
            embolden: { // 鼓励
                // Embolden is special and has some extra text at the end, depending on embolden stage:
                // Potato Chippy gains the effect of Embolden from Tater Tot for 20.00 Seconds. (5)
                // Instead, use somebody using the effect on you:
                //   16:106C22EF:Tater Tot:1D60:Embolden:106C22EF:Potato Chippy:500020F:4D7: etc etc
                gainAbility: gLang.kAbility.Embolden,
                gainRegex: Regexes.abilityFull({id: gLang.kAbility.Embolden, target: this.playerName}),
                loseEffect: gLang.kEffect.Embolden,
                durationSeconds: 20,
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
                tts: '鼓励',
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

    onUseAbility(id, matches) {
        let buffs = this.gainAbilityMap[id];
        if (!buffs)
            return;

        console.log(matches)
        for (let b of buffs) {
            // if (b.gainRegex && !log.match(b.gainRegex))
            //     continue;

            let seconds = parseFloat(matches.duration);
            this.onBigBuff('', b.name, seconds, b, matches.source, false);
        }
    }

    // 对自己的BUFF、小队对敌人的BUFF
    onGainEffect(buffs, matches) {
        if (!buffs)
            return;
        for (let b of buffs) {
            let seconds = -1;
            if (b.useEffectDuration)
                seconds = parseFloat(matches.duration);
            else if ('durationSeconds' in b)
                seconds = b.durationSeconds;

            this.onBigBuff(matches.targetId, b.name, seconds, b, matches.source, false);
        }
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

            this.onBigBuff(matches.targetId, b.name, seconds, b, matches.source, true);
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

    onYouGainEffect(name, matches) {
        this.onGainEffect(this.gainEffectMap[name], matches);
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
        this.meId = '';
        this.me = null;
        this.job = '';
        this.o = {};

        this.gainEffectFuncMap = {};
        this.loseEffectFuncMap = {};
        this.abilityFuncMap = {};
        this.partyTracker = new PartyTracker();
        addOverlayListener('PartyChanged', (e) => {
            e = {
                party: [
                    {id: "103E4CCF", inParty: true, job: 28, level: 0, name: "伊黛亚·李", worldId: 1178},
                    {id: "1039A1D9", inParty: true, job: 28, level: 0, name: "水貂桑", worldId: 1178},
                ],
                type: 'PartyChanged'
            }
            this.partyTracker.onPartyChanged(e);
            console.log(e);
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
        this.abilityFuncMap = {};

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
            this.me = e.detail.name;
            // setup regexes prior to the combo tracker
            setupRegexes(e.detail.id.toString(16).toUpperCase(), this.me, this.partyTracker);
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
            this.buffTracker = new BuffTracker(this.options, this.me, this.job, this.o.leftBuffsList, this.o.rightBuffsList, this.o.StatDotList);
        }
    }

    OnNetLog(e) {
        if (!this.init)
            return;

        const line = e.line;
        const log = e.rawLine;


        const type = line[0];
        if (type === '26' || type === '30' || type === '21' || type === '22') {
            console.log(e);
        }
        if (type === '26') {
            // 其他人给自己上的buff
            let m = log.match(kYouGainEffectRegex);
            if (m) {
                const effectId = m.groups.effectId.toUpperCase();
                let f = this.gainEffectFuncMap[effectId];
                if (f)
                    f(name, m.groups);
                this.buffTracker.onYouGainEffect(effectId, m.groups);
            }

            // 自己给其他人上的buff
            m = log.match(kMobGainsOwnEffectRegex);
            if (m) {
                const effectId = m.groups.effectId.toUpperCase();
                this.buffTracker.onMobGainsOwnEffect(effectId, m.groups);
            }

            m = log.match(kMobGainsPartyEffectRegex);
            if (m) {
                const effectId = m.groups.effectId.toUpperCase();
                this.buffTracker.onYouGainEffect(effectId, m.groups);
            }

            // m = log.match(kMobGainsEffectRegex);
            // if (m) {
            //     const effectId = m.groups.effectId.toUpperCase();
            //     this.buffTracker.onMobGainsEffect(effectId, m.groups);
            // }

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
                this.buffTracker.onMobLosesOwnEffect(effectId, log);
            }

            // m = log.match(kMobLosesEffectRegex);
            // if (m) {
            //     const effectId = m.groups.effectId.toUpperCase();
            //     this.buffTracker.onMobLosesEffect(effectId, m.groups);
            // }
        } else if (type === '21' || type === '22') {
            let m = log.match(kYouUseAbilityRegex);
            console.log(m);
            if (m) {
                let id = m.groups.id;
                let f = this.abilityFuncMap[id];
                if (f)
                    f(id, m.groups);
                this.buffTracker.onUseAbility(id, m.groups);
            } else {
                // let m = log.match(kAnybodyAbilityRegex);
                // if (m)
                //     this.buffTracker.onUseAbility(m.groups.id, m.groups);
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
            } else if (log[15] == '1') {
                if (log[16] == 'A') {

                    //鼓励匹配
                    let m = log.match(Regexes.parse('] 1A:\\y{ObjectId}:' + this.me + ' gains the effect of 鼓励 from (\\y{Name}) for \\y{Float} Seconds. \\(([0-9]+)\\)'));
                    if (m) {
                        let isMe = false;
                        if (this.me == m[1]) {
                            isMe = true;
                        }
                        // 鼓励变更
                        changeEmbolden(isMe, m[2], this.o.rightBuffsList)
                        buffsCalculation(this.job, this.options, this.o.rightBuffsList)
                    }
                }
                // TODO: consider flags for missing.
                // flags:damage is 1:0 in most misses.
                if (log[16] == '5' || log[16] == '6') {
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
        /*
        setTimeout(() => {
            let line = '26|2020-09-20T03:24:38.9810000+08:00|31|强化药|30.00|1039A1D9|水貂桑|1039A1D9|水貂桑|28D6|111340|111340||63c01dd83f9942aec827298ddef1519b';
            this.OnNetLog({line: line.split('|'), rawLine: line})
        }, 1);

        // 诗人
        setTimeout(() => {
            let line = '26|2020-09-20T02:40:53.5290000+08:00|7d|猛者强击|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|00|111340|111340||8f03e4245a6f867a176cbe211bd1c6c5';
            this.OnNetLog({line: line.split('|'), rawLine: line})
        }, 100);
        setTimeout(() => {
            let line = '26|2020-09-20T03:20:11.1660000+08:00|4b1|狂风蚀箭|30.00|1039A1D9|水貂桑|4000031F|木人|28|7400000|111340||dbf0314ef7fed2a2b2285e2a3b17d02f';
            this.OnNetLog({line: line.split('|'), rawLine: line})
        }, 1000);
        setTimeout(() => {
            let line = '26|2020-09-20T03:20:13.6610000+08:00|4b0|烈毒咬箭|30.00|1039A1D9|水貂桑|4000031F|木人|28|7400000|111340||2bb99918d00070ccc76dac9d8de81e98';
            this.OnNetLog({line: line.split('|'), rawLine: line})
        }, 2000);
        */
        // 学者
        setTimeout(() => {
            let line = '26|2020-09-20T18:34:48.5250000+08:00|4c5|连环计|15.00|103E4CCF|伊黛亚·李|40017047|梦寐的刹帝利|00|176868|93263||ea00b0bcf5bad3afc108c29be0233c9f';
            this.OnNetLog({line: line.split('|'), rawLine: line})
        }, 3000);
        setTimeout(() => {
            let line = '30|2020-09-20T17:46:59.8170000+08:00|4c5|连环计|0.00|103E4CCF|伊黛亚·李|4000031F|木人|00|7400000|97064||d701742e13324007985444a7be589683';
            this.OnNetLog({line: line.split('|'), rawLine: line})
        }, 5000);

        return;
        // this.TestChangeJob();

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
            let logs = ['[10:10:10.000] 1A:10000000:' + this.me + ' gains the effect of 强化药 from ' + this.me + ' for 30.00 Seconds.'];
            // let logs = ['[10:10:10.000] 1A:10000000:' + this.me + ' gains the effect of 强化药 from ' + this.me + ' for 120.00 Seconds.'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 1)

        setTimeout(() => {
            let logs = ['[10:10:10.000] 1A:10000000:' + this.me + ' gains the effect of 猛者强击 from ' + this.me + ' for 20.00 Seconds.'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 100)

        setTimeout(() => {
            let logs = ['[22:26:37.632] 1A:4000031E:木人 gains the effect of 狂风蚀箭 from ' + this.me + ' for 30.00 Seconds.'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 1000)

        setTimeout(() => {
            let logs = ['[22:26:37.632] 1A:4000031E:木人 gains the effect of 烈毒咬箭 from ' + this.me + ' for 30.00 Seconds.'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 2000)

        setTimeout(() => {
            let logs = ['[22:26:37.632] 1A:4000032E:木人 gains the effect of 狂风蚀箭 from ' + this.me + ' for 30.00 Seconds.'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 3000)

        setTimeout(() => {
            let logs = ['[01:05:59.585] 15:1039A1D9:' + this.me + ':8D2:攻其不备:4000031E:木人:1E710003:384B0000:5050F:27E0000:0:0:0:0:0:0:0:0:0:0:0:0:7400000:7400000:0:0:0:1000:-603.1267:-762.9036:25.02:2.283125:82278:82278:10000:10000:0:1000:-604.8576:-761.8551:25:2.115644:00003E39'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 4000)

        setTimeout(() => {
            let logs = ['[10:10:10.000] 1A:10000000:' + this.me + ' gains the effect of 义结金兰：攻击 from Okonomi Yaki for 25.00 Seconds.'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 4000)

        setTimeout(() => {
            let logs = ['[10:10:10.000] 1A:10000000:' + this.me + ' gains the effect of 放浪神之箭 from Okonomi Yaki for 15.00 Seconds.'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 5000)

        setTimeout(() => {
            let logs = ['[22:26:37.632] 1A:4000031E:木人 gains the effect of 狂风蚀箭 from ' + this.me + ' for 30.00 Seconds.'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 6000)

        setTimeout(() => {
            let logs = ['[22:26:37.632] 1A:4000031E:木人 gains the effect of 烈毒咬箭 from ' + this.me + ' for 30.00 Seconds.'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 6000)

        setTimeout(() => {
            let logs = ['[10:10:10.000] 1E:10000000:' + this.me + ' loses the effect of 放浪神之箭 from Okonomi Yaki.'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 7000)

        setTimeout(() => {
            let logs = ['[10:10:10.000] 1A:10000000:' + this.me + ' gains the effect of 河流神之瓶 from Okonomi Yaki for 15.00 Seconds.'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 7000)


        setTimeout(() => {
            let logs = ['[00:53:40.317] 15:10000000:Tako Yaki:1D60:Embolden:10000000:' + this.me + ':500020F:4D70000:0:0:0:0:0:0:0:0:0:0:0:0:0:0:42194:42194:10000:10000:0:1000:-655.3301:-838.5481:29.80905:0.523459:42194:42194:10000:10000:0:1000:-655.3301:-838.5481:29.80905:0.523459:00001DE7'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 8000)

        setTimeout(() => {
            let logs = ['[00:53:41.096] 1A:1039A1D9:' + this.me + ' gains the effect of 鼓励 from xxx for 20.00 Seconds. (5)'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 8000)

        setTimeout(() => {
            let logs = ['[00:53:41.096] 1A:1039A1D9:' + this.me + ' gains the effect of 鼓励 from xxx for 20.00 Seconds. (4)'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 12000)

        setTimeout(() => {
            let logs = ['[00:53:41.096] 1A:1039A1D9:' + this.me + ' gains the effect of 鼓励 from xxx for 20.00 Seconds. (3)'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 16000)

        setTimeout(() => {
            let logs = ['[00:53:41.096] 1A:1039A1D9:' + this.me + ' gains the effect of 鼓励 from xxx for 20.00 Seconds. (2)'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 20000)

        setTimeout(() => {
            let logs = ['[00:53:41.096] 1A:1039A1D9:' + this.me + ' gains the effect of 鼓励 from xxx for 20.00 Seconds. (1)'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 24000)

        setTimeout(() => {
            let logs = ['[00:53:41.096] 1E:1039A1D9:' + this.me + ' loses the effect of 鼓励 from xxx. (1)'];
            let e = {detail: {logs: logs}};
            this.OnLogEvent(e);
        }, 28000)

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