/*
 * @project: WellBeingNetwork
 * @version: Development (beta)
 * @license: MIT (not for evil)
 * @copyright: Yuriy Ivanov (Vtools) 2017-2020 [progr76@gmail.com]
 * @copypaste: Evgeny Pustolenko (pev5691)  2019-2020 [pev5691@yandex.ru]
 * Web: https://www.facebook.com/pev5691
 * Telegram:  https://t.me/wellbeingnetwork
 */

console.log("=FORK=");
// global.FORK_MODE = 1; //set to 1 for fork
global.MODE_RUN = "FORK";
global.NETWORK="WBN-MAIN"; //max 10 chars
global.START_NETWORK_DATE = 1598926000000; //formula of it value is (new Date(2019, 8, 20, 17, 0, 0, 0))-0;
// global.START_NETWORK_DATE=Date.now();
global.CONSENSUS_PERIOD_TIME = 3000; //ms

global.FORK_IP_LIST = [
//    {"ip":"185.26.121.248","port":50005},   // hostland
    {"ip":"194.67.221.153","port":34734},   // ihor totoha
//    {"ip":"188.227.85.27","port":50005},    // Server Space
    {"ip":"194.147.78.188","port":34734},    // Vdska 194.147.78.188
    {"ip":"127.0.0.1","port":37347}
    ];