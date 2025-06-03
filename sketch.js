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
  // 左右顛倒鏡像，所有內容都放在 push/pop 之間
  push();
  translate(width, 0);
  scale(-1, 1);

  image(video, 0, 0, width, height);

  // 螢幕最上方顯示「淡江教育科技系」
  fill(0, 102, 204);
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
    pop();
    return;
  }

  drawHandNet();

  // 掉落單字與炸彈
  for (let i = fallingItems.length - 1; i >= 0; i--) {
    let item = fallingItems[i];
    item.y += item.speed;

    // 單字與炸彈顏色統一
    textAlign(CENTER, CENTER);
    fill(30, 30, 120);
    if (item.type === "bomb") {
      textSize(60);
      text(bombEmoji, item.x, item.y);
    } else {
      textSize(48);
      text(item.word, item.x, item.y);
    }

    // 判斷網子是否接到
    if (isItemCaught(item.x, item.y)) {
      if (item.type === "bomb") {
        gameOver = true;
      } else if (item.type === "edu") {
        score++;
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
  fill(0);
  textSize(32);
  textAlign(LEFT, TOP);
  text("分數: " + score, 20, 70);

  // 定時產生新物件
  if (frameCount % 60 === 0 && !gameOver) {
    spawnItem();
  }

  pop();
}

// 畫出手指網子
function drawHandNet() {
  if (poses.length > 0) {
    let pose = poses[0].pose;
    // 只取10個手指點
    let fingerParts = [
      "leftIndex", "rightIndex", "leftMiddle", "rightMiddle",
      "leftRing", "rightRing", "leftPinky", "rightPinky",
      "leftThumb", "rightThumb"
    ];
    let points = [];
    fingerParts.forEach(part => {
      let pt = pose.keypoints.find(k => k.part === part);
      if (pt && pt.score > 0.2) {
        points.push(pt.position);
      }
    });

    // 畫網子（多邊形）
    if (points.length > 2) {
      stroke(0, 180, 255, 220);
      strokeWeight(8);
      fill(0, 180, 255, 80);
      beginShape();
      for (let p of points) {
        vertex(p.x, p.y);
      }
      endShape(CLOSE);
    }

    // 畫出每個手指點
    noStroke();
    fill(0, 180, 255);
    for (let p of points) {
      ellipse(p.x, p.y, 36, 36);
    }
  }
}

// 判斷單字是否被網子接到
function isItemCaught(x, y) {
  if (poses.length > 0) {
    let pose = poses[0].pose;
    let fingers = [
      pose.keypoints.find(k => k.part === "leftIndex"),
      pose.keypoints.find(k => k.part === "rightIndex"),
      pose.keypoints.find(k => k.part === "leftMiddle"),
      pose.keypoints.find(k => k.part === "rightMiddle"),
      pose.keypoints.find(k => k.part === "leftRing"),
      pose.keypoints.find(k => k.part === "rightRing"),
      pose.keypoints.find(k => k.part === "leftPinky"),
      pose.keypoints.find(k => k.part === "rightPinky"),
      pose.keypoints.find(k => k.part === "leftThumb"),
      pose.keypoints.find(k => k.part === "rightThumb"),
    ];
    // 只要有一個手指點在單字附近就算接到
    for (let f of fingers) {
      if (f && f.score > 0.2) {
        if (dist(f.position.x, f.position.y, x, y) < 40) {
          return true;
        }
      }
    }
    // 額外判斷：如果網子多邊形包住單字
    let points = fingers.filter(f => f && f.score > 0.2).map(f => f.position);
    if (points.length > 2 && pointInPolygon({x, y}, points)) {
      return true;
    }
  }
  return false;
}

// 點是否在多邊形內
function pointInPolygon(point, vs) {
  let x = point.x, y = point.y;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i].x, yi = vs[i].y;
    let xj = vs[j].x, yj = vs[j].y;
    let intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi + 0.00001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
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
