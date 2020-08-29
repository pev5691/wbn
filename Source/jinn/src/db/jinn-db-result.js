/*
 * @project: WellBeingNetwork
 * @version: Development (beta)
 * @license: MIT (not for evil)
 * @copyright: Yuriy Ivanov (Vtools) 2017-2020 [progr76@gmail.com]
 * @copypaste: Evgeny Pustolenko (pev5691)  2019-2020 [pev5691@yandex.ru]
 * Web: https://www.facebook.com/pev5691
 * Telegram:  https://t.me/wellbeingnetwork
 */


"use strict";

var BWRITE_MODE_TX = (global.PROCESS_NAME === "TX");

const RESULT_FORMAT = {Arr:["uint"]};

class CDBResult
{
    constructor(EngineID)
    {
        this.EngineID = EngineID
        this.DBResultIndex = new CDBRow("result-index", {Position:"uint"}, !BWRITE_MODE_TX, "BlockNum", 10, EngineID)
        this.DBResultData = new CDBItem("result-data", RESULT_FORMAT, !BWRITE_MODE_TX, EngineID)
    }
    DoNode()
    {
    }
    
    Clear()
    {
        this.DBResultIndex.Truncate( - 1)
        this.DBResultData.Truncate(0)
    }
    
    WriteBodyResult(BlockNum, arrContentResult)
    {
        var Data = {Arr:arrContentResult};
        if(!this.DBResultData.Write(Data))
            return 0;
        this.DBResultIndex.Write({BlockNum:BlockNum, Position:Data.Position})
        return 1;
    }
    
    ReadBodyResult(BlockNum)
    {
        var Data = this.DBResultIndex.Read(BlockNum);
        if(!Data)
            return undefined;
        return this.DBResultData.Read(Data.Position);
    }
    
    CheckLoadResult(Block)
    {
        if(!Block.TxData || Block.VersionBody)
            return;
        var Data = this.ReadBodyResult(Block.BlockNum);
        if(Data && Data.Arr.length > 0)
        {
            Block.VersionBody = 1
            Block.arrContentResult = Data.Arr
        }
    }
    
    Close()
    {
        this.DBResultData.Close()
        this.DBResultIndex.Close()
    }
};

global.CDBResult = CDBResult;
