
export function clamp(v: number, min: number, max: number) {
    return Math.min(Math.max(v, min), max)
}

export class ClockManager{
    private _tick=0;
    private _dt = 1000/60;
    private _curTime=0; //ms
    private _enable=false;
    private _startTime=0;
    private _oldNow = Date.now;
    private _oldPerfNow = performance.now;
    start(){
        this._enable=true;
        this._startTime = this._oldNow();
        this._curTime = this._startTime;
        this._tick = 0;
        let newNow = this.getTime.bind(this);
        Date.now = newNow;
        performance.now = newNow;

    }
    stop(){
        this._enable=false;
        Date.now = this._oldNow;
        performance.now = this._oldPerfNow;
    }
    getTick(){
        return this._tick;
    }
    tick(){
        this._tick++;
        this._curTime = this._startTime + this._tick*this._dt;
    }

    getTime(){
        if(this._enable)
            return this._curTime;
        else
            return this._oldNow();
    }
}

export var clkmgr = new ClockManager();

(window as any).clk = clkmgr;

export function clockTick(){
    clkmgr.tick();
}

export function getCurTime(){
    return clkmgr.getTime();
}
