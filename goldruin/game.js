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

const PLAYERSTATE_IDLE = 0;
const PLAYERSTATE_WALKING = 1;
const PLAYERSTATE_WHIPPING = 2;

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
            if(
                
                ((this.x >= box.x && this.x <= box.x + box.width) ||
                (this.x + this.width >= box.x && this.x + this.width <= box.x + box.width)) &&
                ((this.y >= box.y && this.y <= box.y + box.height) ||
                (this.y + this.height >= box.y && this.y + this.height <= box.y + box.height))
            ){
                return true;
            }
            return false;
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
    screen = Raphael(domElementId, dimensions.width, dimensions.height);
    screen.setViewBox(0, 0, dimensions.width, dimensions.height, true);
    screen.canvas.setAttribute('preserveAspectRatio', 'meet');
    screen.canvas.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space","preserve"); 

    screen.reset = function(){
        game.controller.elements = [];
        this.clear();
    }

    //helper functions

    screen.drawLine = function(x1,y1,x2,y2,color,thickness){
        path = "M" + x1 + "," + y1 + "L" + x2 + "," + y2;
        console.log(path);
        return this.path(path).attr({"stroke-width": thickness, "stroke":color});
    };

    screen.drawTriangle =  function(x1,y1,x2,y2,x3,y3, translateX, translateY, fillColor, strokeColor, thickness){
        path =  "M" + (x1 + translateX) + "," + (y1 + translateY) + "L" + (x2 + translateX) + "," + (y2 + translateY) + "L" + (x3 + translateX) + "," + (y3 + translateY) + "Z";
        return this.path(path).attr({"stroke-width": thickness, "stroke": strokeColor, "fill": fillColor});
    };
    
    screen.drawRect = function(x,y,w,h,color,strokecolor, thickness){
        return this.rect(x,y,w,h).attr({"stroke-width": thickness, "stroke":strokecolor, "fill": color});
    };

    screen.drawPoly = function(x1,y1,x2,y2,x3,y3,x4,y4, translateX, translateY, fillColor, strokeColor, thickness){
        path =  "M" + (x1 + translateX) + "," + (y1 + translateY) + "L" + (x2 + translateX) + "," + (y2 + translateY) + "L" + (x3 + translateX) + "," + (y3 + translateY) + "L" + (x4 + translateX) + "," + (y4 + translateY) + "Z";
        return this.path(path).attr({"stroke-width": thickness, "stroke": strokeColor, "fill": fillColor});
    };

    screen.drawEllipse = function(x1,y1,r1,r2, translateX, translateY, fillColor, strokeColor, thickness){
        return this.ellipse(x1+translateX, y1+translateY, r1, r2).attr({"stroke-width": thickness, "stroke": strokeColor, "fill": fillColor});
    };

    screen.drawAngleSegmentX = function(angle, startX, endX, translateX, translateY, color, thickness){
        startY = Math.round(trig.tangent(angle) * startX);
        endY = Math.round(trig.tangent(angle) * endX);
        startX+=translateX; endX += translateX;
        startY+=translateY; endY += translateY;
        return this.drawLine(startX, startY, endX, endY, color, thickness);
    };
    
    screen.drawAngleSegmentY = function(angle, startY, endY, translateX, translateY, color, thickness){
        startX = Math.round(trig.cotangent(angle) * startY);
        endX = Math.round(trig.cotangent(angle) * endY);
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
        
        button = this.elements[this.elements.length-3];
        dpad = this.elements[this.elements.length-2];
        controller = this.elements[this.elements.length-1];
        
        r = e.target.getBoundingClientRect();
     
        //r.y = r.y - dimensions.infoHeight - dimensions.width
        touches = Array.from(e.touches);
        dpadTouched = false;
        buttonTouched = false;
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
        centerY = Math.round((dimensions.height - dimensions.width - dimensions.infoHeight)/2 + dimensions.width + dimensions.infoHeight);
        dPadLeft = Math.round(dimensions.width/4);  
        if (this.elements.length ==0){

            
           this.screen.rect(0, dimensions.width + dimensions.infoHeight, dimensions.width, dimensions.height - dimensions.width - dimensions.infoHeight).attr({"fill":"#242424", "r": 50});
            color = "#3a3a3a"
            this.elements.push(this.screen.drawEllipse(dPadLeft, centerY, game.constants.controllerRadius, game.constants.controllerRadius,0,0,color,"#000",game.constants.lineThickness));
            color = "#444444"
            this.elements.push(this.screen.drawRect(dPadLeft - game.constants.controllerCrossThickness/2, centerY - game.constants.controllerRadius, game.constants.controllerCrossThickness, game.constants.controllerRadius*2,color, "#000",game.constants.lineThickness))
            this.elements.push(this.screen.drawRect(dPadLeft - game.constants.controllerRadius, centerY - game.constants.controllerCrossThickness/2, game.constants.controllerRadius*2, game.constants.controllerCrossThickness,color, "#000",game.constants.lineThickness))
            this.elements.push(this.screen.drawRect(dPadLeft - game.constants.controllerCrossThickness/2, centerY - game.constants.controllerCrossThickness/2-game.constants.lineThickness/2, game.constants.controllerCrossThickness, game.constants.controllerCrossThickness + game.constants.lineThickness,color, color,0))
            this.elements.push(this.screen.drawLine(dPadLeft - game.constants.controllerCrossThickness/2, centerY - game.constants.controllerCrossThickness/2, dPadLeft + game.constants.controllerCrossThickness/2, centerY + game.constants.controllerCrossThickness/2,"#000",game.constants.lineThickness))
            this.elements.push(this.screen.drawLine(dPadLeft + game.constants.controllerCrossThickness/2, centerY - game.constants.controllerCrossThickness/2, dPadLeft - game.constants.controllerCrossThickness/2, centerY + game.constants.controllerCrossThickness/2,"#000",game.constants.lineThickness))
            arrowMargin = 4*game.constants.lineThickness;
            arrowHeight = 40;
            color = "#303030"
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
            
            
            el = this.screen.drawEllipse(Math.round(dimensions.width*.75), centerY, game.constants.controllerRadius/2, game.constants.controllerRadius/2,0,0,"#800","#000",game.constants.lineThickness);
            this.elements.push(el);

            el = this.screen.drawEllipse(dPadLeft, centerY, game.constants.controllerRadius, game.constants.controllerRadius,0,0,"90-rgba(200,200,200,0.05)-rgba(0,0,0,0.2):50","#000",game.constants.lineThickness).attr({"opacity":.2})
            this.elements.push(el);

            e2 = this.screen.drawRect(0, dimensions.width + dimensions.infoHeight, dimensions.width, dimensions.height-(dimensions.width + dimensions.infoHeight),"#000","#000",game.constants.lineThickness).attr({"opacity":.1})
            e2.touchstart((e)=>{this.touchStartOrMove(e)});
            e2.touchmove((e)=>{this.touchStartOrMove(e)});
            e2.touchend((e)=>{this.touchStartOrMove(e)});
            this.elements.push(e2);
        }

        butt = this.elements[this.elements.length-3];
        
        butt.attr({fill:this.buttonPressed ? "#600" : "#800"})

        el = this.elements[this.elements.length-2];
        //read controller
        x = game.controller.left * -1 + game.controller.right;
        y = game.controller.up * -1  + game.controller.down;

        degrees = 0;
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
    }
    
    window.onkeydown = function(e){
        //TODO:move to controller

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
    }

    return controller;
}

