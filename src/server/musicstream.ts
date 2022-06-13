import {ServerResponse, IncomingMessage} from "http"
import {Range} from "../range"
import {parse_range_req} from './parse_range_req'

import {createCipheriv,createDecipheriv,createHash} from 'crypto';
const SHA512 = (txt:string)=> createHash('sha256').update(txt).digest('hex');


export class MusicStreamlist{
    private list : MusicStream[]
    private idList : string[]
    constructor(){
        this.list = []
        this.idList = []
    }

    push(){
        let id = SHA512((new Date()).toISOString()+Math.random())
        while (this.idList.includes(id)) id = SHA512((new Date()).toISOString()+Math.random())

        const item = new MusicStream(id)
        // console.log('[push]',item)
        this.idList.push(item.id)
        this.list.push(item)
        return item.id
    }
    existid(id:string){
        // console.log('[existid]',id, this.idList, this.idList.includes(id))
        return this.idList.includes(id)
    }
    getmusicstream(id:string){
        if (!(this.idList.includes(id))) throw("없는 ID 요청")
        return this.list[this.idList.indexOf(id)]
    }

}



class MusicStream{
    id:string
    constructor(id:string){
        this.id = id//
    }
    public server(req:IncomingMessage,res:ServerResponse){
        try{
            const range = Range.prototype.parse_range_header(req.headers.range)
            // console.log({range})
            parse_range_req(req,res,range)
            return
        }catch(e){
            console.log('no range',e)
            // no_range_req(req,res)
            parse_range_req(req,res,new Range(0,Infinity))
            return
        }
    }

    
    no_range_req(req:IncomingMessage,res:ServerResponse){
        const file_type = 'audio/mp3'
        res.writeHead(200, {
            'Content-Type': file_type,
            'Content-Length': "*",
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'max-age=1',//단위는 초
        });
        res.end('')
    
    }
}

