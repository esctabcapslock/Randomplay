import {readFileSync, existsSync, statSync} from "fs"

function bf2chr (bf:Buffer,start:number,len:number, encoding:boolean):string{
    if(start<0) throw("wrong start");
    const b=Buffer.alloc(len);
    for (let i=0; i<len; i++) b[i]=bf[start+i];
    return b.toString(encoding?undefined:'utf8');
}

function bf2num(bf:Buffer,start:number, len:number, encodinged:boolean):number{
let out:number=0;
for(let i=0; i<len; i++){
    //console.log('out',out,bf[start+i])
    out*=(1<<(encodinged?7:8)) // Encoding된 값이라 최상위 비트 제거.
    out+=bf[start+i]
}
return out;
}



export class Mp3data{
    private start_pos:number;
    private firstAAUSize:number;
    private end_pos:number;
    private filesize:number;
    path:string;

    constructor(path:string){
        this.path = path
        this.firstAAUSize = -1
        this.filesize = -1
        this.end_pos = -1
        this.start_pos = this.get_start_pos()

        // start_pos 이후 0x2c, 0x2d, 0x2e, 0x2f   번째 비트: AAU 길이 기록함.
    }
    
    private get_start_pos():number{
        if (!existsSync(this.path)) throw("파일 존재 X")
        if (statSync(this.path).isDirectory()) throw("폴더에 해당되는 경로임")
        const file = readFileSync(this.path)
        this.filesize = file.length

        let Tag_Identifier:string  = bf2chr(file,0,3,false);
        let p:number = 0
        if (Tag_Identifier=='ID3'){
            var Size_of_Tag = bf2num(file,6,4,true)
            // console.log('Size_of_ID3Tag:',Size_of_Tag) // 헤더 길이(10) 미포함.
            p=Size_of_Tag+10;
        }else p=10;
        this.start_pos = p

        this.get_file_size(file)
        return p;
    }

    private get_file_size(file:Buffer){
        let aau_cnt = 0

        let pre_p = this.start_pos
        // let ppre_p = pre_p
        let p:number=pre_p;

        let aausize = bf2num(file, p+0x2c,4,false)
        console.log('[aausize]',aausize)
        // 이게 뭔 표준인지는 모르겠어

        for(; p<file.length;){
            let {AAU_size, frequency} = this.get_AAU_len(file,p)
            
            //console.log('[for]',p,Number(p).toString(16),file.length,AAU_size,frequency)
            if(isNaN(AAU_size) || !AAU_size) {
                this.end_pos = pre_p
                break
            }
            // ppre_p = pre_p
            pre_p = p
            p+=AAU_size
            aau_cnt++

            // second_AAD
            if (this.firstAAUSize === -1) this.firstAAUSize = AAU_size
        }
        if(this.end_pos<0) this.end_pos = p
        console.log('[aau_cnt]',aau_cnt)
    }


    private get_AAU_len(file:Buffer, p:number):{AAU_size:number, frequency:number}{
        // if(!this.header) 
        
        if(file[p]!=255){
            console.log('해더가 아님!')
            return {AAU_size:NaN, frequency:NaN}
        }
        const header = [file[p],file[p+1],file[p+2],file[p+3]]
        if (header[0] != 255) return {AAU_size:NaN, frequency:NaN}
        // console.log(header)
        
        const Version = (file[p+1]>>3)&3
        const Layer = (file[p+1]>>1)&3
        const Bit_rate = file[p+2]>>4
        const Frequency = (file[p+2]>>2)&3
        const Padding_bit = (file[p+2]>>1)&1

        let Bit_rate_val:number = 0// = undefined;
        if (Version==3){
            if (Layer==3) Bit_rate_val = [NaN,32,64,96,128,160,192,224,256,288,320,352,384,416,448,NaN][Bit_rate];
            else if (Layer==2) Bit_rate_val = [NaN,32,45,56,64,80,96,112,128,160,192,224,256,320,384,NaN][Bit_rate];
            else if (Layer==1) Bit_rate_val = [NaN,32,40,45,56,64,80,96,112,128,160,192,224,256,320,NaN][Bit_rate];
        }else if (Version==0 || Version==2){
            if (Layer==3) Bit_rate_val = [NaN,32,48,56,64,80,96,112,128,144,160,176,192,224,256,NaN][Bit_rate];
            else if (Layer==2 || Layer==1) Bit_rate_val = [NaN,8,16,24,32,40,48,56,64,80,96,112,128,144,160,NaN][Bit_rate];
        }
        let Frequency_val:number = 0
        if (Version==3) Frequency_val = [44100,48000,32000,NaN][Frequency]
        else if (Version==2) Frequency_val = [22050,24000,16000,NaN][Frequency]
        else if (Version==0) Frequency_val = [11025,12000,8000,NaN][Frequency]
        const AAU_size = Math.floor(144*Bit_rate_val*1000/Frequency_val+Padding_bit)
        
        return {AAU_size, frequency:Frequency_val};
        //l = 144/info.frequency*8
    }


    get offert():number{
        return this.start_pos
    }
    get secondOffset():number{
        return this.firstAAUSize
    }
    get size():number{
        return this.end_pos - this.start_pos
    }

}