function newSprite(screen, uri, imageWidth, imageHeight, spriteWidth, spriteHeight, x, y){
    sprite = {
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
        }
    };
    sprite.setAnimation = function(series){
        if (series!=this.animation.series){
            this.animation.series = series;
            this.animation.frame = 0;
            this.animation.startTime = Date.now();
        }
    }

    sprite._buildTranslation = function (x, y, r){
        tx = Math.round(x - this.animation.frame * this.size.width);
        ty = Math.round(y - this.animation.series *  this.size.height) + dimensions.infoHeight;
        t = "t" + tx + "," + ty 
        if(r == 0){
            return t
        }
        rx = Math.round(frame * this.size.width + this.size.width/2);
        ry = Math.round(this.animation.series *  this.size.height + this.size.height/2);
        return t + "r" + r + "," + rx + "," + ry;
    }

    sprite._buildClipRect = function (){
        x = Math.round(this.animation.frame * this.size.width) 
        y = Math.round(this.animation.series * this.size.height)
        w = this.size.width;
        h = this.size.height;
        return "" + x + "," + y +"," + w + "," + h;
    }

    sprite._calculateCurrentFrame = function(deltaT) {
        animdelta = Date.now() - this.animation.startTime;
        frame = Math.round((animdelta / 1000) * game.constants.spriteFamesPerSecond) % Math.round(this.image.width/this.size.width);
        return frame
    }
    
    sprite.render = function(deltaT){
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
            this.lastLocation.x = this.location.x;
            this.lastLocation.y = this.location.y;
            this.lastLocation.r = this.location.r;
            this.screen.onClear(()=>{this.element = null});
        }

        trans0 = this._buildTranslation(this.lastLocation.x, this.lastLocation.y, this.lastLocation.r);
        trans1 = this._buildTranslation(this.location.x, this.location.y, this.location.r);

        rect = sprite._buildClipRect();

        
        if (this.element){
            this.element.attr({opacity:1}).animate({transform:trans0, "clip-rect": rect},0, null,()=>{
                if (this.element){        
                    this.element.animate({transform:trans1, "clip-rect": rect}, deltaT, 'linear');
                }
            })
        }

        this.lastLocation.x = this.location.x;
        this.lastLocation.y = this.location.y;
        this.lastLocation.r = this.location.r;
                 
        return this.element;
    }
    return sprite
}

