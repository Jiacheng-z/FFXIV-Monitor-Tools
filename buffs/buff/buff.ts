import UserConfig from "../cactbot/resources/user_config";
import defaultOptions from "./buff_options";
import {JobsEventEmitter} from "./event_emitter";
import {Player} from "./player";
import PartyTracker from "../cactbot/resources/party";
import {Bars} from "./bars";
import {ComponentManager} from "./components";

import '../cactbot/resources/defaults.css';
import './buff.css';

let emit: JobsEventEmitter;
// let play: Player;

UserConfig.getUserConfigLocation('buff', defaultOptions, () => {
    const options = {...defaultOptions};

    // Because Chinese/Korean regions are still on older version of FF14,
    // set this value to whether or not we should treat this as 5.x or 6.x.
    // This affects things like entire jobs (smn) or combo durations.
    // const is5x = ['cn', 'ko'].includes(options.ParserLanguage);
    const is5x = ['ko'].includes(options.ParserLanguage);

    const emitter = new JobsEventEmitter();
    const partyTracker = new PartyTracker();
    const player = new Player(emitter, partyTracker, is5x);
    const bars = new Bars(options, {emitter, player});

    emit = emitter
    // play = player

    new ComponentManager({bars, emitter, options, partyTracker, player, is5x});

    let menuDiv = document.getElementById("menu");
    if (!menuDiv) {
        menuDiv = document.createElement('div');
        menuDiv.id = "menu";
        // Set element display to none in case the page has not included defaults.css.
        menuDiv.style.display = 'none';

        let btn = document.createElement("button")
        btn.id = "test"
        btn.innerHTML = "测试"
        btn.addEventListener("click", function () {
            Test()
        })
        menuDiv.append(btn)
        document.body.append(menuDiv);
    }
});

function Test() {
    if (emit == null) {
        return
    }
    let send = function (num: number, line: string) {
        setTimeout(() => {
            emit.processLogLine({type: 'LogLine', line: line.split('|'), rawLine: line})
        }, num * 1000);
    }

    send(1, '26|2020-09-20T03:48:12.5040000+08:00|7d|猛者强击|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|00|111340|111340||7f5d92a566794a793b65f97686f3699f');
    send(2, '26|2020-09-20T22:44:12.4840000+08:00|8d|战斗之声|20.00|103E4CCF|伊黛亚·李|1039A1D9|水貂桑|00|76590|111340||f655b2f774c6675d7991b1e5180462d2');
    send(3, '21|2022-01-01T20:08:48.2230000+08:00|1039A1D9|水貂桑|1D0C|连环计|4000031F|木人|F60E|4C50000|0|0|0|0|0|0|0|0|0|0|0|0|0|0|7400000|7400000|0|10000|0|1000|-603.1267|-762.9036|25.02|2.283125|111672|111672|10000|10000|0|1000|-608.7234|-772.6032|25|0.4959636|000124F8|0|9b3bbc4918c6d5a21210d038c804ff93');
    send(4, '26|2022-01-01T20:15:20.7690000+08:00|756|占卜|15.00|1039A1D9|水貂桑|1039A1D9|水貂桑|00|109926|109926||30db3dbc4ebad59de05e89825e46d69b');
    send(5, '26|2022-01-01T20:15:20.7690000+08:00|A9C|宏图|15.00|1039A1D9|水貂桑|1039A1D9|水貂桑|00|109926|109926||30db3dbc4ebad59de05e89825e46d69b');
    send(6, '26|2022-01-01T20:53:08.2050000+08:00|4a1|义结金兰：攻击|15.00|1039A1D9|水貂桑|1039A1D9|水貂桑|00|135119|135119||bc8a82a5f86070b6bc9f7779c3b3dc44');
    send(8, '21|2022-01-01T21:05:39.9490000+08:00|1039A1D9|水貂桑|8D2|攻其不备|4000031F|木人|1E710103|6F5B0000|5050E|27E0000|0|0|0|0|0|0|0|0|0|0|0|0|7400000|7400000|0|10000|0|1000|-603.1267|-762.9036|25.02|2.283125|101284|101284|10000|10000|0|1000|-604.7668|-761.4396|25|2.377449|00012569|0|f3ed8ae8ed410d18480c8edddb9ef49d');

    // send(8, '26|2020-09-20T22:04:03.9440000+08:00|511|鼓励|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|05|52289|52289||140096ff8fe52cfc344ee31759a6b422');
    // send(10, '26|2020-09-20T22:04:07.9110000+08:00|511|鼓励|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|04|52289|52289||369bee40aab7cfa72bc77aacd0165e89');
    // send(12, '26|2020-09-20T22:04:07.9110000+08:00|511|鼓励|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|03|52289|52289||369bee40aab7cfa72bc77aacd0165e89');
    // send(14, '26|2020-09-20T22:04:07.9110000+08:00|511|鼓励|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|02|52289|52289||369bee40aab7cfa72bc77aacd0165e89');
    // send(16, '26|2020-09-20T22:04:07.9110000+08:00|511|鼓励|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|01|52289|52289||369bee40aab7cfa72bc77aacd0165e89');
    // send(18, '30|2020-09-20T22:04:24.0480000+08:00|511|鼓励|0.00|1039A1D9|水貂桑|1039A1D9|水貂桑|01|76590|52289||91727e97f2e91e3b4823830ea6a35adb');
}

// document.querySelector("#settings").addEventListener("click", function () {
//     window.open("xxx.html", "_blank", "width=800,height-800")
// })

