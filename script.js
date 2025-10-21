// Simple Pong game
// Left paddle: player (mouse + arrow keys)
// Right paddle: computer AI
// Ball bounces off walls and paddles, scoreboard increments on score

(function () {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const scoreboardPlayer = document.getElementById('playerScore');
  const scoreboardComputer = document.getElementById('computerScore');
  const restartBtn = document.getElementById('restartBtn');

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // Game objects
  const paddleWidth = 12;
  const paddleHeight = 100;
  const paddleOffset = 20;

  const player = {
    x: paddleOffset,
    y: (HEIGHT - paddleHeight) / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 7,
    dy: 0 // keyboard movement -1/0/1
  };

  const computer = {
    x: WIDTH - paddleOffset - paddleWidth,
    y: (HEIGHT - paddleHeight) / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 5
  };

  const ball = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    radius: 8,
    speed: 6,
    vx: 6 * (Math.random() > 0.5 ? 1 : -1),
    vy: (Math.random() * 4 - 2)
  };

  let playerScore = 0;
  let computerScore = 0;
  let running = true;
  let lastTime = performance.now();

  function resetBall(directionTo = null) {
    ball.x = WIDTH / 2;
    ball.y = HEIGHT / 2;
    ball.speed = 6;
    const dir = directionTo === 'left' ? -1 : directionTo === 'right' ? 1 : (Math.random() > 0.5 ? 1 : -1);
    ball.vx = ball.speed * dir;
    ball.vy = (Math.random() * 4 - 2);
  }

  function drawRect(x, y, w, h, color = '#e6eef8') {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function drawCircle(x, y, r, color = '#fff') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawNet() {
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    const step = 18;
    for (let i = step / 2; i < HEIGHT; i += step) {
      ctx.fillRect(WIDTH / 2 - 1, i, 2, step / 2);
    }
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function update(dt) {
    if (!running) return;

    // Player keyboard movement
    if (player.dy !== 0) {
      player.y += player.dy * player.speed;
    }

    // Keep player in bounds
    player.y = clamp(player.y, 0, HEIGHT - player.height);

    // Computer AI: follow the ball with limited speed
    const paddleCenter = computer.y + computer.height / 2;
    const trackSpeed = computer.speed * dt * 60 / 16.67; // scale with dt
    if (ball.y < paddleCenter - 10) {
      computer.y -= trackSpeed;
    } else if (ball.y > paddleCenter + 10) {
      computer.y += trackSpeed;
    }
    computer.y = clamp(computer.y, 0, HEIGHT - computer.height);

    // Move ball
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Top/bottom collision
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.vy = -ball.vy;
    } else if (ball.y + ball.radius > HEIGHT) {
      ball.y = HEIGHT - ball.radius;
      ball.vy = -ball.vy;
    }

    // Paddle collisions
    // Player paddle
    if (ball.x - ball.radius < player.x + player.width) {
      if (ball.y > player.y && ball.y < player.y + player.height) {
        // Hit player paddle
        ball.x = player.x + player.width + ball.radius;
        reflectOffPaddle(player);
      } else if (ball.x - ball.radius < 0) {
        // Player missed -> computer scores
        computerScore++;
        scoreboardComputer.textContent = computerScore;
        running = false;
        setTimeout(() => {
          resetBall('right');
          running = true;
        }, 700);
      }
    }

    // Computer paddle
    if (ball.x + ball.radius > computer.x) {
      if (ball.y > computer.y && ball.y < computer.y + computer.height) {
        // Hit computer paddle
        ball.x = computer.x - ball.radius;
        reflectOffPaddle(computer);
      } else if (ball.x + ball.radius > WIDTH) {
        // Computer missed -> player scores
        playerScore++;
        scoreboardPlayer.textContent = playerScore;
        running = false;
        setTimeout(() => {
          resetBall('left');
          running = true;
        }, 700);
      }
    }

    // Slightly increase ball speed over time for challenge
    const maxSpeed = 15;
    const speedIncrease = 0.0008 * dt * 60; // small ramp
    ball.speed = clamp(Math.hypot(ball.vx, ball.vy) + speedIncrease, 3.5, maxSpeed);
    const lastSignX = Math.sign(ball.vx) || 1;
    const vAngle = Math.atan2(ball.vy, Math.abs(ball.vx));
    ball.vx = lastSignX * Math.cos(vAngle) * ball.speed;
    ball.vy = Math.sin(vAngle) * ball.speed;
  }

  // Reflect ball off a paddle, change vy based on hit position to create angles
  function reflectOffPaddle(paddle) {
    // relative position between -1 (top) and 1 (bottom)
    const relativeY = (ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
    const bounceAngle = relativeY * (Math.PI / 3); // up to 60 degrees
    const direction = (paddle === player) ? 1 : -1;
    const speed = Math.min(ball.speed * 1.05, 18); // slightly increase speed
    ball.vx = Math.cos(bounceAngle) * speed * direction;
    ball.vy = Math.sin(bounceAngle) * speed;
  }

  function render() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // court background (already via CSS), but we can add subtle overlay
    // draw net
    drawNet();

    // paddles
    drawRect(player.x, player.y, player.width, player.height, '#dcefff');
    drawRect(computer.x, computer.y, computer.width, computer.height, '#dcefff');

    // ball
    drawCircle(ball.x, ball.y, ball.radius, '#fff');

    // optionally draw some info
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(WIDTH / 2 - 140, HEIGHT / 2 - 36, 280, 72);
      ctx.fillStyle = '#fff';
      ctx.font = '18px system-ui, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Point scored! Resetting...', WIDTH / 2, HEIGHT / 2 + 6);
    }
  }

  function gameLoop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    render();
    requestAnimationFrame(gameLoop);
  }

  // Input handlers
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      player.dy = -1;
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      player.dy = 1;
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      player.dy = 0;
      e.preventDefault();
    }
  });

  // Mouse movement over canvas controls player paddle center
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    player.y = clamp(mouseY - player.height / 2, 0, HEIGHT - player.height);
  });

  // Touch support (vertical dragging)
  canvas.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length > 0) {
      const rect = canvas.getBoundingClientRect();
      const touchY = e.touches[0].clientY - rect.top;
      player.y = clamp(touchY - player.height / 2, 0, HEIGHT - player.height);
    }
    e.preventDefault();
  }, { passive: false });

  restartBtn.addEventListener('click', () => {
    playerScore = 0;
    computerScore = 0;
    scoreboardPlayer.textContent = playerScore;
    scoreboardComputer.textContent = computerScore;
    resetBall();
    player.y = (HEIGHT - player.height) / 2;
    computer.y = (HEIGHT - computer.height) / 2;
    running = true;
  });

  // Start the game
  resetBall();
  scoreboardPlayer.textContent = playerScore;
  scoreboardComputer.textContent = computerScore;
  requestAnimationFrame(gameLoop);
})();