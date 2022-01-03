import { UnreachableCode } from '../cactbot/resources/not_reached';
import ResourceBar from '../cactbot/resources/resourcebar';
import TimerBar from '../cactbot/resources/timerbar';
import TimerBox from '../cactbot/resources/timerbox';
import Util from '../cactbot/resources/util';
import WidgetList, {Toward} from './widget_list';
import { Job } from '../cactbot/types/job';

import {
  kMPCombatRate,
  kMPNormalRate,
  kMPTickInterval,
  kMPUI1Rate,
  kMPUI2Rate,
  kMPUI3Rate,
} from './constants';
import { JobsEventEmitter } from './event_emitter';
import { BuffOptions } from './buff_options';
import { Player } from './player';
import { computeBackgroundColorFrom } from './utils';

// // text on the pull countdown.
// const kPullText = {
//   en: 'Pull',
//   de: 'Start',
//   fr: 'Attaque',
//   ja: 'タゲ取る',
//   cn: '开怪',
//   ko: '풀링',
// };

type JobDomObjects = {
  damageUp?: HTMLElement;
  buffsList?: WidgetList;
  dotsList?: WidgetList;

  pullCountdown?: TimerBar;
  leftBuffsList?: WidgetList;
  rightBuffsList?: WidgetList;
  cpBar?: ResourceBar;
  gpBar?: ResourceBar;
  healthBar?: ResourceBar;
  manaBar?: ResourceBar;
  mpTicker?: TimerBar;
};

export interface ResourceBox extends HTMLDivElement {
  parentNode: HTMLElement;
}

export class Bars {
  private jobsContainer: HTMLElement;
  public o: JobDomObjects = {};

  public ee: JobsEventEmitter;
  public readonly player: Player;

  constructor(private options: BuffOptions, o: {
    emitter: JobsEventEmitter;
    player: Player;
  }) {
    // Don't add any notifications if only the buff tracker is being shown.
    if (this.options.JustBuffTracker) {
      this.options.NotifyExpiredProcsInCombatSound = 'disabled';
      this.options.NotifyExpiredProcsInCombat = 0;
    }

    this.ee = o.emitter;
    this.player = o.player;

    const container = document.getElementById('jobs-container');
    if (!container)
      throw new UnreachableCode();

    this.jobsContainer = container;

    this.updateProcBoxNotifyRepeat();
  }

  updateProcBoxNotifyRepeat(): void {
    if (this.options.NotifyExpiredProcsInCombat >= 0) {
      const repeats = this.options.NotifyExpiredProcsInCombat === 0
        ? 'infinite'
        : this.options.NotifyExpiredProcsInCombat.toString();

      document.documentElement.style.setProperty('--proc-box-notify-repeat', repeats);
    }
  }

  _updateUIVisibility(inPvP?: boolean): void {
    this.jobsContainer.dataset.inpvp = inPvP ? 'true' : 'false';
  }

  _setupJobContainers(job: Job): void {
    while (this.jobsContainer.firstChild)
      this.jobsContainer.removeChild(this.jobsContainer.firstChild);

    this.o = {};
    this.jobsContainer.classList.remove('hide');

    const barsLayoutContainer = document.createElement('div');
    barsLayoutContainer.id = 'jobs';
    this.jobsContainer.appendChild(barsLayoutContainer);

    // add job name and role name in classList, e.g. 'warrior' and 'tank'
    barsLayoutContainer.classList.add(job.toLowerCase());
    const role = Util.jobToRole(job);
    if (role !== 'none')
      barsLayoutContainer.classList.add(role.toLowerCase());

    // 添加增伤模块
    const injuryContainer = document.createElement('div');
    injuryContainer.id = 'damage-up';
    barsLayoutContainer.appendChild(injuryContainer);
    this.o.damageUp = this.addDamageUpBar();

    // 添加左侧buff框
    const buffContainer = document.createElement('div');
    buffContainer.id = 'buffs-list';
    buffContainer.style.position = 'absolute';
    buffContainer.style.top = (this.options.PhysicalFontSize + this.options.MagicFontSize + 10).toString();
    barsLayoutContainer.appendChild(buffContainer);
    this.o.buffsList = this.addBuffsList({
      id: 'buffs-list',
      iconWidth: this.options.BigBuffIconWidth,
      iconHeight: this.options.BigBuffIconHeight,
      barHeight: this.options.BigBuffIconHeight, // 与icon一样高
      toward: 'down right',
    });

    // 添加右侧dot框
    const dotContainer = document.createElement('div');
    dotContainer.id = 'dots-list';
    barsLayoutContainer.appendChild(dotContainer);
    this.o.dotsList = this.addDotsList({
      id: 'dots-list',
      iconWidth: this.options.DotIconWidth,
      iconHeight: this.options.DotIconHeight,
      barHeight: this.options.DotBarHeight,
      toward: 'left down',
    });
  }

