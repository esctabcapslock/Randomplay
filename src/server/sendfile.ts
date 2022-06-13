import {ServerResponse, IncomingMessage,} from "http"
import {stat, readFileSync, createReadStream, readdirSync} from "fs"
export function _404(res:ServerResponse, url:string, err:any) {
    if (err) console.error('_404 fn err', url, err)
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('404 Page Not Found');
}


export function sendfile(res:ServerResponse, path:string, encode:string|null, file_type:string, callback:any, range:string|undefined) {
    //console.log('fs_readfile', url)
    var name = path.toString().split('/').reverse()[0]
    if (name.endsWith('.html')) file_type = 'text/html; charset=utf-8';
    if (name.endsWith('.css')) file_type = 'text/css; charset=utf-8';
    if (name.endsWith('.js')) file_type = 'text/javascript; charset=utf-8';
    if (name.endsWith('.png')) { encode = ''; file_type = 'image/png'; }
    if (name.endsWith('.ts')) { encode = ''; file_type = 'application/octet-stream'; }

    stat(path, (err, stats) => {
        if (err) _404(res, path, '[error] fs_file_not_exist');
        else if (encode == 'utf8') { //택스트 파일인 경우
            res.writeHead(200, { 'Content-Type': file_type }); res.end(readFileSync(path, encode))
        } else { //바이너리 파일인 경우
            const parts = range === undefined ? undefined : range.replace(/bytes=/, "").replace(/\/([0-9|*]+)$/, '').split("-").map(v => parseInt(v));
            if (!parts || parts.length != 2 || isNaN(parts[0]) || parts[0] < 0) {
                res.writeHead(200, {
                    'Content-Type': file_type,
                    'Content-Length': stats.size,
                    'Accept-Ranges': 'bytes',
                    'Cache-Control': 'max-age=3600',//단위는 초
                });
                const readStream = createReadStream(path)
                readStream.pipe(res);
            } else {
                const start = parts[0];
                const MAX_CHUNK_SIZE = 1024* 1024 * 8;
                const end = Math.min((parts[1] < stats.size - 1) ? parts[1] : stats.size - 1, start + MAX_CHUNK_SIZE - 1)
                console.log('[file-분할전송 - else]', start, end, '크기:', stats.size, parts);
                const readStream = createReadStream(path, { start, end });
                res.writeHead((end == stats.size) ? 206 : 206, { //이어진다는 뜻
                    'Content-Type': file_type,
                    'Accept-Ranges': 'bytes',
                    'Content-Range': `bytes ${start}-${end}/${stats.size}`,
                    'Content-Length': end - start + 1,
                });
                //-1 안 하면 다 안받은 걸로 생각하는듯?
                readStream.pipe(res);
            }
        }

    })
    callback();
}
