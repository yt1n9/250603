let video;
let poseNet;
let poses = [];
let leftWrist, rightWrist;
let leftIndex, rightIndex;
let score = 0;
let gameOver = false;

let eduWords = ["AI", "VR", "AR", "Coding", "STEAM", "EdTech", "IoT", "BigData"];
let fakeWords = ["Cat", "Dog", "Apple", "Car", "Tree", "Book", "Fish"];
let fallingItems = [];
let bombImg; // 可自行加入 bomb 圖片
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
    return;
  }

  drawKeypoints();

  // 掉落單字與炸彈
  for (let i = fallingItems.length - 1; i >= 0; i--) {
    let item = fallingItems[i];
    item.y += item.speed;

    // 畫單字或炸彈
    textAlign(CENTER, CENTER);
    if (item.type === "bomb") {
      textSize(60);
      text(bombEmoji, item.x, item.y);
    } else {
      textSize(48);
      fill(item.type === "edu" ? color(255, 204, 0) : color(180));
      text(item.word, item.x, item.y);
    }

    // 判斷雙手食指是否碰到
    if (leftIndex && rightIndex) {
      let d1 = dist(leftIndex.position.x, leftIndex.position.y, item.x, item.y);
      let d2 = dist(rightIndex.position.x, rightIndex.position.y, item.x, item.y);
      if (d1 < 60 || d2 < 60) {
        if (item.type === "bomb") {
          gameOver = true;
        } else if (item.type === "edu") {
          score++;
        }
        fallingItems.splice(i, 1);
        continue;
      }
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
}

function drawKeypoints() {
  if (poses.length > 0) {
    let pose = poses[0].pose;
    leftWrist = pose.leftWrist;
    rightWrist = pose.rightWrist;
    leftIndex = pose.keypoints.find(k => k.part === "leftIndex");
    rightIndex = pose.keypoints.find(k => k.part === "rightIndex");

    fill(0, 255, 0);
    noStroke();
    ellipse(leftWrist.x, leftWrist.y, 30, 30);
    ellipse(rightWrist.x, rightWrist.y, 30, 30);

    // 畫出左右食指
    if (leftIndex && leftIndex.score > 0.2) {
      fill(255, 0, 0);
      ellipse(leftIndex.position.x, leftIndex.position.y, 30, 30);
    }
    if (rightIndex && rightIndex.score > 0.2) {
      fill(255, 0, 0);
      ellipse(rightIndex.position.x, rightIndex.position.y, 30, 30);
    }
  }
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
