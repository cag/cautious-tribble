import "babel-polyfill";
import List from 'collections/list'
import LruSet from "collections/lru-set";

for(let col_cls of [List, LruSet]) {
    col_cls.prototype[Symbol.iterator] = col_cls.prototype.iterate
}

let canvas;
let ctx;
let pressed={};
let unit;
let timestamp;
let mouse = {
    x: 0,
    y: 0
};

function clampCoordinates(entity) {
    entity.x = Math.min(Math.max(entity.x, -1), 17);
    entity.y = Math.min(Math.max(entity.y, -1), 10);
}

let player = {
    x: 8,
    y: 4.5,
    dirx: 1,
    diry: 0,
    speed: .005,
    bullets: LruSet([], 50),
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
        ctx.beginPath();
        ctx.moveTo(.3, 0);
        ctx.lineTo(-.25, .25);
        ctx.lineTo(-.25, -.25);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        for(let bullet of player.bullets) {
            ctx.save();
            ctx.transform(
                bullet.dirx,
                bullet.diry,
                -bullet.diry,
                bullet.dirx,
                bullet.x, bullet.y);
            ctx.fillStyle = '#00f';
            ctx.beginPath();
            ctx.fillRect(-.07, -.07, .07, .07);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        };
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

        for(let bullet of player.bullets) {
            let bds = player.bullet_speed * dt;
            bullet.x += bullet.dirx * bds;
            bullet.y += bullet.diry * bds;
            if(bullet.x < -1 || bullet.x > 17 || bullet.y < -1 || bullet.y > 10) {
                player.bullets.delete(bullet);
            } else {
                for(let enemy of enemies) {
                    if(enemy.containsPoint(bullet.x, bullet.y)) {
                        enemy.takeDamage();
                        player.bullets.delete(bullet);
                    }
                }
            }
        };

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
        clampCoordinates(player);

        let mdx = mouse.x - player.x,
            mdy = mouse.y - player.y,
            nmd = Math.sqrt(mdx*mdx+mdy*mdy);

        player.dirx = mdx / nmd;
        player.diry = mdy / nmd;
    }
};

let enemies = List([]);
let enemy_bullets = LruSet([], 50);

class Mine {
    constructor(obj) {
        enemies.push(this);
        this.node = enemies.head.prev;
        Object.assign(this, {
            x: 0,
            y: 0,
            speed: .002,
            dirx: 1,
            diry: 0,
            radius: .125,
            hp: 3,
            tracksPlayer: true
        });
        Object.assign(this, obj);
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = this.hp == 3 ? '#000' :
            this.hp == 2 ? '#800' : '#f00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius/2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }

    update(dt) {
        if(this.tracksPlayer) {
            let dx = player.x - this.x,
                dy = player.y - this.y,
                ds = Math.sqrt(dx*dx+dy*dy);
            this.dirx = dx/ds;
            this.diry = dy/ds;
        } else {
            if(this.x == -1 || this.x == 17) {
                this.dirx = -this.dirx
            }
            if(this.y == -1 || this.y == 10) {
                this.diry = -this.diry
            }
        }
        this.x += this.dirx * this.speed * dt;
        this.y += this.diry * this.speed * dt;
        clampCoordinates(this);
    }

    containsPoint(x, y) {
        let dx = x - this.x,
            dy = y - this.y;
        return dx*dx+dy*dy<this.radius*this.radius;
    }

    takeDamage() {
        this.hp--;
        if(this.hp <= 0)
            this.node.delete();
    }

    static create1(x, y, theta) {
        return new Mine({
            x: x,
            y: y,
            dirx: Math.cos(theta),
            diry: Math.sin(theta)
        });
    }
}


export function run() {
    let x, y, theta;
    for([x, y, theta] of [
        [1, 1, Math.PI/4],
        [15, 1, Math.PI/4],
        [1, 5, Math.PI/4],
        [15, 4, Math.PI/4],
        [15, 8, Math.PI/4],        
    ]) {
        Mine.create1(x, y, theta);
    }

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
    window.addEventListener('resize', onresize);
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
    ctx.lineWidth=.02;
    // ctx.fillText(timestamp, 10, 10);

    ctx.save();
    ctx.scale(unit, unit);
    ctx.fillRect(mouse.x-.1, mouse.y-.1, .2, .2);

    for(let enemy of enemies) {
        enemy.draw();
    }
    player.draw();

    ctx.restore();
    requestAnimationFrame(draw);
}

function update() {
    let dt = performance.now() - timestamp;
    timestamp = performance.now();
    
    for(let enemy of enemies) {
        enemy.update(dt);
    }
    player.update(dt);

    setTimeout(update, 1000/60);
}