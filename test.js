let Cartoonlization = require("./index");
let c = new Cartoonlization();
c.init("./resource/raw/test7.jpg").then((cs)=>{
    let c = cs[0];
    c.make();
    c.toFile("./test.png");
});