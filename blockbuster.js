const game = {
    level: {
        number: 1,
        rowTimer: 5000,
        difficulty: 1,
    },
    isRunning:false,
    top: 90,
    width:900, 
    height: 1600,
    paddle: {
        width:180, 
        height:45,
        top: 1600-360,
        left: 0,
        lastLeft:0,
        velocity:0,
        isLarge: false,
        isSmall: false
    },
    blockHeight: 45,
    control:{},
    balls: [], 
    blocks: [],
    newBlocks: [],
    powerUps: [],
    palette:["#FF8", "#8F8", "#8FF", "#F88", "#88F","#FB7"],
    score:0,
    highScore:0,
    lives: 2,
    rowsCreated:0,
};

const puGrowPaddle = "<- Paddle ->";
const puShrinkPaddle = "-> Paddle <-";
const puExtraBall ="+ Ball"; 

const puResetDifficulty ="Slow Down"; 

sounds = {
//create a synth and connect it to the main output (your speakers)
    //synth: new Tone.Synth().toDestination(),
    lastTime: null,
    lastMusic: null,
    ballHitPaddle: ()=>{ t = Tone.now(); if (t != sounds.lastTime) { sounds.lastTime = t;  sounds.synth.triggerAttackRelease("F2",".001", t);}},
    ballHitWall: ()=>{ t = Tone.now(); if (t != sounds.lastTime) { sounds.lastTime = t;  sounds.synth.triggerAttackRelease("A2",".001", t);}},
    ballHitBlock: ()=>{ t = Tone.now(); if (t != sounds.lastTime) { sounds.lastTime = t;  sounds.synth.triggerAttackRelease("C3",".001", t);}},
    ballHitBall: ()=>{ t = Tone.now(); if (t != sounds.lastTime) { sounds.lastTime = t;  sounds.synth.triggerAttackRelease("F3",".001", t);}},
    gameStart: ()=>{ 
        t = Tone.now(); 
        if (t != sounds.lastMusic) { 
            sounds.lastMusic = t; 
            sounds.music.triggerAttackRelease(["F2","A2","C2"],".1",t)//.start(0);
            sounds.music.triggerAttackRelease(["F3","A2","C2"],".1",t+.25)//.start(250);
        }
    },
    ballLost: ()=>{ 
        t = Tone.now(); 
        if (t != sounds.lastMusic) { 
            sounds.lastMusic = t; 
            sounds.music.triggerAttackRelease(["F2","A2","C2"],".1",t)//.start(250);
            sounds.music.triggerAttackRelease(["F2","A2","C2"],".1",t+.25)//.start(250);
        }
    },
    gameOver: ()=>{ 
        t = Tone.now(); 
        if (t != sounds.lastMusic) { 
            sounds.lastMusic = t; 
            sounds.music.triggerAttackRelease(["F3","A2","C2"],".1",t)//.start(0);
            sounds.music.triggerAttackRelease(["F2","A2","C2"],".1",t+.25)//.start(250);
            sounds.music.triggerAttackRelease(["F2","A2","C2"],".1",t+.50)//.start(250);
        }
    },
    clearScreen: ()=>{ 
        t = Tone.now(); 
        if (t != sounds.lastMusic) { 
            sounds.lastMusic = t; 
            sounds.music.triggerAttackRelease(["F4","A4","C5"],".1",t)//.start(250);
            sounds.music.triggerAttackRelease(["F4","A4","C5"],".25",t+.25)//.start(250);
        }
    },
    
    init: ()=>{sounds.synth = new Tone.Synth().toDestination();sounds.synth.envelope.release = .33;sounds.music = new Tone.PolySynth().toDestination();}
}

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
let name = cname + "=";
let decodedCookie = decodeURIComponent(document.cookie);
let ca = decodedCookie.split(';');
for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
    c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
    return c.substring(name.length, c.length);
    }
}
return "";
}

