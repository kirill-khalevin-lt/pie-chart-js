
const rgba2hex = (rgba) => `#${rgba.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+\.{0,1}\d*))?\)$/).slice(1).map((n, i) => (i === 3 ? Math.round(parseFloat(n) * 255) : parseFloat(n)).toString(16).padStart(2, '0').replace('NaN', '')).join('')}`

function isNode(node) { return node instanceof Element; }

function findNode(id_or_class, whichClass=0)
{
    if (typeof id_or_class === "string") {
        node = document.getElementById(id_or_class);
        if (isNode(node)) { return node; }
        nodes_by_class = document.getElementsByClassName(id_or_class);
        if (nodes_by_class.length > 0)
        {
            return nodes_by_class.length > whichClass ? nodes_by_class[whichClass] : nodes_by_class[0];
        }
    }

    return undefined;
}

function createNode(tag, parentNode=document.body, options={})
{
    node = document.createElement(tag);
    for (var option in options){
        var digArr = option.split('.');
        var obj = node;
        for (var digLevel = 0; digLevel < digArr.length-1; digLevel++){ obj = obj[digArr[digLevel]]; }
        obj[digArr.pop()] = options[option];
    }
    if (!isNode(parentNode)){ parentNode = findNode(parentNode); }
    if (!isNode(parentNode)){ parentNode = document.body; }
    parentNode.appendChild(node);
    return node;
}

//Code collected from https://code.tutsplus.com/ru/tutorials/how-to-draw-a-pie-chart-and-doughnut-chart-using-javascript-and-html5-canvas--cms-27197

class Piechart{
    constructor(options)
    {
        this.percentMinToView = 4;

        this.pie_colors_default = ["#F68D64","#FEAE65","#E6F69D","#AADEA7","#64C2A6","#6DE7BB","#FFD1B9","#F7B7A3","#EA5F89","#9B3192","#57167E","#2B0B3F"];
        this.colors = options.colors.concat(this.pie_colors_default);
        this.shaded_colors = this.colors.map(function(color) { return shadeColor(color, -20); } );
        this.removedColors = [];
        this.nextColor = 0;

        this.chartID = this.randomID();
        this.rowPrefixes = {
            "row": "row-",
            "rowColor": "row-color-",
            "rowValue": "row-value-",
            "rowItem": "row-item-",
            "rowRemove": "row-remove-"
        }
        this.options = options;
        this.canvasSize = options.canvasSize;
        this.parentNode = options.parentNode;
        this.tableRowsID = [];
        this.tableRowsColors = [];
        this.tableRowsShadedColors = [];
        this.generateHTMLSkelet();
        this.addRows();
    }

    randomID(){
        return Math.floor(Math.random()*16777215).toString(16);
    }

    getNextColor(){
        var currentColor = this.colors[this.nextColor % this.colors.length];
        this.removedColors.length > 0 ? currentColor = this.removedColors.pop() : this.nextColor += 1;
        return currentColor;
    }

    //https://24ways.org/2010/calculating-color-contrast
    getContrastYIQ(hexcolor){
        var r = parseInt(hexcolor.substr(1,2),16);
        var g = parseInt(hexcolor.substr(3,2),16);
        var b = parseInt(hexcolor.substr(5,2),16);
        var yiq = ((r*299)+(g*587)+(b*114))/1000;
        return (yiq >= 128) ? '#616A6B' : 'white';
    }



    getItemValue(rowID){
        var item = document.getElementById(this.rowPrefixes["rowItem"].concat(rowID)).value;
        var value = parseInt(document.getElementById(this.rowPrefixes["rowValue"].concat(rowID)).value);

        var color = rgba2hex(document.getElementById(this.rowPrefixes["rowColor"].concat(rowID)).style.background);
        return [item, value, color];
    }

    generateDataFromFront(){
        var data = {}
        this.tableRowsColors = [];
        this.tableRowsShadedColors = [];
        this.tableRowsID.forEach((rowID) => {
            var dataRow = this.getItemValue(rowID);
            data[dataRow[0]] = dataRow[1];
            this.tableRowsColors.push(dataRow[2]);
            this.tableRowsShadedColors.push(shadeColor(dataRow[2], -20));
        });
        this.options.data = data;
    }

