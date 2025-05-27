loadLib( './jsLibs/bullet.wasm.js')
loadLib( "./jsLibs/bullet.js")
import 'tsc/test/test.js'
console.log('aaa')

const socket = new WebSocket(`ws://localhost:4000`);

socket.onopen=()=>{
    console.log('Connected to WebSocket server');
}
//socket.addEventListener('message', async(event) => {
socket.onmessage=async (event)=>{
    const data = JSON.parse(event.data);
    if (data.type === 'fileChanged') {
        console.log('File changed:', data.file);
        let src = data.file.replace('layaAir','')
        if(src.startsWith('/')||src.startsWith('\\')){
            src = src.substring(1)
        }
        if(src.endsWith('.ts')){
            src = src.substring(0,src.length-3)+'.js?'+Date.now();
        }
        const cleanPath = src.replace(/\\/g, '/')  // 转换斜杠
        let refresh = true;
        try{
            // 动态import只能是绝对路径，无法应用importmap
            // 只动态处理引擎部分，测试部分会直接刷新，下面的resolve会异常
            const moduleUrl = import.meta.resolve(cleanPath);
            console.log('解析后的URL:', moduleUrl);        
            if(window.curexp && window.curexp.onfilechange){
                refresh = await window.curexp.onfilechange(moduleUrl);
            }
        }catch(e){
            //refresh = true
        }
        // 如果变更的文件与当前页面相关，则刷新
        if (refresh) {
            location.reload();
        }
    }
}

function isRelevantFile(file) {
    // 这里的逻辑需要根据你的项目结构来定制
    // 例如，你可以检查文件路径是否与当前页面相关
    return true; // 这里简单地总是返回 true，即任何文件变化都刷新
}

