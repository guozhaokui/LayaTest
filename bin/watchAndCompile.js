const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const ts = require('typescript');
const WebSocket = require('ws');
const {enginePath } = require('./engineCfg')

//
var clients;

function copyFile(src, dest) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    updateMetaFile(src, dest)
    console.log(`拷贝到: ${path.relative(__dirname, dest)}`);
}


function watchAndCompile(srcDir, outDir) {
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const watcher = chokidar.watch(srcDir, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        awaitWriteFinish:false, //默认是true，会等待文件写入完成，为了加相应速度，不要了
        //awaitWriteFinish: {
        //    stabilityThreshold: 200,    //防抖，避免某些编辑器的写入触发多次改变
        //    pollInterval: 100
        //},
        usePolling: false, // 设置为 true 如果需要使用轮询模式
        interval: 100, // 轮询间隔，仅在 usePolling 为 true 时使用        
    });

    watcher.on('change', (filePath) => {
        const relativePath = path.relative(srcDir, filePath);
        console.log('变化:', relativePath)
        //忽略screenshots的变化
        if (relativePath.startsWith('test/screenshots') || relativePath.startsWith('test\\screenshots')) {
            return;
        }
        const outPath = path.join(outDir, relativePath);
        const fileExt = path.extname(filePath);

        fs.mkdirSync(path.dirname(outPath), { recursive: true });

        if (fileExt === '.ts') {
            compileTypeScript(filePath, outPath);
        } else if (fileExt === '.glsl' || fileExt === '.vs') {
            copyFile(filePath, outPath);
            updateMetaFile(filePath, outPath);
        }

        // 通知所有连接的客户端
        const message = JSON.stringify({ type: 'fileChanged', file: relativePath });
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    console.log(`Watching ${srcDir} for changes...`);
}


/**
 * 找到js文件的源码,如果能找到就返回源文件的名字，否则返回null
 * @param {string} jsFilePath 
 * @returns 
 */
function findCorrespondingTsFile(jsFilePath) {
    if(path.extname(jsFilePath)!=='.js')
        return null;
    //console.log(`查找${jsFilePath}的源文件`)
    const possibleTsPath = jsFilePath.replace('.js', '.ts');
    const srcPath = path.join(__dirname, layaSrc);

    //注意加上tsc
    let relativePath = path.relative(path.join(__dirname, 'tsc'), possibleTsPath);
    const srcTsPath = path.join(srcPath, relativePath);

    if (fs.existsSync(srcTsPath)) {
        return srcTsPath;
    }

    //引擎源码中没有找到，可能是测试源码
    if (relativePath.startsWith('test')) {
        relativePath = relativePath.substring(5);
    }

    const testPath = path.join(__dirname, testSrc);
    const testTsPath = path.join(testPath, relativePath);

    if (fs.existsSync(testTsPath)) {
        return testTsPath;
    }
    return null;
}

function compileTypeScript(filePath, outPath) {
    const source = fs.readFileSync(filePath, 'utf8');
    const result = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2017,
            sourceMap: true,
            //removeComments: true,
        },
        fileName: filePath,
    });

    const jsPath = outPath.replace('.ts', '.js');
    fs.mkdirSync(path.dirname(jsPath), { recursive: true });
    //用 writeFileSync 可能有写磁盘的延迟，所以用fd
    const fd = fs.openSync(jsPath, 'w');
    fs.writeSync(fd, result.outputText);
    fs.fsyncSync(fd);
    fs.closeSync(fd);

    // 写入 sourcemap 文件。并且是绝对路径
    if (result.sourceMapText) {
        const sourceMap = JSON.parse(result.sourceMapText);
        //sourceMap.sourceRoot = 'file:///'
        sourceMap.sources = [filePath];  //保存绝对路径。对chrome本身不太 友好，但是很方便vscode的调试
        
        let mapfile = jsPath + '.map';  //虽然上面的fileName是ts，但是编译完以后，最后的map文件是js，例如 //# sourceMappingURL=test_webgpu_ocean.js.map
                                        //所以这里用js文件的路径
        const fd = fs.openSync(mapfile, 'w');
        fs.writeSync(fd, JSON.stringify(sourceMap));
        fs.fsyncSync(fd);
        fs.closeSync(fd);        
        //fs.writeFileSync(outPath + '.map', JSON.stringify(sourceMap));
        console.log('写map:', jsPath + '.map')
    }    
    // if (result.sourceMapText) {
    //     fs.writeFileSync(jsPath + '.map', result.sourceMapText);
    // }    
    //fs.writeFileSync(jsPath, result.outputText);
    console.log(`编译到: ${path.relative(__dirname, jsPath)}`);
    updateMetaFile(filePath, jsPath);
    return result.outputText;
}


async function compileTestDir() {
    //编译所有源目录的文件
    //TODO 遍历这个目录，递归子目录，找到所有的ts文件，编译到 ./tsc/test/子目录下，编译方法是上面的 compileTypeScript
    //如果目标目录（./tsc/test目录下没有package.json就创建一个，内容只要是 {"type": "module"} 就行 ）

    const srcDir = path.join(__dirname, testSrc);
    const destDir = path.join(__dirname, './tsc/test');

    // 确保目标目录存在
    fs.mkdirSync(destDir, { recursive: true });

    // 检查并创建 package.json
    // const packageJsonPath = path.join(destDir, 'package.json');
    // try {
    //     fs.accessSync(packageJsonPath);
    // } catch (error) {
    //     // 如果 package.json 不存在，创建它
    //     fs.writeFileSync(packageJsonPath, JSON.stringify({ type: "module" }, null, 2));
    //     console.log('Created package.json in', destDir);
    // }

    // 递归编译函数
    async function compileRecursive(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(dir, entry.name);
            const relPath = path.relative(srcDir, srcPath);
            const destPath = path.join(destDir, relPath);

            if (entry.isDirectory()) {
                fs.mkdirSync(destPath, { recursive: true });
                await compileRecursive(srcPath);
            } else if (entry.isFile() && path.extname(entry.name) === '.ts') {
                const jsDestPath = destPath.replace('.ts', '.js');
                fs.mkdirSync(path.dirname(jsDestPath), { recursive: true });
                const compiledContent = compileTypeScript(srcPath, jsDestPath);
                fs.writeFileSync(jsDestPath, compiledContent);
            }
        }
    }

    // 开始递归编译
    await compileRecursive(srcDir);
    console.log('Test directory compilation completed.');
}

var layaSrc = `${enginePath}/src`
var testSrc = '../src'

/**
 * 
 * @param {Set} clients 
 */
function startWatch(connected_clients){
    clients = connected_clients;
    watchAndCompile(path.join(__dirname, layaSrc), './tsc/');
    watchAndCompile(path.join(__dirname, testSrc), './tsc/test/');    
}

module.exports = {
    compileTestDir, layaSrc, testSrc,
    findCorrespondingTsFile,
    compileTypeScript,
    copyFile,
    startWatch
};


function updateMetaFile(filePath, outPath) {
    console.log(' update: ', filePath, outPath);
    const metaPath = outPath + '.meta';
    const stats = fs.statSync(filePath);
    const metaData = {
        sourcePath: filePath,
        lastModified: stats.mtimeMs,
        timestamp: Date.now()
    };
    fs.writeFileSync(metaPath, JSON.stringify(metaData, null, 2));
}