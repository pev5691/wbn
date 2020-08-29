/*
 * @project: TERA
 * @version: Development (beta)
 * @license: MIT (not for evil)
 * @copyright: Yuriy Ivanov (Vtools) 2017-2020 [progr76@gmail.com]
 * Web: https://terafoundation.org
 * Twitter: https://twitter.com/terafoundation
 * Telegram:  https://t.me/terafoundation
*/


global.RunOnUpdate = RunOnUpdate;
function RunOnUpdate()
{
    var fname = GetDataPath("DB/update.lst");
    var UpdateInfo = LoadParams(fname, {UPDATE_NUM_COMPLETE:2000, JINN_MODE_VER2:1});
    
    if(!UpdateInfo.UPDATE_NUM_COMPLETE)
    {
        UpdateInfo.UPDATE_NUM_COMPLETE = 0;
        UpdateInfo.JINN_MODE_VER2 = 1;
    }
    var CurNum = UpdateInfo.UPDATE_NUM_COMPLETE;
    if(CurNum !== UPDATE_CODE_VERSION_NUM)
    {
        UpdateInfo.UPDATE_NUM_COMPLETE = UPDATE_CODE_VERSION_NUM;
        
        ToLog("UPDATER Start from:" + CurNum);
        
        SaveParams(fname, UpdateInfo);
        
        if(global.JINN_MODE)
        {
        }
        else
            if(global.LOCAL_RUN)
            {
            }
            else
                if(global.TEST_NETWORK)
                {
                }
                else
                {
                }
        ToLog("UPDATER Finish");
    }
}

function CreateHeadersHash100()
{
    ToLog("CreateHeadersHash100");
    
    const DBRow = require("./db/db-row");
    global.UpdateMode = 1;
    var DB = SERVER.DBHeader100;
    var Num = 0;
    var PrevHash100 = [];
    while(1)
    {
        var Block = SERVER.ReadBlockHeaderDB(Num);
        if(!Block)
            break;
        
        var Hash100;
        if(Num === 0)
            Hash100 = [];
        else
            Hash100 = sha3arr2(PrevHash100, Block.Hash);
        
        DB.Write({Num:Num / 100, Hash100:Hash100, Hash:Block.Hash});
        
        if(Num % 1000000 === 0)
            ToLog("Create Hash100:" + Num);
        
        PrevHash100 = Hash100;
        Num += 100;
    }
    
    global.UpdateMode = 0;
}

function CheckRewriteTr(Num,StrHash,StartRewrite)
{
    if(SERVER.BlockNumDB < StartRewrite)
        return "NO";
    
    var AccountsHash = DApps.Accounts.GetHashOrUndefined(Num);
    if(!AccountsHash || GetHexFromArr(AccountsHash) !== StrHash)
    {
        ToLog("START REWRITE ERR ACTS TRANSACTIONS");
        SERVER.ReWriteDAppTransactions(SERVER.BlockNumDB - StartRewrite);
        return "Rewrite";
    }
    else
    {
        return "OK";
    }
}

function CheckRewriteAllTr2(Num,StrHash,Num2,StrHash2)
{
    if(global.LOCAL_RUN || global.TEST_NETWORK)
        return "NONE";
    
    var MaxNum = SERVER.GetMaxNumBlockDB();
    if(MaxNum < START_BLOCK_ACCOUNT_HASH)
        return "NONE";
    
    var AccountsHash = DApps.Accounts.GetHashOrUndefined(Num);
    var AccountsHash2 = DApps.Accounts.GetHashOrUndefined(Num2);
    
    if(AccountsHash2 && GetHexFromArr(AccountsHash2) === StrHash2)
        return "OK";
    
    if(AccountsHash && GetHexFromArr(AccountsHash) !== StrHash)
    {
        ToLog("***************** START REWRITE ALL DAPPS");
        
        global.UpdateMode = 1;
        for(var key in DApps)
        {
            DApps[key].ClearDataBase();
        }
        global.UpdateMode = 0;
        return "Rewrite";
    }
    else
    {
        return "OK";
    }
}

function CheckRewriteAllTr(Num,StrHash,Num2,StrHash2)
{
    if(global.LOCAL_RUN || global.TEST_NETWORK)
        return "NONE";
    
    var MaxNum = SERVER.GetMaxNumBlockDB();
    if(MaxNum < START_BLOCK_ACCOUNT_HASH)
        return "NONE";
    
    var AccountsHash = DApps.Accounts.GetHashOrUndefined(Num);
    if(AccountsHash && GetHexFromArr(AccountsHash) !== StrHash)
    {
        ToLog("***************** START REWRITE ALL DAPPS");
        
        global.UpdateMode = 1;
        for(var key in DApps)
        {
            DApps[key].ClearDataBase();
        }
        global.UpdateMode = 0;
        return "Rewrite";
    }
    else
    {
        return "OK";
    }
}

global.CheckRewriteTr = CheckRewriteTr;

function RecreateAccountRest1()
{
    var name = "accounts-rest";
    var fname = GetDataPath("DB/" + name);
    
    if(fs.existsSync(fname))
    {
        ToLog("Delete " + fname);
        fs.unlinkSync(fname);
    }
}

