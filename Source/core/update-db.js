/*
 * @project: WellBeingNetwork
 * @version: Development (beta)
 * @license: MIT (not for evil)
 * @copyright: Yuriy Ivanov (Vtools) 2017-2020 [progr76@gmail.com]
 * @copypaste: Evgeny Pustolenko (pev5691)  2019-2020 [pev5691@yandex.ru]
 * Web: https://www.facebook.com/pev5691
 * Telegram:  https://t.me/wellbeingnetwork
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
        UpdateInfo.JINN_MODE_VER2 = 1;
        
        ToLog("---------- UPDATER Start from:" + CurNum);
        
        SaveParams(fname, UpdateInfo);
        
        if(global.NETWORK === "MAIN-JINN")
        {
            if(CurNum < 2304)
            {
                if(!IsValidAccHash(64382000, "9D37B1CA6A998734F1B65A1DA737AEFB5182D05291502C6A484618992184F3E6", 0))
                {
                    if(IsValidAccHash(64300000, "C80D6EE465BF54E69647D94B852ED896B611E1027ABF9AE57D08DD0698EEDD68", 1))
                    {
                        SendRewrteTx(64300000);
                    }
                    else
                        if(IsValidAccHash(64200000, "04157B03A87F282055B6779C327B241776C1CDAAB3E0A1593B7B943661979D78", 1))
                        {
                            SendRewrteTx(64200000);
                        }
                        else
                            if(IsValidAccHash(64100000, "F587B8F9DE5FCF8221CC35125A86D29ED1A65DCE40D1DD20F302129C2A3F5853", 1))
                            {
                                SendRewrteTx(64100000);
                            }
                            else
                            {
                                SendRewrteAllTx();
                            }
                }
            }
        }
        
        if(global.NETWORK === "TEST-JINN")
        {
            if(CurNum < 2360)
            {
                
                if(!IsValidAccHash(1138800, "DC55EC6EF12B8AEF08BDA66B66DCBB26A07C2F48D12BAFA519B9AAEDD723AB61", 0))
                {
                    SendRewrteAllTx();
                }
            }
        }
        ToLog("UPDATER Finish");
    }
}

function SendRewrteAllTx()
{
    setTimeout(function ()
    {
        ToLog("---------- UPD: START RewriteAllTransactions");
        SERVER.RewriteAllTransactions();
    }, 30 * 1000);
}

function SendRewrteTx(StartNum)
{
    setTimeout(function ()
    {
        ToLog("---------- UPD: START RewrteTx from: " + StartNum);
        if(global.TX_PROCESS && global.TX_PROCESS.RunRPC)
            global.TX_PROCESS.RunRPC("ReWriteDAppTransactions", {StartNum:StartNum});
    }, 30 * 1000);
}

function IsValidAccHash(BlockNum,StrHash,bMust)
{
    var AccountsHash = DApps.Accounts.GetHashOrUndefined(BlockNum);
    if(!AccountsHash)
    {
        if(bMust)
            return 0;
        else
            return 1;
    }
    
    if(GetHexFromArr(AccountsHash) === StrHash)
        return 1;
    else
        return 0;
}



global.CheckSumHashInActs = function ()
{
    if(CheckActDB("DBActPrev"))
        CheckActDB("DBAct");
}

function CheckActDB(Name)
{
    var DBAct = DApps.Accounts[Name];
    
    var Num = 0;
    while(1)
    {
        var Item = DBAct.Read(Num);
        if(!Item)
            return 1;
        
        if(Item.Mode === 200)
        {
            Item.HashData = DApps.Accounts.GetActHashesFromBuffer(Item.PrevValue.Data);
            if(Item)
            {
                var Block = SERVER.ReadBlockHeaderDB(Item.BlockNum);
                if(!Block || !IsEqArr(Block.SumHash, Item.HashData.SumHash))
                {
                    ToLog("---------Error SumHash on BlockNum=" + Item.BlockNum);
                    SendRewrteTx(Item.BlockNum);
                    
                    return 0;
                }
            }
        }
        
        Num++;
        Num % 100000 === 0 && ToLog(Name + ": Check " + Num);
    }
}
