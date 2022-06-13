import {Range} from "../range"
import {ServerResponse, IncomingMessage} from "http"
import {sendfile, _404} from './sendfile'
import {existsSync, readFileSync} from 'fs'
import {MusicStreamlist} from './musicstream'


const useragentdict = existsSync('./data/useragent.json') ? JSON.parse(readFileSync('./data/useragent.json').toString()) : {} as any
console.log('useragentdict',useragentdict)
const musicStreamlist = new MusicStreamlist()


export function server(req:IncomingMessage,res:ServerResponse){
    const url = req.url
    if(url===undefined) return
    const urlArr = url.split('/')
    const uesr_agent = String(req.headers["user-agent"])
    console.log('[url]',url, '[user-agent]',uesr_agent in useragentdict ? useragentdict[uesr_agent]:uesr_agent)//req.headers["user-agent"]

    if (url === '/') {
        const newid = musicStreamlist.push()
        const data = Buffer.from(readFileSync('asset/index.html').toString().replace(/\[##audio##\]/gi,String(newid)))
        res.writeHead(200, {
            'Content-Type': `text/html; charset=utf-8`,
            'Content-Length': data.length,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'max-age=1',//단위는 초
        });
        res.end(data)
    }
    else if (url === '/test') sendfile(res, 'asset/test.mp3',null,'audio/mp3',()=>{}, req.headers.range)
    else if (url === '/testshort') sendfile(res, 'asset/testshort.mp3',null,'audio/mp3',()=>{}, req.headers.range)
    else if (urlArr[1]==='data'){
        const reqId = urlArr[2]
        if (musicStreamlist.existid(reqId)){
            musicStreamlist.getmusicstream(reqId).server(req,res)
        }else _404(res,url,'no_id'+reqId)
        
    }else{
        _404(res,url,'404end')
    }
}
    
