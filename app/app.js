import LruSet from "collections/lru-set"

let canvas;
let ctx;
let pressed={};
let unit;
let timestamp;
let mouse = {
    x: 0,
    y: 0
}
let player = {
    x: 8,
    y: 4.5,
    dirx: 1,
    diry: 0,
    speed: .005,
    bullets: LruSet([], 15),
    bullet_timer: 0,
    bullet_interval: 100,
    bullet_speed: .01,
    draw: function() {
        ctx.save();
        ctx.transform(
            player.dirx,
            player.diry,
            -player.diry,
            player.dirx,
            player.x, player.y);
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.moveTo(.3, 0);
        ctx.lineTo(-.25, .25);
        ctx.lineTo(-.25, -.25);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        player.bullets.forEach((bullet) => {
            ctx.save();
            ctx.transform(
                bullet.dirx,
                bullet.diry,
                -bullet.diry,
                bullet.dirx,
                bullet.x, bullet.y);
            ctx.fillStyle = '#00f';
            ctx.beginPath();
            ctx.fillRect(-.1, -.05, .2, .1);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
    },
    update: function(dt) {
        let dx = 0,
            dy = 0,
            ds = player.speed*dt;

        player.bullet_timer += dt;
        while(player.bullet_timer > 0) {
            let bds = player.bullet_speed * player.bullet_timer;
            player.bullets.add({
                x: player.x + player.dirx*0.25 + bds * player.dirx,
                y: player.y + player.diry*0.25 + bds * player.diry,
                dirx: player.dirx,
                diry: player.diry
            });
            player.bullet_timer -= player.bullet_interval;
        }

        player.bullets.forEach((bullet) => {
            let bds = player.bullet_speed * dt;
            bullet.x += bullet.dirx * bds;
            bullet.y += bullet.diry * bds;
        });

        if(pressed[37] || pressed[65])
            dx -= ds;
        if(pressed[39] || pressed[68])
            dx += ds;
        if(pressed[38] || pressed[87])
            dy -= ds;
        if(pressed[40] || pressed[83])
            dy += ds;
        
        let normsqr = dx*dx+dy*dy;
        if(normsqr > ds*ds) {
            let norm = Math.sqrt(normsqr);
            dx = dx * ds / norm;
            dy = dy * ds / norm;
        }
        player.x += dx;
        player.y += dy;

        let mdx = mouse.x - player.x,
            mdy = mouse.y - player.y,
            nmd = Math.sqrt(mdx*mdx+mdy*mdy);

        player.dirx = mdx / nmd;
        player.diry = mdy / nmd;
    }
};

export function onresize() {
    let cw = window.innerWidth;
    let ch = window.innerHeight - 4;
    if(cw / ch > 16/9) cw = ch * 16/9;
    else ch = cw * 9/16;
    canvas.width = cw;
    canvas.height = ch;
    unit = ch / 9;
}

export function run() {
    canvas = document.getElementById('app');
    document.body.onkeydown=function(e){
         e = e || window.event;
         pressed[e.keyCode] = true;
    };
    document.body.onkeyup=function(e){
         e = e || window.event;
         delete pressed[e.keyCode];
    };
    let onresize=function() {
        if(canvas) {
            let cw = window.innerWidth;
            let ch = window.innerHeight - 4;
            if(cw / ch > 16/9) cw = ch * 16/9;
            else ch = cw * 9/16;
            canvas.width = cw;
            canvas.height = ch;
            unit = ch / 9;
        }
    };
    document.body.onresize = onresize;
    onresize();

    document.body.onmousemove = function (evt) {
        let rect = canvas.getBoundingClientRect();
        mouse.x = (evt.clientX - rect.left) * canvas.width / ((rect.right - rect.left) * unit);
        mouse.y = (evt.clientY - rect.top) * canvas.height / ((rect.bottom - rect.top) * unit);
    }

    requestAnimationFrame(draw);

    timestamp = performance.now();
    setTimeout(update, 1000/60);
};

function draw() {
    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ctx.fillText(timestamp, 10, 10);

    ctx.save();
    ctx.scale(unit, unit);
    ctx.fillRect(mouse.x-.1, mouse.y-.1, .2, .2);

    player.draw();

    ctx.restore();
    requestAnimationFrame(draw);
}

function update() {
    let dt = performance.now() - timestamp;
    timestamp = performance.now();
    
    player.update(dt);

    setTimeout(update, 1000/60);
}