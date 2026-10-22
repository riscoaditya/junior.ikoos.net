const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('c:/xampp/htdocs/IKOOS/junior.ikoos.net/frontend/public/assets/stages/stage-7/manifest.json', 'utf8'));

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

for (const level of manifest.levels.filter((level) => level.id !== 'level-1')) {
  const tileW = level.route.tileSize.width;
  const tileH = level.route.tileSize.height;
  const offset = level.route.actorFootOffset;
  const boxes = level.route.points.map((point, index) => ({
    index: index + 1,
    x: point.x - tileW / 2,
    y: point.y + offset - tileH / 2,
    w: tileW,
    h: tileH,
    actor: { x: point.x, y: point.y },
    ground: { x: point.x, y: point.y + offset },
    hint: point.hint,
  }));
  console.log('\n' + level.id, 'tiles', boxes.length, 'size', tileW + 'x' + tileH);
  let found = false;
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      if (overlaps(boxes[i], boxes[j])) {
        found = true;
        const dx = Math.abs(boxes[i].ground.x - boxes[j].ground.x);
        const dy = Math.abs(boxes[i].ground.y - boxes[j].ground.y);
        console.log(`  OVERLAP ${boxes[i].index}-${boxes[j].index} dx=${dx} dy=${dy}`, boxes[i].hint, boxes[j].hint);
      }
    }
  }
  if (!found) console.log('  no overlaps');
  boxes.forEach((box) => {
    const oob = box.x < 0 || box.y < 0 || box.x + box.w > 1500 || box.y + box.h > 1000;
    if (oob) console.log('  OOB tile', box.index, box);
  });
}
