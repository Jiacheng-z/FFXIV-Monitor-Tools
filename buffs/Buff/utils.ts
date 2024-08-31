import { Lang } from '../cactbot/resources/languages';
import NetRegexes from '../cactbot/resources/netregexes';
import { UnreachableCode } from '../cactbot/resources/not_reached';
import TimerBar from '../cactbot/resources/timerbar';
import TimerBox from '../cactbot/resources/timerbox';
import TimerIcon from '../cactbot/resources/timericon';
import { LocaleNetRegex } from '../cactbot/resources/translations';
import Util from '../cactbot/resources/util';
import { Job } from '../cactbot/types/job';
import { NetAnyFields } from '../cactbot/types/net_fields';
import { ToMatches } from '../cactbot/types/net_matches';
import { CactbotBaseRegExp } from '../cactbot/types/net_trigger';

import { kLevelMod, kMeleeWithMpJobs } from './constants';
import {FfxivVersion} from "./buff";
import { SpeedBuffs } from './player';
import {BuffInfo} from "./buff_info";
import widget_list from './widget_list';
import {DotInfo} from "./dot_info";
import {defaultUserConfig, UserConfigOptions} from "./buff_options";

const getLocaleRegex = (locale: string, regexes: {
  'en': RegExp;
  [x: string]: RegExp;
}): RegExp => regexes[locale] ?? regexes['en'];

export class RegexesHolder {
  StatsRegex: CactbotBaseRegExp<'PlayerStats'>;
  YouGainEffectRegex: CactbotBaseRegExp<'GainsEffect'>;
  YouLoseEffectRegex: CactbotBaseRegExp<'LosesEffect'>;
  YouUseAbilityRegex: CactbotBaseRegExp<'Ability'>;
  AnybodyAbilityRegex: CactbotBaseRegExp<'Ability'>;
  MobGainsEffectRegex: CactbotBaseRegExp<'GainsEffect'>;
  MobLosesEffectRegex: CactbotBaseRegExp<'LosesEffect'>;
  MobGainsEffectFromYouRegex: CactbotBaseRegExp<'GainsEffect'>;
  MobLosesEffectFromYouRegex: CactbotBaseRegExp<'LosesEffect'>;
  cordialRegex: RegExp;
  countdownStartRegex: RegExp;
  countdownCancelRegex: RegExp;
  craftingStartRegexes: RegExp[];
  craftingFinishRegexes: RegExp[];
  craftingStopRegexes: RegExp[];

  constructor(lang: Lang, playerName: string) {
    this.StatsRegex = NetRegexes.statChange();

    this.YouGainEffectRegex = NetRegexes.gainsEffect({ target: playerName });
    this.YouLoseEffectRegex = NetRegexes.losesEffect({ target: playerName });
    this.YouUseAbilityRegex = NetRegexes.ability({ source: playerName });
    this.AnybodyAbilityRegex = NetRegexes.ability();
    this.MobGainsEffectRegex = NetRegexes.gainsEffect({ targetId: '4.{7}' });
    this.MobLosesEffectRegex = NetRegexes.losesEffect({ targetId: '4.{7}' });
    this.MobGainsEffectFromYouRegex = NetRegexes.gainsEffect({
      targetId: '4.{7}',
      source: playerName,
    });
    this.MobLosesEffectFromYouRegex = NetRegexes.losesEffect({
      targetId: '4.{7}',
      source: playerName,
    });
    // use of GP Potion
    this.cordialRegex = /20(017FD|F5A3D|F844F|0420F|0317D)/;

    const getCurrentRegex = getLocaleRegex.bind(this, lang);
    this.countdownStartRegex = getCurrentRegex(LocaleNetRegex.countdownStart);
    this.countdownCancelRegex = getCurrentRegex(LocaleNetRegex.countdownCancel);
    this.craftingStartRegexes = [
      LocaleNetRegex.craftingStart,
      LocaleNetRegex.trialCraftingStart,
    ].map(getCurrentRegex);
    this.craftingFinishRegexes = [
      LocaleNetRegex.craftingFinish,
      LocaleNetRegex.trialCraftingFinish,
    ].map(getCurrentRegex);
    this.craftingStopRegexes = [
      LocaleNetRegex.craftingFail,
      LocaleNetRegex.craftingCancel,
      LocaleNetRegex.trialCraftingFail,
      LocaleNetRegex.trialCraftingCancel,
    ].map(getCurrentRegex);
  }
}

