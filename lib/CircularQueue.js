class CircularQueue{
    constructor(size){
        this.array = new Array(size);
        this.size = size;
        this.start = 0;
        this.end = 0;
    }

    isEmpty(){
        return (this.end-this.start)%this.size === 0;
    }

    put(elem){
        this.array[this.end%this.size] = elem;
        this.end = this.end + 1;
        while(this.end - this.start>this.size){
            this.end -= this.size;
        }
        // console.log("end "+this.end);
        // this.print();
    }

    get(){
        let elem = this.array[this.start%this.size];
        if(this.start<this.end){
            this.start = this.start+1;
            // console.log("start "+this.start);
            // this.print();
            if(this.start>this.size){
                this.start -= this.size;
                this.end -= this.size;
            }
            return elem;
        }else{
            return null;
        }
    }

    print(){
        let buff = [];
        for(let i=this.start;i<this.end;i++){
            buff.push(this.array[i%this.size]);
        }
        // console.log(buff);
    }

    clear(){
        this.start = 0;
        this.end = 0;
    }
}

// let queue = new CircularQueue(5);
// queue.put(1);
// queue.put(2);
// queue.put(2);
// queue.put(3);
// queue.put(4);
// queue.put(5);
// queue.put(6);
// queue.put(7);
// queue.put(8);
// queue.get();
module.exports = CircularQueue;