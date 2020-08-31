/*
 * @project: WellBeingNetwork
 * @version: Development (beta)
 * @license: MIT (not for evil)
 * @copyright: Yuriy Ivanov (Vtools) 2017-2020 [progr76@gmail.com]
 * @copypaste: Evgeny Pustolenko (pev5691)  2019-2020 [pev5691@yandex.ru]
 * Web: https://www.facebook.com/pev5691
 * Telegram:  https://t.me/wellbeingnetwork
 */

const ipcRenderer = require('electron').ipcRenderer;

function GetDataElectron(Method,ObjPost,Func)
{
    
    if(Func === undefined)
    {
        Func = ObjPost;
        ObjPost = null;
    }
    
    var reply;
    try
    {
        reply = ipcRenderer.sendSync('GetData', {path:Method, obj:ObjPost});
    }
    catch(e)
    {
        reply = undefined;
    }
    if(Func)
        Func(reply);
}



window.GetData = GetDataElectron;
