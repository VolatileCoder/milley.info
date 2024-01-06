const game = {
    width:900, 
    height: 1600,
    paddle: {
        width:160, 
        height:40,
        centerX:80,
        top: 1600-160,
    },
    control:{},
    balls: []
};

function initScreen(){
    game.screen = Raphael("main", game.width, game.height);
    game.screen.setViewBox(0, 0, game.width, game.height, true);
    game.screen.canvas.setAttribute('preserveAspectRatio', 'meet');
    game.screen.canvas.style.backgroundColor = '#334';    
    var well = game.screen.rect(0, 0, game.width, game.height);
    well.attr("fill","#000");    
        
    var killzone = game.screen.rect(0,game.paddle.top+game.paddle.height,game.width, game.height - (game.paddle.top+game.paddle.height));
    killzone.attr("fill","#800");
}

function initControl(){
    var control = game.screen.rect(0, 0, game.width, game.height); //must declare last
    control.attr("fill","#F0F");
    control.attr("opacity",0)
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

function addBall(){
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
    ball.element.attr("fill","#fff");
    game.balls.push(ball);
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
            
            game.paddle.element.attr("x",pos);
        }    
    }   
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
    //console.log(deltaT);
    moveBalls(deltaT);
    if(document.hasFocus()){
        setTimeout(()=>gameLoop(start),1);
    }else{
        pauseLoop();
    }
}
function startGame(){
    initPaddle();
    addBall();
    gameLoop(Date.now());
}
initScreen();
initControl();
startGame();

