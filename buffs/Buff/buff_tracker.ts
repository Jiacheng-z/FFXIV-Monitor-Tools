import EffectId from '../cactbot/resources/effect_id';

import PartyTracker from '../cactbot/resources/party';
import WidgetList from './widget_list';
import { NetMatches } from '../cactbot/types/net_matches';
import Util from '../cactbot/resources/util';

import { BuffOptions } from './buff_options';
import {buffsCalculation, findCountBuff, makeAuraTimerIcon, updateCountBuff} from './utils';
import {callOverlayHandler} from "../cactbot/resources/overlay_plugin_api";
import {BuffInfo,BuffInfoList} from "./buff_info";
import {Job} from "../cactbot/types/job";
import {FfxivVersion} from "./buff";


export interface Aura {
  addCallback: () => void;
  removeCallback: () => void;
  addTimeout: number | null;
  /** id in `window.clearTimeout(id)` */
  removeTimeout: number | null;
}

// TODO: consider using real times and not setTimeout times as these can drift.
export class Buff {
  name: string;
  info: BuffInfo;
  options: BuffOptions;
  activeList: WidgetList;
  cooldownList: WidgetList;
  readyList: WidgetList;
  active: Aura | null;
  cooldown: { [s: string]: Aura };
  ready: { [s: string]: Aura };
  readySortKeyBase: number;
  cooldownSortKeyBase: number;

  constructor(name: string, info: BuffInfo, list: WidgetList, options: BuffOptions) {
    this.name = name;
    this.info = info;
    this.options = options;

    // TODO: these should be different ui elements.
    // TODO: or maybe add some buffer between sections?
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

  addCooldown(source: string, effectSeconds: number): void {
    if (!this.info.cooldown)
      return;
    // Remove any preexisting cooldowns with the same name in case they unexpectedly exist.
    this.cooldown[source]?.removeCallback();

    const cooldownKey = `c:${this.name}:${source}`;

    let secondsUntilShow = this.info.cooldown - this.options.BigBuffShowCooldownSeconds;
    secondsUntilShow = Math.min(Math.max(effectSeconds, secondsUntilShow, 1), this.info.cooldown);
    const showSeconds = this.info.cooldown - secondsUntilShow;
    const addReadyCallback = () => {
      this.addReady(source);
    };

    this.cooldown[source] = this.makeAura(
      cooldownKey,
      this.cooldownList,
      showSeconds,
      secondsUntilShow,
      this.cooldownSortKeyBase,
      'grey',
      '',
      0.5,
      addReadyCallback,
    );
  }

  addReady(source: string): void {
    // Remove any preexisting cooldowns with the same name in case they unexpectedly exist.
    this.ready[source]?.removeCallback();

    // TODO: could consider looking at the party list to make initials unique?
    const initials = source.split(' ');
    let txt = '';
    if (initials.length === 2)
      txt = initials.map((str) => str.charAt(0)).join('');
    else
      txt = initials[0] ?? '';

    const color = this.info.borderColor;

    const readyKey = `r:${this.name}:${source}`;
    this.ready[source] = this.makeAura(
      readyKey,
      this.readyList,
      -1,
      0,
      this.readySortKeyBase,
      color,
      txt,
      0.6,
    );

    // if a readied raidbuff not be used in 3min, we can assume that
    // this player has left the battlefield, or at least his raidbuff is unexpectable.
    window.setTimeout(() => {
      this.ready[source]?.removeCallback();
    }, 3 * 60 * 1000);
  }

  bigBuffAutoWidth(seconds: number): number {
    let body = document.getElementsByTagName('body')
    if (!body || !body[0])
      return seconds * (this.options.BigBuffBarMaxWidth/30)

    let width = body[0].clientWidth - this.options.BigBuffIconWidth - (this.options.DotIconWidth + this.options.DotBorderSize) - 5;
    let c = (width > this.options.BigBuffBarMaxWidth)? this.options.BigBuffBarMaxWidth/30: width/30;
    return seconds * c
  }

  makeAura(
    key: string,
    list: WidgetList,
    seconds: number,
    secondsUntilShow: number,
    adjustSort: number,
    textColor: string,
    txt: string,
    opacity: number,
    expireCallback?: () => void,
  ): Aura {
    // 制作强化药
    if (this.info.gainEffect) {
      for (const e of this.info.gainEffect) {
        if (e === EffectId.Medicated && seconds >= 120) {
          return {
            addCallback(): void {},
            removeCallback(): void {},
            addTimeout: null,  removeTimeout: null
          };
        }
      }
    }

    const aura: Aura = {
      removeCallback: () => {
        list.removeElement(key);
        if (aura.addTimeout) {
          window.clearTimeout(aura.addTimeout);
          aura.addTimeout = null;
        }
        if (aura.removeTimeout) {
          window.clearTimeout(aura.removeTimeout);
          aura.removeTimeout = null;
        }
        buffsCalculation(list)
      },

      addCallback: () => {
        const elem = makeAuraTimerIcon(
          key,
          seconds,
          opacity,
          this.options.BigBuffIconWidth,
          this.options.BigBuffIconHeight,
          txt,
          this.options.BigBuffBarHeight,
          this.options.BigBuffTextHeight,
          textColor,
          this.options.BigBuffBorderSize,
          this.info.borderColor,
          this.info.borderColor,
          this.bigBuffAutoWidth(seconds),
          this.info.icon,
          this.info
        );
        list.addElement(key, elem, Math.floor(seconds) + adjustSort);
        aura.addTimeout = null;
        buffsCalculation(list)

        // 语音播报
        if (this.options.BigBuffNoticeTTSOn == true && this.info.tts != null && this.info.tts != '') {
          callOverlayHandler({call: 'cactbotSay',text: this.info.tts});
        }

        if (seconds > 0) {
          aura.removeTimeout = window.setTimeout(() => {
            aura.removeCallback();
            expireCallback?.();
          }, seconds * 1000);
        }
      },

      removeTimeout: null,

      addTimeout: null,
    };

    if (secondsUntilShow > 0)
      aura.addTimeout = window.setTimeout(aura.addCallback, secondsUntilShow * 1000);
    else
      aura.addCallback();

    return aura;
  }

  clear(): void {
    this.onLose();

    Object.values(this.cooldown).forEach((aura) => {
      aura.removeCallback();
    });

    Object.values(this.ready).forEach((aura) => {
      aura.removeCallback();
    });
  }

  clearCooldown(source: string): void {
    const ready = this.ready[source];
    if (ready)
      ready.removeCallback();
    const cooldown = this.cooldown[source];
    if (cooldown)
      cooldown.removeCallback();
  }

  onGain(seconds: number): void {
    this.onLose();
    this.active = this.makeAura(this.name, this.activeList, seconds, 0, 0, 'white', '', 1);
  }

  onLose(): void {
    if (!this.active)
      return;
    this.active.removeCallback();
    this.active = null;
  }

  onCooldown(seconds: number, source: string): void {
    this.clearCooldown(source);
    this.addCooldown(source, seconds);
  }
}

export class BuffTracker {
  buffInfo: { [s: string]: Omit<BuffInfo, 'name'> };
  buffs: { [s: string]: Buff };
  gainEffectMap: { [s: string]: BuffInfo[] };
  loseEffectMap: { [s: string]: BuffInfo[] };
  activeAbilityMap: { [s: string]: BuffInfo[]; };
  cooldownAbilityMap: { [s: string]: BuffInfo[] };

