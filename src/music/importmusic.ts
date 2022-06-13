import {readFileSync} from "fs"

export function importmusicdata(){
    const music_list = readFileSync(__dirname+'\\..\\..\\data\\music_list.txt').toString().trim().split('\n').map(v=>v.trim()).filter(v=>v)
    return music_list
}