  addJobBarContainer(): HTMLElement {
    const id = this.player.job.toLowerCase() + '-bar';
    let container = document.getElementById(id);
    if (!container) {
      container = document.createElement('div');
      container.id = id;
      document.getElementById('bars')?.appendChild(container);
      container.classList.add('bar-container');
    }
    return container;
  }

  addJobBoxContainer(): HTMLElement {
    const id = this.player.job.toLowerCase() + '-boxes';
    let boxes = document.getElementById(id);
    if (!boxes) {
      boxes = document.createElement('div');
      boxes.id = id;
      document.getElementById('bars')?.appendChild(boxes);
      boxes.classList.add('box-container');
    }
    return boxes;
  }

  addResourceBox({ classList }: { classList?: string[] }): ResourceBox {
    const boxes = this.addJobBoxContainer();
    const boxDiv = document.createElement('div');
    if (classList) {
      classList.forEach((className) => {
        boxDiv.classList.add(className, 'resourcebox');
      });
    }
    boxes.appendChild(boxDiv);

    const textDiv = document.createElement('div');
    boxDiv.appendChild(textDiv);
    textDiv.classList.add('text');

    // This asserts that textDiv has a parentNode that is an HTMLElement,
    // which we create above.
    return textDiv as ResourceBox;
  }

  addProcBox({
    id,
    fgColor,
    threshold,
    scale,
    notifyWhenExpired,
  }: {
    id?: string;
    fgColor?: string;
    threshold?: number;
    scale?: number;
    notifyWhenExpired?: boolean;
  }): TimerBox {
    const elementId = this.player.job.toLowerCase() + '-procs';

    let container = id ? document.getElementById(id) : undefined;
    if (!container) {
      container = document.createElement('div');
      container.id = elementId;
      document.getElementById('bars')?.appendChild(container);
    }

    document.getElementById('procs-container')?.appendChild(container);

    const timerBox = TimerBox.create({
      stylefill: 'empty',
      bg: 'black',
      toward: 'bottom',
      threshold: threshold ? threshold : 0,
      hideafter: null,
      roundupthreshold: false,
      valuescale: scale ? scale : 1,
    });
    container.appendChild(timerBox);
    if (fgColor)
      timerBox.fg = computeBackgroundColorFrom(timerBox, fgColor);
    if (id) {
      timerBox.id = id;
      timerBox.classList.add('timer-box');
    }
    if (notifyWhenExpired) {
      timerBox.classList.add('notify-when-expired');
      if (this.options.NotifyExpiredProcsInCombatSound === 'threshold')
        timerBox.onThresholdReached(() => this.playNotification());
      else if (this.options.NotifyExpiredProcsInCombatSound === 'expired')
        timerBox.onExpired(() => this.playNotification());
    }
    return timerBox;
  }