  constructor(
      private options: BuffOptions,
      private playerName: string,
      private playerJob: Job,
      private buffsListDiv: WidgetList,
      private partyTracker: PartyTracker,
      private ffxivVersion: FfxivVersion,
  ) {
    this.options = options;
    this.playerName = playerName;
    this.playerJob = playerJob;
    this.buffsListDiv = buffsListDiv;
    this.buffs = {};

    this.partyTracker = partyTracker;

    this.buffInfo = BuffInfoList.buffInfo; // 基础
    const v650: { [s: string]: Omit<BuffInfo, 'name'> } = BuffInfoList.buffInfo; // 老版本特有的合并

    if (this.ffxivVersion < 700) {
      for (const [key, entry] of Object.entries(v650))
        this.buffInfo[key] = entry;
    }

    this.gainEffectMap = {};
    this.loseEffectMap = {};
    this.activeAbilityMap = {};
    this.cooldownAbilityMap = {};

    const propToMapMap = {
      gainEffect: this.gainEffectMap,
      loseEffect: this.loseEffectMap,
      activeAbility: this.activeAbilityMap,
      cooldownAbility: this.cooldownAbilityMap,
    } as const;

    for (const [key, buffOmitName] of Object.entries(this.buffInfo)) {
      const buff = {
        ...buffOmitName,
        name: key,
      };

      const overrides = this.options.PerBuffOptions[buff.name] ?? null;
      buff.borderColor = overrides?.borderColor ?? buff.borderColor;
      buff.icon = overrides?.icon ?? buff.icon;
      buff.side = overrides?.side ?? buff.side ?? 'right';
      buff.sortKey = overrides?.sortKey || buff.sortKey;
      buff.hide = overrides?.hide ?? buff.hide ?? false;

      for (const propStr in propToMapMap) {
        const prop = propStr as keyof typeof propToMapMap;

        if (!(prop in buff))
          continue;
        const key = buff[prop];
        if (typeof key === 'undefined') {
          console.error(`undefined value for key ${prop} for buff ${buff.name}`);
          continue;
        }

        const map = propToMapMap[prop];
        if (Array.isArray(key)) {
          key.forEach((k) => map[k] = [buff, ...map[k] ?? []]);
        } else {
          map[key] ??= [];
          map[key]?.push(buff);
        }
      }
    }
  }

