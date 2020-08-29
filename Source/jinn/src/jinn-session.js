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
global.JINN_MODULES.push({InitClass:InitClass, Name:"Session"});

//Engine context

function InitClass(Engine)
{
    Engine.InitTransferSession = function (BlockNum)
    {
        var Arr = [];
        for(var i = 0; i < Engine.LevelArr.length; i++)
        {
            var Child = Engine.LevelArr[i];
            if(Child && Child.IsHotReady())
            {
                Arr.push({Child:Child, CountForSend:0, TXSend:0, TxReceive:0});
            }
        }
        
        Engine.TransferList.AddItemToCache({BlockNum:BlockNum, Arr:Arr});
    };
    
    Engine.TransferList = new CBlockCache(function (a,b)
    {
        return a.BlockNum - b.BlockNum;
    });
    
    Engine.GetTransferSession = function (BlockNum)
    {
        var Item = Engine.TransferList.FindItemInCache({BlockNum:BlockNum});
        if(Item)
            return Item.Arr;
        else
            return [];
    };
    
    Engine.FindTransferSessionByChild = function (Child,BlockNum)
    {
        var Arr = Engine.GetTransferSession(BlockNum);
        for(var i = 0; i < Arr.length; i++)
        {
            var ItemChild = Arr[i];
            if(ItemChild.Child === Child)
                return ItemChild;
        }
        return undefined;
    };
}
