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


const UNALIGNED = 0;
const HEROIC = 1;
const DUNGEON = 2;

const DEFAULT = 0;
const EFFECT = 1;

const PHYSICAL = 0;
const ETHEREAL = 1;

const SCREEN_WIDTH = window.screen.width;
const SCREEN_HEIGHT = window.screen.height;

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
    infoHeight: 50,
};

const palette = {
    doorFrame: "#928e85",
    doorDefaultColor: "#4d3737",
    doorBarColor: "#999"
};

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
        return this.ellipse(x1+translateX, y1+translateY, r1, r2).attr({"stroke-width": thickness, "stroke": strokeColor, "fill": fillColor});
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


            x = (((t.clientX - r.x)/r.width))//*game.constants.controllerRadius*2) - game.constants.controllerRadius;
            y = (((t.clientY - r.y)/r.height))//*game.constants.controllerRadius*2) - game.constants.controllerRadius;// * dimensions.height;
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
            this.elements.push(this.screen.drawEllipse(dPadLeft, centerY, game.constants.controllerRadius, game.constants.controllerRadius,0,0,color,"#000",game.constants.lineThickness));
            color = "#444444";
            this.elements.push(this.screen.drawRect(dPadLeft - game.constants.controllerCrossThickness/2, centerY - game.constants.controllerRadius, game.constants.controllerCrossThickness, game.constants.controllerRadius*2,color, "#000",game.constants.lineThickness))
            this.elements.push(this.screen.drawRect(dPadLeft - game.constants.controllerRadius, centerY - game.constants.controllerCrossThickness/2, game.constants.controllerRadius*2, game.constants.controllerCrossThickness,color, "#000",game.constants.lineThickness))
            this.elements.push(this.screen.drawRect(dPadLeft - game.constants.controllerCrossThickness/2, centerY - game.constants.controllerCrossThickness/2-game.constants.lineThickness/2, game.constants.controllerCrossThickness, game.constants.controllerCrossThickness + game.constants.lineThickness,color, color,0))
            this.elements.push(this.screen.drawLine(dPadLeft - game.constants.controllerCrossThickness/2, centerY - game.constants.controllerCrossThickness/2, dPadLeft + game.constants.controllerCrossThickness/2, centerY + game.constants.controllerCrossThickness/2,"#000",game.constants.lineThickness))
            this.elements.push(this.screen.drawLine(dPadLeft + game.constants.controllerCrossThickness/2, centerY - game.constants.controllerCrossThickness/2, dPadLeft - game.constants.controllerCrossThickness/2, centerY + game.constants.controllerCrossThickness/2,"#000",game.constants.lineThickness))
            var arrowMargin = 4 * game.constants.lineThickness;
            var arrowHeight = 40;
            color = "#303030";
            this.elements.push(this.screen.drawTriangle(
                dPadLeft, centerY - game.constants.controllerRadius + arrowMargin,
                dPadLeft + game.constants.controllerCrossThickness/2 - arrowMargin, centerY - game.constants.controllerRadius + arrowHeight, 
                dPadLeft - game.constants.controllerCrossThickness/2 + arrowMargin, centerY - game.constants.controllerRadius + arrowHeight,  
                0,0, color, "#000",0//game.constants.lineThickness
            ));
            this.elements.push(this.screen.drawTriangle(
                dPadLeft + game.constants.controllerRadius - arrowMargin, centerY,
                dPadLeft + game.constants.controllerRadius - arrowHeight, centerY + game.constants.controllerCrossThickness/2 - arrowMargin, 
                dPadLeft + game.constants.controllerRadius - arrowHeight, centerY - game.constants.controllerCrossThickness/2 + arrowMargin,  
                0,0, color, "#000",0
            ));
            this.elements.push(this.screen.drawTriangle(
                dPadLeft, centerY + game.constants.controllerRadius - arrowMargin,
                dPadLeft + game.constants.controllerCrossThickness/2 - arrowMargin, centerY + game.constants.controllerRadius - arrowHeight, 
                dPadLeft - game.constants.controllerCrossThickness/2 + arrowMargin, centerY + game.constants.controllerRadius - arrowHeight,  
                0,0, color, "#000",0
            ));
            this.elements.push(this.screen.drawTriangle(
                dPadLeft - game.constants.controllerRadius + arrowMargin, centerY,
                dPadLeft - game.constants.controllerRadius + arrowHeight, centerY + game.constants.controllerCrossThickness/2 - arrowMargin, 
                dPadLeft - game.constants.controllerRadius + arrowHeight, centerY - game.constants.controllerCrossThickness/2 + arrowMargin,  
                0,0, color, "#000",0
            ));
            
            
            var el = this.screen.drawEllipse(Math.round(dimensions.width*.75), centerY, game.constants.controllerRadius/2, game.constants.controllerRadius/2,0,0,"#800","#000",game.constants.lineThickness);
            this.elements.push(el);

            var el2 = this.screen.drawEllipse(dPadLeft, centerY, game.constants.controllerRadius, game.constants.controllerRadius,0,0,"90-rgba(200,200,200,0.05)-rgba(0,0,0,0.2):50","#000",game.constants.lineThickness).attr({"opacity":.2})
            this.elements.push(el2);

            var el3 = this.screen.drawRect(0, dimensions.width + dimensions.infoHeight, dimensions.width, dimensions.height-(dimensions.width + dimensions.infoHeight),"#000","#000",game.constants.lineThickness).attr({"opacity":.1})
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
        lastLocation: {
            x: x,
            y: y, 
            r: 0
        },
        animation: {
            index: 0,
            series: 0,
            frame: 0,
            startTime: Date.now()
        },
        setAnimation: function(index,series){
            if (index!=this.animation.index||series!=this.animation.series){
                this.animation.index = index;
                this.animation.series = series;
                this.animation.frame = 0;
                this.animation.startTime = Date.now();
            }
        },
        _buildTranslation: function (x, y, r){
            var tx = Math.round(x - this.animation.frame * this.size.width);
            var ty = Math.round(y - this.animation.series *  this.size.height) + dimensions.infoHeight;
            var t = "t" + tx + "," + ty 
            if(r == 0){
                return t
            }
            var rx = Math.round(this.animation.frame * this.size.width + this.size.width/2);
            var ry = Math.round(this.animation.series *  this.size.height + this.size.height/2);
            return t + "r" + r + "," + rx + "," + ry;
        },
        _buildClipRect: function (){
            var x = Math.round(this.animation.frame * this.size.width) 
            var y = Math.round(this.animation.series * this.size.height)
            var w = this.size.width;
            var h = this.size.height;
            return "" + x + "," + y +"," + w + "," + h;
        },
        _calculateCurrentFrame: function(deltaT) {
            var animdelta = Date.now() - this.animation.startTime;
            var frame = Math.round((animdelta / 1000) * game.constants.spriteFamesPerSecond) % Math.round(this.image.width/this.size.width);
            return frame
        },
        render: function(deltaT){
    
            this.animation.frame = this._calculateCurrentFrame(deltaT);
            
            /*
            if(game.debug){
                if(!this.debugElement){
                    this.debugElement = game.screen.rect(this.location.x, this.location.y + dimensions.infoHeight, this.size.width, this.size.height).attr("stroke", "#F0F");
                    game.screen.onClear(()=>{this.debugElement = null});
                }
                this.debugElement.attr({x:this.location.x, y:this.location.y + dimensions.infoHeight});
            }
            */
    
            if(!this.element){
                this.element = this.screen.image(this.image.frameset[this.animation.index], 0, 0, this.image.width, this.image.height).attr({opacity:0});
                console.log("BAM!")
                this.lastLocation.x = this.location.x;
                this.lastLocation.y = this.location.y;
                this.lastLocation.r = this.location.r;
                this.screen.onClear(()=>{this.element = null});
                this.ready = 1
                this._lastIndex = this.animation.index;
            } 
            if(this._lastIndex != this.animation.index){
                this.element.attr("src",this.image.frameset[this.animation.index]);
                this._lastIndex = this.animation.index;
            }
    
            var trans0 = this._buildTranslation(this.lastLocation.x, this.lastLocation.y, this.lastLocation.r);
            var trans1 = this._buildTranslation(this.location.x, this.location.y, this.location.r);
    
            var rect = this._buildClipRect(); 
            if(this.image.height==1600){
                //console.log(trans0, trans1, rect);
            }

            if (this.element ){
                ready = 0
                this.element.attr({opacity:1}).animate({transform:trans0, "clip-rect": rect},0, 'linear',()=>{
                    if (this.element){        
                        this.element.animate({transform:trans1, "clip-rect": rect}, deltaT, 'linear',()=>{
                            this.ready = 1
                        });
                    }
                })
            }   
    
            this.lastLocation.x = this.location.x;
            this.lastLocation.y = this.location.y;
            this.lastLocation.r = this.location.r;
            
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
        health: 0,
        maxHealth: 0,
        damage: 0,
        _attackDuration: 500,
        _attackCooldown: 1000,
        _hurtDuration: 500,
        _stateStart: Date.now(),
        controller: newControllerBase(),
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
            if(this.state == DYING){
                if(Date.now()-this._stateStart < this._hurtDuration*2){
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
                    this.box.x + Math.round(input.x * this.speed * multiplier * deltaT/1000),
                    this.box.y + Math.round(input.y * this.speed * multiplier * deltaT/1000)
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
    
        },
        hurt: function(damage, knockback){
            this.health -= damage;
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
        },
        canAttack: function(){
            if(!this._lastAttack || Date.now() - this._lastAttack > this._attackCooldown){
                return true;
            }
            return false;
        },
        attack: function(){
            console.warn("unimplemented: attack()");
        },
        getObjectsInRangeOfAttack: function(){
            console.warn("unimpelmented: getObjectsInRangeOfAttack()");
            return [];
        },
        render: function(deltaT){
            console.warn("unimpelmented: render()");
            this.box.render("#F0F");
        },
        remove: function(){
            console.warn("unimpelmented: remove()");
            this.box.remove();
        }

    }
}

function newStarburst(){
    starburst = newGameObject();
    starburst.box.width = 25;
    starburst.box.height = 25;
    starburst.layer = DEFAULT;
    starburst.plane = ETHEREAL;
    starburst.render = function(deltaT){
        if( this.state == DEAD){
            return;
        }
        if(!this.sprite){
            this.sprite = newSprite(game.screen, images.starburst, 100, 25, 25, 25, this.box.x, this.box.y);
            this.sprite.setAnimation(0,0);
             this.sprite.location.r = Math.round(Math.random() * 360);
        }
        this.sprite.render(deltaT);   
        if( this.sprite.element){
            this.sprite.element.toFront();

        }
    }
    starburst.move = function(deltaT){
        if(Date.now()-this._stateStart>250){
            this.setState(DEAD);
        }
    }    
    starburst.remove = function(deltaT){
        if(this.sprite){
            this.sprite.remove();
            this.sprite = null;
        }
    }
    return starburst;
}

