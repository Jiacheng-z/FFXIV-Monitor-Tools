import PartyTracker from '../../cactbot/resources/party';
import Util from '../../cactbot/resources/util';
import {Bars} from '../bars';
import {BuffTracker} from '../buff_tracker';
import {DotTracker} from "../dot_tracker";
import {JobsEventEmitter} from '../event_emitter';
import {BuffOptions} from '../buff_options';
import {Player} from '../player';
import {isPvPZone, RegexesHolder} from '../utils';

import {BaseComponent, ComponentInterface} from './base';

export class ComponentManager {
    options: BuffOptions;
    ee: JobsEventEmitter;

    player: Player;
    partyTracker: PartyTracker;

    bars: Bars;
    buffTracker?: BuffTracker;
    dotTracker?: DotTracker;

    regexes?: RegexesHolder;

    // misc variables
    contentType?: number;
    inPvPZone?: boolean;
    is5x: boolean;

    component?: BaseComponent;

    constructor(private o: ComponentInterface) {
        this.o.is5x;

        this.bars = o.bars;
        this.ee = o.emitter;
        this.options = o.options;
        this.partyTracker = o.partyTracker;
        this.player = o.player;
        this.is5x = o.is5x;
        this.contentType = undefined;

        this.setupListeners();
    }

    setupListeners(): void {
        this.ee.registerOverlayListeners();

        // bind party changed event
        this.ee.on('party', (party) => {
            this.partyTracker.onPartyChanged({party})
        });

        this.player.on('job', (job) => {
            this.dotTracker?.clear();

            this.bars._setupJobContainers(job);

            // hide container html element if the player is a crafter
            this.bars.setJobsContainerVisibility(!Util.isCraftingJob(job));

            // As you cannot change jobs in combat, we can assume that
            // it is always false here.
            this.bars._updateProcBoxNotifyState(false);

            // Set up the buff tracker after the job bars are created.
            if (this.bars.o.buffsList) {
                this.buffTracker = new BuffTracker(
                    this.options,
                    this.player.name,
                    this.player.job,
                    this.bars.o.buffsList,
                    this.partyTracker,
                    this.is5x,
                );
            }
            if (this.bars.o.dotsList) {
                this.dotTracker = new DotTracker(this.options, this.player, this.bars.o.dotsList)
            }
        });

        // update RegexesHolder when the player name changes
        this.player.on('player', ({name}) => {
            this.regexes = new RegexesHolder(this.options.ParserLanguage, name);
        });

        this.ee.on('battle/wipe', () => {
            this._onPartyWipe();
        });

        // 自己放的能力技
        this.player.on('action/you', (id, matches) => {
            this.buffTracker?.onUseAbility(id, matches);
        });
        this.player.on('action/party', (id, matches) => {
            this.buffTracker?.onUseAbility(id, matches)
        });

        // 获得的buff (自己)
        this.player.on( // 给自己添加的
            'effect/gain/you',
            (id, matches) => {
                this.buffTracker?.onYouGainEffect(id, matches);
                this.dotTracker?.onYouGainBuff(id, matches);
            },
        );
        this.player.on(
            'effect/lose/you',
            (id, matches) => {
                this.buffTracker?.onYouLoseEffect(id, matches);
                this.dotTracker?.onYouLoseBuff(id, matches);
            },
        );

        // 使用的技能
        this.player.on('effect/gain', (id, matches) => {
            // mob id starts with '4'
            if (matches.targetId?.startsWith('4'))
                this.dotTracker?.onYouGainEffect(id, matches);
        });
        this.player.on('effect/lose', (id, matches) => {
            // mob id starts with '4'
            if (matches.targetId?.startsWith('4'))
                this.dotTracker?.onYouLoseEffect(id, matches);
        });

        this.ee.on('zone/change', (id, _name) => {
            this.inPvPZone = isPvPZone(id);

            this.buffTracker?.clear();
            this.dotTracker?.clear();

            // Hide UI except HP and MP bar if change to pvp area.
            this.bars._updateUIVisibility(this.inPvPZone);
        });
    }

    private _onPartyWipe(): void {
        this.buffTracker?.clear();
        this.dotTracker?.clear();
        // Reset job-specific ui
        this.component?.reset();
    }
}
