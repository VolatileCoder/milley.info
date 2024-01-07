const game = {
    level: {
        number: 1,
        rowTimer: 5000
    },
    top: 90,
    width:900, 
    height: 1600,
    paddle: {
        width:180, 
        height:45,
        centerX:90,
        top: 1600-360,
        left: 0,
        lastLeft:0,
        velocity:0
    },
    blockHeight: 45,
    control:{},
    balls: [], 
    blocks: [],
    newBlocks: [],
    palette:["#FF8", "#8F8", "#8FF", "#F88", "#88F","#FB7"],
    score:0,
    highScore:0,
    lives: 2,
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
    
    game.levelElement = game.screen.text(100,45,"Level " + game.level.number);
    game.levelElement.attr("fill","#fff");
    game.levelElement.attr("font-size","40pt");

    
    game.scoreElement = game.screen.text(game.width/2,45,"0");
    game.scoreElement.attr("fill","#fff");
    game.scoreElement.attr("font-size","40pt");
    
    
    game.livesElement = game.screen.text(game.width-100,45,"Lives: " + game.lives);
    game.livesElement.attr("fill","#fff");
    game.livesElement.attr("font-size","40pt");

    
}

function initControl(){
    var control = game.screen.rect(0, 0, game.width, game.height); //must declare last
    control.attr("fill","#F0F");
    control.attr("opacity",0)
    control.attr("cursor", "ew-resize");
    control.mousemove(oninput);
    control.touchmove(oninput);
    control.mouseup(onclick);
    control.touchend(onclick);
    game.control.element = control;
}

function onclick(){
    game.balls.forEach((ball)=>{
        if(ball.anchored){
            ball.anchored=false;
        }
    });
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
        top:game.height,
        left:0,
        width:game.blockHeight,//TODO: Move to ball.size?
        height:game.blockHeight,
        directionX: 800,
        directionY: -800,
    };
    ball.element = game.screen.rect(0, ball.top, ball.width, ball.height);
    ball.element.attr("fill","#fff");
    ball.anchored = true;
    game.balls.push(ball);
    
    game.control.element.toFront();
}

function fadeIn(deltaT){
    blocksToRemove=[];
    game.newBlocks.forEach((block)=>{
        block.opacity = constrain(0,(block.opacity + (1/Math.min(750,game.level.rowTimer)) * deltaT),1);
        if (block.element) block.element.attr("opacity",block.opacity);
        if(block.opacity==1){
            blocksToRemove.push(block);
        }
    })
    blocksToRemove.forEach((block)=>game.newBlocks.splice(game.newBlocks.indexOf(block)));
}

