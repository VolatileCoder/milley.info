const game = {
    width:900, 
    height: 1600, 
    paddle: {
        width:160, 
        height:40,
        centerX:80,
        top: 1600-160,
    },
};

game.screen = Raphael("main", game.width, game.height);
game.screen.setViewBox(0, 0, game.width, game.height, true);
game.screen.canvas.setAttribute('preserveAspectRatio', 'meet');
game.screen.canvas.style.backgroundColor = '#334';

var well = game.screen.rect(0, 0, game.width, game.height);
well.attr("fill","#000");

var paddle = game.screen.rect(0, game.paddle.top, game.paddle.width, game.paddle.height);
paddle.attr("fill","#fff");

var killzone = game.screen.rect(0,game.paddle.top+game.paddle.height,game.width, game.height - (game.paddle.top+game.paddle.height));
killzone.attr("fill","#800");

var control = game.screen.rect(0, 0, game.width, game.height); //must declare last
control.attr("fill","#F0F");
control.attr("opacity",.0)



function oninput(e,a){
    r = e.target.getBoundingClientRect();
    pos = ((e.clientX-r.x)/r.width) * game.width;
    if (!isNaN(pos)) {
        pos -= game.paddle.centerX
        if(pos < 0) {
            pos = 0;
        } else if (pos + game.paddle.width > game.width) {
            pos = game.width - game.paddle.width;
            
        }
        
        paddle.attr("x",pos);
    }
}

control.mousemove(oninput);
control.touchmove(oninput);
