import {Bars} from "../../cactbot/ui/jobs/bars";
import {BuffTracker} from "../../cactbot/ui/jobs/buff_tracker";
import {JobsEventEmitter} from "../../cactbot/ui/jobs/event_emitter";
import {JobsOptions} from "../../cactbot/ui/jobs/jobs_options";
import PartyTracker from "../../cactbot/resources/party";
import {Player} from "../../cactbot/ui/jobs/player";
import {RegexesHolder} from "../../cactbot/ui/jobs/utils";
import {BaseComponent, ComponentInterface, ShouldShow} from "./base";
import Util from "../../cactbot/resources/util";

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

  constructor(private o: ComponentInterface) {
    this.bars = o.bars;
    this.ee = o.emitter;
    this.options = o.options;
    this.partyTracker = o.partyTracker;
    this.player = o.player;
    this.is5x = o.is5x;

    this.shouldShow = {};
    this.contentType = undefined;

    this.setupListeners();
  }

  setupListeners(): void {
    this.ee.registerOverlayListeners();

    // bind party changed event
    this.ee.on('party', (party) => this.partyTracker.onPartyChanged({ party }));

    this.player.on('job', (job) => {

      this.bars._setupJobContainers(job, {
        buffList: this.shouldShow.buffList ?? true,
        pullBar: this.shouldShow.pullBar ?? true,
        hpBar: false,
        mpBar: false,
        cpBar: false,
        gpBar: false,
        mpTicker: false,
      });

      // hide container html element if the player is a crafter
      this.bars.setJobsContainerVisibility(!Util.isCraftingJob(job));

      // add food buff trigger
      this.player.onYouGainEffect((id, matches) => {
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
      this.inPvPZone = isPvPZone(id);
      this.contentType = info?.contentType;

      this.bars._updateFoodBuff({
        inCombat: this.component?.inCombat ?? false,
        foodBuffExpiresTimeMs: this.foodBuffExpiresTimeMs,
        foodBuffTimer: this.foodBuffTimer,
        contentType: this.contentType,
      });

      this.buffTracker?.clear();

      // Hide UI except HP and MP bar if change to pvp area.
      this.bars._updateUIVisibility(this.inPvPZone);
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
