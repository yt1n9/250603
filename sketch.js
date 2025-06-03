let video;
let handpose;
let predictions = [];
let score = 0;
let gameOver = false;

let eduWords = ["AI", "VR", "AR", "Coding", "STEAM", "EdTech", "IoT", "BigData"];
let fakeWords = ["Cat", "Dog", "Apple", "Car", "Tree", "Book", "Fish"];
let fallingItems = [];
let bombEmoji = "💣"; // 若無 bomb 圖片可用 emoji

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO, () => {
    video.size(width, height); // 確保 video 與 canvas 完全一致
  });
  video.hide();

  handpose = ml5.handpose(video, modelReady);
  handpose.on("predict", function(results) {
    predictions = results;
  });

  spawnItem();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  video.size(width, height); // 同步 video 與 canvas
}

function modelReady() {
  console.log("Handpose ready");
}

function draw() {
  // background
  background(0);

  // 左右顛倒攝影機畫面
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  // 螢幕最上方顯示「淡江教育科技系」
  fill(255);
  textSize(48);
  textAlign(CENTER, TOP);
  text("淡江教育科技系", width / 2, 10);

  if (gameOver) {
    fill(255, 0, 0, 200);
    textSize(80);
    textAlign(CENTER, CENTER);
    text("遊戲結束", width / 2, height / 2);
    textSize(40);
    text("分數: " + score, width / 2, height / 2 + 80);
    return;
  }

  // 畫出手指點
  drawKeypoints();

  // 掉落單字與炸彈
  for (let i = fallingItems.length - 1; i >= 0; i--) {
    let item = fallingItems[i];
    item.y += item.speed;

    textAlign(CENTER, CENTER);
    if (item.type === "bomb") {
      textSize(60);
      fill(30, 30, 120);
      text(bombEmoji, item.x, item.y);
    } else {
      textSize(48);
      fill(255);
      text(item.word, item.x, item.y);
    }

    // 判斷食指是否碰到
    if (isItemTouched(item.x, item.y)) {
      if (item.type === "bomb") {
        gameOver = true;
      } else if (item.type === "edu") {
        score++;
      } else if (item.type === "fake") {
        score--;
      }
      fallingItems.splice(i, 1);
      continue;
    }

    // 超出畫面移除
    if (item.y > height + 50) {
      fallingItems.splice(i, 1);
    }
  }

  // 顯示分數
  fill(255);
  textSize(32);
  textAlign(LEFT, TOP);
  text("分數: " + score, 20, 70);

  // 定時產生新物件
  if (frameCount % 60 === 0 && !gameOver) {
    spawnItem();
  }
}

// 畫出所有手指點
function drawKeypoints() {
  if (predictions.length > 0) {
    let keypoints = predictions[0].landmarks;
    let videoW = video.width;
    let videoH = video.height;

    for (let keypoint of keypoints) {
      let x = keypoint[0] * width / videoW;
      let y = keypoint[1] * height / videoH;
      let mx = width - x;
      let my = y;
      fill(0, 255, 0);
      noStroke();
      ellipse(mx, my, 10, 10);
    }

    // 強調食指
    let indexTip = keypoints[8];
    let ix = width - (indexTip[0] * width / videoW);
    let iy = indexTip[1] * height / videoH;
    fill(255, 0, 0);
    noStroke();
    ellipse(ix, iy, 20, 20);
  } else {
    // 沒有偵測到手時顯示提示
    fill(255, 0, 0);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("請將手放到鏡頭前", width / 2, height / 2);
  }
}

// 判斷單字是否被食指碰到（鏡像）
function isItemTouched(x, y) {
  if (predictions.length > 0) {
    let keypoints = predictions[0].landmarks;
    let videoW = video.width;
    let videoH = video.height;
    let indexTip = keypoints[8];
    if (indexTip) {
      let ix = width - (indexTip[0] * width / videoW);
      let iy = indexTip[1] * height / videoH;
      let d = dist(x, y, ix, iy);
      if (d < 40) return true; // 40 可依需求調整
    }
  }
  return false;
}

// 計算點到線段的最短距離（已不再使用，可保留）
function distToSegment(p, v, w) {
  let l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
  if (l2 === 0) return dist(p.x, p.y, v.x, v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = max(0, min(1, t));
  return dist(p.x, p.y, v.x + t * (w.x - v.x), v.y + t * (w.y - v.y));
}

// 產生新掉落物
function spawnItem() {
  let r = random();
  let item = {};
  item.x = random(100, width - 100);
  item.y = -50;
  item.speed = random(4, 8);

  if (r < 0.15) {
    // 15% 炸彈
    item.type = "bomb";
    item.word = "";
  } else if (r < 0.55) {
    // 40% 教育科技單字
    item.type = "edu";
    item.word = random(eduWords);
  } else {
    // 45% 假單字
    item.type = "fake";
    item.word = random(fakeWords);
  }
  fallingItems.push(item);
}
