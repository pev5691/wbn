/*
 * @project: WellBeingNetwork
 * @version: Development (beta)
 * @license: MIT (not for evil)
 * @copyright: Yuriy Ivanov (Vtools) 2017-2020 [progr76@gmail.com]
 * @copypaste: Evgeny Pustolenko (pev5691)  2019-2020 [pev5691@yandex.ru]
 * Web: https://www.facebook.com/pev5691
 * Telegram:  https://t.me/wellbeingnetwork
 */

'use strict';


function GetVoteArr()
{
    var Arr = [];
    for(var VN = 1; VN <= 10; VN++)
        for(var VoteHold = 10; VoteHold <= 10; VoteHold += 10)
        {
            var VoteForYes = Math.floor((VoteHold + 100 * VN) / (1 + VN) * 1) / 1;
            Arr.push({VN: - VN, VoteHold:VoteHold, A1:VoteForYes, A2:100 - VoteForYes});
        }
    
    return Arr;
}
var Arr = GetVoteArr();
console.table(Arr);