  onUseAbility(id: string, matches: Partial<NetMatches['Ability']>): void {
    const buffs = this.activeAbilityMap[id];
    if (!buffs)
      return;

    for (const b of buffs) {
      if (b.partyOnly && !this.partyTracker.inParty(matches?.source ?? '')) {
        // when solo, you are not inParty.
        if (matches?.source !== this.playerName)
          return;
      }

      let seconds = -1;
      if (b.useEffectDuration)
        seconds = parseFloat(matches?.duration ?? '0');
      else if ('durationSeconds' in b)
        seconds = b.durationSeconds ?? seconds;
      if ('stack' in b && b.stack !== parseInt(matches?.count ?? '0'))
        return;

      this.onBigBuff(matches?.targetId, b.name, seconds, b, matches?.source, 'active');
    }
  }

  onGainEffect(
    buffs: BuffInfo[] | undefined,
    matches: Partial<NetMatches['GainsEffect']>,
  ): void {
    if (!buffs)
      return;
    for (const b of buffs) {
      let seconds = -1;
      if (b.useEffectDuration)
        seconds = parseFloat(matches?.duration ?? '0');
      else if ('durationSeconds' in b)
        seconds = b.durationSeconds ?? seconds;
      if ('stack' in b && b.stack !== parseInt(matches?.count ?? '0'))
        return;

      // 存在count形式buff
      if (matches.count != null && matches.count !== '00') {
        if (b.physicalUpCount != null && b.physicalUpCount[matches.count] != null) {
          b.physicalUp = b.physicalUpCount[matches.count];
        }
        if (b.magicUpCount != null && b.magicUpCount[matches.count] != null) {
          b.magicUp = b.magicUpCount[matches.count];
        }

        let dom = findCountBuff(this.buffsListDiv, matches?.targetId + "=>" + b.name)
        if (dom !== null) {
          updateCountBuff(dom, b.physicalUp, b.magicUp)
          buffsCalculation(this.buffsListDiv)
          continue;
        }
      }

      if ((b.meleeUp != null && b.meleeUp > 0) || (b.rangedUp != null && b.rangedUp > 0)) {
        if (Util.isMeleeDpsJob(this.playerJob) || Util.isTankJob(this.playerJob)) {
          b.physicalUp = b.meleeUp;
          b.magicUp = b.meleeUp;
        } else {
          b.physicalUp = b.rangedUp;
          b.magicUp = b.rangedUp;
        }
      }

      this.onBigBuff(matches?.targetId, b.name, seconds, b, matches?.source, 'active');
      // Some cooldowns (like potions) have no cooldownAbility, so also track them here.
      // if (!b.cooldownAbility)
      //   this.onBigBuff(b.name, seconds, b, matches?.source, 'cooldown');
    }
  }

  onLoseEffect(
    buffs: BuffInfo[] | undefined,
    _matches: Partial<NetMatches['LosesEffect']>,
  ): void {
    if (!buffs)
      return;
    for (const b of buffs)
      this.onLoseBigBuff(_matches?.targetId, b.name);
  }

  onYouGainEffect(name: string, matches: Partial<NetMatches['GainsEffect']>): void {
    this.onGainEffect(this.gainEffectMap[name], matches);
  }

  onYouLoseEffect(name: string, matches: Partial<NetMatches['LosesEffect']>): void {
    this.onLoseEffect(this.loseEffectMap[name], matches);
  }

  onBigBuff(
    target = 'unknown',
    name: string,
    seconds = 0,
    info: BuffInfo,
    source = '',
    option: 'active' | 'cooldown',
  ): void {
    if (seconds <= 0)
      return;

    name = target + "=>" + name // 针对对boss技能. 保证不同boss分开倒计时.

    let list = this.buffsListDiv;
    let buff = this.buffs[name];
    if (!buff)
      buff = this.buffs[name] = new Buff(name, info, list, this.options);

    if (option === 'active' && seconds > 0)
      buff.onGain(seconds);
    else if (option === 'cooldown')
      buff.onCooldown(seconds, source);
  }

  onLoseBigBuff(target = 'unknown',name: string): void {
    name = target + "=>" + name // 针对对boss技能. 保证不同boss分开倒计时.
    this.buffs[name]?.onLose();
  }

  clear(): void {
    Object.values(this.buffs).forEach((buff) => buff.clear());
  }
}
