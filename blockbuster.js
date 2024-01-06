const game = {
    top: 90,
    width:900, 
    height: 1600,
    paddle: {
        width:180, 
        height:45,
        centerX:80,
        top: 1600-160,
        left: 0,
        lastLeft:0,
        velocity:0
    },
    blockHeight: 45,
    control:{},
    balls: [], 
    blocks: [],
    newBlocks: [],
    palette:["#FF8", "#8F8", "#8FF", "#F88", "#88F"]
};

function initScreen(){
    game.screen = Raphael("main", game.width, game.height);
    game.screen.setViewBox(0, 0, game.width, game.height, true);
    game.screen.canvas.setAttribute('preserveAspectRatio', 'meet');
    game.screen.canvas.style.backgroundColor = '#334';    
    var well = game.screen.rect(0, 0, game.width, game.height);
    well.attr("fill","#000");
    
    var scoreboard = game.screen.rect(0,0,game.width, game.top);
    scoreboard.attr({fill:"#223"});
    
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
        top:game.height,
        left:0,
        width:game.blockHeight,//TODO: Move to ball.size?
        height:game.blockHeight,
        directionX: 800,
        directionY: -800,
    };
    ball.element = game.screen.rect(0, ball.top, ball.width, ball.height);
    ball.element.attr("fill",fill);
    game.balls.push(ball);
    
    game.control.element.toFront();
}

function fadeIn(deltaT){
    blocksToRemove=[];
    game.newBlocks.forEach((block)=>{
        block.opacity = constrain(0,(block.opacity + (1/1000) * deltaT),1);
        block.element.attr("opacity",block.opacity);
        if(block.opacity==1){
            blocksToRemove.push(block);
        }
    })
    blocksToRemove.forEach((block)=>game.newBlocks.splice(game.newBlocks.indexOf(block)));
}

function addBlock(left, top, scale, colorIndex, opacity){
    block = {
        opacity: opacity,
        left: left,
        top: top,
        width: scale * game.blockHeight,
        height: game.blockHeight, 
        color: colorIndex
    };
    fill = game.palette[colorIndex];
    block.element = game.screen.rect(block.left, block.top, block.width, block.height);
    block.element.attr({fill: fill, stroke: fill, opacity:opacity});
    game.blocks.push(block);
    game.newBlocks.push(block);
    game.control.element.toFront();
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
        if (ball.top<game.top){
            ball.top = game.top + Math.abs(game.top - ball.top);
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

        blocksToRemove = [];
        game.blocks.forEach((block)=>{
            if(block.element && Raphael.isBBoxIntersect(ball.element.getBBox(), block.element.getBBox())){
                ball.top = block.top+block.height +1
                ball.directionY = ball.directionY * -1;
                blocksToRemove.push(block);
            }
        });
        blocksToRemove.forEach(removeBlock);
        
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

function removeBlock(block){
    block.removing = true;
    //todo: check for neighboring blocks;
    game.blocks.forEach((block2)=>{
        if(block2==block||block2.removing) return; 
        if (block2.top == block.top && block.color == block2.color){
            if ((block2.left <= (block.left - game.blockHeight) && (block.left - game.blockHeight) <= (block2.left + block2.width)) ||
                (block2.left <= (block.left + block.width + game.blockHeight) && (block.left + block.width + game.blockHeight) <= (block2.left + block2.width)) ){
                removeBlock(block2);
            }
        }
        if(block2.left == block.left && block.color == block2.color){
            if ((block2.top <= (block.top - game.blockHeight/2) && (block.top - game.blockHeight/2) <= (block2.top + block2.height)) ||
                (block2.top <= (block.top + block.height + game.blockHeight/2) && (block.top + block.height + game.blockHeight/2) <= (block2.top + block2.height)) ){
                removeBlock(block2);
            }
        }
    });
    
    game.blocks.splice(game.blocks.indexOf(block),1);
    if(block.element) block.element.remove();
    block.element = null;
    block = null;
}

function pauseLoop(){
    if(document.hasFocus()){
        gameLoop(Date.now());
    }else{
        setTimeout(()=>pauseLoop(), 100);
    }
}

gameTime = 0;
function gameLoop(lastTime){
    var start  = Date.now();
    deltaT = start - lastTime
    gameTime+=deltaT;

    game.paddle.velocity = (game.paddle.velocity + (game.paddle.lastLeft - game.paddle.left))/2;
    game.paddle.lastLeft = game.paddle.left;
    
    moveBalls(deltaT);
    fadeIn(deltaT);
    if(gameTime>1000){
        gameTime = 0;
        moveBlocks(deltaT);
    }
    if(document.hasFocus()){
        setTimeout(()=>gameLoop(start),1);
    }else{
        pauseLoop();
    }
}

function addRow(top){
    totalWidth=0;
    lastColor=0;
        
    for (var i=0; i<5; i++){
        color = constrain(0,Math.round(Math.random()*game.palette.length),game.palette.length-1);
        scale = 4;
        addBlock(totalWidth, top, scale, color, 0);
        totalWidth += scale * game.blockHeight;
    }

}


function moveBlocks(){

    game.blocks.forEach((block)=>{
        block.top = block.top + game.blockHeight;
        block.element.attr("y", block.top);
        if(block.element.attr("y")!=block.top){
            alert("trapped");
        }
    });

    addRow(game.top);
}

function startGame(){
    initPaddle();
    addBall("#FFF");
    for(var i=0; i<10; i++){
        addRow(game.top + (game.blockHeight * i));
    }
    //addBlock(game.blockHeight * 10, game.blockHeight*10, 5, "#FF0");
    gameLoop(Date.now());
}
initScreen();
initControl();
startGame();