    //types = color-view, string, number, remove
    addRow(values, tdTypes)
    {
        var currentColor = this.getNextColor();
        var rowID = this.randomID();
        this.tableRowsID.push(rowID);
        var tr = createNode("tr", this.table, {"id": this.rowPrefixes["row"].concat(rowID)});
        var valuePos = 0;
        tdTypes.forEach((tdType) => {
            var td = createNode("td", tr);
            if (tdType == 'color-view') {
                td.style.background = currentColor;
                td.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;";
                td.id = this.rowPrefixes["rowColor"].concat(rowID);
            }
            else if (tdType == 'remove')
            {
                var span = createNode("span", td);
                var btn = createNode("button", span, {
                    "type": "button",
                    "className": "btn btn-danger btn-rounded btn-sm my-0",
                    "innerText": "X",
                    "id": this.rowPrefixes["rowRemove"].concat(rowID)
                })
                btn.addEventListener('click', (event) => {
                    this.removedColors.push(currentColor);
                    delete this.tableRowsID[this.tableRowsID.indexOf(rowID)];
                    tr.remove();
                    this.draw();
                });
            } else {
                if (['string', "number"].includes(tdType)){
                    var nodeOptions = {
                        "placeholder": "Item",
                        "value": values[valuePos],
                        "id": this.rowPrefixes["rowItem"].concat(rowID)
                    }
                    if (tdType == "number") {
                        nodeOptions["type"] = "number";
                        nodeOptions["step"] = "1000";
                        nodeOptions["placeholder"] = "0";
                        nodeOptions["id"] = this.rowPrefixes["rowValue"].concat(rowID);
                    }
                    var input = createNode("input", td, nodeOptions)
                    if (tdType == "number")
                    {
                        input.addEventListener('input', (event) => {
                            this.draw();
                        });
                    }
                }
            }
            valuePos++;
        });
    }

    addRows()
    {
        for (var categ in this.options.data){
            var values = ["", categ, this.options.data[categ]]
            var tdTypes = ["color-view", "string", "number", "remove"]
            this.addRow(values, tdTypes)
        }
    }

    generateHTMLSkelet()
    {
        this.leftPart = createNode("div", this.parentNode, {"className": "col-md-7 col-lg-5"});
        this.table = createNode("table", this.leftPart,
                    {"className": "table table-responsive-md text-center", "id": "table-".concat(this.chartID)});


        this.rightPart = createNode("div", this.parentNode, {"className": "col-md-7 col-lg-5"});
        this.canvas = createNode("canvas", this.rightPart, {"id": "canvas-".concat(this.chartID)});
        this.canvas.width = this.canvasSize;
        this.canvas.height = this.canvasSize;
        this.ctx = this.canvas.getContext("2d");
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

    drawSectors()
    {
        var total_value = 0;
        var shift = 10;
        var coef_padding = 0.03

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

                var current_colors = shift == 0 ? this.tableRowsColors : this.tableRowsShadedColors;
                this.drawPieSlice(
                    this.ctx,
                    this.canvas.width/2-shift,
                    this.canvas.height/2+shift,
                    Math.min(this.canvas.width/2-this.canvas.width*coef_padding,this.canvas.height/2-this.canvas.height*coef_padding),
                    start_angle,
                    start_angle+slice_angle,
                    current_colors[color_index%this.colors.length]
                );

                start_angle += slice_angle;
                color_index++;
            }
            shift -= 1
        }
    }

    drawPercentLabels()
    {
        var total_value = 0;

        for (var categ in this.options.data){
            var val = this.options.data[categ];
            total_value += val;
        }

        var start_angle = 0;
        for (categ in this.options.data){
            var val = this.options.data[categ];
            var slice_angle = 2 * Math.PI * val / total_value;
            var pieRadius = Math.min(this.canvas.width/2,this.canvas.height/2);
            var labelX = this.canvas.width/2 + (pieRadius / 2) * Math.cos(start_angle + slice_angle/2);
            labelX -= labelX*0.05;
            var labelY = this.canvas.height/2 + (pieRadius / 2) * Math.sin(start_angle + slice_angle/2);
            //labelY += labelY*0.05;

            if (this.options.doughnutHoleSize){
                var offset = (pieRadius * this.options.doughnutHoleSize ) / 2;
                labelX = this.canvas.width/2 + (offset + pieRadius / 2) * Math.cos(start_angle + slice_angle/2);
                labelY = this.canvas.height/2 + (offset + pieRadius / 2) * Math.sin(start_angle + slice_angle/2);

            }
            var percents = Math.round(100 * val / total_value)
            if (percents >= this.percentMinToView)
            {
                this.ctx.fillStyle = "white";
                this.ctx.font = "bold 20px Arial";
                this.ctx.fillText(percents+"%", labelX,labelY);
            }
            start_angle += slice_angle;
        }
    }

    draw(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.generateDataFromFront();
        this.drawSectors();
        this.drawPercentLabels();
        this.setFaviconTag();
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
    "item-note-1" : 2,
    "item-note-2" : 3,
    "item-note-3" : 5,
    "item-note-4" : 5,
    "item-note-5" : 6,
    "item-note-6" : 7,
    "item-note-7" : 8,
    "item-note-8" : 9,
    "item-note-9" : 10,
    "item-note-10" : 11,
    "item-note-11" : 12,
    "item-note-12" : 13,
    "item-note-13" : 14,
}

const editor = document.getElementById("pie-editor");
const canvasSize = 460;



var myDougnutChart = new Piechart(
    {
        parentNode:editor,
        canvasSize:canvasSize,
        data:myVinyls,
        colors:["#fde23e"],
        //table:tableValues
    }
);


myDougnutChart.draw();

