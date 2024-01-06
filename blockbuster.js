var w = 900;
var h = 1600;

var main = Raphael("main",w,h);
main.setViewBox(0, 0, w, h, true);
main.canvas.setAttribute('preserveAspectRatio', 'meet');
main.canvas.style.backgroundColor = '#334';

var well = main.rect(0,0,900,1600);
well.attr("fill","#000");
well.mousemove(oninput);
well.touchmove(oninput);

var paddle = main.rect(0,0,160,40);
paddle.attr("fill","#fff");

function oninput(e,a){
    r = e.target.getBoundingClientRect();
    console.log();
    pos = ((e.clientX-r.x)/r.width)*well.attr("width")
    if (!isNaN(pos)){
        paddle.attr("x",pos);
    }
}