
import {createServer} from "http"
import {server} from "./server"
console.log(__dirname,__filename)
const port = 8000
createServer(server).listen(port,()=>console.log(`server is running at port ${port}`))
