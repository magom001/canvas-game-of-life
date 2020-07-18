"use strict";
const getRandomInt = (max) => {
    return Math.floor(Math.random() * Math.floor(max));
};
var Cell;
(function (Cell) {
    Cell[Cell["Dead"] = 0] = "Dead";
    Cell[Cell["Alive"] = 1] = "Alive";
})(Cell || (Cell = {}));
const CellLabels = {
    [Cell.Dead]: "D",
    [Cell.Alive]: "A",
};
class GameOfLife {
    constructor(size, initialWorld, onDeadWorld) {
        this.size = size;
        console.assert(initialWorld.byteLength === size.width * size.height, "World size and data size do not match");
        this._onDeadWorldCallback = onDeadWorld;
        this.isDeadWorld = false;
        this.world1 = new Uint8Array(initialWorld);
        this.world2 = new Uint8Array(new ArrayBuffer(this.world1.length));
        this.currentWorld = this.world1;
        this.nextWorld = this.world2;
    }
    xyToIndex(x, y) {
        return x + y * this.size.width;
    }
    indexToXy(index) {
        const x = index % this.size.width;
        const y = Math.floor(index / this.size.width);
        return [x, y];
    }
    getNextGeneration(fn) {
        let i;
        this.isDeadWorld = true;
        for (i = 0; i < this.currentWorld.length; ++i) {
            this.nextWorld[i] = this.getNextCellValue(i);
            if (this.nextWorld[i] === Cell.Alive) {
                this.isDeadWorld = false;
            }
            if (fn) {
                const [x, y] = this.indexToXy(i);
                fn(x, y, this.nextWorld[i]);
            }
        }
        const tmp = this.currentWorld;
        this.currentWorld = this.nextWorld;
        this.nextWorld = tmp;
        if (this.isDeadWorld && this._onDeadWorldCallback) {
            this._onDeadWorldCallback();
        }
    }
    countAliveNeighbours(i) {
        let count = 0;
        const [x, y] = this.indexToXy(i);
        for (const deltaX of [-1, 0, 1]) {
            for (const deltaY of [-1, 0, 1]) {
                if (!deltaX && !deltaY) {
                    continue;
                }
                const cell = this.getCellAt(x + deltaX, y + deltaY);
                if (cell && cell === Cell.Alive) {
                    count++;
                }
            }
        }
        return count;
    }
    getNextCellValue(i) {
        const cell = this.currentWorld[i];
        const liveCount = this.countAliveNeighbours(i);
        if ((cell === Cell.Alive && (liveCount === 2 || liveCount === 3)) ||
            (cell === Cell.Dead && liveCount === 3)) {
            return Cell.Alive;
        }
        return Cell.Dead;
    }
    getCellAt(x, y) {
        if (x < 0 || y < 0 || x >= this.size.width || y >= this.size.height) {
            return undefined;
        }
        const index = this.xyToIndex(x, y);
        return this.currentWorld[index];
    }
    setCellAt(x, y, cell) {
        console.assert(x >= 0 || y >= 0 || x < this.size.width || y < this.size.height);
        const index = this.xyToIndex(x, y);
        this.currentWorld[index] = cell;
    }
    print() {
        let x;
        let y;
        for (x = 0; x < this.size.width; ++x) {
            const row = [];
            for (y = 0; y < this.size.height; ++y) {
                row.push(CellLabels[this.getCellAt(x, y)]);
            }
            console.log(row.join(" "));
        }
        console.log(new Array(this.size.width).fill("-").join(" "));
    }
    write(fn) {
        let x;
        let y;
        for (x = 0; x < this.size.width; ++x) {
            for (y = 0; y < this.size.height; ++y) {
                const cell = this.getCellAt(x, y);
                fn(x, y, cell);
            }
        }
    }
}
let gameOfLife;
let cellSize;
let ended = false;
onmessage = function (event) {
    if (event.data.canvas) {
        const canvas = event.data.canvas;
        const size = event.data.size;
        cellSize = event.data.cellSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("Unable to get canvas 2d context");
        }
        ctx.fillStyle = "black";
        const buffer = new ArrayBuffer(size.width * size.height);
        gameOfLife = new GameOfLife(size, buffer, () => {
            ended = true;
            console.log("asdfasfsafsfas");
            // @ts-ignore
            postMessage({ ended: true });
        });
        for (let x = 0; x < size.width; ++x) {
            for (let y = 0; y < size.height; ++y) {
                const rnd = getRandomInt(2);
                gameOfLife.setCellAt(x, y, rnd);
            }
        }
        const onNextCellValue = (x, y, cell) => {
            if (cell === Cell.Alive) {
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        };
        function draw() {
            if (!ended) {
                requestAnimationFrame(draw);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                gameOfLife.getNextGeneration(onNextCellValue);
            }
        }
        draw();
    }
    if (event.data.type === "create") {
        const { x, y } = event.data;
        const gameX = Math.floor(x / cellSize);
        const gameY = Math.floor(y / cellSize);
        gameOfLife.setCellAt(gameX, gameY, Cell.Alive);
    }
};
//# sourceMappingURL=worker.js.map