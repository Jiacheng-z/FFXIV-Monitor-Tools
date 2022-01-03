import {defaultUserConfig} from "./buff_options";

import 'bootstrap/dist/css/bootstrap.min.css';
import {loadConfig, setConfig} from "./utils";

// 绑定事件
let btnDefault = document.getElementById("saveToDefault");
if (btnDefault) {
    btnDefault.addEventListener("click", function (){
        if (confirm("确定要还原设置?")) {
            setConfig(defaultUserConfig);
        }
        window.opener?.location?.reload();
        location.reload();
    })
}
let btnSave = document.getElementById("save");
if (btnSave) {
    btnSave.addEventListener("click",save);
}

// 初始化
const config = loadConfig();
(document.getElementById("scale") as HTMLInputElement).value = config.Scale.toString();
if (config.BigBuffNoticeTTSOn) {
    (document.getElementById("bigBuffNoticeTTSOn") as HTMLInputElement).checked = true;
}
if (config.DotNoticeTTSOn) {
    (document.getElementById("dotNoticeTTSOn") as HTMLInputElement).checked = true;
}
(document.getElementById("dotNoticeLessThanSecond") as HTMLInputElement).value = config.DotNoticeLessThanSecond.toString();
(document.getElementById("dotNoticeTTS") as HTMLInputElement).value = config.DotNoticeTTS;

function save() {
    let options = defaultUserConfig;
    const scale = Number((document.getElementById("scale") as HTMLInputElement).value);
    if (scale > 100) {
        options.Scale = scale
    }
    options.BigBuffNoticeTTSOn = (document.getElementById("bigBuffNoticeTTSOn") as HTMLInputElement).checked;
    options.DotNoticeTTSOn = (document.getElementById("dotNoticeTTSOn") as HTMLInputElement).checked;

    const dls = Number((document.getElementById("dotNoticeLessThanSecond") as HTMLInputElement).value);
    if (dls > 0) {
        options.DotNoticeLessThanSecond = dls
    }
    const dlt = (document.getElementById("dotNoticeTTS") as HTMLInputElement).value;
    if (dlt && dlt != '') {
        options.DotNoticeTTS = dlt
    }
    try {
        setConfig(options);
        alert("保存成功");
    } catch (e) {
        alert(e);
    }
    window.opener?.location?.reload();
    location.reload();
}

