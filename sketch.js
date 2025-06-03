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
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  handpose = ml5.handpose(video, modelReady);
  handpose.on("predict", function(results) {
    predictions = results;
  });

  spawnItem();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  video.size(windowWidth, windowHeight);
}

function modelReady() {
  console.log("Handpose ready");
}

function draw() {
  background(0);

  // 左右顛倒攝影機畫面
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  // 螢幕最上方顯示「淡江教育科技系」
  fill(255); // 白色字體
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

  // 畫出手指點與大拇指-食指線
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
      fill(255); // 白色字體
      text(item.word, item.x, item.y);
    }

    // 判斷線段是否接到
    if (isItemCaught(item.x, item.y)) {
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

// 畫出手指點與大拇指-食指線
function drawKeypoints() {
  if (predictions.length > 0) {
    let prediction = predictions[0];
    let keypoints = prediction.landmarks;

    // 畫出所有關鍵點
    for (let keypoint of keypoints) {
      fill(0, 255, 0);
      noStroke();
      ellipse(keypoint[0], keypoint[1], 10, 10);
    }

    // 只連大拇指(4)與食指(8)
    let thumbTip = keypoints[4];
    let indexTip = keypoints[8];
    stroke(0, 180, 255);
    strokeWeight(8);
    line(thumbTip[0], thumbTip[1], indexTip[0], indexTip[1]);
  }
}

// 判斷單字是否被大拇指-食指線段接到
function isItemCaught(x, y) {
  if (predictions.length > 0) {
    let keypoints = predictions[0].landmarks;
    let thumbTip = keypoints[4];
    let indexTip = keypoints[8];
    if (thumbTip && indexTip) {
      let d = distToSegment(
        {x, y},
        {x: thumbTip[0], y: thumbTip[1]},
        {x: indexTip[0], y: indexTip[1]}
      );
      if (d < 30) return true;
    }
  }
  return false;
}

// 計算點到線段的最短距離
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