function RecreateAccountHashDB3()
{
    
    var name = "accounts-hash2";
    var fname = GetDataPath("DB/" + name);
    
    if(fs.existsSync(fname))
    {
        global.UpdateMode = 1;
        ToLog("Start updating " + name);
        const DBRow = require("../core/db/db-row");
        var DB0 = new DBRow(name, 6 + 32 + 32 + 10, "{BlockNum:uint, Hash:hash, SumHash:hash, Reserve: arr10}");
        var DB3 = DApps.Accounts.DBAccountsHash;
        for(var num = 0; true; num++)
        {
            var Item = DB0.Read(num);
            if(!Item)
                break;
            Item.AccHash = Item.Hash;
            DB3.Write(Item);
        }
        
        ToLog("Finish updating " + name);
        DB0.Close();
        DB3.Close();
        global.UpdateMode = 0;
        fs.unlinkSync(fname);
    }
}
function ReWriteDBSmartWrite()
{
    global.UpdateMode = 1;
    ToLog("Start ReWriteDBSmartWrite");
    require("../core/db/db-row");
    for(var num = 0; true; num++)
    {
        var Item = DApps.Smart.DBSmart.Read(num);
        if(!Item)
            break;
        var Body = BufLib.GetBufferFromObject(Item, DApps.Smart.FORMAT_ROW, 20000, {});
        if(Body.length > 15000)
            ToLog("Smart " + Item.Num + ". " + Item.Name + " length=" + Body.length);
        DApps.Smart.DBSmartWrite(Item);
    }
    
    ToLog("Finish ReWriteDBSmartWrite");
    DApps.Smart.DBSmart.Close();
    global.UpdateMode = 0;
}


function UpdateSumHash()
{
    function WriteBlockHeaderDB(Block,bPreSave)
    {
        var bBlockProcess;
        if(!bPreSave && Block.BlockNum > SERVER.BlockNumDBMin)
            bBlockProcess = 1;
        else
            bBlockProcess = 0;
        
        if(bBlockProcess)
        {
            if(USE_CHECK_SAVE_DB && Block.BlockNum >= SERVER.BlockNumDBMin + BLOCK_PROCESSING_LENGTH2)
                if(!SERVER.CheckSeqHashDB(Block, "WriteBlockHeaderDB"))
                    return false;
            
            var PrevBlock = SERVER.ReadBlockHeaderDB(Block.BlockNum - 1);
            if(!PrevBlock)
            {
                ToLogTrace("Cant write header block:" + Block.BlockNum + "  prev block not found");
                throw "ERR: PREV BLOCK NOT FOUND";
                return false;
            }
            Block.SumHash = shaarr2(PrevBlock.SumHash, Block.Hash);
            Block.SumPow = PrevBlock.SumPow + GetPowPower(Block.PowHash);
        }
        else
        {
            Block.SumHash = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            Block.SumPow = 0;
        }
        
        if(global.DB_VERSION === 2)
        {
            return SERVER.WriteBlockHeaderToFile2(Block);
        }
        
        Block.BlockNum = Math.trunc(Block.BlockNum);
        
        SERVER.TruncateBufMap(Block.BlockNum);
        return SERVER.DBHeader1.Write(Block);
    };
    
    if(SERVER.BlockNumDBMin > 0)
        return 2;
    
    var Block = SERVER.ReadBlockHeaderDB(15);
    if(!Block)
    {
        ToLog("############ Error ReadBlockHeaderDB = 16");
        return 0;
    }
    
    if(!IsZeroArr(Block.SumHash))
    {
        ToLog("############ Not need update");
        return 2;
    }
    
    ToLog("############ Start update");
    for(var num = 0; num <= 16; num++)
    {
        var Block = SERVER.ReadBlockHeaderDB(num);
        WriteBlockHeaderDB(Block);
        ToLog("ReWrite: " + Block.BlockNum);
    }
    
    var Block = SERVER.ReadBlockHeaderDB(16);
    if(GetHexFromArr(Block.SumHash) === "FA6CD33E61BEB5FA24B4D0C1E350C18D9F37350A91D14943AC205C5D506CFBA0")
        ToLog("############ Update OK");
    else
        ToLog("############ Update ERROR");
    
    return 1;
}
function GetJinEngine()
{
    
    var Map = {"Block":1, "BlockDB":1, "Log":1, };
    
    require("../jinn/wbn");
    var Engine = {};
    global.CreateNodeEngine(Engine, Map);
    require("../jinn/wbn/wbn-hash").Init(Engine);
    
    return Engine;
}


function LogTestJinn()
{
    var Engine = GetJinEngine();
    ToLog("TestJinn MaxNumBlockDB=" + Engine.GetMaxNumBlockDB());
    for(var Num = 420; Num < 430; Num++)
    {
        var Block = Engine.DB.ReadBlockMain(Num);
        if(!Block)
            return 0;
        
        ToLog("BlockNum=" + Num + " Hash=" + GetHexFromArr(Block.Hash) + " SumHash=" + GetHexFromArr(Block.SumHash) + " OldPrevHash8=" + GetHexFromArr(Block.OldPrevHash8),
        2);
    }
}

function TestBodyTree()
{
    var CountErr = 0;
    var BlockNum = 16;
    while(1)
    {
        var Block = Engine.DB.ReadBlockMain(BlockNum);
        if(!Block)
        {
            ToLog("Stop at Block=" + BlockNum);
            break;
        }
        
        if(!IsZeroArr(Block.TreeHash))
        {
            Engine.CheckLoadBody(Block);
            var TreeHash = Engine.CalcTreeHash(Block.BlockNum, Block.TxData);
            if(!IsEqArr(TreeHash, Block.TreeHash))
            {
                CountErr++;
                var Str = GetHexFromArr(Block.TreeHash) + " Need:" + GetHexFromArr(TreeHash);
                ToLog("" + CountErr + " ERROR TREE BLOCK=" + BlockNum + " Tree=" + Str);
                TreeHash = Engine.CalcTreeHash(Block.BlockNum, Block.TxData);
            }
        }
        
        BlockNum % 10000 === 0 && ToLog("Check: " + BlockNum);
        
        BlockNum++;
    }
    
    return CountErr;
}
