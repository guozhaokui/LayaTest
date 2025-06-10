export interface IStoryboardActor{
    startTime:number;   //起始时间
    inStoryboard:boolean;   //
    totalDuration:number;
    sb_init():void;        //初始化
    sb_update(curTime:number):void;
    sb_isEnd():boolean;
}

export function getTimeFromName(name:string, lastTime:number){
    let time = 0;
    let p = name.lastIndexOf('_');
    if(p<0) time = 0;
    else{
        let timeStr = name.substring(p+1);
        if (timeStr.startsWith('d')) {
            // 相对时间模式
            time = parseInt(timeStr.substring(1));
            if(isNaN(time)) time = 0;
            time = lastTime+time;
        } else {
            // 绝对时间模式
            time = parseInt(timeStr);
            if(isNaN(time)) time = 0;
        }
    }   
    return time;
}