let video;
let poseNet;
let poses = [];
let leftWrist, rightWrist;
let leftIndex, rightIndex;
let rightMiddle, leftMiddle, rightRing, leftRing, rightPinky, leftPinky, rightThumb, leftThumb;
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

  poseNet = ml5.poseNet(video, modelReady);
  poseNet.on("pose", function(results) {
    poses = results;
  });

  spawnItem();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  video.size(windowWidth, windowHeight);
}

function modelReady() {
  console.log("PoseNet ready");
}

function draw() {
  background(0);

  // 只將攝影機畫面左右顛倒，其餘內容正常
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

  drawHandNet();

  // 掉落單字與炸彈
  for (let i = fallingItems.length - 1; i >= 0; i--) {
    let item = fallingItems[i];
    item.y += item.speed;

    // 單字與炸彈顏色統一（深藍色），字體白色
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

    // 判斷網子是否接到
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

// 畫出手指網子
function drawHandNet() {
  if (poses.length > 0) {
    let pose = poses[0].pose;
    // 左手
    let leftThumb = pose.keypoints.find(k => k.part === "leftThumb");
    let leftIndex = pose.keypoints.find(k => k.part === "leftIndex");
    if (leftThumb && leftIndex && leftThumb.score > 0.2 && leftIndex.score > 0.2) {
      stroke(0, 180, 255, 220);
      strokeWeight(8);
      line(leftThumb.position.x, leftThumb.position.y, leftIndex.position.x, leftIndex.position.y);
      noStroke();
      fill(0, 180, 255);
      ellipse(leftThumb.position.x, leftThumb.position.y, 36, 36);
      ellipse(leftIndex.position.x, leftIndex.position.y, 36, 36);
    }
    // 右手
    let rightThumb = pose.keypoints.find(k => k.part === "rightThumb");
    let rightIndex = pose.keypoints.find(k => k.part === "rightIndex");
    if (rightThumb && rightIndex && rightThumb.score > 0.2 && rightIndex.score > 0.2) {
      stroke(0, 180, 255, 220);
      strokeWeight(8);
      line(rightThumb.position.x, rightThumb.position.y, rightIndex.position.x, rightIndex.position.y);
      noStroke();
      fill(0, 180, 255);
      ellipse(rightThumb.position.x, rightThumb.position.y, 36, 36);
      ellipse(rightIndex.position.x, rightIndex.position.y, 36, 36);
    }
  }
}

// 判斷單字是否被線段接到
function isItemCaught(x, y) {
  if (poses.length > 0) {
    let pose = poses[0].pose;
    let leftThumb = pose.keypoints.find(k => k.part === "leftThumb");
    let leftIndex = pose.keypoints.find(k => k.part === "leftIndex");
    let rightThumb = pose.keypoints.find(k => k.part === "rightThumb");
    let rightIndex = pose.keypoints.find(k => k.part === "rightIndex");

    // 判斷點到線段的距離
    let threshold = 30;
    // 左手線段
    if (leftThumb && leftIndex && leftThumb.score > 0.2 && leftIndex.score > 0.2) {
      let d = distToSegment(
        {x, y},
        {x: leftThumb.position.x, y: leftThumb.position.y},
        {x: leftIndex.position.x, y: leftIndex.position.y}
      );
      if (d < threshold) return true;
    }
    // 右手線段
    if (rightThumb && rightIndex && rightThumb.score > 0.2 && rightIndex.score > 0.2) {
      let d = distToSegment(
        {x, y},
        {x: rightThumb.position.x, y: rightThumb.position.y},
        {x: rightIndex.position.x, y: rightIndex.position.y}
      );
      if (d < threshold) return true;
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