  addTimerBar({
    id,
    fgColor,
  }: {
    id: string;
    fgColor: string;
  }): TimerBar {
    const container = this.addJobBarContainer();

    const timerDiv = document.createElement('div');
    timerDiv.id = id;
    const timer = TimerBar.create();
    container.appendChild(timerDiv);
    timerDiv.appendChild(timer);
    timer.classList.add('timer-bar');

    timer.width = window.getComputedStyle(timerDiv).width;
    timer.height = window.getComputedStyle(timerDiv).height;
    timer.toward = 'left';
    timer.bg = computeBackgroundColorFrom(timer, 'bar-border-color');
    if (fgColor)
      timer.fg = computeBackgroundColorFrom(timer, fgColor);

    return timer;
  }

  addResourceBar({
    id,
    fgColor,
    maxvalue,
  }: {
    id: string;
    fgColor: string;
    maxvalue: number;
  }): ResourceBar {
    const container = this.addJobBarContainer();

    const barDiv = document.createElement('div');
    barDiv.id = id;
    const bar = ResourceBar.create({
      bg: 'rgba(0, 0, 0, 0)',
      maxvalue: maxvalue.toString(),
    });
    container.appendChild(barDiv);
    barDiv.appendChild(bar);
    bar.classList.add('resourcebar');

    bar.fg = computeBackgroundColorFrom(bar, fgColor);
    bar.width = window.getComputedStyle(barDiv).width;
    bar.height = window.getComputedStyle(barDiv).height;

    return bar;
  }

    addDamageUpBar(): HTMLElement {
      let barsContainer = document.getElementById('damage-up');
      if (!barsContainer) {
        barsContainer = document.createElement('div');
        barsContainer.id = 'damage-up';
      }

      // 物理增伤
      const physicalContainer = document.createElement('div');
      physicalContainer.id = 'damage-up-physical';
      physicalContainer.style.color = '#ff8129';
      physicalContainer.style.fontSize = this.options.PhysicalFontSize.toString();
      physicalContainer.setAttribute('value', String(0));
      // physicalContainer.innerText = '物: 10%';
      barsContainer.appendChild(physicalContainer);

      // 魔法增伤
      const magicContainer = document.createElement('div');
      magicContainer.id = 'damage-up-magic';
      magicContainer.style.color = '#07d5ee';
      magicContainer.style.fontSize = this.options.MagicFontSize.toString();
      magicContainer.style.top = this.options.PhysicalFontSize.toString();
      magicContainer.setAttribute('value', String(0));
      // magicContainer.innerText = '魔: 20%';
      barsContainer.appendChild(magicContainer);

      // 在团辅出现时更新
      // this.player.on('cp', (data) => {
      //     this._updateCp(data);
      // });

      return barsContainer
    }

  // addPullCountdownBar(): TimerBar {
  //   const barsLayoutContainer = document.getElementById('jobs');
  //   if (!barsLayoutContainer)
  //     throw new UnreachableCode();
  //
  //   const pullCountdownContainer = document.createElement('div');
  //   pullCountdownContainer.id = 'pull-bar';
  //   // Pull counter not affected by opacity option.
  //   barsLayoutContainer.appendChild(pullCountdownContainer);
  //   const pullCountdown = TimerBar.create({
  //     righttext: 'remain',
  //     // FIXME: create function check parameters with `if (param)` so when
  //     // we using 0 here, it will just ignore it.
  //     // should be fixed in the future.
  //     // hideafter: 0,
  //     fg: 'rgb(255, 120, 120)',
  //     lefttext: kPullText[this.options.DisplayLanguage] || kPullText['en'],
  //   });
  //   pullCountdown.hideafter = 0;
  //   pullCountdownContainer.appendChild(pullCountdown);
  //   pullCountdown.width = window.getComputedStyle(pullCountdownContainer).width;
  //   pullCountdown.height = window.getComputedStyle(pullCountdownContainer).height;
  //   pullCountdown.classList.add('lang-' + this.options.DisplayLanguage);
  //
  //   // reset pull bar when in combat (game)
  //   this.ee.on('battle/in-combat', (ev) => {
  //     if (ev.game)
  //       this._setPullCountdown(0);
  //   });
  //
  //   return pullCountdown;
  // }

