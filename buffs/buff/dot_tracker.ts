import EventEmitter from "eventemitter3";
import {BuffOptions} from "./buff_options";
import {Player} from "./player";
import WidgetList from "./widget_list";
import {JobsEventEmitter} from "./event_emitter";
import {DotInfo, DotInfoList} from "./dot_info";
import {NetMatches} from "../cactbot/types/net_matches";
import {buffsCalculation, findCountBuff, updateCountBuff} from "./utils";
import Util from "../cactbot/resources/util";


export class DotTracker extends EventEmitter<{ tick: (targetId?: string) => void }, DotTracker> {
    options: BuffOptions;
    ee: JobsEventEmitter;
    player: Player;
    dotListDiv: WidgetList;

    dotInfo: { [s: string]: Omit<DotInfo, 'name'> };
    trackedDoTs: string[];
    gainEffectMap: { [s: string]: DotInfo[] };
    loseEffectMap: { [s: string]: DotInfo[] };

    targets: string[];

    constructor(o: {
        options: BuffOptions;
        emitter: JobsEventEmitter;
        player: Player;
        dotListDiv: WidgetList,
    }) {
        super();

        this.options = o.options;
        this.ee = o.emitter;
        this.player = o.player;
        this.dotListDiv = o.dotListDiv;
        this.targets = [];

        this.gainEffectMap = {};
        this.loseEffectMap = {};

        const propToMapMap = {
            gainEffect: this.gainEffectMap,
            loseEffect: this.loseEffectMap,
        } as const;

        this.trackedDoTs = [];
        this.dotInfo = DotInfoList.dotInfo;
        for (const [key, dotOmitName] of Object.entries(this.dotInfo)) {
            const dot = {
                ...dotOmitName,
                name: key,
            };

            for (const id in dotOmitName.gainEffect) {
                this.trackedDoTs.push(id)
            }

            for (const propStr in propToMapMap) {
                const prop = propStr as keyof typeof propToMapMap;

                if (!(prop in dot))
                    continue;
                const key = dot[prop];
                if (typeof key === 'undefined') {
                    console.error('undefined value for key ' + prop + ' for buff ' + dot.name);
                    continue;
                }

                const map = propToMapMap[prop];
                if (Array.isArray(key)) {
                    key.forEach((k) => map[k] = [dot, ...map[k] ?? []]);
                } else {
                    map[key] ??= [];
                    map[key]?.push(dot);
                }
            }
        }

        this.registerListeners();
    }

    private registerListeners(): void {
        this.player.on('effect/gain', (id, matches) => {
            if (
                matches.targetId?.startsWith('4') &&
                matches.sourceId?.toUpperCase() === this.player.idHex &&
                this.trackedDoTs.includes(id)
            ) {
                this.targets.push(matches.targetId);
                this.onGainEffect(this.gainEffectMap[id], matches)
            }
        });

        this.player.on('effect/lose', (id, matches) => {
            if (
                matches.targetId?.startsWith('4') &&
                matches.sourceId?.toUpperCase() === this.player.idHex &&
                this.trackedDoTs.includes(id)
            ) {
                this.targets.splice(this.targets.indexOf(matches.targetId), 1);
                this.onLoseEffect(this.loseEffectMap[id], matches)
            }
        });

        // reset on job change or zone change or out of combat
        this.player.on('job', () => this.reset());
        this.ee.on('zone/change', () => this.reset());
        this.ee.on('battle/in-combat', ({ game }) => {
            if (game === false)
                this.reset();
        });
    }

    reset(): void {
        this.targets = [];
    }

    onGainEffect(dots: DotInfo[] | undefined, matches: Partial<NetMatches['GainsEffect']>): void {
        if (!dots)
            return;
        for (const b of dots) {
            let seconds = parseFloat(matches?.duration ?? '0');
            this.onBigBuff(matches?.targetId, b.name, seconds, b, matches?.source, 'active');
        }
    }

    onLoseEffect(
        dots: DotInfo[] | undefined,
        matches: Partial<NetMatches['LosesEffect']>,
    ): void {
        if (!dots)
            return;
        for (const b of dots)
            this.onLoseBigBuff(matches?.targetId, b.name);
    }
}
