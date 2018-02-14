/**
 * Created by ian0214 on 18/2/12.
 */
let Jimp = require("jimp");

// get color at (x,y), if (x,y) is out of bound, return color at (originalX, originalY)
function getColor(x, y, hex=false, src, originalX, originalY){
    let width = src.bitmap.width;
    let height = src.bitmap.height;
    if(x>0 && x<width && y>0 && y<height){
        return hex?src.getPixelColor(x, y):Jimp.intToRGBA(src.getPixelColor(x, y));
    }else {
        if(originalX && originalY){
            return hex?src.getPixelColor(originalX, originalY):Jimp.intToRGBA(src.getPixelColor(originalX, originalY));
        }
        return hex?0x00000000:{r:0, g:0, b:0, a:0};
    }
}

// use sobel
function drawEdge(grey, edge){
    let height = edge.bitmap.height;
    let width = edge.bitmap.width;
    let kernelX = [
        [-1,0,1],
        [-2,0,2],
        [-1,0,1]
    ];

    let kernelY = [
        [-1,-2,-1],
        [0,0,0],
        [1,2,1]
    ];
    // let grey = this.raw.clone().greyscale();
    let getGreyAt = (x, y)=>getColor(x, y, false, grey).r;
    for(let y=0;y<height;y++){
        for(let x=0;x<width;x++){
            let pX = (
                (kernelX[0][0] * getGreyAt(x - 1, y - 1)) +
                (kernelX[0][1] * getGreyAt(x, y - 1)) +
                (kernelX[0][2] * getGreyAt(x + 1, y - 1)) +
                (kernelX[1][0] * getGreyAt(x - 1, y)) +
                (kernelX[1][1] * getGreyAt(x, y)) +
                (kernelX[1][2] * getGreyAt(x + 1, y)) +
                (kernelX[2][0] * getGreyAt(x - 1, y + 1)) +
                (kernelX[2][1] * getGreyAt(x, y + 1)) +
                (kernelX[2][2] * getGreyAt(x + 1, y + 1))
            );

            let pY = (
                (kernelY[0][0] * getGreyAt(x - 1, y - 1)) +
                (kernelY[0][1] * getGreyAt(x, y - 1)) +
                (kernelY[0][2] * getGreyAt(x + 1, y - 1)) +
                (kernelY[1][0] * getGreyAt(x - 1, y)) +
                (kernelY[1][1] * getGreyAt(x, y)) +
                (kernelY[1][2] * getGreyAt(x + 1, y)) +
                (kernelY[2][0] * getGreyAt(x - 1, y + 1)) +
                (kernelY[2][1] * getGreyAt(x, y + 1)) +
                (kernelY[2][2] * getGreyAt(x + 1, y + 1))
            );
            let channel = Math.sqrt(pX*pX+pY*pY)>>>0;
            // let hex = ((((channel<<8)+channel)<<8)+channel<<8)+255;
            let hex = 0x00000000+channel;
            edge.setPixelColor(hex, x, y);
        }
    }
    // this.edge.blur(1);
    // this.img = this.edge;
    return edge;
}


function bilateralFilter(canvas, raw, radius=5) {
    let distance2 = function (v1, v2) {
        let sum = 0;
        for(let i=0;i<v1.length;i++){
            sum += (v1[i]-v2[i])*(v1[i]-v2[i]);
        }
        return sum;
    };

    let bilateralFilterWeight = function(x, y, centerX, centerY, sigD=100, sigR=100){
        let c1 = getColor(x, y, false, raw, centerX, centerY);
        let c2 = getColor(centerX, centerY, false, raw, centerX, centerY);
        let cArray1 = [c1.r, c1.g, c1.b, c1.a];
        let cArray2 = [c2.r, c2.g, c2.b, c2.a];
        return Math.exp(-(distance2([x, y],[centerX, centerY])/(2*sigD)) - (distance2(cArray1, cArray2)/(2*sigR)))
    };

    let width = raw.bitmap.width;
    let height = raw.bitmap.height;
    raw.scan(0, 0, width, height, (x, y, idx)=> {
        // console.log(x+","+y+","+idx);
        // console.log(y*this.width+x);
        let sumW = 0;
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let sumA = 0;
        for (let i = x - radius; i <= x + radius; i++) {
            for (let j = y - radius; j <= y + radius; j++) {
                // 每一个周围像素点i,j
                let w = bilateralFilterWeight(i, j, x, y);
                let nbrIdx = (j * width + i) * 4;
                if (nbrIdx < 0 || nbrIdx > width * height * 4 - 1)
                    continue;
                let r = w * raw.bitmap.data[nbrIdx];
                let g = w * raw.bitmap.data[nbrIdx + 1];
                let b = w * raw.bitmap.data[nbrIdx + 2];
                let a = w * raw.bitmap.data[nbrIdx + 3];
                sumW += w;
                sumR += r;
                sumG += g;
                sumB += b;
                sumA += a;
                // console.log(w);
                // console.log(w+" "+r+","+g+","+b+","+a);
            }
        }
        // console.log(this.raw.bitmap.data[idx]);
        // console.log(sumR/sumW);
        // console.log(sumR);
        // console.log(sumW+"---\n");
        // console.log(this.raw.bitmap.data[idx]+" : "+(sumR/sumW));
        canvas.bitmap.data[idx] = sumR / sumW;
        canvas.bitmap.data[idx + 1] = sumG / sumW;
        canvas.bitmap.data[idx + 2] = sumB / sumW;
        canvas.bitmap.data[idx + 3] = sumA / sumW;
    });
    return canvas;
}

