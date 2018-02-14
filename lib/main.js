/**
 * Created by ian0214 on 18/2/12.
 */
let Jimp = require("jimp");
let CircularQueue = require("./CircularQueue");
let TimeCost = require("./TimeCost");
let Color = require("./Color");
let fs = require("fs");

let cost = new TimeCost();

let debug = true;

function log(msg) {
    if (debug) console.log(msg);
}

class Cartoon {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.img = null;

        this.avgColor = (region) => {
            let size = region.length;
            let color = region
            // .map((x)=>console.log(x))
                .map(item => {
                    return {r: item.c.r / size, g: item.c.g / size, b: item.c.b / size, a: item.c.a / size}
                })
                // .map((x)=>console.log(x))
                .reduce((c1, c2) => {
                    return {r: c1.r + c2.r, g: c1.g + c2.g, b: c1.b + c2.b, a: c1.a + c2.a}
                });
            color.r ^= 0;
            color.g ^= 0;
            color.b ^= 0;
            color.a ^= 0;

            return color;
        };

        // bitmap filter
        this.visited = [];
        this.regionStart = {x: 0, y:0};
        this.visitedSum = 0;

        this.queue = new CircularQueue(width * height);
    }

    setRawImg(raw) {
        this.raw = raw;
        // this.raw.resize(213, Jimp.AUTO);
        // this.raw.blur(1);
        // this.raw.write("../resource/blur.jpg")
    }

    transform(threshold){
        let i = 0;
        let j = 0;
        while(j<this.height){
            if(!this.visited[i][j]){
                this.regionStart.x = i;
                this.regionStart.x = j;

                this.scan(threshold, {x:i, y:j});
                // log("left: "+this.left());
            }

            i++;
            if(i===this.width){
                i = 0;
                j++;
            }
        }
    }

    drawEdge(){
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
        let grey = this.raw.clone().greyscale();
        let getGreyAt = (x, y)=>this.getColor(x, y, false, grey).r;
        for(let y=0;y<this.height;y++){
            for(let x=0;x<this.width;x++){
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
                this.edge.setPixelColor(hex, x, y);
            }
        }
        // this.edge.blur(1);
        // this.img = this.edge;
    }

    composite(){

        this.edge.blur(1);
        let sigmoid = function (x) {
            return 1/(1+Math.exp(-x));
        };
        let blurred = this.raw.clone().blur(10);
        this.edge.scan(0, 0, this.width, this.height, (x, y, idx)=>{
            let a = this.edge.bitmap.data[idx+3];
            a = 255*sigmoid(a-40);
            let grey = 0;
            // let overlapAlpha = a*1.5>255?255:a*1.5;
            let overlapAlpha = a;
            // overlapAlpha = overlapAlpha>

            this.img.bitmap.data[idx] = 0;
            this.img.bitmap.data[idx+1] = 0;
            this.img.bitmap.data[idx+2] = 0;
            this.img.bitmap.data[idx+3] = overlapAlpha*0.8; //255 * sigmoid(overlapAlpha-150);

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
            this.img.bitmap.data[idx+0] = weight*rawR;
            this.img.bitmap.data[idx+1] = weight*rawG;
            this.img.bitmap.data[idx+2] = weight*rawB;
            this.img.bitmap.data[idx+3] = 255;
        })
    }

    scan(threshold, start = {x: 0, y: 0}) {
        // cost.tik("enter scan");
        this.queue.clear();
        this.queue.put(start);
        let region = [];
        let cnt = 0;
        while (!this.queue.isEmpty()) {
            // cost.tik("start while");
            let p = this.queue.get();
            // cost.tik("queue get");
            region.push({x: p.x, y: p.y, c: Jimp.intToRGBA(this.raw.getPixelColor(p.x, p.y))});
            // cost.tik("region push");
            // region.push({x: p.x, y: p.y, c: this.raw.getPixelColor(p.x, p.y)});
            // 将未访问过的周边点加入队列
            let nbrs = this.neighbours(p.x, p.y);
            // cost.tik("get nbr");
            let centerColor = this.raw.getPixelColor(p.x, p.y);
            nbrs.forEach((nbr) => {
                // log("nbr:"+nbr);
                let nbrColor = this.raw.getPixelColor(nbr.x, nbr.y);
                if (this.visited[nbr.x][nbr.y] === false && this.similar(centerColor, nbrColor, threshold)) {
                    this.visited[nbr.x][nbr.y] = true;
                    this.visitedSum ++;
                    this.queue.put(nbr);
                }
            });
        }
        let avg = this.avgColor(region);
        // console.log(avg);
        region.map((p) => {
            this.img.setPixelColor(Jimp.rgbaToInt(avg.r, avg.g, avg.b, avg.a), p.x, p.y)
        });


    }

    getColor(x, y, hex=false, src=this.raw, originalX, originalY){
        if(x>0 && x<this.width && y>0 && y<this.height){
            return hex?src.getPixelColor(x, y):Jimp.intToRGBA(src.getPixelColor(x, y));
        }else {
            if(originalX && originalY){
                return hex?src.getPixelColor(originalX, originalY):Jimp.intToRGBA(src.getPixelColor(originalX, originalY));
            }
            return hex?0x00000000:{r:0, g:0, b:0, a:0};
        }
    }

    bilateralFilter(size=2){
        this.raw.scan(0, 0, this.width, this.height, (x, y, idx)=>{
            // console.log(x+","+y+","+idx);
            // console.log(y*this.width+x);
            let sumW = 0;
            let sumR = 0;
            let sumG = 0;
            let sumB = 0;
            let sumA = 0;
            for(let i=x-size;i<=x+size;i++){
                for(let j=y-size;j<=y+size;j++){
                    // 每一个周围像素点i,j
                    let w = this.bilateralFilterWeight(i, j, x, y);
                    let nbrIdx = (j*this.width+i)*4;
                    if(nbrIdx<0 || nbrIdx>this.width*this.height*4-1)
                        continue;
                    let r = w*this.raw.bitmap.data[nbrIdx];
                    let g = w*this.raw.bitmap.data[nbrIdx+1];
                    let b = w*this.raw.bitmap.data[nbrIdx+2];
                    let a = w*this.raw.bitmap.data[nbrIdx+3];
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
            this.bilateral.bitmap.data[idx] = sumR/sumW;
            this.bilateral.bitmap.data[idx+1] = sumG/sumW;
            this.bilateral.bitmap.data[idx+2] = sumB/sumW;
            this.bilateral.bitmap.data[idx+3] = sumA/sumW;

        });
        this.bilateral.write("bilateral-filter.png");
    }

    bilateralFilterWeight(x, y, centerX, centerY, sigD=100, sigR=100){
        let distance2 = function (v1, v2) {
            let sum = 0;
            for(let i=0;i<v1.length;i++){
                sum += (v1[i]-v2[i])*(v1[i]-v2[i]);
            }
            // console.log(sum);
            return sum;
        };
        let c1 = this.getColor(x, y, false, this.raw, centerX, centerY);
        let c2 = this.getColor(centerX, centerY, false, this.raw, centerX, centerY);
        let cArray1 = [c1.r, c1.g, c1.b, c1.a];
        let cArray2 = [c2.r, c2.g, c2.b, c2.a];

        // console.log(x+","+y);
        // console.log(c1);
        // console.log(c2);
        // console.log();

        // return Math.exp(-(distance2([x, y],[centerX, centerY])/(2*sigD)) );
        return Math.exp(-(distance2([x, y],[centerX, centerY])/(2*sigD)) - (distance2(cArray1, cArray2)/(2*sigR)))
        // return Math.exp( - (distance2(cArray1, cArray2)/(2*sigR)))

    }

    similar(c1, c2, threshold) {
        let o1 = new Color(c1);
        let o2 = new Color(c2);
        let diff = o1.minus1norm(o2);
        // log("--");
        // log("");
        return diff < threshold;
    }

    neighbours(x, y) {
        let nbrs = [];
        if (y - 1 > 0) {
            nbrs.push({x: x, y: y - 1});
        }
        if (x - 1 > 0) {
            nbrs.push({x: x - 1, y: y});
        }
        if (y + 1 < this.height) {
            nbrs.push({x: x, y: y + 1});
        }
        if (x + 1 < this.width) {
            nbrs.push({x: x + 1, y: y});
        }
        return nbrs;
    }

    left(){
        return 1.0 - this.visitedSum/(this.height*this.width)
    }

    hashPoint(x, y) {
        return (y * this.width + x).toString(16);
    }

    init(raw) {
        this.visited = [];
        for(let i=0;i<this.width;i++){
            let col = [];
            for(let j=0;j<this.height;j++){
                col.push(false);
            }
            this.visited.push(col);
        }

        this.setRawImg(raw);

        let promiseImg = new Promise((resolve, reject)=>{
            this.img = new Jimp(this.width, this.height, 0x00000000);
            resolve(this);
        });
        let promiseEdge =new Promise((resolve, reject)=>{
            this.edge = new Jimp(this.width, this.height, 0x00000000);
            resolve(this);
        });
        let promiseBilateral =new Promise((resolve, reject)=>{
            this.bilateral = new Jimp(this.width, this.height, 0x00000000);
            resolve(this);
        });

        return Promise.all([promiseImg, promiseEdge, promiseBilateral]);
        // return new Promise((resolve, reject) => {
        //     if (this.width > 0 && this.height > 0)
        //         this.img = new Jimp(this.width, this.height, 0x00000000, resolve);
        //     else
        //         reject();
        // })
    }

    save(path = '../resource/out/out-cartoon.png') {
        fs.unlink(path, ()=> {
            this.img.write(path);
        });
    }
}

Jimp.read("../resource/raw/test1.jpg").then(function (img) {
    // let data = img.bitmap.data;
    img.resize(400, Jimp.AUTO);
    let width = img.bitmap.width;
    let height = img.bitmap.height;
    log(width + " x " + height);
    let cartoon = new Cartoon(width, height);
    return cartoon.init(img);

}).catch(function (err) {
    console.error(err);
}).then(function (args) {
    let cartoon = args[0];
    // cartoon.transform(5);
    // cartoon.drawEdge();
    // cartoon.composite();
    // cartoon.save("../resource/out/sobel-blur-dark-sigmoid.png");
    cartoon.bilateralFilter(5);
});