
const SCREENBLACK = "#080808";

const LANDSCAPE = 0;
const PORTRAIT = 1;

const PAUSED = 0;
const RUNNING = 1;

const NORTH = 0;
const EAST = 1;
const SOUTH = 2;
const WEST = 3;

const NORTHEAST = NORTH + 0.5;
const SOUTHEAST = EAST + 0.5;
const SOUTHWEST = SOUTH + 0.5;
const NORTHWEST = WEST + 0.5;

const UP_ARROW = 38;
const RIGHT_ARROW = 39;
const DOWN_ARROW = 40;
const LEFT_ARROW = 37;

const DEAD = -1;
const IDLE = 0;
const WALKING = 1;
const ATTACKING = 2;
const HURT = 3;
const DYING = 4;
const THROWING = 5;

const UNALIGNED = 0;
const HEROIC = 1;
const DUNGEON = 2;

const SHADOW = -1
const DEFAULT = 0;
const EFFECT = 1;

const PHYSICAL = 0;
const ETHEREAL = 1;

const RANDOM = -1;
const NONE = 0;
const SILVERKEY = 1;
const GOLDKEY = 2;
const REDKEY = 3;
const GREENKEY = 4;
const BLUEKEY = 5;
const HEARTCONTAINER = 6;
const HEART = 7;
const COIN = 8;
const CHALICE = 9;
const CROWN = 10;
const SWORD = 11;
const BEETLE = 12;

const SCREEN_WIDTH = window.screen.width;
const SCREEN_HEIGHT = window.screen.height;

var ORIENTATION = LANDSCAPE;

var constants =  {
    brickHeight: 16,
    brickWidth: 50,
    lineThickness: 3,
    doorWidth: 110,
    doorFrameThickness: 10,
    doorHeight: 70,
    thresholdDepth: 20,
    roomMinWidthInBricks: 5,
    roomMinHeightInBricks: 5,
    roomMaxWidthInBricks: 15,
    roomMaxHeightInBricks: 15, 
    spriteFamesPerSecond: 10,
    controllerRadius: 210,
    controllerCrossThickness: 70,
    maxHeartContainers: 25
};

function onOrientationChange(e) {
    if(e.matches||SCREEN_WIDTH>SCREEN_HEIGHT) {
        ORIENTATION = LANDSCAPE;
        document.getElementById("controller").style.display = "none";
        game.screen.setViewBox(0, 0, dimensions.width, dimensions.width + dimensions.infoHeight, true);
    } else {        
        ORIENTATION = PORTRAIT;
        document.getElementById("controller").style.display = "block";    
        game.screen.setViewBox(0, 0, dimensions.width, dimensions.height, true);  
    }
}

