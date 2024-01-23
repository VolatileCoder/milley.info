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

const DEAD = -2
const DYING = -1
const IDLE = 0;
const WALKING = 1;
const ATTACKING = 2;
const HURT = 3;


const UNSET = 0;
const PLAYER = 1;
const ENEMY = 2;

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

function newBox(x, y, w, h) {
    return {
        x: x,
        y: y,
        width: w,
        height: h,
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
            this.element.attr({x:this.x, y:this.y + dimensions.infoHeight});
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

function newController(){
    var controller =  {
        up:0,
        left:0,
        down:0,
        right:0,
        buttonPressed:0,
        elements: [],
        screen: newScreen("controller")
    };

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
                this.buttonPressed = true;
            }

        })
        if(!dpadTouched){
            this.up = 0;
            this.right = 0;
            this.down =  0;
            this.left = 0;
        }
        if(!buttonTouched){
            this.buttonPressed = 0;
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
        butt.attr({fill:this.buttonPressed ? "#600" : "#800"})

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
                controller.buttonPressed = 0;
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
                controller.buttonPressed = 1;
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

function newSprite(screen, uri, imageWidth, imageHeight, spriteWidth, spriteHeight, x, y){
    return {
        screen: screen,
        image: {
            uri: uri,
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
            series: 0,
            frame: 0,
            startTime: Date.now()
        },
        setAnimation: function(series){
            if (series!=this.animation.series){
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
                this.element = this.screen.image(this.image.uri, 0, 0, this.image.width, this.image.height).attr({opacity:0});
                console.log("BAM!")
                this.lastLocation.x = this.location.x;
                this.lastLocation.y = this.location.y;
                this.lastLocation.r = this.location.r;
                this.screen.onClear(()=>{this.element = null});
                this.ready = 1
            }   
    
            var trans0 = this._buildTranslation(this.lastLocation.x, this.lastLocation.y, this.lastLocation.r);
            var trans1 = this._buildTranslation(this.location.x, this.location.y, this.location.r);
    
            var rect = this._buildClipRect(); 
            if(this.image.width==800){
                console.log(trans0, trans1, rect);
            }

            if (this.element && this.ready == 1){
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
        type: UNSET,
        layer: DEFAULT,
        plane: PHYSICAL,
        _stateStart: Date.now(),
        setState: function(state){
            this.state = state;
            this._stateStart = Date.now()
        },
        move: function (deltaT){
            console.warn("unimplemented: move()");
        },
        render: function(deltaT){
            console.warn("unimpelmented: render()");
            this.box.render("#F0F");
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
            if(this.sprite)
                this.sprite.remove();
            return;
        }
        if(!this.sprite){
            this.sprite = newSprite(game.screen, images.starburst, 100, 25, 25, 25, this.box.x, this.box.y);
            this.sprite.setAnimation(0);
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
    return starburst;
}

function newPlayer(controller){
    var player = newGameObject();
    player.controller = controller;
    player.box.x = Math.round(dimensions.width / 2)-25;
    player.box.y = Math.round(dimensions.width / 2)-25;
    player.box.width = 50;
    player.box.height = 50;
    player.direction = SOUTH; //init facing the player
    player.type = PLAYER;
    player.keys = 0;
    player.speed = 150; //in px/sec
    player.whip = {
        thickness: 5,
        length: 150,
        duration: 250
    }


    player.render = function(deltaT){
        framestart = Date.now()
        if(!this.sprite){
            this.sprite = newSprite(game.screen, images.adventurer, 800, 1200, 100, 100, 0, 0);
            
            //this.sprite = newSprite(game.screen, images.caveSpider, 100, 400, 100, 100, 0, 0);
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
        

            if(game.debug && this.whip.box){
                this.whip.box.render("#A00")
            }
            if(framestart-this._stateStart>this.whip.duration){
                this.setState(IDLE);
                
                if(this.whip.element) this.whip.element.remove();
                this.whip.element = null;
                if(this.whip.box && this.whip.box.element) this.whip.box.element.remove();
                this.whip.box = null;
            }
        }
            //render player sprite
        this.sprite.setAnimation(this.direction + (this.state*4));
        this.sprite.location.x = this.box.x-25;
        this.sprite.location.y = this.box.y-50;
        this.sprite.render(deltaT);
        if(this.sprite.element){
            this.sprite.element.toFront();
        }

    };

    player.attack = function(){
        if(this.state != ATTACKING){
            this.setState(ATTACKING);
            switch (this.direction){
                case NORTH:
                    this.whip.box = newBox(
                        Math.round(this.box.x + this.box.width / 2 - this.whip.thickness / 2),
                        constrain((game.currentRoom.box.y - game.currentRoom.wallHeight / 2) ,this.box.y - this.whip.length, this.box.y),
                        this.whip.thickness,
                        constrain(0, this.whip.length, this.box.y - game.currentRoom.box.y + game.currentRoom.wallHeight / 2)
                    )
                    break;
                case EAST:
                    this.whip.box = newBox(
                        constrain(this.box.x + this.box.width,this.box.x + this.box.width,game.currentRoom.box.x+game.currentRoom.box.width + game.currentRoom.wallHeight/2),
                        Math.round(this.box.y - 25 + this.box.height/2 - this.whip.thickness/2),
                        constrain(0, this.whip.length, (game.currentRoom.box.x + game.currentRoom.box.width + game.currentRoom.wallHeight/2) - (this.box.x + this.box.width)),
                        this.whip.thickness
                    )
                    break;
                case SOUTH:
                    this.whip.box = newBox(
                        Math.round(this.box.x + this.box.width/2 - this.whip.thickness/2),
                        constrain(this.box.y + this.box.height,this.box.y + this.box.height,game.currentRoom.box.y+game.currentRoom.box.height),
                        this.whip.thickness,
                        constrain(0, this.whip.length, (game.currentRoom.box.y + game.currentRoom.box.height + game.currentRoom.wallHeight/2) - (this.box.y + this.box.height))
                    )
                    break;
                case WEST:
                    this.whip.box = newBox(
                        constrain(game.currentRoom.box.x - game.currentRoom.wallHeight/2,this.box.x - this.whip.length, this.box.x),
                        Math.round(this.box.y - 29 + this.box.height/2 - this.whip.thickness/2),
                        constrain(0, this.whip.length, this.box.x - game.currentRoom.box.x + game.currentRoom.wallHeight/2),
                        this.whip.thickness
                    )
                    break;
            }
            var distance = 1000;
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
            
            if(collidingWith){
                sb = newStarburst();
                game.currentRoom.objects.push(sb);

                switch(this.direction){
                    case NORTH:
                        this.whip.box = newBox(
                            Math.round(this.box.x + this.box.width / 2 - this.whip.thickness / 2),
                            collidingWith.box.y + collidingWith.box.height,
                            this.whip.thickness,
                            Math.abs(this.box.y - (collidingWith.box.y + collidingWith.box.height))
                        )
                        sb.box.x = this.whip.box.x - sb.box.width / 2;
                        sb.box.y = this.whip.box.y - sb.box.height / 2;

                        break;
                    case EAST:
                        this.whip.box = newBox(
                            this.box.x + this.box.width,
                            Math.round(this.box.y - 25 + this.box.height/2 - this.whip.thickness/2),
                            Math.abs(collidingWith.box.y - (this.box.x + this.box.width)),
                            this.whip.thickness
                        )
                        sb.layer = EFFECT
                        sb.box.x = this.whip.box.x + this.whip.box.width  - sb.box.width / 2;
                        sb.box.y = this.whip.box.y - sb.box.height / 2;

                        break;
                    case SOUTH:
                        this.whip.box = newBox(
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
                        this.whip.box = newBox(
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

    player.move = function(deltaT) {
        
        //read controller
        x = this.controller.left *-1 + this.controller.right;
        y = this.controller.up*-1  + this.controller.down;
        b = this.controller.buttonPressed;
        
        if(b){
            game.player.attack();
        }

        if(this.state != ATTACKING){
            
            if (y<0){
                this.direction=NORTH;
            }else if(x>0){
                this.direction=EAST;
            }else if(y>0){
                this.direction=SOUTH;
            }else if(x<0){
                this.direction=WEST;
            }

            //TODO: always return x & y
            constrained = game.currentRoom.constrain(this,
                this.box.x + Math.round(x * this.speed * deltaT/1000),
                this.box.y + Math.round(y * this.speed * deltaT/1000)
            )

            if (constrained && (this.box.x != constrained.x || this.box.y != constrained.y)){
                if (this.state!=WALKING){
                    this.state = WALKING;
                    this.sprite.setAnimation(WALKING);
                }
                this.box.x = constrained.x;
                this.box.y = constrained.y;
            }
            else {
                if (this.state!=IDLE){
                    this.state = IDLE;
                    this.sprite.setAnimation(IDLE);
                }
            }   
        }

    }

    return player;
}

function newCaveSpider(){
    var spider = newGameObject();
    spider.box.x = Math.round(dimensions.width / 2)-100;
    spider.box.y = Math.round(dimensions.width / 2)-100;
    spider.box.width = 75;
    spider.type = ENEMY;
    spider.direction = EAST;
    spider.render = function(deltaT){
        framestart = Date.now()
        if(!this.sprite){
            this.sprite = newSprite(game.screen, images.caveSpider, 100, 400, 100, 100, 0, 0);
        }
        if(game.debug){
            this.box.render("#FFF");
        } 
        
        this.sprite.location.x = this.box.x-15;
        this.sprite.location.y = this.box.y-40;
        this.sprite.setAnimation(this.direction);
        this.sprite.render(deltaT);
        if(this.sprite.element){
            this.sprite.element.toFront();
        }
    }

    spider.move = function(deltaT) {
        //AI goes here?
    }
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
        player: newPlayer(),
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
    level.rooms[level.rooms.length-1].opened = 0;
    level.rooms[level.rooms.length-1].exit = 1;
    

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
            
            
            //todo: constrain against all other objects
            this.objects.forEach((gameObject2)=>{
                if(gameObject!=gameObject2){
                    if(constrained.collidesWith(gameObject2.box)){
                        //revert to original
                        constrained.resolveCollision(gameObject2.box);
                    }
                }
            })
            
            //todo: move door concerns?
            allowance = Math.round((game.constants.doorWidth/2)+game.constants.doorFrameThickness);
            for(d=0;d<this.doors.length;d++){
                door = this.doors[d];
                if(!door.opened && game.player.keys>0 && game.player.box.inside(door.box)){
                    door.opened = 1;
                    game.player.keys--;
                    game.level.findNeighbor(this, door.wall).opened=1;
                    clearScreen();
                    this.render();
                } else if(!door.opened || room.barred) {
                    /*
                    if(game.player.keys>0){
                        
                        nextRoom = game.level.findNeighbor(game.currentRoom, direction);
                    }
                    */
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
            offset.x = 0//focus.x + this.room.box.x + this.room.wallHeight;
            offset.y = 0//focus.y + this.room.box.y + this.room.wallHeight + dimensions.infoHeight;
        
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
            x1 = this.offset - game.constants.doorWidth/2 ;
            y1 = -focus.x;
            x4 = this.offset + game.constants.doorWidth/2;
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
        
            if(this.barred){
                
                bars = 5;
                for(i=1;i<5; i++){
                    x0 = (this.offset - game.constants.doorWidth/2) + (game.constants.doorWidth/5) * i;
                    y0 = -this.room.box.width/2;
                    //game.screen.rect(x0+offset.x,y0+offset.y,1,1).attr({"stroke":"#f3f"});
                    y1 = -this.room.box.width/2 - game.constants.doorHeight;
                    x1 = (trig.cotangent(trig.pointToAngle(y0,x0)) * y1);                    
                    //game.screen.drawPoly(x0,y0,x0,y1,x1,y1,x1,y0,offset.x,offset.y,palette.doorBarColor, "#000",0)
                    this.elements.push(game.screen.drawLine(x0+offset.x, y0+offset.y, x1+offset.x, y1+offset.y, palette.doorBarColor, game.constants.lineThickness));
                    this.elements.push(game.screen.drawLine(dx2+offset.x, dy2+offset.y, dx3+offset.x, dy3+offset.y, "#000", game.constants.lineThickness));
                
                }
            }
        
            this.elements.forEach((element)=>{
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
                y : room.box.y - game.constants.doorHeight + game.constants.doorFrameThickness + 50
            };
        case EAST: 
            return {
                x : room.box.x + room.box.width - 25, 
                y : game.player.box.y//room.box.y + room.wallHeight - game.constants.doorHeight/2
            };
        
        case SOUTH:
            return {
                x : game.player.box.x,//room.box.x + room.wallHeight + door.offset + room.box.width/2,
                y : room.box.y + room.box.height - 25
            };
        case WEST: 
            return {
                x : room.box.x - 25,
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
    
    //Sort List of objects in current room by their y values.
    game.currentRoom.objects.sort((a,b)=>{return a.layer < b.layer ? -1 : a.layer > b.layer ? 1 : a.box.y < b.box.y ? -1 : a.box.y > b.box.y ? 1 : 0;})

    //Render all objects in current room in order. 
    game.currentRoom.objects.forEach((o)=>o.render(deltaT));
    
    //remove the dead objects.
    deadObjects.forEach((o)=>game.currentRoom.objects.splice(game.currentRoom.objects.indexOf(o),1));

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
    adventurer: "data:image/png;base64,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"
    ,caveSpider: "data:image/png;base64,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"
    ,starburst: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAZCAYAAADHXotLAAACC0lEQVRoQ+1aW47DMAhsztDr7uded8+QVaLQdRxgBuxU2dT9qdQ6Bs8DTNXpMV6nITDP87xsPk3TxAahF7IbjnV/CAxCAmrIgBXY/rHu/7Pp/TnTLvlYhwxCIvJ6w9pBSADks8FaUjk7xq1K1lXBYjW1I0MeIvtIuIf8d7Be7kg03EEIqSoWqAMZQfWKGGE8Ift7W/m1vT/XscR9hRySrYsoCfm+xeplDBe4BFjlYKfmaB2wJsQDYhMfTUgvsHbg1wkGwELTrwucACXxRcF1PoZDISn1/oE4LiE7pQlYStLyEQKpflQ9GAIrUMao/S2wQJwXNrWI2HJQlLESN+iQw6E0GwZAcklBykrE2eVv7V+TEogT2p+IAwkxG2GwIXrCcQ9lKIkV4iH/i5NOEWKSElASAlAlpQMZ6oXBKosN56GcQpyHJuRASkPyFjm9Lw5UeSRAQmLqSTpNiHWVjDbyEBlnlkUhYnFLB1Le7pB6Qu89sdczzspFx2kaXlWXeA2ud0uuMiBaQqYdwto2u+51oAIU7bPm/QvX7UjvSQhK0iH+EoSU5bBWjvcdOrda27efLyTOwTkJl5juk59KtBnOiHMZQlAvWg6N1sD+5E3eUiJ7EIJId9x4CUJYpWfXsf2OXefe3hjSByG8uzJOjPQ6tPb2DskCzJZHBLDmau+Z2xOSLXPsc01lTvnP1i+NE/4l1frFKQAAAABJRU5ErkJggg=="}

game = newGame();
portrait = window.matchMedia("(orientation: portrait)");
portrait.addEventListener("change", onOrientationChange)
onOrientationChange(window.matchMedia("(orientation: portrait)"));

game.player = newPlayer(newController());//TODO: remove controller from game

x = game.screen.drawRect(0,0,100,100,"#F0F","#000",3);

//alert(x);
clearScreen();//init Screen
//alert(x);
newLevel();
game.currentRoom = getRoom(0,0);
game.currentRoom.objects.push(game.player);
game.currentRoom.objects.push(newCaveSpider());

game.currentRoom.render();
gameLoop(Date.now());


