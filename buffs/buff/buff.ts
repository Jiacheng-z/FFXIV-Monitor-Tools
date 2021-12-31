import UserConfig from "../cactbot/resources/user_config";
import defaultOptions from "./jobs_options";
import {JobsEventEmitter} from "./event_emitter";
import {Player} from "./player";
import PartyTracker from "../cactbot/resources/party";
import {Bars} from "./bars";
import {ComponentManager} from "./components";

import '../cactbot/resources/defaults.css';
import './buff.css';

UserConfig.getUserConfigLocation('buff', defaultOptions, () => {
    const options = { ...defaultOptions };

    // Because Chinese/Korean regions are still on older version of FF14,
    // set this value to whether or not we should treat this as 5.x or 6.x.
    // This affects things like entire jobs (smn) or combo durations.
    const is5x = ['cn', 'ko'].includes(options.ParserLanguage);

  const emitter = new JobsEventEmitter();
  const partyTracker = new PartyTracker();
  const player = new Player(emitter, partyTracker, is5x);
  const bars = new Bars(options, { emitter, player });

  new ComponentManager({ bars, emitter, options, partyTracker, player, is5x });
});