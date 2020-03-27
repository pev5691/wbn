/*
 * @project: JINN
 * @version: 1.0
 * @license: MIT (not for evil)
 * @copyright: Yuriy Ivanov (Vtools) 2019-2020 [progr76@gmail.com]
 * Telegram:  https://t.me/progr76
*/


'use strict';

'use strict';
global.JINN_MODULES.push({InitClass:InitClass, DoNode:DoNode, Name:"Stat"});

var StatKeys = {BlockTx:"BlockTx", TxSend:"Tx", TTSend:"Tt", HeaderLoad:"Head", BodyLoad:"Body", BodyTxSend:"BodyTx", ReadRowsDB:"Reads",
    WriteRowsDB:"Writes", TeraReadRowsDB:"-TReads", TeraWriteRowsDB:"-TWrites", LoadBody:"LoadB", LoadHeader:"LoadH", SaveBlock:"SaveH",
    SaveBody:"SaveB", MAXChainHeight:"Chains", MAXCacheBlockLength:"-CacheD", MAXCacheBodyLength:"CacheB", MAXCacheLength:"-Cache",
    CacheErrDB:"CacheErr", FindHeadCount:"-FHead", MAXFindHeadCount:"MFHead", FindEmptyCount:"-FEmpty", MAXFindEmptyCount:"MFEmpty",
    HotCount:"Hots", MINHots:"-MinHots", ActiveCount:"-Connects", AddrCount:"Addrs", NoValidateTx:0, AddToTreeTx:"-AddTreeTx",
    WasSendOnAddTxToTree:0, NotAddTxToTree:0, ErrorCount:"NetErr", MaxReq0:"-MaxReq0", MaxReq1:"-MaxReq1", MaxReq2:"-MaxReq2",
    MaxReq3:"-MaxReq3", MaxLoad:"-MaxLoad", MaxReqAll:"-MaxReqAll", MaxLoadAll:"-MaxLoadAll", MaxReqErr:"-MaxReqErr", WantHeader:"-WantHeader",
    UploadHeader:"-UploadHeader", MaxIteration:"-MaxIteration", ErrProcessBlock:"-ErrProcessBlock", };
if(typeof process === "object")
{
}

global.JINN_STAT = {};
JINN_STAT.Methods = {};
JINN_STAT.Keys = StatKeys;

JINN_STAT.Clear = function ()
{
    for(var key in StatKeys)
    {
        JINN_STAT[key] = 0;
    }
    
    JINN_STAT.AllTraffic = 0;
    JINN_STAT.MINHots =  - 1;
    
    JINN_STAT.Methods = {};
}
JINN_STAT.Clear();
global.GetJinnStatInfo = GetJinnStatInfo;
function GetJinnStatInfo(JinnStat)
{
    if(!JinnStat)
        JinnStat = JINN_STAT;
    
    var Traffic = (JinnStat.AllTraffic / 1024).toFixed(1);
    var Str = "Traffic:" + Traffic + " Kb";
    
    for(var key in StatKeys)
    {
        var Name = StatKeys[key];
        if(Name && Name.substr(0, 1) !== "-")
        {
            var StatNum = JinnStat[key];
            StatNum = Math.floor(StatNum);
            Str += "\n" + Name + ":" + StatNum;
        }
    }
    
    return Str;
}

//Engine context
function DoNode(Engine)
{
    if(Engine.Del)
        return ;
    if(Engine.ROOT_NODE)
        return ;
    
    var BlockNum = JINN_EXTERN.GetCurrentBlockNumByTime() - JINN_CONST.STEP_LAST;
    if(Engine.StatLastCurBlockNum === BlockNum)
        return ;
    Engine.StatLastCurBlockNum = BlockNum;
    
    JINN_STAT.ActiveCount += Engine.ConnectArray.length;
    if(Engine.GetBlockDB)
    {
        var Block = Engine.GetBlockDB(BlockNum);
        Engine.CheckLoadBody(Block);
        if(Block && Block.TxData)
        {
            JINN_STAT.BlockTx += Block.TxData.length;
        }
    }
    
    var CurHotCounts = 0;
    for(var n = 0; n < Engine.LevelArr.length; n++)
    {
        var Child = Engine.LevelArr[n];
        if(Child && Child.IsHot())
        {
            CurHotCounts++;
        }
    }
    JINN_STAT.HotCount += CurHotCounts;
    if(JINN_STAT.MINHots ===  - 1 || JINN_STAT.MINHots > CurHotCounts)
        JINN_STAT.MINHots = CurHotCounts;
    
    for(var l = 0; l < Engine.NodesArrByLevel.length; l++)
    {
        var LArr = Engine.NodesArrByLevel[l];
        if(LArr)
            JINN_STAT.AddrCount += LArr.length;
    }
}

function InitClass(Engine)
{
    Engine.AddMethodStatTime = function (Method,deltaTime,bIsStartTime)
    {
        if(bIsStartTime)
        {
            var Time = process.hrtime(deltaTime);
            deltaTime = Time[0] * 1000 + Time[1] / 1e6;
        }
        
        if(!JINN_STAT.Methods[Method])
            JINN_STAT.Methods[Method] = 0;
        JINN_STAT.Methods[Method] += deltaTime;
    };
}