  addCPBar(): ResourceBar {
    const barsContainer = document.getElementById('bars');
    if (!barsContainer)
      throw new UnreachableCode();

    const cpContainer = document.createElement('div');
    cpContainer.id = 'cp-bar';
    barsContainer.appendChild(cpContainer);
    const cpBar = ResourceBar.create({
      centertext: 'maxvalue',
    });
    cpContainer.appendChild(cpBar);
    cpBar.width = window.getComputedStyle(cpContainer).width;
    cpBar.height = window.getComputedStyle(cpContainer).height;
    cpBar.bg = computeBackgroundColorFrom(cpBar, 'bar-border-color');
    cpBar.fg = computeBackgroundColorFrom(cpBar, 'cp-color');
    // update cp
    this.player.on('cp', (data) => {
      this._updateCp(data);
    });

    return cpBar;
  }

  addGPBar(): ResourceBar {
    const barsContainer = document.getElementById('bars');
    if (!barsContainer)
      throw new UnreachableCode();

    const gpContainer = document.createElement('div');
    gpContainer.id = 'gp-bar';
    barsContainer.appendChild(gpContainer);
    const gpBar = ResourceBar.create({
      centertext: 'maxvalue',
    });
    gpContainer.appendChild(gpBar);
    gpBar.width = window.getComputedStyle(gpContainer).width;
    gpBar.height = window.getComputedStyle(gpContainer).height;
    gpBar.bg = computeBackgroundColorFrom(gpBar, 'bar-border-color');
    gpBar.fg = computeBackgroundColorFrom(gpBar, 'gp-color');
    // update gp
    this.player.on('gp', (data) => {
      this._updateGp(data);
    });

    return gpBar;
  }

  addHPBar(showHPNumber?: boolean): ResourceBar {
    const barsContainer = document.getElementById('bars');
    if (!barsContainer)
      throw new UnreachableCode();

    const healthText = showHPNumber ? 'value' : '';

    const healthContainer = document.createElement('div');
    healthContainer.id = 'hp-bar';
    if (showHPNumber)
      healthContainer.classList.add('show-number');
    barsContainer.appendChild(healthContainer);

    const healthBar = ResourceBar.create({
      lefttext: healthText,
    });
    healthContainer.appendChild(healthBar);
    // TODO: Let the component do this dynamically.
    healthBar.width = window.getComputedStyle(healthContainer).width;
    healthBar.height = window.getComputedStyle(healthContainer).height;
    healthBar.bg = computeBackgroundColorFrom(healthBar, 'bar-border-color');
    // update hp
    this.player.on('hp', (data) => {
      this._updateHealth(this.o.healthBar, data);
    });

    return healthBar;
  }

  addMPBar(showMPNumber?: boolean): ResourceBar {
    const barsContainer = document.getElementById('bars');
    if (!barsContainer)
      throw new UnreachableCode();

    const manaText = showMPNumber ? 'value' : '';
    const manaContainer = document.createElement('div');
    manaContainer.id = 'mp-bar';
    barsContainer.appendChild(manaContainer);
    if (showMPNumber)
      manaContainer.classList.add('show-number');

    const manaBar = ResourceBar.create({
      lefttext: manaText,
    });
    manaContainer.appendChild(manaBar);
    // TODO: Let the component do this dynamically.
    manaBar.width = window.getComputedStyle(manaContainer).width;
    manaBar.height = window.getComputedStyle(manaContainer).height;
    manaBar.bg = computeBackgroundColorFrom(manaBar, 'bar-border-color');
    // update mp
    this.player.on('mp', (data) => {
      this._updateMana(data);
    });

    return manaBar;
  }