function newAdventurer(controller){
    var adventurer = newGameObject();
    adventurer.controller = controller;
    adventurer.box.x = Math.round(dimensions.width / 2)-25;
    adventurer.box.y = Math.round(dimensions.width / 2)-25;
    adventurer.box.width = 50;
    adventurer.box.height = 50;
    adventurer.direction = SOUTH; //init facing the player
    adventurer.team = HEROIC;
    adventurer.keys = 0;
    adventurer.speed = 150; //in px/sec
    adventurer.damage = 10;
    adventurer.health = 30;
    adventurer.maxHealth = 30;
    adventurer._attackDuration = 250;
    adventurer.whip = {
        thickness: 5,
        length: 150
    }


    adventurer.render = function(deltaT){
        framestart = Date.now()
        if(!this.sprite){
            this.sprite = newSprite(game.screen, images.adventurer, 800, 500, 100, 100, 0, 0);
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
                        this.whip.element = game.screen.drawRect(this.whip.box.x+10,  Math.round(this.whip.box.y + this.whip.box.height/2)-2 + dimensions.infoHeight, Math.abs(this.whip.box.width-10), 3, "#624a2e","#000", 2)
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
        this.sprite.setAnimation(this.direction, this.state);
        this.sprite.location.x = this.box.x-25;
        this.sprite.location.y = this.box.y-50;
        this.sprite.render(deltaT);
        if(this.sprite.element){
            this.sprite.element.toFront();
        }

    };
    adventurer.remove = function(deltaT){
        if(this.sprite){
            this.sprite.remove();
            this.sprite = null;
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
            if(obj!=this && obj.plane==PHYSICAL){
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
            this.setState(ATTACKING);
           
            targets = this.getObjectsInRangeOfAttack(); 
            if(targets.length>0){
                collidingWith = targets[0];
                sb = newStarburst();
                game.currentRoom.objects.push(sb);
                collidingWith.hurt(this.damage, this.direction);
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

    return adventurer;
}

function newCaveSpider(controller){
    var spider = newGameObject();
    spider.box.x = Math.round(dimensions.width / 2)-100;
    spider.box.y = Math.round(dimensions.width / 2)-100;
    spider.box.width = 75;
    spider.team = DUNGEON;
    spider.direction = EAST;
    spider.controller = controller;
    spider.speed = 225;
    spider.health = 20;
    spider.maxHealth = 20;
    spider.damage = 10;
    spider.attackduration = 500;
    spider.render = function(deltaT){
        if(!this.sprite){
            this.sprite = newSprite(game.screen, images.caveSpider, 800, 500, 100, 100, 0, 0);
        }
        if(game.debug){
           this.box.render("#FFF");
        } 
        
        this.sprite.location.x = this.box.x-15;
        this.sprite.location.y = this.box.y-40;
        this.sprite.setAnimation(this.direction, this.state);
        this.sprite.render(deltaT);
        if(this.sprite.element){
            this.sprite.element.toFront();
        }
    };
    spider.attack = function(){
        if(this.state != ATTACKING){
            this.setState(ATTACKING);
        }
        opposingTeam = getOpposingTeam(this.team)
        targets = spider.getObjectsInRangeOfAttack();
        targets.forEach((o)=>{
            if(o.team == opposingTeam){
                o.hurt(this.damage);
            }
        });
    };
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
        if(game.debug){
            this.box.remove();
        }
    };

    
    return spider;
}

function newGame() {
    return {
        constants: {
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
            controllerRadius: 175,
            controllerCrossThickness: 70,
        },
        //debug: true, 
        isFullScreen: false,
        screen: newScreen("main"),
        player: newAdventurer(),
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

    var gameElement = game.screen.rect(0, 0, dimensions.width, dimensions.height).attr({"fill":"#080808"});

}

function newLevel(){
    //TODO: Refactor
    game.level = {
        number: 0,
        doorCount: 0,
        maxRooms: 10,
        rooms:[], 
        palette: {
            clipColor:"#642",
            wallColor: "#864",
            floorColor: "#048",    
        },
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
        }
    };
    generateMap(game.level);
    return game.level;
}

function generateMap(level){
    //generate the first room.
    enterance = getRoom(0,0);
    //var x = level.rooms.length;
    while(!level.rooms[level.rooms.length-1].mapped){
        loopRooms = []
        level.rooms.forEach((room)=>{
            if(!room.mapped){
                loopRooms.push(room);
            }
        })
        loopRooms.forEach((room)=>{
            room.mapped = 1;
            room.doors.forEach((door)=>{
                switch(door.wall){
                    case NORTH:
                        getRoom(room.x,room.y-1);
                        break;
                    case EAST:
                        getRoom(room.x+1,room.y);
                        break;
                    case SOUTH:
                        getRoom(room.x,room.y+1);
                        break;
                    case WEST:
                        getRoom(room.x-1,room.y);
                        break;
                        
                }
            })
        });
    }

    console.log({rooms:level.rooms.length});

    level.rooms[0].palette.floorColor="#064";
    //level.rooms[level.rooms.length-1].palette.floorColor="#800";
    exitRoom = level.rooms[level.rooms.length-1];
    exitRoom.opened = 0;
    exitRoom.exit = 1;
    enemies = [];
    exitRoom.objects.forEach((o)=>{
        if(o.team==DUNGEON){
            enemies.push(o);
        }
    })
    enemies.forEach((e)=>{
        exitRoom.objects.splice(exitRoom.objects.indexOf(e),1);
    })
    

    var singleDoorRooms = [];
    level.rooms.forEach((room)=>{
        if(room.doors.length == 1 && room.opened == 1){
            singleDoorRooms.push(room);
        }
    })
    keyRoom = level.rooms[level.rooms.length-2];
    if (singleDoorRooms.length>0){
        index = Math.round((singleDoorRooms.length-1) * Math.random());
        keyRoom = singleDoorRooms[index]
    }
    //console.log(index);
    //console.log(singleDoorRooms);
    keyRoom.palette.floorColor = "#880";
    keyRoom.keys = 1;
}

function getRoom(x, y){
    foundRoom = game.level.findRoom(x,y);
    if(foundRoom) return foundRoom;
    return generateRoom(x, y);
}

function generateRoom(x, y){
    room = newRoom();
    room.x = x;
    room.y = y;
    room.palette.floorColor = game.level.palette.floorColor;
    room.palette.clipColor = game.level.palette.clipColor;
    room.palette.wallColor = game.level.palette.wallColor;
    
    room.box.width = Math.round((((game.constants.roomMaxWidthInBricks - game.constants.roomMinWidthInBricks) * Math.random()) + game.constants.roomMinWidthInBricks)) * game.constants.brickWidth;
    room.box.height = Math.round((((game.constants.roomMaxHeightInBricks - game.constants.roomMinHeightInBricks) * Math.random()) + game.constants.roomMinHeightInBricks)) * game.constants.brickWidth;
    
    //center by default
    room.box.x = Math.round((dimensions.width - room.box.width - room.wallHeight*2) / 2) + room.wallHeight;
    room.box.y = Math.round((dimensions.width - room.box.height - room.wallHeight*2) / 2) + room.wallHeight;

    //force doors
    for(wall = 0; wall<4; wall++){
        oppositeWall = (wall + 2) % 4;
        neighbor = game.level.findNeighbor(room, wall);

        if(neighbor){
            neighboringDoor = neighbor.findDoor(oppositeWall);
            if(neighboringDoor){
                offset = 0;
                doorPadding = game.constants.doorFrameThickness + game.constants.doorWidth/2 + game.constants.brickWidth/2;
                switch (wall){
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
                        break;
                }

                room.doors.push(newDoor(room, wall, offset));    
            }
        }
    }
    do {
        for(wall = 0; wall<4; wall++){
            door = room.findDoor(wall)
            //add new door/room
            if(!door && game.level.findNeighbor(room, wall)==null && game.level.doorCount<game.level.maxRooms && Math.round(Math.random())==1){
                game.level.doorCount++;
                offset = 0;
                sideSize = wall % 2== 0 ? room.box.width : room.box.height;
                sideSize -= game.constants.brickWidth*2 
                sideSize -= Math.round(game.constants.doorWidth/2)
                offset = Math.round(Math.random() * sideSize) - (sideSize/2)
                opened = 1;
                room.doors.push(newDoor(room, wall, offset));
            }
        }
    } while (room.doors.length == 0 || room.doors.length == 1 && game.level.doorCount<game.level.maxRooms)
    
    if(!(x==0 && y==0)){
        minArea = game.constants.roomMinHeightInBricks * game.constants.roomMinWidthInBricks * game.constants.brickWidth * game.constants.brickWidth;
        maxArea = game.constants.roomMaxHeightInBricks * game.constants.roomMaxHeightInBricks * game.constants.brickWidth * game.constants.brickWidth ;
        thresholds = Math.round((maxArea-minArea) / 4);
        roomArea = room.box.width * room.box.height;
        numberOfEnemies = Math.round((roomArea-minArea) / thresholds)
        console.log({minArea: minArea, maxArea: maxArea, thresholds: thresholds, roomArea: roomArea, numberOfEnemies: numberOfEnemies})
        for(i=0; i<numberOfEnemies; i++){
            enemy = newCaveSpider(newRandomController());
            enemy.box.x = room.box.x + Math.round(Math.random() * (room.box.width-enemy.box.width));
            enemy.box.y = room.box.y + Math.round(Math.random() * (room.box.width-enemy.box.width));
            //TODO: constrain, somehow?
            room.objects.push(enemy);
        }
    }
    //new doors
    game.level.rooms.push(room);
    return room;
}

function newRoom(){
    return { 
        x:0, //map address
        y:0, //map address
        box: newBox(0,0,400,600),
        opened:1,
        barred:0,
        mapped:0,
        wallHeight: game.constants.brickHeight * 5,
        doors:[],
        objects:[],
        palette: {
            clipColor:"#642",
            wallColor: "#864",
            floorColor: "#048",    
        },
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
                "stroke-width": game.constants.lineThickness
            })


            //render floor
            game.screen.rect(
                this.box.x,
                this.box.y + dimensions.infoHeight, 
                this.box.width, 
                this.box.height
            ).attr({
                fill: this.palette.floorColor,
                "stroke-width": game.constants.lineThickness
            })

            //render each wall
            renderBricks(this)

            //render doors
            this.doors.forEach((door)=>door.render());

            centerX = this.box.x + this.box.width/2
            centerY = this.box.y + this.box.height/2

            //TODO: move exit to become an object?
            if(this.exit){
                //render exit

                exitWidth = game.constants.doorWidth;
                exitHeight = game.constants.brickWidth * 2;

                game.screen.drawRect(centerX - (exitWidth + game.constants.doorFrameThickness*2)/2, centerY -  (exitHeight + game.constants.doorFrameThickness)/2,  (exitWidth + game.constants.doorFrameThickness*2),  (exitHeight + game.constants.doorFrameThickness), palette.doorFrame, "#000", game.constants.lineThickness);
                game.screen.drawRect(centerX - exitWidth/2, (centerY - exitHeight/2)+game.constants.doorFrameThickness/2,  exitWidth,  exitHeight, "#000", "#000", game.constants.lineThickness);

                steps = 6;
                for(step = steps; step>0; step--){
                    stepWidth = exitWidth - step * 4;
                    stepThickness = game.constants.brickHeight+2 - step
                    game.screen.drawRect(centerX - stepWidth/2, (centerY + exitHeight/2)+game.constants.doorFrameThickness/2-stepThickness*step,  stepWidth,  stepThickness, "#888", "#000", game.constants.lineThickness).attr({opacity:(steps-step)/steps});
                //break;
                }
            }

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
                if(gameObject!=gameObject2){
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
            allowance = Math.round((game.constants.doorWidth/2)+game.constants.doorFrameThickness);
            for(d=0;d<this.doors.length;d++){
                door = this.doors[d];
                if(!door.opened && game.player.keys>0 && game.player.box.inside(door.box)){
                    door.opened = 1;
                    game.player.keys--;
                    game.level.findNeighbor(this, door.wall).opened=1;
                    clearScreen();
                    this.render();
                } else if(!door.opened) {
                    return constrained;
                }
                switch(door.wall){  
                    case NORTH:
                        if(game.player.box.inside(door.box) ){
                            if(y2<y1) constrained.x = door.box.center().x - Math.round(game.player.box.width/2);
                            constrained.y = y2;
                            if (game.player.box.collidesWith(door.trip)){
                                openNextRoom(door.wall);
                                return null;
                            }
                        }
                        break;

                    case EAST:

                        if(game.player.box.inside(door.box) ){
                            if(x2>x1) constrained.y = door.box.center().y;
                            constrained.x = x2;
                            if (game.player.box.collidesWith(door.trip)){
                                openNextRoom(door.wall);
                                return null;
                            }
                        }
                        break;
                    case SOUTH:
                        if(game.player.box.inside(door.box) ){
                            if(y2>y1) constrained.x = door.box.center().x - Math.round(game.player.box.width/2);
                            constrained.y = y2;
                            if (game.player.box.collidesWith(door.trip)){
                                openNextRoom(door.wall);
                                return null;
                            }
                        }
                        break
                    case WEST:
                        if(game.player.box.inside(door.box) ){
                            if(x2<x1) constrained.y = door.box.center().y;
                            constrained.x = x2;
                            if (game.player.box.collidesWith(door.trip)){
                                openNextRoom(door.wall);
                                return null;
                            }
                        }
                        break;
                }
            };

            return constrained;
        }
    };
}

function renderBricks(room){
    color="#000";
    rows = room.box.height/game.constants.brickHeight;
    
    //NORTHERN WALL
    //determine focal point / offset
    focus={};
    focus.x =  room.box.width / 2
    focus.y = trig.cotangent(trig.degreesToRadians(45)) * focus.x;
    
    offset={};
    offset.x = focus.x + room.box.x;
    offset.y = focus.y + room.box.y + dimensions.infoHeight;
    
    game.screen.drawAngleSegmentX(trig.degreesToRadians(225), -room.box.width/2-room.wallHeight, -room.box.width/2, offset.x, offset.y, color, game.constants.lineThickness);

    row = 1;
    for(y = 0; y<room.wallHeight; y+=game.constants.brickHeight){
        y1 = -(room.box.width)/2 - room.wallHeight + y;
        y2 = y1 + game.constants.brickHeight
        column = 0;
    
        for(x = game.constants.brickWidth/2; x < room.box.width ; x += game.constants.brickWidth/2){
            angle = trig.pointToAngle(room.box.width / 2, room.box.width / 2 - x);
            
            if(column % 2 == row % 2){
                game.screen.drawAngleSegmentY(angle, y1, y2, offset.x, offset.y, color, game.constants.lineThickness);
                //break;
            }
            //break;
            column ++;
        }
        if(row>1){
            game.screen.drawLine(Math.round(trig.cotangent(trig.degreesToRadians(225)) * y1)+offset.x, y1 + offset.y, Math.round(trig.cotangent(trig.degreesToRadians(315)) * y1)+offset.x, y1+offset.y, color, game.constants.lineThickness);
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

    game.screen.drawAngleSegmentX(trig.degreesToRadians(225), room.box.width/2+room.wallHeight, room.box.width/2, offset.x, offset.y, color, game.constants.lineThickness);

    row = 1;
    for(y = 0; y<room.wallHeight; y+=game.constants.brickHeight){
        y1 = (room.box.width)/2 + room.wallHeight - y;
        y2 = y1 - game.constants.brickHeight
        column = 0;
    
        for(x = game.constants.brickWidth/2; x < room.box.width ; x += game.constants.brickWidth/2){
            angle = trig.pointToAngle(room.box.width / 2, room.box.width / 2 - x);
            
            if(column % 2 == row % 2){
                game.screen.drawAngleSegmentY(angle, y1, y2, offset.x, offset.y, color, game.constants.lineThickness);
                //break;
            }
            //break;
            column ++;
        }
        if(row>1){
            game.screen.drawLine(Math.round(trig.cotangent(trig.degreesToRadians(225)) * y1)+offset.x, y1 + offset.y, Math.round(trig.cotangent(trig.degreesToRadians(315)) * y1)+offset.x, y1+offset.y, color, game.constants.lineThickness);
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

    game.screen.drawAngleSegmentY(trig.degreesToRadians(135), room.box.height/2+room.wallHeight, room.box.height/2, offset.x, offset.y, color, game.constants.lineThickness);

    row = 0;
    for(x = 0; x<room.wallHeight; x+=game.constants.brickHeight){
        x1 = -room.box.height/2 - room.wallHeight + x;
        x2 = x1 + game.constants.brickHeight;
        column = 0;
        //game.screen.drawLine(x1+ offset.x, 0, x2+offset.x, dimensions.height, "#FF0", game.constants.lineThickness);
    
        for(y = game.constants.brickWidth/2; y < room.box.height ; y += game.constants.brickWidth/2){
            angle = trig.pointToAngle(-room.box.height / 2+y, -room.box.height / 2);
            
                if(column % 2 == row % 2){
                    game.screen.drawAngleSegmentX(angle, x1, x2, offset.x, offset.y, color, game.constants.lineThickness);
                    //break;
                }
            //break;
            column ++;
        }
        if(row>0){
        //    game.screen.drawLine(Math.round(trig.cotangent(trig.degreesToRadians(135)) * y1)+offset.x, y1 + offset.y, Math.round(trig.cotangent(trig.degreesToRadians(225)) * y1)+offset.x, y1+offset.y, color, game.constants.lineThickness);
            game.screen.drawLine(x1 + offset.x, Math.round(trig.tangent(trig.degreesToRadians(135))*x1)+offset.y, x1 + offset.x, Math.round(trig.tangent(trig.degreesToRadians(225))*x1)+offset.y, color, game.constants.lineThickness);
        
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

    game.screen.drawAngleSegmentY(trig.degreesToRadians(315), -room.box.height/2-room.wallHeight, -room.box.height/2, offset.x, offset.y, color, game.constants.lineThickness);
    
    row = 0;
    for(x = 0; x<room.wallHeight; x+=game.constants.brickHeight){
        x1 = room.box.height/2 + x;
        x2 = x1 + game.constants.brickHeight;
        column = 0;
        //game.screen.drawLine(x1+ offset.x, 0, x2+offset.x, dimensions.height, "#FF0", game.constants.lineThickness);
    
        for(y = game.constants.brickWidth/2; y < room.box.height ; y += game.constants.brickWidth/2){
            angle = trig.pointToAngle(-room.box.height / 2+y, -room.box.height / 2);
            
                if(column % 2 == row % 2){
                    game.screen.drawAngleSegmentX(angle, x1, x2, offset.x, offset.y, color, game.constants.lineThickness);
                    //break;
                }
            //break;
            column ++;
        }
        if(row>0){
        //    game.screen.drawLine(Math.round(trig.cotangent(trig.degreesToRadians(135)) * y1)+offset.x, y1 + offset.y, Math.round(trig.cotangent(trig.degreesToRadians(225)) * y1)+offset.x, y1+offset.y, color, game.constants.lineThickness);
            game.screen.drawLine(x1 + offset.x, Math.round(trig.tangent(trig.degreesToRadians(135))*x1)+offset.y, x1 + offset.x, Math.round(trig.tangent(trig.degreesToRadians(225))*x1)+offset.y, color, game.constants.lineThickness);
        }
        row++;
    }

}

function newDoor(room, wall, offset){
    door = {
        room: room,
        wall: wall % 4,
        color: palette.doorDefaultColor,
        offset: offset, 
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
            x1 = this.offset - game.constants.doorWidth/2 - game.constants.doorFrameThickness;
            y1 = -focus.x;
            x4 = this.offset + game.constants.doorWidth/2 + game.constants.doorFrameThickness;
            y4 = -focus.x;
            y2 = y1 - game.constants.doorHeight - game.constants.doorFrameThickness;
            x2 = trig.cotangent(trig.pointToAngle(y1,x1)) * y2;
            y3 = y4 - game.constants.doorHeight - game.constants.doorFrameThickness;
            x3 = trig.cotangent(trig.pointToAngle(y4,x4)) * y3;
            this.elements.push(game.screen.drawPoly(x1,y1,x2,y2,x3,y3,x4,y4,offset.x,offset.y,palette.doorFrame,"#000",game.constants.lineThickness));
        
        
            //DOOR
            x1 = this.offset - game.constants.doorWidth / 2;
            y1 = -focus.x;
            x4 = this.offset + game.constants.doorWidth / 2;
            y4 = -focus.x;
            dy2 = y1 - game.constants.doorHeight;
            dx2 = trig.cotangent(trig.pointToAngle(y1,x1)) * dy2;
            dy3 = y4 - game.constants.doorHeight;
            dx3 = trig.cotangent(trig.pointToAngle(y4,x4)) * dy3;
            
            this.opened = game.level.findNeighbor(room, this.wall).opened;
            this.elements.push(game.screen.drawPoly(x1,y1,dx2,dy2,dx3,dy3,x4,y4,offset.x,offset.y,this.opened ? "#000" : this.color,"#000",game.constants.lineThickness));
        
            
            if (this.opened){
                //THRESHOLD
        
                x1 = this.offset - game.constants.doorWidth/2 ;
                y1 = -focus.x + game.constants.lineThickness;
                x4 = this.offset + game.constants.doorWidth/2;
                y4 = -focus.x + game.constants.lineThickness;
                y2 = y1 - game.constants.thresholdDepth;
                if (x1 > 0){
                    x2 = trig.cotangent(trig.pointToAngle(y1,x1)) * y2;        
                }else {
                    x2 = x1 - ((trig.cotangent(trig.pointToAngle(y1,x1)) * y2)-x1)/3;
                }
                
                y3 = y4 - game.constants.thresholdDepth;
                if (x4 < 0){
                    x3 = trig.cotangent(trig.pointToAngle(y4,x4)) * y3;      
                }else {
                    x3 = x4 - ((trig.cotangent(trig.pointToAngle(y4,x4)) * y3)-x4)/3;
                }
                this.elements.push(game.screen.drawPoly(x1,y1,x2,y2,x3,y3,x4,y4,offset.x,offset.y,"90-" +this.room.palette.floorColor+ ":5-#000:95","#000",0));                
            } else {
                //KEYHOLE
        
                x0 = this.offset;
                y0 = -focus.x;
                
                y1 = -focus.x - game.constants.doorHeight/5;
                x1 = (trig.cotangent(trig.pointToAngle(y0,x0)) * y1) - game.constants.doorWidth/12;
                
                y4 = -focus.x - game.constants.doorHeight/5;
                x4 = (trig.cotangent(trig.pointToAngle(y0,x0)) * y1) + game.constants.doorWidth/12;
        
                y2 = y1 - 16;
                x2 = (trig.cotangent(trig.pointToAngle(y0,x0)) * y2) -1 ;        
                y3 = y4 - 16;
                x3 = (trig.cotangent(trig.pointToAngle(y0,x0)) * y3) +1; 
        
                this.elements.push(game.screen.drawPoly(x1,y1,x2,y2,x3,y3,x4,y4,offset.x,offset.y,"#000","#000",0));
                
                this.elements.push(game.screen.drawEllipse( (trig.cotangent(trig.pointToAngle(y0,x0)) * y3), y3, 8, 4,offset.x,offset.y,"#000","#000",0));
        
                
            }
        
            if(this.room.barred){
                
                bars = 5;
            
                for(i=1;i<bars; i++){
                    x0 = (this.offset - game.constants.doorWidth/2) + (game.constants.doorWidth/bars) * i;
                    y0 = -focus.x - (this.opened ? game.constants.doorFrameThickness : 0) //-this.room.box.width/2;
                    y1 = y0-game.constants.doorHeight + (this.opened ? game.constants.doorFrameThickness : 0);
                    x1 = (trig.cotangent(trig.pointToAngle(y0,x0)) * y1);                    
                    this.elements.push(game.screen.drawLine(x0, y0, x1, y1, palette.doorBarColor, game.constants.lineThickness));
                 
                }
                this.elements.push(game.screen.drawLine(dx2, dy2, dx3, dy3, "#000", game.constants.lineThickness));
              
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
            /*
            if (game.debug && this.box ){
                this.box.render("#0FF");
            }
            if (game.debug && this.trip ){
                this.trip.render("#F00");
            }
            */
        }
    }

    switch(wall){
        case NORTH:
            door.box = newBox(
                room.box.x + room.box.width / 2 + offset - game.constants.doorWidth/2,
                room.box.y - room.wallHeight,
                game.constants.doorWidth,
                room.wallHeight + game.player.box.height * 1.25
            );
            door.trip = newBox(
                room.box.x + room.box.width / 2 + offset - game.constants.doorWidth/2,
                room.box.y - game.player.box.height - 25,
                game.constants.doorWidth,
                game.player.box.height  
            );
            break;
        case EAST:
            door.box = newBox(
                room.box.x + room.box.width - game.player.box.width * 1.25,
                room.box.y + room.box.height / 2 + offset - game.constants.doorWidth/2,
                room.wallHeight + game.player.box.width * 1.25,
                game.constants.doorWidth
            );
            door.trip = newBox(
                room.box.x + room.box.width + 35,
                room.box.y + room.box.height / 2 + offset - game.constants.doorWidth/2,
                game.player.box.width,
                game.constants.doorWidth
            );
            break;
        case SOUTH:
            door.box = newBox(
                room.box.x + room.box.width / 2 - offset - game.constants.doorWidth/2,
                room.box.y + room.box.height - room.wallHeight,
                game.constants.doorWidth,
                room.wallHeight + game.player.box.height * 1.25
            );
            door.trip = newBox(
                room.box.x + room.box.width / 2 - offset - game.constants.doorWidth/2,
                room.box.y + room.box.height + 35,
                game.constants.doorWidth,
                game.player.box.height  
            );
            break;
        case WEST:
            door.box = newBox(
                room.box.x - room.wallHeight,
                room.box.y + room.box.height / 2 - offset - game.constants.doorWidth/2,
                room.wallHeight + game.player.box.width * 1.25,
                game.constants.doorWidth
            );
            door.trip = newBox(
                room.box.x - room.wallHeight,
                room.box.y + room.box.height / 2 - offset - game.constants.doorWidth/2,
                game.player.box.width,
                game.constants.doorWidth
            );
            break;
            
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
                y : room.box.y - game.constants.doorHeight + game.constants.doorFrameThickness + game.player.box.height
            };
        case EAST: 
            return {
                x : room.box.x + room.box.width - game.player.box.width, 
                y : game.player.box.y//room.box.y + room.wallHeight - game.constants.doorHeight/2
            };
        
        case SOUTH:
            return {
                x : game.player.box.x,//room.box.x + room.wallHeight + door.offset + room.box.width/2,
                y : room.box.y + room.box.height - game.player.box.height/2
            };
        case WEST: 
            return {
                x : room.box.x + game.player.box.width/2,
                y : game.player.box.y//room.box.y + room.wallHeight - game.constants.doorHeight/2
            };
        
        default:
            console.warn("unexpected wall: " + wall)
            return {x:0, y:0};
    }
}

function gameLoop(lastTime){
    var startTime = Date.now();
    var deltaT = Math.round(startTime-lastTime);
    
    //Move objects and collected the dead ones.
    var deadObjects = [];
    game.currentRoom.objects.forEach((o)=>{
        if(o.state != DYING || o.state != DEAD){
            o.move(deltaT);
        }
        if(o.state == DEAD){
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
        console.log({barred:barred})
        game.currentRoom.barred = barred;
        game.currentRoom.render();
    }

    //Sort List of objects in current room by their y values.
    game.currentRoom.objects.sort((a,b)=>{return a.layer < b.layer ? -1 : a.layer > b.layer ? 1 : a.box.y < b.box.y ? -1 : a.box.y > b.box.y ? 1 : 0;})

    //Render all objects in current room in order. 
    game.currentRoom.objects.forEach((o)=>o.render(deltaT));
    
    //remove the dead objects.
    deadObjects.forEach((o)=>{
        game.currentRoom.objects.splice(game.currentRoom.objects.indexOf(o),1)
        o.remove();
    });

    //Render our controller
    game.player.controller.render();//TODO: find a better way to reference this. 

    window.setTimeout(()=>gameLoop(startTime), 50);
    
}

function openNextRoom(direction){
    if(game.currentRoom.findDoor(direction)){
        nextRoom = game.level.findNeighbor(game.currentRoom, direction);
        
        if(nextRoom.opened){
            nextRoom.objects.push(game.player);
            game.currentRoom.objects.splice(game.currentRoom.objects.indexOf(game.player),1);
            game.currentRoom = nextRoom;
            if(game.currentRoom.keys>0){
                game.player.keys += game.currentRoom.keys;
                game.currentRoom.keys = 0;
            }
            //entrance = game.currentRoom.findDoor((direction + 2) % 4);
            loc = getEntranceLocation(nextRoom,(direction + 2) % 4)
            game.player.box.x = loc.x;//game.currentroom.box.x + game.currentroom.box.width / 2;
            game.player.box.y = loc.y;//game.currentroom.box.y + game.currentroom.box.height / 2;
        
            game.player.sprite.lastLocation.x = loc.x;
            game.player.sprite.lastLocation.y = loc.y;
            
        
        }
        clearScreen();
        game.currentRoom.render();
    }
}

function onOrientationChange(e) {
    if(e.matches) {
        document.getElementById("controller").style.display = "block";    
        game.screen.setViewBox(0, 0, dimensions.width, dimensions.height, true);  
    } else {
        document.getElementById("controller").style.display = "none";
        game.screen.setViewBox(0, 0, dimensions.width, dimensions.width + dimensions.infoHeight, true);
    }
}

//images
images = {
    adventurer: [
        "data:image/png;base64,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"
        , "data:image/png;base64,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"
        , "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAD6CAYAAACPpxFEAAAgAElEQVR4Xu1dQegeRZbv/1xmlh0lxJEkLMPGxYg5GLJmYchl0GECoie9LAwOKzkJe/PkRVzx4mW9LXhZcVlZ2IueDEIGFS9B2LghHhQT1izDEsUxBJ1ld1iYb3nd/Tqv66vurqr3qqu+z9930Py/r6q63vv93vtVVXdXHTT4wAPwADwAD8ADCR44SKizVGUjCrjtz/221O7av8OOtT0+fz3gATxyeAC8UnjVWkBaMM4/fqq58eW3zXsf3xh17RcPH2+OH727/e71C1fpf9bXV7hiVBV2WHnSph3gYeNHq1aAh5Unbdophod1At+QePCHRER+WDx2QUBghw2zjVoBr4wcadQM8DBypFEzxfDIIiAkHCwWLCLyb/p37TMQnkXBDiOK65ppAwS80jnRsDbwMHSmQVPF8LAUkEEFXdFwZySVL2PBDgNGGzYBPAydadAU8DBwomETRfEwF5CpZSvf95XOQgY19y2/wQ5D6oc1BTzC/LRWKeCxlqfDrlMUD42A8NML3Mbm5z873Xx96/bI7LMnupvml66N74fce/hQ8+FHV+inoX5fUdOnMJePS8GOpmmARwp1ZuuAV+CVOamapqmKV6nJesNPVPWziNZRJCD0kSJCiWnqu15A2t+dJ7dS+xULGOzog5wcBzxi6TNZHrwCr8zIJBqqjlepiXowRHqJxYSFZMqDnKjkk05UVjz6m9qvWNBghxAO4BFLn2UBQXx0g0P5QZwn86y6fKVJ1K0x9JGP59Lfclbic5WPUFSuf29E06cUZGCHJ8CBRwqVRnXAK/BKTSJPA1XxSpush7c4WUxcg93HYN3fnZcNtf1JBQx29J4DHqkU8tYDr8ArU0L1jVXDK8uELbcEiHGaZR9irjtVFnZYeNGuDeBh50uLloCHhRft2iiKh2Xybg3ZfPpW0zz4ZHNwcNBsNpum+eztzlXOdwcnn2IXWvbBAhbYYeFFuzaAh50vLVoCHhZetGujKB5WyXtDwkGiECMgXKeiPbFgRyfsVrzQhgnwAB5aDvnqg1dGvLJKFC0gH1z+vHnkzAMjwAZRcWDksv1MxKofWrLBDiNiaYHgtV7wqj5BR5zXNcAqiYdl4t68/+YrUQLy6NPP1zTa5ZwHO4yyv1EzwMPIkUbNAA8jRxo1UxQPcwEhp8hZCN/raJe2+g8pJn1qFhDYYURvfTNtgAAPvSONWgAeRo40aqYoHpYCQv4YjFlyTqXiMZqFLNlQsQjCjhDw1i+D+Fjf53NXBB5KPMwFhPrDI8ZeJIYuer63vr7SHUP19skG2GHlTnU7wEPtQtMGgIepO9WNFcPDMoG3b0jyi2icfF3XsKiIspZ9UCNBsyjYYeFGszaAh5krTRoCHiZuNGukKB6WyXvYl562MqEk/MJzz4689PKrr7UCU2jjxFDEYEeop9YpBzzW8XPoVYBHqKfWKVcUDysBaadQ7pnnciTP/+Z9sJwz0636oYUMdnQeBB5aJo3rg1fglS2jutaK88oiUQybe9Hswt3m3b2PIGcfvH9WoU0UXUBhR785JvAwjXXwCrwyJVTfWBW80grI1mHufA+EZxxSQNwZidzFt/DphLDj4eOjXZWBh0nMg1fglQmRnEaq4ZVGQEZGsIG8NCXFgn/j7+RSl3RMoaQFO5wgZ0yAhyr2wSvwSkWgicpV8cpcQMhoFhE6WIoOj7r47jutL8499sToPonroJoSFuwYznXRcCQlgLwBAjyARwqZRB3w6mh3vLhl3tUkh0lAqIMkBidPHB/O2iYRIQFxD5OqdQYiR+GwQxm6cdXBqwl/1TbAQpxfJRdocmhcZHSlq4oPjfGDITTjmDqVUCZfst53GiHXLR0gsKObPQKPlLjeqoP4EC4Br0w4NRKQGvKViYBQ4neFgb7jWYcUEV85/q60gMCObuYIPEyCffR8PuIDvDJhlZiB1JCvTATk0rVvm7MnxutrLCDkNFq6mhIRWbe0gMCOpgEeRmEuAh28Aq/MWFUZr8wE5NhdzdZjoHzzfEpEaAp287tmEJ8aBAR2AA+jYB9mICQg4BV4tY+8Wk1AfCJCj/PumoDADqMwmG4mKvECD+AR6AHw6vCh9qlYy7xrKiAEpLwBK2cgHOj0f7mcRf/m5a9aZiCwo1uOBB6BqclfbCthgVfglYpRXeWqeJVVQHzOopuJfWIyVUIFMIuAwA6Fd+OrAo8L7eOhiI947szVAK8y8EolID605P5Wx+4/Mypy8/rlNijow/tm8dYnoqCmTymUazckcz+wY/AI8EhhVb/RHXjV7Y+HOE8jkadWVflKkxw2dEwtH1nbv1AzMu70uWdG9l+5+MbobyYWH3fbt6XpUwpKsKP3GvBIoc9kHfAKvDIlVN9YVbzSJOthK2Gxe+uGZh1H7nto1nFfffFJw7MRquvs2KvpUwpgsAN4pPBmqQ54BV4tcSTl96p4pU3W7bqiuNkaLSC8nNV7UtufFECoDuxwlheBRyqVRvXAK/DKhEhOI9XwSpuw5XGK1FaUgDhO0fZFAxTsuH7Z9R/w0DCqqwtegVd6Fm23UA2vtEnCVcI2aOS9D16ukt/190K017YEBnasvyncHH7AA3hYxje3BV4Z80qbxF0lNBeQ84+f2rx+4aq2n0tkhB2BxAIeS1QaL2GJJ5CYw6YDLOABPHoPFOGVNjFD0QMTbxTN0wsDD+CRzp7pmuAVeOVlh1pA6E3yT6/doMazjLByRIOnzQ3sWP1cg9klLOABPDLEPuLcWAjVAsKnDu66gMCOuhIW8AAeOQQEvLLllVpAMFK0BUQZNBhhGY+wgEf3NBniHHHuiwWtgLTkco51NL2ZowzgmOqwI8Zb+csCj/w+jrkC8IjxVv6yVeBhISCuq7x7tXj8mePalrDBDktv6tsCHnofWrYAPCy9qW+rCB45kngRQ/T+32oBdmRwqqJJ4KFwXoaqwCODUxVNFsEjh4Dwshb7Yng6Szgn13UV/vdWlaDADmvvxrcHPOJ9lrMG8Mjp3fi2V8djVxJ5vCtRAx6AB+ABeCCrB3IIiE8F2Yi537IamtA47EhwWsYqwCOjcxOaBh4JTstYpQge1gLSGkE79N748tutQ2RoWwd55K3z9FZG30Y3DTuiXZa1AvDI6t7oxoFHtMuyViiGh7mAkHjwh0REflg86LtC522Hojgcf0kVYEeo27KVAx7ZXJvUMPBIclu2SsXwyCIglHBZLDj5yr/p37sgILAjG+FjG24DBHjEui1beeCRzbVJDRfDw1JABhV0RcOdkVS+jAU7kjicrRLwyObapIaBR5LbslUqioe5gEwt9/i+r3QWMqi5b/kNdmQLhKmGgcfqLp+9IPAAHoMHNALCd/2H9yNoo7Kvb90euffsibvbvy9dG98PuffwoebDj67QT+77FZo+pUALO5qmAR4p1JlPtP2viA/EuSW5qspXqcm6PYBJ3MtoHUQCQh8pIpSYpr7rBaT93XlyK7VfsUDBjl48yHHAI5Y+k+XBK/DKjEyioep4lZqoB0Okl/olqUFIpjzIiUo+sUVlxaO/qf2KBQ12COEAHrH0WRYQxEc3OJQfxHkyz6rLV5pE3RpDH/l4Lv3NQjLlJh+hqOx7H48Opkr2cmRF2OEJcOARyaLt4uAVeKUmkaeBqnilERCybXj7kcXENdh9nNf9vRcN/lrbn1TAYEfvOeCRSiFvPfAKvDIlVN9YNbyyTNihu0G6DrXsgwVYsMPCi3ZtAA87X1q0BDwsvGjXRlE8LJN3a8jm07ea5sEnm4ODg2az2TTNZ293rnK+Ozj5VOlZxxSEsMOO3BYtAQ8LL9q1ATzsfGnRUlE8rARkQ8JBohAjIFynoj2xYEcn7Fa80AYI8AAeWg756oNXRryyShQtIB9c/rx55MwDI8AGUXFg5LL9TMSqH1qywQ4jYmmB4LVe8Ko+QUec1zXAKomHZeLevP/mK1EC8ujTz9c02uWcBzuMsr9RM8DDyJFGzQAPI0caNVMUD3MBIafIWQjf62iXtvoPKSZ9ahYQ2GFEb30zbYAAD70jjVoAHkaONGqmKB6WAkL+GIxZck6l4jGahSzZULEIwo4Q8NYvg/hY3+dzVwQeSjzMBYT6wyPGXiSGLnq+t76+0h1D9fbJBthh5U51O8BD7ULTBoCHqTvVjRXDwzKBt29I8otonHxd17CoiLKWfVAjQbMo2GHhRrM2gIeZK00aAh4mbjRrpCgelsl72JeetjKhJPzCc8+OvPTyq6+1AlNo48RQxGBHqKfWKQc81vFz6FX2Bg+5IexSviLn1Hz8BPdvyQ7rfcisBKSdQrlnnsuRPP+b98Fyzky36kdoEEyVgx2dZ4CHlknj+uAVeGXLqK614ryySBTD5l40u3C3eXfvI8jZB++fVWgTRRdQ2NFvjgk8TGMdvAKvTAnVN1YFr7QCsnWYO98D4RmHFBB3RiJ38S08PYQd/fkuzHTgYRLz4BV4ZUIkp5FqeKURkJERbCAvTUmx4N/4O7nUJR1TKGnBDifIC4sI8AAe2ZMu8tUdF2vyrrmAULdYROiEQjo86uK777S9PffYE6P7JC5LNIYoGOdNWLCj2E1D4HG0OwYa8aGI6u2q4FUGXmUREMKOxODkiePDWdskIiQg7mFStc5A5CgcdpgG8lJjk4EOXl0lF2hidsn3vt+Bx4TXahvwlogPDRkHYtGMY+pUQpl8yUDfaYRctzQgqXZc/+YHzf33/HGgWSk7pk6IZGLR/+fwqMUO+aReCq/2xQ6eBdcSH9SfCd/O8mqf7GBb6P+FHjYZCXppPEwEhBKmKwz0Hc86ZNLylePvSiVefjLs5ndNc/bEePkgxI5aEpY8FdKXeJfwqMWOfcFD8nrX44NHRz6OLPGK6l669m1z7K7u+OuSca61gwaZ/KlVQNbEw0RAiBxTiZecTUtXUyIi65YkFhFjTkDm7Kgl8crHoqcS1pQdldhA3WtHWPuAB2OwD/GxlHhD4rywgAzc8tnCA8UlO/gl6ZpnIPKe81zetcDDTEC4MwyOBGQKFDdJlBIQTrwkICl2uAmikB1tgPiedHOx8OFBRJODgNI2UB93HI9hqUGOvncxPuRgxMd1TlhLcU6xVTDxbgnInC2+Qa/nCVNN/hxmMpH/GC1hlcZD44CoAPGRi5KdHPUXSlrDCzkhCWsXkq98oZP6OyUg9BuPUL6+dXsnBaRiPPYmPmIEZC7Od0lApuzg2Cq0fBUlgixMrhhy3rXAw1RAqMPyhp8cmTAgMmnRI75y5FtKQOQIwL0RvWvJl22RdkzZQImh97lvEKThRuSgalS83Z7BZ8eOieGWgOxqfLgCImfpIfFBce75VMEv6pe8V+XLWe6DJ8KWEjZszUBK4qFxwGKA+Fgjk1YtMxBxNnv7noob6Et2TGRLjW9TE/Bw1rMrIFM2cFKWB34VPmZ4sIH6tsN47E18uNxx97xbig9eVmWO1cIvd3++mcFUayLb/Y9//3dNQRtGAyzZL47lNfHQJLktQ2TA0xTv2P1nRrbcvH55SAjOVFCW0/QpJfEOG5LxNiyxdlD5ShLwli0cJKfPPdN89cUng38IC7kvmdx+v/BhX/uCx97Eh5P4h2RK/4iJc2dfvLXjnLnfHiJFHOfBrNy/T+asI/c91Fy5+Eabs+Sy8K9/9auSp6m2Ayz68GmvsfnKt81U6vtFGhBHI8W+A6OgoaQlPwSG/FQ0MmlHi2IJLcoOsqmmBOxbmlrCwlFeDS9SRNytsw947Et8DAnXtz0RAbfELWfT1Db3WZBE0YZ3kLJki2N/KRuqwkPjBBcEamtDCk7KPfehkTDPRkjZKxiZyENZku0QNmv8qoiLturogJkQPHiUxSPKGgJcBOuu4rFX8UHckAOTEF7JOC/4/ocvnlps2B5XAN0KFdox6j/1txQe2kS3NVKMNUQkrZIjE0s7tD5VC0hsoLszwxoExJ0RKnhVEg9LXpWMj6SBiUy8FQ1OWlvoP3J5N2TAW9ssXc6ISsWHNrhUI/eKANkXO4ICnQTDd0+kAuFgSuwLHvtiR8ur2IEJC0hFcT7wS85A+L4H3/NwZyTCDm2+1A4OZf0q8NA6xB1htUSTALDz5Xf9iFd77VxgTC6ZcOKlC1dKqqBAJzvkzUJaTqxIPFwbdhmPfYkPd2CyhYmMDQ7MmmOE+kiP5356bfywD8XCrgjI3DLvWnhok7g7wjIXkPOPn9q8fuGqtp9LYrNhMvHDAL4poSbxrmRH639hi3dtdAfs2Bc89iU+JkWdA0ubeC3jI6CtdgmLj5twB1O7IiC+Zd618dAm5n0ZYW2YTGIkvvVAgCbxLimY4e/SFnMBMeznXFP7gse+xIc7MBlmIFMJq+LZx7CMteszEN+gd2081ALiGGE+A1krYfnscGchuyIgOWcgwCPKA+5Malfjo+23M8hqB1hrJ6wo7y8XbmciuzoDqQEPtYD4Ru47eA+kDRDnPsCuzkBcW7x2eGJLy4XlcI0rsQ94eGdSuxofNYx44ygUVHrrhU8fPpXdI6xmRqhNGvs0wnLZtssCIm0JERAtD4IiVVloF/HYt/iQor4PM5BhOUtyc0cExDtQXHtGaJE4tkaKOzrCChKQHRi5h9phgb1SE6KqhwghNVibXXsbHy56O5R454jnfYq0Ql5txXkJPHIEm3cPoD1KvNKUHP6LyqoBhacS7y70fS9nUgGY1SiEvm5PbvmzAzfRp2DYVQHhGclg1xqCniOJ7I2ATDAsh88Cc0pSsSk8YEeSO9WV9iU+FkfAfQHwTE2ZpAZWiftc4MrO8zV83yV5ZsVKu9jnxZHiDkzHJ0eH4odc3F2DXvsSH0tc21WM3OS7q3a4sxJzO8wbXCP6cA14AB6AB+CB8h7IISBzo/ZdGtHDjvL8HN0DmZl9gFfrY4X4WN/nc1csgoe1gAzbDPMB9NJiz0lm1te3ghR2WHnSph3gYeNHq1aAh5Unbdophod1Ah+d10siIj98Xjp9V+j881C4YEeop9YpBzzW8XPoVYBHqKfWKVcMjywCQsLBYsEiIv+u7HAZH8QtILBjHfYHXAV4BDhpxSLAY0VnB1yqGB6WAjKooCsa7AD3+0pnIbAjgLErFgEeKzo74FLAI8BJKxYpioe5gEwtW/m+r1lAYMeKITB/qWF05VsOBa9Wxwl4rO7y2QsWxUMjIHzXf3jPgzZW/PrW7ZG1Z0/c3f596dr4fsi9hw81H350hX5y3xPR9CkFWtjRNA3wSKHOfGD3vyI+EOeW5KoqX6Um6/agHHEvo3UQCQh9pIhQYpr6rheQ9ne+5/DexzekqFg63tcW7OjFg5wDPMzoBl6BV2ZkEg1Vxyu1gEgv9UtSg5BMeZATFYmG/IhHf1P7FQvaAAjs6EQceMRSyFsevBIDEvDKhFPUSHW80iTq1hj6yMdz6W8Wkim3+QhFZVeefXD3YIdHOICHOujBK/BKTSJPA1XxSiMgrSKygSwmrsHu47zu771o8Nfa/qQCBjt6zwGPVAr5ZyKIj84D4NV+8soyYYfuMup60rIPFijBDgsv2rUBPOx8adES8LDwol0bRfGwTN6tIZtP32qaB59sDg4Oms1m0zSfvd25yvnu4ORTpWcdUxDCDjtyW7QEPCy8aNcG8LDzpUVLRfGwEpANCQeJQoyAcJ2KtheHHZ2wW/FCGyDAA3hoOeSrD14Z8coqUbSAfHD58+aRMw+MABtExYGRy/YzEat+aMkGO4yIpQWirw88gIcRlUbNgFdGvApJ3DRFCir3/puvRAnIo08/X9Nolxm2gR05Yja5TeCR7LosFYFHFrcmN1oUjyVhaF+TD9xypDWEPnIWwvc62qWt/kOzD/rULCCwI5nQ1hXBK2uP6toDHjr/WdcuioelgJBjBmOWvFSpeIxmIUs2VCyCsCMEvPXLID7W9/ncFYGHEo9FARHtL5VtBYT+wzORXiSGJjzfh7SpNDGpOuxIclu2SsAjm2uTGgYeSW7LVqkYHnMJvL3RRJ/AG93tG5L8whCLhesyFhVRtjYRgR3ZeJ7UMPBIclu2SsAjm2uTGi6Kx6KA0P0KMZOYLc9blNA9ExKIF557duSRl199rRWYQhsnhqIz7K8PO0JdlrUc8Mjq3ujGgUe0y7JWKIrHrCDIJSdxM72dlPQuGb0F6Z55Lmck/G8WGefM9FpmIa09sCPoqbusUSH5BTyAhzHZEOedQ9V5d6mBQSDkBoi8WaIUA+oNzS7cYHfve8jZB++fVWgTRZeTwyZlc3ZQJZqRwQ7jkN5uDnj0m5UiPky5Bl4Z8mpRQHjm4e6g64OUZxXyrBApIO6MRO7iG/iosCmTRGNbh9JPiYj7YIAUTGoPdphABDz683bYm+AVeFVjvloSEOrzMN1jA9zt2yW0UkScHTjb2YmbmGXdgkEySljUJ58Y0vcX332n7fK5x54YzbZgh0mAcyPA42h3kid4BV55PFBNfAQJiJw5kDG+rdulqHDypRMK6fCokKRbePS+BYgUkVg7CtoCOybyTaHBCfAAHqYK2DdWDa9iBWTy5jkZ5i5JnTxxfDhrm0SERu1zS2GFgrydZU31i/oUagcJZ+FlOdghwhV4mOUu8Aq88pIpVUDcxraOWuQb7TL5UiWZqK9/84Pm/nv+2LZV4DhbaYP3qEgu4IqIawf3XzbIQrKyKMKOHgTiE/CwExD3Xp+7tDYX54gPMxy4oWriPKuA8KxDkmuXBISSv3x8eS5IWDDl8l4BEZk8Mxl23JkhryjqwKNPeYgPUxGphlfZBYTcRktXrojI2UfBewazsxApIEtiKJLS6KEDR0ToeiE+17DNOxtkAYEd3c1pTmjAI5hq4NX4KUvEeUTwyNflfQlwRC4KTr5xzvR0RYQE5eyJLpgLL1/NTgtDRGSi/wPB6MmzyG1hgqPaU3BxdDIlIrBD4/bJusDjy295iyOZOxAfOrpVwavQ0bCJgJC/eCby9a3btQkIdW8SFPpRPk3mLmf1XPCKq9zmPnBfMR21YAf7D3homTSuj/jo/AFezSQ8H+WCBIQq0pLN1AzE2Q7FvU6omNmGhBMg9KfvhqFrE8+ojt0VtLbebhu94hb2W1s1sJmwo/UE8EiLIvBq/mXh7x2vQpN2tID4+Ck3W5QHTK00Kg8JmaV1zdFNdW5Q2jWzLBh6smNIP5fKwI7lXQGAxxKLtn8Hr8CrESusBKQd1fHondb8T597pvnqi0+Gi928fnm0f5Tc7n3FkXlIyIyCxL1/QWLx8f893Fy5+MbozXpquJI9i9hG2PHxjanlhhAeWJcBHsDDmlOjvMs5SN5vzZ2vLAVkMIb+QQIiP5RwZz6h/cgBgK/NkRjKM9JptkS2SXsq3p4eduR/6i2Gk8ADeMTwJbRsMV6FJu6lJaxh1Hvs/jPNkfsemjWcR+8VjtpHdtCsiT58/4Lv4bA40gyLylS2q7D0/YbwgB2hcZi9HPCoTEAQH7rXCoIFhPeDWnj0tw2QEAFxQjW0H9kjvL/AYIc706Cb0K6AVGwL7KgwYVF8gFdrhfLsdRAfyvgITdwbjYBQsPjuiUS8h7I227aEkGzgGQiJJH/60X2oH2FHmgeAR5rfctUCHrk8m9ZuMTxCE59aQHYo6RKEQYBULh6wIy0Yc9YCr3J6N75t4BHvs1GN6gXk/OOnNq9fuBraT6U7hurmxIIdKmiAx4T7wCvwKseAN5RXoYkZMxDPEhZmIKrgjalsLiAxFzcsCzsMnWnQFPBQOhEC4ncgiKUklnF14GHsUGVzwEPpQOPqxfCwFpDJdXePw0Kvbezr4OZGoMib6E4LsCPYpaqCwEPlPvPKwMPcpaoGi+ARk/xCt37wquGOJd0tIZwQkBj/qdihqBxCLNihcHBkVeAR6bDMxYGHwsE5EseUgOS4lsL0xapzxNolW2DHItSrFgAeq7p78WLAY9FF0wVyJEIIiAKQDFURIBmcqmgSeCicl6Eq8FA4NYuATPQnx7UUpi9WbfeXkR+xHf0u2QI7FqFetQDwWNXdixcDHosuWncGQldzQdmlhCu9NbJjRwVkCw/YoYgYm6rglY0frVoBHome3NXEnmguqsED8AA8AA9YeQACYuVJtAMPwAPwwPfMA+YC8kuxfPUbZ6fHud9q8/sZYcdlx46532qzA3jUhQjwAB45PFAqX5kKCAfHX5440tz+/R+aL27eHvnqvmOHmkM//mH73b9f+6pxBSaHY1PaZDBC7XAFJuWaOeoAjxxeTW8TeKT7LkdN4KH3qrmAUNLlD4mI/LB47IKAxNhRs4DE2FGzoMfYATz0iWGuBRpgAY+8Po5pvSQeWQSEhIPFgkVE/k3/rn0GwrOPEDtqT1jAIyYc85WlEW8Mr2oX9FBeIT7ycYpaZgEpgYeZgHBwkEGuaLgzkpqXsaSax9hRW5AAD91RndYhDzyAhzWnpHjE5l2rfGUuIFPLVr7va5yFSDX3Lb9N2WEFiBXJ5Gg3xo7aRr3Ao67ECzyAh8wnyQLCN6A44dDff/5nR5v//p//HeXAn97T3TT/7Tfj+yF/+ic/av7zv74cbqS77Vkl0qV2+IY5CwD9nWKHrE/XXFtQgEeHNPMKeCwxP+x3xMeYVzLf0S9rD7hqwyNJQChZ8RNVNIvgDyVe+kgRoYCe+o4EhD/yiae1QCEwctqxlogAjztBTv+a4hXwCBMNLoX4COPV9zlfqQVEUpLFhIVkiq4c4PJJDirLj/6WACSHHSUSVg47gEdc4pWCDjyaZirOER9xvJKCnoNXKXgkCQh1noOE/i0fz6W/5azE5yIfoagcvTeyVrJyR1nWdqSAEUencWng4U9UzCvgkcYuTlqIjzv+4/ugyFfOG9axFJNv1dJSkO/jPgbrlpEvG64tHlJE+N8WdqydrLjvwOMOuySvgEdsZI/Ly7ecER93Xo5GvlIKiKSZTF4xdC0FwlQfZbDE2FEqSU31EXjU9bQM8AAeMfkktGzpfJW8hOUayAHy4t/+dbvj6xsAAA8vSURBVJDtL/3Dv7blahWQWDtqFZBYO4BHEH2jCyE+6hQQxEc0lUcVTASEgoOAIFFoAfnJg81LL73UvPjii03zu8+6CzrfcVn6fy1Ji9RcY0ctIgI8Oi4CD11ycGsjPjpeIV/dYYapgNy4+U1z/Ng9I94NouKwkcvWCEiqHbUlrFQ7aguQVDuARx4BAR51zKZY0EviYSIgRFMa9f7NU7+MEpB/eus31ai5vKGeYkctyUreUE+xoxbxAB7fNIgPWwF079kiPvT+NRcQ6pKchfC9DrnWSIpJn5oDJNaOWgUk1o5aBSTWDuChTw6+FmjUS4kXeOTxb2yrpfEwExA5CwlxQo3i4Y56Q+2oLVm5s5BQO2oTD+BRx1KJ714Ii8gStyjOER9LXtL9LkVkqSVrPMwEhF9k4+fviWDU2fZGetO0N9X5O/qbnicv8SLOkoP5xalYO2oLEuBRV/IFHsBjKfek/F46X5kKCL9hTm+ik0D8/OxfjXzy4aV/a0WjxL5XoeDI7dxj7KhRQIBHKOr5y8nt3GN4VdusEPFRlxCWxsNEQPgZd/fIWikiUjwoXOWRt7UECb+Uk2pHLSICPLq3hYGHrTAiPjpeIV/d4ZVaQOQeTDS78O1uK2ksZx+8LUINS1lyzx+NHaWTFvDoOEgfwhF42IgI4mPMq9IiUgseKgGR03J3VsH3OPhmG90P4e/4HkgtZ6TLaaCFHaWSFvDo7q25vAIeOhFBfPh5VUpEasIjWUDcZMUU5aUpKRb8G3/nBjn/XuKEQhcMKzvWTlrA487s102XxCvgkSYiiI95Xq0tIrXhYS4gcgRP54LQ2R+/fvpXLXv/+c1/2RohSlrXJCBaO2pJWFo7agkQrR3Aw1ZAgEd3bMX3PT6yCAiRi5z7k8OHhiNGSURIQNyzQGoWEI0dNSUsjR01BYjGDuBhLyDAoy4BKYGHWkD4cJWpQ6WkiJCBU4dJUf2Sim5tR6mEZW1HKQGxtgN46AQEeHT+k35AvlKcB+I+7eMKAzmXZx1SRHzlSj6N5T7NYGVHiYQl/WhlRwkByWEH8EgXEOBxx3f8Dg99U+Lp0drylWoGwsT67g9N89N7fjhiKAsI3/uYEpHffvOH5q6+amlALO0ombAs7SgpIJZ2AA+9gACPpkG+GvNILSC09MROdR+f5JvnUyJC00EmJT+9VSphWdtRKmFZ2wE80hIvz9CBx5F22ceNc8RHGq94BmLNq1Q8VALCyyQhAuITEZrByFFNyTVF6p+lHamApNGq204fePyoferPxyvgkcYs+dgo4gP5ymWRSkBkY7ycxbMQuYTF5egpLPq4N9ZlOyVGvDnsKJGwctgBPNISr3sGOuJj7EfERxqv3DPQrXiViodKQPj4V3KFzxCfi2iUTOLCdei+B58VUuJ0QnlMp6UdqYCk0aqbgQCPaV4BjzRmIT6Qr+aYoxIQKQJ8EfnExo8PHxtd+/e3bo72KfJtd1JqxOu+Oa+1o0TCAh7dkzE+XgGPdAHJwSvgsR94JAsImc/r7nzvwp22H/2L0yMvffkfV0Z/yyRNP6wtHtwZXuflLS/caWKsHWsHB9sBPDpPuLwCHmnJCvGBfLXEHLWAyIOhKIHRrOPHh47MXvf3t79qeDZS6gVC2UF5KAslG/o71Y5SyYoFHXh0s1zmFfBYSgHLvyM+kK+mWKIWEL6nQbOHFAGhjpV4/8MVELYjVUDYjtIJC3iMl0mBx7JALJXwzdBjB1iIjyUvh/9eEx5qAdGMeKXLSi1fUR+0IyxpR+mEBTxujiIReIQnpqmSiI9uBoJ8tc0QtYDIES8vo8h7BrxcJb+jeyElBcN1g6voLCohdpRMUK4d7j0Q4KFPnpoWgMeV1bfRn8MLeNjjoRYQeqfjd7duD4JAIIUk3lABOf/4qc3rF66q+rmUBEhA2A4WBPouxI5QAVnDDvI98Ag7sxp4LEXFnd8RH+ED3jV4VRMeqsRMCYvP/GBB4Psgkp40/ZOP9NLfoQISTvP0kgQI2yEFxPcYsmtHqICk9y68JvC4Wd2IF/ERJujhLE8vifiwjw+1gPhGvCGJtzYB8c1AQuyoTUCAR10JC3gAj3TJ89ecmoGUyFcqAeE1dikGuzgD4XseUgz4Ud6lmVRNAgI87EdY2uCneEB8aL1oVx942Aq6WkB8N3JD4K5pBuLrr/sy4ZRNtQkI8LANkBAux5RxX7adqov4iPFqelngke47qgkBmfAfBERHLOvawMPao7r2gIfOf9a1S+FhLiC8jMIOkjfX3e+snWjdngRF3lzn69Q+++B+ylEW8LBmSXx7wCPeZzlrAI9072YRkPTuoCY8AA/AA/DArngAArIrSKGf8AA8AA9U5gEISGWAoDvwADwAD+yKB3IIyEYY77Y/91ttPoMddSECPIBHDg+AVwqvWgtIC8b5x081N778tnnv4xujrv3i4ePN8aN3t9+9fuEq/c/6+gpXjKrCDitP2rQDPGz8aNUK8LDypE07xfCwTuAbEg/+kIjID4vHLggI7LBhtlEr4JWRI42aAR5GjjRqphgeWQSEhIPFgkVE/k3/rn0GwrMo2GFEcV0zbYCAVzonGtYGHobONGiqGB6WAjKooCsa7oyk8mUs2GHAaMMmgIehMw2aAh4GTjRsoige5gIytWzl+77SWcig5r7lN9hhSP2wpoBHmJ/WKgU81vJ02HWK4qEREH56gdvY/Pxnp5uvb90emX32RHfT/NK18f2Qew8faj78qD20fqjfV9T0Kczl41Kwo2ka4JFCndk64BV4ZU6qpmmq4lVqst7wE1X9LKJ1FAkIfaSIUGKa+q4XkPZ358mt1H7FAgY7+iAnxwGPWPpMlgevwCszMomGquNVaqIeDJFeYjFhIZnyICcq+aQTlRWP/qb2KxY02CGEA3jE0mdZQBAf3eBQfhDnyTyrLl9pEnVrDH3k47n0t5yV+FzlIxSV698b0fQpBRnY4Qlw4JFCpVEd8Aq8UpPI00BVvNIm6+EtThYT12D3MVj3d+dlQ21/UgGDHb3ngEcqhbz1wCvwypRQfWPV8MoyYcstAWKcZtmHmOtOlYUdFl60awN42PnSoiXgYeFFuzaK4mGZvFtDNp++1TQPPtkcHBw0m82maT57u3OV893ByafYhZZ9sIAFdlh40a4N4GHnS4uWgIeFF+3aKIqHVfLekHCQKMQICNepaE8s2NEJuxUvtGECPICHlkO++uCVEa+sEkULyAeXP28eOfPACLBBVBwYuWw/E7Hqh5ZssMOIWFogeK0XvKpP0BHndQ2wSuJhmbg377/5SpSAPPr08zWNdjnnwQ6j7G/UDPAwcqRRM8DDyJFGzRTFw1xAyClyFsL3Otqlrf5DikmfmgUEdhjRW99MGyDAQ+9IoxaAh5EjjZopioelgJA/BmOWnFOpeIxmIUs2VCyCsCMEvPXLID7W9/ncFYGHEg9zAaH+8IixF4mhi57vra+vdMdQvX2yAXZYuVPdDvBQu9C0AeBh6k51Y8XwsEzg7RuS/CIaJ1/XNSwqoqxlH9RI0CwKdli40awN4GHmSpOGgIeJG80aKYqHZfIe9qWnrUwoCb/w3LMjL7386mutwBTaODEUMdgR6ql1ygGPdfwcehXgEeqpdcoVxcNKQNoplHvmuRzJ8795HyznzHSrfmghgx2dB4GHlknj+uAVeGXLqK614ryySBTD5l40u3C3eXfvI8jZB++fVWgTRRdQ2NFvjgk8TGMdvAKvTAnVN1YFr7QCsnWYO98D4RmHFBB3RiJ38S18OiHsePj4aFdl4GES8+AVeGVCJKeRanilEZCREWwgL01JseDf+Du51CUdUyhpwQ4nyBkT4KGKffAKvFIRaKJyVbwyFxAymkWEDpaiw6MuvvtO64tzjz0xuk/iOqimhAU7hnNdNBxJCSBvgAAP4JFCJlEHvDraHS9umXc1yWESEOogicHJE8eHs7ZJREhA3MOkap2ByFE47FCGblx18GrCX7UNsBDnV8kFmhwaFxld6ariQ2P8YAjNOKZOJZTJl6z3nUbIdUsHCOzoZo/AIyWut+ogPoRLwCsTTo0EpIZ8ZSIglPhdYaDveNYhRcRXjr8rLSCwo5s5Ag+TYB89n4/4AK9MWCVmIDXkKxMBuXTt2+bsifH6GgsIOY2WrqZERNYtLSCwo2mAh1GYi0AHr8ArM1ZVxiszATl2V7P1GCjfPJ8SEZqC3fyuGcSnBgGBHcDDKNiHGQgJCHgFXu0jr1YTEJ+I0OO8uyYgsMMoDKabiUq8wAN4BHoAvDp8qH0q1jLvmgoIASlvwMoZCAc6/V8uZ9G/efmrlhkI7OiWI4FHYGryF9tKWOAVeKViVFe5Kl5lFRCfs+hmYp+YTJVQAcwiILBD4d34qsDjQvt4KOIjnjtzNcCrDLxSCYgPLbm/1bH7z4yK3Lx+uQ0K+vC+Wbz1iSio6VMK5doNydwP7Bg8AjxSWNVvdAdedfvjIc7TSOSpVVW+0iSHDR1Ty0fW9i/UjIw7fe6Zkf1XLr4x+puJxcfd9m1p+pSCEuzovQY8UugzWQe8Aq9MCdU3VhWvNMl62EpY7N66oVnHkfsemnXcV1980vBshOo6O/Zq+pQCGOwAHim8WaoDXoFXSxxJ+b0qXmmTdbuuKG62RgsIL2f1ntT2JwUQqgM7nOVF4JFKpVE98Aq8MiGS00g1vNImbHmcIrUVJSCOU7R90QAFO65fdv0HPDSM6uqCV+CVnkXbLVTDK22ScJWwDRp574OXq+R3/b0Q7bUtgYEd628KN4cf8AAelvHNbYFXxrzSJnFXCc0F5PzjpzavX7iq7ecSGWFHILGAxxKVxktY4gkk5rDpAAt4AI/eA0V4pU3MUPTAxBtF8/TCwAN4pLNnuiZ4BV552aEWEHqT/NNrN6jxLCOsHNHgaXMDO1Y/12B2CQt4AI8MsY84NxZCtYDwqYO7LiCwo66EBTyARw4BAa9seaUWEIwUbQFRBg1GWMYjLODRPU2GOEec+2JBKyAtuZxjHU1v5igDOKY67IjxVv6ywCO/j2OuADxivJW/bBV4WAiI6yrvXi0ef+a4tiVssMPSm/q2gIfeh5YtAA9Lb+rbKoJHjiRexBC9/7dagB0ZnKpoEngonJehKvDI4FRFk0XwyCEgvKzFvhiezhLOyXVdhf+9VSUosMPau/HtAY94n+WsATxyeje+7dXx+H/XQ4Z9m9zuqAAAAABJRU5ErkJggg=="
        , "data:image/png;base64,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"
    ],
    caveSpider: [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAD6CAYAAACPpxFEAAAgAElEQVR4Xu2dQc/8RlLGJxBxIdEKwUYiC4EDB6TcyCF8AC5BfAWOfCq+B7nwAcgh3FbiwAECG6QFhFa7XFDgRe2Z9ltuV3dXt8uetuf3HvKfzNg9ruepqqe6uu354MYfCIAACIAACHQg8EHHOZwCAiAAAiAAAjcEBCcAARAAARDoQgAB6YKNk0AABEAABBAQfAAEQAAEQKALAQSkCzZOAgEQAAEQQEDwARAAARAAgS4EEJAu2DgJBEAABEAAAcEHQAAEQAAEuhBAQLpg4yQQAAEQAAEEBB8AARAAARDoQgAB6YKNk0AABEAABBAQfAAEQAAEQKALAQSkCzZOAgEQAAEQQEDwARAAARAAgS4EEJAu2DgJBEAABEAAAcEHQAAEQAAEuhBAQLpg4yQQAAEQAIGtAvJ2u7n8pojXOL2Men2/1zjYgV9JH8CveiNieZ4Xjl7j9Frl9f2bx9kiIG9fffnp7etvvg8gjDBONxnYsYDOi1f4ID4WIugUZ/jVQH7VmvijYs1JZqNT5MbZrIwVL8MOHSD46E1P9/PwK/xqmwdl8HsU6cPl3RYBkZXpTQiHfC3HC8GU/i0+z4yRG8+LGOx4RxI+vLzqdsOv8KuWfGr1vKH9ymrwZIT8e7SuYvtqYWR4Mz0+vCfOSUViEpvMd1iv0UIIdgiU4MPiMqZj8Cv8yqOdnzrb8H5lTc5ZgRBrIKoIaOGniU9FYExRbDgIOxSQ4MPgOeVD8Cv8ajcBSQs9kStD/n5q3rUISHYKFWcN0UBt1pGLO3lOphL2bmVhRyEJwke3iOBX+NWEwMb1YHX2YY1Lq/dax7NujqoJiLZoE681nruaZqWziXhCoa01jyWPDUY4kYId991yiz/48NtBKNfzHiATH+u2FnFuy/SnyVdVAYnKKu1OWh7ho1lE4mdffP7Z7ZOPfrj9/Fcfzv9++9PvZqVOpmHTGMbvslGwPMo6Nna8b8m2YgYf5fVB4mO51R+/qkeMFaOn56uSgGRVMFauWuspfBZEI/ylAhLfU2YWKyDklHDjLAQ74EPdwIFfTWFKfBAf3fFRFJBCEl8pZBQFKR7h/DgDia+liMgZR25XV9IaqM2YNG2fr1UTrnTWgx333XbwUS0T8atHkUicZ0X48vkqZ+AiOJJQUu/1iLMSq4AkSSr8b/Yekg0igh2iuioFOnw0PU0Bv8KvyFeVR5CUdpekwjO3oDoEZDWWnPkkr7sUPXfDomI/dqwfS7NKll6tn5Rn+Hhv/QpBJz6qk8FlKw6/ynd+vP0qOwNJk67kUK59yBaQJh7xvLAekraxEmOKC0edSWslgthxRwA+7rvS8Kv5eXa5G3nnkCl1GYjzOwLKNtmWovd0+cosINrNLBEwB8eandf5npDqHv3o+HHtQxO5KIyGxIsd5WoRPhTxxq+WIma9B0G4Gn71JL/SBCRHRrHntyXxFtY4LNeSS1mWcxfP69oqhNhRVA/4UNYNLJU7foVfPRAYLl+paxkN07DFTYQ9LaxCTy56jSXxpB7Weg52PFqM8FFcTMevHjsrtVlTaSaFX13TrxCQu/QgIAiI5VlGCAgCUvOTVh+Z888ZC3fL47yL94rEO857W1hh1vK4Q910U6Nh4bOLQOx43+QAH2q1iF9lNsJY1giJ8+xjc07tV9q6xvSER+PulLcnJN75CZSZbcixT4gdHT33jkCHj3yLnvgQotNYmOBXJ/Cr2iJ6bQvaUQGSTvNq19V6PHa0BXorvq3Hwwd8BJ8hznURGSY+SmsgJvLCDKS0eJZ7lIlseRkqE21B3drywg7DIyfgY95Kil+tk9aUsIjz+42e5Kt3B0FAHovoBMj97lUCxLxbhsKEwiTfZBKbcwz3tViXDOZCepR8lVtEtwTHwpjcnc21GUiDmltnIa1kYEd7u0QGTg3v2ue5IKxO00s+h1+ZFm2J84ZnehnXB1N/rvl/7fOh4yO3iF5T1kUCqS2kOwf61E9/XIC6hlP4rGTX0QkLO8peBh+2HYoaisRH3rfwK0e/aqlAmpQw9kvlD0rFAeLvhDS2S1pEredY1bGwowdKl3Pgo63f7gJ6YRD4gI+Ve3gIyO2Lzz+bKh5tppEKiDymo82wa5Bgx/SLkS4+4UEUfMCHhx+lY+BXfn7llSzUXRrpLxKmAjOagITWmLY4hR17hLFpTPgYSNCJD7/Ea/L++kFPjw8vAZn6+bmdAdrsZEDxiHRhR91xjzwCPo5Eu/5d8FHH6MgjnsqHp4CsRCR9xEHHNtEjiZDftSAFO55Fw/y98PF0ChYXAB/wMSHgLSCTiIT/xNlImGnI1w/c9/heb0qxwxvRbePBxzb8vM+GD29Et433FD72TOSLZ9efSDhSGrFjm2N7nw0f3ohuGw8+tuHnffahfOwpIN7AMB4IgAAIgMBACCAgA5HBpYAACIDAmRBAQM7EFtcKAiAAAgMhgIAMRAaXAgIgAAJnQgABORNbXCsIgAAIDIQAAjIQGVwKCIAACJwJAQTkTGxxrSAAAiAwEAIIyEBkcCkgAAIgcCYEEJAzscW1ggAIgMBACCAgA5HBpYAACIDAmRBAQM7EFtcKAiAAAgMhgIAMRAaXAgIgAAJnQgABORNbXCsIgAAIDIQAAjIQGVwKCIAACJwJAQTkTGxxrSAAAiAwEAIIyEBkcCkgAAIgcCYEEJAzscW1ggAIgMBACCAgdzLCr3iBxUCO6XQp8OoDJDj64DjaKJt53Zo0N1/AA1GvcXoIevvqy09vX3/zfTh3Kx493+95jheOXuN42tY61gi8euHoNU4rhlNxRXysYHsmHz0caue48LolYbpcwJMddLbBKUhSxzrS0c7Mhzdu3rz2BO2Z+Yj2euPozXMLL2fmwxs3N15bBSQa4nUBuXGOSrzSqW4bRGT6IXtx/uTYG8azBsYV+FhwoODY7KOShwM4kFxdgY+FPU5YEh/WiF4fN3R8tARnLtnmEuXkNMmf/L7W8fopUEhREnyuQjHZEb8itMJC0Mm/ndpjrfiZ7Hhc60IMd0zCkw0pVvI9BbsWO4K/pQHY4vMtPncFPuaZB/ExQfHsfDV8fFiDSTXk4W1akK6SaDg2JifNOeN7RyXe5HoiDqrap1kkY8d02EGzkKvwUauuVDyNfMycSt/aU8wV341JaItfTfFFfLRo+b1ouAAfw8dHk4CkiVMk4ayTa7SLcWbxqQhMk/cUDl5Ur9HJ0uvRgrVihyYemihZ8a7Zm01IIkGqSWcgPrQZn9rq6OBj5Y/Sd0XhU8PZ+vkV+Ai2Eh8K40/KV6eID0tCy07N04o7Vf1S9GmtEm0854pxFehpdfpbP/r49qd//LE1cahVjtLy8VrAm4I805deidjAfKjBkdrVQ8Lf/cMvb//1i1/OM+BUOHZox12Bjwg18ZFxuoPz1WnioyYg2iJ3hHhRYae4KxVfqa21aDdIIXEM+IUt6YwnV+Va7NAqFK1372DLFfjIrjUl+JTaNgt304RSE47IuQMPq4Sbti5F/3zVTtF8r+J/xIetmiA+7rcjHBYfVQHRHDtJmHNVLAPji88/u33y0Q+3n//qw/nfb3/63Vwli2PVXnVEQPkumystj6pWVvJwmQx67MgkE49ZSC2prkQ94tdjh5H7Vj5SHOa2SW7m1uJXJeHIcFyLgZJ9V+Bjjt8O7G49fkV8FEPmVPFRCp6smitrB/NiZ/gsiEb4SwUkvhd3Ksl+fW3Mja0szRa1Tx6du8OOrOqndnbacgU+VsGh7Lha4Rj9pcWvcutbkt9OHqqzj5ovt9jxmMnMsxhtA4fDjIr4GCNfnS4+igISK1At4afVqRbk4Zg4A4mvpYjIMXJtoKRa6akWtdlHOs5i8TYVjxY7lJlTus259x6X1TWWFsxH5kMmxTQhSvWQfWeZdGt8VHymNONpmU1dho9C+20WyzQXtPBRmckSH0m35EzxkUvI2d0w6d7oaHusuqyOJdsSjzEWe65zLaXGx42k4lEToLnS22DHfOme1a4M4CTLqbgNyoe89FK/eoFhWnyUBET4VZXrBNPa8YtrvwgfxIfolhj9KvrBHvnqdPFhamEpwbKq4DckrOJsYEuQZxJ4rEA127cISHVW49UyOSkfluDY06/C90vuc20b6yyktPtqTztWxV1nC6vYtsoUasTH+nl5XnycMj6yM5DSlsrcvmitao+ohPUQrZIstWHkLKUjSLTqSu0lp31mTzuS9l8wqaXSjfCtkpX0tpPwka3gS+sVudlHq19F0U1mKGnwW7m5Ah/EhzL7aPWrdAegst3X6lOnjA+zgGi9agnWxkBX9+2nItZQwWeDI73mVKS87VBmQT0iUqp2V9iVZoPGAPHmoxgcKSd7+FWhGOkRkbPzQXw81meDX6TFrfZePCbnq2lXoKPgnYtFOZZWyI8UH9k2TkVJVwuIWxJvYdEzF6jW1tuiT5mQulpM3Zp4M3asHrDXOAuxYDAyH2lLSNumuNrKHWdujn4VhTu3nTr3fun6i8+Bk8WDox05n7Y+vNNqP/GhiEylo2CJ1dSfTh0faq+2YRo2t4R6AyRpKWjg9pCS7nSqJYfD7TCKSKvth9vRWGlZq/297cgm0QovV+GD+OicgeyUr9TZR8EXh4mPqwpITdXVz+ObPWsgBscKh3TtermAoE+2J9P86ixyRz5qBUWuSryKgBAf4wnIKeNj83Q43onaOwMJyfpxh3o1oTQk0kXP3VAlvx1kRyoi3jYfZUdrIm2xezr2AD5aRaTL5gPsWBUmBn8nPjoFZMd81eKPw8SHtpc5vGc15ghDtORT2orbWl0dlbCag/ZxwhX4sPrTPJU/IPE2X9OF+Gj2xQP4aL6mC/HR7IsH8GG6ptoiem0L2lEC0lrBzonIWI0daUdXO8e4A+1IO0wO1tG2O1LQrTa0JrcjhbDV13tsOdKviI9cA/X9/aP4qMZHaQ2kJh5zoIcXufs8co8ykS0vQwurN0iqADwGngg50I45SEQVpbmN9foXCetAOyzXJ39jwuJTR/qV5fp7Eu7IfPTYQ3yIlpdzvjp1fFxZQFqSwzMCJIqIdR3EknyPtsOKcevzv460w2pDzyz4SDtar6/J7icUWMRHfiZypF8V/aR0n0R9InU/ojqdKs1OGtS8dRbSEiDPsKOGb+v1L6re3hnhjnzU7E0/P8qvrDhbj3uWHcSHzcOO8qtWPmxX/37UUXbYBaTSTskZeJQhi6m3c+tnSAG5EB+twXE0HxZxaNm4sfDV2oKnc4EVK/fwr+VJE5aZ7dF8WPzlSnxY7H1mYZKND6vzlAxUBSScoP0eiHw/vO6oeC1gWxKCiZAn22Gx9dJ2pP5S4yN8btxquUjyxs0WV+GD+EiezVfzq3hv2E75qtuvnh0fHgISfpVsqga0Skr+ImF6zE5k9ATHROBgdvQ41aXsKLVHS371KExafbvbb2pEDeZX3XYOZkcN9uznV7FjhPhoDbIcKeqiTjoDSQVmJwGZptvGR4Wo1XsqdE+0ozdIRuPjLHb0+k3NvtH46LVzNDtquJ8lX53FjpXfeAnIlLRzOzW02cmO4tFLRjwPO7Yi6Hs+fPjiuXU0+NiKoO/5T+XDU0BWIhL7hmmfbmDxUEUEO3w9vmO0RZDARweCvqfAhy+eW0d7Gh/eAhLbR2E9YQIliIV8/UBqj+/dSsKqnRXewA5vWLvHm9bZ4KMbP+8T4cMb0W3jPYWPPRO5vMMyQrPn922DP382duyFbN+48NGH215nwcdeyPaNeygfZ0zofbByFgiAAAiAgCsCCIgrnAwGAiAAAq+DAALyOlxjKQiAAAi4IoCAuMLJYCAAAiDwOgggIK/DNZaCAAiAgCsCCIgrnAwGAiAAAq+DAALyOlxjKQiAAAi4IoCAuMLJYCAAAiDwOgggIK/DNZaCAAiAgCsCCIgrnAwGAiAAAq+DAALyOlxjKQiAAAi4IoCAuMLJYCAAAiDwOgggIK/DNZaCAAiAgCsCCIgrnAwGAiAAAq+DAALyOlxjKQiAAAi4IoCAuMI59GDp7xn3/i72s42Mv3cQfFe+fvZ18f0g8HIIICCvQfnbV19+evv6m++DtVPiTf7/LChM1x3+ws/afvLRD9NrYddZ7OA6QeASCCAgl6CxaIQUi1lAwouTichsR/hZ2/hTyeHfk9lxfY/DwpdBYKuAeLVBvMbpJa70/S2tnxHskBjMs434ZqjWYxWfVO/pT2Fu9Y1eLsJ52rVM7xVmIAtxFF/+bDs8vn8Ev8KOd6eCjwcWW5zCqw3iNU5vwtIqdDmWpec+J7cntlPm9k5OLHIApaLy5LbQpexw8IeR4mOEfOER59jh1MZuBTIq7+zUG9sHuXH2Vvi5wpXVuEics5PGz2WSfSSF7DHJ560YtwTIwo7cdVkG1M7FDgtyi2PM8fGHP/mddJZ1+6ef/UfqK8+Mj8Va2YnjHDvWbuzmVy3JbVGpC4fK9aBXAfJYwI3mtI7XHM2ZE+YKN02acl0gFRZtrCgquXF2ruQXlfoW8ZAzltROKaAJf+58lATcco2WYxxmBDm7W/xZi404bozJlvG8uAjjtH7v0HEe4+Ls+WpUO6wCorYVRBssbQMt+uxaYKe7gmLylpGwQ7AvxCNJjuGrV2sGtchMdzaltm6s3EzJSsOudt0tnydCafUZy1eY/EYKS1hAD7uv4i6s8G9YSLdgsLcdiu8ufEqKvFagpJ9L3zo6PpSYTXfvZTHHDovrm44ZPu9ak0E20GtOrsEkHGyRsAuOZ0LbcNDKDhmY2lqAYcxpG6mscMQ5H3z15advewnh1998rwZ1IdkszKklsVHsiPgGsQh/qYDE90ptxocte/MxQ6bM3BabAEp+NVJ8YMe8TXxRDMiiJsbbjnE+rF9ZBCQ7pU2AU2cduUDRpmTaeI6k5OyQN6StbCi1pzJVWni79F0WTSodo4qg1h6UTm6p3BWsF+0J59mUyY7oE1I8wnvyPhD5WZJ8I46H2ZEWEmnrxEr+QPExXTJ2TPdQrQpFQ2vMSnl63Cnybk1AtMWWaOiiV5tab0m8IsHNY8VxIjFOSWthR1o9xOo0Jv4NiXeVqOJYe9mRsWV29PC91sq9xpljC2jFR8mOKBjh33jzYE5AauPsyUeC32njAzvuGaEwQz80X43MR1VANCCVKm+1MN1R8apT/ExF2arqi7G1VlVa8fUk3tyOrqQqrWFenH3kqiB5krSltXIv7Up7hh3yvo8WATnaDg1/MSs8VXxEW84e59hxXytM1wiTTsOmvFtKZtnZh7L4vKXira6DbKzeV3Zo6xXSplQ8YgUsq9+YzEp993QWdYQdcgbnUblLwXKaFZr4kIWLJoLRTo0Ty6zMYTZ12fhIfUhbm+wosA6Pc+y4C0iaq+S6dS2X15YQigKiJY+4UymdmWgLnbXEK8fQFg6Vxeme6n1xk18hia/udG6peB/OatnHHw7d044w/lzxWmcgIulq15ZLlnvaUbTBKCDP4mNV1Z00PrDj0TaVs/qkQMndZ7JHnA/HRy4BpHdWyxm6PGd1Q15Hwopjq+MqLZuWpGW1I16De+KVwG1oAZXsSB3VM/Gq9ytgx/1RK9pMNt3M4DgjfGZ8XCXOseP94aMuedfUwjIkcc/EuwpOr9ZPJuhXi50bWibqji5lR02LCC7ELa2EtHZNad3AWLlPhxnWdHazQ353Dx8Sl6PsKKzXnTU+1Blc7Cw0ztBXY6XxuGOcY4fYgJJpS3Xl3ewMRFZXpQVJmWh6Al3243ZIWqutcHJGkCZfj8QrsdK2YnYGSXVLX7RLrsn08qH1RZ2C3WRHusmhx47IbW69a6OoF/0q3c3m4FdzYeIshtiR7OwzFljw8QDKLCDpQppnwpLCoS3YJcmrpeotJqz0e7cGupKspmsVNxP2Pnpcs6PYSsxVibUASUR1gfWRdsRdfL12yN0n6ZrTTnbMtUlaRGz1q2fFB3bc7zeSM63CWsjqXpnaAnRazJYeI5MW1x6FoodfFRdMC4lbvd+hp1KsLJRvuSHPeu5qYarHDpF4ezFV/Gl6y2rHfGwc6Mx2OArIM/i4SnxghyIghTXAllhN491y7nB8ZHepGKv+ubfbWylWEm9rAo2kWMiQBF7Gjp0T72F8XMUOx7Wc1m5Bz/pm8Tt2LEwO8yv4uP+Kp1feRUDuWL5dJWFdyQ7ZOmjZ3RePfdxAReJdz21ftsBCQPYTkFanOirxtlYn2PH4rfCeFpZYO/CqYLv52FlA8Cv7zxofUWDBxwn50BZipx0Gxt1Cz3AsuVVW7W8/Cq6XtePgxLsHH6biJHcXulEE04S1hx3EhyhmKjNC+Dhh3q0tMNZ2PB0VIJpzrSfmy3esIjgnqwMSL3Z8Mz3VtOZXRwnIIXyUhC667A5i6B4f2HHflWUQwpfxq9IaiDnID0q8LaS0iMfRArKnHUcm3qfYEX1N/qCUTMLG9Y80uVr9xXpcHH8qsIiP+1ZYY+Ld06/g4/FTCF58ICDvqaQ6m3KoEufEYm0RGo+TCfEqdty++PyzaduihnsqIPKYhkS1Nx8kLOeElSg/gl5Y76zNGBviJIvzYg2kI1kdXfFaqpNWp1pUiyXQHQXkcDt2qtz3tCM7M0x/kTDlpSEwFsJb8X/86vFzwgG01l1xHZzU8K59ns4yXyLOLb+X09CGq8ZHbhE9B772/pEV7+wEjxe1RfTNduyYeKcEuYMdR1bue/KxCHhtJqK915GoFkGyAx+Xjo8dE9Ze8QEf9nWcNH+u8pVlnaOWhFVCdk68tWvq+vzAlknX9TWcpLZOdqrcGy6r+9CFPbH6lT4WXm8Uj+6Lq5x4lfjAjrF8bAg+PATkGRXvrsGeVrYnTbzZ/vsOlftefKxmB3FROoiFfF2YORxxbcXvuEphgh3fBZ5dcqaHU47AhxcYV6p4r5R4z1y552JM+40SLz/2iGttjKvEB3YMJCDxCRrPLHg9A4/Eu1f62TbulHDPWLlvM3u4s68SH9gxlms9lQ9PAQmwXqnivVriPWPlPlaobr+aq8QHdmz3Bc8RnsaHt4BMInKxipfE6+nqjHWV+MCOsXz5KXzsISARVhLvWA7G1YyFwFXiAzte2K/2FJCxYOVqQAAEQAAEXBFAQFzhZDAQAAEQeB0EEJDX4RpLQQAEQMAVAQTEFU4GAwEQAIHXQQABeR2usRQEQAAEXBFAQFzhZDAQAAEQeB0EEJDX4RpLQQAEQMAVAQTEFU4GAwEQAIHXQQABeR2usRQEQAAEXBFAQFzhZDAQAAEQeB0EEJDX4RpLQQAEQMAVAQTEFU4GAwEQAIHXQQABeR2usRQEQAAEXBFAQFzhZDAQAAEQeB0EEJDX4RpLQQAEQMAVAQTEFU4GAwEQAIHXQQABeR2usRQEQAAEXBFAQFzhZDAQAAEQeB0EEJDX4RpLQQAEQMAVAQTEFU4GAwEQAIHXQQABeR2usRQEQAAEXBFAQFzhZDAQAAEQeB0EmgXkz263twDP395uzefWYN1z7PS7v3jY8e0Oduw5dmrHnpjtOTZ81KJh/Tl8jIUZfDQkzwjWH/3k44nFf/zZLxdspoISj5cH1Y5Jx95DpGJyz9mRCko8XtpROyYdew+Rgo93RuCjPbHmziA+3pEhX9X9yjSLCMkqTYq/++MfLUb/t3//xeL/4/HyzSg6gZgwZm4M+V2eIhKCw9OOkLjCmBY7PEUEPpaOHf0KPuoBXzqC+ND9inyV95qigMgqN51xpEOGJBpERBOO9NgwVjw+naHImUsYS4pOb3jIquoIO2Iii9cr7dgiJPBR9oCcX8FHGTfio8+vorBocb6l8D0TH1kB0arcAJTW+olAWsQjgh2CPYKcioZskW2djWhVVc6OmGha7YiiINtdKU7y/3tEBD5s5UPwK/iwYRWOIj5sWJGvdJxUAYnJSlbrpdaPdeahzUTCe7IFFFthWgKWJFpoj8Exoh0tIgIfFrbfj4l8t/gVfNzxGyXO4eMcfBRnINrULBfKLVW7nIVorSz5HVvbWOmsoNbCOsKOluCIWORae/CxRiDXysr5FXy8JyviI1+stPpVTxvrbPkqOwPJtXm0nVKyvSLFIaUiTc7ponrLd1pq0tKOEm2nlJzO99ghe+1aq693d1ZpxxV8vFfNKWfwUY4S4mM9a02LDPn/5Kv1rRsrAbH22ks9/tiW+s3f+L/bf//Pr93iv7n2lCYctQRcU3drb/fZdtSqX/hYbhsPM9Y9/Qo+lngTH/q6bw2XNKddNV8tBMTSa08XviOQQSjiWkh4Hf7SQI/vBSUP50VxCe+nu61qVXdpPcSy9pEutHrbkRs/XY+Ri75pvQgft8lHPPwKPt69i/jw86tcPtTiPCciZ+ZDnYFoax8pULkdVFI8wjhSJORnaT+xNr5cCwnjWhRdsyNNJLkdO7121MZP7bBUvPBxLzZiAdLiV/Cht7FyvfYaXrGyho97Oye9Gz231f6q+Wo1A8lNvSIwcWdL7sZBq2PFWUe6lzodXwqL1u/XwkPr7aaB4W1Heq9BOr78futaiDYLS4XW2w74uM3bgLUZIfFxb3G1xjnxkS96z5yvZgHReu2l5J1ukZQtIEulKNtWte2WpWliquza2kcpeR9pR6mNks5E4OO2uDG1NWHFdbgoAtr6G3zcH0dEfNzb7aWZLflquRYUfWaehuW2y6Z9+NLNf1qQxwCWBEmByT1TK50KSqHIfZb2EmVSzn2m3fznYYeWnNL1jvSO03hODvM4Zda40m7G9LBDE+90/Qk+1k9MgI9lyzGNc+Lj/SZO+SiemC/Pkq8WMxBLktam9aXZh0VASv3BWjLVZiCpcMS2Q2nBWs5cehNvaT2jJm7aDAQ+8u0Si1/Bx+2N+FhmLDmz741z8tXtbTEDKYlC7e7vvQmRVbdcN9GXBpfvpu0sS0LJ9Xe3Jqxwfsv1SEvSdpbFgbfYUVvwa7keaUeL/XsLOny0+SN83FtctXz4avkqex+I5SGG6VyN7T4AAAk1SURBVA2EPYreQoqcSdSSXKniT8UnvYFwix21XVW5tlVOEEszsJLw9woIfJR/5wY+9AX0WoEV/Yr40CP9rPkqex9ILUGnSrt3woqwywC27KuuOWxaiW61w/J98jut94HAx3Kh0ythxXFkAOc4tPhebua41a8s/MuYtN4nZfHXIwss+Kj/UN9IfKx2YVmmaDKZxzuD43vyvg9Na9PP441i1gCpBYklEWgzEC87LAFpCZLWZBVx8bIDPpaBDB/3JwBsjXPiY+lXZ89Xq11YrYmjlrA0wUgdMWyxbPnenIj0kBFnA152tARIbibSk6ysAgIfuWbh/X3Nh+Dj/qNpJQGx+hXx8f4zFlfIV9ldWOUwe/80BJd0rpb9+j2zj7RFUNtlYrUjkLnVjtbgkDOR2i4sqx3w8f6YCvio78Ky+hXx8e5XrcWu7NhcLV+ZftK25GS5hBXO0Z6FJd8Pr3tmH1anbzkuFyAtdvQmrJbrrB0LH/f7D4JfwUfNW+yfEx/vftUrIHa060eOwsdmAQmm/uWPf/QWTY6ikUu88vNRxCNe+19ssGOEZBXtgI8xxAM+xhJz+PDnw0VAYtWbikg6A5HiMdLsQ7aS5KNNctev2TGSgMDHWAICH/BRn1O0HxFnIT151ytfuQhIMCAXJGGWIX/DIRo72uyjJiIlO7zIaHeh/Bnw4Ynm9rHgYzuGniPAhw+abgKiiUjuEkcVj5yIlOwYUTzi9aZBAh8+QdM7Cnz0IrfPefCxHVdXAYkiEv6VrSA56wivR1iEqkEX7xgv2TGyeEgRgY8a28d9Hh+ySHwch3npm+BjGw/uApImLnl5ZxCOFE75tN742RmEI7VDPh02fgYf24Jny9nwsQU9/3Phow/T3QSk73I4CwRAAARA4CwIICBnYYrrBAEQAIHBEEBABiOEywEBEACBsyCAgJyFKa4TBEAABAZDAAEZjBAuBwRAAATOggACchamuE4QAAEQGAwBBGQwQrgcEAABEDgLAgjIWZjiOkEABEBgMAQQkMEI4XJAAARA4CwIICBnYYrrBAEQAIHBEEBABiOEywEBEACBsyCAgJyFKa4TBEAABAZDAAEZjBAuBwRAAATOggACchamuE4QAAEQGAwBBGQwQrgcEAABEDgLAgjIWZjiOkEABEBgMAQQkMEI4XJAAARA4CwIICBnYYrrBAEQAIHBEMgJyNvtduv5zMO80neH8Wufy2vAju2M1PCufQ4f2zmwYkh8rLFu8c8epmrj1z63ctsyzmF2aCLx9tWXn96+/ub7cBHx83jx2mc9F5s7p/TdU3Ao19YzVss4PfZhhxLI+FWPKy3Owa/wqz26Rt1+lZ1liGC/JYG/V/JVjShchyUa5ZjYYUHs/Rj4yOOFX7X50qLK1goJ4nyC6HR+VVKzrcaEWUucxcjXmuvtkazi92DHHQn4eOCwMVnhV8sIxq9e2K/UFpZsXRlnIrLdNSWrLz7/7PbtT7+bBST5/zkIw4vGisTaC5THWUUEO+CjVlvjV2KWSpzXZw6F9eTFzOyMeTcVkNaZwHT8z3/1YRSLdMahBWP4zqlqCc73yUc/rNZbjKJlnT3N6zi1cbEDPirBTnzci0LiXKwP1/JKsp7s0YEZJu+aF9FLIEUxCP8+Zh3TrCL9ewA5CYc8tkN5LQtJzcGOHYvkMM0kHYJDa/mYRB0+4KM2HcxsrCn6LX7l51eWRXRLsE/JRplVLPjPzFa0BOO14N0qItgh2hOO4tErIvABHwYNUXdnlkQEv3LyK6820Irkv/rz31+999d/8y9ZZ9ghWfUkLex4IAAf1bzVUpzgV/hV1aEeB5zKr2qtoKoxaTsqJJ7f++1fz4L1r//5v9OaR1x8084XPUOvLcPYkWEEPrI3zFoCHr/Cr+Qa7svlq5qApH1wtZ0VfUiKR0hM6V8UljRpyfN3EA/zTAQ75p1zExQ73/9TTb7wAR8WFU+Owa8SQPbMuxYByYqInD2ki+baLCQVlTgTifbKbb8Nd5y3+JjqXNhxhxA+WlxpcSx+JeAgzrv9KD1xeL+yCkhWRGSVGF6X2lfx2OhgcVeWQG3a4ruTeBRnIthxF5DkDz7suUANdvwKv7K7kHrk0H7VIiCpiMzrGHH2YREPTUTEzUjaTYUb8a+Sgh23202KOnx0u9xi50/Ekfh4n93Kbf6G+yO6iXicCB8Jgt5x3iogs4jIm+7SANHWP6Idsh8X2ybh38xNhVsdqHT+6mYc7HivFuGj2/XwK9GJSLsN+NW1/KpHQCYRecAwtzgkLLVdWPJYuWguxuxGufFE7Eg2O8BHowfph+NX+JWLIyWDDOdXvQIS7ZqqrfDX0r7S2ljG58XsQco8q8KO+865A1oLNR7xq6StSHzUXMb0OX7l7FcIyN3vcCxnxzKFc/4g+ICPjS6kno5fOfvVZgGJPc10baPEvjxWrKVsvZYtDjc9PTg82BE75gdjwscWj3oUJvjVfYMGcb7dmcQIw+SrrUliNiQaZ2llyUX20RwLO8YSEPiAD8fUS756gOmVd90ExCIcqSOMXJm0OC12tKBlOnZVYZnOehwEHy1omY6Fj0frxyvxmlAvtHjTmW3LeJ7x4SIg4eL/5A/iBgG7KX//z/evF3eg20/2PXIKEOyAD1+3uv+wGn6FX13Vr3YREMt9IAHQ0QUEO5zd3j6cmnjhww6g85HwQb5SXWqrgIRBm/qKA65/RGCw4/2XJT38YmsOgw/42OpD2vn4laNfeSSKrv6oZx/Oycuww9GxHDiBD/hwcKPVEPiVo1/tJiClx7kP1r5azUDkhgDs2COGTWOqgQ4fJuz2OAg+xlivHSpfeQhIeI7VtIIe7qOIf7XHuQ+ym2ERaNgx/Vayi094ZDD4gA8PP0rHwK/8/MorWTTtNhlo8Tz1LewYSEDi+logybLLD7/aI90uxiQ+iI+FQ3gJyLyYLmciWisozDzC3wBbd3PRNgdJnFFhx+6JqfQF8PFU+PU1BOJ8GFKeGh+eArISkSgW0dlOIB6L/mJ63djxtKBZBAl+9TQeiI+nQ69ewNPiw1tAJhEJ/5E/EytfP8zf43u9qcUOb0S3jQcf2/DzPhs+vBHdNt5T+NgzkWu3pu/5fdvgz5+NHXsh2zcufPThttdZ8LEXsn3jHsrH/wNisUGM2grJbQAAAABJRU5ErkJggg=="
        , "data:image/png;base64,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"
        , "data:image/png;base64,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" 
        , "data:image/png;base64,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"
    ],
    starburst: [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAZCAYAAADHXotLAAACC0lEQVRoQ+1aW47DMAhsztDr7uded8+QVaLQdRxgBuxU2dT9qdQ6Bs8DTNXpMV6nITDP87xsPk3TxAahF7IbjnV/CAxCAmrIgBXY/rHu/7Pp/TnTLvlYhwxCIvJ6w9pBSADks8FaUjk7xq1K1lXBYjW1I0MeIvtIuIf8d7Be7kg03EEIqSoWqAMZQfWKGGE8Ift7W/m1vT/XscR9hRySrYsoCfm+xeplDBe4BFjlYKfmaB2wJsQDYhMfTUgvsHbg1wkGwELTrwucACXxRcF1PoZDISn1/oE4LiE7pQlYStLyEQKpflQ9GAIrUMao/S2wQJwXNrWI2HJQlLESN+iQw6E0GwZAcklBykrE2eVv7V+TEogT2p+IAwkxG2GwIXrCcQ9lKIkV4iH/i5NOEWKSElASAlAlpQMZ6oXBKosN56GcQpyHJuRASkPyFjm9Lw5UeSRAQmLqSTpNiHWVjDbyEBlnlkUhYnFLB1Le7pB6Qu89sdczzspFx2kaXlWXeA2ud0uuMiBaQqYdwto2u+51oAIU7bPm/QvX7UjvSQhK0iH+EoSU5bBWjvcdOrda27efLyTOwTkJl5juk59KtBnOiHMZQlAvWg6N1sD+5E3eUiJ7EIJId9x4CUJYpWfXsf2OXefe3hjSByG8uzJOjPQ6tPb2DskCzJZHBLDmau+Z2xOSLXPsc01lTvnP1i+NE/4l1frFKQAAAABJRU5ErkJggg=="
    ]
}
game = newGame();
portrait = window.matchMedia("(orientation: portrait)");
portrait.addEventListener("change", onOrientationChange)
onOrientationChange(window.matchMedia("(orientation: portrait)"));

game.player = newAdventurer(newInputController());
game.player.team = HEROIC;
x = game.screen.drawRect(0,0,100,100,"#F0F","#000",3);

clearScreen();//init Screen
newLevel(); 
game.currentRoom = getRoom(0,0);
game.currentRoom.objects.push(game.player);

game.currentRoom.render();
gameLoop(Date.now());


