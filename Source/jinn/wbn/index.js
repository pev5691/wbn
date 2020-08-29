/*
 * @project: WellBeingNetwork
 * @version: Development (beta)
 * @license: MIT (not for evil)
 * @copyright: Yuriy Ivanov (Vtools) 2017-2020 [progr76@gmail.com]
 * @copypaste: Evgeny Pustolenko (pev5691)  2019-2020 [pev5691@yandex.ru]
 * Web: https://www.facebook.com/pev5691
 * Telegram:  https://t.me/wellbeingnetwork
 */

/**
 *
 * Adaptation of the JINN library with the WBN blockchain
 *
 **/

'use strict';

global.Init_DB_HEADER_FORMAT = function (Obj)
{
    if(!global.UPDATE_CODE_JINN)
        return;
    Obj.OldPrevHash8 = "hash";
}


global.CDBFile = require("../../core/db/db-file");
require("../src");




global.JINN_WARNING = 3;



JINN_CONST.LINK_HASH_PREV_HASHSUM = JINN_CONST.BLOCK_GENESIS_COUNT;

JINN_CONST.BLOCK_PROCESSING_LENGTH = global.BLOCK_PROCESSING_LENGTH;

JINN_CONST.CONSENSUS_PERIOD_TIME = CONSENSUS_PERIOD_TIME;
JINN_CONST.START_CHECK_BLOCKNUM = 50;


JINN_CONST.SHARD_NAME = "WBN";
JINN_CONST.NETWORK_NAME = global.NETWORK;

JINN_CONST.MAX_PACKET_SIZE = 1200000;
JINN_CONST.MAX_PACKET_SIZE_RET_DATA = Math.floor(JINN_CONST.MAX_PACKET_SIZE / 2);



JINN_CONST.BLOCK_GENESIS_COUNT = global.BLOCK_GENESIS_COUNT;
JINN_CONST.DELTA_BLOCKS_FOR_LOAD_ONLY = JINN_CONST.BLOCK_GENESIS_COUNT + 10;


JINN_CONST.MAX_ITEMS_FOR_LOAD = 500;

JINN_CONST.MAX_BLOCK_SIZE = 300000;
JINN_CONST.MAX_DEPTH_FOR_SECONDARY_CHAIN = 100;

JINN_EXTERN.GetCurrentBlockNumByTime = global.GetCurrentBlockNumByTime;

module.exports.Create = Create;

function GetEngine(MapName)
{
    var Engine = {};
    
    Engine.CanRunStat = !MapName;
    Engine.UseExtraSlot = 0;
    
    Engine.ip = global.JINN_IP;
    Engine.port = global.JINN_PORT;
    Engine.ID = Engine.port % 1000;
    if(!Engine.ID)
        Engine.ID = 1;
    
    Engine.DirectIP = 0;
    
    if(Engine.ip === "0.0.0.0")
        Engine.IDArr = GetRandomBytes(32);
    else
        Engine.IDArr = CalcIDArr(Engine.ip, Engine.port);
    
    Engine.IDStr = GetHexFromArr(Engine.IDArr);
    
    Engine.Header1 = 0;
    global.CreateNodeEngine(Engine, MapName);
    if(Engine.SetOwnIP)
    {
        Engine.SetOwnIP(Engine.ip);
    }
    
    require("./wbn-encrypt").Init(Engine);
    
    require("./wbn-hash").Init(Engine);
    
    require("./wbn-link-server").Init(Engine);
    require("./wbn-link-process-tx").Init(Engine);
    require("./wbn-link").Init(Engine);
    require("./wbn-link-code").Init(Engine);
    
    require("./wbn-net-constant").Init(Engine);
    require("./wbn-code-updater").Init(Engine);
    
    require("./wbn-mining").Init(Engine);
    require("./wbn-stat").Init(Engine);
    
    require("./wbn-tests").Init(Engine);
    
    require("./wbn-addr").Init(Engine);
    
    return Engine;
}

function Create(MapName)
{
    ToLog("JINN Starting...");
    if(global.LOCAL_RUN)
    {
        JINN_CONST.UNIQUE_IP_MODE = 0;
        
        global.DELTA_CURRENT_TIME = 0;
        JINN_CONST.MIN_COUNT_FOR_CORRECT_TIME = 10;
        JINN_CONST.CORRECT_TIME_VALUE = 50;
        JINN_CONST.CORRECT_TIME_TRIGGER = 5;
        
        JINN_CONST.MAX_LEVEL_CONNECTION = 3;
        JINN_CONST.EXTRA_SLOTS_COUNT = 0;
    }
    
    var Engine = GetEngine(MapName);
    
    ON_USE_CONST();
    
    if(Engine.AddNodeAddr)
    {
        const SYSTEM_SCORE = 5000000;
        if(global.NETWORK === "MAIN-JINN")
        {
            Engine.AddNodeAddr({ip:"vdska.wellbeing.su", port:30000, Score:SYSTEM_SCORE, System:1});
            Engine.AddNodeAddr({ip:"totoha.wellbeing.su", port:30000, Score:SYSTEM_SCORE, System:1});
        }
        else
            if(global.NETWORK === "TEST-JINN")
            {
                Engine.AddNodeAddr({ip:"149.154.70.158", port:33000, Score:SYSTEM_SCORE, System:1});
                Engine.AddNodeAddr({ip:"212.80.217.95", port:33006, Score:SYSTEM_SCORE, System:1});
                Engine.AddNodeAddr({ip:"212.80.217.187", port:33007, Score:SYSTEM_SCORE, System:1});
                Engine.AddNodeAddr({ip:"36.104.146.7", port:33000, System:1});
            }
            else
                if(global.NETWORK === "LOCAL-JINN")
                {
                    Engine.AddNodeAddr({ip:"127.0.0.1", port:50001, Score:SYSTEM_SCORE, System:1});
                }
        
        Engine.LoadAddrOnStart();
    }
    
    global.Engine = Engine;
    
    StartRun();
}

const PERIOD_FOR_RUN = 100;

function StartRun()
{
    SERVER.UpdateAllDB();
    SERVER.NodeSyncStatus = {Header1:Engine.Header1, Header2:Engine.Header2, Block1:Engine.Block1, Block2:Engine.Block2, };
    
    if(Engine.CanRunStat)
        Engine.OnStatSecond();
    
    NextRunEngine(Engine);
    Engine.DoNodeAddr();
    
    var CurTimeNum =  + GetCurrentTime();
    var StartTimeNum = Math.floor((CurTimeNum + PERIOD_FOR_RUN) / PERIOD_FOR_RUN) * PERIOD_FOR_RUN;
    var DeltaForStart = StartTimeNum - CurTimeNum;
    if(DeltaForStart < PERIOD_FOR_RUN / 10)
        DeltaForStart += PERIOD_FOR_RUN;
    
    setTimeout(StartRun, DeltaForStart);
}
