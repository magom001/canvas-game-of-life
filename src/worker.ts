const getRandomInt = (max: number) => {
  return Math.floor(Math.random() * Math.floor(max));
};

type Size = { width: number; height: number };

enum Cell {
  Dead,
  Alive,
}

const CellLabels: Record<Cell, string> = {
  [Cell.Dead]: "D",
  [Cell.Alive]: "A",
};

type World = Uint8Array;

class GameOfLife {
  private size: Size;
  private world1: World;
  private world2: World;
  private currentWorld: World;
  private nextWorld: World;
  private isDeadWorld: boolean;
  private _onDeadWorldCallback?: () => void;

  constructor(size: Size, initialWorld: ArrayBuffer, onDeadWorld?: () => void) {
    this.size = size;

    console.assert(
      initialWorld.byteLength === size.width * size.height,
      "World size and data size do not match"
    );

    this._onDeadWorldCallback = onDeadWorld;
    this.isDeadWorld = false;
    this.world1 = new Uint8Array(initialWorld);
    this.world2 = new Uint8Array(new ArrayBuffer(this.world1.length));
    this.currentWorld = this.world1;
    this.nextWorld = this.world2;
  }

  private xyToIndex(x: number, y: number): number {
    return x + y * this.size.width;
  }

  private indexToXy(index: number): number[] {
    const x = index % this.size.width;
    const y = Math.floor(index / this.size.width);

    return [x, y];
  }

  public getNextGeneration(fn?: (x: number, y: number, state: Cell) => void) {
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

  private countAliveNeighbours(i: number): number {
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

  private getNextCellValue(i: number): Cell {
    const cell = this.currentWorld[i];
    const liveCount = this.countAliveNeighbours(i);

    if (
      (cell === Cell.Alive && (liveCount === 2 || liveCount === 3)) ||
      (cell === Cell.Dead && liveCount === 3)
    ) {
      return Cell.Alive;
    }

    return Cell.Dead;
  }

  public getCellAt(x: number, y: number): Cell | undefined {
    if (x < 0 || y < 0 || x >= this.size.width || y >= this.size.height) {
      return undefined;
    }

    const index = this.xyToIndex(x, y);

    return this.currentWorld[index];
  }

  public setCellAt(x: number, y: number, cell: Cell): void {
    console.assert(
      x >= 0 || y >= 0 || x < this.size.width || y < this.size.height
    );

    const index = this.xyToIndex(x, y);
    this.currentWorld[index] = cell;
  }

  public print() {
    let x;
    let y;

    for (x = 0; x < this.size.width; ++x) {
      const row = [];
      for (y = 0; y < this.size.height; ++y) {
        row.push(CellLabels[this.getCellAt(x, y) as Cell]);
      }

      console.log(row.join(" "));
    }

    console.log(new Array(this.size.width).fill("-").join(" "));
  }

  public write(fn: (x: number, y: number, state: Cell) => void) {
    let x;
    let y;

    for (x = 0; x < this.size.width; ++x) {
      for (y = 0; y < this.size.height; ++y) {
        const cell = this.getCellAt(x, y) as Cell;
        fn(x, y, cell);
      }
    }
  }
}

let gameOfLife: GameOfLife;
let cellSize: number;
let ended = false;

onmessage = function (event) {
  if (event.data.canvas) {
    const canvas = event.data.canvas as HTMLCanvasElement;
    const size = event.data.size;
    cellSize = event.data.cellSize;

    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
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

    const onNextCellValue = (x: number, y: number, cell: Cell) => {
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
