let Jimp=require("jimp");

Jimp.read("e:\\test0.jpg").then(function(img){


    let b=[[0,0,img.bitmap.data[img.getPixelIndex(0,0)],
        img.bitmap.data[img.getPixelIndex(0,0)+1],
        img.bitmap.data[img.getPixelIndex(0,0)+2],
        img.bitmap.data[img.getPixelIndex(0,0)+3]]];
    let c=[];


    while(b.length>0){
        let out =b.shift();


        let neighbors=[];
        /*neighbors.push([out[0]-1,out[1]-1,img.bitmap.data[img.getPixelIndex(out[0]-1,out[1]-1)+0]
        ,img.bitmap.data[img.getPixelIndex(out[0]-1,out[1]-1)+1]
            ,img.bitmap.data[img.getPixelIndex(out[0]-1,out[1]-1)+2]
            ,img.bitmap.data[img.getPixelIndex(out[0]-1,out[1]-1)+3]
        ]);
        neighbors.push([out[0]-1,out[1],img.bitmap.data[img.getPixelIndex(out[0]-1,out[1])+0]
            ,img.bitmap.data[img.getPixelIndex(out[0]-1,out[1])+1]
            ,img.bitmap.data[img.getPixelIndex(out[0]-1,out[1])+2]
            ,img.bitmap.data[img.getPixelIndex(out[0]-1,out[1])+3]
        ]);
        neighbors.push([out[0]-1,out[1]+1,img.bitmap.data[img.getPixelIndex(out[0]-1,out[1]+1)+0]
            ,img.bitmap.data[img.getPixelIndex(out[0]-1,out[1]+1)+1]
            ,img.bitmap.data[img.getPixelIndex(out[0]-1,out[1]+1)+2]
            ,img.bitmap.data[img.getPixelIndex(out[0]-1,out[1]+1)+3]
        ]);*/
        /*neighbors.push([out[0],out[1]-1,img.bitmap.data[img.getPixelIndex(out[0],out[1]-1)+0]
            ,img.bitmap.data[img.getPixelIndex(out[0],out[1]-1)+1]
            ,img.bitmap.data[img.getPixelIndex(out[0],out[1]-1)+2]
            ,img.bitmap.data[img.getPixelIndex(out[0],out[1]-1)+3]
        ]);*/
        if(out[1]<img.bitmap.height){
            neighbors.push([out[0],out[1]+1,img.bitmap.data[img.getPixelIndex(out[0],out[1]+1)+0]
                ,img.bitmap.data[img.getPixelIndex(out[0],out[1]+1)+1]
                ,img.bitmap.data[img.getPixelIndex(out[0],out[1]+1)+2]
                ,img.bitmap.data[img.getPixelIndex(out[0],out[1]+1)+3]
            ]);
        }

        /*neighbors.push([out[0]+1,out[1]-1,img.bitmap.data[img.getPixelIndex(out[0]+1,out[1]-1)+0]
            ,img.bitmap.data[img.getPixelIndex(out[0]+1,out[1]-1)+1]
            ,img.bitmap.data[img.getPixelIndex(out[0]+1,out[1]-1)+2]
            ,img.bitmap.data[img.getPixelIndex(out[0]+1,out[1]-1)+3]
        ]);*/

        if(out[0]<img.bitmap.width){
            neighbors.push([out[0]+1,out[1],img.bitmap.data[img.getPixelIndex(out[0]+1,out[1])+0]
                ,img.bitmap.data[img.getPixelIndex(out[0]+1,out[1])+1]
                ,img.bitmap.data[img.getPixelIndex(out[0]+1,out[1])+2]
                ,img.bitmap.data[img.getPixelIndex(out[0]+1,out[1])+3]
            ]);
        }
        if(out[0]<img.bitmap.width&&out[1]<img.bitmap.height){
            neighbors.push([out[0]+1,out[1]+1,img.bitmap.data[img.getPixelIndex(out[0]+1,out[1]+1)+0]
                ,img.bitmap.data[img.getPixelIndex(out[0]+1,out[1]+1)+1]
                ,img.bitmap.data[img.getPixelIndex(out[0]+1,out[1]+1)+2]
                ,img.bitmap.data[img.getPixelIndex(out[0]+1,out[1]+1)+3]
            ]);
        }

        for(let i=0;i<neighbors.length;i++){
            //console.log(neighbors[i]);
            if(neighbors[i][0]>=0&&neighbors[i][1]>=0&&
                neighbors[i][0]<img.bitmap.width&&neighbors[i][1]<img.bitmap.height){
                //console.log(neighbors[i]);
                if(diff(out,neighbors[i])<3&&!contain(b,neighbors[i])){
                    b.push(neighbors[i]);
                }
            }

        }


        c.push(out);
        console.log(b.length);
    }
    img.paddin=padding;
    img.paddin(c);
    img.write("e:\\result_padding01.jpg");


}).catch(function (err) {
    console.error(err);
});
function diff(ab,bc){
    return Math.max(Math.abs(ab[2]-bc[2]),Math.abs(ab[3]-bc[3],Math.abs(ab[4]-bc[4])))
}
function padding(c){
    let rsum=0;
    let gsum=0;
    let bsum=0;
    let asum=0;
    for(let i=0;i<c.length;i++){
        rsum+=c[i][2];
        gsum+=c[i][3];
        bsum+=c[i][4];
        asum+=c[i][5];
    }
    let rpad=rsum/c.length;
    let gpad=gsum/c.length;
    let bpad=bsum/c.length;
    let apad=asum/c.length;
    for(let i=0;i<c.length;i++){
        let idx=this.getPixelIndex(c[i][0],c[i][1]);
        this.bitmap.data[idx+0]=rpad;
        this.bitmap.data[idx+1]=gpad;
        this.bitmap.data[idx+2]=bpad;
        this.bitmap.data[idx+3]=apad;
    }
}
function contain(a,b){
    for(let i=0;i<a.length;i++){
        if(a[i][0]==b[0]&&a[i][1]==b[1]){
            return true;
        }
    }
    return false;
}