function newPlayer(){
    return {
        
        box: newBox(Math.round(dimensions.width / 2)-25, Math.round(dimensions.width / 2)-25,50,50),
        direction: SOUTH,
        hearts: 3.0,
        gold: 0,
        keys: 0,
        bombs: 0,   
        speed: 150,
        whip: {
            thickness: 25,
            length: 150,
            duration: 250
        },
        _stateStart: Date.now(),
        state: PLAYERSTATE_IDLE,
        lastTrans:"",
        setState: function(state){
            this.state = state;
            this._stateStart = Date.now()
        },
        render: function(deltaT, state){
            framestart = Date.now()
            if(!this.sprite){
                this.sprite = newSprite(game.screen, "img/adventurer.png", 800, 1200, 100, 100, 0, 0);
            }
            if(game.debug){
                this.box.render("#FF0");
            } 
            
            //render whip
            if(this.state == PLAYERSTATE_WHIPPING){
                if(!this.whip.element && framestart - this._stateStart > 100){
                    switch(this.direction){
                        case NORTH:
                            this.whip.element = game.screen.drawRect(Math.round(this.whip.box.x + this.whip.box.width/2)-2, this.whip.box.y + dimensions.infoHeight, 3, this.whip.box.height, "#624a2e","#000", 2 )
                            this.whip.element.transform("t0,-25");
                            break;
                        case EAST:
                            this.whip.element = game.screen.drawRect(this.whip.box.x+10,  Math.round(this.whip.box.y + this.whip.box.height/2)-2 + dimensions.infoHeight, this.whip.box.width-10, 3, "#624a2e","#000", 2)
                            this.whip.element.transform("t0,-25");
                            break;
                        case SOUTH: 
                            this.whip.element = game.screen.drawRect(Math.round(this.whip.box.x + this.whip.box.width/2)-2, this.whip.box.y + dimensions.infoHeight, 3, this.whip.box.height, "#624a2e","#000", 2)
                            break;
                    
                        case WEST:
                            this.whip.element = game.screen.drawRect(this.whip.box.x,  Math.round(this.whip.box.y + this.whip.box.height/2)-6 + dimensions.infoHeight, this.whip.box.width-10, 3, "#624a2e","#000", 2)
                            this.whip.element.transform("t0,-25");
                            break;
                        }
                        //this.whip.element.animate({transform:"t0,0"},this.whip.duration);
                }
            

                if(game.debug && this.whip.box){
                    this.whip.box.render("#A00")
                }
                if(framestart-this._stateStart>this.whip.duration){
                    this.setState(PLAYERSTATE_IDLE);
                    
                    if(this.whip.element) this.whip.element.remove();
                    this.whip.element = null;
                    if(this.whip.box && this.whip.box.element) this.whip.box.element.remove();
                    this.whip.box = null;
                }
            }
                //render player sprite
            sprite.setAnimation(this.direction + (this.state*4));
            this.sprite.location.x = this.box.x-25;
            this.sprite.location.y = this.box.y-50;
            this.sprite.render(deltaT);
            if(this.sprite.element){
                this.sprite.element.toFront();
            }

        },
        attack: function(){
            if(this.state != PLAYERSTATE_WHIPPING){
                this.setState(PLAYERSTATE_WHIPPING);
                this.whip.cracked = false;
                switch (this.direction){
                    case NORTH:
                        this.whip.box = newBox(
                            Math.round(this.box.x + this.box.width/2 - this.whip.thickness/2),
                            constrain(game.currentRoom.box.y,this.box.y - this.whip.length, this.box.y),
                            this.whip.thickness,
                            constrain(0, this.whip.length, this.box.y - game.currentRoom.box.y)
                        )
                        break;
                    case EAST:
                        this.whip.box = newBox(
                            constrain(this.box.x + this.box.width,this.box.x + this.box.width,game.currentRoom.box.x+game.currentRoom.box.width),
                            Math.round(this.box.y + this.box.height/2 - this.whip.thickness/2),
                            constrain(0, this.whip.length, (game.currentRoom.box.x + game.currentRoom.box.width) - (this.box.x + this.box.width)),
                            this.whip.thickness
                        )
                        break;
                    case SOUTH:
                        this.whip.box = newBox(
                            Math.round(this.box.x + this.box.width/2 - this.whip.thickness/2),
                            constrain(this.box.y + this.box.height,this.box.y + this.box.height,game.currentRoom.box.y+game.currentRoom.box.height),
                            this.whip.thickness,
                            constrain(0, this.whip.length, (game.currentRoom.box.y + game.currentRoom.box.height) - (this.box.y + this.box.height))
                        )
                        break;
                    case WEST:
                        this.whip.box = newBox(
                            constrain(game.currentRoom.box.x,this.box.x - this.whip.length, this.box.x),
                            Math.round(this.box.y + this.box.height/2 - this.whip.thickness/2),
                            constrain(0, this.whip.length, this.box.x - game.currentRoom.box.x),
                            this.whip.thickness
                        )
                        break;
                        break;
                }
            }
        }
    }
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
        controller: newController(),
        player: newPlayer(),
    };
}

