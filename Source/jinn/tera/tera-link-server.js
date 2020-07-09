/*
 * @project: JINN
 * @version: 1.0
 * @license: MIT (not for evil)
 * @copyright: Yuriy Ivanov (Vtools) 2019-2020 [progr76@gmail.com]
 * Telegram:  https://t.me/progr76
*/

'use strict';
module.exports.Init = Init;

function Init(Engine)
{
    
    global.SERVER = {};
    SERVER.CheckOnStartComplete = 1;
    SERVER.BlockNumDBMin = 0;
    Object.defineProperty(SERVER, "BlockNumDB", {set:function (x)
        {
        }, get:function (x)
        {
            return Engine.GetMaxNumBlockDB();
        }, });
    
    function GetBlockNumTx(arr)
    {
        var Delta_Time = 0;
        
        var BlockNum = GetCurrentBlockNumByTime(Delta_Time);
        if(arr[0] === TYPE_TRANSACTION_CREATE)
        {
            var BlockNum2 = Math.floor(BlockNum / 10) * 10;
            if(BlockNum2 < BlockNum)
                BlockNum2 = BlockNum2 + 10;
            BlockNum = BlockNum2;
        }
        
        return BlockNum;
    };
    
    SERVER.AddTransaction = function (Tx0)
    {
        if(!SERVER.GetHotNodesCount())
            return TX_RESULT_NOCONNECT;
        var Body = Tx0.body;
        var BlockNum = GetBlockNumTx(Body);
        var Tx = Engine.GetTx(Body, BlockNum, undefined, 6);
        
        if(JINN_CONST.TX_CHECK_OPERATION_ID)
        {
            Engine.CheckTxOperationID(Tx, BlockNum);
            if(Tx.ErrOperationID)
                return TX_RESULT_OPERATIOON_ID;
        }
        
        if(JINN_CONST.TX_CHECK_SIGN_ON_ADD)
        {
            Engine.CheckTxSign(Tx, BlockNum);
            if(Tx.ErrSign)
                return TX_RESULT_SIGN;
        }
        
        if(!Engine.IsValidateTx(Tx, "ERROR SERVER.AddTransaction", BlockNum))
            return TX_RESULT_BAD_TYPE;
        
        Tx0._TxID = GetStrTxIDFromHash(Tx.HASH, BlockNum);
        Tx0._BlockNum = BlockNum;
        
        var TxArr = [Tx];
        var CountSend = Engine.AddCurrentProcessingTx(BlockNum, TxArr);
        if(CountSend === 1)
            return 1;
        else
            return TX_RESULT_WAS_SEND;
    };
    
    SERVER.CheckCreateTransactionObject = function (Tr,SetTxID,BlockNum)
    {
        var Body = Tr.body;
        Tr.IsTx = 1;
        if(SetTxID)
            Tr.TxID = GetHexFromArr(GetTxID(BlockNum, Body));
        Tr.power = 0;
        Tr.TimePow = 0;
    };
    
    SERVER.ClearDataBase = function ()
    {
        
        if(global.TX_PROCESS && global.TX_PROCESS.RunRPC)
            global.TX_PROCESS.RunRPC("ClearDataBase", {});
        
        Engine.ClearDataBase();
    };
    
    SERVER.Close = function ()
    {
        Engine.Close();
    };
    
    SERVER.WriteBlockDB = function (Block)
    {
        Engine.ConvertFromTera(Block, 1);
        return Engine.SaveToDB(Block);
    };
    SERVER.WriteBlockHeaderDB = function (Block,bPreSave)
    {
        Engine.ConvertFromTera(Block);
        return Engine.SaveToDB(Block);
    };
    
    SERVER.ReadBlockDB = function (BlockNum)
    {
        var Block = Engine.GetBlockDB(BlockNum);
        Engine.ConvertToTera(Block, 1);
        return Block;
    };
    
    SERVER.CheckLoadBody = function (Block)
    {
        Engine.CheckLoadBody(Block);
        Engine.ConvertToTera(Block, 1);
    };
    
    SERVER.ReadBlockHeaderDB = function (BlockNum)
    {
        var Block = Engine.GetBlockHeaderDB(BlockNum);
        Engine.ConvertToTera(Block, 0);
        return Block;
    };
    SERVER.ReadBlockHeaderFromMapDB = SERVER.ReadBlockHeaderDB;
    
    SERVER.TruncateBlockDB = function (LastNum)
    {
        var Result = Engine.TruncateChain(LastNum);
        
        return Result;
    };
    
    SERVER.GetMaxNumBlockDB = function ()
    {
        return Engine.GetMaxNumBlockDB();
    };
    
    function ErrorAPICall()
    {
        ToLogTrace("Error API call");
        return 0;
    };
    
    function ErrorTODO()
    {
        ToLogTrace("TODO");
        return 0;
    };
    
    SERVER.WriteBlockDBFinaly = ErrorAPICall;
    SERVER.WriteBodyDB = ErrorAPICall;
    
    SERVER.WriteBodyResultDB = ErrorTODO;
    
    SERVER.CreateGenesisBlocks = function ()
    {
    };
    SERVER.CheckStartedBlocks = function ()
    {
        var CurNumTime = GetCurrentBlockNumByTime();
        if(SERVER.BlockNumDB > CurNumTime)
        {
            SERVER.TruncateBlockDB(CurNumTime);
        }
        var BlockNum = SERVER.CheckBlocksOnStartReverse(SERVER.BlockNumDB);
        BlockNum = BlockNum - 10000;
        if(BlockNum < 0)
            BlockNum = 0;
        ToLog("CheckStartedBlocks at " + BlockNum);
        BlockNum = SERVER.CheckBlocksOnStartFoward(BlockNum, 0);
        BlockNum = SERVER.CheckBlocksOnStartFoward(BlockNum - 100, 1);
        
        if(BlockNum < SERVER.BlockNumDB)
        {
            BlockNum--;
            ToLog("******************************** SET NEW BlockNumDB = " + BlockNum + "/" + SERVER.BlockNumDB);
            if(global.DEV_MODE)
                throw "STOP AND EXIT!";
            
            SERVER.TruncateBlockDB(BlockNum);
        }
        global.glStartStat = 1;
    };
    
    SERVER.GetLinkHash = ErrorAPICall;
    SERVER.GetLinkHashDB = ErrorAPICall;
    
    SERVER.RewriteAllTransactions = function ()
    {
        if(global.TX_PROCESS.Worker)
        {
            if(global.TX_PROCESS && global.TX_PROCESS.RunRPC)
            {
                global.TX_PROCESS.RunRPC("RewriteAllTransactions", {});
                return 1;
            }
        }
        return 0;
    };
    SERVER.GetRows = function (start,count,Filter,bMinerName)
    {
        if(Filter)
        {
            Filter = Filter.trim();
            Filter = Filter.toUpperCase();
        }
        
        var MaxAccount = DApps.Accounts.GetMaxAccount();
        var WasError = 0;
        var arr = [];
        
        for(var num = start; true; num++)
        {
            var Block = SERVER.ReadBlockHeaderDB(num);
            if(!Block)
                break;
            
            Block.Num = Block.BlockNum;
            if(Block.AddrHash)
            {
                Block.Miner = ReadUintFromArr(Block.AddrHash, 0);
                if(Block.BlockNum < 16 || (Block.Miner > MaxAccount && Block.BlockNum < global.UPDATE_CODE_5))
                    Block.Miner = 0;
                if(bMinerName)
                {
                    Block.MinerName = "";
                    
                    if(Block.BlockNum >= global.UPDATE_CODE_5 && Block.Miner >= 1e9)
                    {
                        var CurMiner = DApps.Accounts.GetIDByAMID(Block.Miner);
                        if(CurMiner)
                            Block.Miner = CurMiner;
                    }
                    
                    if(Block.Miner)
                    {
                        var Item = DApps.Accounts.ReadState(Block.Miner);
                        if(Item && Item.Name && typeof Item.Name === "string")
                            Block.MinerName = Item.Name.substr(0, 8);
                    }
                }
                
                var Value = GetHashFromSeqAddr(Block.SeqHash, Block.AddrHash, Block.BlockNum, Block.PrevHash);
                Block.Hash1 = Value.Hash1;
                Block.Hash2 = Value.Hash2;
            }
            
            if(Filter)
            {
                var Num = Block.BlockNum;
                var Count = Block.TrDataLen;
                var Pow = Block.Power;
                var Miner = Block.Miner;
                var Date = DateFromBlock(Block.BlockNum);
                try
                {
                    if(!eval(Filter))
                        continue;
                }
                catch(e)
                {
                    if(!WasError)
                        ToLog(e);
                    WasError = 1;
                }
            }
            
            arr.push(Block);
            count--;
            if(count < 1)
                break;
        }
        return arr;
    };
    
    SERVER.GetTrRows = function (BlockNum,start,count)
    {
        var arr = [];
        var Block = SERVER.ReadBlockDB(BlockNum);
        
        if(Block && Block.arrContent)
            for(var num = start; num < start + count; num++)
            {
                if(num < 0)
                    continue;
                if(num >= Block.arrContent.length)
                    break;
                
                var Tr = {body:Block.arrContent[num]};
                SERVER.CheckCreateTransactionObject(Tr, 1, BlockNum);
                
                Tr.Num = num;
                Tr.Type = Tr.body[0];
                Tr.Length = Tr.body.length;
                Tr.Body = [];
                for(var j = 0; j < Tr.body.length; j++)
                    Tr.Body[j] = Tr.body[j];
                
                var App = DAppByType[Tr.Type];
                if(App)
                {
                    Tr.Script = App.GetScriptTransaction(Tr.body);
                    
                    if(BlockNum >= SERVER.BlockNumDBMin)
                        Tr.Verify = App.GetVerifyTransaction(Block, BlockNum, Tr.Num, Tr.body);
                    else
                        Tr.Verify = 0;
                    
                    if(Tr.Verify >= 1)
                    {
                        Tr.VerifyHTML = "<B style='color:green'>✔</B>";
                        if(Tr.Verify > 1)
                        {
                            Tr.VerifyHTML += "(" + Tr.Verify + ")";
                        }
                    }
                    else
                        if(Tr.Verify ==  - 1)
                            Tr.VerifyHTML = "<B style='color:red'>✘</B>";
                        else
                            Tr.VerifyHTML = "";
                }
                else
                {
                    Tr.Script = "";
                    Tr.VerifyHTML = "";
                }
                
                arr.push(Tr);
            }
        return arr;
    };
    SERVER.ClearStat = function ()
    {
        var MAX_ARR_PERIOD = MAX_STAT_PERIOD * 2 + 10;
        
        SERVER.StatMap = {StartPos:0, StartBlockNum:0, Length:0, "ArrPower":new Float64Array(MAX_ARR_PERIOD), "ArrPowerMy":new Float64Array(MAX_ARR_PERIOD),
        };
    };
    SERVER.TruncateStat = function (LastBlockNum)
    {
        if(SERVER.StatMap)
        {
            var LastNumStat = SERVER.StatMap.StartBlockNum + SERVER.StatMap.Length;
            var Delta = LastNumStat - LastBlockNum;
            if(Delta > 0)
            {
                SERVER.StatMap.Length -= Delta;
                if(SERVER.StatMap.Length < 0)
                    SERVER.StatMap.Length = 0;
            }
            SERVER.StatMap.CaclBlockNum = 0;
        }
    };
    
    SERVER.GetStatBlockchainPeriod = function (Param)
    {
        var StartNum = Param.BlockNum;
        if(!Param.Count || Param.Count < 0)
            Param.Count = 1000;
        if(!Param.Miner)
            Param.Miner = 0;
        
        var Map = {};
        var ArrList = new Array(Param.Count);
        var i = 0;
        for(var num = StartNum; num < StartNum + Param.Count; num++)
        {
            var Power = 0, PowerMy = 0, Nonce = 0;
            if(num <= SERVER.BlockNumDB)
            {
                var Block = SERVER.ReadBlockHeaderDB(num);
                if(Block)
                {
                    Power = GetPowPower(Block.PowHash);
                    var Miner = ReadUintFromArr(Block.AddrHash, 0);
                    var Nonce = ReadUintFromArr(Block.AddrHash, 6);
                    if(Param.Miner < 0)
                    {
                        PowerMy = Power;
                    }
                    else
                        if(Miner === Param.Miner)
                        {
                            PowerMy = Power;
                        }
                }
            }
            
            ArrList[i] = PowerMy;
            
            i++;
        }
        var AvgValue = 0;
        for(var j = 0; j < ArrList.length; j++)
        {
            if(ArrList[j])
                AvgValue += ArrList[j];
        }
        if(ArrList.length > 0)
            AvgValue = AvgValue / ArrList.length;
        
        const MaxSizeArr = 1000;
        var StepTime = 1;
        while(ArrList.length >= MaxSizeArr)
        {
            if(Param.bNonce)
                ArrList = ResizeArrMax(ArrList);
            else
                ArrList = ResizeArrAvg(ArrList);
            StepTime = StepTime * 2;
        }
        
        return {ArrList:ArrList, AvgValue:AvgValue, steptime:StepTime};
    };
    
    SERVER.GetStatBlockchain = function (name,MinLength)
    {
        
        if(!MinLength)
            return [];
        
        var MAX_ARR_PERIOD = MAX_STAT_PERIOD * 2 + 10;
        
        if(!SERVER.StatMap)
        {
            SERVER.ClearStat();
        }
        
        var MaxNumBlockDB = SERVER.GetMaxNumBlockDB();
        
        if(SERVER.StatMap.CaclBlockNum !== MaxNumBlockDB || SERVER.StatMap.CalcMinLength !== MinLength)
        {
            SERVER.StatMap.CaclBlockNum = MaxNumBlockDB;
            SERVER.StatMap.CalcMinLength = MinLength;
            var start = MaxNumBlockDB - MinLength + 1;
            var finish = MaxNumBlockDB + 1;
            
            var StartPos = SERVER.StatMap.StartPos;
            var ArrPower = SERVER.StatMap.ArrPower;
            var ArrPowerMy = SERVER.StatMap.ArrPowerMy;
            var StartNumStat = SERVER.StatMap.StartBlockNum;
            var FinishNumStat = SERVER.StatMap.StartBlockNum + SERVER.StatMap.Length - 1;
            
            var CountReadDB = 0;
            var arr = new Array(MinLength);
            var arrmy = new Array(MinLength);
            for(var num = start; num < finish; num++)
            {
                var i = num - start;
                var i2 = (StartPos + i) % MAX_ARR_PERIOD;
                if(num >= StartNumStat && num <= FinishNumStat && (num < finish - 10))
                {
                    arr[i] = ArrPower[i2];
                    arrmy[i] = ArrPowerMy[i2];
                }
                else
                {
                    CountReadDB++;
                    var Power = 0, PowerMy = 0;
                    if(num <= MaxNumBlockDB)
                    {
                        var Block = SERVER.ReadBlockHeaderDB(num);
                        if(Block)
                        {
                            Power = GetPowPower(Block.PowHash);
                            var Miner = ReadUintFromArr(Block.AddrHash, 0);
                            if(Miner === GENERATE_BLOCK_ACCOUNT)
                            {
                                PowerMy = Power;
                            }
                        }
                    }
                    arr[i] = Power;
                    arrmy[i] = PowerMy;
                    
                    ArrPower[i2] = arr[i];
                    ArrPowerMy[i2] = arrmy[i];
                    
                    if(num > FinishNumStat)
                    {
                        SERVER.StatMap.StartBlockNum = num - SERVER.StatMap.Length;
                        SERVER.StatMap.Length++;
                        if(SERVER.StatMap.Length > MAX_ARR_PERIOD)
                        {
                            SERVER.StatMap.Length = MAX_ARR_PERIOD;
                            SERVER.StatMap.StartBlockNum++;
                            SERVER.StatMap.StartPos++;
                        }
                    }
                }
            }
            
            SERVER.StatMap["POWER_BLOCKCHAIN"] = arr;
            SERVER.StatMap["POWER_MY_WIN"] = arrmy;
        }
        
        var arr = SERVER.StatMap[name];
        if(!arr)
            arr = [];
        var arrT = SERVER.StatMap["POWER_BLOCKCHAIN"];
        for(var i = 0; i < arrT.length; i++)
            if(!arrT[i])
            {
                SERVER.StatMap = undefined;
                break;
            }
        
        return arr;
    };
    
    SERVER.FindStartBlockNum = function ()
    {
        SERVER.ReadStateTX();
        
        var BlockNum = SERVER.GetMaxNumBlockDB();
        if(global.NO_CHECK_BLOCKNUM_ONSTART)
        {
            SERVER.BlockNumDB = SERVER.CheckBlocksOnStartFoward(BlockNum - 2, 0);
            ToLog("START_BLOCK_NUM:" + SERVER.BlockNumDB, 2);
            return;
        }
        BlockNum = SERVER.CheckBlocksOnStartReverse(BlockNum);
        SERVER.BlockNumDB = SERVER.CheckBlocksOnStartFoward(BlockNum - 2000, 0);
        SERVER.BlockNumDB = SERVER.CheckBlocksOnStartFoward(SERVER.BlockNumDB - 100, 1);
        if(SERVER.BlockNumDB >= BLOCK_PROCESSING_LENGTH2)
        {
            SERVER.TruncateBlockDB(SERVER.BlockNumDB);
        }
        
        ToLog("START_BLOCK_NUM : " + SERVER.BlockNumDB, 2);
        SERVER.CheckOnStartComplete = 1;
    };
    SERVER.CheckBlocksOnStartReverse = function (StartNum)
    {
        var delta = 1;
        var Count = 0;
        var PrevBlock;
        for(var num = StartNum; num >= SERVER.BlockNumDBMin + BLOCK_PROCESSING_LENGTH2; num -= delta)
        {
            var Block = SERVER.ReadBlockHeaderDB(num);
            if(!Block || IsZeroArr(Block.SumHash))
            {
                delta++;
                Count = 0;
                continue;
            }
            var PrevBlock = SERVER.ReadBlockHeaderDB(num - 1);
            if(!PrevBlock || IsZeroArr(PrevBlock.SumHash))
            {
                Count = 0;
                continue;
            }
            
            var SumHash = CalcSumHash(PrevBlock.SumHash, Block.Hash, Block.BlockNum, Block.SumPow);
            if(CompareArr(SumHash, Block.SumHash) === 0)
            {
                delta = 1;
                Count++;
                if(Count > COUNT_BLOCKS_FOR_LOAD / 10)
                    return num;
            }
            else
            {
                delta++;
                Count = 0;
            }
        }
        return 0;
    };
    
    SERVER.CheckBlocksOnStartFoward = function (StartNum,bCheckBody)
    {
        var PrevBlock;
        if(StartNum < SERVER.BlockNumDBMin + BLOCK_PROCESSING_LENGTH2 - 1)
            StartNum = SERVER.BlockNumDBMin + BLOCK_PROCESSING_LENGTH2 - 1;
        var MaxNum = SERVER.GetMaxNumBlockDB();
        var BlockNumTime = GetCurrentBlockNumByTime();
        if(BlockNumTime < MaxNum)
            MaxNum = BlockNumTime;
        
        var arr = [];
        for(var num = StartNum; num <= MaxNum; num++)
        {
            
            var Block;
            if(bCheckBody)
                Block = SERVER.ReadBlockDB(num);
            else
                Block = SERVER.ReadBlockHeaderDB(num);
            if(!Block)
                return num > 0 ? num - 1 : 0;
            if(num % 100000 === 0)
                ToLog("CheckBlocksOnStartFoward: " + num);
            
            if(bCheckBody)
            {
                var TreeHash;
                if(!global.JINN_MODE)
                {
                    TreeHash = CalcTreeHashFromArrBody(Block.BlockNum, Block.arrContent);
                }
                else
                {
                    
                    TreeHash = Engine.CalcTreeHash(Block.BlockNum, Block.TxData);
                }
                if(CompareArr(Block.TreeHash, TreeHash) !== 0)
                {
                    ToLog("BAD TreeHash block=" + Block.BlockNum);
                    return num > 0 ? num - 1 : 0;
                }
            }
            
            if(PrevBlock)
            {
                var PrevHash;
                if(Block.BlockNum < global.UPDATE_CODE_JINN)
                {
                    if(arr.length !== BLOCK_PROCESSING_LENGTH)
                    {
                        var start = num - BLOCK_PROCESSING_LENGTH2;
                        for(var n = 0; n < BLOCK_PROCESSING_LENGTH; n++)
                        {
                            var Prev = SERVER.ReadBlockHeaderDB(start + n);
                            arr.push(Prev.Hash);
                        }
                    }
                    else
                    {
                        arr.shift();
                        var Prev = SERVER.ReadBlockHeaderDB(num - BLOCK_PROCESSING_LENGTH - 1);
                        arr.push(Prev.Hash);
                    }
                    
                    PrevHash = CalcLinkHashFromArray(arr, Block.BlockNum);
                }
                else
                {
                    PrevHash = Block.PrevHash;
                }
                var SeqHash = GetSeqHash(Block.BlockNum, PrevHash, Block.TreeHash, PrevBlock.SumPow);
                
                var Value = GetHashFromSeqAddr(SeqHash, Block.AddrHash, Block.BlockNum, PrevHash);
                
                if(CompareArr(Value.Hash, Block.Hash) !== 0)
                {
                    ToLog("=================== FIND ERR Hash in " + Block.BlockNum + "  bCheckBody=" + bCheckBody);
                    return num > 0 ? num - 1 : 0;
                }
                var SumHash = CalcSumHash(PrevBlock.SumHash, Block.Hash, Block.BlockNum, Block.SumPow);
                if(CompareArr(SumHash, Block.SumHash) !== 0)
                {
                    ToLog("=================== FIND ERR SumHash in " + Block.BlockNum);
                    return num > 0 ? num - 1 : 0;
                }
            }
            PrevBlock = Block;
        }
        return num > 0 ? num - 1 : 0;
    };
    SERVER.BlockDeleteTX = function (Block)
    {
        SERVER.BufHashTree.LastAddNum = 0;
        
        for(var key in DApps)
        {
            DApps[key].OnDeleteBlock(Block);
        }
    };
    SERVER.GetHashGenesis = function (Num)
    {
        return [Num + 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, Num + 1];
    };
    
    SERVER.GenesisBlockHeaderDB = function (Num)
    {
        if(Num < 0)
            return undefined;
        
        var Block = {BlockNum:Num, TreeHash:[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0], AddrHash:DEVELOP_PUB_KEY0, Hash:SERVER.GetHashGenesis(Num), PowHash:SERVER.GetHashGenesis(Num), PrevHash:[0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], SeqHash:[0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], PrevSumHash:[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], SumHash:[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], Comment1:"GENESIS", Comment2:"", TrCount:0, TrDataPos:0, TrDataLen:0, };
        
        Block.SeqHash = GetSeqHash(Block.BlockNum, Block.PrevHash, Block.TreeHash);
        
        Block.SumPow = 0;
        Block.bSave = true;
        
        return Block;
    };
    SERVER.BlockChainToBuf = function (WriteNum,StartNum,EndBlockNum)
    {
        
        var Arr = [];
        for(var num = StartNum; num <= EndBlockNum; num++)
        {
            var Block = SERVER.ReadBlockHeaderDB(num);
            if(!Block)
                break;
            Arr.push(Block);
        }
        
        var ArrBuf = GetBufferFromBlockArr(Arr);
        return ArrBuf;
    };
    
    SERVER.ResetNextPingAllNode = function ()
    {
    };
}