export const isPhysicalJob = (job: Job): boolean =>
    Util.isTankJob(job) || Util.isMeleeDpsJob(job) || Util.isRangedDpsJob(job);

export const doesJobNeedMPBar = (job: Job): boolean =>
  Util.isCasterDpsJob(job) || Util.isHealerJob(job) || kMeleeWithMpJobs.includes(job);

/** compute greased lightning stacks by player's level */
const getLightningStacksByLevel = (level: number): number =>
  level < 20 ? 1 : level < 40 ? 2 : level < 76 ? 3 : 4;

type PlayerLike = {
  job: Job;
  level: number;
  speedBuffs: SpeedBuffs;
};

// Source: http://theoryjerks.akhmorning.com/guide/speed/
export const calcGCDFromStat = (
  player: PlayerLike,
  stat: number,
  ffxivVersion: FfxivVersion,
  actionDelay = 2500,
): number => {
  let type1Buffs = 0;
  let type2Buffs = 0;
  if (player.job === 'BLM') {
    type1Buffs += player.speedBuffs.circleOfPower ? 15 : 0;
  } else if (player.job === 'WHM') {
    type1Buffs += player.speedBuffs.presenceOfMind ? 20 : 0;
  } else if (player.job === 'SAM') {
    if (player.speedBuffs.fuka) {
      if (player.level > 77)
        type1Buffs += 13;
      else
        type1Buffs += 10;
    }
  } else if (player.job === 'VPR') {
    // FIXME: not sure whether it is type1
    type1Buffs += player.speedBuffs.swiftscaled ? 15 : 0;
  }

  if (player.job === 'NIN') {
    if (ffxivVersion < 700)
      type2Buffs += player.speedBuffs.huton ? 15 : 0;
    else
      type2Buffs += player.level >= 45 ? 15 : 0;
  } else if (player.job === 'MNK') {
    type2Buffs += 5 * getLightningStacksByLevel(player.level);
  } else if (player.job === 'BRD') {
    type2Buffs += 4 * player.speedBuffs.paeonStacks;
    switch (player.speedBuffs.museStacks) {
      case 1:
        type2Buffs += 1;
        break;
      case 2:
        type2Buffs += 2;
        break;
      case 3:
        type2Buffs += 4;
        break;
      case 4:
        type2Buffs += 12;
        break;
    }
  }
  // TODO: this probably isn't useful to track
  const astralUmbralMod = 100;

  // If stats haven't been updated, use a reasonable default value.
  let gcdMs = actionDelay;
  if (stat !== 0 && player.level > 0) {
    const mod = kLevelMod[player.level];
    if (!mod)
      throw new UnreachableCode();
    gcdMs = Math.floor(1000 - Math.floor(130 * (stat - mod[0]) / mod[1])) * actionDelay / 1000;
  }
  const a = (100 - type1Buffs) / 100;
  const b = (100 - type2Buffs) / 100;
  const gcdC = Math.floor(Math.floor(a * b * gcdMs / 10) * astralUmbralMod / 100);
  return gcdC / 100;
};

export const computeBackgroundColorFrom = (element: HTMLElement, classList: string): string => {
  const div = document.createElement('div');
  classList.split('.').forEach((item) => {
    div.classList.add(item);
  });
  element.appendChild(div);
  const color = window.getComputedStyle(div).backgroundColor;
  element.removeChild(div);
  return color;
};

export const findCountBuff = (dom: widget_list, tname: string): Element | undefined | null => {
  let tgs = dom.rootElement.getElementsByClassName('buffs');
  for (let i = 0; i < tgs.length; i++) {
    // @ts-ignore
    if (tgs[i].getAttribute('buffs-name') == tname) {
      return tgs[i];
    }
  }
  return null;
}

export const updateCountBuff = (dom: Element | undefined, physical: number | undefined, magic: number | undefined) => {
  if (!dom) {
    return
  }
  if (physical) {
    dom.setAttribute('buffs-incr-physical', physical.toString()) // 作用物理
  }
  if (magic) {
    dom.setAttribute('buffs-incr-magic', magic.toString()) // 作用魔法
  }
}

