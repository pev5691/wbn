/*
 * @project: TERA
 * @version: Development (beta)
 * @license: MIT (not for evil)
 * @copyright: Yuriy Ivanov (Vtools) 2017-2019 [progr76@gmail.com]
 * Web: https://terafoundation.org
 * Twitter: https://twitter.com/terafoundation
 * Telegram:  https://t.me/terafoundation
*/

global.JINN_MODULES.push({Init:Init, Name:"Log"});
function Init(Engine)
{
    Engine.ToLog = function (Str)
    {
        ToLog("" + Engine.ID + "." + Str);
    };
    Engine.ToLog1 = function (Str)
    {
        Engine.ToWarning(Str, 1);
    };
    Engine.ToLog2 = function (Str)
    {
        Engine.ToWarning(Str, 2);
    };
    Engine.ToLog3 = function (Str)
    {
        Engine.ToWarning(Str, 3);
    };
    Engine.ToLog4 = function (Str)
    {
        Engine.ToWarning(Str, 4);
    };
    Engine.ToLog5 = function (Str)
    {
        Engine.ToWarning(Str, 5);
    };
    Engine.ToWarning = function (Str,StartLevel)
    {
        if(global.JINN_WARNING >= StartLevel || Engine.ID === global.DEBUG_ID)
            Engine.ToLog(Str);
    };
    Engine.ToDebug = function (Str)
    {
        if(global.DEBUG_ID !== "ALL")
            if(Engine.ID !== global.DEBUG_ID)
                return ;
        Engine.ToLog(Str);
    };
    Engine.ToError = function (Child,Str)
    {
        Child.ErrCount++;
        Engine.ToLog("<-" + Child.ID + " ********ERROR: " + Str);
    };
}
if(!global.ToLogTrace)
    global.ToLogTrace = function (Str)
    {
        ToLog("" + Str + ":" + new Error().stack);
    };
