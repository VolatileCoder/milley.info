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
                this.sprite = newSprite(game.screen, 
                "data:image/png;base64,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",
                800, 1200, 100, 100, 0, 0);
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


