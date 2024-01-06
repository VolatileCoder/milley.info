const game = {
    width:900, 
    height: 1600,
    paddle: {
        width:160, 
        height:40,
        centerX:80,
        top: 1600-160,
        left: 0,
        lastLeft:0,
        velocity:0
    },
    control:{},
    balls: [], 
    blocks: []
};

function initScreen(){
    game.screen = Raphael("main", game.width, game.height);
    game.screen.setViewBox(0, 0, game.width, game.height, true);
    game.screen.canvas.setAttribute('preserveAspectRatio', 'meet');
    game.screen.canvas.style.backgroundColor = '#334';    
    var well = game.screen.rect(0, 0, game.width, game.height);
    well.attr("fill","#000");    
    
}

function initControl(){
    var control = game.screen.rect(0, 0, game.width, game.height); //must declare last
    control.attr("fill","#F0F");
    control.attr("opacity",0)
    control.attr("cursor", "ew-resize");
    control.mousemove(oninput);
    control.touchmove(oninput);
    game.control.element = control;
}

function initPaddle(){
    if(game.paddle.element){
        game.paddle.element.remove();
    }
    game.paddle.element = game.screen.rect(0, game.paddle.top, game.paddle.width, game.paddle.height);
    game.paddle.element.attr("fill","#fff");
    game.control.element.toFront();
}

function addBall(fill){
    ball = {
        //in pixelsPerSecond
        top:0,
        left:0,
        width:game.paddle.height,//TODO: Move to ball.size?
        height:game.paddle.height,
        directionX: 800,
        directionY: -800,
    }
    ball.element = game.screen.rect(0, ball.top, ball.width, ball.height);
    ball.element.attr("fill",fill);
    game.balls.push(ball);
}

function addBlock(left, top, ){
    block = {
        opacity:1,
    }
}

function oninput(e,a){
    if (document.hasFocus() && game.paddle.element){
        r = e.target.getBoundingClientRect();
        pos = ((e.clientX-r.x)/r.width) * game.width;
        if (!isNaN(pos)) {
            pos -= game.paddle.centerX
            if(pos < 0) {
                pos = 0;
            } else if (pos + game.paddle.width > game.width) {
                pos = game.width - game.paddle.width;
                
            }
            game.paddle.left = pos;
            game.paddle.element.attr("x",pos);
        }    
    }   
}

function constrain (min, val, max){
    if (val<min) return min;
    if (val>max) return max;
    return val;
}

function moveBalls(deltaT){
    game.balls.forEach((ball)=>{
        hitY = false;
        hitX = false;
        ball.top = ball.top + (ball.directionY/1000) * deltaT;
        ball.left = ball.left + (ball.directionX/1000) * deltaT;
        
        //check game boundaries
        if (ball.top<0){
            ball.top = ball.top * -1;
            hitY = true;
        }
        if (ball.left<0){
            ball.left = ball.left * -1;
            hitX = true;
        } else if (ball.left + ball.width > game.width){
            overage = (ball.left + ball.width) - game.width; 
            ball.left = (game.width - ball.width) - overage;
            hitX = true;
        }

        //temporary rule
        if(ball.top+ball.height>game.height){
            overage = (ball.top + ball.height) - game.height;
            ball.top = (game.height - ball.height) - overage;
            hitY=true;
        }

        game.balls.forEach((ball2)=>{
            if (ball2 == ball) return;
            if(Raphael.isBBoxIntersect(ball.element.getBBox(), ball2.element.getBBox())){
                xdiff = Math.abs(ball.left - ball2.left);
                ydiff = Math.abs(ball.top - ball2.top);
                if(xdiff>ydiff){
                    //find the center point between the two
                    centerX = Math.max(ball.left, ball2.left) - xdiff/2;
                    if (ball.left<centerX){
                        ball.left = centerX-ball.width;
                        ball.directionX = Math.abs(ball2.directionX) * -1;
                        ball2.left = centerX+ball.width;
                        ball2.directionX = Math.abs(ball.directionX);
                    } else {
                        ball.left = centerX+ball.width;
                        ball.directionX = Math.abs(ball2.directionX);
                        ball2.left = centerX-ball.width;
                        ball2.directionX = Math.abs(ball.directionX) * -1;     
                    }                
                } else {
                    //find the center point between the two
                    centerY = Math.max(ball.top, ball2.top) - ydiff/2;
                    if (ball.top<centerY){
                        ball.top = centerY-ball.height;
                        ball.directionY = Math.abs(ball2.directionY) * -1;
                        ball2.top = centerY+ball.height;
                        ball2.directionY = Math.abs(ball.directionY);
                    } else {
                        ball.top = centerY+ball.height;
                        ball.directionY = Math.abs(ball2.directionY);
                        ball2.top = centerY-ball.height;
                        ball2.directionY = Math.abs(ball.directionY) * -1;     
                    }
                }
            };
        });
        //check paddle intersection
        if(Raphael.isBBoxIntersect(ball.element.getBBox(), game.paddle.element.getBBox())){
            if(ball.directionY>0){
                if(ball.top + ball.height > game.paddle.top){
                    overage = (ball.top + ball.height) - game.paddle.top;
                    ball.top = (game.paddle.top - ball.height) - overage;
                    hitY=true;
                }
            }
            
            ball.directionX += game.paddle.velocity * -10;
            ball.directionX = constrain(-1600, ball.directionX, 1600)
            
        } 

        if (hitY){
            ball.directionY = ball.directionY * -1;
        }
        
        if (hitX){
            ball.directionX = ball.directionX * -1;
        }
        ball.element.attr("x", ball.left);
        ball.element.attr("y", ball.top);
        
    });
}
function pauseLoop(){
    if(document.hasFocus()){
        gameLoop(Date.now());
    }else{
        setTimeout(()=>pauseLoop(), 100);
    }
}
function gameLoop(lastTime){
    var start  = Date.now();
    deltaT = start - lastTime

    game.paddle.velocity = (game.paddle.velocity + (game.paddle.lastLeft - game.paddle.left))/2;
    game.paddle.lastLeft = game.paddle.left;
    
    moveBalls(deltaT);
    if(document.hasFocus()){
        setTimeout(()=>gameLoop(start),1);
    }else{
        pauseLoop();
    }
}
function startGame(){
    initPaddle();
    addBall("#FFF");
    gameLoop(Date.now());
}
initScreen();
initControl();
startGame();