function directionToDegress(direction){
    switch (direction){
        case NORTH:
            return 0;
        case NORTHEAST:
            return 45;
        case EAST:
            return 90;
        case SOUTHEAST:
            return 135;
        case SOUTH: 
            return 180;
        case SOUTHWEST:
            return 225;
        case WEST:
            return 270;
        case NORTHWEST:
            return 315;
        default:
            return 0;
    }
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function msToTime(duration) {
    var milliseconds = Math.floor((duration % 1000) / 100),
      seconds = Math.floor((duration / 1000) % 60),
      minutes = Math.floor((duration / (1000 * 60)) % 60),
      hours = Math.floor((duration / (1000 * 60 * 60)));
  
    hours = hours > 0 ? ((hours < 10) ? "0" + hours + ":" : hours + ":") : "";
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
  
    return hours + minutes + ":" + seconds + "." + milliseconds;
}

function getOpposingTeam(team){
    switch(team){
        case HEROIC:
            return DUNGEON;
        case DUNGEON:
            return HEROIC;
    }
}

function newBox(x, y, w, h) {
    return {
        x: x,
        y: y,
        width: w,
        height: h,
        reset: function(newX, newY, newW, newH){
            this.x = newX;
            this.y = newY;
            this.width = newW;
            this.height = newH;
        },
        center: function() {
            return {
                x: this.x + Math.round(this.width/2),
                y: this.y + Math.round(this.height/2)
            }
        },
        inside: function(box){
            if(
                box && 
                this.x >= box.x && this.x <= box.x + box.width &&
                this.x + this.width >= box.x && this.x + this.width <= box.x + box.width &&
                this.y >= box.y && this.y <= box.y + box.height &&
                this.y + this.height >= box.y && this.y + this.height <= box.y + box.height
            ){
                return true;
            }
            return false;
        },

        collidesWith: function(box){

                // Check for overlap along the X axis
                if (this.x + this.width < box.x || this.x > box.x + box.width) {
                    return false;
                }

                // Check for overlap along the Y axis
                if (this.y + this.height < box.y || this.y > box.y + box.height) {
                    return false;
                }

                // If there is overlap along all axes, collision has occurred
                return true;
        },
        resolveCollision: function(box){

            var overlapX = Math.min(this.x + this.width, box.x + box.width) - Math.max(this.x, box.x);
            var overlapY = Math.min(this.y + this.height, box.y + box.height) - Math.max(this.y, box.y);
        
            if (overlapX > 0 && overlapY > 0) {
                let mtvX = 0;
                let mtvY = 0;
        
                if (overlapX < overlapY) {
                    mtvX = this.center().x < box.center().x ? 1 : -1;
                } else {
                    mtvY = this.center().y < box.center().y ? 1 : -1;
                }
                this.x -= mtvX * overlapX;
                this.y -= mtvY * overlapY;
            }
        },
        intersectRect(box) {
            var left = Math.max(this.x, box.x);
            var top = Math.max(this.y, box.y);
            var right = Math.min(this.x + this.width, box.x + box.width);
            var bottom = Math.min(this.y + box.height, box.y + box.height);
            
            // Check if there's an actual intersection
            if (left < right && top < bottom) {
                return newBox(left, top, right-left, bottom-top);
            } else {
                // No intersection
                return null;
            }
        },
        distance: function(box){
            var c1 = this.center();
            var c2 = box.center();
            var dx = c2.x - c1.x;
            var dy = c2.y - c1.y;
            return Math.sqrt(dx * dx + dy * dy);
        },
        render: function(color){
            if(!this.element){ 
                this.element = game.screen.rect(this.x, this.y + dimensions.infoHeight, this.width, this.height).attr("stroke", color);
                game.screen.onClear(()=>{this.element = null});
            };
            this.element.attr({x:this.x, y:this.y + dimensions.infoHeight, width: this.width, height: this.height});
        },
        remove: function(){
            if(this.element){
                this.element.remove();
                this.element = null;
            }   
        }
    }
}

function constrain (min, val, max){
    if (val<min) return min;
    if (val>max) return max;
    return val;
}

function right(str,chr)
{
    return str.substr(str.length-chr,str.length)
}

function hexToRGB(hexColor){
    if(hexColor.length==6 || hexColor.length == 3){
        hexColor = "#" + hexColor
    }
    red="00";
    green = "00";
    blue = "00"
    if(hexColor.length == 4){
        red = hexColor.substring(1,2);
        red += red;
        green = hexColor.substring(2,3);
        green += green;
        blue = hexColor.substring(3,4);
        blue += blue;
    }
    if(hexColor.length == 7){
        red = hexColor.substring(1,3);
        green = hexColor.substring(3,5);
        blue = hexColor.substring(5,7);
    }

    return {
        r: parseInt(red,16),
        g: parseInt(green,16),
        b: parseInt(blue,16)
    }
}

function rgbToHex(rgb){
    hex="#"
    hex += right("0" + rgb.r.toString(16),2);
    hex += right("0" + rgb.g.toString(16),2);
    hex += right("0" + rgb.b.toString(16),2);
    return hex;
}

function calculateAlpha(backgroundHex, foregroundHex, foregroundOpacity){
    //alpha * new + (1 - alpha) * old
    backgroundRGB = hexToRGB(backgroundHex);
    foregroundRGB = hexToRGB(foregroundHex);
    return rgbToHex({
        r: Math.round(foregroundRGB.r * foregroundOpacity + (1-foregroundOpacity) * backgroundRGB.r),
        g: Math.round(foregroundRGB.g * foregroundOpacity + (1-foregroundOpacity) * backgroundRGB.g),
        b: Math.round(foregroundRGB.b * foregroundOpacity + (1-foregroundOpacity) * backgroundRGB.b)
    });
}

const trig = {
    degreesToRadians: function (angle){
        return (angle % 360) / 360 * 2 * Math.PI
    },
    radiansToDegrees: function (angle){
        return angle * 57.2958
    },
    cotangent: function (radians){
        return 1/Math.tan(radians);
    },
    tangent: function (radians){
        return Math.tan(radians);
    },
    pointToAngle: function(opposite, adjacent){
        return Math.atan(opposite/adjacent);
    }
};

const dimensions = {
    width: 910, 
    height: 1618,
    infoHeight: 88,
};

const palette = {
    doorFrame: "#928e85",
    doorDefaultColor: "#4d3737",
    doorBarColor: "#999"
};

function randomEntry(array){
    if(array.length == 0){
        return null;
    }
    index =  Math.floor((array.length-1) * Math.random());
    return array[index]; 
}

function filter(array, fun){
    var array2 = [];
    array.forEach((item)=>{
        if(fun(item)){
            array2.push(item);
        }
    })
    return array2;
}

function remove(array, fun){
    itemsToDelete = filter(array,fun);
    itemsToDelete.forEach((item)=>{
        array.splice(array.indexOf(item),1);
    });
}

function any(array, fun){
    if(!array){
        return false;
    }
    for(var i=0;i<array.length; i++){
        if(fun(array[i])){
            return true;
        }
    }
    return false;
}

function newStatistics(title){
    return {
        damageDealt: 0,
        damageReceived: 0,
        goldCollected: 0,
        keysCollected:0,
        keysSpawned: 0,
        heartsCollected:0,
        chestsSpawned:0,
        chestsOpened:0,
        enemiesKilled: 0,
        enemiesSpawned:0,
        caveSpidersSpawned: 0,
        caveSpidersKilled: 0,
        swordSkeletonsSpawned: 0,
        swordSkeletonsKilled: 0,
        kingCobrasSpawned: 0,
        kingCobrasKilled: 0,
        doorsUnlocked:0,
        doorsSpawned:0,
        roomsVisited:0,
        roomsSpawned:0,
        timeSpent:0,
        add: function(s){
            this.damageDealt += s.damageDealt;
            this.damageReceived += s.damageReceived;
            this.goldCollected += s.goldCollected;
            this.keysCollected += s.keysCollected;
            this.keysSpawned += s.keysSpawned;
            this.heartsCollected += s.heartsCollected;
            this.chestsSpawned += s.chestsSpawned;
            this.chestsOpened += s.chestsOpened;
            this.enemiesKilled += s.enemiesKilled;
            this.enemiesSpawned += s.enemiesSpawned;
            this.caveSpidersSpawned += s.caveSpidersSpawned;
            this.caveSpidersKilled += s.caveSpidersKilled;
            this.swordSkeletonsSpawned += s.swordSkeletonsSpawned;
            this.swordSkeletonsKilled += s.swordSkeletonsKilled;
            this.kingCobrasSpawned += s.kingCobrasSpawned;
            this.kingCobrasKilled += s.kingCobrasKilled;
            this.doorsUnlocked += s.doorsUnlocked;
            this.doorsSpawned += s.doorsSpawned;
            this.roomsVisited += s.roomsVisited;
            this.roomsSpawned += s.roomsSpawned;
            this.timeSpent += s.timeSpent;
        },
        finalizeLevelStats: function(){
            this.roomsVisited = filter(game.level.rooms,(r)=>{return r.visited}).length
            this.roomsSpawned = game.level.rooms.length
        },
        render:function(title, box){
            var y = box.y + dimensions.infoHeight + 64;
            var title = game.screen.text(box.center().x, y,title)
            title.attr({ "font-size": "48px", "font-family": "monospace", "fill": "#FFF", "text-anchor": "middle", "font-weight": "bold"});

            var x1 = box.x + 40;
            var x2 = box.x + box.width - 40;
            var indent = 40;
            attrHeaderLeft = { "font-size": "32px", "font-family": "monospace", "fill": "#FFF", "text-anchor": "start", opacity:0};
            attrHeaderRight = { "font-size": "32px", "font-family": "monospace", "fill": "#FFF", "text-anchor": "end", opacity:0};
            
            attrStatLeft = { "font-size": "24px", "font-family": "monospace", "fill": "#FFF", "text-anchor": "start", opacity:0};
            attrStatRight = { "font-size": "24px", "font-family": "monospace", "fill": "#FFF", "text-anchor": "end", opacity:0};
            
            stats=[];

            y += 64;
            stats.push(game.screen.text(x1, y, "LEVELS CLEARED:").attr(attrHeaderLeft));
            stats.push(game.screen.text(x2, y,  numberWithCommas(game.level.number + (game.player.status==DEAD ? 0 : 1))).attr(attrHeaderRight));

            y += 64;
            stats.push(game.screen.text(x1, y, "TIME SPENT:").attr(attrHeaderLeft));
            stats.push(game.screen.text(x2, y,  msToTime(this.timeSpent)).attr(attrHeaderRight));
            
            y += 64;
            stats.push(game.screen.text(x1, y, "ROOMS DISCOVERED:").attr(attrHeaderLeft));
            stats.push(game.screen.text(x2, y,  numberWithCommas(this.roomsVisited) + " / " + numberWithCommas(this.roomsSpawned)).attr(attrHeaderRight));
            
            y += 40;
            stats.push(game.screen.text(x1 + indent, y,"DOORS UNLOCKED:").attr(attrStatLeft));
            stats.push(game.screen.text(x2, y, numberWithCommas(this.doorsUnlocked) + " / " + numberWithCommas(this.doorsSpawned)).attr(attrStatRight));

            y += 40;
            stats.push(game.screen.text(x1 + indent, y,"KEYS COLLECTED:").attr(attrStatLeft));
            stats.push(game.screen.text(x2, y, numberWithCommas(this.keysCollected) + " / " + numberWithCommas(this.keysSpawned)).attr(attrStatRight));

            y += 64;
            stats.push(game.screen.text(x1, y,"CHESTS OPENED:").attr(attrHeaderLeft));
            stats.push(game.screen.text(x2, y, numberWithCommas(this.chestsOpened) + " / " + numberWithCommas(this.chestsSpawned)).attr(attrHeaderRight));
            
            y += 40;
            stats.push(game.screen.text(x1 + indent, y,"GOLD COLLECTED:").attr(attrStatLeft));
            stats.push(game.screen.text(x2, y, numberWithCommas(this.goldCollected)).attr(attrStatRight));

            y += 40;
            stats.push(game.screen.text(x1 + indent, y,"HEARTS COLLECTED:").attr(attrStatLeft));
            stats.push(game.screen.text(x2, y, numberWithCommas(this.heartsCollected)).attr(attrStatRight));

            y += 64;
            stats.push(game.screen.text(x1, y,"ENEMIES KILLED:").attr(attrHeaderLeft));
            stats.push(game.screen.text(x2, y, numberWithCommas(this.enemiesKilled) + " / " + numberWithCommas(this.enemiesSpawned)).attr(attrHeaderRight));

            y += 40;
            stats.push(game.screen.text(x1 + indent, y,"DAMAGE DEALT:").attr(attrStatLeft));
            stats.push(game.screen.text(x2, y, numberWithCommas(this.damageDealt)).attr(attrStatRight));

            y += 40;
            stats.push(game.screen.text(x1 + indent, y,"DAMAGE RECEIVED:").attr(attrStatLeft));
            stats.push(game.screen.text(x2, y, numberWithCommas(this.damageReceived)).attr(attrStatRight));

            if(this.caveSpidersSpawned>0){       
                y += 40;
                stats.push(game.screen.text(x1 + indent, y,"SPIDERS SQUASHED:").attr(attrStatLeft));
                stats.push(game.screen.text(x2, y, numberWithCommas(this.caveSpidersKilled) + " / " + numberWithCommas(this.caveSpidersSpawned)).attr(attrStatRight));
            }
            if(this.swordSkeletonsSpawned>0){       
                y += 40;
                stats.push(game.screen.text(x1 + indent, y,"SKELETONS SMASHED:").attr(attrStatLeft));
                stats.push(game.screen.text(x2, y, numberWithCommas(this.swordSkeletonsKilled) + " / " + numberWithCommas(this.swordSkeletonsSpawned)).attr(attrStatRight));
            }
            if(this.kingCobrasSpawned>0){       
                y += 40;
                stats.push(game.screen.text(x1 + indent, y,"SNAKES STOMPED:").attr(attrStatLeft));
                stats.push(game.screen.text(x2, y, numberWithCommas(this.kingCobrasKilled) + " / " + numberWithCommas(this.kingCobrasSpawned)).attr(attrStatRight));
            }

            var ms = 0;
            stats.forEach((s,i)=>{
                if(i % 2 == 0){
                    ms += 100;
                }
                setTimeout(()=>{s.animate({opacity:1},250)}, ms);
            });

 
        }

    }    
}

function fadeTo(color, callback){
    game.screen.drawRect(0,dimensions.infoHeight,dimensions.width, dimensions.width, color, color, 0).attr({opacity: 0}).animate({opacity:1}, 350, null, callback);
}

function fadeInFrom(color, callback){
    game.screen.drawRect(0,dimensions.infoHeight,dimensions.width, dimensions.width, color, color, 0).attr({opacity: 1}).animate({opacity:0}, 350, null, callback);
}

function newScreen(domElementId){
    var screen = Raphael(domElementId, dimensions.width, dimensions.height);
    screen.setViewBox(0, 0, dimensions.width, dimensions.height, true);
    screen.canvas.setAttribute('preserveAspectRatio', 'meet');
    screen.canvas.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space","preserve"); 
    //helper functions

    screen.drawLine = function(x1,y1,x2,y2,color,thickness){
        var path = "M" + x1 + "," + y1 + "L" + x2 + "," + y2;
        return this.path(path).attr({"stroke-width": thickness, "stroke":color});
    };

    screen.drawTriangle =  function(x1,y1,x2,y2,x3,y3, translateX, translateY, fillColor, strokeColor, thickness){
        var path =  "M" + (x1 + translateX) + "," + (y1 + translateY) + "L" + (x2 + translateX) + "," + (y2 + translateY) + "L" + (x3 + translateX) + "," + (y3 + translateY) + "Z";
        return this.path(path).attr({"stroke-width": thickness, "stroke": strokeColor, "fill": fillColor});
    };
    
    screen.drawRect = function(x,y,w,h,color,strokecolor, thickness){
        return this.rect(x,y,w,h).attr({"stroke-width": thickness, "stroke":strokecolor, "fill": color});
    };

    screen.drawPoly = function(x1,y1,x2,y2,x3,y3,x4,y4, translateX, translateY, fillColor, strokeColor, thickness){
        var path =  "M" + (x1 + translateX) + "," + (y1 + translateY) + "L" + (x2 + translateX) + "," + (y2 + translateY) + "L" + (x3 + translateX) + "," + (y3 + translateY) + "L" + (x4 + translateX) + "," + (y4 + translateY) + "Z";
        return this.path(path).attr({"stroke-width": thickness, "stroke": strokeColor, "fill": fillColor});
    };

    screen.drawEllipse = function(x1,y1,r1,r2, translateX, translateY, fillColor, strokeColor, thickness){
        var e = this.ellipse(x1+translateX, y1+translateY, r1, r2)
         e.attr({"stroke-width": thickness, "stroke": strokeColor, "fill": fillColor});
         return e;
    };

    screen.drawAngleSegmentX = function(angle, startX, endX, translateX, translateY, color, thickness){
        var startY = Math.round(trig.tangent(angle) * startX);
        var endY = Math.round(trig.tangent(angle) * endX);
        startX+=translateX; endX += translateX;
        startY+=translateY; endY += translateY;
        return this.drawLine(startX, startY, endX, endY, color, thickness);
    };
    
    screen.drawAngleSegmentY = function(angle, startY, endY, translateX, translateY, color, thickness){
        var startX = Math.round(trig.cotangent(angle) * startY);
        var endX = Math.round(trig.cotangent(angle) * endY);
        startX+=translateX; endX += translateX;
        startY+=translateY; endY += translateY;
        return this.drawLine(startX, startY, endX, endY, color, thickness);
    }
    screen._clear = screen.clear;
    screen.clearListeners = [];
    screen.clear = function(){
        failed=[]
        this.clearListeners.forEach((f)=>{
            try{
                f();
            } catch(e){
                failed.push(f);
            }
        });
        failed.forEach((f)=>this.clearListeners.splice(this.clearListeners.indexOf(f),1));
        this._clear();
    }
    screen.onClear = function (handler){
        //register handler
        this.clearListeners.push(handler);
    }

    return screen;
}   

function newControllerBase(){
    return {
        up:0,
        left:0,
        down:0,
        right:0,
        attack:0,
        elements: [],
        read: function(forObject){
            return {
                x: this.left * -1 + this.right,
                y: this.up * -1  + this.down,
                a: this.attack    
            }
        }
    };  
}

function newInputController(){
    var controller = newControllerBase();
    controller.screen = newScreen("controller");

    controller.touchStartOrMove = function(e){
        e.preventDefault(e);
        
        var button = this.elements[this.elements.length-3];
        var dpad = this.elements[this.elements.length-2];
        var controller = this.elements[this.elements.length-1];
        
        var r = e.target.getBoundingClientRect();
     
        //r.y = r.y - dimensions.infoHeight - dimensions.width
        var touches = Array.from(e.touches);
        var dpadTouched = false;
        var buttonTouched = false;
        touches.forEach((t)=>{   
            
            //console.log(r,t,this.screen);
            //console.log(t);


            x = (((t.clientX - r.x)/r.width))//*constants.controllerRadius*2) - constants.controllerRadius;
            y = (((t.clientY - r.y)/r.height))//*constants.controllerRadius*2) - constants.controllerRadius;// * dimensions.height;
            x = x * controller.attr("width");
            y = y * controller.attr("height") + dimensions.infoHeight + dimensions.width;

            d = dpad.getBBox();
            
            if(x>d.x && x<d.x + d.width && y>d.y && y<d.y+d.width){
                dpadTouched = true;
                //this.screen.drawRect(x,y, 10, 10, "#FF0", "#000",0)

                x = ((x - d.x)-d.width/2)/(d.width/2);
                y = ((y - d.y)-d.height/2)/(d.height/2)
            
                d = Math.abs(trig.radiansToDegrees(trig.pointToAngle(y,x)));
                this.up = y < 0 && d > 23 ? 1 : 0;
                this.right = x > 0 && d < 68 ? 1 : 0;
                this.down = y > 0 && d > 22 ? 1 : 0;
                this.left = x < 0 && d < 68 ? 1 : 0;
            }
            
            b = button.getBBox();
            if(x>b.x && x<b.x + b.width && y>b.y && y<b.y+b.width){
                dpadTouched = true;
                buttonTouched = true;
                this.attack = true;
            }

        })
        if(!dpadTouched){
            this.up = 0;
            this.right = 0;
            this.down =  0;
            this.left = 0;
        }
        if(!buttonTouched){
            this.attack = 0;
        }
    };

    controller.render =function(){
        var centerY = Math.round((dimensions.height - dimensions.width - dimensions.infoHeight)/2 + dimensions.width + dimensions.infoHeight);
        var dPadLeft = Math.round(dimensions.width/4);  
        if (this.elements.length ==0){

            var color="#242424";
           this.screen.rect(0, dimensions.width + dimensions.infoHeight, dimensions.width, dimensions.height - dimensions.width - dimensions.infoHeight).attr({"fill":color, "r": 50});
            color = "#3a3a3a";
            this.elements.push(this.screen.drawEllipse(dPadLeft, centerY, constants.controllerRadius, constants.controllerRadius,0,0,color,"#000",constants.lineThickness));
            color = "#444444";
            this.elements.push(this.screen.drawRect(dPadLeft - constants.controllerCrossThickness/2, centerY - constants.controllerRadius, constants.controllerCrossThickness, constants.controllerRadius*2,color, "#000",constants.lineThickness))
            this.elements.push(this.screen.drawRect(dPadLeft - constants.controllerRadius, centerY - constants.controllerCrossThickness/2, constants.controllerRadius*2, constants.controllerCrossThickness,color, "#000",constants.lineThickness))
            this.elements.push(this.screen.drawRect(dPadLeft - constants.controllerCrossThickness/2, centerY - constants.controllerCrossThickness/2-constants.lineThickness/2, constants.controllerCrossThickness, constants.controllerCrossThickness + constants.lineThickness,color, color,0))
            this.elements.push(this.screen.drawLine(dPadLeft - constants.controllerCrossThickness/2, centerY - constants.controllerCrossThickness/2, dPadLeft + constants.controllerCrossThickness/2, centerY + constants.controllerCrossThickness/2,"#000",constants.lineThickness))
            this.elements.push(this.screen.drawLine(dPadLeft + constants.controllerCrossThickness/2, centerY - constants.controllerCrossThickness/2, dPadLeft - constants.controllerCrossThickness/2, centerY + constants.controllerCrossThickness/2,"#000",constants.lineThickness))
            var arrowMargin = 4 * constants.lineThickness;
            var arrowHeight = 40;
            color = "#303030";
            this.elements.push(this.screen.drawTriangle(
                dPadLeft, centerY - constants.controllerRadius + arrowMargin,
                dPadLeft + constants.controllerCrossThickness/2 - arrowMargin, centerY - constants.controllerRadius + arrowHeight, 
                dPadLeft - constants.controllerCrossThickness/2 + arrowMargin, centerY - constants.controllerRadius + arrowHeight,  
                0,0, color, "#000",0//constants.lineThickness
            ));
            this.elements.push(this.screen.drawTriangle(
                dPadLeft + constants.controllerRadius - arrowMargin, centerY,
                dPadLeft + constants.controllerRadius - arrowHeight, centerY + constants.controllerCrossThickness/2 - arrowMargin, 
                dPadLeft + constants.controllerRadius - arrowHeight, centerY - constants.controllerCrossThickness/2 + arrowMargin,  
                0,0, color, "#000",0
            ));
            this.elements.push(this.screen.drawTriangle(
                dPadLeft, centerY + constants.controllerRadius - arrowMargin,
                dPadLeft + constants.controllerCrossThickness/2 - arrowMargin, centerY + constants.controllerRadius - arrowHeight, 
                dPadLeft - constants.controllerCrossThickness/2 + arrowMargin, centerY + constants.controllerRadius - arrowHeight,  
                0,0, color, "#000",0
            ));
            this.elements.push(this.screen.drawTriangle(
                dPadLeft - constants.controllerRadius + arrowMargin, centerY,
                dPadLeft - constants.controllerRadius + arrowHeight, centerY + constants.controllerCrossThickness/2 - arrowMargin, 
                dPadLeft - constants.controllerRadius + arrowHeight, centerY - constants.controllerCrossThickness/2 + arrowMargin,  
                0,0, color, "#000",0
            ));
            
            
            var el = this.screen.drawEllipse(Math.round(dimensions.width*.75), centerY, constants.controllerRadius/2, constants.controllerRadius/2,0,0,"#800","#000",constants.lineThickness);
            this.elements.push(el);

            var el2 = this.screen.drawEllipse(dPadLeft, centerY, constants.controllerRadius, constants.controllerRadius,0,0,"90-rgba(200,200,200,0.05)-rgba(0,0,0,0.2):50","#000",constants.lineThickness).attr({"opacity":.2})
            this.elements.push(el2);

            var el3 = this.screen.drawRect(0, dimensions.width + dimensions.infoHeight, dimensions.width, dimensions.height-(dimensions.width + dimensions.infoHeight),"#000","#000",constants.lineThickness).attr({"opacity":.1})
            el3.touchstart((e)=>{this.touchStartOrMove(e)});
            el3.touchmove((e)=>{this.touchStartOrMove(e)});
            el3.touchend((e)=>{this.touchStartOrMove(e)});
            this.elements.push(el3);
        }

        var butt = this.elements[this.elements.length-3];
        butt.attr({fill:this.attack ? "#600" : "#800"})

        var el = this.elements[this.elements.length-2];
        //read controller
        var x = this.left * -1 + this.right;
        var y = this.up * -1  + this.down;

        var degrees = 0;
        //read state
        if(x == 0 && y == 0){
            el.hide();
            return;
        }
        degrees = 
            x == -1 && y == 1 ? 225 :
            x == 1 && y == -1 ? 45 :
            x == -1 && y == -1 ? 315 :
            x == 1 && y == 1 ? 135 :
            x == -1 ? 270 :
            x == 1 ? 90 :     
            y == -1 ? 0 :
            y == 1 ? 180 : 
            0 ;
        el.show();
        el.transform("r" + degrees + "," + dPadLeft + "," + centerY);
    };

    window.onkeyup = function(e){
        switch (e.key){
            case "w":
            case "W":
                controller.up = 0;
                break;    
            case "s":
            case "S":
                controller.down = 0;
                break;
            case "a":
            case "A":
                controller.left = 0;
                break;
            case "d":
            case "D":
                controller.right = 0;
                break;
            case " ":
                controller.attack = 0;
                break;
            default:
                switch (e.keyCode){
                    case UP_ARROW:
                        controller.up = 0;
                        break;
                    case RIGHT_ARROW:
                        controller.right = 0;
                        break;
                    case DOWN_ARROW:
                        controller.down = 0;
                        break;
                    case LEFT_ARROW:
                        controller.left = 0;
                        break;
                    default:
                        return true;
                }
        }
        e.handled= true;
        e.preventDefault();
        return false;
    };
    
    window.onkeydown = function(e){
        switch (e.key){
            case "w":
            case "W":
                controller.up = 1;
                break;
            case "s":
            case "S":
                controller.down = 1;
                break;
            case "a":
            case "A":
                controller.left = 1;
                break;
            case "d":
            case "D":
                controller.right = 1;
                break;
            case " ":
                controller.attack = 1;
                break;
            default:
                switch (e.keyCode){
                    case UP_ARROW:
                        controller.up = 1;
                        break;
                    case RIGHT_ARROW:
                        controller.right = 1;
                        break;
                    case DOWN_ARROW:
                        controller.down = 1;
                        break;
                    case LEFT_ARROW:
                        controller.left = 1;
                        break;
                    default:
                        return true;
                }
        }
    
        e.handled= true;
        e.preventDefault();
        return false;
    };

    return controller;
}

function newRandomController(){
    var controller = newControllerBase();
    controller.randomize = function(){
    
        this.up = Math.round(Math.random());
        this.down = Math.round(Math.random());
        this.left = Math.round(Math.random());
        this.right = Math.round(Math.random());
        time = Math.round(Math.random()*1000)+250;
        controller.nextRandomization = Date.now() + time;
        //setTimeout(()=>{this.randomize()}, time)
    }
    controller.randomize();
    controller.read = function(forObject){
        if(this.nextRandomization<Date.now()){
            this.randomize();
        }

        this.attack = 0;
        
        opposingTeam = getOpposingTeam(forObject.team);
        forObject.getObjectsInRangeOfAttack().forEach((o)=>{
            if(o.team == opposingTeam){
                this.attack = 1;
            }
        });

        forObject.getObjectsInView().forEach((o)=>{
            if(o.team == opposingTeam){
                diffX = Math.abs(forObject.box.center().x - o.box.center().x);
                diffY = Math.abs(forObject.box.center().y - o.box.center().y);
                if(Math.abs(diffY-diffX)>25){
                        
                    if(diffY > diffX){     
                        this.left = 0;
                        this.right = 0;
                        if(forObject.box.center().y>o.box.center().y){
                            this.up = 1;
                            this.down = 0;
                        }else{
                            this.up = 0;
                            this.down = 1;
                        }
                    }else{
                        this.up = 0;
                        this.down = 0;
                        if(forObject.box.center().x>o.box.center().x){
                            this.left = 1;
                            this.right = 0;
                        }else{
                            this.left = 0;
                            this.right = 1;
                        }
                        
                    }
                    
                }
            }
        });

        return {
            x: this.left * -1 + this.right,
            y: this.up * -1  + this.down,
            a: this.attack
        }
    }

    return controller;
}

function newSprite(screen, frameset, imageWidth, imageHeight, spriteWidth, spriteHeight, x, y){
    return {
        screen: screen,
        image: {
            frameset: frameset,
            width: imageWidth,
            height: imageHeight
        },
        size: {
            width: spriteWidth,
            height: spriteHeight
        },
        location: {
            x: x,
            y: y, 
            r: 0
        },
        _lastLocation: {
            x: x,
            y: y, 
            r: 0
        },
        scale: 1,
        animation: {
            index: 0,
            series: 0,
            frame: 0,
            startTime: Date.now()
        },
        _lastAnimation:{
            index: -1,
            series: -1,
            frame: -1
        },
        opacity: 1,
        ready: 1,
        setAnimation: function(index,series){
            if (index!=this.animation.index||series!=this.animation.series){
                this.animation.index = index;
                this.animation.series = series;
                this.animation.frame = 0;
                this.animation.startTime = Date.now();
            }
        },
        setFrame: function(index, series, frame){
                this.animation.index = index;
                this.animation.series = series;
                this.animation.frame = frame;
                this.animation.startTime = 0;
        },
        _buildTranslation: function (x, y, r){
            var tx = Math.round(x * (1/this.scale) - this.animation.frame * this.size.width);
            var ty = Math.round(y * (1/this.scale) - this.animation.series *  this.size.height) + dimensions.infoHeight;
            var t = "t" + tx + "," + ty 
            if(this.scale!=1){
                t="s"+this.scale +","+this.scale+",0,0" + t;
            }
            if(r == 0){
                return t
            }
            var rx = Math.round(this.animation.frame * this.size.width + this.size.width/2);
            var ry = Math.round(this.animation.series *  this.size.height + this.size.height/2);
            return t + "r" + r + "," + rx + "," + ry;
        },
        _buildClipRect: function (){
            var x = Math.round(this.animation.frame * this.size.width) 
            var y = Math.round(this.animation.series * this.size.height)+1
            var w = this.size.width;
            var h = this.size.height-2;
            return "" + x + "," + y +"," + w + "," + h;
        },
        _calculateCurrentFrame: function(deltaT) {
            if (this.animation.startTime == 0){
                return this.animation.frame;
            }
            var animdelta = Date.now() - this.animation.startTime;
            var frame = Math.round((animdelta / 1000) * constants.spriteFamesPerSecond) % Math.round(this.image.width/this.size.width);
            return frame;
        },
        render: function(deltaT){
    
            this.animation.frame = this._calculateCurrentFrame(deltaT);
            if(this.animation.startTime==0)
            {
                forceRender = true
            }
            var trans0 = this._buildTranslation(this._lastLocation.x, this._lastLocation.y, this._lastLocation.r);
            var trans1 = this._buildTranslation(this.location.x, this.location.y, this.location.r);
    
            var rect = this._buildClipRect(); 

            if(!this.element){
                this.element = this.screen.image(this.image.frameset[this.animation.index], 0, 0, this.image.width, this.image.height).attr({opacity:0, "clip-rect": rect, transform:trans1});
                trans0 = trans1;
                this._lastLocation.x = this.location.x;
                this._lastLocation.y = this.location.y;
                this._lastLocation.r = this.location.r;
                this.screen.onClear(()=>{this.element = null});
                this.ready = 1  
                this._lastIndex = this.animation.index;
                forceRender = true
            } 
            if(this._lastIndex != this.animation.index){
                this.element.attr("src",this.image.frameset[this.animation.index]);
                this._lastIndex = this.animation.index;
            }
    

         
            frameChanged = (this._lastAnimation.frame != this.animation.frame || this._lastAnimation.index != this.animation.index || this._lastAnimation.series != this.animation.series)
            positionChanged = (this.location.x!=this._lastLocation.x || this.location.y != this._lastLocation.y || this.location.r != this._lastLocation.r);

            if ((frameChanged || positionChanged || forceRender) && this.element && this.ready==1){
                this.ready = 0;
                this.element.attr({opacity:this.opacity}).animate({transform:trans0, "clip-rect": rect},0, 'linear',()=>{
                    if (this.element){        
                        this.element.animate({transform:trans1, "clip-rect": rect}, deltaT, 'linear',()=>{
                            this.ready = 1
                        });
                    }
                });
            }   
    
            this._lastAnimation.frame = this.animation.frame;
            this._lastAnimation.index = this.animation.index;
            this._lastAnimation.series = this.animation.series;
            this._lastLocation.x = this.location.x;
            this._lastLocation.y = this.location.y;
            this._lastLocation.r = this.location.r;
            this.element.toFront();
            return this.element;
        },
        remove: function(){
            if (this.element){
                this.element.remove();
            }
        }
    }
}

function newGameObject(){
    return {
        box: newBox(0,0,50,50),
        direction: NORTH,
        state: IDLE,
        layer: DEFAULT,
        plane: PHYSICAL,
        team: UNALIGNED,
        _stateStart: Date.now(),
        setState: function(state){
            if (state!=this.state){
                this.state = state;
                this._stateStart = Date.now()
                if(state==ATTACKING){
                    this._lastAttack = Date.now();
                }
            }
        },
        move: function(deltaT) {
            console.warn("unimplemented: move()");
        },
        render: function(deltaT){
            console.warn("unimplemented: render()");
            this.box.render("#F0F");
        },
        remove: function(){
            console.warn("unimplemented: remove()");
            this.box.remove();
        }
    }
}

function newGameCharacter(){
    var character = newGameObject();
    character.health = 0;
    character.maxHealth = 0;
    character.damage = 0;
    character._attackDuration = 500;
    character._attackCooldown = 1000;
    character._hurtDuration = 500;
    character.controller = newControllerBase();
    character.move = function(deltaT) {
        if(this.state == DYING){
            if(Date.now()-this._stateStart <= 700){
                return;
            }
            this.setState(DEAD);
        }
        if(this.state == DEAD){
            return;
        }
        if(this.state == HURT){
            if(Date.now()-this._stateStart < this._hurtDuration){
                return
            }
            this.setState(IDLE);
        }
        if(this.state == ATTACKING){
            if(Date.now()-this._stateStart < this._attackDuration){
                return
            }
            this.setState(IDLE);
        }           
        //read controller
        input = this.controller.read(this);
        
        if(input.a && this.canAttack()){
            this.attack();
        }

        if(this.state == IDLE || this.state == WALKING){
            

            if (input.y<0){
                this.direction=NORTH;
            }else if(input.x>0){
                this.direction=EAST;
            }else if(input.y>0){
                this.direction=SOUTH;
            }else if(input.x<0){
                this.direction=WEST;
            }

            //TODO: always return x & y
            multiplier = 1
            if (Math.abs(input.x)==1 && Math.abs(input.y)==1){
                multiplier = 1/Math.sqrt(2);
            }
            constrained = game.currentRoom.constrain(this,
                this.box.x + input.x * this.speed/1000 * multiplier * deltaT,
                this.box.y + input.y * this.speed/1000 * multiplier * deltaT
            )

            if (constrained && (this.box.x != constrained.x || this.box.y != constrained.y)){
                if (this.state!=WALKING){
                    this.state = WALKING;
                }
                this.box.x = constrained.x;
                this.box.y = constrained.y;
            }
            else {
                if (this.state!=IDLE){
                    this.state = IDLE;
                }
            }   
        }
    };
    character.hurt = function(damage, knockback){
            if(this.state!=HURT && this.state!=DEAD){
                this.health -= damage;
                if(this == game.player){
                    game.level.statistics.damageReceived += damage;
                }
                if(this.health <= 0){
                    this.health = 0;
                    this.setState(DYING);
                    return;
                }
                this.setState(HURT);
                switch (knockback){
                    case NORTH:
                        this.box.y -= damage;
                        break;
                    case EAST:
                        this.box.x += damage;
                        break;
                    case SOUTH: 
                        this.box.y += damage;
                    case WEST:
                        this.box.x -= damage;
                        break;
                }
            }
    };
    character.canAttack = function(){
            if(!this._lastAttack || Date.now() - this._lastAttack > this._attackCooldown){
                return true;
            }
            return false;
    };
    character.attack = function(){
            console.warn("unimplemented: attack()");
    };
    character.getObjectsInView = function(){
            return [];
    };
    character.getObjectsInRangeOfAttack = function(){
            console.warn("unimplemented: getObjectsInRangeOfAttack()");
            return [];
    };
    return character
}

function newInvisibleObject(){
    io = newGameObject();
    io.render = function(deltaT){
        if(game.debug){
            this.box.render("#F0F");
        }
    }
    io.remove = function(){}
    io.move = function(){}
    return io;
}

function newStarburst(){
    var starburst = newGameObject();
    starburst.box.width = 25;
    starburst.box.height = 25;
    starburst.layer = DEFAULT;
    starburst.plane = ETHEREAL;
    starburst.render = function(deltaT){
        if( this.state == DEAD){
            return;
        }
        if(!this.sprite){
            this.sprite = newSprite(game.screen, images.starburst, 100, 25, 25, 25, this.box.center().x-12, this.box.center().y-12);
            this.sprite.setAnimation(0,0);
             this.sprite.location.r = Math.round(Math.random() * 360);
        }
        this.sprite.render(deltaT); 
    }
    starburst.move = function(deltaT){
        if(Date.now()-this._stateStart>250){
            this.setState(DEAD);
        }
    }    
    starburst.remove = function(){
        if(this.sprite){
            this.sprite.remove();
            this.sprite = null;
        }
    }
    return starburst;
}

function newExplosion(x,y){
    var explosion = newGameObject();
    explosion.box.x = x-100;
    explosion.box.y = y-100;
    explosion.box.width = 200;
    explosion.box.height = 200;
    explosion.layer = EFFECT;
    explosion.plane = ETHEREAL;
    explosion.render = function(deltaT){
        
        if( this.state == DEAD){
            return;
        }
        if(!this.sprite){
            this.sprite = newSprite(game.screen, images.explosion, 1000, 200, 200, 200, this.box.x, this.box.y);
            this.sprite.setAnimation(0,0);
            this.sprite.location.r = Math.round(Math.random() * 360);
        }
        this.sprite.render(deltaT); 
    }
    explosion.move = function(deltaT){
        if(this.state == IDLE){
            this.setState(ATTACKING)
            game.currentRoom.objects.forEach((o)=>{
                if(o.plane==PHYSICAL && this.box.collidesWith(o.box) && o.hurt!=null){
                    rect = o.box.intersectRect(this.box);
                    if(rect){
                        o.hurt(Math.round((rect.height*rect.width)/8), NORTH);
                    }
                }
            })
        }
        if(Date.now()-this._stateStart>400){
            this.setState(DEAD);
        }
    }    
    explosion.remove = function(){
        if(this.sprite){
            this.sprite.remove();
            this.sprite = null;
        }
    }
    return explosion;
}

function newTreasureChest(content){
    var chest = newGameObject();
    chest.box.width=64;
    chest.box.height=32;
    chest.opened = 0;
    chest.treasureOffset = 0;
    chest.content = content;
    chest.elements = [];
    chest.render = function(deltaT){
        if(this.elements.length == 0){
            this.backgroundSprite = newSprite(game.screen,images.chest,64,256,64,64,this.box.x,this.box.y-32);
            this.elements.push(this.backgroundSprite);
            //TODO: Move to "pickup" object
            this.contentSprite = newSprite(game.screen, images.treasure, 36, 468, 36, 36, this.box.x+14,this.box.y-18)
            this.elements.push(this.contentSprite);
            this.foregroundSprite = newSprite(game.screen,images.chest,64,256,64,64,this.box.x,this.box.y-32);
            this.elements.push(this.foregroundSprite);
            game.screen.onClear(()=>{this.elements=[]});
        }

        if(game.debug){
            this.box.render("#FF0")
            if (this.tripFront) this.tripFront.render("#0F0");
            if (this.tripWest) this.tripWest.render("#0F0");
            if (this.tripEast) this.tripEast.render("#0F0");
            if (this.tripBack) this.tripBack.render("#0F0");
       
        }
        
        if(this.opened){

            this.foregroundSprite.setAnimation(0,1);
            this.contentSprite.setAnimation(0, this.content);
            this.backgroundSprite.setAnimation(0,3);
            
            var offset = (100/1000) * deltaT;
            this.treasureOffset += offset;
            var opacity = constrain(0,1-(this.treasureOffset/100), 1);
            this.contentSprite.opacity = opacity;    
            if(opacity>0){
                this.contentSprite.location.y -= offset;
            }else{
                this.content = NONE 
            }
        } else {
            this.foregroundSprite.setAnimation(0,0);
            this.contentSprite.setAnimation(0, 0);
            this.backgroundSprite.setAnimation(0,2);
        }
        this.backgroundSprite.render(deltaT);
        this.contentSprite.render(deltaT);
        this.foregroundSprite.render(deltaT);
    }
    chest.move = function(deltaT){
        //todo: tripwires, etc
        if(!this.tripFront){
            this.tripFront = newBox(this.box.x-game.player.box.width/2, this.box.y+this.box.height, this.box.width + game.player.box.width, game.player.box.height)
        }
        if(!this.tripWest){
            this.tripWest = newBox(this.box.x-game.player.box.width, this.box.y-game.player.box.height/2, game.player.box.width, this.box.height + game.player.box.height)
        }
        if(!this.tripEast){
            this.tripEast = newBox(this.box.x+this.box.width, this.box.y-game.player.box.height/2, game.player.box.width, this.box.height + game.player.box.height)
        }
        if(!this.tripBack){
            this.tripBack = newBox(this.box.x-game.player.box.width/2, this.box.y-game.player.box.height, this.box.width + game.player.box.width, game.player.box.height)
        }
        if(!this.opened && (
           (game.player.box.inside(this.tripFront) && game.player.direction==NORTH) || 
           (game.player.box.inside(this.tripWest) && game.player.direction==EAST) ||
           (game.player.box.inside(this.tripEast) && game.player.direction==WEST) ||
           (game.player.box.inside(this.tripBack) && game.player.direction==SOUTH)
        )){
            this.opened = true;
            sfx.openChest();
            game.level.statistics.chestsOpened++;
            if(this.content == RANDOM){
                if ((game.player.health/game.player.maxHealth) < Math.random()){
                    this.content = HEART
                } else {
                    this.content = Math.round(Math.random() * 5) + HEART;
                }
            }
            if(this.content >= SILVERKEY && this.content <= BLUEKEY){
                game.player.keys.push(this.content);
                game.level.statistics.keysCollected++;
            } else if (this.content == HEART){
                game.player.health=constrain(0, game.player.health + 10, game.player.maxHealth);
                if(game.player.health>=15){
                    sfx.lowHealth(false)
                }
                game.level.statistics.heartsCollected++;
            } else if (this.content == HEARTCONTAINER){
                game.player.maxHealth += 10;
                game.player.health = game.player.maxHealth;
            } else {
                goldValue = (this.content - HEART ) * 100;
                game.player.gold += goldValue;
                game.level.statistics.goldCollected += goldValue;
            }
            setTimeout(()=>{sfx.treasure(this.content)},500);
        }
    }
    chest.remove = function(){
        if(this.backgroundSprite){
            this.backgroundSprite.remove();
            this.backgroundSprite=null;
        }
        if(this.foregroundSprite){
            this.foregroundSprite.remove();
            this.foregroundSprite=null;
        }
    }
    return chest;
}

function newFloorSpikes(offsetT){
    var floorSpikes = newGameObject();
    floorSpikes.layer = SHADOW;
    floorSpikes.box.width = 0;
    floorSpikes.box.height = 0;
    floorSpikes.setState(0);
    floorSpikes._stateStart += offsetT % 3000;
    floorSpikes.move = function(deltaT){
        if(this.state == 0 && Date.now()-this._stateStart > 3000){
            //WARN
            this.setState(WALKING);
        }else if(this.state ==1 && Date.now()-this._stateStart > 1000){
            //ATTACK!
            this.setState(ATTACKING);
            sfx.floorSpikes(this);
            this.box.width = 62;
            this.box.height = 58;
            game.currentRoom.objects.forEach((o)=>{
                if(o.plane==PHYSICAL && this.box.collidesWith(o.box) && o.hurt!=null){
                    rect = o.box.intersectRect(this.box);
                    if(rect){
                        o.hurt(5, NORTH)
                        sb = newStarburst();
                        sb.box = rect
                        game.currentRoom.objects.push(sb);
                    }
                }
            })

        } else if (this.sprite && this.sprite.animation.series == ATTACKING){
            //RESET TRAP
            if (this.sprite.animation.frame == 4){
                this.box.width = 0;
                this.box.height = 0;
                    
            } else if (this.sprite.animation.frame == 7){
                this.setState(IDLE);
            }
            
        }
    }
    floorSpikes.render = function(deltaT){
        if(!this.sprite){
            this.sprite = newSprite(game.screen,images.floorSpikes,496, 150, 62, 50,this.box.x, this.box.y);
            game.screen.onClear(()=>{
                this.sprite = null;
            })
        }
        this.sprite.setAnimation(0,this.state)
        this.sprite.render()
    }
    floorSpikes.remove = function(){
        if(this.sprite){
            this.sprite.remove();
            this.sprite = null;
        }
        if(this.spikesPlayer){
            this.spikesPlayer.dispose();
        }
    }
    return floorSpikes;
}

function newExit(){
    var exit = newGameObject();
    exit.box.width = constants.doorWidth;
    exit.box.height = constants.brickWidth * 4;
    exit.plane = ETHEREAL;
    exit.elements = [];
    exit.invisibleObjects = [];
    
    exit.render = function(deltaT){
        if (this.elements.length==0){
            
            exitHeight = constants.brickWidth * 3;

            this.elements.push(game.screen.drawRect(this.box.x - constants.doorFrameThickness, this.box.y + dimensions.infoHeight,  (constants.doorWidth + constants.doorFrameThickness*2),  this.box.height, palette.doorFrame, "#000", constants.lineThickness));
            this.elements.push(game.screen.drawRect(this.box.x, this.box.y + dimensions.infoHeight + constants.doorFrameThickness, this.box.width,  this.box.height - constants.doorFrameThickness, "#000", "#000", constants.lineThickness));
            steps = 6;
            
            for(step = steps; step>0; step--){
                stepWidth = constants.doorWidth - step * 4;
                stepThickness = constants.brickHeight+2 - step
                this.elements.push(game.screen.drawRect(this.box.center().x - stepWidth/2, dimensions.infoHeight + (this.box.y + this.box.height)-stepThickness*step,  stepWidth,  stepThickness, "#888", "#000", constants.lineThickness).attr({opacity:(steps-step)/steps}));
            }
            
            game.screen.onClear(()=>{this.elements=[]});
        }
        if(game.debug){
            this.box.render("#0FF")
            //this.tripBox.render("#F80");
        }
    };

    exit.move = function(deltaT){
        if(exit.invisibleObjects.length==0){
            
            io = newInvisibleObject();
            io.box.x = this.box.x - constants.doorFrameThickness;
            io.box.y = this.box.y;
            io.box.height = this.box.height;
            io.box.width = constants.doorFrameThickness*2;
            game.currentRoom.objects.push(io);
            exit.invisibleObjects.push(io);

            io = newInvisibleObject();
            io.box.x = this.box.x + constants.doorWidth;
            io.box.y = this.box.y;
            io.box.height = this.box.height;
            io.box.width = constants.doorFrameThickness;
            game.currentRoom.objects.push(io);
            exit.invisibleObjects.push(io);
            
            io = newInvisibleObject();
            io.box.x = this.box.x;
            io.box.y = this.box.y;
            io.box.width = this.box.width;
            io.box.height = constants.doorFrameThickness;
            game.currentRoom.objects.push(io);
            exit.invisibleObjects.push(io);
        }
        if (!this.tripBox){
            this.tripBox = newBox(this.box.x, this.box.y + constants.doorFrameThickness * 3, this.box.width, this.box.height/2);
        }
        if(game.player.box.inside(this.box)){
            game.player.sprite.scale= constrain(.85,Math.round(((game.player.box.y - this.box.y) * 100 / this.box.height))/100 +.25,1);
            game.player.speed = constrain(100,((game.player.box.y - this.box.y) / this.box.height)*150,150);
        }
        if(game.player.box.inside(this.tripBox)){
            this.tripped();
        }
    };
    exit.tripped= function(){
       game.state = PAUSED;
       setTimeout(()=>{
        fadeTo(SCREENBLACK, exitLevel);
       },50);
       //exitLevel();
    }
    return exit;
}

function newAdventurer(controller){
    var adventurer = newGameCharacter();
    adventurer.controller = controller;
    adventurer.box.x = Math.round(dimensions.width / 2)-25;
    adventurer.box.y = Math.round(dimensions.width / 2)-25;
    adventurer.box.width = 50;
    adventurer.box.height = 50;
    adventurer.direction = SOUTH; //init facing the player
    adventurer.team = HEROIC;
    adventurer.speed = 150; //in px/sec
    adventurer.damage = 10;
    adventurer.health = 30;
    adventurer.maxHealth = 30;
    adventurer._attackDuration = 250;
    adventurer._attackCooldown = 750;
    adventurer.whip = {
        thickness: 5,
        length: 175
    }
    adventurer._hurt = adventurer.hurt;
    adventurer.hurt = function(damage, knockback){
        this._hurt(damage, knockback);
        if(this.health<15){
            sfx.lowHealth(true);
        }
        if(this.state == DYING){
            this.direction = SOUTH;
            sfx.lowHealth(false);
            sfx.playerdeath();
        }
    }
    adventurer.render = function(deltaT){
        framestart = Date.now()
        if(!this.sprite){
            this.sprite = newSprite(game.screen, images.adventurer, 800, 500, 100, 100, 0, 0);
            console.log("adventurer !this.sprite")
        }
        if(game.debug){
            this.box.render("#FF0");
        } 
        
        //render whip
        if(this.state == ATTACKING){
            if(!this.whip.element && framestart - this.sprite.animation.startTime > 100){
                switch(this.direction){
                    case NORTH:
                        this.whip.element = game.screen.drawRect(Math.round(this.whip.box.x + this.whip.box.width/2)-2, this.whip.box.y + dimensions.infoHeight, 3, this.whip.box.height, "#624a2e","#000", 2 )
                        break;
                    case EAST:
                        this.whip.element = game.screen.drawRect(this.whip.box.x + 10,  Math.round(this.whip.box.y + this.whip.box.height/2)-2 + dimensions.infoHeight, Math.abs(this.whip.box.width-10), 3, "#624a2e","#000", 2)
                        break;
                    case SOUTH: 
                        this.whip.element = game.screen.drawRect(Math.round(this.whip.box.x + this.whip.box.width/2)-2, this.whip.box.y + dimensions.infoHeight, 3, this.whip.box.height, "#624a2e","#000", 2)
                        break;
                    case WEST:
                        this.whip.element = game.screen.drawRect(this.whip.box.x,  Math.round(this.whip.box.y + this.whip.box.height/2)-2 + dimensions.infoHeight, Math.abs(this.whip.box.width-10), 3, "#624a2e","#000", 2)
                        break;
                    }
            }
        } else {
            if(this.whip.element) this.whip.element.remove();
            this.whip.element = null;
        }

        //render player sprite
        if(this.state == DEAD){
            this.sprite.setFrame(SOUTH, DYING, 7);
            gameOver();
        }
        else{
            this.sprite.setAnimation(this.direction, this.state);
        }
        this.sprite.location.x = (this.box.x - 25) ;
        this.sprite.location.y = (this.box.y - 50) ;
        this.sprite.render(deltaT);
    };
    adventurer.remove = function(deltaT){
        if(this.sprite){
            //this.sprite.remove();
            //this.sprite = null;
        }
        if(game.debug){
            this.box.remove();
        } 
    }
    adventurer.getObjectsInRangeOfAttack = function(){
        if(!this.whip.box){
            this.whip.box = newBox(0,0,0,0)
        }
        switch (this.direction){
 
            case NORTH: 
                this.whip.box.reset(
                    Math.round(this.box.x + this.box.width / 2 - this.whip.thickness / 2),
                    constrain((game.currentRoom.box.y - game.currentRoom.wallHeight / 2) ,this.box.y - this.whip.length, this.box.y),
                    this.whip.thickness,
                    constrain(0, this.whip.length, this.box.y - game.currentRoom.box.y + game.currentRoom.wallHeight / 2)
                )
                break;
            case EAST:
                this.whip.box.reset(
                    constrain(this.box.x + this.box.width,this.box.x + this.box.width,game.currentRoom.box.x+game.currentRoom.box.width + game.currentRoom.wallHeight/2),
                    Math.round(this.box.y - 25 + this.box.height/2 - this.whip.thickness/2),
                    constrain(0, this.whip.length, (game.currentRoom.box.x + game.currentRoom.box.width + game.currentRoom.wallHeight/2) - (this.box.x + this.box.width)),
                    this.whip.thickness
                )
                break;
            case SOUTH:
                this.whip.box.reset(
                    Math.round(this.box.x + this.box.width/2 - this.whip.thickness/2),
                    constrain(this.box.y + this.box.height,this.box.y + this.box.height,game.currentRoom.box.y+game.currentRoom.box.height),
                    this.whip.thickness,
                    constrain(0, this.whip.length, (game.currentRoom.box.y + game.currentRoom.box.height + game.currentRoom.wallHeight/2) - (this.box.y + this.box.height))
                )
                break;
            case WEST:
                this.whip.box.reset(
                    constrain(game.currentRoom.box.x - game.currentRoom.wallHeight/2,this.box.x - this.whip.length, this.box.x),
                    Math.round(this.box.y - 29 + this.box.height/2 - this.whip.thickness/2),
                    constrain(0, this.whip.length, this.box.x - game.currentRoom.box.x + game.currentRoom.wallHeight/2),
                    this.whip.thickness
                )
                break;
        }
        if(game.debug && this.whip.box){
            this.whip.box.render("#A00")
        }
          
        var distance = this.whip.length * 2;
        var collidingWith = null;
        game.currentRoom.objects.forEach((obj)=>{
            if(obj!=this && obj.plane==PHYSICAL && obj.team == getOpposingTeam(this.team)){
                objDistance = this.box.distance(obj.box);
                if(this.whip.box.collidesWith(obj.box) && objDistance < distance){
                    collidingWith = obj;
                    distance = objDistance;
                }
            }
        });
        if(collidingWith!=null){
            return [collidingWith];
        }
        return [];
    },
    adventurer.attack = function(){
        if(this.state != ATTACKING && this.canAttack()){
            //game.currentRoom.objects.push(newExplosion(this.box.center().x, this.box.center().y));
            this.setState(ATTACKING);
            sfx.whip();
            targets = this.getObjectsInRangeOfAttack(); 
            if(targets.length>0){
                collidingWith = targets[0];
                sb = newStarburst();
                game.currentRoom.objects.push(sb);
                collidingWith.hurt(this.damage, this.direction);
                game.level.statistics.damageDealt += this.damage;
                switch(this.direction){
                    case NORTH:
                        this.whip.box.reset (
                            Math.round(this.box.x + this.box.width / 2 - this.whip.thickness / 2),
                            collidingWith.box.y + collidingWith.box.height,
                            this.whip.thickness,
                            Math.abs(this.box.y - (collidingWith.box.y + collidingWith.box.height))
                        )
                        sb.box.x = this.whip.box.x - sb.box.width / 2;
                        sb.box.y = this.whip.box.y - sb.box.height / 2;

                        break;
                    case EAST:
                        this.whip.box.reset (
                            this.box.x + this.box.width,
                            Math.round(this.box.y - 25 + this.box.height/2 - this.whip.thickness/2),
                            Math.abs(collidingWith.box.x - (this.box.x + this.box.width)),
                            this.whip.thickness
                        )
                        sb.layer = EFFECT
                        sb.box.x = this.whip.box.x + this.whip.box.width  - sb.box.width / 2;
                        sb.box.y = this.whip.box.y - sb.box.height / 2;

                        break;
                    case SOUTH:
                        this.whip.box.reset(
                            Math.round(this.box.x + this.box.width/2 - this.whip.thickness/2),
                            this.box.y + this.box.height,
                            this.whip.thickness,
                            Math.abs(collidingWith.box.y - (this.box.y + this.box.height))
                        )
                        
                        sb.layer = EFFECT
                        sb.box.x = this.whip.box.x - sb.box.width / 2;
                        sb.box.y = this.whip.box.y + this.whip.box.height - sb.box.height / 2;
                        break;
                    case WEST:
                        this.whip.box.reset(
                            collidingWith.box.x + collidingWith.box.width,
                            Math.round(this.box.y - 29 + this.box.height/2 - this.whip.thickness/2),
                            Math.abs(this.box.x - (collidingWith.box.x + collidingWith.box.width)),
                            this.whip.thickness  
                        )
                        sb.layer = EFFECT
                        sb.box.x = this.whip.box.x - sb.box.width / 2;
                        sb.box.y = this.whip.box.y - sb.box.height / 2;

                        break;
                }
            }
            
        }
    };
    adventurer._move = adventurer.move;
    adventurer.move = function(deltaT){
        state1 = this.state;
        this._move(deltaT);
        if(this.state!=state1){
            if(this.state==WALKING){
                sfx.walk(true);
            }else{
                sfx.walk(false);
            }

        }
    }

    return adventurer;
}


function newCaveSpider(controller){
    var spider = newGameCharacter();
    spider.box.x = Math.round(dimensions.width / 2)-100;
    spider.box.y = Math.round(dimensions.width / 2)-100;
    spider.box.height = 75;
    spider.box.width = 75;
    spider.team = DUNGEON;
    spider.direction = EAST;
    spider.controller = controller;
    spider.speed = 150;
    spider.health = 20;
    spider.maxHealth = 20;
    spider.damage = 5;
    spider._attackDuration = 500;
    spider._attackCooldown = 1500;
    spider._move = spider.move;
    spider.move= function (deltaT){
        var state1 = this.state;
        this._move(deltaT);
        if(this.state!=state1){
            switch(this.state){
                case WALKING: 
                    sfx.spiderwalk(this, true);
                    break;
                default:
                    sfx.spiderwalk(this,false)
            }
        }
        switch(this.direction){
            case NORTH:
                this.box.width = 75;
                this.box.height = 50;
                break;
            case WEST:
                this.box.width = 75;
                this.box.height = 50;
                break;
            case SOUTH:
                this.box.width = 75;
                this.box.height = 60;
                break;
            case EAST:
                this.box.width = 75;
                this.box.height = 50;
                break;
                        
        }
    };
    spider.render = function(deltaT){
        if(!this.sprite){
            this.sprite = newSprite(game.screen, images.caveSpider, 800, 500, 100, 100, 0, 0);
        }
        if(game.debug){
           this.box.render("#FFF");
        } 
  
        this.sprite.location.x = this.box.x-15;
        this.sprite.location.y = this.box.y-(this.direction== SOUTH ? 20 : 40);
        this.sprite.setAnimation(this.direction, this.state);
        this.sprite.render(deltaT);
    };
    spider.attack = function(){
        if(this.state != ATTACKING){
            sfx.spiderbite(this);
            this.setState(ATTACKING);
        }
        opposingTeam = getOpposingTeam(this.team)
        targets = spider.getObjectsInRangeOfAttack();
        targets.forEach((o)=>{
            if(o.team == opposingTeam){
                rect = this._attackBox.intersectRect(o.box)
                if(rect){
                    o.hurt(this.damage);
                    sb=newStarburst()
                    sb.box = rect;
                    game.currentRoom.objects.push(sb);
                }
            }
        });
    };
    spider.getObjectsInView=function(){
        //initialize the view box
        if(!this._viewBox){
            this._viewBox = newBox(0,0,50,50);
        }
        //reposition the view box
        switch(this.direction){
            case NORTH:
                this._viewBox.height = 500;
                this._viewBox.width = 200;
                this._viewBox.x = this.box.center().x - this._viewBox.width/2;
                this._viewBox.y = this.box.y + this.box.height - this._viewBox.height
                break;
            case EAST:    
                this._viewBox.width = 500;
                this._viewBox.height = 200;
                this._viewBox.x = this.box.x;
                this._viewBox.y = this.box.center().y - this._viewBox.height/2
                break;
            case SOUTH:
                this._viewBox.height = 500;
                this._viewBox.width = 200;
                this._viewBox.x = this.box.center().x - this._viewBox.width/2;
                this._viewBox.y = this.box.y 
                break;
            case WEST:
                this._viewBox.width = 500;
                this._viewBox.height = 200;
                this._viewBox.x = this.box.x + this.box.width - this._viewBox.width;
                this._viewBox.y = this.box.center().y - this._viewBox.height/2
                break;
        }
        if (game.debug){
            this._viewBox.render("#FF0");
        }
        inView = [];
        game.currentRoom.objects.forEach((o)=>{
            if(o.box.collidesWith(this._viewBox)){
                inView.push(o);
            }
        })

        return inView;
    }
    spider.getObjectsInRangeOfAttack = function(){
        //initialize the attack box
        if(!this._attackBox){
            this._attackBox = newBox(0,0,25,25);
        }
        //reposition the attack box
        switch(this.direction){
            case NORTH:
                this._attackBox.x = this.box.center().x - Math.round(this._attackBox.width / 2);
                this._attackBox.y = this.box.y - this._attackBox.height
                break;
            case EAST:
                this._attackBox.x = this.box.x + this.box.width;
                this._attackBox.y = this.box.center().y - Math.round(this._attackBox.height/2);
                break;
            case SOUTH:
                this._attackBox.x = this.box.center().x - Math.round(this._attackBox.width / 2);
                this._attackBox.y = this.box.y + this.box.height;
                break;
            case WEST:
                this._attackBox.x = this.box.x - this._attackBox.width;
                this._attackBox.y = this.box.center().y - Math.round(this._attackBox.height/2);   
                break;
        }
        if (game.debug){
            this._attackBox.render("#800");
        }
        inRange = []
        game.currentRoom.objects.forEach((o)=>{
            if(o!=this && this._attackBox.collidesWith(o.box)){
                inRange.push(o);
            }
        });
        return inRange;
    }
    spider.remove = function(){
        if(this.sprite){
            this.sprite.remove();
        }
        if(spider.bitePlayer){
            spider.bitePlayer.stop();
            spider.bitePlayer.dispose();
        }
        if(spider.walkPlayer){
            spider.walkPlayer.stop();
            spider.walkPlayer.dispose();
        } 
        if(game.debug){
            this.box.remove();
        }
    };
    spider._hurt = spider.hurt;
    spider.hurt = function(damage, knockback){
        startHealth=this.health;
        this._hurt(damage,knockback);
        if(startHealth>0 && this.health<=0){
            game.level.statistics.caveSpidersKilled++;
            game.level.statistics.enemiesKilled++;
            sfx.spiderDeath();
        }
    }

    
    return spider;
}

function newKingCobra(controller){
    var snake = newGameCharacter();
    snake.box.x = Math.round(dimensions.width / 2)-100;
    snake.box.y = Math.round(dimensions.width / 2)-100;
    snake.box.height = 50;
    snake.box.width = 50;
    snake.team = DUNGEON;
    snake.direction = EAST;
    snake.controller = controller;
    snake.speed = 85;
    snake.health = 20;
    snake.maxHealth = 20;
    snake.damage = 5;
    snake._attackDuration = 500;
    snake._attackCooldown = 1500;
    snake._move = snake.move;
    snake.move= function (deltaT){
        var state1 = this.state;
        this._move(deltaT);
        
    };
    snake.render = function(deltaT){
        if(!this.sprite){
            this.sprite = newSprite(game.screen, images.kingCobra, 800, 500, 100, 100, 0, 0);
        }
        if(game.debug){
           this.box.render("#FFF");
        } 
        
        switch(this.direction){
            case NORTH:
                this.sprite.location.x = this.box.x-25;
                this.sprite.location.y = this.box.y-25;
                break;
            case WEST:
                this.sprite.location.x = this.box.x-10;
                this.sprite.location.y = this.box.y-30;
                break;
            case SOUTH:
                this.sprite.location.x = this.box.x-25;
                this.sprite.location.y = this.box.y-10;
                break;
            case EAST:
                this.sprite.location.x = this.box.x-40;
                this.sprite.location.y = this.box.y-30;
                break;
                        
        }

        this.sprite.setAnimation(this.direction, this.state);
        this.sprite.render(deltaT);
    };
    snake.attack = function(){
        if(this.state != ATTACKING){
            sfx.snakeBite(this);
            this.setState(ATTACKING);
        }
        opposingTeam = getOpposingTeam(this.team)
        targets = snake.getObjectsInRangeOfAttack();
        targets.forEach((o)=>{
            if(o.team == opposingTeam){
                rect = this._attackBox.intersectRect(o.box)
                if(rect){
                    o.hurt(this.damage);
                    sb=newStarburst()
                    sb.box = rect;
                    game.currentRoom.objects.push(sb);
                }
            }
        });
    };
    snake.getObjectsInView=function(){
        //initialize the view box
        if(!this._viewBox){
            this._viewBox = newBox(0,0,50,50);
        }

        this._viewBox.height = 500;
        this._viewBox.width = 500;
        this._viewBox.x = this.box.center().x - this._viewBox.width/2;
        this._viewBox.y = this.box.center().y - this._viewBox.height/2;

        if (game.debug){
            this._viewBox.render("#FF0");
        }
        inView = [];
        game.currentRoom.objects.forEach((o)=>{
            if(o.box.collidesWith(this._viewBox)){
                inView.push(o);
            }
        })

        return inView;
    }
    snake.getObjectsInRangeOfAttack = function(){
        //initialize the attack box
        if(!this._attackBox){
            this._attackBox = newBox(0,0,25,25);
        }
        //reposition the attack box
        switch(this.direction){
            case NORTH:
                this._attackBox.x = this.box.center().x - Math.round(this._attackBox.width / 2);
                this._attackBox.y = this.box.y - this._attackBox.height
                break;
            case EAST:
                this._attackBox.x = this.box.x + this.box.width;
                this._attackBox.y = this.box.center().y - Math.round(this._attackBox.height/2);
                break;
            case SOUTH:
                this._attackBox.x = this.box.center().x - Math.round(this._attackBox.width / 2);
                this._attackBox.y = this.box.y + this.box.height;
                break;
            case WEST:
                this._attackBox.x = this.box.x - this._attackBox.width;
                this._attackBox.y = this.box.center().y - Math.round(this._attackBox.height/2);   
                break;
        }
        if (game.debug){
            this._attackBox.render("#800");
        }
        inRange = []
        game.currentRoom.objects.forEach((o)=>{
            if(o!=this && this._attackBox.collidesWith(o.box)){
                inRange.push(o);
            }
        });
        return inRange;
    }
    snake.remove = function(){
        if(this.sprite){
            this.sprite.remove();
        }
        if(snake.bitePlayer){
            snake.bitePlayer.stop();
            snake.bitePlayer.dispose();
        }
       
        if(game.debug){
            this.box.remove();
        }
    };
    snake._hurt = snake.hurt;
    snake.hurt = function(damage, knockback){
        startHealth=this.health;
        this._hurt(damage,knockback);
        if(startHealth>0 && this.health<=0){
            game.level.statistics.kingCobrasKilled++;
            game.level.statistics.enemiesKilled++;
            sfx.snakeDeath();
        }
    }

    
    return snake;
}

function newSwordSkeleton(controller){
    var skeleton = newGameCharacter();
    skeleton.box.x = Math.round(dimensions.width / 2)-100;
    skeleton.box.y = Math.round(dimensions.width / 2)-100;
    skeleton.box.height = 66;
    skeleton.box.width = 50;
    skeleton.team = DUNGEON;
    skeleton.direction = EAST;
    skeleton.controller = controller;
    skeleton.speed = 25;
    skeleton.health = 30;
    skeleton.maxHealth = 30;
    skeleton.damage = 10;
    skeleton._attackDuration = 500;
    skeleton._attackCooldown = 1500;
    skeleton._move = skeleton.move;
    skeleton.move= function (deltaT){
        if(!this.sprite || this.sprite.animation.frame>4){
            this.speed = 60;
        } else {
            this.speed = 4;
        }

        if(this.sprite && this.state == ATTACKING && !this.attacked && this.sprite.animation.frame==3){
            this.attacked==true;
            opposingTeam = getOpposingTeam(this.team)
            targets = skeleton.getObjectsInRangeOfAttack();
            targets.forEach((o)=>{
                if(o.team == opposingTeam){
                  rect = this._attackBox.intersectRect(o.box)
                    if(rect){
                        o.hurt(this.damage, this.direction);
                        sb=newStarburst()
                        sb.box = rect
                        game.currentRoom.objects.push(sb);
                    }
                }
            }); 
        }

        var state1 = this.state;
        this._move(deltaT); 
        if(this.state!=state1){
            switch(this.state){
                case WALKING: 
                    sfx.skeletonwalk(this, true);
                    break;
                default:
                    sfx.skeletonwalk(this,false)
            }
        }
    };
    skeleton.render = function(deltaT){
        if(!this.sprite){
            this.sprite = newSprite(game.screen, images.swordSkeleton, 1200, 750, 150, 150, this.box.x-50, this.box.y-59);
            this.sprite._lastLocation.x = this.box.x-50;
            this.sprite._lastLocation.y = this.box.y-59;    
        }
        if(game.debug){ 
           this.box.render("#FFF");
        } 
        this.sprite.setAnimation(this.direction, this.state);
        this.sprite.render(deltaT);
        //if (this.sprite.animation.frame!==2&&this.sprite.animation.frame!==6){
            this.sprite.location.x = this.box.x-50;
            this.sprite.location.y = this.box.y-59;    
        //}
    };
    skeleton.attack = function(){
        if(this.state != ATTACKING){
            sfx.skeletonattack(this);
            this.setState(ATTACKING);
            this.attacked==false;
        }
       
    };
    skeleton.getObjectsInView=function(){
        //initialize the view box
        if(!this._viewBox){
            this._viewBox = newBox(0,0,50,50);
        }
        //reposition the view box
        switch(this.direction){
            case NORTH:
                this._viewBox.height = 500;
                this._viewBox.width = 200;
                this._viewBox.x = this.box.center().x - this._viewBox.width/2;
                this._viewBox.y = this.box.y + this.box.height - this._viewBox.height
                break;
            case EAST:    
                this._viewBox.width = 500;
                this._viewBox.height = 200;
                this._viewBox.x = this.box.x;
                this._viewBox.y = this.box.center().y - this._viewBox.height/2
                break;
            case SOUTH:
                this._viewBox.height = 500;
                this._viewBox.width = 200;
                this._viewBox.x = this.box.center().x - this._viewBox.width/2;
                this._viewBox.y = this.box.y 
                break;
            case WEST:
                this._viewBox.width = 500;
                this._viewBox.height = 200;
                this._viewBox.x = this.box.x + this.box.width - this._viewBox.width;
                this._viewBox.y = this.box.center().y - this._viewBox.height/2
                break;
        }
        if (game.debug){
            this._viewBox.render("#FF0");
        }
        inView = [];
        game.currentRoom.objects.forEach((o)=>{
            if(o.box.collidesWith(this._viewBox)){
                inView.push(o);
            }
        })

        return inView;
    }
    skeleton.getObjectsInRangeOfAttack = function(){
        //initialize the attack box
        if(!this._attackBox){
            this._attackBox = newBox(0,0,50,50);
        }
        //reposition the attack box
        switch(this.direction){
            case NORTH:
                this._attackBox.x = this.box.center().x - Math.round(this._attackBox.width / 2);
                this._attackBox.y = this.box.y - this._attackBox.height
                break;
            case EAST:
                this._attackBox.x = this.box.x + this.box.width;
                this._attackBox.y = this.box.center().y - Math.round(this._attackBox.height/2);
                break;
            case SOUTH:
                this._attackBox.x = this.box.center().x - Math.round(this._attackBox.width / 2);
                this._attackBox.y = this.box.y + this.box.height;
                break;
            case WEST:
                this._attackBox.x = this.box.x - this._attackBox.width;
                this._attackBox.y = this.box.center().y - Math.round(this._attackBox.height/2);   
                break;
        }
        if (game.debug){
            this._attackBox.render("#800");
        }
        inRange = []
        game.currentRoom.objects.forEach((o)=>{
            if(o!=this && this._attackBox.collidesWith(o.box)){
                inRange.push(o);
            }
        });
        return inRange;
    }
    skeleton.remove = function(){
        if(this.sprite){
            this.sprite.remove();
        }
        if(skeleton.attackPlayer){
            skeleton.attackPlayer.stop();
            skeleton.attackPlayer.dispose();
        }
        if(skeleton.walkPlayer){
            skeleton.walkPlayer.stop();
            skeleton.walkPlayer.dispose();
        } 
        if(game.debug){
            this.box.remove();
        }
    };
    skeleton._hurt = skeleton.hurt;
    skeleton.hurt = function(damage, knockback){
        startHealth=this.health;
        this._hurt(damage,knockback);
        if(startHealth>0 && this.health<=0){
            game.level.statistics.swordSkeletonsKilled++;
            game.level.statistics.enemiesKilled++;
            sfx.skeletonDeath();
        }
    }

    
    return skeleton;
}

function newPlayer(character){
    character.keys = [];
    character.gold = 0; 
    character.team = HEROIC;
    return character;
}

function newTorch(){
    var torch = newGameObject();
    torch.box.width=0;
    torch.box.height=0;
    torch.move = function(deltaT) {console.warn("unimplemented: attack()");};
    torch.hurt = function(damage, knockback){};
    torch.plane = ETHEREAL;
    torch.layer = DEFAULT;
    torch.intensity = 1;
    torch.wall = NORTH;
    torch.particles=[];
    torch.move = function(deltaT){
        if(!this.nextFlicker || this.nextFlicker<Date.now()){
            this.intensity = Math.random();
            this.offsetX = Math.random() * 7 - 3.5;
            this.offsetY = Math.random() * 7 - 3.5;
            this.nextFlicker = Date.now() + Math.random() * 50 + 50;
            if(this.sprite){
                this.sprite.setFrame(0, Math.floor(this.intensity * 4) % 4, Math.floor(Math.random()*8) % 8)
            }
            if(this.intensity > .75){
                particle = game.screen.drawRect(this.box.center().x + Math.random() * 10 - 5, this.box.center().y + Math.random() * 10 - 5 + dimensions.infoHeight,2,2,"#fea","#000",0).attr("opacity",.75);
                particle.kill = Date.now() + 1000 * Math.random() + 250;
                this.particles.push(particle);
            }
        }
    };
    torch.elements = [];
    torch.render = function(deltaT){
        //console.warn("unimplemented: render()");
        this.box.render("#FFF")
        if(this.elements.length==0){
            game.screen.onClear(()=>{this.elements=[]});
            this.sprite = newSprite(game.screen, images.torch, 512,256, 64, 64,this.box.x-32, this.box.y-32);
            this.sprite._lastLocation.r = this.sprite.location.r = this.wall * 90;
            this.elements.push(this.sprite)
        }

        this.sprite.render()
        this.particles.forEach((p)=>{
            switch(this.wall) {
                case NORTH:
                    p.attr({y: p.attr("y")-deltaT/1000 * 50})
                    break;
                case EAST:
                    p.attr({x: p.attr("x")+deltaT/1000 * 50})   
                    break; 
                case SOUTH:
                    p.attr({y: p.attr("y")+deltaT/1000 * 50})
                    break;
                case WEST:
                    p.attr({x: p.attr("x")-deltaT/1000 * 50})
                    break;
            }
        });
        remove(this.particles, (p)=>{
            if(p.kill<Date.now()){
                p.remove();
                return true;
            }
            return false;
        })
    };
    torch.remove = function(){
        this.sprite.remove();
    }
    return torch;

}

function newTorchLight(torch){
    var torchLight = newGameObject();
    torchLight.torch = torch
    torchLight.box = torch.box;
    torchLight.plane = ETHEREAL;
    torchLight.layer = EFFECT;
    torchLight.move = function(deltaT){};
    torchLight.elements = [];
    torchLight.render = function(deltaT){
        //console.warn("unimplemented: render()");
        if(this.elements.length==0){
            this.lightingElement = game.screen.drawEllipse(this.box.center().x, this.box.center().y, this.intensity * 10 + 140, this.intensity * 10 + 140, 0,  dimensions.infoHeight, "#fea","#000",0)
            this.lightingElement.attr({"fill":"#fea","opacity": .15});
            this.elements.push(this.lightingElement);
            game.screen.onClear(()=>{this.elements=[]});
        }
        this.lightingElement.attr({
            "rx": this.torch.intensity * 10 + 140,
            "ry": this.torch.intensity * 10 + 140,
            "opacity": this.torch.intensity * .0125 + .025,
            //"clip-rect": "" + this.box.center().x + "," + this.box.center().y + "," + 140 + "," + 140 
        });
        this.lightingElement.transform("t" + this.torch.offsetX + "," + this.torch.offsetY);

        this.lightingElement.toFront();
    };
    torchLight.remove = function(){
        if(this.lightingElement){
            this.lightingElement.remove();
        }
        
        this.box.remove();
    }
    return torchLight;

}

function newGame() {
    return {
        //debug: true,        
        screen: newScreen("main"),
        player: newPlayer(newAdventurer(newInputController())),
        statistics: newStatistics(),
        state: RUNNING
    };
}

function clearScreen(){
    if (!game.screen){
        
        var controllerHeight = dimensions.height-dimensions.infoHeight-dimensions.width;
        /*
        game.screen = Raphael("main", dimensions.width, dimensions.height);
        game.screen.setViewBox(0, 0, dimensions.width, dimensions.height, true);
        game.screen.canvas.setAttribute('preserveAspectRatio', 'meet');
        game.screen.canvas.style.backgroundColor = '#000';   
        game.screen.canvas.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space","preserve"); 
        
        game.screen2 = Raphael("controller", dimensions.width, dimensions.height);
        game.screen2.setViewBox(0, 0, dimensions.width, dimensions.height, true);
        game.screen2.canvas.setAttribute('preserveAspectRatio', 'meet');

        game.screen2.canvas.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space","preserve"); 
        gameElement2 = game.screen2.rect(0, dimensions.height-controllerHeight, dimensions.width, controllerHeight).attr({"fill":"#181818", "r": 50});
        */
        onResize();
    }else{      
        game.screen.clear();
    }

    var gameElement = game.screen.rect(0, 0, dimensions.width, dimensions.height).attr({"fill":SCREENBLACK});

}   

function newLevel(levelNumber){
    level = {
        number: levelNumber,
        world:0,
        rooms:[], 
        palette: {
            clipColor:"#642",
            wallColor: "#864",
            floorColor: "#048",    
        },
        statistics: newStatistics(),
        findRoom: function(x,y){
            for(i=0;i<this.rooms.length;i++){
                if(this.rooms[i].x==x && this.rooms[i].y==y){
                    return this.rooms[i];
                }
            }
            return null;
        },
        findNeighbor: function(room, direction){
            if(!room) return null;
            switch(direction){
                case NORTH:
                    return this.findRoom(room.x, room.y - 1);
                case EAST:
                    return this.findRoom(room.x + 1, room.y);
                case SOUTH:
                    return this.findRoom(room.x, room.y + 1);
                case WEST:
                    return this.findRoom(room.x - 1, room.y);
                default:
                    return null
            }
        },
        getRoom: function(x, y){
            foundRoom = this.findRoom(x,y);
            if(foundRoom) return foundRoom;
            room = newRoom(x, y)
            this.rooms.push(room);
            return room;
        },
        extents: function(){
            var nMost;
            var eMost;
            var sMost;
            var wMost;
            this.rooms.forEach((r)=>{
                if(nMost==null || nMost.y>r.y || (nMost.y == r.y && r.doors.length<=nMost.doors.length)){
                    nMost = r;
                }
                if(eMost==null || eMost.x<r.x || (eMost.x == r.x && r.doors.length<=eMost.doors.length)){
                    eMost = r;
                }
                if(sMost==null || sMost.y<r.y || (sMost.y == r.y && r.doors.length<=sMost.doors.length)){
                    sMost = r;
                }
                if(wMost==null || wMost.x>r.x || (wMost.x == r.x && r.doors.length<=wMost.doors.length)){
                    wMost = r;
                }
            })
            var extents=[];
            extents.push(nMost);
            extents.push(eMost);
            extents.push(sMost);
            extents.push(wMost);
            return extents;
        },
        _init: function(){
            //complexity math
            var defaultOffset = constants.doorWidth + constants.brickWidth + constants.doorFrameThickness * 3;
            var roomsPerRegion = 0 
            if(this.number <= 23){
                roomsPerRegion = (((this.number % 4) + 1) * 5) + 5;
                maxRegion = Math.floor(this.number/4);
            } else {
                roomsPerRegion = (((this.number - 24) + 1) * 5) + 25;
                maxRegion = BLUEKEY
            }
            this.world =  Math.floor(this.number/4) + 1;
            var hasBoss = (levelNumber % 4 == 3);

            //build map
            for(var region = NONE;region <= maxRegion; region++){
                regionRooms = [];
                //get entrance
                var entrance;
                this.doorCount = 0;
                if(this.rooms.length==0){
                    entrance = this.getRoom(0,0)//TODO: move to level
             
                } else {
                    extents = this.extents();
                    
                    //pick a random direction
                    direction = Math.round(4 * Math.random()) % 4;
             

                    extent = extents[direction];
                    switch(direction){
                        case NORTH:
                            entrance = this.getRoom(extent.x, extent.y - 1);
                            break;
                        case EAST:
                            entrance = this.getRoom(extent.x + 1, extent.y);
                            break;
                        case SOUTH:
                            entrance = this.getRoom(extent.x, extent.y + 1);
                            break;
                        case WEST:
                            entrance = this.getRoom(extent.x - 1, extent.y);
                            break;
                    }
                    //regionRooms.push(entrance);

                    

                    // Lock entrance if not starting position.
                    entrance.opened = false;
                    entrance.lock = region;
                    entrance.region = region;
                    
                    extent.doors.push(newDoor(this,extent,direction, 0));
                    entrance.doors.push(newDoor(this,entrance,(direction + 2) % 4, 0));
                    this.statistics.doorsSpawned++;
                }

                entrance.region = region;
                regionRooms.push(entrance); 
                
                while(regionRooms.length < roomsPerRegion){
                    seedRoom = randomEntry(regionRooms);
                    if (seedRoom == regionRooms[0] && seedRoom.doors.length == 3)
                    {
                        continue;
                    }
                    seedDirection = Math.round(4 * Math.random()) % 4;
                    if(seedRoom.findDoor(seedDirection)==null){
                        neighbor = this.findNeighbor(seedRoom,seedDirection);
                
                        
                        if(neighbor == null){
                            switch(seedDirection){
                                case NORTH:
                                    neighbor = this.getRoom(seedRoom.x, seedRoom.y - 1);
                                    break;
                                case EAST:
                                    neighbor = this.getRoom(seedRoom.x + 1, seedRoom.y);
                                    break;
                                case SOUTH:
                                    neighbor = this.getRoom(seedRoom.x, seedRoom.y + 1);
                                    break;
                                case WEST:
                                    neighbor = this.getRoom(seedRoom.x - 1, seedRoom.y);
                                    break;
                                default:
                                    console.warn({"unexpected seedDirection": seedDirection});
                                    
                            }
                            regionRooms.push(neighbor);
                        }else{
                            if(neighbor.region!=region || neighbor == regionRooms[0]){
                                continue
                            }
                        }
    
                        neighbor.region = region;   
                        seedRoom.doors.push(newDoor(this,seedRoom,seedDirection, 0));
                        neighbor.doors.push(newDoor(this,neighbor,(seedDirection + 2) % 4, 0));
                    }
                }


            }
            
            var exitRoom;
            var maxKey;
            if(this.number <= 19){
                var extents = this.extents();
                    
                //pick a random direction
                var direction = Math.round(4 * Math.random()) % 4;
         
                var extent = extents[direction];
                switch(direction){
                    case NORTH:
                        exitRoom = this.getRoom(extent.x, extent.y - 1);
                        break;
                    case EAST:
                        exitRoom = this.getRoom(extent.x + 1, extent.y);
                        break;
                    case SOUTH:
                        exitRoom = this.getRoom(extent.x, extent.y + 1);
                        break;
                    case WEST:
                        exitRoom = this.getRoom(extent.x - 1, extent.y);
                        break;
                }
                //regionRooms.push(entrance);

                //Lock entrance if not starting position.
                exitRoom.opened = false;
                maxKey = maxRegion + 1;
                exitRoom.lock = maxKey;
                exitRoom.region = maxKey;
                extent.doors.push(newDoor(this,extent,direction, 0));
                exitRoom.doors.push(newDoor(this,exitRoom,(direction + 2) % 4, 0));
                this.statistics.doorsSpawned++;
              
            } else {
                var extents = this.extents();   
                exitRoom = randomEntry(filter(extents,(r)=>{return r.doors.length==1 && r.region == maxRegion}))
                maxKey = maxRegion;
            }
            //TODO: size reasonably, randomize
            //minWidth = constants.roomMinWidthInBricks
            //minHeight = constants.roomMinHeightInBricks
            
            //exitRoom.box.width = Math.floor((Math.random() * (constants.roomMaxWidthInBricks - minWidth)) + minWidth) * constants.brickWidth;
            //exitRoom.box.height =constants.brickWidth;//Math.floor((Math.random() * (constants.roomMaxHeightInBricks - minHeight)) + minHeight) * constants.brickWidth;
            exitRoom.box.height = constrain((constants.roomMinHeightInBricks+2) *constants.brickWidth, exitRoom.box.height, constants.roomMaxHeightInBricks * constants.brickWidth)

            exitRoom.exit = 1;

            //jitter rooms
            for(var i=0;i<level.rooms.length;i++){
                
                room = level.rooms[i];
                room.jittered = true;
                if(i == 0){
                
                    room.doors.forEach((d)=>{d.stabilize()});
                   continue;
                }
                room.box.x = Math.round(Math.random() * ((dimensions.width - room.wallHeight * 2 ) - room.box.width)) + room.wallHeight;
                room.box.y = Math.round(Math.random() * ((dimensions.width - room.wallHeight * 2 ) - room.box.height)) + room.wallHeight;
            
                
                doorPadding = constants.doorFrameThickness + constants.doorWidth/2 + constants.brickWidth/2;

                for(wall = 0; wall<4; wall++){
                    oppositeWall = (wall + 2) % 4;
                    door = room.findDoor(wall);
                    if (!door){
                        continue;
                    }
                    neighbor = level.findNeighbor(room, wall);
                    if(!neighbor.jittered){
                        continue;
                    }
                    
                    neighboringDoor = neighbor.findDoor(oppositeWall);
                    
                    switch(wall){
                        case NORTH:
                            doorX = (-neighboringDoor.offset + neighbor.box.width/2 + neighbor.box.x + neighbor.wallHeight);
                            roomCenter = room.box.x + room.wallHeight + room.box.width/2;
                            offset = doorX - roomCenter;
        
                            if ((roomCenter + offset) < (room.box.x + room.wallHeight + doorPadding)){
                                diff = ((room.box.x + room.wallHeight + doorPadding) - (roomCenter + offset));
                                newleft = room.box.x - diff
                                offset += diff;
                                room.box.x = newleft;
                            }
                            if ((roomCenter + offset) > (room.box.x + room.wallHeight + room.box.width - doorPadding)){
                                diff = (roomCenter + offset) -(room.box.x + room.wallHeight + room.box.width - doorPadding);
                                room.box.width +=diff;
                                roomCenter = room.box.x + room.wallHeight + room.box.width/2;
                                offset = doorX - roomCenter;
                            }
                            door.offset = offset;
                            break;
                        case WEST: 
                            doorY = (neighboringDoor.offset + neighbor.box.height/2 + neighbor.box.y + neighbor.wallHeight);
                            roomCenter = room.box.y + room.wallHeight + room.box.height/2;
                            offset = doorY - roomCenter;
    
                            if ((roomCenter + offset) < (room.box.y + room.wallHeight + doorPadding)){
                                diff = ((room.box.y + room.wallHeight + doorPadding) - (roomCenter + offset));
                                newtop = room.box.y - diff
                                offset += diff;
                                room.box.y = newtop;
                            }
                            if ((roomCenter + offset) > (room.box.y + room.wallHeight + room.box.height - doorPadding)){
                                diff = (roomCenter + offset) -(room.box.y + room.wallHeight + room.box.height - doorPadding);
                                room.box.height +=diff;
                                roomCenter = room.box.y + room.wallHeight + room.box.height/2;                        
                                offset = doorY - roomCenter;
                            }
                            offset = offset *-1
                            
                            door.offset = offset;
                            break;
                        case SOUTH:
                            doorX = (neighboringDoor.offset + neighbor.box.width/2 + neighbor.box.x + neighbor.wallHeight);
                            roomCenter = room.box.x + room.wallHeight + room.box.width/2;
                            offset = doorX - roomCenter;
    
                            if ((roomCenter + offset) < (room.box.x + room.wallHeight + doorPadding)){
                                diff = ((room.box.x + room.wallHeight + doorPadding) - (roomCenter + offset));
                                newleft = room.box.x - diff
                                offset += diff;
                                room.box.x = newleft;
                            }
                            if ((roomCenter + offset) > (room.box.x + room.wallHeight + room.box.width - doorPadding)){
                                diff = (roomCenter + offset) -(room.box.x + room.wallHeight + room.box.width - doorPadding);
                                room.box.width +=diff;
                                roomCenter = room.box.x + room.wallHeight + room.box.width/2;
                                offset = doorX - roomCenter;
                            }
                            offset = offset *-1
                            
                            door.offset = offset;
                            break;
                        case EAST: 
                            doorY = (-neighboringDoor.offset + neighbor.box.height/2 + neighbor.box.y + neighbor.wallHeight);
                            roomCenter = room.box.y + room.wallHeight + room.box.height/2;
                            offset = doorY - roomCenter;
                            if ((roomCenter + offset) < (room.box.y + room.wallHeight + doorPadding)){
                                diff = ((room.box.y + room.wallHeight + doorPadding) - (roomCenter + offset));
                                newtop = room.box.y - diff
                                offset += diff;
                                room.box.y = newtop;
                            }
                            if ((roomCenter + offset) > (room.box.y + room.wallHeight + room.box.height - doorPadding)){
                                diff = (roomCenter + offset) -(room.box.y + room.wallHeight + room.box.height - doorPadding);
                                room.box.height +=diff;
                                roomCenter = room.box.y + room.wallHeight + room.box.height/2;
                                offset = doorY - roomCenter;    
                            }
                            
                            door.offset = offset;
                            break;
                        
                    }
                }
            }
        

            this.rooms.forEach((r)=>{r.doors.forEach((d)=>d.stabilize())});
            //set exit
            exit = newExit();
            exit.box.x = exitRoom.box.x + exitRoom.box.width/2 - exit.box.width/2
            exit.box.y = exitRoom.box.y + exitRoom.box.height/2 - exit.box.height/2
            exitRoom.objects.push(exit);

            //pepper with keys
            for(var key = maxKey; key>NONE; key--){
                var keyroom = randomEntry(filter(this.rooms,(r)=>{return r.region < key && r.doors.length == 1 && !r.exit}));
                if (keyroom == null){
                    keyroom = randomEntry(filter(this.rooms,(r)=>{return r.region < key && !r.exit}));    
                }
                if (keyroom.keyroom){//already a keyroom, try again
                    key++;
                    continue;
                }
                var chest = newTreasureChest(key);
                keyroom.spawn(chest);
                keyroom.keyroom = true;
                level.statistics.keysSpawned++;
                level.statistics.chestsSpawned++;
            }
            
            //pepper with random treasure chests & enemies
            minArea = constants.roomMinHeightInBricks * constants.roomMinWidthInBricks * constants.brickWidth * constants.brickWidth;
            maxArea = constants.roomMaxHeightInBricks * constants.roomMaxHeightInBricks * constants.brickWidth * constants.brickWidth ;
            thresholds = Math.round((maxArea-minArea) / 4);
            
            this.rooms.forEach((r,i)=>{
                if(i!=0 && !r.exit){
                    roomArea = r.box.width * r.box.height;
                    maxNumberOfObjects = Math.round((roomArea-minArea) / thresholds)
                    minNumberOfObjects = Math.round(Math.round((roomArea-minArea) / thresholds)/2)
                    enemies = constrain(minNumberOfObjects, Math.round(maxNumberOfObjects * Math.random()), maxNumberOfObjects)
                    for(i=0; i<enemies; i++){
                        //r.spawn(newKingCobra(newRandomController()));
                     
                        switch(Math.floor((Math.random()*3)%3)) {
                            case 0: 
                                e = newSwordSkeleton(newRandomController());
                                r.spawn(e);
                                this.statistics.swordSkeletonsSpawned++;
                                break;
                            case 1:
                                e = newCaveSpider(newRandomController());
                                r.spawn(e);
                                this.statistics.caveSpidersSpawned++;
                                break;
                            case 2:
                                e = newKingCobra(newRandomController());
                                r.spawn(e);
                                this.statistics.kingCobrasSpawned++;
                                break;
                        }
                        
                        this.statistics.enemiesSpawned++;
                    }
                    chests = constrain(minNumberOfObjects, Math.round(maxNumberOfObjects * Math.random()), maxNumberOfObjects)
                    for(i=0; i<chests; i++){
                        if (!r.keyroom){
                            r.spawn(newTreasureChest(RANDOM));
                            this.statistics.chestsSpawned++;
                        }
                    }
                    if(chests == 0 && r.doors.length == 1 && !r.keyroom){
                        r.spawn(newTreasureChest(RANDOM));
                        this.statistics.chestsSpawned++;
                    }

                    //plant floor spikes
                    r.doors.forEach((d)=>{
                        offsetT = 0; // Math.round(Math.random()*3000);
                        if(Math.random()<=.33){
                            switch (d.wall){
                                case NORTH:
                                    x = r.box.x + r.box.width/2 + d.offset+2;
                                    y = r.box.y;
                                    fs1 = newFloorSpikes(offsetT);
                                    fs1.box.x = x;
                                    fs1.box.y = y;
                                    r.objects.push(fs1);
                                    
                                    x -= 64
                                    fs2 = newFloorSpikes(offsetT);
                                    fs2.box.x = x;
                                    fs2.box.y = y;offsetT
                                    r.objects.push(fs2);
                                    break;
                                    
                                case EAST:
                                    x = r.box.x + r.box.width - 67;
                                    y = r.box.y + r.box.height / 2 + d.offset;
                                    fs1 = newFloorSpikes(offsetT);
                                    fs1.box.x = x;
                                    fs1.box.y = y;
                                    r.objects.push(fs1);
                                    
                                    y -= 48
                                    fs2 = newFloorSpikes(offsetT);
                                    fs2.box.x = x;
                                    fs2.box.y = y;
                                    r.objects.push(fs2);
                                    break;
                                case SOUTH:
                                    x = r.box.x + r.box.width/2 - d.offset+2;
                                    y = r.box.y + r.box.height - 55;
                                    fs1 = newFloorSpikes(offsetT);
                                    fs1.box.x = x;
                                    fs1.box.y = y;
                                    r.objects.push(fs1);
                                    
                                    x -= 64
                                    fs2 = newFloorSpikes(offsetT);
                                    fs2.box.x = x;
                                    fs2.box.y = y;
                                    r.objects.push(fs2);
                                    break;
                                case WEST:
                                    x = r.box.x + 5;
                                    y = r.box.y + r.box.height / 2 - d.offset;
                                    fs1 = newFloorSpikes(offsetT);
                                    fs1.box.x = x;
                                    fs1.box.y = y;
                                    r.objects.push(fs1);
                                    
                                    y -= 48
                                    fs2 = newFloorSpikes(offsetT);
                                    fs2.box.x = x;
                                    fs2.box.y = y;
                                    r.objects.push(fs2);
                                    break;   
                            }
                        }
                    });


                }
            })
            
           

            var startingRoom = this.rooms[0];

            //startingRoom.palette.floorColor="#064";


            var direction = !any(startingRoom.doors,(d)=>{return d.wall==NORTH}) ? NORTH :
                            !any(startingRoom.doors,(d)=>{return d.wall==EAST}) ? EAST :
                            !any(startingRoom.doors,(d)=>{return d.wall==WEST}) ? WEST :
                            SOUTH;


            var entranceDoor = newDoor(level, startingRoom, direction, 0)
            entranceDoor.atmosphere = levelNumber == 0 ? "90-#000:50-#FFe:95" : "#000";
            entranceDoor.forceBars = true;
            entranceDoor.isEntrance = true;
            
            entranceDoor.stabilize();
            this.rooms[0].doors.push(entranceDoor)

             //Add torches
             this.rooms.forEach((room)=>{
                for(var wall = NORTH; wall<=WEST; wall++){
                    wallDoor = room.findDoor(wall);
                    if(wallDoor == null){
                        var torch = newTorch();
                        switch(wall){
                            case NORTH:
                                torch.box.x = room.box.center().x;
                                torch.box.y =  room.box.y - room.wallHeight/2;
                                torch.wall = wall;
                                break;
                            case EAST:
                                torch.box.x = room.box.x + room.box.width + room.wallHeight/2; 
                                torch.box.y = room.box.center().y;
                                torch.wall = wall;
                                break;
                            case SOUTH:
                                torch.box.x = room.box.center().x;
                                torch.box.y =  room.box.y + room.box.height + room.wallHeight/2;
                                torch.wall = wall;
                                break;
                            case WEST:
                                torch.box.x = room.box.x - room.wallHeight/2; 
                                torch.box.y =  room.box.center().y;
                                torch.wall = wall;
                                break;
                        }
                        room.objects.push(torch);
                        room.objects.push(newTorchLight(torch));
                    }
                }
            })
        }
    };

    level._init();
    
    //generateMap(game.level);
    return level;
}

function exitLevel(){
    music.exitLevel();
    var r = newRoom();
    //r.wallHeight = 3 * constants.brickHeight
    r.box.x = r.wallHeight;
    r.palette.clipColor = "#000"
    r.box.width = 3 * constants.brickWidth;
    r.box.height = constants.roomMaxHeightInBricks * constants.brickWidth;
    r.box.y = Math.round((dimensions.width - room.box.height - room.wallHeight*2) / 2) + room.wallHeight;
    var exit = new newExit()
    exit.box.x = r.box.center().x - exit.box.width / 2 ;
    exit.box.y = r.wallHeight + constants.doorFrameThickness * 2;
    exit.tripped = function(){
        game.state = PAUSED;
        setTimeout(()=>{  
            fadeTo(SCREENBLACK,()=>{
                warpTo(game.level.number + 1);
                game.currentRoom.objects.forEach((o)=>o.render(0));
                fadeInFrom(SCREENBLACK,()=>{
                    game.state = RUNNING;
                })
            });
        },50);
      
    }
    r.objects.push(exit);
    var entrance = newDoor(level, room, SOUTH, 0);
    entrance.forceBars = true;
    r.doors.push(entrance);
    game.player.box.x = r.box.center().x - game.player.box.width/2;
    game.player.box.y = r.box.height;
    game.player.sprite._lastLocation.x =  game.player.box.x;
    game.player.sprite._lastLocation.y = game.player.box.y;
    game.player.sprite.scale = 1;
    game.player.speed = 150;
    game.player.direction = NORTH;
    r.objects.push(game.player);

    var wTorch = newTorch();
    wTorch.wall = WEST;
    wTorch.box.x = room.box.x - room.wallHeight / 2;
    wTorch.box.y = dimensions.width * 2 / 3
    r.objects.push(wTorch);
    r.objects.push(newTorchLight(wTorch));

    var eTorch = newTorch();
    eTorch.wall = EAST;
    eTorch.box.x = room.box.x + room.box.width + room.wallHeight / 2;
    eTorch.box.y = dimensions.width  / 3
    r.objects.push(eTorch);
    r.objects.push(newTorchLight(eTorch));
    
    clearScreen();
    r.render();
    game.screen.drawRect(r.x)
    game.currentRoom = r;
    game.currentRoom.objects.forEach((o)=>o.render(0));
    statsBox = newBox(r.box.x + r.box.width + r.wallHeight, 0, dimensions.width - (r.box.x + r.box.width + r.wallHeight), dimensions.width);
    fadeInFrom("#000", ()=>{
        
        game.state = RUNNING;
        game.level.statistics.finalizeLevelStats();
        game.statistics.add(game.level.statistics);
        game.level.statistics.render("LEVEL COMPLETE!", statsBox);
    });
}

function warpTo(levelNumber){
    music.explore();
    game.level = newLevel(levelNumber);
    game.level.start = Date.now();
    
    startingRoom = game.level.rooms[0];
    startingRoom.visited = 1;
    game.currentRoom = startingRoom;
    entrance = filter(startingRoom.doors, (d)=>{return d.isEntrance})[0];
    direction=NORTH;
    switch (entrance.wall){
        case NORTH:
            game.player.box.x = entrance.box.center().x - game.player.box.width/2;
            game.player.box.y = entrance.box.y+entrance.box.height - game.player.box.height;
            direction = SOUTH;
            break;
        case EAST:
            game.player.box.x = entrance.box.center().x;
            game.player.box.y = entrance.box.center().y - game.player.box.height/2;
            direction = WEST;
            break;
        case SOUTH:
            game.player.box.x = entrance.box.center().x - game.player.box.width/2;
            game.player.box.y = entrance.box.y;
            direction = NORTH;
            break;
        case WEST:
            game.player.box.x = entrance.box.center().x;
            game.player.box.y = entrance.box.center().y - game.player.box.height/2;
            direction = EAST;
            break;
    }

    game.currentRoom.objects.push(game.player);
    
    if(game.player.sprite){
        game.player.sprite.scale = 1;
    }

    game.player.speed = 150;
    game.player.move(0);
    game.player.direction = direction;
    game.player.keys = [];
    clearScreen();
    game.currentRoom.render();
}

function titleScreen(){
    game.state = PAUSED;
    clearScreen();
    var logo = game.screen.image(images.logo, 150, dimensions.infoHeight+150,600, 320);
    var prompt = game.screen.text(dimensions.width/2, dimensions.infoHeight+dimensions.width-250, "PRESS " + (ORIENTATION == PORTRAIT ? "FIRE" : "SPACE BAR") + " TO BEGIN").attr({ "font-size": "48px", "font-family": "monospace", "fill": "#FFF", "text-anchor": "middle", "font-weight": "bold"});  
    torch1 = newTorch();
    torch1.box.y = 375;
    torch1.box.x = 100;
    torch1.wall = NORTH;
    torch2 = newTorch();
    torch2.box.y = 375;
    torch2.box.x = 800;
    torch1.wall = NORTH;
    interval = setInterval(()=>{
        torch1.move(50);
        torch1.render(50);
        torch2.move(50);
        torch2.render(50);
        //torchLight1.render(50);
        //torch2.render();
    },50);
    waitForAttack(()=>{
        music.init();
        music.start();
        prompt.animate({opacity:0},100, "elastic",()=>{
            prompt.animate({opacity:1},100, "elastic",()=>{            
                prompt.animate({opacity:0},100, "elastic",()=>{
                    prompt.animate({opacity:1},100, "elastic",()=>{
                        prompt.animate({opacity:0},100, "elastic",()=>{
                            prompt.animate({opacity:1},100, "elastic",()=>{
                            });
                        });
                        
                        clearInterval(interval);
                        fadeTo("#FFF",()=>{
                            startGame();
                        })
                    });
                });
            });
        });
    });
}

function startGame(){
    game.player.maxHealth = 30;
    game.player.health = game.player.maxHealth;
    game.player.state = IDLE;
    game.player.gold = 0;
    game.statistics = newStatistics();
    warpTo(0);
    game.currentRoom.render(0);
    game.player.render(0);
    fadeInFrom("#FFF",()=>{
        game.state = RUNNING;
    });
}

function gameOver(){
    music.death();
    game.state = PAUSED;
    setTimeout(()=>{
        fadeTo(SCREENBLACK,()=>{
            game.currentRoom.objects.forEach((o)=>{o.remove();});
            game.player.sprite.location.x = 250;
            game.player.sprite.location.y = -16;
            game.player.sprite._lastLocation.x = game.player.sprite.location.x;
            game.player.sprite._lastLocation.y = game.player.sprite.location.y;
            game.player.sprite.setFrame(SOUTH, DYING, 7);
            game.player.sprite.render(0)    
            game.level.statistics.finalizeLevelStats();
            game.statistics.add(game.level.statistics);
            game.statistics.render("YOU DIED!", newBox(50,0,dimensions.width-100,dimensions.width));
        });
        waitForAttack(()=>{fadeTo("#FFF",startGame)});
    },1500)
}

function waitForAttack(callback){
    if(game.player.controller.attack){
        callback();
        return;
    }
    setTimeout(()=>{waitForAttack(callback)},50);
}

function regionColor(region){
    switch (region){
        case SILVERKEY:
            return "#606060";
        case GOLDKEY:
            return "#997700";
        case REDKEY:
            return "#600000";
        case GREENKEY: 
            return "#006000";
        case BLUEKEY: 
            return "#000070";
    }
    return "#864";
}

function drawMap(){
    var screen = game.screen;
    var level = game.level;
    var roomSize=10;
    var roomMargin=1;
    var extents = level.extents();
    level.rooms.forEach((r)=>{
        var extentRoom = (extents.indexOf(r) > -1)
        var centerX = dimensions.width/2 + r.x * (roomSize + roomMargin * 2);
        var centerY = dimensions.width/2 + r.y * (roomSize + roomMargin * 2);
        screen.drawRect(centerX-roomSize/2,centerY-roomSize/2, roomSize, roomSize, r.x==0 && r.y==0 ? "#00FF88" : regionColor(r.region), extentRoom ? "#fff": "#000",1);
        r.doors.forEach((d)=>{
            switch(d.wall){
                case NORTH:
                    screen.drawRect(centerX-2, centerY - roomSize/2 - roomMargin, 4, roomMargin, "#FFF","#000", 0);
                    break;
                
                case EAST:
                    screen.drawRect(centerX + roomSize/2, centerY - 2, roomMargin, 4, "#FFF","#000", 0);
                    break;
                case SOUTH:
                    screen.drawRect(centerX-2, centerY + roomSize/2, 4, roomMargin, "#FFF","#000", 0);
                    break;
                case WEST:
                    screen.drawRect(centerX- roomSize/2 - roomMargin, centerY - 2, roomMargin, 4, "#FFF","#000", 0);
                    break;
            }
        })
    });
}

tiles=[];
for(var i=0; i<100; i++){
    switch(Math.round(Math.random()*7)%7){
        case 0:
            tiles.push("#555555");
        case 1:
            tiles.push("#565656");
        case 2:
            tiles.push("#646464");
        case 3:
            tiles.push("#545454");
        case 4:
            tiles.push("#575454");
        case 5:
            tiles.push("#545457");
        case 6:
            tiles.push("#545754");
    }
}

function newRoom(x,y){
    room =  { 
        x:x, //map address
        y:y, //map address
        box: newBox(0,0,400,600),
        region: NONE,
        opened:1,
        barred:0,
        mapped:0,
        wallHeight: constants.brickHeight * 5,
        doors:[],
        objects:[],
        palette: {
            clipColor:"#642",
            wallColor: "#864",
            floorColor: "#753"//"#048",    
        },
        tileSeed: Math.floor(Math.random()*100),
        render: function(){
            //render clip area
            game.screen.rect(
                0, 
                dimensions.infoHeight, 
                dimensions.width, 
                dimensions.width
            ).attr({
                "fill":this.palette.clipColor
            });
            
            //render walls
            game.screen.rect(
                this.box.x - this.wallHeight,
                this.box.y - this.wallHeight + dimensions.infoHeight, 
                this.box.width + this.wallHeight * 2,
                this.box.height + this. wallHeight * 2
            ).attr({
                "fill": this.palette.wallColor,
                "stroke-width": constants.lineThickness
            });
            

            game.screen.drawRect(
                this.box.x - this.wallHeight + constants.brickHeight * 2,
                this.box.y - this.wallHeight + dimensions.infoHeight + constants.brickHeight * 2, 
                this.box.width + this.wallHeight * 2 - constants.brickHeight * 4,
                this.box.height + this. wallHeight * 2  - constants.brickHeight * 4,
                regionColor(this.region),
                "#000",
                0
            );

            
            game.screen.drawRect(
                this.box.x - this.wallHeight + constants.brickHeight * 3,
                this.box.y - this.wallHeight + dimensions.infoHeight + constants.brickHeight * 3, 
                this.box.width + this.wallHeight * 2 - constants.brickHeight * 6,
                this.box.height + this. wallHeight * 2  - constants.brickHeight * 6,
                this.palette.wallColor,
                "#000",
                0
            );




            //render each wall
            renderBricks(this)

            //render doors
            this.doors.forEach((door)=>door.render());

            //render floor
            game.screen.rect(
                this.box.x,
                this.box.y + dimensions.infoHeight, 
                this.box.width, 
                this.box.height
            ).attr({
                fill: this.palette.floorColor,
                "stroke-width": constants.lineThickness
            })
            var t = this.tileSeed;
            var tileWidth = (constants.brickWidth*1.2);
            for(var r=0; r<this.box.height;r+=tileWidth){
                for(var c=0; c<this.box.width;c+=tileWidth){

                    var x = c + this.box.x;
                    var y = r + this.box.y + dimensions.infoHeight;
                    var w = tileWidth;
                    var h = tileWidth;
                    if(c+w>this.box.width){
                        w = this.box.width - c;
                    }
                    if(r+h>this.box.height){
                        h = this.box.height - r;
                    }
                    game.screen.drawRect(x, y, w, h , calculateAlpha(this.palette.floorColor,tiles[t],.25),calculateAlpha(this.palette.floorColor,"#000",.25),1.5)//.attr({opacity:.25});
                    t = (t+1) % tiles.length;
                }   
            }
            var centerX = this.box.x + this.box.width/2
            var centerY = this.box.y + this.box.height/2

        },
        findDoor: function(wall){
            for(i = 0; i<this.doors.length;i++){
                if(this.doors[i].wall == wall){
                    return this.doors[i];
                }
            }
            return null;
        },
        constrain: function(gameObject, x2, y2){
            x1 = gameObject.box.x;
            y1 = gameObject.box.y;
            constrained = newBox(gameObject.box.x, gameObject.box.y, gameObject.box.width, gameObject.box.height);
            //game.player.box
            constrained.x = constrain(this.box.x, x2, this.box.x + this.box.width - gameObject.box.width);
            constrained.y = constrain(this.box.y, y2, this.box.y + this.box.height - gameObject.box.height);
            
            
            //constrain against all other objects
            this.objects.forEach((gameObject2)=>{
                if(gameObject!=gameObject2 && gameObject2.plane == PHYSICAL){
                    if(constrained.collidesWith(gameObject2.box)){
                        //revert to original
                        constrained.resolveCollision(gameObject2.box);
                    }
                }
            })
            if (this.barred) {
                return constrained;
            }
            //TODO: move door concerns?
            allowance = Math.round((constants.doorWidth/2)+constants.doorFrameThickness);
            for(d=0;d<this.doors.length;d++){
                door = this.doors[d];
                if(!door.opened && game.player.keys.indexOf(door.lock)>-1 && game.player.box.inside(door.box)){
                    door.opened = 1;
                    game.level.findNeighbor(this, door.wall).opened=1;
                    game.level.statistics.doorsUnlocked++;
                    sfx.roomOpened();
                    door.render();
                    
                } else if(!door.opened || door.forceBars) {
                    return constrained;
                }
                switch(door.wall){  
                    case NORTH:
                        if(game.player.box.inside(door.box) ){
                            if(y2<y1) constrained.x = door.box.center().x - Math.round(game.player.box.width/2);
                            constrained.y = y2;
                            if (game.player.box.collidesWith(door.trip)){
                                openNextRoom(door.wall);
                                return newBox(game.player.box.x+1, game.player.box.y+1,game.player.box.width, game.player.box.height);
                            }
                        }
                        break;

                    case EAST:

                        if(game.player.box.inside(door.box) ){
                            if(x2>x1) constrained.y = door.box.center().y;
                            constrained.x = x2;
                            if (game.player.box.collidesWith(door.trip)){
                                openNextRoom(door.wall);
                                return newBox(game.player.box.x+1, game.player.box.y+1,game.player.box.width, game.player.box.height);
                            }
                        }
                        break;
                    case SOUTH:
                        if(game.player.box.inside(door.box) ){
                            if(y2>y1) constrained.x = door.box.center().x - Math.round(game.player.box.width/2);
                            constrained.y = y2;
                            if (game.player.box.collidesWith(door.trip)){
                                openNextRoom(door.wall);
                                return newBox(game.player.box.x+1, game.player.box.y+1,game.player.box.width, game.player.box.height);
                            }
                        }
                        break
                    case WEST:
                        if(game.player.box.inside(door.box) ){
                            if(x2<x1) constrained.y = door.box.center().y;
                            constrained.x = x2;
                            if (game.player.box.collidesWith(door.trip)){
                                openNextRoom(door.wall);
                                return newBox(game.player.box.x+1, game.player.box.y+1,game.player.box.width, game.player.box.height);
                            }
                        }
                        break;
                }
            };

            return constrained;
        },
        spawn: function(object){
            do {
                object.box.x = this.box.x + Math.round((this.box.width-object.box.width) * Math.random());
                object.box.y = this.box.y + Math.round((this.box.height-object.box.height) * Math.random());
            } while (any(this.objects, (o)=>{return o.box.collidesWith(object.box)}) || any(this.doors,(d)=>(d.box.collidesWith(object.box))))
            this.objects.push(object);
        }
    };
    room.box.width = Math.round((((constants.roomMaxWidthInBricks - constants.roomMinWidthInBricks) * Math.random()) + constants.roomMinWidthInBricks)) * constants.brickWidth;
    room.box.height = Math.round((((constants.roomMaxHeightInBricks - constants.roomMinHeightInBricks) * Math.random()) + constants.roomMinHeightInBricks)) * constants.brickWidth;
    //center by default
    room.box.x = Math.round((dimensions.width - room.box.width - room.wallHeight*2) / 2) + room.wallHeight;
    room.box.y = Math.round((dimensions.width - room.box.height - room.wallHeight*2) / 2) + room.wallHeight;
    return room;
}

function renderBricks(room){
    color="#000";
    rows = room.box.height/constants.brickHeight;
    
    //NORTHERN WALL
    //determine focal point / offset
    focus={};
    focus.x =  room.box.width / 2
    focus.y = trig.cotangent(trig.degreesToRadians(45)) * focus.x;
    
    offset={};
    offset.x = focus.x + room.box.x;
    offset.y = focus.y + room.box.y + dimensions.infoHeight;
    
    game.screen.drawAngleSegmentX(trig.degreesToRadians(225), -room.box.width/2-room.wallHeight, -room.box.width/2, offset.x, offset.y, color, constants.lineThickness);

    row = 1;
    for(y = 0; y<room.wallHeight; y+=constants.brickHeight){
        y1 = -(room.box.width)/2 - room.wallHeight + y;
        y2 = y1 + constants.brickHeight
        column = 0;
    
        for(x = constants.brickWidth/2; x < room.box.width ; x += constants.brickWidth/2){
            angle = trig.pointToAngle(room.box.width / 2, room.box.width / 2 - x);
            
            if(column % 2 == row % 2){
                game.screen.drawAngleSegmentY(angle, y1, y2, offset.x, offset.y, color, constants.lineThickness);
                //break;
            }
            //break;
            column ++;
        }
        if(row>1){
            game.screen.drawLine(Math.round(trig.cotangent(trig.degreesToRadians(225)) * y1)+offset.x, y1 + offset.y, Math.round(trig.cotangent(trig.degreesToRadians(315)) * y1)+offset.x, y1+offset.y, color, constants.lineThickness);
        }
        row++;
    }
    
    //SOUTHERN WALL
    //determine focal point / offset
    focus={};
    focus.x =  room.box.width / 2
    focus.y = -trig.cotangent(trig.degreesToRadians(225)) * focus.x;
    
    offset={};
    offset.x = focus.x + room.box.x;
    offset.y = focus.y + room.box.y + room.box.height + dimensions.infoHeight;

    game.screen.drawAngleSegmentX(trig.degreesToRadians(225), room.box.width/2+room.wallHeight, room.box.width/2, offset.x, offset.y, color, constants.lineThickness);

    row = 1;
    for(y = 0; y<room.wallHeight; y+=constants.brickHeight){
        y1 = (room.box.width)/2 + room.wallHeight - y;
        y2 = y1 - constants.brickHeight
        column = 0;
    
        for(x = constants.brickWidth/2; x < room.box.width ; x += constants.brickWidth/2){
            angle = trig.pointToAngle(room.box.width / 2, room.box.width / 2 - x);
            
            if(column % 2 == row % 2){
                game.screen.drawAngleSegmentY(angle, y1, y2, offset.x, offset.y, color, constants.lineThickness);
                //break;
            }
            //break;
            column ++;
        }
        if(row>1){
            game.screen.drawLine(Math.round(trig.cotangent(trig.degreesToRadians(225)) * y1)+offset.x, y1 + offset.y, Math.round(trig.cotangent(trig.degreesToRadians(315)) * y1)+offset.x, y1+offset.y, color, constants.lineThickness);
        }
        row++;
    }


    //EASTERN WALL
    //determine focal point / offset
    focus={};
    focus.y = -room.box.height / 2
    focus.x = trig.tangent(trig.degreesToRadians(135)) * focus.y;
    
    offset={};
    offset.x = focus.x + room.box.x;
    offset.y = focus.y + room.box.y + room.box.height + dimensions.infoHeight;

    game.screen.drawAngleSegmentY(trig.degreesToRadians(135), room.box.height/2+room.wallHeight, room.box.height/2, offset.x, offset.y, color, constants.lineThickness);

    row = 0;
    for(x = 0; x<room.wallHeight; x+=constants.brickHeight){
        x1 = -room.box.height/2 - room.wallHeight + x;
        x2 = x1 + constants.brickHeight;
        column = 0;
        //game.screen.drawLine(x1+ offset.x, 0, x2+offset.x, dimensions.height, "#FF0", constants.lineThickness);
    
        for(y = constants.brickWidth/2; y < room.box.height ; y += constants.brickWidth/2){
            angle = trig.pointToAngle(-room.box.height / 2+y, -room.box.height / 2);
            
                if(column % 2 == row % 2){
                    game.screen.drawAngleSegmentX(angle, x1, x2, offset.x, offset.y, color, constants.lineThickness);
                    //break;
                }
            //break;
            column ++;
        }
        if(row>0){
        //    game.screen.drawLine(Math.round(trig.cotangent(trig.degreesToRadians(135)) * y1)+offset.x, y1 + offset.y, Math.round(trig.cotangent(trig.degreesToRadians(225)) * y1)+offset.x, y1+offset.y, color, constants.lineThickness);
            game.screen.drawLine(x1 + offset.x, Math.round(trig.tangent(trig.degreesToRadians(135))*x1)+offset.y, x1 + offset.x, Math.round(trig.tangent(trig.degreesToRadians(225))*x1)+offset.y, color, constants.lineThickness);
        
        }
        row++;
    }

    //WESTERN WALL
    //determine focal point / offset
    focus={};
    focus.y = -room.box.height / 2
    focus.x = trig.tangent(trig.degreesToRadians(225)) * focus.y;
    
    offset={};
    offset.x = focus.x + room.box.x + room.box.width;
    offset.y = focus.y + room.box.y + room.box.height + dimensions.infoHeight;

    game.screen.drawAngleSegmentY(trig.degreesToRadians(315), -room.box.height/2-room.wallHeight, -room.box.height/2, offset.x, offset.y, color, constants.lineThickness);
    
    row = 0;
    for(x = 0; x<room.wallHeight; x+=constants.brickHeight){
        x1 = room.box.height/2 + x;
        x2 = x1 + constants.brickHeight;
        column = 0;
        //game.screen.drawLine(x1+ offset.x, 0, x2+offset.x, dimensions.height, "#FF0", constants.lineThickness);
    
        for(y = constants.brickWidth/2; y < room.box.height ; y += constants.brickWidth/2){
            angle = trig.pointToAngle(-room.box.height / 2+y, -room.box.height / 2);
            
                if(column % 2 == row % 2){
                    game.screen.drawAngleSegmentX(angle, x1, x2, offset.x, offset.y, color, constants.lineThickness);
                    //break;
                }
            //break;
            column ++;
        }
        if(row>0){
        //    game.screen.drawLine(Math.round(trig.cotangent(trig.degreesToRadians(135)) * y1)+offset.x, y1 + offset.y, Math.round(trig.cotangent(trig.degreesToRadians(225)) * y1)+offset.x, y1+offset.y, color, constants.lineThickness);
            game.screen.drawLine(x1 + offset.x, Math.round(trig.tangent(trig.degreesToRadians(135))*x1)+offset.y, x1 + offset.x, Math.round(trig.tangent(trig.degreesToRadians(225))*x1)+offset.y, color, constants.lineThickness);
        }
        row++;
    }

}

function newDoor(level, room, wall, offset){
    door = {
        room: room,
        wall: wall % 4,
        color: palette.doorDefaultColor,
        atmosphere: "#000",
        offset: offset, 
        forceBars: false,
        render: function(){
            //clear previous rendering
            if(this.elements && this.elements.length>0){
                this.elements.forEach((e)=>e.remove());
                game.screen.onClear(()=>{this.elements = [];});
            }
            this.elements = [];
 
    
            focus={};
            focus.x =  (this.wall == NORTH || this.wall == SOUTH ? this.room.box.width : this.room.box.height) / 2
            //focus.x = this.room.box.width /2
            focus.y = trig.cotangent(trig.degreesToRadians(45)) * focus.x;
        
            offset={};
            offset.x = 0;//focus.x + this.room.box.x + this.room.wallHeight;
            offset.y = 0;//focus.y + this.room.box.y + this.room.wallHeight + dimensions.infoHeight;
        
            //DOOR FRAME
            x1 = this.offset - constants.doorWidth/2 - constants.doorFrameThickness;
            y1 = -focus.x;
            x4 = this.offset + constants.doorWidth/2 + constants.doorFrameThickness;
            y4 = -focus.x;
            y2 = y1 - constants.doorHeight - constants.doorFrameThickness;
            x2 = trig.cotangent(trig.pointToAngle(y1,x1)) * y2;
            y3 = y4 - constants.doorHeight - constants.doorFrameThickness;
            x3 = trig.cotangent(trig.pointToAngle(y4,x4)) * y3;
            this.elements.push(game.screen.drawPoly(x1,y1,x2,y2,x3,y3,x4,y4,offset.x,offset.y,palette.doorFrame,"#000",constants.lineThickness));
        
        
            //DOOR
            x1 = this.offset - constants.doorWidth / 2;
            y1 = -focus.x;
            x4 = this.offset + constants.doorWidth / 2;
            y4 = -focus.x;
            dy2 = y1 - constants.doorHeight;
            dx2 = trig.cotangent(trig.pointToAngle(y1,x1)) * dy2;
            dy3 = y4 - constants.doorHeight;
            dx3 = trig.cotangent(trig.pointToAngle(y4,x4)) * dy3;
            
            this.opened = 1;
            portalTo = level.findNeighbor(room, this.wall);
            if(portalTo){
                this.opened = portalTo.opened;
                if(!this.opened){
                    this.lock = portalTo.lock;
                    this.color = regionColor(portalTo.region);
                }
            }
            
            this.elements.push(game.screen.drawPoly(x1,y1,dx2,dy2,dx3,dy3,x4,y4,offset.x,offset.y,"#000",constants.lineThickness));
            this.elements.push(game.screen.drawPoly(x1+10,y1,dx2+10,dy2,dx3-10,dy3,x4-10,y4,offset.x,offset.y,this.atmosphere,constants.lineThickness));

            //THRESHOLD
            x1 = this.offset - constants.doorWidth/2 ;
            y1 = -focus.x + constants.lineThickness - 3;
            x4 = this.offset + constants.doorWidth/2;
            y4 = -focus.x + constants.lineThickness - 3;
            y2 = y1 - constants.thresholdDepth;
            if (x1 > 0){
                x2 = trig.cotangent(trig.pointToAngle(y1,x1)) * y2;        
            }else {
                x2 = x1 - ((trig.cotangent(trig.pointToAngle(y1,x1)) * y2)-x1)/3;
            }
            
            y3 = y4 - constants.thresholdDepth;
            if (x4 < 0){
                x3 = trig.cotangent(trig.pointToAngle(y4,x4)) * y3;      
            }else {
                x3 = x4 - ((trig.cotangent(trig.pointToAngle(y4,x4)) * y3)-x4)/3;
            }
            this.elements.push(game.screen.drawPoly(x1,y1,x2,y2,x3,y3,x4,y4,offset.x,offset.y,"90-" +this.room.palette.floorColor+ ":5-#000:95","#000",0));                
        
            
            if (!this.opened){
                //DOOR
        
                x1 = this.offset - constants.doorWidth / 2;
                y1 = -focus.x - constants.doorFrameThickness;
                x4 = this.offset + constants.doorWidth / 2;
                y4 = -focus.x - constants.doorFrameThickness;
                dy2 = y1 - constants.doorHeight + constants.doorFrameThickness ;
                dx2 = trig.cotangent(trig.pointToAngle(y1,x1)) * dy2;
                dy3 = y4 - constants.doorHeight + constants.doorFrameThickness;
                dx3 = trig.cotangent(trig.pointToAngle(y4,x4)) * dy3;
                this.elements.push(game.screen.drawPoly(x1,y1,dx2,dy2,dx3,dy3,x4,y4,offset.x,offset.y,this.color,constants.lineThickness));

                
                //KEYHOLE
                x0 = this.offset;
                y0 = -focus.x;
                
                y1 = -focus.x - constants.doorHeight/5;
                x1 = (trig.cotangent(trig.pointToAngle(y0,x0)) * y1) - constants.doorWidth/12;
                
                y4 = -focus.x - constants.doorHeight/5;
                x4 = (trig.cotangent(trig.pointToAngle(y0,x0)) * y1) + constants.doorWidth/12;
        
                y2 = y1 - 16;
                x2 = (trig.cotangent(trig.pointToAngle(y0,x0)) * y2) -1 ;        
                y3 = y4 - 16;
                x3 = (trig.cotangent(trig.pointToAngle(y0,x0)) * y3) +1; 
        
                this.elements.push(game.screen.drawPoly(x1,y1,x2,y2,x3,y3,x4,y4,offset.x,offset.y,"#000","#000",0));
                
                this.elements.push(game.screen.drawEllipse( (trig.cotangent(trig.pointToAngle(y0,x0)) * y3), y3, 8, 4,offset.x,offset.y,"#000","#000",0));
        
                
            }
        
            if(this.room.barred || this.forceBars){
                
                bars = 5;
            
                for(i=1;i<bars; i++){
                    x0 = (this.offset - constants.doorWidth/2) + (constants.doorWidth/bars) * i;
                    y0 = -focus.x - constants.doorFrameThickness //-this.room.box.width/2;
                    y1 = y0-constants.doorHeight + constants.doorFrameThickness;
                    x1 = (trig.cotangent(trig.pointToAngle(y0,x0)) * y1);                    
                    
                    this.elements.push(game.screen.drawLine(x0, y0, x1, y1, "#000", constants.lineThickness*3));
                    this.elements.push(game.screen.drawLine(x0, y0, x1, y1, palette.doorBarColor, constants.lineThickness));
                 
                }
                this.elements.push(game.screen.drawLine(dx2, dy2, dx3, dy3, "#000", constants.lineThickness));
              
            }
            t = ""
            switch (this.wall){
                case NORTH:
                    t = "t" + Math.round(focus.x + this.room.box.x) + "," + Math.round(focus.y + this.room.box.y + dimensions.infoHeight);
                    break;
                case SOUTH:
                    t = "r180,0,0t" + Math.round(focus.x + this.room.box.x) *-1+ "," + Math.round(-focus.y + this.room.box.y + this.room.box.height + dimensions.infoHeight) *-1;
                    break;
                case EAST:
                    t = "r90,0,0t" + Math.round(focus.x + this.room.box.y + dimensions.infoHeight) + "," + Math.round(-focus.y + this.room.box.x + this.room.box.width) * -1;
                    break;
                case WEST:
                    t = "r270,0,0t" + Math.round(focus.x + this.room.box.y + dimensions.infoHeight) * -1 + "," + Math.round(focus.y + this.room.box.x);
                    break;
            }      
            this.elements.forEach((element)=>{
                element.transform(t)
            })
            
            if (game.debug && this.box ){
                this.box.render("#0FF");
            }
            if (game.debug && this.trip ){
                this.trip.render("#F00");
            }
        
        }
    }

    door.stabilize=function(){
        switch(this.wall){
            case NORTH:
                this.box = newBox(
                    room.box.x + room.box.width / 2 + this.offset - constants.doorWidth/2,
                    room.box.y - room.wallHeight,
                    constants.doorWidth,
                    room.wallHeight + game.player.box.height * 1.25
                );
                this.trip = newBox(
                    room.box.x + room.box.width / 2 + this.offset - constants.doorWidth/2,
                    room.box.y - game.player.box.height - 25,
                    constants.doorWidth,
                    game.player.box.height  
                );
                break;
            case EAST:
                this.box = newBox(
                    room.box.x + room.box.width - game.player.box.width * 1.25,
                    room.box.y + room.box.height / 2 + this.offset - constants.doorWidth/2,
                    room.wallHeight + game.player.box.width * 1.25,
                    constants.doorWidth
                );
                this.trip = newBox(
                    room.box.x + room.box.width + 35,
                    room.box.y + room.box.height / 2 + this.offset - constants.doorWidth/2,
                    game.player.box.width,
                    constants.doorWidth
                );
                break;
            case SOUTH:
                this.box = newBox(
                    room.box.x + room.box.width / 2 - this.offset - constants.doorWidth/2,
                    room.box.y + room.box.height - room.wallHeight,
                    constants.doorWidth,
                    room.wallHeight + game.player.box.height * 1.25
                );
                this.trip = newBox(
                    room.box.x + room.box.width / 2 - this.offset - constants.doorWidth/2,
                    room.box.y + room.box.height + 35,
                    constants.doorWidth,
                    game.player.box.height  
                );
                break;
            case WEST:
                this.box = newBox(
                    room.box.x - room.wallHeight,
                    room.box.y + room.box.height / 2 - this.offset - constants.doorWidth/2,
                    room.wallHeight + game.player.box.width * 1.25,
                    constants.doorWidth
                );
                this.trip = newBox(
                    room.box.x - room.wallHeight,
                    room.box.y + room.box.height / 2 - this.offset - constants.doorWidth/2,
                    game.player.box.width,
                    constants.doorWidth
                );
                break;
            default:
                console.warn({"unexpected wall": wall});  
        }
    }

    return door
}

function getEntranceLocation(room, wall){
    wall = wall % 4
    var door = room.findDoor(wall);
    var loc = {x:0, y:0};
    switch (wall){
        case NORTH:
            return {
                x : game.player.box.x,//room.box.x + room.wallHeight + door.offset + room.box.width/2,
                y : room.box.y - constants.doorHeight + constants.doorFrameThickness + game.player.box.height
            };
        case EAST: 
            return {
                x : room.box.x + room.box.width - game.player.box.width, 
                y : game.player.box.y//room.box.y + room.wallHeight - constants.doorHeight/2
            };
        
        case SOUTH:
            return {
                x : game.player.box.x,//room.box.x + room.wallHeight + door.offset + room.box.width/2,
                y : room.box.y + room.box.height - game.player.box.height/2
            };
        case WEST: 
            return {
                x : room.box.x + game.player.box.width/2,
                y : game.player.box.y//room.box.y + room.wallHeight - constants.doorHeight/2
            };
        
        default:
            console.warn("unexpected wall: " + wall)
            return {x:0, y:0};
    }
}

function gameLoop(lastTime){
    var startTime = Date.now();
    var deltaT = Math.round(startTime-lastTime);
    if(deltaT>1000) deltaT == 1000;
    if(game.state == RUNNING){
            
        if(game.level){
            game.level.statistics.timeSpent+=deltaT;
        }

        //console.log(deltaT);
        //Move objects and collected the dead ones.
        var deadObjects = [];
        game.currentRoom.objects.forEach((o)=>{
            if(o.state != DYING || o.state != DEAD){
                o.move(deltaT);
            }
            if(o.state == DEAD ){
                deadObjects.push(o);
            }
        });
        
        barred = 0;
        game.currentRoom.objects.forEach((o)=>{
            if(o.team == DUNGEON && o.state != DYING && o.state != DEAD){
                barred = 1;
            }
        });
        if(game.currentRoom.barred!=barred){
            if(barred){
                sfx.roomBarred()
            }else{
                sfx.roomOpened()    
            }
            game.currentRoom.barred = barred;

            game.currentRoom.doors.forEach((d)=>{d.render();});
        }

        //Sort List of objects in current room by their y values.
        game.currentRoom.objects.sort((a,b)=>{return a.layer < b.layer ? -1 : a.layer > b.layer ? 1 : a.box.y < b.box.y ? -1 : a.box.y > b.box.y ? 1 : 0;})

        //Render all objects in current room in order.  
        game.currentRoom.objects.forEach((o)=>o.render(deltaT));
        
        //remove the dead objects.
        deadObjects.forEach((o)=>{
            if(o!=game.player){
                game.currentRoom.objects.splice(game.currentRoom.objects.indexOf(o),1)
            }
            o.remove();
        });

        
    }

    if(game.level){
        renderInfo();
        
    }
    //Render our controller
    game.player.controller.render();//TODO: find a better way to reference this. 
    
    window.setTimeout(()=>gameLoop(startTime),0);
}

function openNextRoom(direction){
    if(game && game.currentRoom && game.currentRoom.findDoor(direction)){
        nextRoom = game.level.findNeighbor(game.currentRoom, direction);
        if(nextRoom.opened){
            console.log("opening next room...")
            nextRoom.visited = 1;
            nextRoom.objects.push(game.player);
            game.currentRoom.objects.splice(game.currentRoom.objects.indexOf(game.player),1);
            game.currentRoom = nextRoom;
            loc = getEntranceLocation(nextRoom,(direction + 2) % 4)
            if (game.player && game.player.box){
                game.player.box.x = loc.x;
                game.player.box.y = loc.y;
                if(game.player.sprite){
                    game.player.sprite.location.x = game.player.sprite._lastLocation.x = (game.player.box.x - 25);
                    game.player.sprite.location.y = game.player.sprite._lastLocation.y = (game.player.box.y - 50);
                }
            }
        }
        clearScreen();
        game.currentRoom.render();
    }
}

function renderInfo(){
    if(!game.infoElements){
        game.infoElements = {};
        game.infoElements.hearts = [];
        game.infoElements.keys = [];
        for(var i=0; i<constants.maxHeartContainers; i++){
            heart = newSprite(game.screen,images.heartContainer,32,128,32,32, i * 36 + 8,-dimensions.infoHeight + 8)
            game.infoElements.hearts.push(heart);
        }
        for(var i=0; i<5; i++){
            game.infoElements.keys.push(newSprite(game.screen, images.keyIcons, 32, 192, 32, 32, i * 36 + 8, -dimensions.infoHeight + 48))
        }
        game.screen.circle(dimensions.width-20,64,10).attr({"fill":"#ffd700", "stroke":"#FFF", "stroke-width": 3});
        text = game.screen.text(dimensions.width-40,64,"1,000,000")
        text.attr({ "font-size": "32px", "font-family": "monospace", "fill": "#FFF", "text-anchor": "end"});
        game.infoElements.goldElement = text
        text = game.screen.text(dimensions.width/2,64,"Level 1-1")
        text.attr({ "font-size": "32px", "font-family": "monospace", "fill": "#FFF", "text-anchor": "middle"});
        game.infoElements.levelElement = text
        game.screen.onClear(()=>{game.infoElements=null});
    }
    game.infoElements.hearts.forEach((h, i)=>{
        if(((i + 1) * 10) > game.player.maxHealth){
            h.setAnimation(0,0);
        }else{
            if(((i + 1) * 10) <= game.player.health){
                h.setAnimation(0,3);
            } else if (((i + 1) * 10) - 5 <= game.player.health){
                h.setAnimation(0,2);
            }    else {
                h.setAnimation(0,1);
            }
        }
        h.render(0);
    })
    game.infoElements.keys.forEach((k, i)=>{
        if(game.player.keys.length>i){
            k.setAnimation(0,game.player.keys[i]);
        }else{
            k.setAnimation(0,NONE);
        }
        k.render(0);
    });
    
    game.infoElements.goldElement.attr("text",numberWithCommas(game.player.gold));
    game.infoElements.levelElement.attr("text","Level " + game.level.world + "-" + ((game.level.number % 4) + 1));
}

sfx = {
    walk: function(start){
        if(this.walkPlayer && this.walkPlayer.loaded){
            if(start){
                this.walkPlayer.start();
            }else{
                this.walkPlayer.stop();    
            }
        }else if(start){    
            this.walkPlayer = new Tone.Player("mp3/footsteps.mp3").toDestination();
            // play as soon as the buffer is loaded
            this.walkPlayer.autostart = true;
            this.walkPlayer.loop=true;
            this.walkPlayer.volume.value = -15;
        }
    },
    openChest: function(){
        if(this.chestPlayer && this.chestPlayer.loaded){
            this.chestPlayer.start();
        }else{
            this.chestPlayer = new Tone.Player("mp3/chest.mp3").toDestination();
            // play as soon as the buffer is loaded
            this.chestPlayer.volume.value = -10;
            this.chestPlayer.autostart = true;
        }
    },
    treasure: function(treasure){

        switch(treasure){
            case HEART:
            case HEARTCONTAINER:
                uri = "mp3/heart.mp3";
                break;
            case SILVERKEY:
            case GOLDKEY:
            case REDKEY:
            case GREENKEY:
            case BLUEKEY:
                uri = "mp3/key.mp3";
                break;
            default:
                uri = "mp3/gold.mp3";    
        }                
        if(this.treasurePlayer){
            this.treasurePlayer.stop();
            this.treasurePlayer.dispose();
        }
        this.treasurePlayer = new Tone.Player(uri).toDestination();
        // play as soon as the buffer is loaded
        this.treasurePlayer.autostart = true;
               
    },
    lowHealth: function(start){
        if (start && !this.lowHealthPlayer){
            uri = "mp3/heart.mp3"; 
            this.lowHealthPlayer = new Tone.Player(uri).toDestination();
            this.lowHealthPlayer.volume = 20;
            // play as soon as the buffer is loaded
            this.lowHealthPlayer.loop = true;
            this.lowHealthPlayer.autostart = true;
        }
        if(!start && this.lowHealthPlayer){
            this.lowHealthPlayer.stop();
            this.lowHealthPlayer.dispose();
            this.lowHealthPlayer=null;
        }
    },
    whip: function(){
        if(this.whipPlayer){
            this.whipPlayer.stop();
            this.whipPlayer.dispose();
        }
        url = "";
        switch(Math.round((Math.random()*2) % 3)){
            case 0:
                url="mp3/whip1.mp3";
                break;
            case 1:
                url="mp3/whip2.mp3";
                break;
            case 2:
                url="mp3/whip3.mp3";
                break;
        }        
        this.whipPlayer = new Tone.Player(url).toDestination();
        // play as soon as the buffer is loaded
        this.whipPlayer.autostart = true;
    },
    playerdeath: function(){
        if(this.deathPlayer){
            this.deathPlayer.stop();
            this.deathPlayer.dispose();
        }
        this.deathPlayer = new Tone.Player("mp3/playerdeath.mp3").toDestination();
        // play as soon as the buffer is loaded
        this.deathPlayer.autostart = true;
    },
    spiderbite: function(spider){
        if(spider.bitePlayer && spider.bitePlayer.loaded){
            spider.bitePlayer.start();
        } else {
            spider.bitePlayer = new Tone.Player("mp3/spiderbite.mp3").toDestination();
            // play as soon as the buffer is loaded
            spider.bitePlayer.autostart = true;    
        }
    },
    spiderwalk: function(spider, walk){
        if(spider.walkPlayer && spider.walkPlayer.loaded){
            if (walk){
                spider.walkPlayer.start();
            } else {
                spider.walkPlayer.stop();
            }
        } else if(walk){
            spider.walkPlayer = new Tone.Player("mp3/spiderwalk.mp3").toDestination();
            // play as soon as the buffer is loaded
            spider.walkPlayer.loop = true;
            spider.walkPlayer.volume.value = -15;
            spider.walkPlayer.autostart = true;    
        }
    },
    spiderDeath: function(){
        if(this.spiderDeathPlayer && this.spiderDeathPlayer.loaded){
            this.spiderDeathPlayer.start();
        } else {
            this.spiderDeathPlayer = new Tone.Player("mp3/spiderdeath.mp3").toDestination();
            // play as soon as the buffer is loaded
            this.spiderDeathPlayer.autostart = true;    
        }
    },
    snakeBite: function(snake){
        if(snake.bitePlayer && snake.bitePlayer.loaded){
            snake.bitePlayer.start();
        } else {
            snake.bitePlayer = new Tone.Player("mp3/snakehiss.mp3").toDestination();
            // play as soon as the buffer is loaded
            
            snake.bitePlayer.volume.value = -10;
            snake.bitePlayer.autostart = true;    
        }
    },
    snakeDeath: function(){
        if(this.snakeDeathPlayer && this.snakeDeathPlayer.loaded){
            this.snakeDeathPlayer.start();
        } else {
            this.snakeDeathPlayer = new Tone.Player("mp3/snakedeath.mp3").toDestination();
            // play as soon as the buffer is loaded
            this.snakeDeathPlayer.autostart = true;    
        }
    },
    skeletonwalk: function(skeleton, walk){
        if(skeleton.walkPlayer && skeleton.walkPlayer.loaded){
            if (walk){
                skeleton.walkPlayer.start();
            } else {
                skeleton.walkPlayer.stop();
            }
        } else if(walk){
            skeleton.walkPlayer = new Tone.Player("mp3/skeletonwalk.mp3").toDestination();
            // play as soon as the buffer is loaded
            skeleton.walkPlayer.loop = true;
            skeleton.walkPlayer.volume.value = -20;
            skeleton.walkPlayer.autostart = true;    
        }
    },
    skeletonattack: function(skeleton){
        if(skeleton.attackPlayer && skeleton.attackPlayer.loaded){
            skeleton.attackPlayer.start();
        } else {
            skeleton.attackPlayer = new Tone.Player("mp3/skeletonattack.mp3").toDestination();
            // play as soon as the buffer is loaded
            skeleton.attackPlayer.autostart = true;    
            skeleton.attackPlayer.volume.value = -20; 
        }
    },
    skeletonDeath: function(){
        if(this.skeletonDeathPlayer && this.skeletonDeathPlayer.loaded){
            this.skeletonDeathPlayer.start();
        } else {
            this.skeletonDeathPlayer = new Tone.Player("mp3/skeletondeath.mp3").toDestination();
            // play as soon as the buffer is loaded
            this.skeletonDeathPlayer.autostart = true;   
        }
    },
    roomBarred: function(){
        if(this.roomPlayer){
            this.roomPlayer.stop();
            this.roomPlayer.dispose();
        } 
        this.roomPlayer = new Tone.Player("mp3/roombarred.mp3").toDestination();
        this.roomPlayer.autostart = true;    
    },
    roomOpened:function(){
        if(this.roomPlayer){
            this.roomPlayer.stop();
            this.roomPlayer.dispose();
        } 
        this.roomPlayer = new Tone.Player("mp3/roomopen.mp3").toDestination();
        this.roomPlayer.autostart = true;    
    },
    floorSpikes: function(spike){
        if(spike.spikesPlayer && spike.spikesPlayer.loaded){
            spike.spikesPlayer.start();
        }else{
            spike.spikesPlayer = new Tone.Player("mp3/floorspikes.mp3").toDestination();
            // play as soon as the buffer is loaded
            spike.spikesPlayer.volume.value = -10;
            spike.spikesPlayer.autostart = true;
        }
    }
}

music = {
    initalized: false,
    init: function(){
        Tone.start();
        this.initalized == true;
    },
    synths:[],
    play: function(url, loop){
        if (this.player) {
            this.player.stop();
            this.player.dispose();
        }
        this.player = new Tone.Player(url).toDestination();
        // play as soon as the buffer is loaded
        this.player.loop = loop;
        this.player.autostart = true;
        this.player.volume.value = -20;
    },
    fadeOut: function(callback){
        if(this.player){
            if( this.player.volume.value>-50){
                this.player.volume.value-=7;
                setTimeout(()=>{music.fadeOut(callback)}, 75);
            }else {
                
                this.player.stop();
                if(callback){
                    callback();
                }
            }
        } else if (callback){
            callback()
        }
    },
    explore: function(){
        this.fadeOut(()=>{
            this.play("mp3/exploration.mp3", true)
        })
    },
    exitLevel: function(){
        this.fadeOut(()=>{
            this.play("mp3/exitLevel.mp3", true)
        })
    },
    death: function(){
        this.fadeOut(()=>{
            this.play("mp3/death.mp3", true)
        })
    },
    start: function(){
        this.fadeOut(()=>{
            this.play("mp3/start.mp3", false)
        })
    }
}

//images
images = {
    adventurer: [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAD6CAYAAACPpxFEAAAgAElEQVR4Xu1dz88lxXXtYWMpMgiZSDCKogzRDNIssIhnYXljgWU2Xs4mG6Qgb/MPsBvY8Q9kaxGJTTYs2WABYmOxGDKCxUjMKHxWZA2IMBqB88Mbvuj2e7ff7XrVXVW3bnXd93GeFGf4uqq67znn3tPVP6ovDfgBASAABIAAEFAgcEnRJ9XlXDQIx1/blhp36+2IY2vE1/cHPsBHCwSgqwpUrQ3k/Le/+el4OGdffju8/8nZ7NB+9bMrw5Vnnhh+9+6n/Hfr/VdAMeuKOKyQtBkHfNjgaDUK+LBC0macbnxYF/ApEDYRiQ+ZB//2JmK9fxs6hgFxWCFpMw74sMHRahTwYYWkzTjd+LAu4LNApIlI86C/n5KBIA4blVeMAl1VgNegK/hoAGrFkN34sDSQoyBSgDg1EcSRIm7b7eBjW7xTewMfKYS23d6VDxjIMdldCTHUHuIwBNNgKPBhAKLhEODDAMwaA+GnF3iM81/+/IXpkK4+9X308O5/89j0948+vkP/nvrvN9QckwYSxLFHDXxo5LPYB7qCrkwFtR/Mla60xfo88kTVIA0kB7l9wRqb0tNb4skt7XHl7Fa2QRwCDfBRKp9l80B+HLCBri6urrSFeiq8Ehp+PDdlJCwofuSXx+hpIIhjZ+LyBz7UiY/8GIYBea7Wz1JHd7rSGggFOAZDv4UnrBbRixUqarx/b6TmmDSMIY6IcYAPjZRmfaAr6KpaRJEBXOmqtlhPb3GymXDAoanIWYYEJXjZsPZ4tIQhjj1y4EMroWg/6Aq6MhXUfjA3urIs2HJJgCE0FEYxfDtd3ERvAbRmTMShQa1dH/DRDlvNyOBDg1q7Pl35aGYgBXhZHkPBbhebzggpGBBxFIBV0BR8FIC1QVPwsQHIBbvoyodV0Ts/v/vOcOn6zYK4h0H0sTqOov3Hri8ijpFD8FGrpHl/5MeuNkBXF0xXVoSOCTIqJNNEgvZWx1FLD+JwmOjQla/CCz7ABxday8I9Ft8Pb38+vPTKa6uF3Kl58DEjjlobtu0PPmzxrB0NfNQiaNu/Kx+WBkKwjNfjPnj7zUUTCbZZ79+KGsRhhaTNOODDBkerUcCHFZI243Tjo0UBn4J58cZzM3jE7KTFfm2oOIyCOKwRrRsPfNThZ90bfFgjWjdeFz6sC3npEwHW+6+jIDCPgsEQRwFYiqbQlQK0hl3AR0NwFUN348Oy8GF1SwXzDbuAj4bgKoYGHwrQGnYBHwbgmhqIfHkw5030TkuXpGCblgqghogjBVfz7eCjOcRFOwAfRXA1b9yVDysDOZpCFbyJTghbHUctW4hjhyD4qFXSvD90BV3ZKmo3WnddWRSKmQMySpElSyYAabXerx8+Gu7eOxuXPHEyE0Ec4KNJksdOppAfLaDOGhN5bpjntQayeB2RlgIPf5Q00jzkqrydP2+LOO6dzZZzBx9ZxSjVCLqCrlIa0Wx3o6saAym6CUUFack8GMFORQtxBEkOPjQ5fdQHuoKuTIQUDOJKV5sYSI55EEjeDQRxtMgHfeEFH+CjAIHswgtd5aPa3EByyfBuIIgjX1SVLbMSHXxUopzfHXwsYOX5hHer/DAxELrfEXvcNScI2bc3IYhjGL9Lz1yCj/wqG2k5FV7oCrqqUtK8sytdmRgIFZrwM7U55sGzDu7bu2Ahjt1lRPBhku5TokNX0JWJonaDuNKViYH84d63wy+uPTFhlGse1EH27W0giAN8tEh06Aq6uqi6MjOQy4/v3touMQ+a2j/4bpjMx4OBIA7wYZTs05kiGQh0BV1dRF2ZGsjaex4x8LwaCOLYzSa9GDr4AB8GxffI0KGrel2ZGMi+0CTf85Ai4BcNPc1AEMfgakYIPsCHgXHwELN7B/TH1HtpqFdp9KsNhG8QkiHw8gzhDfWl2Qf93YuBII7dygHgI500mS3GggVdQVeZeslt5kpXVQbCEVOisIHwuj+pVWxX1gKqOaZcEmS7aUEyxBGFD3xoVCUWuoOuoCudhKK9XNWrmuIwfov30vWb44KI9FtbIG4BQNr/CAiP1WElWMRxIAd82GU6dAVd2anpMJIrXVUZCH/fXJ5hXb56Y3j62edXgfvqi8+GB/dvU5uxYIkVeflvLYBfGvMccYCPBoKDrpDnDWQ1uNJVjYGMEwf6HzkD0RgIXyvuMPtgghGHMHTwYZb30BV0ZSYmMZAbXdUayGQiHJzGQJx8E2T2cRbEcdZjNhi9N0V/BB/gw6gSI8+Pr/yofUDdcYXM8xdefnXafOe9t46Sn/4mZhvTUwUdZyCxcBCHny8Tjicq0JWbL0WCj3c/7X2CFdasLvnhwkCczECqCUEcRueI8WGKEwR8gI8MBKCrihNFFwbi4Jo7ZiAHEWFGmFF1KpoUFyzkRwXa6a7g49QN5Pq1K+P30U/9EhbiSGdrRYviRAcfFWinu4KPisKbhre4RRc+XMxAaEmBjz6+c/IGgjiKRV/SoThBwEcJvMVtwceJG4hFflgayOt7Cd7KvNn5Brd3dqaIOHzNCMEH+Ch2t4wO0JWBriwMhIlgzkoNhPrdcnD5CnEcsg58ZFSgzCbQFXSVKZWiZi50VWMgYQCTgWTCwDOQsPnSuJnDFjdDHDvIwEexdFY7QFfQla2idqO50lULA+EZBYM3XaoSaC4VqzWAWpCR2h+diSOOVsjHx107gQAfywWkFUvgY/nkKlU/WnDiio8aA7GaOWw940iRqj0ebb/U8Wi3a49H2097nKl+2uPR9ksdj3a79ni0/bTHmeqnPR5tv9TxaLdrj0fbT3ucqX7a49H2mx2PpYGkAsV2IAAEgAAQuEAItDAQudZMOP7aNm+wIg5fjIAP8NECAeiqAlVrA5k+Gym/UMjHR0tL0Iem+FOlDp68WoIOcVSIqkFX8NEA1IohwUcFeA26duOjmYEQSPzdcwZMfqVwbyLW+7fiZiIEcVhBWjUO+KiCz7wz+DCHtGrAbnxYF/BZILL4hp+4PSUDQRxV4rboDF1ZoGg3Bviww9JipG58WBrIURApZJyaCOJIEbftdvCxLd6pvYGPFELbbu/KBwzkmOyuhBhqD3EYgmkwFPgwANFwCPBhAGaNgfDTCzzGOS3Oxb+rT30fPbz73zw2/T1YQDEczyC8rCEQxx4m8JGll9xG0BV0lauVknaudKU1kPPIE1WDNJAcRPYFa2xK3zwQT25pjytnt7IN4hBogI9S+Sy2h66gKzMxiYHc6UpbqKdAJEr8eG7KSLhQkWnIX08DQRw7EwcfJnmP/BgG/kQDdGUiqXEQd7rSGsgUDP1j4QmrRdhihYoav/9Jl49KjaQgjgNd/Pg1+KjKfOgqckKCPK/SlLu6W2MgYzAMBxdh/u/QVPjv4bsh+yLFm2uPR8sO4tgjBz60Eor2g66gK1NB7QdzoyvLgi2XBBhCQ2EUgwJFf7Y8BguyEIcFinZjgA87LC1GAh8WKNqN0ZUPy+I9C6QAH8tjKNjtYlPEYYGi3Rjgww5Li5HAhwWKdmN05cOqeJ+f331nuHT9ZhEsoo/VcRTtP9IYcew4BB+1Spr3h66gK1tF7UbrriurQjEGMlaeTBMJ2lsdRy1JiMNhokNXvgwdfIAPLrSWhXssvh/e/nx46ZXXVgu5U/PgY0YctTZs2x982OJZOxr4qEXQtn9XPiwNZJxS0f988PabiyYSbLPevxU1iMMKSZtxwIcNjlajgA8rJG3G6cZHiwI+BfPijedm8IjZSYv92lBxGAVxWCNaNx74qMPPujf4sEa0brwufFgX8tInAqz3X0dBYB4FgyGOArAUTaErBWgNu4CPhuAqhu7Gh2Xhw+qWCuYbdgEfDcFVDA0+FKA17AI+DMA1NRD58mDOm+idlspIwTYtQUENEUcKrubbwUdziIt2AD6K4GreuCsfVgZyNIUqeBOdELY6jlq2EMcOQfBRq6R5f+gKurJV1G607rqyKBQzB2SUIkuWTADSar1fP3w03L13Ni554mQmgjjAR5Mkj51MIT9aQJ01JvLcMM9rDWTxOmK4aCJRS0kjzUOuytv587aI497ZbNlt8JFVjFKNoCvoKqURzXY3uqoxkKKbUFSQlsyDEexUtBBHkOTgQ5PTR32gK+jKREjBIK50tYmB5JgHgeTdQBBHi3zQF17wAT4KEMguvNBVPqrNDSSXDO8GgjjyRVXZMivRwUclyvndwccCVp5PeLfKDxMDofsdscddc4KQfXsTgjiG8bv0zCX4yK+ykZZT4YWuoKsqJc07u9KViYFQoQk/U5tjHjzr4L69Cxbi2F1GBB8m6T4lOnQFXZkoajeIK12ZGMgf7n07/OLaExNGueZBHWTf3gZyEeKgs90H3w3gQ2gSuqoqX1PBugj5EdYcPolNPeDDCBIGlx/fvWAMXdW9MDYTlgQ1l4yw2Hkg5JTj4PcNyEBOOQ6eAYXJCl19SnWs5qRP4yTI8z1qXK8ot+jX6f01V3zUiPEokLX3PGLK9WIgYeFFHLvZZC9Dvyh8hEZ4qrqyisNb4dXygTgO1dzEQPaFJvmehzQRftFQXm7pXbD47eDcM12KB3FoTmpX+0xvCp86H8G9pJPND6s4vBRerlekQs51eQl+6WSX/s6zew8zkNq6a8FHtYHwDUIqpJzw4Q31FCFMXi8D4eOj49bGQbH3vvks45BJUsKHtzhOmQ/C/SLkh9S1zJFSXQV1oKb2aM5aojefWV+pWPhEMbIETfc4cmOQJ7xWcdQEPy3kJUXFlx9Sq9iurAVUc0wqYdEndulb7jVxXL92Zbpx3csI+WuPXLgIjFI+KA5ao0z8wIdGVWKhuxpdRXa9OR9LBkLaKsnzzp+yni08yDGliu+KcTA1P2g+aoIfv8VLhZeL1NoCcQs5SPsfieWxetwk5MJrEUfHwjvCyKah4IK6gg+dWcR6XZj8kMEpc2TSVcf8GPkYRS5qlrgUlcP8GEfnBWBnRtibjyoDkWe87OSXr94Ynn72+VUyvvris+HB/dtTwRKE8N9yyLRsM5IizxQ1cXQ+w2I8xqk6X8LKiYM63nnvLfBhqahhOL8g+TErvDJHXnj51aI8F7qsqTtalo7ioIG4bq3FEtYrb3HkxECxtoijlsjpjJedPKdgtQhEqyrRb3bzVhOHAyMcZyHyOHLiCA1EGlCHGeFkhPLsKicOrycmtXH0LlhkhPR76ZXXZlcbSg2k95l7LA6uWyUG4jEOuuLQg49aAxkLlizelYlucTxaL6mOo3OiT4W3lA8x+wgNCHxo1XToV62rzgXrKMfpD5o8d5Af0W+HlxZej3H04qNFgTiXhFBxCoMLC5YDQmJlYhYHn91ybMHZrqfCG8ZSHAf4qHeNlREuTH7IvM7JcwdGGM3z0jjEgyYt6qdWfOelcVjw0QKA4gSxCESLem6is2EQSfwT93FGAzmlwrsWB/hooCYxIyk9wfLKR6ihUz1RLI2D3h356OM7xGiL+qkV32ggsjZtwUcLAIoNBIVXq5msftEZCIwwC7sWjS5MfpQWLM9n7iWFF3Ec0sKFgXglRJ4phpewCMJTvhS3ZiDgo4VvTGMWG8gp8JFzCesCnLm/vmfx1jAMbwzDwP/dVDCZgxfryoIPFwZiEUgmyCXNVu8dxAzEUaJLYd+KGeGagYCPEpkUt+2S6MVHme5QHIej/JDRlVz6CQ3jpA3Egg9LA5ncOfMaLzk4/W5ZBJLW+2qLmBCihTeMbX8mMsbhpPCGscTiIOzpLIp/zAX4qBTSSvdTzg8ZljaOUVtOztyPckTmwuWrN27Jd9n2VxpkjnBzDwbSlQ8LA1ktWCtT21nR6nxDKtdAvBdeEnaugayVSkp0C21oy/EPho8TyY+lgjk7CTmhwrta+E84js35qCkSSyTIINYKSMzRYwVQW4RK+iUL1spZiNwPn2G5iiMCxBL2Mcx6nGVdBD4uSn6U8D+b7To8c8+NJVbDOGdoDP6/khpj1TY3hnHGt3LFJDarLD7GFgbCU9Xw8sjSJZPwoEsAKg54oUO0YJ1g4Y2dKa4lQw5+4CMHpeM2a7jFcsFrfpTwf2EK70rul+ChU856r5L9N+ejxkCsCn8JIC0IWYsjN6l5xtHzzMQqDpMzE0OipD4uCh8l8HjIj5JjWOKoZIwSfHLblu7faxylVzeaxmFpILlEnmo7ry8KluKJOEoRa9sefLTFt3R08FGAWAsDkevNhOOvbSs47E2ahsc6W+VWHEELDC0DRByWaNaPBT7qMbQcAXxUoGld/KavfskvyfHx8QdoxNfyrPdfAcWsK+KwQtJmHPBhg6PVKODDCkmbcbrxYV3Ap0AIF/6aF2Mkv17W6at9uXQhjlyktmkHPrbBOXcv4CMXqW3adeOjqYFIEwk/fXlKBoI4tsmClb3MEgR8gA8jBKCrSiAtDeSIjNSxOTURxJEibtvt4GNbvFN7Ax8phLbd3pUPGMgx2V0JMdQe4jAE02Ao8GEAouEQ4MMAzBoD4acXeIxzWguKf1ef+j56ePe/eWz6e7CmfjieQXhZQyCOPUzgI0svuY2gK+gqVysl7VzpSmsg43e36b6GeKJqkAaSg8i+YI1N6Zsg4skt7XHl7Fa2QRwCDfBRKp/F9tAVdGUmJjGQO11pC/UUiESJzSRlJFyoyDTkr6eBII6diYMPk7xHfgwDf7UPujKR1DiIO11pDWQKhv6x8ITVImyxQkWN3//kjP5fzTFpqBpJQRwH6Pjxa/ChkdPUB7qKnJAgz6s05a7u1hbr6S1OLsIMT2gq/Pfw3ZB9keLNtcejZQdx7JEDH1oJRftBV9CVqaD2g7nRlWXBlksCDKGhMIpBgeox40gRijhSCG27HXxsi3dqb+AjhdC227vy0cxACjCUxzADo8PlrHGKWHDssqkllspDmHVDHBYo2o0BPuywtBgJfBigaFX0zs/vvjNcun6z6JBEHzqOkVCauXS8jGIRRxEGjRojjp0WrfRdSxP4AB+1Gor1764rqwQbAxkzNtNEgvaTgdANdnqaKzCXFuAvElIZx1bHurYfCz4Qhx0C4MOhgSDP60+wrAxkvPRDRf/D258PL73y2mrqRcxjunTEBvLB22/yOJbHmFMSauPI2ccWbRDHFijn7wN85GO1RUvwYYCydXEeL0OJ4n90iMG2o++FsIHsO1ofXy5kpXF4ulwiY0QcuYxv0w58bINz7l7ARy5SC+1aFOiJlBdvPDfbrZidLO03/GhTi+PLhSwZh3yfxenCkNPMjox7iQ/EkSsJk3bQlQmMZoOAjwoorQt06ZMNXmcgDGkynlMqvms6QRwVWVTeFboqx6xlD/ChRNfSQCxWt3Q1AwnfmA8xplnHCRTeJC+IQ5k9um7gQ4dbq17gowJZUwORLw/G3kRfeAt9Ws2X4nByD2S89LO0xEmw1Mf00qRYXNIS1wp6x66Iw8/jvODj3U8JA+RHbVYf9++S51ZEat+GnGBg4xAGYnVspVQdTWfDt+rDt+mdzkIQxzDwatG9tCS1Bz7AR2ktymnfVVcWiTU5H0cbWa5k3MQvCdJqvV8/fDTcvXc2/o1nK3QpRbxIaHFsOQQc3e9IGQZ1kDE4M5DFdXJivCCOEomo2oIPsaiig4dNwIchHzVFeiRi6T5BeLmK2lIBWypYtJ2vxXcQ2ep1UBnLWgwdlqMPKxriEMkBPlSGF+sEXUFXUTFpDSR54yncG5nCmnmwgXSYgRTFshRH5yXQx2vrqZv+khPEYVZclwYCH/fOphNM5IeZ3lzpSmMgRQGwMaTMg88WN74HUhQLiq5ZEqDoCgSgK+gqEwF39UplIPK+RSrwnJmHuNSw5T2QGRnhJbfYU2Rrid7p40tHMw/EMfT4NLJMA+hqf3+TZ8SdLyWCj4Z8qA2EM4YKLQmkpODKbAvEJd8D0Rxbys+mG+ZS3LITGUHs8V3v5hF7RBpx5MrBrN1UrMDH7vPIXswDfLThQ1ukZ08yUNENr78Xzjymd0E2uAcyJvnKlxHHlYHD4rsUT4cb/jMTRBy7p/lYf+Cj2gyRH+IpUehqXU9aA5lN2ek/wkdZc+55UL/g0k/LGcjsqTF52WwfjMRiZiBrZtihYCGOlQcywIfaQKAr6KpYPBYGMl6H5/siOTMPntrGDKTRDGT2PYaMfUwG4uyxXcSx8ih4h8sl4AN8FBfdjA4noytTA0m958HAhe9ViKUNxsLd4Ib0tPY/HcP+eyWLKwJTm9hLj+Flul4Fi1Y1RhzHl03BR0ZpijdBfkQuW8l61aAmrZF1MnyYGQihkbps1dFAxllSxkeqjpYFuH7tyuwaexjDxsJCHOBD7RKJjsgPcS8NeZ4nMwsDmW668VIZay+0pRZUbDQDmW48ryzkFn3cb+mprM4vRpHRrX5TJZYAsaeyEEdeoqSKL/gYZk9iQlc/DF2ZG8jSCrbyvoe490H/PLp53eGsfjyzl8YnEyCMKXED3kQ5FYMgDmervUJXvlbfBR92fJgYCBfYpUUUV4rh0QelGs9AVq87xt4NWYrphZdfHb764rPhwf3boQlW1H6TrtF3ERCHCbaaQcCHU0OP3Is94hd5vi55EwPh9yqoSF2+emN4+tnnV/e6Unhb3UTPSfzFRCcRxX6nZiCII0cG5m2gqxMxEORHufZNDETOQE7ZQAi+2FLupyYsxGE3RS9PqaMe44MZ0JUBkjZDgA9DQzcxEMnrCRsIhzF7EmvJPKix0xkI4jBMEJuaNY4CXRmCaTAU+DAA0cJAwsM4l0X3zntvzS5rJYpuz0tYlnEYUGM2RA0fZgdhMBDiMADRcAjwYQimwVBd+NjMQJ689M2I0aPzp9ZuPLs3kMw4DPRgNkRUWIjDDN/SgcBHKWJt24OPCnw3MxB5jCtPLp3Ty4gffXyHmrc4thKoosLKjKNkP63bIo7WCJeNDz7K8GrdGnxUIGxRpF8P9n8rvIRF2+neCP325vHGvk/Yt6eBWMZRQUl1V8QxDCEG1aBWDAA+wEeFfBa7utBVjYEsJWnUQNhU6J7IMAxsIPRvHof+/y0xA6E2WxQC6zhaiCVnTMQR11UOdi3agA/wceF1pTWQtcIeNRCBpDSPEOAtDCTXlErjyB3XSlS5+0McVoivjwM+5viEeZ6LjxVbuftDflQg3sRAIsezZhqy+a3AaHJFkIJAM448Fh5/LQ7NPlLHHW7X7ANxlKKc3x58rJuG3KrBKp+JXUvNPpAfpSiL9t4MhA6NCLW+fNVaWJrxNbRp9lOSIJrxEUcZAuCjDK+S1hr9go8ShIO2WgNJnRmHM4mSswMSgUYIFTBMXY9uTAUzopI4LI5HOwbi0CLXph/4aIOrdlTwoUWukYGkpqq9DKEGptgxI44aROv6go86/Kx7gw9rROvG68KH1QykLnT0BgJAAAgAgZNDAAZycpThgIEAEAACPhCAgfjgAUcBBIAAEDg5BMwN5Ndi1dHfB8uRrG3zhtwNEcftII61bd7iAB++GAEf4KMFAr3qlamBUHL8w7WnR3we/fkvwxcPHs2wevbyk8OTP/7R8O/3vhr/HhpMC2A1YxIZJXGEBqPZZ4s+4KMFqvoxwYceuxY9wUc9qs0MhA+NjIR+ZBzyRyZyCgaSE8cpGEhOHOCjPqHWRpAFC3y0xTpndPCRg9J6m+YGsrT7UzOQtThOyUDAR33SaEeIFSzwoUWzvh/4qMfQzEBKyODD9mgi8vJVLrwUhzcTAR/dPwcwkw/4AB+59aSkXe96BQMJ2OpNSIl4Si+XpMaGoacQ0m+HgcBA9OpZ7tm7XqkNhJ8m4evm9N9/9zfPTJH+5K9mnxye/v7wfw67/OOfvpzug4TjtQA7NiY/vcAzCPpvTRyyP+1n6xkJ+JjrCnzYZBDyA/VqTUkqA6FiFT5RRTuRhTdHvmQg/KOnnvjJra1u5lJytIxjKxMBH3O1LekKfORk5aEN8iNPVz/kelVtIBJifjw3ZSSc4PyoLI/R00BaxNGjYLWIo0eCtIgDfOgNBHwMA+rVsX5UBkLD8Fkv/Tt8RLdMprt3RuhH741sVaz4GPksyzqOrYoVxwE+jlUndQU+SrNy1x75sa6rH3q9UhsImwjDS5eCND/5suHWZEgTsYxj62IlTcQyDvChUfShj3zrHPlxeKkY+VGnK/nWuYWuavioMhAJg0yWEnh6FamlY5TklMRRQ0LJfnLbgg9/T/3kcifbIT80qKX7ID9s8gMGEmgNBmIjrHQK57UAH+AjTyllrWAgNroyMRAi49Y//+Pwxr/8WxGL3MfLWRYVq5o4vMxCwMdOi+CjKB2TjZEfO12hXh2kYmogNGyuiVCh5vbeCNHG4a1gaeMAH8laWtSADR182Jz1FoEfaQw+dnXaol6ZGAhxxKScPfhm+Nd3fr/KsUfz4APms6zSOCzIqE0M2R98+ChWzAn4AB+W+e2lXpkZCJtICUheznTDYy697u7NPGTRAh8lCLRtW3rdHfkBPnIQ6FmvzAwEa/34O8MKX3xKiRFrYaUQ0m9HfiA/9OpZ7nmya2GFIckX2Wjb0suF/HIXtenx4mCKRPniVEkc3mYh4MNfwZLP7CM/UpnYdjvywyY/qmcgS9PypRdcwq8Uskx6T9eXpoGlcfQ2EvAxLzzgw6YQIz/mOKJe7fCoMhCelstZBcO8ZBS0ndbK+u///b/hvx4+GuRihr1I4WmgVRy9ihb4iOsKfNSZCPID9WpJQWoDSV3TXSrG0jzCa/Q9rsGnriFq49i6aIGPQ5LHdAU+dCaC/FjX1dYnvd74aGYgoVzJHNbMg9p7NBBtHN4KljYObwmijQN8tDEQ8FF3FaeUlZSBbM3HJgaSYx6nYCAlcXguWCVxeDaQkjjAR2mp2rUvKVjgQ4dxSS9vfDQ3kFxReTeQ0ji8FqzSOLwaSGkc4KOkTB3a5hYs8KHDt7SXNz5MDOQ/v/nL8LdP/egIixxRyb69L2FZxtGzYFnG0dNALOMAH6Wl6ngGAj6GAfVqrqMqA+EnqFo91LMAAAujSURBVGLCyjEPOhTuu/XXCBkG+dlOyzh6FCzwcRB3qCvwoTeQFroCHxeDj2oDIRi++8swm4HkmgcbyOP7yUuPFwvli4OWcfRKEPCxS0wyEKkr8FFXsKx1BT4uBh8mBkKFX77PkXraiqGjWQcVbS8GYhlHzwSxjKPHJSx+edMyDvBRX7DAB+pVqKIqA5GDUdKTwHLNg/ryZSs5To+C1SKOHgWrRRzgQ1d4wxUBkB+HT9oSosgPna7CFQGsdKXlo8pA/unmr0cUePn2UvOgvvzGOo1F4/QoWC3i0BKik9VuOf0WcYAPHSPgY4cbv4gb5jnyQ6crMpAWea7lQ20gFD6fZdGbv3I2kbMKrBQWu+jWxYopZFe3ikNLhk5Sh17gY16wWFfgo05ZyI+4rlCvKtfCYhORhZevX6dWG5VrZVH/Ho/wyrSS6/3wtV7aromjV8ECH4cZLWHBugIfdQZCvZEfh0twqFcHPVXNQLhgyZueJVIlB+dllXs8gRUaiDYOKlD8NBfF0btgaeMAHyXqzWsrlw1fW2A0Nhr4yMO4pBX42N1/sqpXJgYiZyA//snl4cdPPr3K6Z8ffTX8+eGD8X4HLwLobQZSEgcT4vGMtyQO8FFSivLayhWSyUDAx1fdT7BQr3YGYlGvTAxEnvFqEqT3PRCeomvjsHT0vLK03Co8wwIfvmaE4AN81Oa4p3plYiASEE2CeLmmqI3D2wxEG4e3GYg2DvBhUaLmY4SPj5bkOfi4uHxUG0gIDZ0BP/P3L4x/5ktVJDb68aWtL//jzvS4LrX/6588OX5cqtdTDTF6KWFy4uD7HdSe4+h5DwR87JbXBh/2RSu8Z4j82HYp9zVGe9WrJgbChjGayMMH43Vf+eP7H/Q3MhB6f+SPf/rSnYHkxCENhOPwZiA5cbB5g4+2hZfwBR9+Ci/4+LLqnpQLA/E6A8lJ9FOYgeTEIQ0EfLQzEU3BAh/gI4UAzUBy8ty6XlkZyOsc4K+H4RZPbelvdLkqvF66v4T1huzz+2Gg/57GSQHWaPu0/xuZcdzeHff4oz77/3YTB/jwpSvwAT4Ma1f3elVrIEeFUpMgAaA9iu/RPjUG4jEO8DGx4kJX4AN8GBiIm3rVxEByANrPOGJNXSQ6GUhOHHIG4tVAcuIAHzkoFbeJnmDljAI+clAqbgM+xBUTi3pVayB8DDNi6CyLN3AixP62QH8PA4nGIU2EjSL2N+9xgI+RITe6Ah/go9j64h1mmu5Rr6wMRIaXm6jcTrbP7WuE/+owuceCOLZgI98AwAf4KEEAeZ6fW0e4tjCQEvLQFggAASAABE4UARjIiRKHwwYCQAAI9EYABtKbAewfCAABIHCiCLQwkHOBRTj+2jZvECIOX4yAD/DRAgHoqgJVawM5/+1vfjoeztmX3w7vf3I2O7Rf/ezKcOWZJ4bfvfsp/916/xVQzLoiDiskbcYBHzY4Wo0CPqyQtBmnGx/WBXwKhE1E4kPmwb+9iVjv34aOYUAcVkjajAM+bHC0GgV8WCFpM043PqwL+CwQaSLSPOjvp2QgiMNG5RWjQFcV4DXoCj4agFoxZDc+LA3kKIgUIE5NBHGkiNt2O/jYFu/U3sBHCqFtt3flAwZyTHZXQgy1hzgMwTQYCnwYgGg4BPgwALPGQPjpBR7j/Jc/331Iin5Xn/o+enj3v3ls+vtHH9+hf0/99xtqjkkDCeLYowY+NPJZ7ANdQVemgtoP5kpX2mJ9HnmiapAGkoPcvmCNTenpLfHklva4cnYr2yAOgQb4KJXPsnkgPw7YQFcXV1faQj0VXgkNP56bMhIWFD/yy2P0NBDEsTNx+QMf6sRHfgzDgDxX62epoztdaQ2EAhyDod/CE1aL6MUKFTXevzdSc0waxhBHxDjAh0ZKsz7QFXRVLaLIAK50VVusp7c42Uw44NBU5CxDghK8bFh7PFrCEMceOfChlVC0H3QFXZkKaj+YG11ZFmy5JMAQGgqjGL6dLm6itwBaMybi0KDWrg/4aIetZmTwoUGtXZ+ufDQzkAK8LI+hYLeLTWeEFAyIOArAKmgKPgrA2qAp+NgA5IJddOXDquidn999Z7h0/WZB3MMg+lgdR9H+Y9cXEcfIIfioVdK8P/JjVxugqwumKytCxwQZFZJpIkF7q+OopQdxOEx06MpX4QUf4IMLrWXhHovvh7c/H1565bXVQu7UPPiYEUetDdv2Bx+2eNaOBj5qEbTt35UPSwMhWMbrcR+8/eaiiQTbrPdvRQ3isELSZhzwYYOj1SjgwwpJm3G68dGigE/BvHjjuRk8YnbSYr82VBxGQRzWiNaNBz7q8LPuDT6sEa0brwsf1oW89IkA6/3XURCYR8FgiKMALEVT6EoBWsMu4KMhuIqhu/FhWfiwuqWC+YZdwEdDcBVDgw8FaA27gA8DcE0NRL48mPMmeqelS1KwTUsFUEPEkYKr+Xbw0Rzioh2AjyK4mjfuyoeVgRxNoQreRCeErY6jli3EsUMQfNQqad4fuoKubBW1G627riwKxcwBGaXIkiUTgLRa79cPHw13752NS544mYkgDvDRJMljJ1PIjxZQZ42JPDfM81oDWbyOSEuBhz9KGmkeclXezp+3RRz3zmbLuYOPrGKUagRdQVcpjWi2u9FVjYEU3YSigrRkHoxgp6KFOIIkBx+anD7qA11BVyZCCgZxpatNDCTHPAgk7waCOFrkg77wgg/wUYBAduGFrvJRbW4guWR4NxDEkS+qypZZiQ4+KlHO7w4+FrDyfMK7VX6YGAjd74g97poThOzbmxDEMYzfpWcuwUd+lY20nAovdAVdVSlp3tmVrkwMhApN+JnaHPPgWQf37V2wEMfuMiL4MEn3KdGhK+jKRFG7QVzpysRA/nDv2+EX156YMMo1D+og+/Y2EMQBPlokOnQFXV1UXZkZyOXHd29tl5gHTe0ffDdM5uPBQBAH+DBK9ulMkQwEuoKuLqKuTA1k7T2PGHheDQRx7GaTXgwdfIAPg+J7ZOjQVb2uTAxkX2iS73lIEfCLhp5mIIhjcDUjBB/gw8A4eIjZvQP6Y+q9NNSrNPrVBsI3CMkQeHmG8Ib60uyD/u7FQBDHbuUA8JFOmswWY8GCrqCrTL3kNnOlqyoD4YgpUdhAeN2f1Cq2K2sB1RxTLgmy3bQgGeKIwgc+NKoSC91BV9CVTkLRXq7qVU1xGL/Fe+n6zXFBRPqtLRC3ACDtfwSEx+qwEiziOJADPuwyHbqCruzUdBjJla6qDIS/by7PsC5fvTE8/ezzq8B99cVnw4P7t6nNWLDEirz8txbAL415jjjARwPBQVfI8wayGlzpqsZAxokD/Y+cgWgMhK8Vd5h9MMGIQxg6+DDLe+gKujITkxjIja5qDWQyEQ5OYyBOvgky+zgL4jjrMRuM3puiP4IP8GFUiZHnx1d+1D6g7rhC5vkLL786bb7z3ltHyU9/E7ON6amCjjOQWDiIw8+XCccTFejKzZciwce7n/Y+wQprVpf8cGEgTmYg1YQgDqNzxPgwxQkCPsBHBgLQVcWJogsDcXDNHTOQg4gwI8yoOhVNigsW8qMC7XRX8HHqBnL92pXx++infgkLcaSztaJFcaKDjwq0013BR0XhTcNb3KILHy5mILSkwEcf3zl5A0EcxaIv6VCcIOCjBN7ituDjxA3EIj8sDeT1vQRvZd7sfIPbOztTRBy+ZoTgA3wUu1tGB+jKQFcWBsJEMGelBkL9bjm4fIU4DlkHPjIqUGYT6Aq6ypRKUTMXuqoxkDCAyUAyYeAZSNh8adzMYYubIY4dZOCjWDqrHaAr6MpWUbvRXOmqhYHwjILBmy5VCTSXitUaQC3ISO2PzsQRRyvk4+OunUCAj+UC0ool8LF8cpWqHy04ccVHjYFYzRy2nnGkSNUej7Zf6ni027XHo+2nPc5UP+3xaPuljke7XXs82n7a40z10x6Ptl/qeLTbtcej7ac9zlQ/7fFo+82O5/8BXiVRje3ALToAAAAASUVORK5CYII="
        , "data:image/png;base64,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"
        , "data:image/png;base64,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"
        , "data:image/png;base64,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"
    ],
    caveSpider: [
        "data:image/png;base64,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"
        , "data:image/png;base64,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"
        , "data:image/png;base64,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"
        , "data:image/png;base64,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"
    ],
    swordSkeleton: [
        "data:image/png;base64,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",
        "data:image/png;base64,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",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAAF3CAYAAAB5dDWiAAAgAElEQVR4Xu2db8wtx33X9yLxDhSVForTBBWTOEVFoSXudaWq5LGTJjc2Qe0rkLDaSxXzwm7Um8IbbpM8z03Sy4tCcytjv8BWMMgI+gpE8eXGJM4TUERsHFoiKiV2GoryD6lpqxAikCo4aOY5s8/s7Ozud8+zZ2fmzOdI9r337G/3zH7mOzPf/e3s7KWGDwQgAAEIQAACEIDAogQuLXo0DgYBCEAAAhCAAAQg0GCwEAEEIAABCEAAAhBYmAAGa2GgHA4CEIAABCAAAQhgsNAABCAAAQhAAAIQWJgABmthoBwOAhCAAAQgAAEIYLDQAAQgAAEIQAACEFiYAAZrYaAcDgIQgAAEIAABCGCw0AAEIAABCEAAAhBYmAAGa2GgHA4CEIAABCAAAQhgsNAABCAAAQhAAAIQWJgABmthoBwOAhCAAAQgAAEIYLDQAAQgAAEIQAACEFiYAAZrYaAcDgIQgAAEIAABCGCw0AAEIAABCEAAAhBYmAAGa2GgHA4CEIAABCAAAQhgsNAABCAAAQhAAAIQWJgABmthoBwOAhCAAAQgAAEIYLDQAAQgAAEIQAACEFiYAAZrYaAcDgIQgAAEIAABCGCw0AAEIAABCEAAAhBYmEBOBmszcG45lXFh/DsfDlY6OljBSiegR6IrWOkE9Eh0dUCscjEvm6+88qLF+syTN5qrjx63iF9/z33m77mUU6/6/UXCSmcLK1jpBPRIdAUrnYAeia4OjFUOxqUnKkzWoMpgdYEGiK7QlS4fWMFqAQL6IejbD5BVaoPVimqKLZmsBlZTIjnfDitY6QT0SHQFK52AHomuDpQVBkuv2NSRNEK9BmAFK52AHomuYKUT0CPR1YGyysJgmVs3H7h1u3npzhPNXXffa1F/48svN5evPNZ8+NqDdk4WGayzDBaspJYIKwmTDYIVrHQCeiS6gpVOQI8sSldZGKytebKI3WT38DsM1tlACCupJcJKwnRusNCVBAxdSZjQlY4JVofMKguDFWarDPAwU4PBOjNYsJKaI6wkTOedO7qSgKErCRO60jHB6pBZZWGwfMDGWJmPv1SD+TcGqz/JHVaDTbM3pwFWsJrZkcfC0ZUOEVaw0gnokUXpKrnBMnOszOedVx6y86/crQqXrfn4nefsdjNHq/L1sDawklshrGRUDaxgpRPQI9EVrHQCemRRukptsAxW60iPrz3S3Lj1VAez+47sVYsFVjMaIrqSYaErGRX9lY4KVrCaQUAPLaa/ysZgGRPlJrg7zu47DFbXYMFKaonthGR0NckLVpOIaIM6IljBagcC+i7F9FdZGCy3PIP/JJNh7U/qrvz2oJPeBlZyK4SVjKqBFax0AnokuoKVTkCPLEZXORgse5vQXwPLcXZPNmGuOsqD1Q4N0d8FXUUBoit0pRPQI9EVrHQCemQRusrGYBmusYVGt7xzKade/fuLtG9bh5UEGFYSJhsEK1jpBPRIdAUrnYAeWYSuUhoXC8h8YouLjnyfssx69S8bCSudJ6xgpRPQI9EVrHQCeiS6OmBWqcxKO0nNLT3gGLv1r9y6Re57s0yDt5J5qnLrUlguElY6S1jBSiegR6IrWOkE9Eh0deCsUhiVdqGw2NNwQ7z92IqeKoTVzAZowtHVJDR0NYmoDYAVrHQCeiS6qoBVMoPlv5rD5zyWwQqeoEtRdl0Sy0T2Xs0Bq0GwsNI1BytY6QT0SHQFK52AHlmsrlKYlA6scI2isQxW7QYLVqMtEl3t2GGhK3SlSwdWsFqIgH6YYvv25AZrzhys2g0WrPTOHVaw0vtvWMFqIQL6YYrNyuinuFhksaySGyyunvXOHVawWqjLKvaKcKHzn3MYWOm0YAUrnYAeWayukhksw9at3O5nG2JzsLYveg6Xc0hRdl0Sy0R2JkKaQ8JqECysdM3BClY6AT0SXcFKJ6BHFqurFCalXfdju0J7C883XX62JnyFzrZeUpRdl8QykbDSOcIKVjoBPRJdwUonoEeiqwpYrW1SQidqfn/jsjJurStntPzvzXfBgqRrl12XwzKRsNI5wgpWOgE9El3BSiegR6KrSlitbVLahdW8LFTnu5ipchmsyia5w2pmI/Qynda4ewvTtrdW/dvN6MoChtWwzmiDtEGdgB6JriphtbrBMlyvX7/e3Lx5s+3cXXYqvBXoD5AmpjaDBSu5Fdp0O7qSeMFKwmSDYAUrnYAeia4qYZXaYLW3/aZ4R+ZhrV32qSIuvT1shLAayTQEBgtWsFqiPdIGdYqwgpVOQI8sWldrmxR/Yp9F7M+rCpchCF+PU9scrFCDsBpslehqZoflh6MrdKXLB1awWoCAfoii+/bVDZa5zWc+l688Zv6w8z+c0YoZKj9zFdlXr6byIjewkisNVjKqBlaw0gnokegKVjoBPbJoXa1tsAzW8PFU+525inbvJzRfDMy3cvumKLcuieUiYaWzhBWsdAJ6JLqClU5Aj0RXFbBKYVQ2p6enzdHRkctgzTFYepUcRiSs9HqEFax0AnokuoKVTkCPRFcVsMJg6ZWcIpJGqFOHFax0AnokuoKVTkCPRFcVsMrGYE2wTlFOvfr3FxlthLCKEoCVrkNYwUonoEeiK1jpBPTIYnWVwrhsgvWKDObeu4Yqe2JwSGqwmtEI0ZUMC13JqBpYwUonoEeiqwpYZWOwyMrEszIx0wArWOl9E6xgdUEC+u5R00B/RRvUJXRYrLIxWOJThBesp+J2H7zKEZ64LO5kL1hgWOkAYQUrnYAeia5gpRPQI4vVVQqDZbCaR1T931aXadCr5HAiYaXXJaxgpRPQI9EVrHQCeiS6OnBWqQzWSdM05j/3wWANCw1WeiOEFax0AnokuoKVTkCPRFcHziqlwfLRHk9wvhFs982ZXkVlRobnCqtxM4quNJ2jK42TiYIVrHQCeiS6OnBWKQxWT1T+Owjdq3Ei39VosmB1gQaIrgbhoSt0pRPQI9EVrHQCemSxusrBYBnMflbGGanYd36V1JDFip0jrOINE1a7d1i0QT0rCitY6S0NVlWzSmGwLmKSajBVQ4Kce+5z45doCLkcY+65z43P5TyXKMfcc58bv0QZcznG3HOfG5/LeS5RjrnnPjd+iTLmcoy55z43PpfzXKIcc899bvwSZWyPkdpguYJMQZjaviiUzA82xWJqe+ant2jxplhMbV+0MJkfbIrF1PbMT2/R4k2xmNq+aGEyP9gUi6ntmZ/eosWbYjG1fdHCZH6wKRZT21c5vVwMljnZISBZgFqlNvQfgRWsdAJ6JLqClU5Aj0RXsNIJ6JHZ6yong6VjJRICEIAABCAAAQhkTACDlXHlUDQIQAACEIAABMokgMEqs94oNQQgAAEIQAACGRPAYGVcORQNAhCAAAQgAIEyCWCwyqw3Sg0BCEAAAhCAQMYEMFgZVw5FgwAEIAABCECgTAIYrDLrjVJDAAIQgAAEIJAxAQxWxpVD0SAAAQhAAAIQKJMABqvMeqPUEIAABCAAAQhkTACDlXHlUDQIQAACEIAABMokgMEqs94oNQQgAAEIQAACGRPAYGVcORQNAhCAAAQgAIEyCWCwyqw3Sg0BCEAAAhCAQMYEMFgZVw5FgwAEIAABCECgTAIYrDLrjVJDAAIQgAAEIJAxAQxWxpVD0SAAAQhAAAIQKJMABqvMeqPUEIAABCAAAQhkTACDlXHlUDQIQAACEIAABMokgMEqs94oNQQgAAEIQAACGRPAYGVcORQNAhCAAAQgAIEyCWCwyqw3Sg0BCEAAAhCAQMYEMFgZVw5FgwAEIAABCECgTAIYrDLrjVJDAAIQgAAEIJAxAQxWxpVD0SAAAQhAAAIQKJMABqvMeqPUEIAABCAAAQhkTACDlXHlUDQIQAACEIAABMokgMEqs94oNQQgAAEIQAACGRPAYGVcORQNAhCAAAQgAIEyCWCwyqw3Sg0BCEAAAhCAQMYEMFgZVw5FgwAEIAABCECgTAI5GazNAMKcylhmLVNqCEAAAhCAwGERyN4z5GJeNl955UVb9c88eaO5+uhxK4PX33Of+Xsu5cxFntkLKxdQTdPASq8MWOmsiNQJoCtY6QS0yCI8Qw7GpQcKkzWqsCKEpbWRvUfBSkcMK52VicQ0aLzQlcbJaopEgwSrGM+Q2mC1oKawksmyhIoR1lR9rrAdVjpkWOmsGAh1VugKVjoBLbIoz4DB0io1h6iihJUYGKz0CoCVzoqLHJ0VuoKVTkCPLEpXWRgsc0vwA7duNy/deaK56+57LepvfPnl5vKVx5oPX3vQzskig3WevZrSIqxgNaURb3tRHdaM89pHKKx0qrCClU5Aj7S6KsUzZGGwtobAInb3oMPvMA1npqEUYentZS+RsNKxwmomKyWc/or+StHJNoY2qMOyrErxDFkYrDBbZViHRoIO66zDKkVYenvZSySsdKywmsmKixwJGLqSMNkgWM1kVYpnyMJg+WxN52U+/lIN5t8YrLNGWIqw9Payl0hY6VhhNZMVFzkSMHQlYTo3WPTtErDereecPUNyg2XmWJnPO688ZOdfuc7LmYmP33nObjdztCpfD6soYUlNZX9BsNLZwmomKwZCCRi6kjCdGywSDRKwTUmeIbXBatOjx9ceaW7ceqpD2H1H9uqsEZYkLKmp7C8IVjpbWM1g5eaIul1yvnrWT2svkehKxwornVVRniEbg2VMVNh5ue8wWK367FUhZlRqjbCSMJ1fQaOrSWAMhJOIOgG0QZ0XrGayKsEzZGGw3PIM/twGw9qfc1T57UEnvXYyJGZ0sjXCahJR17iX0GHpp7S3SAZCHS1tEFY6AT1yU4pnyMFg2ZSfvwaW4+zmOmCuzgfCUoSlt5W9RRbTCPdGQD8wrGawck/zcpEzCQ1dTSKib9cRdbOjJXiGbAyWQRdbaHSLNJdy7qiFRXfDjOo4YQUrnYAWiWnQOLVZ9xIGwnmntLdo+isdrX0XaO6eIaVxaV+WGltc1MAb+D5lmfXqXzayw8rcyokJK1wnq9LMH6x07cFqB1Zhxx7JuPtHpb+ivxpTGW1whzZYimdI1fjbe/PuyTjH2K1/5Z7Ocd+bZRo8A5Gq3LoUlouMstouW9H+is8RVvfZVyz52vGrA1aWBrrS22iP1dirvcxhaYO0QUFetEEB0jakSM+Qwqi066PEJtUO8fZjK3qqEFYzG6AJR1eT0NDVJKI2YJBV7KEctxf9Vf+pcPr2DgHa4AJtcOwQObTBZAbLX6zPhzSWwQomeKcouy6JZSJ7qyHDahAsrHTNwQpWOgE9El3BSiegRxarqxQmpQMrfBJn7CqndoMFq9EWOVtX/ly2irKi7e1Bd5Gj6ApWLzeXrzzWW6svpkhYwUrwDrP7K5edZxx8UcB7dicjNavkBmvOHKzUsKRaXTaoWOe+LAbpaJ2Uu6Irfx5NjQbLddiwmjbusKINSgT0IPr2ClglN1jK1XPtzt2dP6zGB0J/q8IqhyscvY9ZNLJ9cskcFVboaiF1oSsd5M5zsGpNNJQ4DiYzWA6W+dO/go7NwXJPzAWPZqYou958lon0Oyxzvu2rOszhYdVC7lwNbpenkFjVqKnIGxJgFW+v6Ervx2ClszKRHTPKOKhf5JTEKoVJ6ZkG/wraPZkT+y6oghRln9eELhbducJxpmEHVofOyXZWwRpg1oyOsQqfAKtozTBY6e0yahrQVRQgutqjrvyEhPcz1fTtwVtdRvv2AVbm69V5rf2DUdPgMlhu7RgHyP/ev5VRyXyZaIelsKoxK2P0cf369ebmzZuuIbVZmZiuwu9SND69P1400l7gwEpiOrsNoivaoKCs2boyx6xUWzuzysEzJDFYXvagzTS472Kmym2r7N5zdCD0MzVDrCrj1KbbQ9MwxsrsVCEnWAmjnxcyuw2iq67Bog3Gs32xixz69mVZ5dAWVzdYMWE5pxlbuM//rrIBMdq5K6wq49SahiB1bvlFXh/UflchJ1jtYLDQlQQtnFNkL55pg7ppmGKVg2GQlLBs0M7jYA68Uhss6QkmA6rCOTO9SZDq016Bvteu42Wbl3Y0+5JU8zFrFbmOamjXCrXko4CVpilrRtGVDAtWMqr+BPepvr3iPmuncTAXz7D24DsIK/Z6k3Cp+8rmFg12WGOscng9gN7PLBoZfURc0VVF868ccFjp0oMVrHQCWuTsvt2/aKxkDnLbVw1d5Ch9e2rPsLrBCmD10sg+kPD2TmRfTc7lRvWeuPTTyEOsKuRksw2np6fN0dGR+fuorlzq2Mt4rd0OUisSVnoNwApWOgE9cnbfXmm/bvt2D2tRniHFwBLCsgCDtXmGJiC7fVOUW286y0WGnbvKqjZOMYOlsHJmbLkaK+NIu+gKVuePefcy8cF8Plh5rCb6dljNY1Ujr136K+cRko6FKYzKRWCVMXwtV0pY6SyjrMLdK53YHmKA1QxdBU+ntsbd/KXSJ5yH6KGrGboKMu7KBWGK8Vo/o/1FFjsOpqiwYmHtTz+DR6bD0qFvGAhlWLCSUTVRVhj3KEB0NUNXMYOFruK6KtWMZmOwJnSZopx6U9lfpNRhBT8PK/1WDqxgpbRec5vB14o6pUE59iHFYEb12qRvvyCrEjxDigFGElbq2f963e81UuqwYGXrYFBX3msWwspKof+9CkY8OKxEUNuwk6ZpzH/u05uDxUUObXCepLTMKH37uK7M1vD1ejk9ZZligJFMAx0WHdbMDsuarDDTEB6DDqtjEjpZGVgNKs43WMo7LlP0qzs0l73sQhvUsHKRo3EavHgmgxUnIAmLycjDA6H4xKUu38OJnBwIMe4tAVjpuvdZmb8fe7veCP5tNtVssNCVrituPR84q1QdAcLShTV5ewIzGjUN0YEQVrDSm56N9G8Nhm3RHeoYXQ2y6plRWEXboMvAd+QJq8HWWsQ8yFQGq2cayMrsfnuCRshAiGmYSUAP9w3W0F4YrDMysNpdV8f+63JY/qMHMuoZvvS17zT33/+ADc5xHExpsHyC/lVOTKImDe9/lIasSz3fyNh5Tt2egNVwfYYDoc+qFk3tOhDCCl1N9ZRKG6INDpvROX27wnqqvkraHp5vEZ4hhcHqgYo598h3NRoHpRHFrnxgFe86wkYZclLNR0kdU6yskq6CHWG1m8FyeynM0ZWeCauCFeNgNDMazfblyCoHg2UIhs596DuyWNPGodaBUDFHmNFz/UwN+LCawQoz2hJAV7r1m2LFOKhn+7JklcJgXcQkKYLU5V1W5NxznxtfFo3x0o6de8zMK+bskPiobRBW3Vof0tWYGa21HdIG9R5jF43sso9eonwj55733PhFzzy1wVLT50khLUr84gebYjG1/eIlKOcICgslppwz3r2kCgclZvcSlLOnMjcSVsPZh7CmYQWrua1/SjNT2+f+3k7xuRissQxCFqB2oru/nYaYwKrPHFa6DmEFK52AHomuYKUT0COz11VOBkvHSiQEIAABCEAAAhDImAAGK+PKoWgQgAAEIAABCJRJAINVZr1RaghAAAIQgAAEMiaAwcq4cigaBCAAAQhAAAJlEsBglVlvlBoCEIAABCAAgYwJYLAyrhyKBgEIQAACEIBAmQQwWGXWG6WGAAQgAAEIQCBjAhisjCuHokEAAhCAAAQgUCYBDFaZ9UapIQABCEAAAhDImAAGK+PKoWgQgAAEIAABCJRJAINVZr1RaghAAAIQgAAEMiaAwcq4cigaBCAAAQhAAAJlEsBglVlvlBoCEIAABCAAgYwJYLAyrhyKBgEIQAACEIBAmQQwWGXWG6WGAAQgAAEIQCBjAhisjCuHokEAAhCAAAQgUCYBDFaZ9UapIQABCEAAAhDImAAGK+PKoWgQgAAEIAABCJRJAINVZr1RaghAAAIQgAAEMiaAwcq4cigaBCAAAQhAAAJlEsBglVlvlBoCEIAABCAAgYwJYLAyrhyKBgEIQAACEIBAmQQwWGXWG6WGAAQgAAEIQCBjAhisjCuHokEAAhCAAAQgUCYBDFaZ9UapIQABCEAAAhDImAAGK+PKoWgQSEjgpGka8x8fCEAAAhDYgQAGawdo7JIFgc22FGh4+eo42Ww2zaVLFi0ma3m+HBECEKiAAINTBZV8gKe4efULv9V87X/8bnN0dGRODx0vW8kYrGV5cjQIQKBCAgxMFVb6AZzy5vT0tPm+P/0nMVn7qUwM1n64clQIQKAiAhisiir7wE7VmqzN5v81ly79ETJZy1YuBmtZnhwNAhCokEBOBsvNqQmrIacy5iQReDWNNVm//3vfbP7Ed3/PmMmClabcltPJyUlj/tt+aIN9fmhK05SJghWsdAJ6ZPa6yqXj3HzllRct1meevNFcffS4Rfz6e+4zf8+lnHrV7zcSXud8p0wWrDQttpx++qcfbv7Vc5+yBusX3vtIQxvsAURTmqasuaJvl2HBSkZVhq5yMC49UWGyRlUGr0g2wWSynn/++eYd73iHn8mCldZhdTj9/v99bfOTD91vTZYxWOaDyWpBoilNU1FzRd8+CA9dHaCuUhusVlRTbOngLSF4DQvFZrKMybp586aNclfOaEsz7C7qVx5/ymavXAbLfU8bpP1NtSVvO32VDgtWB8oKg6VXbA6RNMTxWrD35F+684SNunzlMclkVW4ceprCYE1nGaY6g8o1xcXglEC62+nXdV5FscrCYJm08Qdu3bYD411332tRf+PLL9sB8sPXHrRzsuiwzjNY8BrPyPhbjX7Q1nQGy9fUP3/uN2z26u/8/N9qnnr2Nm3wHJ/t3Gl/0mgIKwkT/bqOqTxWWRisrXmy9NxtnfA7DNa5uOA1bbCuX7/e3ir0o42+0FaHnx0IfSbve+97rMF6zXe/rg30YlL3GTP740XDe6zor8azffRVkv7QlYSpvDEwdWdphRVmqwzG8CoRg3UuLniNd+qOjzNZ4S1DtNU3WL6mzCR3Y7DMRPdPffbVNrNMGzybg0X7k0ZDWEmY6Nd1TOWxysJg+YDN4Gc+/lIN5t907ufigpdmsFxUmGUIJ79Xrq3enAazTIP5/NCPvLV9ipA2SPvbZSCkr5Ko9dog4+B4H1+KrpIbLDNHxnzeeeUhO//KpZTdleLH7zxnt5t5NKyH1WzgNdph9a6at7ppd3K3ukxWC22dmQZfU2b+1cu/+UW7wdwq/Lf/+teaP/M9Z/hog7Q/yS6cBdFX6bBgdaCsUhss2xDNoHd87ZHmxq2nOpjdd5VnGELpwSveGMNVfY22W1Yfu/35zhOFRlPMK2pBtpxe8+cud+h+67dfsu2SNthnRX81OSrSV00iQlc6ovJYZWOw3IDnw2YQjEqvnRAZu9VVsWlo0+yeGeiwcnoyc2j8bCmZ0WZjslV/8O0/bH71H/xS+4ocMw/r5//2Lzbf9cf/aPPRx58mg7zNzLg2RvubHBrpqyYRdU0D46AErBhdZWGw3PIM/hMnBrM/oZRB8LwhwmvYeLoJyFu9bGKsnK48k5VDO5B6lj0FbR55+MHm5973d5t/+euf7Bisn3r325p/+NG/Z5droA2e3fqi/ckqhJWMCl3pqMphlcvA0jZEH3IwWM7gf/Ch8OpXcWf+lWcGeqzIZPXgnVy9+jPHv/T+x5q//6v/qJ3YbhYcNWth/eJHnmieeeafmKdP2rc/H3wLGz9B2p8uAFjBSiegRxahq2wMluEaW2h0yzuXcurVv7/Idq7RAK9aWcUM1iir8FZPpfOMrGkyBuv7v//PNl/70kvNBz949rL1D33oRvN9b7jc/M7v/DdnsMzXmKymad8YEC6MTH/V6/hgpY8FsDowVikH43bwiy3WZzgPfJ+yzHr1LxvZY2UOH7ulGnxXE6twDlZvUrtfJf7ThGaQrDRbenJ6+kJzevrvj7/1e1+1eLZzrVpUZm6W+ZhFR4+O/vKNo6MHajdZPZ05WEF/VVPbG+rtYKWPA7CaZlWcZ0jVCbST1Nwj4o6tW//KrQPivjePiFc6gbtmVnOzJcfGEBiToOjKLeFgMoHmtUwVzjHaXL36M83f/OvvsPOuHvjRN9rmFrbBFz77qt3+j//F8yaTVSMnc862c1d0ZeK85UFS9bHTw9X+ImCls4WVxqrIcTBF4+849fBJnCHW/tMVFd3KqZnVyWYTrrww3RJv3LhxbMzAHF1tj5qiLUyf0P4iNv/lc//BTmo32atfeO8jo79k5mOZLJaZ9P4X3/LjtZmswaeWpvqrivoqhwJWepuFlcaq2HEwxaDSWwzSZzyWwQqe3klRdk0Oy0XVzOrk9PR0J5JHR0fHMzMNNWgpZLn5zCd+rfkLP/xj1jj5vGJt0GRkjBH7r7/xmebH3v7XqjNYft+jsKr4CejOk4OwGu3CYKX18MWOgykGlg6sOZmG2g2WwspcMR8Qp7m3CF1zPVZYmeAKMwxtpsFMaDdPDZpbqlO8DCdz+9U8VWgmvld2O7UzECqsMFhnb+WAlW6wYDXIarZnyGUcTG6w5mQaDsg4aL59uxK5/3LZqWyfyTRUyKmXnZmjq8rMgs8qegUdZrDc/MdKHwRoDWksiwWraFeGrtQePlhXzfVb6KoDcHYGK5dxMJnBctmDKdfuMOfiSPV2s0jkrHvPlTKKgW65TdVCxRksg6a3EOTAi7BZ9BdWU01p0LibDehqODsTLlwLqx6rYsfBJAYrxKfcp/cbaUWDYm+W9xgrl2mo/NZXm3EQdZWiDcwZrPYd21l7J3yYJLjVVdutwV5m1HzhD4j+0gyw6mYdYCU3XdrgOKpix8G1B5foYpC+Y3frOMW+C+pg7bLLrWXhwN7953D9q/D3Kl3OojcYirqqRUdjsuSVJnqjhRWsdAJ6JLqaMFn+BYw3xg3ulcM4uPbg0j6WuqVifn/jMg1hBsb/vtIMljnt0JRadOGVs6+yijJ8o6ZB1NXabUDvcteL7F1BO415865qz1652oCVrktYwUonMMNgudDcx8G1Bxfb4K5fv97cvHnTddgd09cjPnwAACAASURBVBUzVS5jU+nk7Y7BcuwMC/MxC2S6vzvRVbpoZjSD5bQzoqu128BSHc6Sx2Eg1GnCClY6AT0SXc0wWKWMg2sPLlGD5a6Wp179UqnBslks35gK6dG161XvRtaLtMxirILvYLXVl1A1sIKVIJM2RF0pGF2hK0VXxY2Dawu71+DmPEUY1MDaZVcEsK+YDrcpZtwiPLutqnxg1WVleJirQ/cxmWY/DV/xkhb2Qiec1werwVYGK6UDOouBlcaquHFwbZNiJ/KZz/Y21uRcotg91soGxTZ1HOPmdFnpq4SGmuXoY72w6mDrsYplks0elbW7mLZgpQ2EHdPg2hu6mjajsBpmZLYM+Ydcx8G1DZZteB5CO8nd/NvdtgkNld8oA7gpyq53L8tEbszrYp5//nk3Z80eVWBVA5spwqquYBW0QdtIN5vm0qVL4S1WWEVYufkg3HruNcnebXpYjRsIX0OwalkVOw6m6DAtrKOjI0PP/X7vSbmB+VbOnKUo99SAvvT2UFRzWS1dnhKPp+qqxHNbuswdVhGDVUObU5lGHzzJ4bFw9QRWjIOVDhtWfVZFj4MpOs2LGCxdqmVHDomqTb37j89XPPl/qpYxWFOEzrdjsHZkFck0pOhX9dKvG4lp0HnDqstqchz87a//b5esyfIVcSk6AgzWeIMbE5U1WOHuGKzxtLu/FVYaKzJYo4200wYxWLDSPRSsRFYHMQ4mMVjBOlhR0xBUQopyijpYNGxKVG0Gy/xlYEX3Wlgp4DuTkiM7wCrIYDldOYPlMYPVACuvP3MRsIKV0j+FMZ3+qmJdHcw4mKIj2MQMVvAoeI2PhiuiippRHqPXsjImClYaKzJYZBp2cQiRfcj26SBh1TQHNQ5mY7AmNJiinHqzWCYyZjxjR46+OodMQ7QSYKVrMzoHC11N66riTIOirui8InSFrgbEc1DjYCrjYpy6/9tMRj5TW8hFMljMKxrOyvgvCDVRsNJYkcEaz2D5uvp3d55rfuLKQ/6SFqn6VcXwrB3T6dthha4EAR7MOJhLR4DBElS3DWGS+xmIky0P92fUjIZfYrCGDZa/BYM1PhD6WzENsNK7b1jtg1WuF8+pDJYZFP2B0RqsL33tO8399z9g+TMQRmXYe6VCxaxCYxX+G1Z6T9ZjhcEaz/S5reZBE7euH+tg9Zj1dAUrdKV3SzqrXMfBlAbLp3c8Af1GsH0sa7FA/SU5xFRGxm33WRkux4EZ9VkdIqewcsbOEVbjUvbZddpgxGDVpqsxnXVYRUwDrM7pwWrHNliprnYeBwPMWbTBFAYrHBCPwxeoGlCR7w7dZA1lZKZMUmhOD53TUHc1xcnsB6szelOsjiPLNKCruPKOvTdTuAhYwWrqKn2yDVaqq53HwQnPMMV7qr522p6DwQoHPtc5hdmHOZmLnWBkstNcIcQMahbuPQHPKXawmmmwgmUtatTVpKb8TIPBu12fDlb9DqA1o+hq+iKncl1NtbvY8DLmGXY53oWHsBQGyy/03JOeG39hQAkPMOdcY8Kas3/C01z8p6fOG1bnyIdYjWWwpvguXqGZHHCQ1atf+K3mjT/wg34xnbmCVbfyjmHVUzO6Gm/gF21DF93/Qt1PaoPlCj8FYWr7hSBkvvPcc58bn/np71Q8lYEat1MhCtkpxsA3WLWbhakLQt80wGrcvMMq3ilE26BnRtHV9LSGLO9w5WKwDJyhwY5BcDrjoBrVQsb8RYo5pZup7YsUopCDhCxCgwWr4TYYmgZYwWqXZt9rg4HBQlcFjoM5GaxdRMk+EIDA8gQ23iR3+ohxvhtvIIQVrJZqjehqKZIJj0OHkBA+Pw2BTAlgsPSKgRWsdAJ6JLrSWWUbicHKtmooGASSEaBz19HDClY6AT0SXemsso3EYGVbNRQMAskI0Lnr6GEFK52AHomudFbZRmKwsq0aCgaBZATo3HX0sIKVTkCPRFc6q2wjMVjZVg0Fg0AyAuaJJbNemHk8nKeXxqsBVrpMYQUrncABRGKwDqASOQUI7IGAGQwxVxpYWGmcTBSsYKUTKDwSg1V4BVJ8CEAAAhCAAATyI4DByq9OKBEEIAABCEAAAoUTwGAVXoEUHwIQgAAEIACB/AhgsPKrE0oEAQhAAAIQgEDhBDBYhVcgxYcABCAAAQhAID8CGKz86oQSQQACEIAABCBQOAEMVuEVSPEhAAEIQAACEMiPAAYrvzqhRBCAAAQgAAEIFE4Ag1V4BVJ8CEAAAhCAAATyI4DByq9OKBEEIAABCEAAAoUTwGAVXoEUHwIQgAAEIACB/AhgsPKrE0oEAQhAAAIQgEDhBDBYhVcgxYcABCAAAQhAID8CGKz86oQSQQACEIAABCBQOAEMVuEVSPEhAAEIQAACEMiPAAYrvzqhRBCAAAQgAAEIFE4Ag1V4BVJ8CEAAAhCAAATyI4DByq9OKBEEIAABCEAAAoUTwGAVXoEUHwIQgAAEIACB/AhgsPKrE0oEAQhAAAIQgEDhBDBYhVcgxYcABCAAAQhAID8CGKz86oQSQQACEIAABCBQOIFsDNbbm2YTY/mJpsmmjLnU9VsGWH0OVr0qQle6atGVzgpd6azQlc4KXemsStBVFubFiOp9732PJfub/+nTzQ/9yFtbyh99/OkGk3UuOiOqMVaYrHNW6GpeZ4WuNF7oSuNkouivdFboSmdViq6SG6yYqDBZcaHFRBVjhclqGnR1sc4KXcX5oSt0pRPQI9GVzqqkcTCpwfJFNYW39kyWLyqFVc0mC11NKSSeEZ3ay7RBdHWWaZ/60F+dZ9oVVugKXU3pJMyITsXn0F9hsKZqKZPtGCy9IjBYOit0pbNCVzordKWzQlc6q9J0lYXBMrcjPvXZV5tHHn6w+WPf9VpL+3/9wdebp5693dz/o2+0c7K4Ijy7IlRZcUWos6p5jp/rsNDVdCfvBkKVFbrS2yD9lc4KXemsUusqC4NlzJP7uIm24XcYrDODpbJKLazp4Wp/EW4gVFnRYaErRY3oSqF0FuOMu9oG6a/0Nkh/pbNKrassDFaYrTINNLxKxGCdGSyVVWph6V3x8pFuIFRZ0WGhK0WF6Eqh1DVYahukv9LbIP2Vziq1rrIwWH6zNcbKfPylGsy/MVj9SaNjrFILS++Kl4+MzWlAV3HOsTkN6CrOCl3pbRVd6azQlc6qNF0lN1hmjpX5vOENb7Tzr1xK2WVrvvSlV+12M0erduc+h1XtBmsOK3Slt0F0pbNCVzordKWzQlc6q9S6SmqwjHFy7v30zq83R1fe3bGy7rvas1cOinPvU6xSi0q/HtlfJLrS2aIrnRW60lmhK50VutJZlaSrbAyWMVFugrtD7b7DYHXnNUyxwmCdG/cpVjVfDYbGfYoVukJX+jDYneg+1rejK3R1qLrKwmC55Rn8J04McH9SNwPhWYelsKLDOuuwFFboCl3N6dzRlU6L/kpnha50ViXpKrnBcrcJzWBo1r3yP+47BsFzKk5cQ6wwV+esXKeFrqY7L3Q1zchFoCudFbrSWaErnVUpusrKYLlFRh1m94gvBqtvsIZYYbD6BgtdTXdc/lWhH+3aILpCV9Mq6kegK52an8WKtUHGwfLGwSQGywjJoDKC8Rfvi63k7hbXdLFuP122ZUeaDsqcgRng/MX7xli5WLdf2QT00qMrnRW60lmhK50VutJZoSudVam6Wt1ghashu8fpDWqzFIP/iW3zDZdePWVGhqsh78qqhuwDutI1jq50VuhKZ4WudFboSmdVsq5WNVj+gmr+elcK6jD+0J8s9BdUW4LVIZssdKW0oLMYdKWzQlc6K3Sls0JXOqvSdZXEYLl5HQazn5Ux/3YruLvVpF1VuOyW/2TYId+TdsJailUNBmspVujqrbbZKW0QXems0JXOCl3prNCVzmptXSU3WOH6KEPe1mVxajZYF2G1trD0a5SLR4bviDNHvAir2jqsi7BCV3H90l9drA2iK3TlZ9z9i+eS+qvkBosMVrwhkcHSjVfMYKErdKUrKB6JrnSC9Fc6K3SlsypdV8kN1kXcKJkG/SqHK0KdFbrSWaErnRW60lmhK50VutJZra2rJAbL4HCT1I2b97MNsTlY7kXP4eTAGoTlWLmlFxRW/pIO/v76dUNZkTFdoKvxDBa6mtY4uppm5CLCycj0V8Ps0FU9ulrdYDm0zhz5YnOdvvnTz2z5ZsyvmkM3WO5cnev2O7ExVv46WOExdGmXE+nWkzElRlfj9ebWkzFR6GqcFbrS+wB0pbNCVzqr0nW1msEayj75mQaTqXLGypgql62pLYMVuxo0kjTf+0yGWNWUwUJX8zorXzO+wUJXXY7oCl3pBPRIdKWzOoRxcHWD9dDjT5sX8fYyDe6pG7+jd5ksP4NVw1OETlgPP/60MVW9TMMUK2ewfFZr33vWm9HFIl2Hha6mOaKraUYuAl3prNCVzgpd6awOQVerGqxPNE1z/fr15ubNm4Zy+9v+KwOee+977KthHnr8afsanfC2Ty0G63MDrPxXBjy7ZfXw40/b1+iEt31qMVjoSuu0jEbQlcbK9D3oSmOFrjROJgpd6awOQVfJDVZsVVtXBf7tDP9dhG77oc7BGhJWbFXbGKua5mANdVjoqt+RoSu9c0dXOit0pbNCVzqrQ9DVqgbLR+u/6FlBXtOrcvyJfS4rFU5wH2MWY3XItwjRldKCzubw+ZHhXL2po6CrZjN3WZnwInGKcYnb0ZVea/4Ed3d3JnzQa27ffsiJhtL7q1UNlrllZT5PPXvbzsEKswxh52U6dL+DMvuGx9ClXU6k6bD884xNWp/L6pANFrrStI2uNE7uVg660nihK40TutI5mchD0NVqBsuJy8xrCCe5m23GMISGyn3nnL47hv/veVVWTrRLj4aT3BVW/tNhJv5QzZWrTZd2R1fT+kZX04zQlc7IRaIrnRn9lc6qdF2tarCaptl86lMvNPff/4Ah3JnkbsyU/76hGiazT8gsysrdKhxidehmaoAZutL7LHR1QVYu805/1QGJrtCVTkCPLFpXqxus09PT5ujoqDVYYWflLxRZucnahKxCc+Vnqmp4YnCkTfZYoatBWuhqRudOfyXDQlcyqob+6gKsShoHMVh6Ra8dSYelE6fDugCrkjos/TQXiURXOkb6qwuw4oLwMC8IszBYPlo/gxX7Xtdw8ZHRDss/q3CuldtW4W3C6ECIrqJtAF3pXQO6ugCr2NOF5nBD3+s/VXwkutKrsOj+anWDFS40OvbqgBoecR677RWyCtfBir1LzjwoUKPBQldyj7VBV7uzor8azjSgK3QlE9ADi+6vsjBYZBrimYZYh0UGS2MVW2/G7Dn0vd7ei4+MdljoCl1dUNnoSgfYY0V/Nc+4l9JfZWGw/CcImeTeSmfQubunl5jkPsyKOQ3zOiy/DaIrdKV7BfqrJVjRXx1mf7W2wTIUzWrSg0s0YLA6QuuwYjLyaFeGrvSeHl3tyIqBUG+D9Fc6K3SlsypJVykM1knTNOY/+0FYo8LqsCpJWPr4tVgkutJRoqsdWdFf0V/p0tFZoSudVUnjYBYGy0fLU4QdofUGQn8rTxEOs2JOw7wOC10N8uoZd/orjRVPEeptkP5KZ1WSrtY2WG3mymSxwpdcmifgPtE0N7aZrWP/fXv+Nq8q/OMtdGGRzWE6rMKXPW+fFrSs3tI0PVaf23KskRW6muysXMAJutJZoSudFbrSWaErnVVpukppsCzVtzfNscPrzJX799i2bUwtBsuerjFSjk1ooMa21cgKXY1mGTob0ZXOCl3prNCVzgpd6axK0lVyg3XBfFFVBgtWeiOEFawuqAGz+9L9y9LHW+AUFzvE0ue29PEWO9EFDrT0uS19vAVOcbFDLH1uSx9v9ETXNlhhYeac7JzYxWo3owPNOf85sRmd4mJFmXP+c2IXK2BGB5pz/nNiMzrFxYoy5/znxC5WwIwONOf858RmdIqLFWXO+c+JXayAGR1ozvnPid3LKaY2WOpVYnJQe6E//6AKByVm/i+Xt4fCQYkp78znl1jhoMTM/+Xy9lA4KDHlnfn8EisclJj5v1zeHgoHJaa8M59fYoWDEjP/l2fukYPBmllkwiEAAQhAAAIQgEDeBDBYedcPpYMABCAAAQhAoEACGKwCK40iQwACEIAABCCQNwEMVt71Q+kgAAEIQAACECiQAAarwEqjyBCAAAQgAAEI5E0Ag5V3/VA6CEAAAhCAAAQKJIDBKrDSKDIEIAABCEAAAnkTwGDlXT+UDgIQgAAEIACBAglgsAqsNIoMAQhAAAIQgEDeBDBYedcPpYMABCAAAQhAoEACGKwCK40iQwACEIAABCCQNwEMVt71Q+kgAAEIQAACECiQAAarwEqjyBCAAAQgAAEI5E0Ag5V3/VA6CEAAAhCAAAQKJIDBKrDSKDIEIAABCEAAAnkTwGDlXT+UDgIQgAAEIACBAglgsAqsNIoMAQhAAAIQgEDeBDBYedcPpYMABCAAAQhAoEACGKwCK40iQwACEIAABCCQNwEMVt71Q+kgAAEIQAACECiQAAarwEqjyBCAAAQgAAEI5E0Ag5V3/VA6CEAAAhCAAAQKJIDBKrDSKDIEIAABCEAAAnkTwGDlXT+UDgIQgAAEIACBAglgsAqsNIoMAQhAAAIQgEDeBDBYedcPpYMABCAAAQhAoEACGKwCK40iQwACEIAABCCQNwEMVt71Q+kgAAEIQAACECiQAAarwEqjyBCAAAQgAAEI5E0Ag5V3/VA6CEAAAhCAAAQKJJCTwdoM8MupjAVWMUWGAAQgAAEIQGBtArmYl81XXnnRnvszT95orj563HJ4/T33mb/nUs6164ffgwAEIAABCECgQAI5GJeeucJkFagkigwBCEAAAhCAQEsgtcFqzdVUnZDJmiLEdghAAAIQgAAEciGAwcqlJigHBCAAAQhAAAIHQyALg2VuCX7g1u3mpTtPNHfdfa+F+40vv9xcvvJY8+FrD9o5WWSwDkZznAgEIAABCEDg4AlkYbC25snCdpPdw+8wWB0t8sTlwTdNThACEIAABEomkIXBCrNVBmiY1cJgtTLjicuSWxxlhwAEIACBKghkYbB80sZYmY+/VIP5NwbLYuGJyyqaJScJAQhAAAKlE0husMwcK/N555WH7Pwrd2vQ3Co0ma2P33nObjdztCpfD4snLktvbZQfAhCAAASqIZDaYNmsjPnfzz745ubGrac64I+vPdJ87Pbn3Xc5lDWlMDBYKenz2xCAAAQgAIEZBHIxLdZkuQnurvzeRPdcyjkD7eKh1mDxxOXiXDkgBCAAAQhAYHECORgXaxz8pwb9s/S25VDWxStgxgF7nHjicgY9QiEAAQhAAAIrEsjBtHSMg5uTtZ1zZbNaTHC3irCceOJyxdbBT0EAAhCAAAR2JJCFwXILjIZZLN9QVD7BvTVYfj3zxOWOqmc3CEAAAhCAwJ4J5GCwrHnwV3F35+yyNZirswwWT1zuuTVweAhAAAIQgMBCBHIwWO0twtircrhF2KlpnrhcSPgcBgIQgAAEILBPAikNljULLitj/u7mXbkTHtiWssz7rAv12DxxqZIiDgIQgAAEIJCIQCqz0matwqUZhjiY+Vlks84muvPE5azWwnsbZ+EiGAIQgAAEliCQwmC1C2Yao+BnqcwJuVfkuAnc7iRNditYliBF2Zdgvusx2syV4+azcnxYO6yDl/c27qo29oMABCAAgQsRSGFSOssNzMlgBU8bpij7hWBfcGdrsMQnLk1obXxCvLy38YKCY3cIQAACENidQIpBuLeek1/8sQxW7QbLZPtMpmrsiUsXU7nB4rVCu/cJZk93WzVF/3Cxkq+/98n2J92f65egnF+EVTl1RUkXIJCiAyWDNb/iOhPbzW3AoScuzaG5TXg2V035sIhtj1LnFn7lRn1KQidffeUlG/O6ey6bPzBZw8RgNaUmth8cgeQGyxD152HFMlju6cJKM1jtxPY5T1xW/kAA722c31W1DwOEb1PYHipFXzH/LNbZozVSH7n2oP3F99+67f8yRuucBqzW0SS/kiGBFJ1meIXcecmzy774GYjwu4qyDh1Wc7IytT8QED5tyXsbR3ufTsZvpA2m6C9y6zbbTIyXuWpcJotsVqe6YJWbeinPqgRSdJj+Y/Pm99sVysMnBQeupB2gFGVftXLC9w+S7ZPx895GGdV5+3O7jM2DrPyW4YnLWJ2zOkvQPPNkN2m1zWjVnMmCld4GiTxQAmublNj8DvVlzzUu09AxCkaDY5k9s91lHyq9neqaaW8OFu9tHOzBmK+md+6djMzYbszJamCl64rIAyWQxGB57xhsFw8duv3lLzBaoWnoGSw/q+ff9gqzfRWy8pso723UO6xOBjm2W6CttfsM/Uz2H9lmZd5/6/Zx7Oc+cu3BG+Z7MlgNrHbT41DWs+Zs6BDJ7Fmt3VkOZmSckfJJ+t/5T87VNgcrZkj924XuIQB/3lHtBsvp6GcffHNz49ZTnQZ6fO2R5mO3P+9/t3Y72K3r3c9evbcqmGyfu03osqKVPzThyNuszOvuuXzsLm5irL76yks3yGCdZbBgNavRtlk/c8v56qPn/gE99TgWwWrtgSV8bYmdg+VufYWGauy1MJXMBelNco8ZUSc9P9tX+yR3bz2wzm1V/zYqa4ZZ5XSWAHGGIWYctjpbu8+YNULtOdiMeD1zNcDKZLJqzjrAap4Ye4YBkzUIsBhWa3eWQ2vs9DJbkQxMjevzdAypb5rCW6qhOQ2kuXY9z+talo1umYnvbXS/XhMjd87RF4cPVUfl66t1DMOUZLesajVZsJoSSHc789V0XkWxWntQ2RjjZD6Xrzxm/nC/LxmsgX31qikrMvpAgJrtqzSD1Xlgwhksk6kaeW/jpa+88uKmotvOrblyfOYu/1Ehq97trqmuxDCq9FYhrKbE0d9elGmYf3qL7lEUq7UNVntLIrjFpxisoX0Xrb2MDhYysbdTzWDozclqDWr4jsIK52BNaait2oBh+H7HFG1ibdn13qZgbnOFr2FyOnMGtdJ5kP4K5Pb2oMrKGCxTsRXNn4HVbi3ZcjO3BM3DES/debJ57d332iN9/csvN5evPNqY5UHMnKyKtDREsihWKQYTc1si/N1wblYIN0U5d2sqy+0VNVjB4VuDFf4sBuuMyNh7Gx2z2lnNWZS1Qla2Q98OdNZgebdKw6VjrKRczEt3nrxhBsqKBkVY7db/u6xfu3fwCib7/fahAfPXquf2eRxaLt6FTFas1jYum9PT0+bo6MhA8H97cHX3Cm9HuEYWfSBg4NZfj9+AEdut+ee/1+bq1avNM88840raZvvG3tvoD5TeKa7dJtamG7KyhiDMVplChZmaCK9DZxUOZNZgzWBlM1jbz6EPirDavSX7xrTNVp21wW5WqyKzPkSzKFZrdpCbzWbTfPrTn27+8P98p/mJKw/5JosMVldOvZc7bw1pzHSZPXv8KpqDdXJycnL8U+9+e/M/f/e/Nz9+5W84XXWeTvXxhlmIirIyMVa9pyzHFmWtiJXNFHjZK/Pv9glCp6dxVlVlsGB1QYPl7+7eDOAv1eBlaQ7drI+R7M3BypnV6gbrV375l5s3v/kHewaLeTEdTVlzEJnUP2sOljlG8DDB7l1Avnta0/AfP/OZ5nu/9081//TZf2YNlpm4rhS5sqxMjFX7svV3Xnmouevue9tbYK5NfvzOcxalW2+tomxfLyvjFl0VWVWdwYKV0gPZmHZR1ndc+St2/tU2U2VvC5rb08/f+Tc2kAVsy2K1usH6uccea37yrz6EwRpvezbbd+lSp3rmPHHpZ7XWrGO5R1kw0JqGe+6+q/nzb7qn+eH77u8YLGUB29qyfSEr9/CEWYA1tiir+a7SF677k7btQDiHVWWT3GF1sU7N8vvgtfc0H7r1dOdI7jtuD7ZYimG1xuArZRLIYFnxwErvpPzswvEjDz9o93zq2dvmD5M5sK8yCZci8BdjdT9VwfIfk6yGlmwIeVXAylfgiXmi6ywT/GjHYI0Zd7cGVmRfXd3lRcLqYnXWTnR3E9zd4YyxYoJ7B24xrFYxWI89ajun5gtf/GLzA296U/un+e6JJ886sImPn2p3oYd4H3oDqykpnF/FPOp09YUvNN/+9rePv/nNbzbvete7rFaePNNV9H1x3i84Xbm4Q10Y8mSC1XG4zIdjFFz4tMZ1a2IPsQ12DFbTNPaJnKZpTrd/zmHl7wsrj2xEVzWxCjs5qw23PIO7PeiCvHmAhpHR4aFraWwQKIrVKgbLp2UMRGiq/IUOw1sRZl9vVeSw85NH40ICOxksWI3WWqeTMQZia6rcTp0JyZXrapLVWQf/hJ2D5X/892BuTdWht8Gp87NmHFa9thkb9GGlDTwtO38NLLerWwvLO1T1Bss3pD7i3FitYbA6tyc80+BnpfxMQ5hVMPxqyWDBSuuQTNSUaTAx6OqMp8zKNw4T5qp3XL3qiokcGsh6xgFWg1kVWGly75is//zFb9mM3l9602tOt7en3VFqNlc9BsaQ5sxqDYPly2vztre9rfnkJz9pvnO/rQpGjdPknH8UrPQ6OnnggQeaF154wR/0Vb2ocXpp8o6MsfK5hbdVa3oSTq05pxlYTROD1TSj0Di426Xue3d7ura+aoycY5E1q9UNlpfBwmCNNzw7H2t7OxVW46zsHKPtLULX8NTOSI3Tu8m8I2Ospq6Oa2Ok1OAQE1j16cFKUdRZDKwOiNXaBsuIx1z1hZOJpzqlqe16lZQTCSu9rnx9DP09drRadTVlqHTyREIAAhCAQJTA2gbLOfQaB7ZdJGg4wUojByuNE21Q50QkBCAAgZ0JpDBYOxeWHSEAAQhAAAIQgEAJBDBYJdQSZYQABCAAAQhAoCgCGKyiqovCQgACEIAABCBQAgEMVgm1RBkhAAEIQAACECiKAAarqOqisBCAAAQgAAEIlEAAgdOoRQAAADhJREFUg1VCLVFGCEAAAhCAAASKIoDBKqq6KCwEIAABCEAAAiUQwGCVUEuUEQIQgAAEIACBogj8f0i8V1Yga/EAAAAAAElFTkSuQmCC",
        "data:image/png;base64,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"
    ],
    kingCobra: [
        "data:image/png;base64,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",
        "data:image/png;base64,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",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAD6CAYAAACPpxFEAAAdy0lEQVR4Xu2dT6hlR17HT5CACG5GotgMMkhaEKQX3Y4EJovJ8MaV2fQqC3EXNBFmI7SLLN7Lohc2uBmY9Eh24iKrbDIr52GyyEBw7CyCINhBRIYWDc5GECHIlaq5dTj3vHPvrapTv9+p328+B4Z+81J/fr/Pt6q+Vefce95zAxcEIAABCECggsBzFXVKq+yGYdDopzSu0vLkUUpMtjx6yPItbR09SonJllfRQ3ph371x9erw+OqDgEq6L0k5yEOSbnnb6FHOTLIGekjSLW9bTQ/pRV0tkXLGRTXIowiXeGH0EEdc1AF6FOESL6ymh7SBXA3DcOngFEIe4mO+qAP0KMIlXhg9xBEXdaCmBwaSp4uaIHnhVJcij2p0IhXRQwRrdaPoUYhO2kBCOIhSKIpwcfQQBlzYPHoUAhMujh4FgDGQfFgMrHxWGiXRQ4Nyfh/okc9Ko6SKHhoGEmCpPdQRVoY8hAEXNo8ehcCEi6OHMODC5sX1wEDKFBEXpCyc6tLkUY1OpCJ6iGCtbhQ9MtFpGEgUI1zGvw9CHpmDSqkYeiiBzuwGPTJBKRVT0QMDyVdTRZD8cKpLkkc1OpGK6CGCtbpR9ChAh4Hkw2Jg5bPSKIkeGpTz+0CPfFYaJVX0wEDypVQRJD+c6pLkUY1OpCJ6iGCtbhQ9CtBJG8gohvFnIORRMKgUiqKHAuSCLtCjAJZCUTU9JA0kvA0yXsYfopOHwogv6AI9CmApFEUPBcgFXajqIWUgSw4YGLy9/2Z6AY9Ni5LHpvhvdI4e6CFBgHFVSVXCQA7ESHHtP8JryUDIo3JQCVVDDyGwlc2iRyU4oWqb6CFmIK+//MXw7scvDOlfg98BiYKQh9BwL28WPcqZSdZAD0m65W1vokdrA9l9ev3ScPfik/G5R+AQzCP93sgfliKP8gEsWQM9JOmWt40e5cwka2ymR3MDefjgtQjqrUfvjcBmv2vdp4QwO/KQwFrdpks9fvid7wzf/u53B+ZH9bhYW9HluEpQNMZV68U8OmG4Hrzz5Sjuozefjz+Hk4mlEwh5rJ2fzeq7HFd//tVvDH/xkx8NzI9m46S0IZfjKkHQGFfNDSS53oefPx3FfOXF29NTSes+SwdNTvlxZ0IeObjEy7jT4/f+91ejeQQT+ftf/E/mh/gQWuzA3bjSXq9aL+Y4+jYT4Viv6IEeEgQYVxJU69vcTI/WBhIQRFefO+H+mYhEf/XYT9ckDymyde2iRx03qVroIUW2rt1N9JBY0KMbzp+BGHr+keQjj7qBLFULPaTI1rWLHnXcpGptooeIgQRC4TsUTz97Nty+c8vq3wGJrwQgD6nxXtwuehQjE62AHqJ4ixvfRA8xA7m4fy+aRzCR6/efBBoSfRVTLqgQBSGPAmKyRdFDlm9p6+hRSky2/CZ6SCzq4x9zN34CIQ/ZAV/aOnqUEpMtjx6yfEtb30QPMQMJO/d0GT2BREHIo3Qci5VHDzG0VQ2jRxU2sUqb6NHaQEIS6bqc/BxeopiuaRkxmisbJo+VABtXR4/GQFc2hx4rATauvpkekgZyjJE1AyGPxqO9ormcMZNTpqLrplVyYswp0zSoisZyYswpU9F10yo5MeaUaRpURWM5MeaUKe66tYGcOmWIJFCccVmFpZjJo4xhy9Lo0ZLm+rbQYz3Dli2o6yFlIAHKNBmLi+6SGZJHy+Fe1xbjqo6bVC30kCJb166qHpIGUpc+tSAAAQhAwAQBDMSETAQJAQhAoD8CGEh/mhARBCAAARMEMBATMhEkBCAAgf4IYCD9aUJEEIAABEwQwEBMyESQEIAABPojgIH0pwkRQQACEDBBAAMxIRNBQgACEOiPAAbSnyZEBAEIQMAEAQzEhEwECQEIQKA/AhhIf5oQEQQgAAETBDAQEzIRJAQgAIH+CGAg/WlCRBCAAARMEMBATMhEkBCAAAT6I4CB9KcJEUEAAhAwQQADMSETQUIAAhDojwAG0p8mRAQBCEDABAENA9kNw6DRjwZwctGgXNaHdU2sxx/UIoeyMStZWlUL6YV998bVq8Pjqw8CMOm+JEWJk4RcpBEXt29dE+vxe5kXHnTYRAvpRd2LMEGc8LeGL52YiBddrOfhKf6393OkeBfQQQXrOiSE6nlIG4inRddTLuoDTWCRmOZgcfGyHv98x2tRg80WXoH5sMkmFwMpU9LDwrvJUbcMc1Zp6wuw9fi9jCNPeahvcqUNZBNXzFp+6gphIHXcWteyvvhaj9/bzt3LvFZfbzGQsqXNw0DzsHhZz8F6/N4MRH3nXrbsFJVWzUXDQLwcEeOkD5fxT5VZX7ysx+9lPnjKQ3XRLbKDusJqaxUGki+Qmij5IRWX9Lb4Wn1w6+Ek68lA1G/9FM/csgqjIUpveDUMxMPCO04WaUHKxklxaesGYj1+b7d+vMztAwMxPsdVc8FA8tbg+USxuPO1vvh60ODAQFio8iafYim1nbtCTirmjoHkKWl98bIev5cTIAaSN9+2KoWBFJLHQPKAqbh5XihVpazHj4FUya5SydOi62mcjXNe8qQrbSAqSQhPE3bvwoAzm/dggjdOIJKTO5Pr2mIHBuIgHy/jTGXtlTSQ8FbIeBn++Ot8MKWUJLmtndBL9Y/lEcpayWVpYo9jzFAeS7tcq+Mq5uJhnk8nTVqvDJrhdD6M665kHlKLx5L7hTysPXweHzwbHlQ3FiyjudwYU0bzCHrEXft0cyU5ySV2JPs2FzUx9j0pL+NqkzwkDOQgkTR494PKkoEsmscsHwl+EvPdQy4HJ5CpeRjU5MZtH4M5HJ3nht5YfTIHQ6a+WR4SC2BM5vWXvxje/fiF8V9ju5Jx1x7idpDPgYEY1ebg28JeNDGqxTg/luK3ZiBLOVzcvzfcvnPLylsnjq65Ey1ENu+tDWT36fVLw92LT27cf0u/N3SvOt5PdJKPh1zG2z4ONLE+T3Li7/352tkcjBjh2Tz2p1sbBvLwwWsx3rcevTfeipn9rrVpSdzyGR8OOsknGoiDXKKJOMhjZzyHnPi7N5AMDSw8t83RQsQ8JASObhiuB+98OS7sj958Pv4cTiYWTyAO8hlPIMZziQbiYIxZnyc58fc+13NzEFt8G+18c/IQy6H1aWB0ww8/fzryeeXF29NTSes+G+lwo5mDXbvxfFzlknaOhjWxPk9y4u/eQDLGUe85xDslGXmIrbmtG85xw9Z9ihqIg91u4ONl5x4njANNrOeQE3/vi29ODmI794aLVk4eYmuuRMPREee7w/0zEYn+Gmpx0NT4ySUH+YwPoB3kMu66jI+xU/PExMJ1bCwZefh8bhxZeP6RFqzN1lyJBT064vwZiLHnH+OuPfzgKR8nuXgYY6dyMGEgJ8aSlcXXugajgWw1r0UMJGQVdiFPP3tm6bPU85PMje8deMjHiTZx9+hgjC3l0Putn+k8uRG/9PcOBG43HNPAgomf1ELjzR9iBpK+iBMW3ev3n1iaFFNRxls/nvJxksvOQR5LOViaK8fit7T4LuVgKf7xFLIwH8TzkDCQcedufMd+cBvLwW53zMdJLl5PIOKTvuEu3sPufSkHSxqMBrIwr8XzEDOQ4IbpMnwCGRddJ/lEc3eSS9w5Gh9j1nNYil980WpogPFW6MI4spbDZnm0NpCwQKUrvm10fwVB0jUt03gsNG/OUz5ecvGQh/UcrMefNoYe1qpNtZA0kGOruVUDsZ5PDvecMs1durDBnBhzyhR227R4Tnw5ZZoGVdBYTmw5ZQq6bF40J76cMs0DK2wwJ8acMoXd/qx4awM5dcoQS6Iq87JKS7FbzOdUzJby8ZCH9Rysxz8/hcxXBOZDxhopZSBzcSyJkXPSsJ7PNH7LuXjIw3oO1uP3tFapayFpIBn+RREIQAACELBKAAOxqhxxQwACENiYAAaysQB0DwEIQMAqAQzEqnLEDQEIQGBjAhjIxgLQPQQgAAGrBDAQq8oRNwQgAIGNCWAgGwtA9xCAAASsEsBArCpH3BCAAAQ2JoCBbCwA3UMAAhCwSgADsaoccUMAAhDYmAAGsrEAdA8BCEDAKgEMxKpyxA0BCEBgYwIYyMYC0D0EIAABqwQwEKvKETcEIACBjQlgIBsLQPcQgAAErBLAQKwqR9wQgAAENiaAgWwsAN1DAAIQsEpAw0B2gn86V5M7eWjSPt8XepxnpFkCPTRpn+9LRQ9pA9m9cfXq8Pjqg5CudF/nkdaXII96dhI10UOCan2b6FHPTqKmmh7Si7paIhIqTNokD2HAhc2jRyEw4eLoIQy4sHk1PaQNJPyR90sHpxDyKBzBwsXRQxhwYfPoUQhMuLiaHhhInpJqguSFU12KPKrRiVREDxGs1Y2iRyE6aQMJ4SBKoSjCxdFDGHBh8+hRCEy4OHoUAMZA8mExsPJZaZREDw3K+X2gRz4rjZIqemgYSICl9lBHWBnyEAZc2Dx6FAITLo4ewoALmxfXAwMpU0RckLJwqkuTRzU6kYroIYK1ulH0yESnYSBRjHAZ/z4IeWQOKqVi6KEEOrMb9MgEpVRMRQ8MJF9NFUHyw6kuSR7V6EQqoocI1upG0aMAHQaSD4uBlc9KoyR6aFDO7wM98llplFTRQ9JAwrtY4mX8FhZ5aAz3/D686JEyVpno+XirS5JHNTqRiip6SBnIGHxAE559GP02OnmIjO3qRr3occM80jwx+s64G7qQR/UYb1FRTQ8JAzkIPtHYP0AP/1eizxbQ522QhwTV+ja96DEloDbR67GfrenlREgeZ6W+WUBiMY+T4vWXvxje/fiF8d+9gby9/2Z6RajqVchDHfnJDr3ocer0YWl+hDyWDDD8njy2mTvqerQ2kN2n1y8Ndy8+GZ97pKN5+r2REwh5bDMBjvXqRY9zpw9LC++pEyF56M+fTfRobiAPH7wW0b316L0R4ex3rfuUkGpHHhJYq9v0osd4+lggYWnRHU8fR+40WJjjBydB8qibm62FjjvFcD1458sxokdvPh9/DicTSycQ8qgbVAK1vIwrL7evvJwIyWPlZG1uIGnn/uHnT8fQXnnx9vRU0rrPlQgWq487XvKQwFvcphc9xp37nICxtzR4ORGSR/FUPKzQejH3slMkj5UDq3F1L3p4ufXjRQ/yWDlRWxtInCDhFDLfue+fiUj0txLB0erkIUW2rl0Peri5ZcKdhrpBLFRrsxO6xIIeJ8n8GYih5x/jfWryEBrudc16GFfjRP/TP/vD4ccP/3b4+lu/P3zvL//G3C1ennXWDWKhWpudpEQMJEAK3wV5+tmz4fadW1bfwhu/WEQeQkO+vFkPemw20ctxn63h4UTIHZOzMp8uIGYgF/fvRfMIJnL9/pMQhURfK9M/WT0uWOQhibiobQ96bHaroYh0XmEPJ8JoINxpyBN8qZTEou5hpxgHFieQ+oElUNODHq5OIMwPgVFe3+Qm80PMQNi514+ExjU97NxHQ/cwrtKHTNIJPXzM3eKHTDihN56p65rbZJ63NpDwh9zDdRkmerr2t7DCN23DlcqswyVbmzxk+Za27kWP8ZZJeE9cekYYvgVt8EMmQZNLB88IyaN0Nk7KYyDL8LwsWOSxYnIIVt05OEnFhXdho9h6TRGUYdzQkkclZQmxx0VrEpOl00cKmzwqB5VQNS96xFOI8YV3ehfhcmGeW7vTEO+akEf5zJUwkPkCbGUwHaM3nSwWbr+RR/k80KrhceHNGW9afEv7yZnPOWVK+21dPifGnDLFcUkaSHEwVICAcwI5kzinTC+YlmK1FP/SZvfU73rhXmLaonpgIL0PCeLzRuDUhBad7EIgOaELga1sVlUPDKRSJapBYAUBLzv3FQio6oEABuJBRXKwSEB1p2gREDH3TwAD6V8jIoQABCDQJQEMpEtZCAoCEIBA/wQwkP41IkIIQAACXRLAQLqUhaAgAAEI9E8AA+lfIyKEAAQg0CUBDKRLWQgKAhCAQP8EMJD+NSJCCEAAAl0SwEC6lIWgIAABCPRPAAPpXyMihAAEINAlAQykS1kICgIQgED/BDCQ/jUiQghAAAJdEsBAupSFoCAAAQj0TwAD6V8jIoQABCDQJQEMpEtZCAoCEIBA/wQwkP41IkIIQAACXRIQN5CLYdhdD4N4P9J07w3D7omDPNBDeqSUtY8eZbykS6NHGWHRhT2I8bvf/K3hHz7658GyiQTzSHlYNhH0KJsc0qXRQ5pwWfvoUcYrlMZAMphhIBmQFIughyLsjK7QIwOSYhFNPUQNZBiGq4thuHRwCrm6N8nD8CkEPRQnckZX6JEBSbEIehTCxkDygGEgeZy0SqGHFum8ftAjj5NWKTU9pA0kAMPVtYZNXj/okcdJqxR6aJHO6wc98jjFUhhIPiw1V88PqaokE6QKm1gl9BBDW9UwehRg0zCQgU83FCiiUBQ9FCAXdIEeBbAUiqJHPmQMJJ/VoPnphoKwiosyQYqRiVZAD1G8xY2jRz4ycQNJYoSQLH8fJJlHysPqJ7HQI39yaJREDw3K+X2gRz4rlWcgCFImiHRp9JAmXNY+epTxki6NHmWEOYFk8uIEkglKqRh6KIHO7AY9MkEpFdPSQ8xAgpMnVuGLhFZvYQUhlvKwdgsLPZRmbmY36JEJSqkYetSBFjGQ6TEwGYfFb6NPXXyehyUDQY+6ySFVCz2kyNa1ix513ESegczFSKGFB+jhsvJSxbl5zPOwYiDoUT85JGqihwTV+jbRo56dqIHc+43/GZ782y8N6d/9J7DeDt9MXxeyTu1kIEt5PBkGM3mkCYIeOuPmXC/ocY6Q7n9Hj3W8m97CCmL88R99dfirv/7JkJ57pFs/6fcWTiDBPM7lYeEEgh7rJkfr2ujRmui69tBjHb/mJ5AgyLe+8Tsxqr/70T+O0U1/Z8VAzuVhxUDO5YEe6ydRbgvMj1xSOuXQYz1nkRNICOuHP/6/Mbpvf/0X4s/hZGJlwQonkFN5WDGQc3mgx/pJlNtC2vEyP3KJyZZDj/V8mxtI2vH+60//a4zua1/5lfFUYmXBOpeHFQM5lwd6rJ9EuS1Md7zMj1xqcuXQYz3b5gbCjne9KK1aYIfVimSbdtCjDcdWraDHepJNDSSEk1x9vsMKz0Qs7HYT0vAgPezel/KwcPpIeaDH+knSsgX0aElzfVvosY6hiIGEU8j8GYiV5x9TAzmWhzUDQY91k6Rl7bTrZX60pFrfFnrUsws1RQwkNBw+xvvT//jv4Su/9ssm38KbXmEyz8OSeaQTIXqsmyQta6dXZjA/WlKtbws96tmJGshv/vavR/MIJvIv//Tvpm5fBTDJQOZ5WDUQ9Fg3UVrVTgsWerQiuq4d9FjHjxPIEX6cQNYNrNa10aM10XXtocc6fq1rb6WHmIGww2o9ROraY4dVx02qFnpIka1rFz3quKVarQ0kvufqYhgug4Gka38LK7w/KlwW3oUVY7y3kMf+PVim8kCPdZOkYW3mR0OYDZpCj5UQMZBlgBjIyoHVuDp6NAa6sjn0WAmwcfXN9GhtIOPOPOx6E6Trn7291squPYU9ipJ+Yez0cZAHejSesvXNjbte5kc9xIY10WMFTAkDOVi4DBrHHOf0lpuF22/HhgN5rJgoAlXRQwDqiibRowKepIFUhEMVCEAAAhCwQgADsaIUcUIAAhDojAAG0pkghAMBCEDACgEMxIpSxAkBCECgMwIYSGeCEA4EIAABKwQwECtKEScEIACBzghgIJ0JQjgQgAAErBDAQKwoRZwQgAAEOiOAgXQmCOFAAAIQsEIAA7GiFHFCAAIQ6IwABtKZIIQDAQhAwAoBDMSKUsQJAQhAoDMCGEhnghAOBCAAASsEMBArShEnBCAAgc4IYCCdCUI4EIAABKwQwECsKEWcEIAABDojgIF0JgjhQAACELBCAAOxohRxQgACEOiMAAbSmSCEAwEIQMAKAQ0D2Q3DoNGPNHPykCZc1j56lPGSLh3+pvj074pL9yfVvpc8pPgctCu9sO/euHp1eHz1QehUui9JYOQhSbe8bfQoZyZZ4+pPrv5g+P7VD0Iflk3ESx6SWmMgFXRZsCqgCVZBD0G4FU17WXi95FEhYV0V6VNB2I1cOjiFkEfd+JKqhR5SZOvajacOB6cQL3nUqVhRCwPJg8aClcdJqxR6aJHO68fLwusljzzVGpSSNpB0T5RTSAOxGjXB4tsIZKNmPOnBKaTRoLDSDAaSr5SniY6h5+suXdLTuMJApEdLZ+1rGEhImYeefQmPHughQcDLQ2gveUhofNAmBlKGmIW3jJd0afSQJlzWvpeF10seZepVlNYwkDjJw2X8+yDkUTHABKughyDciqbjohsu498H8ZJHhYTlVTCQfGYsWPmsNEqihwbl/D68LLxe8shXbkVJDCQfHgtWPiuNkuihQTm/Dy8Lr5c88pVbURIDyYfHgpXPSqMkemhQzu/Dy8LrJY985VaUlDaQcZIbfwZCHisGmUBV9BCAuqLJcdE1/gzESx4rpCyrKmkg4W2p8XLwEJ0Fq2xcSZdGD2nCZe17WXi95FGm3orSUgayNMFDmG8bfFvnUi7ksWLQrayKHisBNq6+tOiGLqy9lddLHo3lPd2chIEcTPDU/f4jvGYX3n38KR2zeXjRgzxU14lTnXlZeL3koTowtA1Eoj9JYOMX1dJtuNCZwe+zxDyefvZsuH3nVorfrAmSh+SQL2o7Lrqff/ZsePHOrfT9D7OnDwd5FInXonDrBX336fVLw92LT8bnHmnBTb839oel4nOcqXnMdr6t+bXQdKkNbvtIka1r14seXnbtXvKoG40rarVeAHcPH7wWw3nr0XtjWLPfte5zRfonqy6ePgwayNLpY5q4KT1mpw8rsU95L+lhMY+l04e15x7xtLRwirKYh9Q6eLLd1gM3nkDC9eCdL8eOH735fPw5nEwMnUDi6cPBierGbtfo7Tg+ebXJEnG0Uy+fWPKSxyajo7mBpNPGh58/HRN65cXb01NJ6z6lwEUDcXCiGne81+8/sXw7zsvO3UseXnbuXvKQWgc5gVSSHU8gxk9U460446epYx8NT/Ka2ZgYPQHOp5GXnbuXPCqXuXXVJCZdfA4yP4Hsn4lI9LeOwPHaBycQwyeq0UCCLkGH+QKWft/57cWDk1SQbWEhtnCLlBOI1Iyta5cTSB23WEtiQY/PQebPQIw9/whsXJ5AJs+i4gBIz6wM6DMa4cX9ezH28JHkdIWH6+EKt+mExvWKaXZQ1cuzHC87dy95tBqfRe2IGEjaHRr/xMzBzt3wieogj6CN0dOUu5PU5Ds5EvOwaCGoKOxl5+4ljwoJ11eRGLhx5x52iWGCBBMxsCtcInnw7MDwieogj5Co0U/I/Tw8y5GYj+tXieUWjn13IpS29DFYL3lI6Xyy3dYDNg2cyyPffLY0uEIuMY/wzfOFfFqzkxoAB3kYfj51kEc65SZok1fN9K5LzCPFbfQ5zo15nP4aYfgP+79IaGWuBz3S/4aL+3fHeXj9/qfpZ0uGKLWOLLbberKNBpLuU0/uS4dXZ1gZVAnW7kQeVgZXXLBCHuEkaPj51I089s9tog6G3nQw5jF9hhNyeHz1wXMX9+/tjJzY41wPC254jcn0+v7VD64u7t+92i/AvS++XvJQNY7UWWsDmRrEuMvav4XXmnmkeJfymIrV+wRZymM+2Ky8F+vG7t3oe7HixmT+vZxwikq/7/yDAGn8fHRx/+5HwSjmJ5BgLEYMJOTiJQ91E5EwkKWduYVF9hj8U7Fbyisn1pwy6oN01uE0xmPm3nseOe+Ms2DqV+nkNzeQyYnQwsbRSx7qc1PSQNSTEe5wuij1vkAtociJOaeMMOazzefEmFPmbEfCBW68qHPyHMfS7d6Pwg7+yDMQK7d54ynESR7Cw/aweQxEFffmnf08nKYsmMd0YbV6iprfxv3m5BdhMbZkHtNYPeShttBgIGqou+rI+mnK821SSwY4H9SMq66muXwwGIg8Y3qAAAQg4JIABuJSVpKCAAQgIE8AA5FnTA8QgAAEXBLAQFzKSlIQgAAE5AlgIPKM6QECEICASwIYiEtZSQoCEICAPAEMRJ4xPUAAAhBwSQADcSkrSUEAAhCQJ4CByDOmBwhAAAIuCWAgLmUlKQhAAALyBDAQecb0AAEIQMAlAQzEpawkBQEIQECeAAYiz5geIAABCLgkgIG4lJWkIAABCMgTwEDkGdMDBCAAAZcE/h/DFxWBBcUohQAAAABJRU5ErkJggg==",
        "data:image/png;base64,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"
    ],
    starburst: [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAZCAYAAADHXotLAAACC0lEQVRoQ+1aW47DMAhsztDr7uded8+QVaLQdRxgBuxU2dT9qdQ6Bs8DTNXpMV6nITDP87xsPk3TxAahF7IbjnV/CAxCAmrIgBXY/rHu/7Pp/TnTLvlYhwxCIvJ6w9pBSADks8FaUjk7xq1K1lXBYjW1I0MeIvtIuIf8d7Be7kg03EEIqSoWqAMZQfWKGGE8Ift7W/m1vT/XscR9hRySrYsoCfm+xeplDBe4BFjlYKfmaB2wJsQDYhMfTUgvsHbg1wkGwELTrwucACXxRcF1PoZDISn1/oE4LiE7pQlYStLyEQKpflQ9GAIrUMao/S2wQJwXNrWI2HJQlLESN+iQw6E0GwZAcklBykrE2eVv7V+TEogT2p+IAwkxG2GwIXrCcQ9lKIkV4iH/i5NOEWKSElASAlAlpQMZ6oXBKosN56GcQpyHJuRASkPyFjm9Lw5UeSRAQmLqSTpNiHWVjDbyEBlnlkUhYnFLB1Le7pB6Qu89sdczzspFx2kaXlWXeA2ud0uuMiBaQqYdwto2u+51oAIU7bPm/QvX7UjvSQhK0iH+EoSU5bBWjvcdOrda27efLyTOwTkJl5juk59KtBnOiHMZQlAvWg6N1sD+5E3eUiJ7EIJId9x4CUJYpWfXsf2OXefe3hjSByG8uzJOjPQ6tPb2DskCzJZHBLDmau+Z2xOSLXPsc01lTvnP1i+NE/4l1frFKQAAAABJRU5ErkJggg=="
    ],
    explosion: [
        "data:image/png;base64,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"
    ],
    heartContainer: [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAABACAYAAAATffeWAAABEklEQVRYR+2WURLCMAhEwyH1kh4yTqK0GwLb1DqjH/SzwDYl8EDKxUcuxpcUKJmDkjloffRnvVBrrdreIjKcLrJtTuhgRZitC6gDftUGebb2TrxgPcGSjTkx3G1xKfAq5bN5QP+pkGwF2puwH3PLNRLxTjp1Y/Q70Xu3na0zy1HIA9YLmBcKlJXbWep5vOqOMWDFd3nwAAjddjj1Xz7kAQZrklTEq4upnT2BJnQPyJ0CgAAsEi+RXhIpD6yIFVjiAYqgwCkeqIgKfMSDJtIEkgd70Qwoe0NlGCyMB55t2A8YDygr9IoiHkQ7wgabFBj3g9VEIq2nwXIkYlHvjrZIxJsT4X5gRaIhQ/cDFWET6vf7wRNfy3oImG3W6QAAAABJRU5ErkJggg=="
    ], 
    keyIcons: [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAABgCAYAAAAU0fKgAAABjklEQVRYR+1YQQ6DMAwLz9kv+vT+Ys/ZBCWQNoY0BAmQ2JEuxnZSL9pAwc8QrKcXgF4P6PVgvEc3vws5599IM6W0yRQecGGbFQhIAchiLkDPGLwCsCij83MBRlohCawrZKJ03vLEnMQHAnjM2x2knhGGAG2h28T7Sfh9acqD4bOdXDAPuLD1BAEpAFnMBegZ7IJFGZ1XDMIAI62QBNYVMlE6b0ky8+CBAB7zdgepZ4S78sBt4v0kZCp5kHY2GbwfzIUqXAGQ3g9EMb+ZmSA29c+7QRlJOhdg2g8iEpb9IGJitR8cbWPLxD0H1wHIDkgvuiWEAdR+4O1CmEEYoJVAueQBJed+sBTqQFDXXwcKv1W+GT2bwWsAizI4PxmgBEIx7pCE9RatIPVMd5hYB8LBNrZM3HNwHYDsgGEe/nkPA+hAcHYhzCAMoANhnkjn/wdE5Y8H/dFAYMGQxVyAnhX4BoC/uEVZn58NMAWC0O+WsNyiiIlVIBxtY8vEPQfXAfRPIM4DxwhvAKhA8HbhAgl/oMsEcHnMNhUAAAAASUVORK5CYII="
    ],
    chest: [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAACACAYAAABqZmsaAAACX0lEQVR4Xu2bO07EMBCGNyUd0rZ0VFyAnvNwHs5DzwWo6GhXoqMMchRHtnfG83K0kfi3irTz+P2N10nG3ul048904/wnCAABEAABicA8aKFi8/QEzK8vZzb/2/ul+k5hS+biBMwP57vu4L8vv9X3SvurfJSA7shzVguBxqfK2QoQR56DWQk0flveKwG9WpbMPQSS/+pHClChj5SAKkVJQI0/BfKWoPBdclcCtPgLlFtVHL5+AW39swqtiHIeVAQsq978WVtPTxbvxTZGIAnISfN1mIAlAEXA4h8mQAEPC5DW8zLp//4Z7rUOpLjq5XiPe8EiQDsPvHNg9Tvm3fAYJTAvqD4HtgS+cAEv6bE8EFrnCgEgAAIgAAIgAAIgQLZouNdv3SMGb5Ve3Ya1aCJihvQHIgJWX/QHYgTQH/C+Hbfd0kP1CY/xcor+gLHVZu4V9+4FyxwYsMRqQqA/sFHCExEIgAAIgAAIgAAIgAAIgAAIgAAIgICXANfIMMczO6wv9jNzmM0cj3LYu01T5SQFaBtVmmZQadM2qLYzfU2g5TDT6F0TardEFPD8eL9o+/j6OeVr7ahLn3RtEbC1bBOFUoQ2ebIr/bjkHAFWgJaCdvQmAdpStOXq4e8JCJVBi98lQCqDBb9JgOWXkG0l/JKAqgyWX0C27c3+bCOt3eoTlpxAavUrbUUBnpETPmyenoDw6LOQHgVOwND7gXUlHJpcmpA4P1DtnA6a8dowsd1z/L+A4qx9lmTPkGj3jVNy79nywtc/B1IQnB/wEhA3r7XzwDsH8P8CsQTadTRot90C/gBLxNqQAb9CEwAAAABJRU5ErkJggg=="
    ],
    treasure: [
        "data:image/png;base64,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"
    ],
    torch: [
        "data:image/png;base64,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"
    ],
    floorSpikes:[
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPgAAABLCAYAAABdj0rQAAAEnklEQVR4Xu2dbY6zMBCD4WbcrH1vxs1Y0bft8pE0UrOeQTPPSvsr6qQxCY7tFMaBPxAAgbAIjGFHxsBAAASG1wK/D8Ow/tf+lO3K2ut4PtWn7/IVV+KirM31PlzPdYGvgN+GYfhXWeTKdmXt18WujY2+yzd1JS7K2lzvwhqGwdm5lDhcybLK2jB4gcFRKiAAAkERqJls3GXRplsElPNBWTs9o5cWODoJbXpc3CqPhrkmnmsw+J6pYRN2LqF2LuTgQbUXwwKBFQFcdFx0XPRfBJQ7OGXtqtdADk7+f1zgSl2srE0OTg5+IiuXu+rzW9A3el+u99HgSDUQCIwALjoueisrVrezkxHuZMjB9waLKu9FH5a9DjQ5ObipboZNhGxS2QmDuRBzNHhg/cXQQIAcnBycHJwcXPZ7cTSYWIMVfuMP5okwh8FhcBg8OIMjVEAABIIiQA5ODq7OuVv1cdGNXXQ0WiKNxjP5Yj+LEAaHwVsMq26HwY0ZPKgaYVggkA8BDrrku+aMOBECxGTEZMRkwWOy+zzPt2maqi8+ELbTd8XQA/Pim3Z65kvPZx8+RMc16flsV98wOAwOgwdn8ESKhKGCQC4EiMmIydQxWKs+MZlxTOamFzp1TpdWoW88mMM6U64DZe3dOoDBYfAWw6rbYXBjBs8lUhgtCARGABcdFx0XPbiLbqYHSg8f6MgW0dzfnV3geic6ewCDw+AweHAGD6xAGBoI5EYAFx0XXe2St+rjohu76Gi0RBqN/D92/g+Dw+AthlW3w+DGDJ5btDB6EAiEAC46LjouenAXHc2N5t4ucuV8UNZunYtI2TcMDoPD4MEZPJDiYCggAAJbBHDRcdHVLnmrPi66sYueUquQB8fOg7P+DgIGh8FbDKtuh8GNGdxUxCzLsozjWH0+u7JdWXsF8VP9rH2bTi46G9xffDDP8zJNU/V7KNuVtde59al+1r49b2wZ1/tjYXmCnnWiM+7yclPi4jnPnx7AKkdqfxKpsi5wTDUOunDQRbsO7suy3MZxrL5cRNV+uYMuhbvs7s72x+3K2idz6vDd6VtoLlVoUsKSm74+1Xfp212DHy+EcouGLi57HZ6YO2+bw8vy4gL3BN1zstG3vS72xNxznltp8tICR5OjydHkQTS5+0GXP9bULd27a6fv9zo29QMO+wQXbfr8DuH7dtfgnls0+rbfkjtvi8Nr7uMAycE5ZHOa9Mobn7J2y0R1vrm47BbIwb97ecBjq9/x0oaez9L3d9fMFXNVzv2SGrX65OAbQ81Yk5vq3qtm8IU9s5LplLVP/s8VvAZ3DU4O/h8Bz62rZ9/O2+bwmpwcfHOJPSc6facz/Ex2E+Tgv/PKVaN16Hk0OZr8eHd8n30nB9//Ft1MFxvr/cvk/8aa+5K62DKDd9fgbE3tt6aemKO5bWU/OTg5ODn4EwHxzcdEc5cOuqA9OXu+nRfK+aCs3fIiXPsmB6/fRZW6WFn7pP+umkUb+wEuTGapeyubcJdxu2twcnBycK+HbtqqYZ/eyMHJwTlkU1l7ETQ5OTg5uKs2zZr/W2ly9xycXPSNgItGy6pNs4z7B5MC1Nop4xmHAAAAAElFTkSuQmCC"
    ],
    logo: "data:image/png;base64,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"
}
game = newGame();
portrait = window.matchMedia("(orientation: landscape)");
portrait.addEventListener("change", onOrientationChange)
onOrientationChange(window.matchMedia("(orientation: landscape)"));
titleScreen ();
gameLoop(Date.now());

//drawMap(game.screen,game.level);



//exitLevel();