class TimeCost{
    constructor(){
        this.previous = new Date().getTime();
    }

    tik(msg=""){
        let date = new Date().getTime();
        let diff = (date-this.previous)/1000;
        console.log(`${diff} => [${msg}]`)
        this.previous = date;
    }
}

module.exports = TimeCost;