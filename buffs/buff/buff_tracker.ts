import EffectId from '../cactbot/resources/effect_id';

import PartyTracker from '../cactbot/resources/party';
import WidgetList from './widget_list';
import { NetMatches } from '../cactbot/types/net_matches';
import Util from '../cactbot/resources/util';

import { BuffOptions } from './buff_options';
import {buffsCalculation, findCountBuff, makeAuraTimerIcon, updateCountBuff} from './utils';
import {callOverlayHandler} from "../cactbot/resources/overlay_plugin_api";
import {BuffInfoList} from "./buff_info";
import {Job} from "../cactbot/types/job";

export interface BuffInfo {
  name: string;
  activeAbility?: string[];
  cooldownAbility?: string[];
  gainEffect?: string[];
  loseEffect?: string[];
  mobGainsEffect?: string;
  mobLosesEffect?: string;
  durationSeconds?: number;
  useEffectDuration?: boolean;
  icon: string;
  side?: 'left' | 'right';
  borderColor: string;
  sortKey: number;
  cooldown?: number;
  sharesCooldownWith?: string[];
  hide?: boolean;
  stack?: number;
  partyOnly?: boolean;

  target?: 'you' | 'boss' ; // 赋给自己? true:给自己, false:给boss
  physicalUp?: number; //物理增伤百分比
  magicUp?: number; // 魔法增伤百分比
  physicalUpCount?: { [s: string]: number }; //物理增伤百分比
  magicUpCount?:  { [s: string]: number }; // 魔法增伤百分比
  meleeUp?: number; // 近战增伤比
  rangedUp?: number; // 远程增伤
  tts?: string; // tts播报
}

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

    const cooldownKey = 'c:' + this.name + ':' + source;

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

    const readyKey = 'r:' + this.name + ':' + source;
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
          0,
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
  mobGainsEffectMap: { [s: string]: BuffInfo[] };
  mobLosesEffectMap: { [s: string]: BuffInfo[] };

  constructor(
      private options: BuffOptions,
      private playerName: string,
      private playerJob: Job,
      private buffsListDiv: WidgetList,
      private partyTracker: PartyTracker,
      private is5x: boolean,
  ) {
    this.options = options;
    this.playerName = playerName;
    this.playerJob = playerJob;
    this.buffsListDiv = buffsListDiv;
    this.buffs = {};

    this.partyTracker = partyTracker;

    this.buffInfo = BuffInfoList.buffInfo;
    /*this.buffInfo = {
      astralAttenuation: {
        mobGainsEffect: EffectId.AstralAttenuation,
        mobLosesEffect: EffectId.AstralAttenuation,
        useEffectDuration: true,
        icon: astralImage,
        borderColor: '#9bdec0',
        sortKey: 0,
      },
      umbralAttenuation: {
        mobGainsEffect: EffectId.UmbralAttenuation,
        mobLosesEffect: EffectId.UmbralAttenuation,
        useEffectDuration: true,
        icon: umbralImage,
        borderColor: '#4d8bc9',
        sortKey: 0,
      },
      physicalAttenuation: {
        mobGainsEffect: EffectId.PhysicalAttenuation,
        mobLosesEffect: EffectId.PhysicalAttenuation,
        useEffectDuration: true,
        icon: physicalImage,
        borderColor: '#fff712',
        sortKey: 0,
      },
      offguard: {
        cooldownAbility: [kAbility.OffGuard],
        mobGainsEffect: EffectId.OffGuard,
        mobLosesEffect: EffectId.OffGuard,
        useEffectDuration: true,
        durationSeconds: 15,
        icon: offguardImage,
        borderColor: '#47bf41',
        sortKey: 1,
        cooldown: 60,
        sharesCooldownWith: ['peculiar'],
      },
      peculiar: {
        cooldownAbility: [kAbility.PeculiarLight],
        mobGainsEffect: EffectId.PeculiarLight,
        mobLosesEffect: EffectId.PeculiarLight,
        useEffectDuration: true,
        durationSeconds: 15,
        icon: peculiarLightImage,
        borderColor: '#F28F7B',
        sortKey: 1,
        cooldown: 60,
        sharesCooldownWith: ['offguard'],
      },
      trick: {
        cooldownAbility: [kAbility.TrickAttack],
        mobGainsEffect: EffectId.VulnerabilityUp,
        mobLosesEffect: EffectId.VulnerabilityUp,
        useEffectDuration: true,
        durationSeconds: 15,
        icon: trickAttackImage,
        // Magenta.
        borderColor: '#FC4AE6',
        sortKey: 1,
        cooldown: 60,
      },
      litany: {
        cooldownAbility: [kAbility.BattleLitany],
        gainEffect: [EffectId.BattleLitany],
        loseEffect: [EffectId.BattleLitany],
        useEffectDuration: true,
        durationSeconds: 15,
        partyOnly: true,
        icon: battleLitanyImage,
        // Cyan.
        borderColor: '#099',
        sortKey: 2,
        cooldown: 120,
      },
      embolden: {
        cooldownAbility: [kAbility.Embolden],
        gainEffect: [EffectId.Embolden, EffectId.EmboldenSelf],
        loseEffect: [EffectId.Embolden, EffectId.EmboldenSelf],
        useEffectDuration: true,
        durationSeconds: 20,
        partyOnly: true,
        icon: emboldenImage,
        // Lime.
        borderColor: '#57FC4A',
        sortKey: 3,
        cooldown: 120,
      },
      arrow: {
        gainEffect: [EffectId.TheArrow],
        loseEffect: [EffectId.TheArrow],
        useEffectDuration: true,
        icon: arrowImage,
        // Light Blue.
        borderColor: '#37ccee',
        sortKey: 4,
      },
      balance: {
        gainEffect: [EffectId.TheBalance],
        loseEffect: [EffectId.TheBalance],
        useEffectDuration: true,
        icon: balanceImage,
        // Orange.
        borderColor: '#ff9900',
        sortKey: 4,
      },
      bole: {
        gainEffect: [EffectId.TheBole],
        loseEffect: [EffectId.TheBole],
        useEffectDuration: true,
        icon: boleImage,
        // Green.
        borderColor: '#22dd77',
        sortKey: 4,
      },
      ewer: {
        gainEffect: [EffectId.TheEwer],
        loseEffect: [EffectId.TheEwer],
        useEffectDuration: true,
        icon: ewerImage,
        // Light Blue.
        borderColor: '#66ccdd',
        sortKey: 4,
      },
      spear: {
        gainEffect: [EffectId.TheSpear],
        loseEffect: [EffectId.TheSpear],
        useEffectDuration: true,
        icon: spearImage,
        // Dark Blue.
        borderColor: '#4477dd',
        sortKey: 4,
      },
      spire: {
        gainEffect: [EffectId.TheSpire],
        loseEffect: [EffectId.TheSpire],
        useEffectDuration: true,
        icon: spireImage,
        // Yellow.
        borderColor: '#ddd044',
        sortKey: 4,
      },
      ladyOfCrowns: {
        gainEffect: [EffectId.LadyOfCrowns],
        loseEffect: [EffectId.LadyOfCrowns],
        useEffectDuration: true,
        icon: ladyOfCrownsImage,
        // Purple.
        borderColor: '#9e5599',
        sortKey: 4,
      },
      lordOfCrowns: {
        gainEffect: [EffectId.LordOfCrowns],
        loseEffect: [EffectId.LordOfCrowns],
        useEffectDuration: true,
        icon: lordOfCrownsImage,
        // Dark Red.
        borderColor: '#9a2222',
        sortKey: 4,
      },
      devilment: {
        gainEffect: [EffectId.Devilment],
        loseEffect: [EffectId.Devilment],
        useEffectDuration: true,
        icon: devilmentImage,
        // Dark Green.
        borderColor: '#006400',
        sortKey: 5,
        cooldown: 120,
      },
      standardFinish: {
        gainEffect: [EffectId.StandardFinish],
        loseEffect: [EffectId.StandardFinish],
        useEffectDuration: true,
        icon: standardFinishImage,
        // Green.
        borderColor: '#32CD32',
        sortKey: 6,
      },
      technicalFinish: {
        // This tracker may not be accurate.
        // Technical Step cooldown when start dancing,
        // but raidbuff take effects on finish.
        cooldownAbility: [
          kAbility.QuadrupleTechnicalFinish,
          kAbility.TripleTechnicalFinish,
          kAbility.DoubleTechnicalFinish,
          kAbility.SingleTechnicalFinish,
          kAbility.TechnicalFinish,
        ],
        gainEffect: [EffectId.TechnicalFinish],
        loseEffect: [EffectId.TechnicalFinish],
        useEffectDuration: true,
        durationSeconds: 20,
        partyOnly: true,
        icon: technicalFinishImage,
        // Dark Peach.
        borderColor: '#E0757C',
        sortKey: 6,
        cooldown: 120,
      },
      chain: {
        cooldownAbility: [kAbility.ChainStratagem],
        mobGainsEffect: EffectId.ChainStratagem,
        mobLosesEffect: EffectId.ChainStratagem,
        useEffectDuration: true,
        durationSeconds: 15,
        icon: chainStratagemImage,
        // Blue.
        borderColor: '#4674E5',
        sortKey: 8,
        cooldown: 120,
      },
      lefteye: {
        gainEffect: [EffectId.LeftEye],
        loseEffect: [EffectId.LeftEye],
        useEffectDuration: true,
        icon: dragonSightImage,
        // Orange.
        borderColor: '#FA8737',
        sortKey: 9,
        cooldown: 120,
      },
      righteye: {
        gainEffect: [EffectId.RightEye],
        loseEffect: [EffectId.RightEye],
        useEffectDuration: true,
        icon: dragonSightImage,
        // Orange.
        borderColor: '#FA8737',
        sortKey: 10,
        cooldown: 120,
      },
      brotherhood: {
        cooldownAbility: [kAbility.Brotherhood],
        gainEffect: [EffectId.Brotherhood],
        loseEffect: [EffectId.Brotherhood],
        useEffectDuration: true,
        durationSeconds: 15,
        partyOnly: true,
        icon: brotherhoodImage,
        // Dark Orange.
        borderColor: '#994200',
        sortKey: 11,
        cooldown: 120,
      },
      divination: {
        cooldownAbility: [kAbility.Divination],
        gainEffect: [EffectId.Divination],
        loseEffect: [EffectId.Divination],
        useEffectDuration: true,
        durationSeconds: 15,
        partyOnly: true,
        icon: divinationImage,
        // Dark purple.
        borderColor: '#5C1F58',
        sortKey: 13,
        cooldown: 120,
      },
      arcaneCircle: {
        cooldownAbility: [kAbility.ArcaneCircle],
        gainEffect: [EffectId.ArcaneCircle],
        loseEffect: [EffectId.ArcaneCircle],
        useEffectDuration: true,
        durationSeconds: 20,
        partyOnly: true,
        icon: arcaneCircleImage,
        // Light pink..
        borderColor: '#F3A6FF',
        sortKey: 14,
        cooldown: 120,
      },
      searingLight: {
        // FIXME: pet is not considered inParty, so this cannot track it if it misses you.
        cooldownAbility: [kAbility.SearingLight],
        gainEffect: [EffectId.SearingLight],
        loseEffect: [EffectId.SearingLight],
        useEffectDuration: true,
        durationSeconds: 30,
        partyOnly: true,
        icon: searingLightImage,
        // Pink.
        borderColor: '#FF4A9D',
        sortKey: 14,
        cooldown: 120,
      },
    };*/

    // Abilities that are different in 5.x.
    const v5x = BuffInfoList.buffInfoV5;
    /*const v5x = {
      litany: {
        cooldownAbility: [kAbility.BattleLitany],
        gainEffect: [EffectId.BattleLitany],
        loseEffect: [EffectId.BattleLitany],
        useEffectDuration: true,
        durationSeconds: 20,
        partyOnly: true,
        icon: battleLitanyImage,
        // Cyan.
        borderColor: '#099',
        sortKey: 2,
        cooldown: 180,
      },
      embolden: {
        // On each embolden stack changes,
        // there will be a gain effect log with a wrong duration (always 20).
        // So using stack to identify the first log.
        cooldownAbility: [kAbility.Embolden],
        gainEffect: [EffectId.Embolden, EffectId.EmboldenSelf],
        loseEffect: [EffectId.Embolden, EffectId.EmboldenSelf],
        useEffectDuration: true,
        durationSeconds: 20,
        partyOnly: true,
        stack: 5,
        icon: emboldenImage,
        // Lime.
        borderColor: '#57FC4A',
        sortKey: 3,
        cooldown: 120,
      },
      brotherhood: {
        cooldownAbility: [kAbility.Brotherhood],
        gainEffect: [EffectId.Brotherhood],
        loseEffect: [EffectId.Brotherhood],
        useEffectDuration: true,
        durationSeconds: 15,
        partyOnly: true,
        icon: brotherhoodImage,
        // Dark Orange.
        borderColor: '#994200',
        sortKey: 11,
        cooldown: 90,
      },
      devotion: {
        // FIXME: pet is not considered inParty, so this cannot track it if it misses you.
        // By the way, pet can delay using devotion after been ordered
        // and if you order it to continue moving, it can greatly delay up to 30s,
        // so it may not be accurate.
        cooldownAbility: [kAbility.Devotion],
        gainEffect: [EffectId.Devotion],
        loseEffect: [EffectId.Devotion],
        useEffectDuration: true,
        durationSeconds: 15,
        partyOnly: true,
        icon: devotionImage,
        // Yellow.
        borderColor: '#ffbf00',
        sortKey: 12,
        cooldown: 180,
      },
    };*/

    if (this.is5x) {
      for (const [key, entry] of Object.entries(v5x))
        this.buffInfo[key] = entry;
    }

    this.gainEffectMap = {};
    this.loseEffectMap = {};
    this.activeAbilityMap = {};
    this.cooldownAbilityMap = {};
    this.mobGainsEffectMap = {};
    this.mobLosesEffectMap = {};

    const propToMapMap = {
      gainEffect: this.gainEffectMap,
      loseEffect: this.loseEffectMap,
      activeAbility: this.activeAbilityMap,
      cooldownAbility: this.cooldownAbilityMap,
      mobGainsEffect: this.mobGainsEffectMap,
      mobLosesEffect: this.mobLosesEffectMap,
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
          console.error('undefined value for key ' + prop + ' for buff ' + buff.name);
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

      // if (b.durationSeconds)
      //   seconds = b.durationSeconds + 1;
      //
      // this.onBigBuff(b.name, seconds, b, matches?.source, 'cooldown');
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
    matches: Partial<NetMatches['LosesEffect']>,
  ): void {
    if (!buffs)
      return;
    for (const b of buffs)
      this.onLoseBigBuff(matches?.targetId, b.name);
  }

  onYouGainEffect(name: string, matches: Partial<NetMatches['GainsEffect']>): void {
    this.onGainEffect(this.gainEffectMap[name], matches);
  }

  onYouLoseEffect(name: string, matches: Partial<NetMatches['LosesEffect']>): void {
    this.onLoseEffect(this.loseEffectMap[name], matches);
  }

  onMobGainsEffect(name: string, matches: Partial<NetMatches['GainsEffect']>): void {
    this.onGainEffect(this.mobGainsEffectMap[name], matches);
  }

  onMobLosesEffect(name: string, matches: Partial<NetMatches['LosesEffect']>): void {
    this.onLoseEffect(this.mobLosesEffectMap[name], matches);
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
