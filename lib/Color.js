class Color{
    constructor(hex){
        if(arguments.length===1){
            this.fromHex(hex)
        }
    }

    fromHex(hex){
        this.hex = hex;
    }

    minus1norm(color2){
        let hex1 = this.hex;
        let hex2 = color2.hex;
        let channel = 4;
        let sum = 0;
        while (channel > 0) {
            let diff = Math.abs((hex1 & 0xFF) - (hex2 & 0xFF));
            sum += diff;
            hex1 = hex1 >> 8;
            hex2 = hex2 >> 8;
            channel--;
        }
        return sum;
    }

    minusInfintNorm(color2){
        // ∞
        let hex1 = this.hex;
        let hex2 = color2.hex;
        let max = 0;
        let channel = 4;
        while (channel > 0) {
            let diff = Math.abs((hex1 & 0xFF) - (hex2 & 0xFF));
            max = diff > max ? diff : max;
            hex1 = hex1 >> 8;
            hex2 = hex2 >> 8;
            channel--;
        }
        // console.log("max=>"+max);
        return max;
    }
}

module.exports = Color;