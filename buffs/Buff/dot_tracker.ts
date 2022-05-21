import {BuffOptions} from "./buff_options";
import {Player} from "./player";
import WidgetList from "./widget_list";
import {DotInfo, DotInfoList} from "./dot_info";
import {NetMatches} from "../cactbot/types/net_matches";
import { makeAuraDotTimerIcon } from "./utils";
import {callOverlayHandler} from "../cactbot/resources/overlay_plugin_api";

export interface Aura {
    addCallback: () => void;
    noticeCallback: () => void;
    removeCallback: () => void;

    addTimeout: number | null;
    noticeTimeout: number | null;
    removeTimeout: number | null;
}

export class Dot {
    name: string;
    info: DotInfo;
    options: BuffOptions;
    activeList: WidgetList;
    active: Aura | null;

    constructor(name: string, info: DotInfo, list: WidgetList, options: BuffOptions) {
        this.name = name;
        this.info = info;
        this.options = options;

        this.activeList = list;

        // tracked auras
        this.active = null;
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

        const aura: Aura = {
            removeCallback: () => {
                list.removeElement(key);
                if (aura.addTimeout) {
                    window.clearTimeout(aura.addTimeout);
                    aura.addTimeout = null;
                }
                if (aura.noticeTimeout) {
                    window.clearTimeout(aura.noticeTimeout);
                    aura.noticeTimeout = null;
                }
                if (aura.removeTimeout) {
                    window.clearTimeout(aura.removeTimeout);
                    aura.removeTimeout = null;
                }
            },
            noticeCallback: () => {
                callOverlayHandler({call: 'cactbotSay', text: this.options.DotNoticeTTS});
            },

            addCallback: () => {
                const elem = makeAuraDotTimerIcon(
                    key,
                    seconds,
                    opacity,
                    this.options.DotIconWidth,
                    this.options.DotIconHeight,
                    txt,
                    this.options.DotBarHeight,
                    0,
                    textColor,
                    this.options.DotBorderSize,
                    this.info.borderColor,
                    this.info.borderColor,
                    this.info.icon,
                    this.info
                );
                list.addElement(key, elem, Math.floor(seconds) + adjustSort);
                aura.addTimeout = null;

                if (seconds > 0) {
                    // 设置定时通知
                    if (
                        this.options.DotNoticeTTSOn && this.info.tts  &&
                        this.options.DotNoticeLessThanSecond > 0 &&
                        this.options.DotNoticeTTS !== ""
                    ) {
                        aura.noticeTimeout = window.setTimeout(() => {
                            aura.noticeCallback();
                        }, (Math.floor(seconds) - (this.options.DotNoticeLessThanSecond + 1)) * 1000);
                    }

                    // 设置定时取消
                    aura.removeTimeout = window.setTimeout(() => {
                        aura.removeCallback();
                        expireCallback?.();
                    }, seconds * 1000);
                }
            },
            removeTimeout: null,
            noticeTimeout: null,
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
}

export class DotTracker {
    dotInfo: { [s: string]: Omit<DotInfo, 'name'> };
    gainEffectMap: { [s: string]: DotInfo[] };
    loseEffectMap: { [s: string]: DotInfo[] };

    // targets: string[];
    dots: { [s: string]: Dot };

    constructor(
        private options: BuffOptions,
        private player: Player,
        private dotListDiv: WidgetList
    ) {
        this.options = options;
        this.player = player;
        this.dotListDiv = dotListDiv;

        // this.targets = [];
        this.dots = {};

        this.gainEffectMap = {};
        this.loseEffectMap = {};

        const propToMapMap = {
            gainEffect: this.gainEffectMap,
            loseEffect: this.loseEffectMap,
        } as const;

        this.dotInfo = DotInfoList.dotInfo;
        for (const [key, dotOmitName] of Object.entries(this.dotInfo)) {
            const dot = {
                ...dotOmitName,
                name: key,
            };

            switch (key) {
                case 'goringBlade':
                    dot.tts = this.options.TTSGoringBlade;
                    break;
                case 'surgingTempest':
                    dot.tts = this.options.TTSSurgingTempest;
                    break;
                case 'dia':
                    dot.tts = this.options.TTSDia;
                    break;
                case 'biolysis':
                    dot.tts = this.options.TTSBiolysis;
                    break;
                case 'combustIII':
                    dot.tts = this.options.TTSCombustIII;
                    break;
                case 'eukrasianDosisIii':
                    dot.tts = this.options.TTSEukrasianDosisIii;
                    break;
                case 'demolish':
                    dot.tts = this.options.TTSDemolish;
                    break;
                case 'chaoticSpring':
                    dot.tts = this.options.TTSChaoticSpring;
                    break;
                case 'higanbana':
                    dot.tts = this.options.TTSHiganbana;
                    break;
                case 'deathsDesign':
                    dot.tts = this.options.TTSDeathsDesign;
                    break;
                case 'stormbite':
                    dot.tts = this.options.TTSStormbite;
                    break;
                case 'thunderIII':
                    dot.tts = this.options.TTSThunderIii;
                    break;
                default:
                    break;
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
    }

    // 获得增伤自身buff
    onYouGainBuff(name: string, matches: Partial<NetMatches['GainsEffect']>): void {
        if (
            matches.sourceId?.toUpperCase() === this.player.idHex &&
            this.gainEffectMap[name] != null
        ) {
            this.onGainEffect(this.gainEffectMap[name], matches)
        }
    }

    onYouLoseBuff(name: string, matches: Partial<NetMatches['LosesEffect']>): void {
        if (
            matches.sourceId?.toUpperCase() === this.player.idHex &&
            this.loseEffectMap[name] != null
        ) {
            this.onLoseEffect(this.loseEffectMap[name], matches)
        }
    }

    onYouGainEffect(name: string, matches: Partial<NetMatches['GainsEffect']>): void {
        if (
            matches.targetId?.startsWith('4') &&
            matches.sourceId?.toUpperCase() === this.player.idHex &&
            this.gainEffectMap[name] != null
        ) {
            // this.targets.push(matches.targetId);
            this.onGainEffect(this.gainEffectMap[name], matches)
        }
    }

    onYouLoseEffect(name: string, matches: Partial<NetMatches['LosesEffect']>): void {
        if (
            matches.targetId?.startsWith('4') &&
            matches.sourceId?.toUpperCase() === this.player.idHex &&
            this.loseEffectMap[name] != null
        ) {
            // this.targets.splice(this.targets.indexOf(matches.targetId), 1);
            this.onLoseEffect(this.loseEffectMap[name], matches)
        }
    }

    onGainEffect(dots: DotInfo[] | undefined, matches: Partial<NetMatches['GainsEffect']>): void {
        if (!dots)
            return;
        for (const b of dots) {
            let seconds = parseFloat(matches?.duration ?? '0');
            if (b.name == 'surgingTempest') { // case: 可能由于buff的计算方式不同，战士的倒计时多2秒
                seconds += 2
            }
            this.onBigDot(matches?.targetId, b.name, seconds, b, matches?.source);
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

    onBigDot(
        target = 'unknown',
        name: string,
        seconds = 0,
        info: DotInfo,
        source = '',
    ): void {
        if (seconds <= 0)
            return;

        if (name != 'deathsDesign') { // 镰刀的dot可能会给boss上多个
            name = target + "=>" + name // 针对对boss技能. 保证不同boss分开倒计时.
        }

        let list = this.dotListDiv;
        let dot = this.dots[name];
        if (!dot)
            dot = this.dots[name] = new Dot(name, info, list, this.options);

        if (seconds > 0)
            dot.onGain(seconds);
    }

    onLoseBigBuff(target = 'unknown', name: string): void {
        name = target + "=>" + name // 针对对boss技能. 保证不同boss分开倒计时.
        this.dots[name]?.onLose();
    }

    clear(): void {
        // this.targets = [];
        Object.values(this.dots).forEach((dot) => dot.clear());
    }
}