function clearScreen(){
    if (!game.screen){
        
        controllerHeight = dimensions.height-dimensions.infoHeight-dimensions.width;
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
        game.screen.reset();
    }

    gameElement = game.screen.rect(0, 0, dimensions.width, dimensions.height).attr({"fill":"#080808"});

    //register Virtual Controller
    
    game.controller.render();
}

function newLevel(){
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
    enterance = getRoom(0,0);
    var x = level.rooms.length;
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

            if(this.exit){
                //render exit
                centerX = this.box.x + this.wallHeight + this.box.width/2
                centerY = this.box.y + this.wallHeight + this.box.height/2 + dimensions.infoHeight

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
            /*
            if(game.debug){
                this.box.render("#F00");
            }
            */
        },
        findDoor: function(wall){
            for(i = 0; i<this.doors.length;i++){
                if(this.doors[i].wall == wall){
                    return this.doors[i];
                }
            }
            return null;
        },
        constrainPlayer: function(x1, y1, x2, y2){
            constrained = {x:x1, y:y1};
            //game.player.box
            constrained.x = constrain(this.box.x, x2, this.box.x + this.box.width - game.player.box.width);
            constrained.y = constrain(this.box.y, y2, this.box.y + this.box.height - game.player.box.height);
            
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
            if (game.debug && this.box ){
                this.box.render("#0FF");
            }
            if (game.debug && this.trip ){
                this.trip.render("#F00");
            }
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
    startTime = Date.now();
    deltaT = startTime-lastTime;
    
    //read controller
    x = game.controller.left *-1 + game.controller.right;
    y = game.controller.up*-1  + game.controller.down;
    b = game.controller.buttonPressed;
    game.controller.render();

    multplier = 1;


    if(b){
        game.player.attack();
    }

    if(game.player.state != PLAYERSTATE_WHIPPING){
        
        if (y<0){
            game.player.direction=NORTH;
        }else if(x>0){
            game.player.direction=EAST;
        }else if(y>0){
            game.player.direction=SOUTH;
        }else if(x<0){
            game.player.direction=WEST;
        }

        constrained = game.currentRoom.constrainPlayer(
            game.player.box.x, 
            game.player.box.y,
            game.player.box.x + Math.round(x * game.player.speed * multplier * deltaT/1000),
            game.player.box.y + Math.round(y * game.player.speed * multplier * deltaT/1000)
        )
        if (constrained && (game.player.box.x != constrained.x || game.player.box.y != constrained.y)){
            if (game.player.state!=PLAYERSTATE_WALKING){
                game.player.state = PLAYERSTATE_WALKING;
                game.player.sprite.setAnimation(1);
            }
            game.player.box.x = constrained.x;
            game.player.box.y = constrained.y;
        }
        else {
            if (game.player.state!=PLAYERSTATE_IDLE){
                game.player.state = PLAYERSTATE_IDLE;
            }
        }   
    }

    
    //game.player.box.x = constrain(currentroom.box.x+currentRoom.wallHeight, game.player.box.x, currentroom.box.x + currentroom.box.width+);
    

    game.player.render(Math.round(deltaT));

    window.setTimeout(()=>gameLoop(startTime), 50);
    
}

function openNextRoom(direction){
    if(game.currentRoom.findDoor(direction)){
        nextRoom = game.level.findNeighbor(game.currentRoom, direction);
        
        if(nextRoom.opened){
            game.currentRoom = nextRoom;
            //entrance = game.currentRoom.findDoor((direction + 2) % 4);
            loc = getEntranceLocation(nextRoom,(direction + 2) % 4)
            game.player.box.x = loc.x;//game.currentroom.box.x + game.currentroom.box.width / 2;
            game.player.box.y = loc.y;//game.currentroom.box.y + game.currentroom.box.height / 2;
            game.player.sprite.lastLocation.x = loc.x;
            game.player.sprite.lastLocation.y = loc.y;
            if (game.currentRoom.keys){
                game.currentRoom.keys=0;
                game.player.keys++;
            }
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

game = newGame();
portrait = window.matchMedia("(orientation: portrait)");
portrait.addEventListener("change", onOrientationChange)
onOrientationChange(window.matchMedia("(orientation: portrait)"));
game.player = newPlayer();
x = game.screen.drawRect(0,0,100,100,"#F0F","#000",3);

//alert(x);
clearScreen();//init Screen
//alert(x);
newLevel();
game.currentRoom = getRoom(0,0);
game.currentRoom.render();
gameLoop(Date.now());


