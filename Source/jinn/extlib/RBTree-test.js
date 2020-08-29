/*
 * @project: WellBeingNetwork
 * @version: Development (beta)
 * @license: MIT (not for evil)
 * @copyright: Yuriy Ivanov (Vtools) 2017-2020 [progr76@gmail.com]
 * @copypaste: Evgeny Pustolenko (pev5691)  2019-2020 [pev5691@yandex.ru]
 * Web: https://www.facebook.com/pev5691
 * Telegram:  https://t.me/wellbeingnetwork
 */


require("./RBTree");
TestRBTree();
function TestRBTree()
{
    var Tree = new RBTree(function (a,b)
    {
        return a.value - b.value;
    });
    
    var Value = {value:1, data:123};
    if(!Tree.find(Value))
        Tree.insert(Value);
    
    var Value2 = {value:2, data:123};
    Tree.insert(Value2);
    
    if(!Tree.find(Value))
        Tree.insert(Value);
    
    var it = Tree.iterator(), Item;
    while((Item = it.next()) !== null)
    {
        console.log(JSON.stringify(Item));
    }
    
    console.log(JSON.stringify(Tree.min()));
}
