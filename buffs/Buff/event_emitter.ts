import EventEmitter from 'eventemitter3';

import logDefinitions from '../cactbot/resources/netlog_defs';
import { addOverlayListener } from '../cactbot/resources/overlay_plugin_api';
import ZoneInfo from '../cactbot/resources/zone_info';
import { EventResponses as OverlayEventResponses, Party } from '../cactbot/types/event';
import { NetFields } from '../cactbot/types/net_fields';
import { ToMatches } from '../cactbot/types/net_matches';

import { normalizeLogLine } from './utils';

export type PartialFieldMatches<Field extends keyof NetFields> = Partial<
  ToMatches<NetFields[Field]>
>;

export interface EventMap {
  'player': (data: OverlayEventResponses['onPlayerChangedEvent']) => void;
  // party changed
  'party': (party: Party[]) => void;
  // zone changing
  'zone/change': (id: number, name: string, info?: typeof ZoneInfo[number]) => void;
  // battle events
  'battle/in-combat': (info: { game: boolean; act: boolean }) => void;
  'battle/wipe': () => void;
  'battle/target': (target?: { name: string; distance: number; effectiveDistance: number }) => void;
  // triggered when effect gains or loses
  'effect/gain': (effectId: string, info: PartialFieldMatches<'GainsEffect'>) => void;
  'effect/lose': (effectId: string, info: PartialFieldMatches<'LosesEffect'>) => void;
  // triggered when dot or hot tick
  'tick/dot': (damage: number, info: PartialFieldMatches<'NetworkDoT'>) => void;
  'tick/hot': (heal: number, info: PartialFieldMatches<'NetworkDoT'>) => void;
  // triggered when any log line is printed
  'log': (line: string[], rawLine: string) => void;
  'log/game': (
    log: PartialFieldMatches<'GameLog'>,
    line: string[],
    rawLine: string,
  ) => void;
}

export class JobsEventEmitter extends EventEmitter<EventMap> {
  constructor() {
    super();
  }

  registerOverlayListeners(): void {
    addOverlayListener('onPlayerChangedEvent', (ev) => {
      this.emit('player', ev);
    });

    addOverlayListener('EnmityTargetData', (ev) => {
      // this.processEnmityTargetData(ev);
    });

    // addOverlayListener('onPartyWipe', () => {
    //   this.emit('battle/wipe');
    // });

    addOverlayListener('onInCombatChangedEvent', (ev) => {
      // this.emit('battle/in-combat', {
      //   game: ev.detail.inGameCombat,
      //   act: ev.detail.inACTCombat,
      // });
    });

    addOverlayListener('ChangeZone', (ev) => {
      this.emit('zone/change', ev.zoneID, ev.zoneName, ZoneInfo[ev.zoneID]);
    });

    addOverlayListener('LogLine', (ev) => {
      this.processLogLine(ev);
    });

    addOverlayListener('PartyChanged', (e) => {
      this.emit('party', e.party ?? []);
    });
  }

  public processLogLine(ev: OverlayEventResponses['LogLine']): void {
    const type = ev.line[logDefinitions.None.fields.type];

    this.emit('log', ev.line, ev.rawLine);

    switch (type) {
      case logDefinitions.GameLog.type:
        this.emit(
          'log/game',
          normalizeLogLine(ev.line, logDefinitions.GameLog.fields),
          ev.line,
          ev.rawLine,
        );
        break;
      case logDefinitions.GainsEffect.type: {
        const matches = normalizeLogLine(ev.line, logDefinitions.GainsEffect.fields);
        if (matches.effectId !== undefined)
          this.emit('effect/gain', matches.effectId, matches);
        break;
      }
      case logDefinitions.LosesEffect.type: {
        const matches = normalizeLogLine(ev.line, logDefinitions.LosesEffect.fields);
        if (matches.effectId !== undefined)
          this.emit('effect/lose', matches.effectId, matches);
        break;
      }
      case logDefinitions.NetworkDoT.type: {
        const matches = normalizeLogLine(ev.line, logDefinitions.NetworkDoT.fields);
        const damage = parseInt(matches.damage ?? '0', 16); // damage is in hex
        if (matches.which === 'DoT')
          this.emit('tick/dot', damage, matches);
        else if (matches.which === 'HoT')
          this.emit('tick/hot', damage, matches);
        break;
      }
      case logDefinitions.ActorControl.type: {
        const matches = normalizeLogLine(ev.line, logDefinitions.ActorControl.fields);
        if (matches.command === '40000010' || matches.command === '4000000F')
          this.emit('battle/wipe');
        break;
      }

      default:
        break;
    }
  }

  processEnmityTargetData({ Target: target }: OverlayEventResponses['EnmityTargetData']): void {
    if (target !== null) {
      this.emit('battle/target', {
        name: target.Name,
        distance: parseFloat(target.Distance),
        effectiveDistance: parseFloat(target.EffectiveDistance),
      });
    } else {
      this.emit('battle/target');
    }
  }
}