function initScreen(){
    hs = getCookie("highScore");
    if(hs && hs!=""){
        game.highScore = parseInt(hs);
    }
    game.screen = Raphael("main", game.width, game.height);
    game.screen.setViewBox(0, 0, game.width, game.height, true);
    game.screen.canvas.setAttribute('preserveAspectRatio', 'meet');
    game.screen.canvas.style.backgroundColor = '#334';   
    game.screen.canvas.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space","preserve"); 
    var well = game.screen.rect(0, 0, game.width, game.height);
    well.attr("fill","#000");
    
    var scoreboard = game.screen.rect(0,0,game.width, game.top);
    scoreboard.attr({fill:"#223"});
    
    game.levelElement = game.screen.text(100,45,"Level " + game.level.number);
    game.levelElement.attr("fill","#fff");
    game.levelElement.attr("font-size","30pt");

    game.screen.text(game.width *.25 ,25,"Your Score:").attr({fill:"#fff","text-anchor":"start","font-size":"30pt"});
    game.scoreElement = game.screen.text(game.width*.66,25,"0");
    game.scoreElement.attr("fill","#fff");
    game.scoreElement.attr("text-anchor","end");
    game.scoreElement.attr("font-size","30pt");
    
    
    game.screen.text(game.width *.25 ,65,"High Score:").attr({fill:"#fff","text-anchor":"start","font-size":"30pt"});
    game.highScoreElement = game.screen.text(game.width *.66 ,65,numberWithCommas(game.highScore));
    game.highScoreElement.attr("fill","#fff");
    game.highScoreElement.attr("text-anchor","end");
    game.highScoreElement.attr("font-size","30pt");
    
    
    game.livesElement = game.screen.text(game.width-100,45,"Lives: " + game.lives);
    game.livesElement.attr("fill","#fff");
    game.livesElement.attr("font-size","30pt");

    game.textElement = game.screen.text(game.width / 2, game.height / 2, "Click to Start!");
    game.textElement.attr("fill","#fff")
    game.textElement.attr("font-size","70pt");
    game.textElement.attr("font-weight","bold");

    
}

function initControl(){
    var control = game.screen.rect(0, 0, game.width, game.height); //must declare last
    control.attr("fill","#F0F");
    control.attr("opacity",0)
    control.attr("cursor", "ew-resize");
    control.mousemove(oninput);
    control.touchmove(oninput);
    control.mousedown(onclick);
    control.touchend(onTouchEnd);
    control.touchstart(onTouchStart);
    game.control.element = control;
}

function onclick(e){
    e.preventDefault(e);
    if (game.isRunning){
        launchBall();
    } else {
        startGame();
    }
}

function onTouchStart(e){
    e.preventDefault(e);
    if (!game.isRunning){
        startGame();
    }
}


function onTouchEnd(e){
    e.preventDefault(e);
    if (game.isRunning){
        launchBall();
    }
}

function launchBall(){
    game.balls.forEach((ball)=>{
        if(ball.anchored){
            ball.anchored=false;
            //sounds.ballHitPaddle();
        }
    });
}

function initPaddle(){
    game.paddle.width = game.width*.25; 
    if(game.paddle.element){
        game.paddle.element.remove();
    }
    game.paddle.element = game.screen.rect(game.paddle.left, game.paddle.top, game.paddle.width, game.paddle.height);
    game.paddle.element.attr("fill","#fff");
    updateZorder();
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
    ball.top = game.paddle.top - ball.height;
    ball.left = game.paddle.left + game.paddle.width/2 - ball.width/2;
    ball.element = game.screen.rect(ball.left, ball.top, ball.width, ball.height);
    ball.element.attr("fill","#fff");
    ball.anchored = true;
    game.balls.push(ball);
    updateZorder();
}

function fadeIn(deltaT){
    blocksToRemove=[];
    game.newBlocks.forEach((block)=>{
        block.opacity = constrain(0,(block.opacity + (1/Math.min(750,game.level.rowTimer)) * deltaT),1);
        if (block.element) block.element.attr("opacity",block.opacity);
        if (block.textElement) block.textElement.attr("opacity",block.opacity);
        if(block.opacity==1){
            blocksToRemove.push(block);
        }
    })
    blocksToRemove.forEach((block)=>game.newBlocks.splice(game.newBlocks.indexOf(block)));
}

