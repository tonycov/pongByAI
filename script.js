// Colorful Football Pong
// Left paddle: player (mouse + arrow keys)
// Right paddle: computer AI
// Visuals: football (soccer ball) and football boots as paddles, bright multicolor theme

(function () {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const scoreboardPlayer = document.getElementById('playerScore');
  const scoreboardComputer = document.getElementById('computerScore');
  const restartBtn = document.getElementById('restartBtn');

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // Game objects
  const paddleWidth = 18;
  const paddleHeight = 110;
  const paddleOffset = 22;

  const player = {
    x: paddleOffset,
    y: (HEIGHT - paddleHeight) / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 8,
    dy: 0 // keyboard movement -1/0/1
  };

  const computer = {
    x: WIDTH - paddleOffset - paddleWidth,
    y: (HEIGHT - paddleHeight) / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 5.2
  };

  const ball = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    radius: 12,
    speed: 6.5,
    vx: 6.5 * (Math.random() > 0.5 ? 1 : -1),
    vy: (Math.random() * 4 - 2)
  };

  let playerScore = 0;
  let computerScore = 0;
  let running = true;
  let lastTime = performance.now();

  function resetBall(directionTo = null) {
    ball.x = WIDTH / 2;
    ball.y = HEIGHT / 2;
    ball.speed = 6.5;
    const dir = directionTo === 'left' ? -1 : directionTo === 'right' ? 1 : (Math.random() > 0.5 ? 1 : -1);
    ball.vx = ball.speed * dir;
    ball.vy = (Math.random() * 4 - 2);
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  // Draw a stylized football (soccer ball) with black patches
  function drawFootball(x, y, r) {
    // main white circle with subtle shading
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.2, x, y, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#f0f0f0');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // black patch helper - draw simple pentagon-like patches around
    ctx.fillStyle = '#0d0d0d';
    ctx.strokeStyle = '#0d0d0d';
    ctx.lineWidth = 1;

    // draw center patch
    drawPolygon(ctx, x, y - r * 0.12, r * 0.32, 5, -Math.PI / 2);

    // surrounding patches (approx)
    const offsets = [
      [-r * 0.52, -r * 0.02],
      [-r * 0.18, r * 0.46],
      [r * 0.18, r * 0.46],
      [r * 0.52, 0.0],
      [0.0, -r * 0.62]
    ];
    const rotations = [-0.4, 0.8, -0.6, 0.2, -1.2];
    for (let i = 0; i < offsets.length; i++) {
      const ox = x + offsets[i][0];
      const oy = y + offsets[i][1];
      drawPolygon(ctx, ox, oy, r * 0.22, 5, rotations[i]);
    }

    // thin seam lines for extra realism
    ctx.strokeStyle = 'rgba(0,0,0,0.16)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.72, -0.9, 0.6);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, r * 0.72, 0.6, 2.2);
    ctx.stroke();
  }

  // draw a regular polygon at cx,cy
  function drawPolygon(ctx, cx, cy, radius, sides, rotation = 0) {
    if (sides < 3) return;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const theta = (i / sides) * (Math.PI * 2) + rotation;
      const px = cx + Math.cos(theta) * radius;
      const py = cy + Math.sin(theta) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Draw a stylized football boot. Visual only: collision uses rectangle.
  function drawBoot(x, y, w, h, colorPrimary = '#ff4d6d') {
    ctx.save();
    ctx.translate(x, y);

    // main boot body (rounded rect)
    const toeWidth = w * 0.36;
    const heelCurve = w * 0.18;
    ctx.beginPath();
    ctx.moveTo(0 + heelCurve, 0);
    ctx.quadraticCurveTo(0, 0, 0, heelCurve);
    ctx.lineTo(0, h - heelCurve);
    ctx.quadraticCurveTo(0, h, heelCurve, h);
    ctx.lineTo(w - toeWidth, h);
    ctx.quadraticCurveTo(w - toeWidth / 6, h - 6, w, h - h * 0.35);
    ctx.lineTo(w - w * 0.05, h * 0.28);
    ctx.quadraticCurveTo(w - toeWidth / 3, h * 0.15, w - toeWidth, h * 0.12);
    ctx.lineTo(heelCurve + 4, h * 0.12);
    ctx.quadraticCurveTo(6, h * 0.12, heelCurve + 4, 0);
    ctx.closePath();

    // gradient
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, colorPrimary);
    g.addColorStop(0.6, brighten(colorPrimary, 0.18));
    g.addColorStop(1, darken(colorPrimary, 0.06));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.stroke();

    // laces: draw small slanted lines near top center
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = 3;
    const laceStartX = w * 0.22;
    const laceEndX = w * 0.68;
    const laceYBase = h * 0.30;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      const ly = laceYBase + i * 10;
      ctx.moveTo(laceStartX + i * 6, ly);
      ctx.lineTo(laceEndX + i * -6, ly + 6);
      ctx.stroke();
    }

    // sole line
    ctx.fillStyle = darken(colorPrimary, 0.25);
    ctx.fillRect(0, h - 10, w, 10);

    ctx.restore();
  }

  function brighten(hex, amt=0.12) {
    const c = hexToRgb(hex);
    const r = Math.min(255, Math.round(c.r + 255 * amt));
    const g = Math.min(255, Math.round(c.g + 255 * amt));
    const b = Math.min(255, Math.round(c.b + 255 * amt));
    return `rgb(${r},${g},${b})`;
  }
  function darken(hex, amt=0.12) {
    const c = hexToRgb(hex);
    const r = Math.max(0, Math.round(c.r - 255 * amt));
    const g = Math.max(0, Math.round(c.g - 255 * amt));
    const b = Math.max(0, Math.round(c.b - 255 * amt));
    return `rgb(${r},${g},${b})`;
  }
  function hexToRgb(hex) {
    const h = hex.replace('#','');
    const bigint = parseInt(h.length===3 ? h.split('').map(s=>s+s).join('') : h,16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  }

  function drawNet() {
    // neon dotted center line
    const step = 16;
    ctx.save();
    for (let i = 0; i < HEIGHT; i += step) {
      ctx.fillStyle = `rgba(255,255,255,0.08)`;
      ctx.fillRect(WIDTH / 2 - 2, i + 4, 4, step / 2);
    }
    ctx.restore();
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
    const trackSpeed = computer.speed * dt * 60 / 16.67;
    if (ball.y < paddleCenter - 12) {
      computer.y -= trackSpeed;
    } else if (ball.y > paddleCenter + 12) {
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
        }, 650);
      }
    }

    // Computer paddle
    if (ball.x + ball.radius > computer.x) {
      if (ball.y > computer.y && ball.y < computer.y + computer.height) {
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
        }, 650);
      }
    }

    // Slightly increase ball speed over time for challenge
    const maxSpeed = 16;
    const speedIncrease = 0.0009 * dt * 60;
    ball.speed = clamp(Math.hypot(ball.vx, ball.vy) + speedIncrease, 4.2, maxSpeed);
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
    const speed = Math.min(ball.speed * 1.06, 20);
    ball.vx = Math.cos(bounceAngle) * speed * direction;
    ball.vy = Math.sin(bounceAngle) * speed;
  }

  function render() {
    // background with subtle multicolor overlay
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // colorful vignette
    const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    bg.addColorStop(0, 'rgba(255,255,255,0.04)');
    bg.addColorStop(0.25, 'rgba(255,255,255,0.02)');
    bg.addColorStop(0.5, 'rgba(255,255,255,0.01)');
    bg.addColorStop(1, 'rgba(255,255,255,0.02)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    drawNet();

    // draw left boot (player) - choose a lively color
    drawBoot(player.x - 6, player.y, player.width + 40, player.height, '#ff4d6d'); // red/pink boot

    // draw right boot (computer) - different color
    drawBoot(computer.x - 22, computer.y, computer.width + 40, computer.height, '#39d3a2'); // teal boot

    // draw football (ball)
    drawFootball(ball.x, ball.y, ball.radius);

    // small glow around ball
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.arc(ball.x, ball.y, ball.radius + 12, 0, Math.PI * 2);
    ctx.fill();

    // overlay scoreboard hint when paused
    if (!running) {
      ctx.fillStyle = 'rgba(6,18,38,0.45)';
      ctx.fillRect(WIDTH / 2 - 160, HEIGHT / 2 - 38, 320, 76);
      ctx.fillStyle = '#fff';
      ctx.font = '16px system-ui, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Goal! Resetting...', WIDTH / 2, HEIGHT / 2 + 6);
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