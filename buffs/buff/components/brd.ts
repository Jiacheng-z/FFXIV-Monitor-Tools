import EffectId from '../../cactbot/resources/effect_id';
import {DotTracker, PartialFieldMatches} from '../event_emitter';

import { BaseComponent, ComponentInterface } from './base';

export class BRDComponent extends BaseComponent {
  repertoireTracker5x: DotTracker;

  ethosStacks = 0;

  constructor(o: ComponentInterface) {
    super(o);

    this.repertoireTracker5x = new DotTracker({ emitter: this.emitter, player: this.player });
    this.repertoireTracker5x.onTick([
        EffectId.Stormbite,
        EffectId.Windbite,
        EffectId.CausticBite,
        EffectId.VenomousBite,
    ], (targetId)=> {

    });

    this.reset();
  }

  override onMobGainsEffectFromYou(id: string, matches: PartialFieldMatches<'GainsEffect'>): void {
      console.log('onMobGainsEffectFromYou',id, matches.sourceId,matches.targetId)
  }

  override onMobLosesEffectFromYou(id: string, matches: PartialFieldMatches<'LosesEffect'>): void {
      console.log('onMobLosesEffectFromYou', id, matches.sourceId,matches.targetId)
  }

  override reset(): void {
    this.ethosStacks = 0;
  }
}