  addMPTicker(): TimerBar {
    const barsContainer = document.getElementById('bars');
    if (!barsContainer)
      throw new UnreachableCode();

    const mpTickContainer = document.createElement('div');
    mpTickContainer.id = 'mp-tick';
    barsContainer.appendChild(mpTickContainer);

    const mpTicker = TimerBar.create();
    mpTickContainer.appendChild(mpTicker);
    mpTicker.width = window.getComputedStyle(mpTickContainer).width;
    mpTicker.height = window.getComputedStyle(mpTickContainer).height;
    mpTicker.bg = computeBackgroundColorFrom(mpTicker, 'bar-border-color');
    mpTicker.stylefill = 'fill';
    mpTicker.toward = 'right';
    mpTicker.loop = true;
    this.ee.on('battle/in-combat', (ev) => {
      // Hide out of combat if requested
      if (mpTicker && !this.options.ShowMPTickerOutOfCombat && !ev.game) {
        mpTicker.duration = 0;
        mpTicker.stylefill = 'empty';
      }
    });

    return mpTicker;
  }

  addBuffsList(o: {
    id: string;
    iconWidth: number;
    iconHeight: number;
    barHeight: number;
    toward: Toward;
  }): WidgetList {
    const barsContainer = document.getElementById(o.id);
    if (!barsContainer)
      throw new UnreachableCode();

    const buffsList = WidgetList.create({
      rowcolsize: 20,
      maxnumber: 20,
      toward: o.toward,
      // elementwidth: (o.iconWidth + 2).toString(),
      elementheight: (o.iconHeight + 1).toString(),
    });
    barsContainer.appendChild(buffsList);

    return buffsList;
  }

  addDotsList(o: {
    id: string;
    iconWidth: number;
    iconHeight: number;
    barHeight: number;
    toward: Toward;
  }): WidgetList {
    const barsContainer = document.getElementById(o.id);
    if (!barsContainer)
      throw new UnreachableCode();

    const buffsList = WidgetList.create({
      rowcolsize: 1,
      maxnumber: 20,
      toward: o.toward,
      elementwidth: (o.iconWidth + 2).toString(),
      elementheight: (o.iconHeight + o.barHeight).toString(),
    });
    barsContainer.appendChild(buffsList);

    return buffsList;
  }

  playNotification(): void {
    const audio = new Audio('../../resources/sounds/freesound/alarm.webm');
    audio.volume = 0.3;
    void audio.play();
  }

  _updateHealth(
    healthBar: ResourceBar | undefined,
    data: {
      hp: number;
      maxHp: number;
      shield: number;
    },
  ): void {
    if (!healthBar)
      return;
    healthBar.value = data.hp.toString();
    healthBar.maxvalue = data.maxHp.toString();
    healthBar.extravalue = data.shield.toString();

    const percent = (data.hp + data.shield) / data.maxHp;

    if (data.maxHp > 0 && percent < this.options.LowHealthThresholdPercent)
      healthBar.fg = computeBackgroundColorFrom(healthBar, 'hp-color.low');
    else if (data.maxHp > 0 && percent < this.options.MidHealthThresholdPercent)
      healthBar.fg = computeBackgroundColorFrom(healthBar, 'hp-color.mid');
    else
      healthBar.fg = computeBackgroundColorFrom(healthBar, 'hp-color');
  }

  _updateProcBoxNotifyState(inCombat: boolean): void {
    if (this.options.NotifyExpiredProcsInCombat >= 0) {
      const boxes = document.getElementsByClassName('proc-box');
      for (const box of boxes) {
        if (inCombat) {
          box.classList.add('in-combat');
          for (const child of box.children)
            child.classList.remove('expired');
        } else {
          box.classList.remove('in-combat');
        }
      }
    }
  }

  _updateMPTicker(data: {
    mp: number;
    maxMp: number;
    prevMp?: number;
    umbralStacks?: number;
    inCombat: boolean;
  }): void {
    if (!this.o.mpTicker)
      return;

    const prevMp = data.prevMp ?? parseInt(this.o.manaBar?.value ?? '0');
    const delta = data.mp - prevMp;

    this.o.mpTicker.stylefill = 'fill';

    const baseTick = data.inCombat ? kMPCombatRate : kMPNormalRate;
    let umbralTick = 0;
    data.umbralStacks ??= 0;
    if (data.umbralStacks === -1)
      umbralTick = kMPUI1Rate;
    if (data.umbralStacks === -2)
      umbralTick = kMPUI2Rate;
    if (data.umbralStacks === -3)
      umbralTick = kMPUI3Rate;

    const mpTick = Math.floor(data.maxMp * baseTick) + Math.floor(data.maxMp * umbralTick);
    if (delta === mpTick && data.umbralStacks <= 0) // MP ticks disabled in AF
      this.o.mpTicker.duration = kMPTickInterval;

    // Update color based on the astral fire/ice state
    let colorTag = 'mp-tick-color';
    if (data.umbralStacks < 0)
      colorTag = 'mp-tick-color.ice';
    if (data.umbralStacks > 0)
      colorTag = 'mp-tick-color.fire';
    this.o.mpTicker.fg = computeBackgroundColorFrom(this.o.mpTicker, colorTag);
  }

