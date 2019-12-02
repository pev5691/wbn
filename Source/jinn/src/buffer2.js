/*
 * @project: TERA
 * @version: Development (beta)
 * @license: MIT (not for evil)
 * @copyright: Yuriy Ivanov (Vtools) 2017-2019 [progr76@gmail.com]
 * Web: https://terafoundation.org
 * Twitter: https://twitter.com/terafoundation
 * Telegram:  https://t.me/terafoundation
*/

global.BufLib2 = {};
var exports = global.BufLib2;
exports.Write = Write;
exports.Read = Read;
exports.GetObjectFromBuffer = GetObjectFromBuffer;
exports.GetBufferFromObject = GetBufferFromObject;
exports.GetFormatFromObject = GetFormatFromObject;
var glError = 1;
function Write(buf,data,StringFormat,ParamValue,WorkStruct)
{
    if(typeof StringFormat === "number")
    {
        ToLogTrace("ERRR StringFormat ");
        throw "ERR!!";
    }
    else
    {
        var format = StringFormat;
        if(format.substr(0, 6) === "buffer" && format.length > 6)
        {
            ParamValue = parseInt(format.substr(6));
            format = "buffer";
        }
        else
            if(format.substr(0, 3) === "arr" && format.length > 3)
            {
                ParamValue = parseInt(format.substr(3));
                format = "arr";
            }
            else
                if(format.substr(0, 3) === "str" && format.length > 3)
                {
                    var length = parseInt(format.substr(3));
                    WriteStr(buf, data, length);
                    return ;
                }
        switch(format)
        {
            case "str":
                {
                    WriteStr(buf, data);
                    break;
                }
            case "byte":
                {
                    WriteByte(buf, data);
                    break;
                }
            case "uint":
                {
                    if(data < 0)
                        data = 0;
                    if(data >= 281474976710655)
                        data = 0;
                    WriteUint(buf, data);
                    break;
                }
            case "uint16":
                {
                    if(data < 0)
                        data = 0;
                    WriteUint16(buf, data);
                    break;
                }
            case "uint32":
                {
                    if(!data || data < 0)
                        data = 0;
                    data = data >>> 0;
                    WriteUint32(buf, data);
                    break;
                }
            case "time":
                {
                    var Time = data.valueOf();
                    WriteUint(buf, Time);
                    break;
                }
            case "zhash":
                ZCheck:
                {
                    for(var i = 0; data && i < 32; i++)
                    {
                        if(data[i] !== 0)
                            break ZCheck;
                    }
                    WriteByte(buf, 0);
                    break;
                }
                WriteByte(buf, 1);
                WriteArr(buf, data, 32);
                break;
            case "addres":
            case "hash":
                {
                    WriteArr(buf, data, 32);
                    break;
                }
            case "buffer":
                {
                    var length;
                    if(!data)
                        length = 0;
                    else
                        if(ParamValue === undefined)
                            length = data.length;
                        else
                            length = Math.min(ParamValue, data.length);
                    WriteArr(buf, data, length);
                    break;
                }
            case "arr":
                {
                    var length;
                    if(data)
                        length = Math.min(ParamValue, data.length);
                    else
                        length = 0;
                    WriteArr(buf, data, length);
                    break;
                }
            case "tr":
                {
                    var length;
                    if(data)
                        length = data.length;
                    else
                        data = 0;
                    if(length > 65535)
                        length = 65535;
                    WriteUint16(buf, length);
                    WriteArr(buf, data, length);
                    break;
                }
            case "data":
                {
                    var length;
                    if(data)
                        length = data.length;
                    else
                        data = 0;
                    WriteUint32(buf, length);
                    WriteArr(buf, data, length);
                    break;
                }
            case "hashSTR":
                {
                    var Str = GetHexFromArr(data);
                    WriteStr(buf, Str, 64);
                    break;
                }
            case "uintSTR":
                {
                    var Str = data.toString();
                    WriteStr(buf, Str, 10);
                    break;
                }
            default:
                {
                    WorkStruct = WorkStruct || {};
                    var CurFormat = StringFormat.substr(0, 1);
                    if(CurFormat === "[")
                    {
                        var length;
                        if(data)
                            length = data.length;
                        var formatNext = GetMiddleString(format);
                        WriteUint32(buf, length);
                        for(var i = 0; i < length; i++)
                        {
                            Write(buf, data[i], formatNext, undefined, WorkStruct);
                        }
                    }
                    else
                        if(CurFormat === "<")
                        {
                            var length;
                            if(data)
                                length = data.length;
                            var formatNext = GetMiddleString(format);
                            var IndexCount = 0;
                            var IndexCountPos = buf.length;
                            buf.length = buf.length + 4;
                            for(var i = 0; i < length; i++)
                            {
                                if(data[i])
                                {
                                    IndexCount++;
                                    WriteUint32(buf, i);
                                    Write(buf, data[i], formatNext, undefined, WorkStruct);
                                }
                            }
                            WriteUint32AtPos(buf, IndexCount, IndexCountPos);
                        }
                        else
                            if(CurFormat === "{")
                            {
                                var attrs = WorkStruct[format];
                                if(!attrs)
                                {
                                    attrs = GetAttributes(GetMiddleString(format));
                                    WorkStruct[format] = attrs;
                                }
                                for(var i = 0; i < attrs.length; i++)
                                {
                                    var type = attrs[i];
                                    Write(buf, data[type.Key], type.Value, undefined, WorkStruct);
                                }
                            }
                            else
                            {
                                throw "Bad write type params: " + format;
                            }
                }
        }
    }
}
function Read(buf,StringFormat,ParamValue,WorkStruct,bDisableTime)
{
    var ret;
    if(typeof StringFormat === "number")
    {
        ToLogTrace("ERR StringFormat");
        throw "ERRR!";
    }
    else
    {
        var format = StringFormat;
        if(format.substr(0, 6) === "buffer")
        {
            if(format.length > 6)
            {
                ParamValue = parseInt(format.substr(6));
                format = "buffer";
            }
            else
            {
                ParamValue = 0;
            }
        }
        else
            if(format.substr(0, 3) === "arr")
            {
                if(format.length > 3)
                {
                    ParamValue = parseInt(format.substr(3));
                    format = "arr";
                }
                else
                {
                    ParamValue = 0;
                }
            }
            else
                if(format.substr(0, 3) === "str")
                {
                    if(format.length > 3)
                    {
                        var length = parseInt(format.substr(3));
                        ret = ReadStrConstL(buf, length);
                        return ret;
                    }
                    else
                    {
                        ParamValue = 0;
                    }
                }
        switch(format)
        {
            case "str":
                {
                    ret = ReadStr(buf);
                    break;
                }
            case "byte":
                {
                    ret = ReadByte(buf);
                    break;
                }
            case "uint":
                {
                    ret = ReadUintFromArr(buf);
                    break;
                }
            case "uint16":
                {
                    ret = ReadUint16FromArr(buf);
                    break;
                }
            case "uint32":
                {
                    ret = ReadUint32FromArr(buf);
                    break;
                }
            case "time":
                {
                    if(bDisableTime)
                        throw "Bad read type params: time - DisableTime ON";
                    ret = ReadUintFromArr(buf);
                    ret = new Date(ret);
                    break;
                }
            case "zhash":
                {
                    if(ReadByte(buf))
                        ret = ReadArr(buf, 32);
                    else
                        ret = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    break;
                }
            case "addres":
            case "hash":
                {
                    ret = ReadArr(buf, 32);
                    break;
                }
            case "buffer":
            case "arr":
                {
                    if(buf.len + ParamValue <= buf.length)
                        ret = buf.slice(buf.len, buf.len + ParamValue);
                    else
                    {
                        ret = [];
                        for(var i = 0; i < ParamValue; i++)
                            ret[i] = 0;
                    }
                    buf.len += ParamValue;
                    break;
                }
            case "tr":
                {
                    if(buf.len + 1 >= buf.length)
                    {
                        ret = undefined;
                        break;
                    }
                    var length = buf[buf.len] + buf[buf.len + 1] * 256;
                    buf.len += 2;
                    ret = buf.slice(buf.len, buf.len + length);
                    buf.len += length;
                    break;
                }
            case "data":
                {
                    var length = ReadUint32FromArr(buf);
                    if(length > buf.length - buf.len)
                        length = 0;
                    ret = ReadArr(buf, length);
                    break;
                }
            case "hashSTR":
                {
                    var Str = ReadStrConstL(buf, 64);
                    ret = GetArrFromHex(Str);
                    break;
                }
            case "uintSTR":
                {
                    var Str = ReadStrConstL(buf, 10);
                    ret = parseInt(Str);
                    break;
                }
            default:
                {
                    WorkStruct = WorkStruct || {};
                    var LStr = format.substr(0, 1);
                    if(LStr === "[" || LStr === "<")
                    {
                        var bIndexArr = (LStr === "<");
                        ret = [];
                        var formatNext = GetMiddleString(format);
                        var length = Read(buf, "uint32");
                        for(var i = 0; i < length; i++)
                        {
                            if(buf.len <= buf.length)
                            {
                                if(bIndexArr)
                                {
                                    var index = Read(buf, "uint32");
                                    ret[index] = Read(buf, formatNext, undefined, WorkStruct, bDisableTime);
                                }
                                else
                                {
                                    ret[i] = Read(buf, formatNext, undefined, WorkStruct, bDisableTime);
                                }
                            }
                            else
                                break;
                        }
                    }
                    else
                        if(LStr === "{")
                        {
                            var attrs = WorkStruct[format];
                            if(!attrs)
                            {
                                attrs = GetAttributes(GetMiddleString(format));
                                WorkStruct[format] = attrs;
                            }
                            ret = {};
                            for(var i = 0; i < attrs.length; i++)
                            {
                                var type = attrs[i];
                                ret[type.Key] = Read(buf, type.Value, undefined, WorkStruct, bDisableTime);
                            }
                        }
                        else
                        {
                            throw "Bad read type params: " + format;
                        }
                }
        }
    }
    return ret;
}
function GetObjectFromBuffer(buffer,format,WorkStruct,bDisableTime)
{
    var Arr = buffer;
    Arr.len = 0;
    if(typeof format === "object")
    {
        if(!WorkStruct.FromObject)
            WorkStruct.FromObject = GetFormatFromObject(format);
        format = WorkStruct.FromObject;
    }
    var Data = Read(Arr, format, undefined, WorkStruct, bDisableTime);
    if(glError && Arr.len !== Arr.length)
    {
        ToLog("**********Find error size on format: " + format + " " + Arr.len + "/" + Arr.length);
    }
    return Data;
}
function GetBufferFromObject(data,format,aaaaa,WorkStruct)
{
    if(typeof format === "object")
    {
        if(!WorkStruct.FromObject)
            WorkStruct.FromObject = GetFormatFromObject(format);
        format = WorkStruct.FromObject;
    }
    var Arr = [];
    Arr.len = 0;
    Write(Arr, data, format, undefined, WorkStruct);
    return Arr;
}
function GetFormatFromObject(Obj)
{
    var Str = "{";
    var Type = typeof Obj;
    LType:
    switch(Type)
    {
        case "object":
            var bFirst = 1;
            for(var key in Obj)
            {
                if(!bFirst)
                    Str += ",";
                else
                {
                    if(key === "0")
                    {
                        Str = "[" + GetFormatFromObject(Obj[0]) + "]";
                        break LType;
                    }
                    Str = "{";
                    bFirst = 0;
                }
                Str += key + ":" + GetFormatFromObject(Obj[key]);
            }
            Str += "}";
            break;
        case "array":
            {
                if(Obj.length === 0)
                    throw "Error format array length";
                Str = "[" + GetFormatFromObject(Obj[0]) + "]";
                break;
            }
        case "string":
            Str = Obj;
            break;
    }
    return Str;
}
function GetMiddleString(Str)
{
    return Str.substr(1, Str.length - 2);
}
function GetMiddleString2(Str,FromStr,ToStr)
{
    var Count = 0;
    var Result = "";
    for(var i = 0; i < Str.length; i++)
    {
        var FStr = Str.substr(i, 1);
        if(FStr === " " || FStr === "\n")
        {
            continue;
        }
        if(FStr === FromStr)
        {
            Count++;
            if(Count === 1)
                continue;
        }
        if(FStr === ToStr)
        {
            Count--;
            if(Count === 0)
                break;
        }
        if(Count)
            Result = Result + FStr;
    }
    return Result;
}
function GetAttributeStrings(Str)
{
    var Count = 0;
    var Result = [];
    var Element = "";
    for(var i = 0; i < Str.length; i++)
    {
        var FStr = Str.substr(i, 1);
        if(FStr === "{")
        {
            Count++;
        }
        else
            if(FStr === "}")
            {
                Count--;
            }
            else
                if(FStr === "," && Count === 0)
                {
                    if(Element.length > 0)
                        Result.push(Element);
                    Element = "";
                    continue;
                }
                else
                    if(FStr === " " || FStr === "\n")
                        continue;
        Element = Element + FStr;
    }
    if(Element.length > 0)
        Result.push(Element);
    return Result;
}
function GetKeyValueStrings(Str)
{
    var Key = "";
    for(var i = 0; i < Str.length; i++)
    {
        var FStr = Str.substr(i, 1);
        if(FStr === " " || FStr === "\n")
        {
            continue;
        }
        if(FStr === ":")
        {
            var Value = Str.substr(i + 1);
            return {Key:Key, Value:Value};
        }
        Key = Key + FStr;
    }
    throw "Error format Key:Value = " + Str;
}
function GetAttributes(Str)
{
    var arr = [];
    var attrstr = GetAttributeStrings(Str);
    for(var i = 0; i < attrstr.length; i++)
    {
        var type = GetKeyValueStrings(attrstr[i]);
        arr.push(type);
    }
    return arr;
}
function toUTF8Array(str)
{
    var utf8 = [];
    for(var i = 0; i < str.length; i++)
    {
        var charcode = str.charCodeAt(i);
        if(charcode < 0x80)
            utf8.push(charcode);
        else
            if(charcode < 0x800)
            {
                utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
            }
            else
                if(charcode < 0xd800 || charcode >= 0xe000)
                {
                    utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
                }
                else
                {
                    i++;
                    charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
                    utf8.push(0xf0 | (charcode >> 18), 0x80 | ((charcode >> 12) & 0x3f), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
                }
    }
    return utf8;
}
function Utf8ArrayToStr(array)
{
    var out, i, len, c;
    var char2, char3;
    out = "";
    len = array.length;
    i = 0;
    while(i < len)
    {
        c = array[i++];
        switch(c >> 4)
        {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                out += String.fromCharCode(c);
                break;
            case 12:
            case 13:
                char2 = array[i++];
                out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                break;
            case 14:
                char2 = array[i++];
                char3 = array[i++];
                out += String.fromCharCode(((c & 0x0F) << 12) | ((char2 & 0x3F) << 6) | ((char3 & 0x3F) << 0));
                break;
        }
    }
    for(var i = 0; i < out.length; i++)
    {
        if(out.charCodeAt(i) === 0)
        {
            out = out.substr(0, i);
            break;
        }
    }
    return out;
}
function GetArr32FromStr(Str)
{
    return GetArrFromStr(Str, 32);
}
function GetArrFromStr(Str,Len)
{
    var arr = toUTF8Array(Str);
    for(var i = arr.length; i < Len; i++)
    {
        arr[i] = 0;
    }
    return arr.slice(0, Len);
}
function WriteByte(arr,Num)
{
    if(!Num)
        Num = 0;
    arr[arr.length] = Num & 0xFF;
}
function WriteUint(arr,Num)
{
    if(!Num)
        Num = 0;
    var len = arr.length;
    arr[len] = Num & 0xFF;
    arr[len + 1] = (Num >>> 8) & 0xFF;
    arr[len + 2] = (Num >>> 16) & 0xFF;
    arr[len + 3] = (Num >>> 24) & 0xFF;
    var NumH = Math.floor(Num / 4294967296);
    arr[len + 4] = NumH & 0xFF;
    arr[len + 5] = (NumH >>> 8) & 0xFF;
}
function WriteUint16(arr,Num)
{
    if(!Num)
        Num = 0;
    var len = arr.length;
    arr[len] = Num & 0xFF;
    arr[len + 1] = (Num >>> 8) & 0xFF;
}
function WriteUint32(arr,Num)
{
    if(!Num)
        Num = 0;
    var len = arr.length;
    arr[len] = Num & 0xFF;
    arr[len + 1] = (Num >>> 8) & 0xFF;
    arr[len + 2] = (Num >>> 16) & 0xFF;
    arr[len + 3] = (Num >>> 24) & 0xFF;
}
function WriteUint32AtPos(arr,Num,Pos)
{
    if(!Num)
        Num = 0;
    arr[Pos] = Num & 0xFF;
    arr[Pos + 1] = (Num >>> 8) & 0xFF;
    arr[Pos + 2] = (Num >>> 16) & 0xFF;
    arr[Pos + 3] = (Num >>> 24) & 0xFF;
}
function WriteStr(arr,Str,ConstLength)
{
    if(!Str)
        Str = "";
    var arrStr = toUTF8Array(Str);
    var length;
    var len = arr.length;
    if(ConstLength)
    {
        length = ConstLength;
    }
    else
    {
        length = arrStr.length;
        if(length > 65535)
            length = 65535;
        arr[len] = length & 0xFF;
        arr[len + 1] = (length >>> 8) & 0xFF;
        len += 2;
    }
    for(var i = 0; i < length; i++)
    {
        arr[len + i] = arrStr[i];
    }
}
function WriteArr(arr,arr2,ConstLength)
{
    var length;
    if(arr2)
        length = Math.min(ConstLength, arr2.length);
    else
        length = 0;
    for(var i = 0; i < length; i++)
    {
        arr[arr.length] = arr2[i];
    }
    for(var i = length; i < ConstLength; i++)
    {
        arr[arr.length] = 0;
    }
}
function ReadUintFromArr(arr,len)
{
    if(len === undefined)
    {
        len = arr.len;
        arr.len += 6;
    }
    if(glError && arr.len > arr.length)
    {
        ToLog("**********Error Uint buf len: " + arr.len + "/" + arr.length);
        return 0;
    }
    var value = (arr[len + 5] << 23) * 2 + (arr[len + 4] << 16) + (arr[len + 3] << 8) + arr[len + 2];
    value = value * 256 + arr[len + 1];
    value = value * 256 + arr[len];
    return value;
}
function ReadUint32FromArr(arr,len)
{
    if(len === undefined)
    {
        len = arr.len;
        arr.len += 4;
    }
    if(glError && arr.len > arr.length)
    {
        ToLog("**********Error Uint32 buf len: " + arr.len + "/" + arr.length);
        return 0;
    }
    return (arr[len + 3] << 23) * 2 + (arr[len + 2] << 16) + (arr[len + 1] << 8) + arr[len];
}
function ReadUint16FromArr(arr,len)
{
    if(len === undefined)
    {
        len = arr.len;
        arr.len += 2;
    }
    if(glError && arr.len > arr.length)
    {
        ToLog("**********Error Uint16 buf len: " + arr.len + "/" + arr.length);
        return 0;
    }
    return (arr[len + 1] << 8) + arr[len];
}
function ReadByte(arr,len)
{
    if(len === undefined)
    {
        len = arr.len;
        arr.len += 1;
    }
    if(glError && arr.len > arr.length)
    {
        ToLog("**********Error Uint8 buf len: " + arr.len + "/" + arr.length);
        return 0;
    }
    return arr[len];
}
function ReadArr(arr,length)
{
    var Ret = [];
    var len = arr.len;
    for(var i = 0; i < length; i++)
    {
        Ret[i] =  + arr[len + i];
    }
    arr.len += length;
    return Ret;
}
function ReadStr(arr)
{
    var length = arr[arr.len] + arr[arr.len + 1] * 256;
    arr.len += 2;
    return ReadStrConstL(arr, length);
}
function ReadStrConstL(arr,length)
{
    var arr2 = arr.slice(arr.len, arr.len + length);
    var Str = Utf8ArrayToStr(arr2);
    arr.len += length;
    return Str;
}
function GetArrFromHex(Str)
{
    var array = [];
    for(var i = 0; Str && i < Str.length / 2; i++)
    {
        array[i] = parseInt(Str.substr(i * 2, 2), 16);
    }
    return array;
}
var ErrorCount = 0;
var TestMapValue = {};
var TestMapFormat = {};
var glTestCount = 0;
function TestValue(Value,Format,bLog)
{
    var Buf = GetBufferFromObject(Value, Format, 10000, {});
    var Value2 = GetObjectFromBuffer(Buf, Format, {});
    var Str1 = JSON.stringify(Value);
    var Str2 = JSON.stringify(Value2);
    if(typeof Format === "object")
    {
        Format = GetFormatFromObject(Format);
    }
    if(Str1 !== Str2)
    {
        ToLog("Error format: " + Format + " <--------------------------------------------------");
        ToLog(Value);
        ToLog(Value2);
        ToLog(Buf);
        ErrorCount++;
        return 0;
    }
    else
    {
        if(bLog)
        {
            ToLog("Completed: " + Format);
            ToLog(Value);
            ToLog(Value2);
        }
        glTestCount++;
        var Key = "T" + glTestCount;
        TestMapValue[Key] = Value;
        TestMapFormat[Key] = Format;
        return 1;
    }
}
global.WriteUint32AtPos = WriteUint32AtPos;
global.WriteUint32 = WriteUint32;
global.ReadUint32FromArr = ReadUint32FromArr;
glError = 1;
if(!global.ToLog)
    global.ToLog = function (Str)
    {
        console.log(Str);
    };
