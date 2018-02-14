# Cartoonlize Your Photo

A tool for converting photos into cartoon-like image. Written in nodejs, depended on [Jimp](https://github.com/oliver-moran/jimp).


![raw](https://github.com/AssKicker0214/CartoonPhoto/raw/master/resource/raw/test7.jpg)
![cartoonlized](https://github.com/AssKicker0214/CartoonPhoto/raw/master/test.png)

## Installation
`npm install photo2cartoon`

## Usage
### Basic Usage 
``` ecmascript 6
let Cartoonlization = require("photo2cartoon");
let c = new Cartoonlization();
c.init("./resource/raw/test7.jpg").then((cs)=>{
    let c = cs[0];
    c.make();
    c.toFile("./test.png");
});

```
### With Customized Option
A default `opt` will put into use, if not specified another.

You can pass a customized option to constructor.
```ecmascript 6
let c = new Cartoonlization(opt)
```

Below is the default `opt`:
``` json
let DEFAULT_OPT = {
    blurMode: {
        name: "bilateral",
        radius: 5
    },
    edgeWeakening: 50,
    resize: true
}
```
#### blurMode.name:
`bilateral`: use bilateral filter to blur. Cost longer time.
`gaussian`: perform gaussian blur.
`fast`: perform mean-value filter

#### resize
Resize the input image to 400px width, and scale the height accordingly.