  _updateMana(data: {
    mp: number;
    maxMp: number;
    prevMp: number;
  }): void {
    if (!this.o.manaBar)
      return;
    this.o.manaBar.value = data.mp.toString();
    this.o.manaBar.maxvalue = data.maxMp.toString();
  }

  updateMpBarColor(data: {
    mp: number;
    far?: boolean;
  }): void {
    if (!this.o.manaBar)
      return;

    if (data.far) {
      this.o.manaBar.fg = computeBackgroundColorFrom(this.o.manaBar, 'mp-color.far');
      return;
    }

    let lowMP = -1;
    let mediumMP = -1;

    if (this.player.job === 'DRK') {
      lowMP = this.options.DrkLowMPThreshold;
      mediumMP = this.options.DrkMediumMPThreshold;
    } else if (this.player.job === 'PLD') {
      lowMP = this.options.PldLowMPThreshold;
      mediumMP = this.options.PldMediumMPThreshold;
    } else if (this.player.job === 'BLM') {
      lowMP = this.options.BlmLowMPThreshold;
      mediumMP = this.options.BlmMediumMPThreshold;
    }

    if (lowMP >= 0 && data.mp <= lowMP)
      this.o.manaBar.fg = computeBackgroundColorFrom(this.o.manaBar, 'mp-color.low');
    else if (mediumMP >= 0 && data.mp <= mediumMP)
      this.o.manaBar.fg = computeBackgroundColorFrom(this.o.manaBar, 'mp-color.medium');
    else
      this.o.manaBar.fg = computeBackgroundColorFrom(this.o.manaBar, 'mp-color');
  }

  _updateCp(data: {
    cp: number;
    maxCp: number;
  }): void {
    if (!this.o.cpBar)
      return;
    this.o.cpBar.value = data.cp.toString();
    this.o.cpBar.maxvalue = data.maxCp.toString();
  }

  _updateGp(data: {
    gp: number;
    maxGp: number;
  }): void {
    if (!this.o.gpBar)
      return;
    this.o.gpBar.value = data.gp.toString();
    this.o.gpBar.maxvalue = data.maxGp.toString();
  }

  _playGpAlarm(): void {
    const audio = new Audio('../../resources/sounds/freesound/power_up.webm');
    audio.volume = this.options.GpAlarmSoundVolume;
    void audio.play();
  }

  _updateOpacity(transparent: boolean): void {
    const opacityContainer = document.getElementById('opacity-container');
    if (!opacityContainer)
      return;
    opacityContainer.style.opacity = transparent
      ? this.options.OpacityOutOfCombat.toString()
      : '1.0';
  }

  _setPullCountdown(seconds: number): void {
    if (!this.o.pullCountdown)
      return;

    const inCountdown = seconds > 0;
    const showingCountdown = this.o.pullCountdown.duration ?? 0 > 0;
    if (inCountdown !== showingCountdown) {
      this.o.pullCountdown.duration = seconds;
      if (inCountdown && this.options.PlayCountdownSound) {
        const audio = new Audio('../../resources/sounds/freesound/sonar.webm');
        audio.volume = 0.3;
        void audio.play();
      }
    }
  }

  setJobsContainerVisibility(show?: boolean): void {
    this.jobsContainer.classList.toggle('hide', !show);
  }
}
