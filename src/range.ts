export class Range{
    start:number
    end:number
    constructor(start:number, end:number){
        if (isNaN(end)) end = Infinity;

        // console.log('[Range]',start,end);

        if (!Number.isInteger(start)) throw('start 정수가 아님');
        if ((!Number.isInteger(end)) && end!==Infinity) throw('end 정수 또는 무한이 아님');
        this.start = start
        this.end = end
    }
    
    get size(){
        return this.end - this.start
    }
    
    parse_range_header(range:string|undefined){
        let parts = range === undefined ? undefined : range.replace(/bytes=/, "").replace(/\/([0-9|*]+)$/, '').split("-").map(v => parseInt(v));
        if (!parts || parts.length != 2 || isNaN(parts[0]) || parts[0] < 0) throw("not range")
        try{
            return new Range(parts[0], parts[1])  
        }catch(e){
            console.log(e)
            throw(e)
        }
    }
    
}