// 计算buff, 展示剩余多少时间刷buff是值得
export const buffsCalculation = (dom: widget_list) => {
  let tgs = dom.rootElement.getElementsByClassName('buffs');
  let toip = 0; // 自己的物理增伤 (换算成攻击) (1 + a)(1 + b) = 1 + a + b + ab
  let toim = 0; // 自己的魔法增伤 (换算成攻击)
  let tbip = 0; // 对boss的物理增伤
  let tbim = 0; // 对boss的魔法增伤

  for (let i = 0; i < tgs.length; i++) {
    // @ts-ignore
    let bio = tgs[i].getAttribute('buffs-target') // 作用自己
    // @ts-ignore
    let bipStr = tgs[i].getAttribute('buffs-incr-physical') // 作用物理
    // @ts-ignore
    let bimStr = tgs[i].getAttribute('buffs-incr-magic') // 作用魔法

    if (bio === undefined || bipStr === undefined || bimStr === undefined) {
      continue;
    }

    let bip = Number(bipStr)
    let bim = Number(bimStr)
    if (bio === 'you') { // 作用自己, 乘法公式
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

  let statp = document.getElementById('damage-up-physical');
  if (statp != null) {
    statp.setAttribute('value', showip.toString())
    if (showip <= 0) {
      statp.innerText = '';
    } else {
      statp.innerText = '物: ' + showip + '%';
    }
  }

  let statm = document.getElementById('damage-up-magic');
  if (statm != null) {
    statm.setAttribute('value', showim.toString())
    if (showim <= 0) {
      statm.innerText = '';
    } else {
      statm.innerText = '魔: ' + showim + '%';
    }
  }

  // 诗人计算秒数
  // if (job === 'BRD' && options.TextBrdSec === true) {
  //   let statSec = document.getElementById('jobs-stat-buff-sec');
  //   if (Number(showip) > 0) {
  //     statSec.innerText = Math.floor((30 * 900 * (Number(showip) / 100)) / ((1 + (Number(showip) / 100)) * (240 - 100))) + 's';
  //   } else {
  //     statSec.innerText = '';
  //   }
  // }
}

export const makeAuraDotTimerIcon = (
    name: string,
    seconds: number,
    opacity: number,
    iconWidth: number,
    iconHeight: number,
    iconText: string,
    barHeight: number,
    textHeight: number,
    textColor: string,
    borderSize: number,
    borderColor: string,
    barColor: string,
    auraIcon: string,
    info: DotInfo,
): HTMLDivElement => {
  const div = document.createElement('div');
  div.style.opacity = opacity.toString();
  div.className = 'dots'

  const icon = TimerIcon.create({
    width: iconWidth.toString(),
    height: iconHeight.toString(),
    bordersize: borderSize.toString(),
    textcolor: textColor,
  });
  div.appendChild(icon);

  const barDiv = document.createElement('div');
  barDiv.style.position = 'relative';
  barDiv.style.top = iconHeight.toString();
  div.appendChild(barDiv);

  if (seconds >= 0) {
    const bar = TimerBar.create();
    bar.width = iconWidth.toString();
    bar.height = barHeight.toString();
    bar.fg = barColor;
    bar.duration = seconds;
    barDiv.appendChild(bar);
  }

  // 根据物理计算还是魔法计算
  if (info.attackType === 'physical') {
    const statp = document.getElementById('damage-up-physical');
    if (statp != null) {
      const v = statp?.getAttribute('value')
      if (v !== undefined && Number(v) > 0) {
        icon.text = v;
      }
    }
  }
  if (info.attackType === 'magic') {
    const statm = document.getElementById('damage-up-magic');
    if (statm != null) {
      const v = statm?.getAttribute('value')
      if (v !== undefined && Number(v) > 0) {
        icon.text = v;
      }
    }
  }

  icon.bordercolor = borderColor;
  icon.icon = auraIcon;

  return div;
};

export const makeAuraTimerIcon = (
  name: string,
  seconds: number,
  opacity: number,
  iconWidth: number,
  iconHeight: number,
  iconText: string,
  barHeight: number,
  textHeight: number,
  textColor: string,
  borderSize: number,
  borderColor: string,
  barColor: string,
  barWidth: number,
  auraIcon: string,
  info: BuffInfo,
): HTMLDivElement => {
  const div = document.createElement('div');
  div.style.opacity = opacity.toString();
  div.className = 'buffs'
  // 设置buff详细信息
  div.setAttribute('buffs-name', name)
  let target = (info.target != null) ? info.target:'you';
  let physical = (info.physicalUp != null) ? info.physicalUp:0;
  let magic = (info.magicUp != null) ? info.magicUp:0;
  div.setAttribute('buffs-target', target) // 作用自己
  div.setAttribute('buffs-incr-physical', physical.toString()) // 作用物理
  div.setAttribute('buffs-incr-magic', magic.toString()) // 作用魔法

  const icon = TimerIcon.create({
    width: iconWidth.toString(),
    height: iconHeight.toString(),
    bordersize: borderSize.toString(),
    textcolor: textColor,
  });
  div.appendChild(icon);

  const barDiv = document.createElement('div');
  barDiv.style.position = 'absolute'; //绝对位置
  barDiv.style.left = iconWidth.toString(); // 图标位置
  barDiv.style.fontSize = '50%'; // 字体大小
  div.appendChild(barDiv);

  if (seconds >= 0) {
    const bar = TimerBar.create();
    bar.width = barWidth.toString() // 动态长度
    bar.height = barHeight.toString();
    bar.fg = barColor;
    bar.duration = seconds;
    bar.lefttext = 'remain';
    barDiv.appendChild(bar);
  }

  if (textHeight > 0) {
    const text = document.createElement('div');
    text.classList.add('text');
    text.style.width = iconWidth.toString();
    text.style.height = textHeight.toString();
    text.style.overflow = 'hidden';
    text.style.fontSize = (textHeight - 1).toString();
    text.style.whiteSpace = 'pre';
    text.style.position = 'relative';
    text.style.top = iconHeight.toString();
    text.style.fontFamily = 'arial';
    text.style.fontWeight = 'bold';
    text.style.color = textColor;
    text.style.textShadow = '-1px 0 3px black, 0 1px 3px black, 1px 0 3px black, 0 -1px 3px black';
    text.style.paddingBottom = (textHeight / 4).toString();

    text.innerText = name;
    div.appendChild(text);
  }

  if (iconText)
    icon.text = iconText;
  icon.bordercolor = borderColor;
  icon.icon = auraIcon;
  // icon.duration = seconds;

  return div;
};

export const normalizeLogLine = <Fields extends NetAnyFields>(
  line: string[],
  fields: Fields,
): Partial<ToMatches<Fields>> => {
  return new Proxy({}, {
    get(_target, property) {
      if (typeof property === 'string' && property in fields) {
        const looseFields: { [prop: string]: number } = fields;
        const fieldKey: number | undefined = looseFields[property];
        if (fieldKey)
          return line[fieldKey];
      }
    },
  });
};

export const isPvPZone = (zoneId: number): boolean => {
  return false;
  // const zoneInfo = ZoneInfo[zoneId];
  // if (!zoneInfo)
  //   return false;
  // if (zoneInfo.contentType === ContentType.Pvp || zoneId === ZoneId.WolvesDenPier)
  //   return true;
  // return false;
};

export const getQueryVariable = (variable: string): string => {
  const query = window.location.search.substring(1);

  for (const v of query.split("&")) {
    const pair = v.split("=")
    if (pair[0] == variable) {
      return pair[1]? pair[1]:'';
    }
  }
  return '';
}

const configNameSpace = "buffsConfig"
export const loadConfig = (): UserConfigOptions => {
  const c = localStorage.getItem(configNameSpace);
  if (c)
    return JSON.parse(c);

  return defaultUserConfig;
}

export const setConfig = (obj: UserConfigOptions) =>{
  localStorage.setItem(configNameSpace, JSON.stringify(obj));
}

export const showDuration = (o: {
  tid: number;
  timerbox: TimerBox;
  duration: number;
  cooldown: number;
  threshold: number;
  activecolor: string;
  deactivecolor: string;
}): number => {
  o.timerbox.duration = o.duration;
  o.timerbox.threshold = o.duration;
  o.timerbox.fg = computeBackgroundColorFrom(o.timerbox, o.activecolor);
  o.tid = window.setTimeout(() => {
    o.timerbox.duration = o.cooldown - o.duration;
    o.timerbox.threshold = o.threshold;
    o.timerbox.fg = computeBackgroundColorFrom(o.timerbox, o.deactivecolor);
  }, o.duration * 1000);
  return o.tid;
};