function composite(edge, blurred, output, edgeWeakening=40){
    let width = edge.bitmap.width;
    let height = edge.bitmap.height;

    edge.blur(1);
    let sigmoid = function (x) {
        return 1/(1+Math.exp(-x));
    };

    // let blurred = this.raw.clone().blur(10);

    edge.scan(0, 0, width, height, (x, y, idx)=>{
        let a = edge.bitmap.data[idx+3];
        a = 255*sigmoid(a-edgeWeakening);
        // let overlapAlpha = a*1.5>255?255:a*1.5;
        let overlapAlpha = a;

        // this.img.bitmap.data[idx] = 0;
        // this.img.bitmap.data[idx+1] = 0;
        // this.img.bitmap.data[idx+2] = 0;
        // this.img.bitmap.data[idx+3] = overlapAlpha*0.8; //255 * sigmoid(overlapAlpha-150);

        let weight = 1 - overlapAlpha/255.0;
        let rawR = blurred.bitmap.data[idx+0];
        let rawG = blurred.bitmap.data[idx+1];
        let rawB = blurred.bitmap.data[idx+2];
        let rawA = blurred.bitmap.data[idx+3];
        // let rawR = this.raw.bitmap.data[idx+0];
        // let rawG = this.raw.bitmap.data[idx+1];
        // let rawB = this.raw.bitmap.data[idx+2];
        // let rawA = this.raw.bitmap.data[idx+3];
        //
        output.bitmap.data[idx+0] = weight*rawR;
        output.bitmap.data[idx+1] = weight*rawG;
        output.bitmap.data[idx+2] = weight*rawB;
        output.bitmap.data[idx+3] = 255;
    });
    return output;
}

class Cartoonlization{

    constructor(opt){
        let DEFAULT_OPT = {
            blurMode: {
                name: "bilateral",
                radius: 5
            },
            edgeWeakening: 50,
            resize: true
        };

        this.opt = opt || DEFAULT_OPT;
    }

    init(srcPath){
        return Jimp.read(srcPath).then((img) => {
            this.src = this.opt.resize? img.resize(400, Jimp.AUTO):img;
            return Promise.resolve(img);
        }).catch(
            (err)=>console.error("error: "+err)
        ).then((img)=>{
            let width = img.bitmap.width;
            let height = img.bitmap.height;
            let promiseOutput = new Promise((resolve, reject)=>{
                this.output = new Jimp(width, height, 0x00000000);
                resolve(this);
            });
            let promiseEdge = new Promise((resolve, reject)=>{
                this.edge = new Jimp(width, height, 0x00000000);
                resolve();
            });
            let promiseBlurred = new Promise((resolve, reject)=>{
                this.blurred = new Jimp(width, height, 0x00000000);
                resolve();
            });
            return Promise.all([promiseOutput, promiseEdge, promiseBlurred]);
        });
    }

    make(){
        let opt = this.opt;
        // blur
        if(opt.blurMode.name==="bilateral"){
            console.log("bilateral filtering takes longer time...");
            this.blurred = bilateralFilter(this.blurred, this.src, opt.blurMode.radius);
        }else if(opt.blurMode.name === "gaussian"){
            this.blurred = this.src.clone().gaussian(opt.blurMode.radius);
        }else{
            // opt.blurMode.name='fast'
            this.blurred = this.src.clone().blur(opt.blurMode.radius);
        }

        // edge
        this.edge = drawEdge(this.src.clone().greyscale(), this.edge);
        // console.log("output");

        this.output = composite(this.edge, this.blurred, this.output, opt.edgeWeakening);
    }

    toFile(path="./output.png"){
        this.output.write(path);
    }
}

module.exports = Cartoonlization;