var blockId = 0;
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
    block.element.attr({fill: fill, stroke:fill, opacity:opacity, id:'block'+blockId,});
    blockId++;
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
    deadBalls=[];
    game.balls.forEach((ball)=>{
        
        if(ball.anchored){
            ball.left = (game.paddle.left + game.paddle.centerX) - (ball.width/2);
            ball.top = game.paddle.top - ball.height;
            ball.element.attr("x",ball.left);
            ball.element.attr("y",ball.top);
            return;
        }

        hitY = false;
        hitX = false;
        ball.top = ball.top + (ball.directionY/1000) * deltaT;
        ball.left = ball.left + (ball.directionX/1000) * deltaT;

        //dead ball
        if(ball.top>game.height){
            deadBalls.push(ball);
            return;
        }


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
        topHit = false;
        bottomHit = false;
        leftHit = false;
        rightHit = false;

        game.blocks.forEach((block)=>{
            if(block.element && Raphael.isBBoxIntersect(ball.element.getBBox(), block.element.getBBox())){
                blocksToRemove.push(block);
                topHit = topHit || (ball.top <= (block.top + block.height) && (ball.top + ball.height) > (block.top + block.height));
                bottomHit = bottomHit || (ball.top < (block.top) && (ball.top + ball.height) > (block.top) && (ball.top + ball.height));
                leftHit = leftHit || (ball.left > block.left) && (ball.left < (block.left + block.width));
                rightHit = rightHit ||  ((ball.left + ball.width) > block.left && (ball.left + ball.width) < (block.left + block.width));
            }
        });

        if ((topHit || bottomHit) && leftHit && rightHit){
            hitY = true; 
        } else if (leftHit || rightHit){
            hitX = true; 
        }
        
        
        if(blocksToRemove.length>0){
            blocksToRemove.forEach(removeBlock);
            commitRemoval();
            //alert(leftHit);
        }
        
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
    deadBalls.forEach((ball)=>{
        ball.element.remove();
        game.balls.splice(game.balls.indexOf(ball),1);
    })
}

function removeBlock(block){

    block.removing = true;
    //todo: check for neighboring blocks;
    game.blocks.forEach((block2)=>{
        if(block2.removing==true ) {return};
        if(block.color == block2.color && block.left == block2.left + block2.width && block.top == block2.top){
            removeBlock(block2);
        }
        if(block.color == block2.color && block.left == block2.left && block.top == block2.top + block2.height){
            removeBlock(block2);
        }
        if(block.color == block2.color && block2.left == block.left + block.width && block.top == block2.top){
            removeBlock(block2);
        }
        if(block.color == block2.color && block.left == block2.left && block2.top == block.top + block.height){
            removeBlock(block2);
        }
    });
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function commitRemoval(){
    blocksToRemove=[];
    game.blocks.forEach((block)=> {if(block.removing==true) {blocksToRemove.push(block)}});
    
    game.score += game.blocks.length * game.level.number  * 5;
    game.scoreElement.attr("text",numberWithCommas(game.score));

    blocksToRemove.forEach((block)=> {
        game.blocks.splice(game.blocks.indexOf(block),1);
        if(block.element) block.element.remove();
        if(block.path){
            if(block.path.top) {block.path.top.remove(); block.path.top=null};
            if(block.path.left) {block.path.left.remove(); block.path.left=null};
            if(block.path.right) {block.path.right.remove(); block.path.right=null};
            if(block.path.bottom) {block.path.bottom.remove(); block.path.bottom=null};
        }
        block.element = null;
        block = null
    });
    


};

function trace(){
    //remove old traces
    paths=[];
    game.blocks.forEach((block)=>{
        if(block.path&&paths.indexOf(block.path)==-1){
            paths.push(block.path)
        }
    });

    paths.forEach((path)=>{
        //alert("caught");
        if (path.left) {
            path.left.remove();
            path.left = null;
        }
        if (path.top) {
            path.top.remove();
            path.top = null;
        }
        
        if (path.right) {
            path.right.remove();
            path.right = null;
        }
        if (path.bottom) {
            path.bottom.remove();
            path.bottom = null;
        }
    });

    game.blocks.forEach((block, index)=>{
        v = 0
        //if (index>0) return;
        //todo: determine groups;
        block.path = {
            left: game.screen.path("M" + (block.left + v) + "," + (block.top + v) + "L" + (block.left + v) + "," + (block.top + block.height - v)),
            top: game.screen.path("M" + (block.left + v) + "," + (block.top + v) + "L" + (block.left + block.width - v) + "," + (block.top + v)),
            right: game.screen.path("M" + (block.left + block.width - v) + "," + (block.top + v) + "L" + (block.left + block.width - v) + "," + (block.top + block.height - v)),
            bottom: game.screen.path("M" + (block.left + v) + "," + (block.top + block.height - v) + "L" + (block.left + block.width - v) + "," + (block.top + block.height - v)),
        }
        block.path.top.attr({"stroke":"#000","stroke-width":3});
        block.path.left.attr({"stroke":"#000","stroke-width":3});
        block.path.right.attr({"stroke":"#000","stroke-width":3});
        block.path.bottom.attr({"stroke":"#000","stroke-width":3});

        game.blocks.forEach((block2)=>{
            if(block.color == block2.color && block.left == block2.left + block2.width && block.top == block2.top){
                block.path.left.remove();
                block.path.left = null;
            }
            if(block.color == block2.color && block.left == block2.left && block.top == block2.top + block2.height){
                block.path.top.remove();
                block.path.top = null;
            }
            if(block.color == block2.color && block2.left == block.left + block.width && block.top == block2.top){
                block.path.right.remove();
                block.path.right = null;
            }
            if(block.color == block2.color && block.left == block2.left && block2.top == block.top + block.height){
                block.path.bottom.remove();
                block.path.bottom = null;
            }
        });

    });

    game.control.element.toFront();
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
 
    game.paddle.velocity = (game.paddle.velocity + (game.paddle.lastLeft - game.paddle.left))/2;
    game.paddle.lastLeft = game.paddle.left;
    
    fadeIn(deltaT);
    moveBalls(deltaT);
    if(game.balls.length>0 && !game.balls[0].anchored){
        gameTime+=deltaT;
        if(gameTime > game.level.rowTimer){
            //alert(gameTime + ", " + game.level.rowTimer);
            gameTime = 0;
            moveBlocks(deltaT);
        }        
    }else if(game.balls.length == 0) {
        if (game.lives > 0) {
            game.lives--;
            game.livesElement.attr("text","Lives: " + game.lives);
            addBall();
        }
        else {
            alert("game over!");
            //pauseLoop();
            document.location.reload();
            return;
        }
    }
    
    if(document.hasFocus()){
        setTimeout(()=>gameLoop(start),1);
    }else{
        pauseLoop();
    }

}

var rows = 0;
function addRow(top){
    rows++;
    totalWidth=0;
    lastColor=0;
        
    for (var i=0; i<5; i++){
        color = constrain(0,Math.round(Math.random()*game.palette.length),game.palette.length-1);
        scale = 4;
        addBlock(totalWidth, top, scale, color, 0);
        totalWidth += scale * game.blockHeight;
    }
    if (rows % 20 == 0) {
        increaseDifficulty();
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
    trace();
}

function increaseDifficulty(){
    game.level.number += 1;
    game.levelElement.attr("text", "Level " + game.level.number)
    switch (game.level.number){
        case 1:
            game.level.rowTimer = 5000;
            game.palette = ["#F88","#FF8", "#8FF"];
            break;
        case 2:
            game.level.rowTimer = 4000;
            game.palette = ["#F88","#FF8", "#8FF", "#FB7"];
            break;
        case 3:
            game.level.rowTimer = 3000;
            game.palette = ["#F88","#FF8", "#8FF", "#FB7", "#8F8"];
            break;
        case 4:
            game.level.rowTimer = 2000;
            game.palette = ["#F88","#FF8", "#8FF", "#FB7", "#8F8", "#88F"];
            break;
        case 5:
            game.level.rowTimer = 1000;
            game.palette = ["#FB7", "#8F8", "#88F"];
            break;
        case 6:
            game.level.rowTimer = 800;
            game.palette = ["#8FF", "#FB7", "#8F8", "#88F"];
            break;
        case 7:
            game.level.rowTimer = 650;
            game.palette = ["#FF8", "#8FF", "#FB7", "#8F8", "#88F"];
            break;
        case 8:
            game.palette = ["#F88","#FF8", "#8FF", "#FB7", "#8F8", "#88F"];
            game.level.rowTimer = 500;
            break;
    }
}

function startGame(){
    initPaddle();
    addBall();
    game.level.number=0;
    increaseDifficulty();
    for(var i=0; i<10; i++){
        addRow(game.top + (game.blockHeight * i));
    }
    trace();
    //addBlock(game.blockHeight * 10, game.blockHeight*10, 5, "#FF0");
    gameLoop(Date.now());
}
initScreen();
initControl();
startGame();