var blockId = 0;
function addBlock(left, top, scale, colorIndex, opacity, powerUp){
    block = {
        opacity: opacity,
        left: left,
        top: top,
        width: scale * game.blockHeight,
        height: game.blockHeight, 
        color: powerUp ? Math.random() : colorIndex,
        powerUp: powerUp
    };
    fill = powerUp ? colorIndex :  game.palette[colorIndex];
    block.element = game.screen.rect(block.left, block.top, block.width, block.height);
    block.element.attr({fill: fill, stroke:fill, opacity:opacity, id:'block'+blockId,});
    if (powerUp){
        block.textElement = game.screen.text(block.left + block.width/2, block.top + block.height/2, powerUp);
        block.textElement.attr("fill","#FFF");
        block.textElement.attr("font-size","30pt");
        block.textElement.attr("opacity",opacity);
        block.element.toFront();
        block.textElement.toFront();
    }
    blockId++;
    game.blocks.push(block);
    game.newBlocks.push(block);
   updateZorder();
}

function movePowerUps(deltaT){
    powerUpsToRemove=[];
    game.powerUps.forEach((powerUp)=>{
        powerUp.top = powerUp.top + (500/1000) * deltaT;
        if(powerUp.top>game.height){
            powerUpsToRemove.push(powerUp);
            return;
        }

        //render
        powerUp.element.attr("y", powerUp.top);
        powerUp.element.toFront();
        powerUp.textElement.attr("y", powerUp.top + powerUp.height/2);
        powerUp.textElement.toFront();

        if(Raphael.isBBoxIntersect(powerUp.element.getBBox(),game.paddle.element.getBBox())){
            powerUpsToRemove.push(powerUp);
            switch (powerUp.textElement.attr("text")){
                case puExtraBall:
                    addBall();
                    launchBall();
                    break;
                case puGrowPaddle:
                    growPaddle();
                    break;
                case puShrinkPaddle:
                    shrinkPaddle();
                    break;
                case puResetDifficulty:
                    setDifficulty(1);
                    break;
            }
        }

    });
    powerUpsToRemove.forEach((powerUp)=>{
       game.powerUps.splice(game.powerUps.indexOf(powerUp),1);
       powerUp.element.remove();
       powerUp.textElement.remove(); 
    });

    updateZorder();

}

function growPaddle(){
    game.paddle.isSmall = false;
    game.paddle.width += game.paddle.width * .20;
    game.paddle.width = Math.min(game.paddle.width, game.width/2);
    if (game.paddle.width == game.width/2){
        game.paddle.isLarge = true;
    }
    game.paddle.element.attr("width",game.paddle.width);
    if (game.paddle.left + game.paddle.width > game.width){
        game.paddle.left = game.width - game.paddle.width;
        game.paddle.element.attr("x", game.paddle.left);
    }
}

function shrinkPaddle(){
    game.paddle.isLarge = false;
    game.paddle.width -= game.paddle.width * .20;
    game.paddle.width = Math.max(game.paddle.width, game.width/8);
    if (game.paddle.width == game.width/8){
        game.paddle.isSmall = true;
    }
    game.paddle.element.attr("width",game.paddle.width);
}

function screenCleared(){
    if(game.isRunning){
        
        game.textElement.attr("text","Screen Cleared!\n+1 Extra Life!");
        sounds.clearScreen();
        addToLives(1);
        setTimeout(()=>{game.textElement.attr("text","")}, 1000);

    }
}

