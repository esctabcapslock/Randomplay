
import {Range} from "../range"
import { importmusicdata } from "./importmusic";
import {Mp3data} from "./mp3data"

export class Music_queue{
    private list:Music_queue_item[];
    MAX_CHUNK_SIZE:number
    private sum:number
    constructor(url_list:string[], MAX_CHUNK_SIZE:number=1024*1024){
        this.list = []
        this.MAX_CHUNK_SIZE = MAX_CHUNK_SIZE
        this.sum = 0
        
        for (const url of url_list) this.push(url)
    }

    public push(path:string){
        const item = new Music_queue_item(path, this.sum, !Boolean(this.list.length))
        this.list.push(item)
        this.sum += item.length
    }

    public findmusic(range:Range){
        let item:Music_queue_item|undefined
        for (const _item of this.list){
            if (_item.length_sum > range.start) { break}
            item = _item;
        }
        
        if (item===undefined) return false//만족하는 게 없으면 10초 기다린 뒤 요청?? 아님 416? 확인하자
        
        return item
    }

    public print(){
        console.log(this.list)
    }

}

class Music_queue_item{
    private file:Mp3data;
    length_sum:number
    startItemFlag:boolean
    constructor(path:string, length_sum:number, startItemFlag:boolean = false){
        this.file = new Mp3data(path)
        this.length_sum = length_sum //직전까지 합쳐진 길이
        this.startItemFlag = startItemFlag
    }

    cal_pos_of_file(index:number){ //파일 내에서 절대적 위치 반환.
        return index + this.file.offert + (this.startItemFlag ? 0 : this.file.secondOffset)
    }
    get length(){return this.startItemFlag ? this.file.size : this.file.size - this.file.secondOffset}
    get path(){return this.file.path}
    get aausizestart(){return this.file.offert + 0x2c}

}



// 실
export const music_queue = new Music_queue(importmusicdata())

console.log('music_queue',music_queue.print())