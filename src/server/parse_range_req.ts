import {ServerResponse, IncomingMessage} from "http"
import {Range} from "../range"
import {createReadStream} from "fs"
import {music_queue} from "../music"

export function parse_range_req(req:IncomingMessage,res:ServerResponse,range:Range){
    console.log('[parse_range_req]',req.headers.range, '[parse_range_req]', range)


    const file_type = 'audio/mp3'
    const id3 = Buffer.from([73, 68, 51, 4, 0, 0, 0, 0, 0, 0]);

    const length = "123456789"

    if (range.start == 0){
        if (range.end == 1){
            res.writeHead(206,{
                'Content-Type': file_type,
                'Accept-Ranges': 'bytes',
                'Content-Range': `bytes ${0}-${1}/${length}`,
                'Content-Length': '1',
            })
            res.end(Buffer.from([73, 68]))
            return
        }
        res.writeHead(206,{
            'Content-Type': file_type,
            'Accept-Ranges': 'bytes',
            'Content-Range': `bytes ${0}-${9}/${length}`,
            'Content-Length': '10',
            'Cache-Control': 'max-age=1',//단위는 초
        })
        res.end(id3)
        return
    }

    const origin_start = range.start

    range.start -= id3.length
    range.end -= id3.length

    // ㄱ

    const item = music_queue.findmusic(range)
    // console.log({item})
    
    if (!item){
        setTimeout(()=>{parse_range_req(req,res,range)},1000*10) //만족하는 게 없으면 10초 기다린 뒤 요청?? 아님 416? 확인하자
        return
    }
    
    console.log('[item]',item.startItemFlag, item.path, item.length_sum)
    let start_of_file = range.start - item.length_sum
    if (start_of_file >= item.length) {
        _416(res,'r길이 벗어남')
        return
       // throw(`길이 벗어남 s, start_of_file:${start_of_file}, ln:${item.length}`) //끝났을때 주로...
    }

    // 끝나는 바로 그 지점을 가리킨다...
    let end_of_file = Math.min(Math.min(range.size-1,music_queue.MAX_CHUNK_SIZE) + start_of_file, item.length-1)
    if (end_of_file > item.length) throw("길이 벗어남 e")

    if (start_of_file==end_of_file-1) throw("짧은 길이")


    // console.log({start_of_file, end_of_file})

    
    
    console.log('p[p]','length',item.length, { start:item.cal_pos_of_file(start_of_file), end:item.cal_pos_of_file(end_of_file)})
    const readStream = createReadStream(item.path, { start:item.cal_pos_of_file(start_of_file), end:item.cal_pos_of_file(end_of_file)});
    

    const header = { //이어진다는 뜻
        'Content-Type': file_type,
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${origin_start}-${end_of_file-start_of_file+origin_start}/*`,
        'Content-Length': end_of_file - start_of_file + 1,
        'Cache-Control': 'max-age=1',//단위는 초
    }
    // console.log('header',header)
    res.writeHead(206, header);

    let out = Buffer.from([])
    readStream.on('data', function (chunk:Buffer) {
        out = Buffer.concat([out, chunk])

        

        // console.log(chunk);
    });
    readStream.on('end',()=>{
        console.log('end',out.length, 'e-s', end_of_file - start_of_file, 'sended range',`bytes ${origin_start}-${end_of_file-start_of_file+origin_start}/*`)
       
        //mp3파일의 총 길이를 수정
        let st = item.aausizestart - item.cal_pos_of_file(start_of_file)
        let ar = [0x00, 0x02, 0xff, 0xff]
        if (st >= 0 && item.startItemFlag) for (let i=0; i<4; i++) if(st+i<out.length) {
            console.log('change_ln',item.aausizestart,item.cal_pos_of_file(start_of_file),st,i,out[st+i])
            out[st+i] = ar[i]
        }
       
       
        res.end(out)
    })
    //-1 안 하면 다 안받은 걸로 생각하는듯?
    // readStream.pipe(res);
    
}

function _416(res:ServerResponse, err:any) {
    if (err) console.error('_404 fn err', err)
    res.writeHead(416, { 'Content-Range': ': bytes */*' });
    res.end('416 code');
}
