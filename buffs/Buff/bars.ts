import { UnreachableCode } from '../cactbot/resources/not_reached';
import ResourceBar from '../cactbot/resources/resourcebar';
import TimerBar from '../cactbot/resources/timerbar';
// import TimerBox from '../cactbot/resources/timerbox';
import Util from '../cactbot/resources/util';
import {isPhysicalJob} from './utils';
import WidgetList, {Toward} from './widget_list';
import { Job } from '../cactbot/types/job';

// import {
//   kMPCombatRate,
//   kMPNormalRate,
//   kMPTickInterval,
//   kMPUI1Rate,
//   kMPUI2Rate,
//   kMPUI3Rate,
// } from './constants';
import { JobsEventEmitter } from './event_emitter';
import { BuffOptions } from './buff_options';
import { Player } from './player';
// import { computeBackgroundColorFrom } from './utils';

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
    this.o.damageUp = this.addDamageUpBar(job);

    // 添加左侧buff框
    const buffContainer = document.createElement('div');
    buffContainer.id = 'buffs-list';
    buffContainer.style.position = 'absolute';
    if (isPhysicalJob(job)) {
      buffContainer.style.top = (this.options.PhysicalFontSize + 10).toString();
    } else {
      buffContainer.style.top = (this.options.MagicFontSize + 10).toString();
    }
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

  addDamageUpBar(job: Job): HTMLElement {
      let barsContainer = document.getElementById('damage-up');
      if (!barsContainer) {
        barsContainer = document.createElement('div');
        barsContainer.id = 'damage-up';
      }

      if (isPhysicalJob(job)) {
        // 物理增伤
        const physicalContainer = document.createElement('div');
        physicalContainer.id = 'damage-up-physical';
        physicalContainer.style.color = '#ff8129';
        physicalContainer.style.fontSize = this.options.PhysicalFontSize.toString();
        physicalContainer.setAttribute('value', String(0));
        // physicalContainer.innerText = '物: 10%';
        barsContainer.appendChild(physicalContainer);
      } else {
        // 魔法增伤
        const magicContainer = document.createElement('div');
        magicContainer.id = 'damage-up-magic';
        magicContainer.style.color = '#07d5ee';
        magicContainer.style.fontSize = this.options.MagicFontSize.toString();
        // magicContainer.style.top = this.options.PhysicalFontSize.toString();
        magicContainer.setAttribute('value', String(0));
        // magicContainer.innerText = '魔: 20%';
        barsContainer.appendChild(magicContainer);
      }

      // 在团辅出现时更新
      // this.player.on('cp', (data) => {
      //     this._updateCp(data);
      // });

      return barsContainer
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

  setJobsContainerVisibility(show?: boolean): void {
    this.jobsContainer.classList.toggle('hide', !show);
  }
}
