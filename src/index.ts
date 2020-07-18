(() => {
  const intro = document.getElementById("intro");

  intro?.addEventListener("click", function f() {
    document.body.removeChild(intro);
    intro.removeEventListener("click", f);
  });

  let clicks = 0;
  const scoreDisplay = document.getElementById("score");
  const incrementScore = () => {
    if (scoreDisplay) {
      scoreDisplay.innerText = `Clicks: ${++clicks}`;
    }
  };

  const canvas = document.createElement("canvas");
  const cellSize = 5;

  let width = window.innerWidth;
  let height = window.innerHeight;

  const size: Size = {
    width: Math.floor(width / cellSize),
    height: Math.floor(height / cellSize),
  };

  width = size.width * cellSize;
  height = size.height * cellSize;

  canvas.width = width;
  canvas.height = height;
  document.body.appendChild(canvas);

  const offscreen = canvas.transferControlToOffscreen();
  const worker = new Worker("./dist/worker.js");
  worker.postMessage({ canvas: offscreen, size, cellSize }, [offscreen]);

  worker.onmessage = (event) => {
    if (event.data.ended) {
      if (intro) {
        intro.innerText = `You destroyed this world\nin ${clicks} clicks`;
        document.body.appendChild(intro);
      }
    }
  };

  canvas.addEventListener(
    "click",
    (event) => {
      incrementScore();

      const canvasLeft = canvas.offsetLeft + canvas.clientLeft;
      const canvasTop = canvas.offsetTop + canvas.clientTop;

      worker.postMessage({
        type: "create",
        x: event.pageX - canvasLeft,
        y: event.pageY - canvasTop,
      });
    },
    false
  );
})();
