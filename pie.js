//Code collected from https://code.tutsplus.com/ru/tutorials/how-to-draw-a-pie-chart-and-doughnut-chart-using-javascript-and-html5-canvas--cms-27197

class Piechart{
    constructor(options)
    {
        this.pie_colors_default = ["#F66D44","#FEAE65","#E6F69D","#AADEA7","#64C2A6","#2D87BB","#FFF1C9","#F7B7A3","#EA5F89","#9B3192","#57167E","#2B0B3F"];
        this.options = options;
        this.canvas = options.canvas;
        this.ctx = this.canvas.getContext("2d");
        this.colors = options.colors.concat(this.pie_colors_default);
        this.shaded_colors = this.colors.map(function(color) { return shadeColor(color, -20); } );
    }

    drawPieSlice(ctx,centerX, centerY, radius, startAngle, endAngle, color ){
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(centerX,centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();
    }

    //  https://github.com/lipka/piecon

    removeFaviconTag(){
        var links = Array.prototype.slice.call(document.getElementsByTagName('link'), 0);
        var head = document.getElementsByTagName('head')[0];

        for (var i = 0, l = links.length; i < l; i++) {
            if (links[i].getAttribute('rel') === 'icon' || links[i].getAttribute('rel') === 'shortcut icon') {
                head.removeChild(links[i]);
            }
        }
    };

    setFaviconTag(){
        this.removeFaviconTag();

        var link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'icon';
        link.href = this.canvas.toDataURL();

        document.getElementsByTagName('head')[0].appendChild(link);
    };

    draw(){
        var total_value = 0;
        var shift = 10;
        var coef_padding = 0.03

        var canvas_width = this.canvas.width;
        var canvas_height = this.canvas.height;
        for (var categ in this.options.data){
            var val = this.options.data[categ];
            total_value += val;
        }

        while(shift>=0)
        {
            var color_index = 0;
            var start_angle = 0;
            for (categ in this.options.data){
                val = this.options.data[categ];
                var slice_angle = 2 * Math.PI * val / total_value;

                var current_colors = shift == 0 ? this.colors : this.shaded_colors;
                this.drawPieSlice(
                    this.ctx,
                    canvas_width/2-shift,
                    canvas_height/2+shift,
                    Math.min(canvas_width/2-canvas_width*coef_padding,canvas_height/2-canvas_height*coef_padding),
                    start_angle,
                    start_angle+slice_angle,
                    current_colors[color_index%this.colors.length]
                );

                start_angle += slice_angle;
                color_index++;
            }
            shift -= 1
        }

        start_angle = 0;
        for (categ in this.options.data){
            val = this.options.data[categ];
            slice_angle = 2 * Math.PI * val / total_value;
            var pieRadius = Math.min(canvas_width/2,canvas_height/2);
            var labelX = canvas_width/2 + (pieRadius / 2) * Math.cos(start_angle + slice_angle/2);
            labelX -= labelX*0.05;
            var labelY = canvas_height/2 + (pieRadius / 2) * Math.sin(start_angle + slice_angle/2);
            //labelY += labelY*0.05;

            if (this.options.doughnutHoleSize){
                var offset = (pieRadius * this.options.doughnutHoleSize ) / 2;
                labelX = canvas_width/2 + (offset + pieRadius / 2) * Math.cos(start_angle + slice_angle/2);
                labelY = canvas_height/2 + (offset + pieRadius / 2) * Math.sin(start_angle + slice_angle/2);

            }
            var percents = Math.round(100 * val / total_value)
            if (percents >= 3)
            {
                this.ctx.fillStyle = "white";
                this.ctx.font = "bold 20px Arial";
                this.ctx.fillText(percents+"%", labelX,labelY);
            }
            start_angle += slice_angle;
        }

        if (this.options.legend){
            color_index = 0;
            var legendHTML = "";
            var input_element = "";
            for (categ in this.options.data){
                legendHTML += "<div><span style='display:inline-block;width:20px;background-color:"+this.colors[color_index++]+";'>&nbsp;</span> "+categ;
                legendHTML += `<input type="number" step="1000" name="pie-value-${categ}">`;
                legendHTML += `%<input type="checkbox" name="pie-value-${categ}-in-percents"><Br></div>`;
            }
            this.options.legend.innerHTML = legendHTML;
        }

        this.setFaviconTag()
    }
}

//https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors

function shadeColor(color, percent) {

    var R = parseInt(color.substring(1,3),16);
    var G = parseInt(color.substring(3,5),16);
    var B = parseInt(color.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;
    G = (G<255)?G:255;
    B = (B<255)?B:255;

    var RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    var GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    var BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}

var myVinyls = {
    "Classical music": 10,
    "Alternative rock": 14,
    "Pop": 1,
    "Jazz": 12
};

var myVinyls = {
    "1" : 2,
    "2" : 2,
    "3" : 2,
    "4" : 2,
    "5" : 2,
    "6" : 2,
    "7" : 2,
    "8" : 2,
    "9" : 2,
    "10" : 2,
    "11" : 2,
    "12" : 2,
    "13" : 2,
}

var myCanvas = document.getElementById("myCanvas");
myCanvas.width = 460;
myCanvas.height = 460;
var ctx = myCanvas.getContext("2d");
var myLegend = document.getElementById("myLegend");

var myDougnutChart = new Piechart(
    {
        canvas:myCanvas,
        data:myVinyls,
        colors:["#fde23e"],
        legend:myLegend
    }
);


myDougnutChart.draw();

