
private _createMaskTexture(width: number, height: number): Laya.Texture2D {
    let owner = this._owner;
    const maskTexture = new Laya.Texture2D(width, height, Laya.TextureFormat.R8G8B8A8, false, false);
    const pixelData = this._maskTextureData = new Uint8Array(width * height * 4);
    maskTexture.setPixelsData(pixelData, false, false);
}

function ttt(){
    this._maskTexture = this._createMaskTexture(512,512);
    let imgMask = this._imgMask = new Image();
    imgMask.width = 200;  // 设置合适的显示大小
    imgMask.height = 200;
    imgMask.pos(220, 10);
    let maskTexture =new Texture(this._maskTexture); 
    imgMask.source = maskTexture;
    Laya.stage.addChild(imgMask);
    imgMask.visible = this._showDbgTexture;    
}