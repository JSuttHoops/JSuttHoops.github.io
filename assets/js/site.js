const heatmap = document.querySelector(".heatmap-layer");
const supportsFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const allowsMotion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (heatmap && supportsFinePointer && allowsMotion) {
  let cells = [];
  let columns = 0;
  let cellSize = 28;
  let lastIndex = -1;

  const buildGrid = () => {
    const viewportWidth = document.documentElement.clientWidth;
    cellSize = viewportWidth >= 1100 ? 30 : 26;
    columns = Math.ceil(viewportWidth / cellSize);
    const documentHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      window.innerHeight
    );
    const rows = Math.ceil(documentHeight / cellSize);
    const count = columns * rows;

    heatmap.style.setProperty("--heatmap-cols", columns);
    heatmap.style.setProperty("--heatmap-cell-size", `${cellSize}px`);
    heatmap.style.height = `${rows * cellSize}px`;
    heatmap.replaceChildren();

    const fragment = document.createDocumentFragment();
    cells = Array.from({ length: count }, () => {
      const cell = document.createElement("span");
      cell.className = "heatmap-cell";
      fragment.append(cell);
      return cell;
    });

    heatmap.append(fragment);
  };

  const warmCell = (index) => {
    const cell = cells[index];

    if (!cell) {
      return;
    }

    cell.classList.add("is-hot");
    window.setTimeout(() => cell.classList.remove("is-hot"), 460);
  };

  const paintAt = (event) => {
    const column = Math.floor(event.pageX / cellSize);
    const row = Math.floor(event.pageY / cellSize);
    const index = row * columns + column;

    if (index === lastIndex) {
      return;
    }

    lastIndex = index;
    warmCell(index);
    warmCell(index - 1);
    warmCell(index + 1);
    warmCell(index - columns);
    warmCell(index + columns);
  };

  buildGrid();
  window.addEventListener("resize", buildGrid);
  window.addEventListener("load", buildGrid);
  window.addEventListener("pointermove", paintAt);
}
