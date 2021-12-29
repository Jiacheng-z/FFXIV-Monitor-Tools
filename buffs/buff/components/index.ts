import EffectId from '../../cactbot/resources/effect_id';
import PartyTracker from '../../cactbot/resources/party';
import Util from '../../cactbot/resources/util';
import { Job } from '../../cactbot/types/job';
import { Bars } from '../bars';
import { BuffTracker } from '../buff_tracker';
import { JobsEventEmitter } from '../event_emitter';
import { JobsOptions } from '../jobs_options';
import { Player } from '../player';
import { doesJobNeedMPBar, RegexesHolder } from '../utils';

import { BaseComponent, ComponentInterface, ShouldShow } from './base';

// const ComponentMap: Record<Job, typeof BaseComponent> = {}

export class ComponentManager {
  bars: Bars;
  buffTracker?: BuffTracker;
  ee: JobsEventEmitter;
  options: JobsOptions;
  partyTracker: PartyTracker;
  is5x: boolean;
  player: Player;
  regexes?: RegexesHolder;
  component?: BaseComponent;

  // misc variables
  shouldShow: ShouldShow;
  contentType?: number;
  inPvPZone?: boolean;

  // gp potions
  gpAlarmReady: boolean;
  gpPotion: boolean;
  // true if player is too far away from their target
  far?: boolean;

  constructor(private o: ComponentInterface) {
    this.bars = o.bars;
    this.ee = o.emitter;
    this.options = o.options;
    this.partyTracker = o.partyTracker;
    this.player = o.player;
    this.is5x = o.is5x;

    this.shouldShow = {};
    this.contentType = undefined;

    this.gpAlarmReady = false;
    this.gpPotion = false;

    this.far = undefined;

    this.setupListeners();
  }

  setupListeners(): void {
    this.ee.registerOverlayListeners();

    // bind party changed event
    this.ee.on('party', (party) => this.partyTracker.onPartyChanged({ party }));

    this.player.on('job', (job) => {
      this.gpAlarmReady = false;

      this.bars._setupJobContainers(job, {
        buffList: this.shouldShow.buffList ?? true,
        pullBar: this.shouldShow.pullBar ?? true,
        hpBar: this.shouldShow.hpBar ?? (!Util.isCraftingJob(job) && !Util.isGatheringJob(job)),
        mpBar: this.shouldShow.mpBar ??
          (!Util.isCraftingJob(job) && !Util.isGatheringJob(job) && doesJobNeedMPBar(job)),
        cpBar: this.shouldShow.cpBar ?? Util.isCraftingJob(job),
        gpBar: this.shouldShow.gpBar ?? Util.isGatheringJob(job),
        mpTicker: this.shouldShow.mpTicker ?? this.options.ShowMPTicker.includes(job),
      });

      // hide container html element if the player is a crafter
      this.bars.setJobsContainerVisibility(!Util.isCraftingJob(job));

      // add food buff trigger
      this.player.onYouGainEffect((id, matches) => {
        if (id === EffectId.WellFed) {
          // const seconds = parseFloat(matches.duration ?? '0');
          // const now = Date.now(); // This is in ms.
          // this.foodBuffExpiresTimeMs = now + (seconds * 1000);
        }
      });
      // As you cannot change jobs in combat, we can assume that
      // it is always false here.
      this.bars._updateProcBoxNotifyState(false);

      // TODO: this is always created by _updateJob, so maybe this.o needs be optional?
      if (this.bars.o.leftBuffsList && this.bars.o.rightBuffsList) {
        // Set up the buff tracker after the job bars are created.
        this.buffTracker = new BuffTracker(
          this.options,
          this.player.name,
          this.bars.o.leftBuffsList,
          this.bars.o.rightBuffsList,
          this.partyTracker,
          this.is5x,
        );
      }
    });

    // update RegexesHolder when the player name changes
    this.player.on('player', ({ name }) => {
      this.regexes = new RegexesHolder(this.options.ParserLanguage, name);
    });

    this.ee.on('battle/wipe', () => {
      this._onPartyWipe();
    });

    this.player.on('action/you', (id, matches) => {
      if (this.regexes?.cordialRegex.test(id)) {
        this.gpPotion = true;
        window.setTimeout(() => {
          this.gpPotion = false;
        }, 2000);
      }
      this.buffTracker?.onUseAbility(id, matches);
    });

    this.player.on('action/other', (id, matches) => this.buffTracker?.onUseAbility(id, matches));

    this.player.on(
      'effect/gain/you',
      (id, matches) => this.buffTracker?.onYouGainEffect(id, matches),
    );

    this.player.on('effect/gain', (id, matches) => {
      // mob id starts with '4'
      if (matches.targetId?.startsWith('4'))
        this.buffTracker?.onMobGainsEffect(id, matches);
    });

    this.player.on(
      'effect/lose/you',
      (id, matches) => this.buffTracker?.onYouLoseEffect(id, matches),
    );

    this.player.on('effect/lose', (id, matches) => {
      // mob id starts with '4'
      if (matches.targetId?.startsWith('4'))
        this.buffTracker?.onMobLosesEffect(id, matches);
    });

    this.ee.on('zone/change', (id, _name, info) => {
      this.contentType = info?.contentType;
      this.buffTracker?.clear();
    });

    this.ee.on('log/game', (_log, _line, rawLine) => {
      const m = this.regexes?.countdownStartRegex.exec(rawLine);
      if (m && m.groups?.time) {
        const seconds = parseFloat(m.groups.time);
        this.bars._setPullCountdown(seconds);
      }
      if (this.regexes?.countdownCancelRegex.test(rawLine))
        this.bars._setPullCountdown(0);
      if (Util.isCraftingJob(this.player.job))
        this._onCraftingLog(rawLine);
    });
  }

  private _onPartyWipe(): void {
    this.buffTracker?.clear();
    // Reset job-specific ui
    this.component?.reset();
  }

  private _onCraftingLog(message: string): void {
    if (!this.regexes)
      return;

    // Hide CP Bar when not crafting
    const anyRegexMatched = (line: string, array: RegExp[]) =>
      array.some((regex) => regex.test(line));

    // if the current player is crafting, show the bars;
    // otherwise, hide them
    if (anyRegexMatched(message, this.regexes.craftingStartRegexes))
      this.bars.setJobsContainerVisibility(true);
    if (
      anyRegexMatched(message, this.regexes.craftingStopRegexes) ||
      this.regexes.craftingFinishRegexes.some((regex) => {
        const m = regex.exec(message)?.groups;
        return m && (!m.player || m.player === this.player.name);
      })
    )
      this.bars.setJobsContainerVisibility(false);
  }
}