function oninput(e,a){
    if (document.hasFocus() && game.paddle.element && game.isRunning){
        r = e.target.getBoundingClientRect();
        pos = ((e.clientX-r.x)/r.width) * game.width;
        if (!isNaN(pos)) {
            pos -= game.paddle.width/2;
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
            ball.left = (game.paddle.left + game.paddle.width/2) - (ball.width/2);
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
            sounds.ballHitWall();
        }
        if (ball.left<0){
            ball.left = ball.left * -1;
            hitX = true;
            sounds.ballHitWall();
        } else if (ball.left + ball.width > game.width){
            overage = (ball.left + ball.width) - game.width; 
            ball.left = (game.width - ball.width) - overage;
            hitX = true;
            sounds.ballHitWall();
        }

        game.balls.forEach((ball2)=>{
            if (ball2 == ball) return;
            if(Raphael.isBBoxIntersect(ball.element.getBBox(), ball2.element.getBBox())){
                sounds.ballHitBall();
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
            sounds.ballHitBlock();
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
            ball.directionX = constrain(-1600, ball.directionX, 1600);
            sounds.ballHitPaddle();
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
    initialCount = game.blocks.length;
    game.blocks.forEach((block)=> {if(block.removing==true) {blocksToRemove.push(block)}});
    
    addToScore(game.blocks.length * game.level.difficulty * 5);

    blocksToRemove.forEach((block)=> {
        game.blocks.splice(game.blocks.indexOf(block),1);
        if(block.powerUp && game.isRunning){
            block.element.attr({"stroke":"#fff","stroke-width":3});
            block.element.attr("r",20);     
            game.powerUps.push(block);
            
        }else{       
            if(block.element) block.element.remove();
            if(block.path){
                if(block.path.top) {block.path.top.remove(); block.path.top=null};
                if(block.path.left) {block.path.left.remove(); block.path.left=null};
                if(block.path.right) {block.path.right.remove(); block.path.right=null};
                if(block.path.bottom) {block.path.bottom.remove(); block.path.bottom=null};
            }
            if(block.textElement) block.textElement.remove();
            block.element = null;
            block = null
            
        }
    });

    if(game.blocks.length==0 && initialCount>0){
        screenCleared();
    }
};

function removeAllPowerUps(){
    powerUpsToRemove = Array.from(game.powerUps);
    powerUpsToRemove.forEach((powerUp)=>{
        powerUp.element.remove();
        powerUp.textElement.remove();
        game.powerUps.splice(game.powerUps.indexOf(powerUp),1);
    });
}

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

    updateZorder();
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
    movePowerUps(deltaT);
    if(game.balls.length>0 && !game.balls[0].anchored){
        gameTime+=deltaT;
        if(gameTime > game.level.rowTimer){
            //alert(gameTime + ", " + game.level.rowTimer);
            gameTime = 0;
            moveBlocks(deltaT);
        }        
    }else if(game.balls.length == 0) {
        removeAllPowerUps();
        if (game.lives > 0) {
            sounds.ballLost();
            addToLives(-1)
            addBall();
        }
        else {
            endGame();
            return;
        }
    }
    
    if(document.hasFocus()){
        if (game.isRunning){
            setTimeout(()=>gameLoop(start),1);
        }
    }else{
        pauseLoop();
    }

}

function addRow(top){
    
    powerUpInventory = getAvailablePowerUps();

    game.rowsCreated++;
    totalWidth=0;
    lastColor=0;
        
    for (var i=0; i<5; i++){
        color = constrain(0,Math.round(Math.random()*game.palette.length),game.palette.length-1);
        scale = 4;
        powerUp = null;
        //TODO: base on difficulty
        if(Math.round(Math.random()*30)==1){
            p = powerUpInventory[Math.round(Math.random() * powerUpInventory.length)];
            if (p){
                powerUp = p.powerUp;
                color = p.color;
                powerUpInventory.splice(powerUpInventory.indexOf(p),1);
            }
        }
        addBlock(totalWidth, top, scale, color, 0, powerUp);
        totalWidth += scale * game.blockHeight;
    }
    if (game.rowsCreated % 20 == 0) {
        increaseLevel();
    }
}

function getAvailablePowerUps(){
    powerUpInventory = [];
    if (game.balls.length < 3) {
        powerUpInventory.push({powerUp:puExtraBall,color:"#080"});
    }
    if(!game.paddle.isLarge){
        powerUpInventory.push({powerUp:puGrowPaddle,color:"#09F"});    
    }
    if(!game.paddle.isSmall){
        powerUpInventory.push({powerUp:puShrinkPaddle,color:"#800"});    
    }
    if(game.level.difficulty>4){
        powerUpInventory.push({powerUp:puResetDifficulty,color:"#BF7F00"});        
    }
    /*
    if(!game.shield && game.level.difficulty>3){
        powerUpInventory.push({powerUp:puShield,color:"#BF7F00"});            
    }
    */
    return powerUpInventory;
}

function moveBlocks(){
    game.blocks.forEach((block)=>{
        block.top = block.top + game.blockHeight;
        block.element.attr("y", block.top);
        if(block.textElement){
            block.textElement.attr("y", block.top + block.height/2);
        }
        if(block.top+block.height >= game.paddle.top){
            endGame();
        }
    });

    addRow(game.top);
    trace();
}


function increaseLevel(){
    game.level.number += 1;
    game.levelElement.attr("text", "Level " + game.level.number);
    setDifficulty( game.level.difficulty + 1);
}

function setDifficulty(difficulty){
    game.level.difficulty = constrain(1, difficulty, 8);
    switch (game.level.difficulty){
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
        default:
            game.palette = ["#F88","#FF8", "#8FF", "#FB7", "#8F8", "#88F"];
            game.level.rowTimer = 500;
            break;
    }
}

function addToScore(points){
    game.score += points;
    game.scoreElement.attr("text",numberWithCommas(game.score));
    if (game.score>game.highScore){
        game.highScore = game.score;
        game.highScoreElement.attr("text",numberWithCommas(game.highScore));
    }
}
function addToLives(lives){
    
    game.lives+=lives;
    game.livesElement.attr("text","Lives: " + game.lives);
}

function startGame(){
    if (game.isEnding) return;
    sounds.init();
    sounds.gameStart();
    game.blocks.forEach((block)=>{removeBlock(block)});
    
    removeAllPowerUps();
    commitRemoval();
    initPaddle();
    game.rowsCreated=0;
    game.level.number=0;
    game.level.difficulty = 0;
    game.lives = 2;
    addToLives(0);
    game.score = 0;
    game.scoreElement.attr("text","0");
    game.textElement.attr("text","");
    game.newBlocks = [];
    if(game.textBackgroundElement){
        game.textBackgroundElement.remove();
        game.textBackgroundElement = null;
    }
    increaseLevel();
    for(var i=0; i<10; i++){
        addRow(game.top + (game.blockHeight * i));
    }
    trace();
    addBall();
    game.isRunning = true,
    gameLoop(Date.now());
}

function endGame(){
    
    sounds.gameOver();
    game.isRunning = false;
    game.isEnding = true;
    setCookie("highScore", game.highScore, 365);
    deadBalls = Array.from(game.balls);
    deadBalls.forEach((ball)=>{
        ball.element.remove();
        game.balls.splice(game.balls.indexOf(ball),1);
    })
    
    game.textBackgroundElement = game.screen.rect(game.width *.10, game.height*.45, game.width * .80, game.height *.10);
    game.textBackgroundElement.attr({fill:"#000",opacity:.75});
    game.textElement.attr("text","Game Over!");
    updateZorder();
    setTimeout(()=>{
        game.isEnding = false;
        updateZorder();
        
    },1000)
}

function updateZorder(){
    if(game.textBackgroundElement) game.textBackgroundElement.toFront();
    if(game.textElement) game.textElement.toFront();
    game.balls.forEach((ball)=>{ball.element.toFront();});
    game.powerUps.forEach((powerUp)=>{powerUp.element.toFront();powerUp.textElement.toFront();});
    game.control.element.toFront();
}


initScreen();
initControl();


