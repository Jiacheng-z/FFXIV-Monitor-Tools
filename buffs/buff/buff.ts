import UserConfig from "../cactbot/resources/user_config";
import defaultOptions from "../cactbot/ui/jobs/jobs_options";
import {JobsEventEmitter} from "../cactbot/ui/jobs/event_emitter";
import {Player} from "../cactbot/ui/jobs/player";
import PartyTracker from "../cactbot/resources/party";
import {Bars} from "../cactbot/ui/jobs/bars";
import {ComponentManager} from "../cactbot/ui/jobs/components";

UserConfig.getUserConfigLocation('jobs', defaultOptions, () => {
    const options = { ...defaultOptions };

    // Because Chinese/Korean regions are still on older version of FF14,
    // set this value to whether or not we should treat this as 5.x or 6.x.
    // This affects things like entire jobs (smn) or combo durations.
    const is5x = ['cn', 'ko'].includes(options.ParserLanguage);

    const emitter = new JobsEventEmitter();
    const player = new Player(emitter, is5x);
    const partyTracker = new PartyTracker();
    const bars = new Bars(options, { emitter, player });

    new ComponentManager({ bars, emitter, options, partyTracker, player, is5x });
});