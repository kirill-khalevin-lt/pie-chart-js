
const rgba2hex = (rgba) => rgba[0] === "#" ? rgba :`#${rgba.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+\.{0,1}\d*))?\)$/).slice(1).map((n, i) => (i === 3 ? Math.round(parseFloat(n) * 255) : parseFloat(n)).toString(16).padStart(2, '0').replace('NaN', '')).join('')}`
const formatNum = (num, localeString="en") => parseFloat(num).toLocaleString(localeString);

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
        this.itemLocalStorage = "piechart-data";
        this.percentMinToView = 4;
        this.shiftPiechart = 10;

        this.pie_colors_default = ["#F68D64","#FEAE65","#E6F69D","#AADEA7","#64C2A6","#6DE7BB","#FFD1B9","#F7B7A3","#EA5F89","#9B3192","#57167E","#2B0B3F"];
        this.colors = options.colors.concat(this.pie_colors_default);
        this.shaded_colors = this.colors.map(function(color) { return shadeColor(color, -20); } );
        this.removedColors = [];
        this.nextColor = 0;

        this.sumIsCustom = false; //???????????????

        this.chartID = this.randomID();
        this.rowPrefixes = {
            "row": "row-",
            "rowColor": "row-color-",
            "rowValue": "row-value-",
            "rowItem": "row-item-",
            "rowRemove": "row-remove-",
            "rowEmpty": "row-empty-"
        }
        this.options = options;
        this.tableRowsID = [];
        this.tableRowsColors = [];
        this.tableRowsShadedColors = [];
        this.canvasSize = options.canvasSize;
        this.parentNode = options.parentNode;
        if (this.options.dataFromLocalStorage){this.loadDataFromLocalStorage();}
        if(!this.options.data || Object.keys(this.options.data)==false){this.setupDefaultTemplate();}
        this.generateHTMLSkelet();
    }

    setupDefaultTemplate()
    {
        this.options.data = {
            0: {"item" : "Rent room", "value" : 16500},
            1: {"item" : "Food", "value" : 15000},
            2: {"item" : "Clothes", "value" : 10000},
            3: {"item" : "Investments", "value" : 8000},
            4: {"item" : "Parents", "value" : 8000},
            5: {"item" : "Subscription Hexlet", "value" : 3900},
            6: {"item" : "Transport/Fitness", "value" : 2250+1750},
            7: {"item" : "mobile/home internet", "value" : 600+400},
        }
        var count = 0;
        var sum = 0;
        var total = 80000;
        for (var key in Object.keys(this.options.data)) {count++; sum += this.options.data[key]["value"];}
        this.options.data[count] = {"item" : "entertainment and other", "value" : total-sum}
    }

    randomID(){
        return Math.floor(Math.random()*16777215).toString(16);
    }

    getNextColor(){
        if(this.nextColor % this.colors.length == 0 && this.nextColor > 0) {this.nextColor++;}
        var currentColor = this.colors[this.nextColor % this.colors.length];
        const colorsMinMixed = 3
        if (this.colors.length >= colorsMinMixed && this.tableRowsColors.length >= 1)
        {
            while ([this.tableRowsColors[0], this.tableRowsColors[this.tableRowsColors.length-1]].includes(currentColor))
            {
                this.nextColor += 1;
                currentColor = this.colors[this.nextColor % this.colors.length];
            }
        }
        this.removedColors.length > 0 ? currentColor = this.removedColors.pop() : this.nextColor += 1;
        return currentColor;
    }

    getItemValue(rowID){
        var item = document.getElementById(this.rowPrefixes["rowItem"].concat(rowID)).value;
        var value = parseInt(document.getElementById(this.rowPrefixes["rowValue"].concat(rowID)).value);

        var color = rgba2hex(document.getElementById(this.rowPrefixes["rowColor"].concat(rowID)).style.background);
        return [item, value, color];
    }

    generateDataFromFront(){
        var data = {};
        this.tableRowsColors = [];
        this.tableRowsShadedColors = [];
        var pos = 0;
        this.tableRowsID.forEach((rowID) => {
            var dataRow = this.getItemValue(rowID);
            data[pos] = {};
            data[pos]["item"] = dataRow[0];
            data[pos]["value"] = dataRow[1];
            //data[dataRow[0]] = dataRow[1];
            this.tableRowsColors.push(dataRow[2]);
            this.tableRowsShadedColors.push(shadeColor(dataRow[2], -20));
            pos += 1;
        });
        this.options.data = data;
        if(this.options.saveDataToLocalStorage) {this.saveDataToLocalStorage();}
    }

    calcSum()
    {
        var sum = 0;
        for( var posItem in this.options.data)
        {
            if (this.options.data[posItem]["value"]) {sum += this.options.data[posItem]["value"];}
        }
        this.sum = sum;
    }

    saveDataToLocalStorage(){
        var colors = {
            "colors": {
                "tableRowsColors": this.tableRowsColors,
                "removedColors": this.removedColors,
                //"nextColor": this.nextColor
            },
            "anyValues" : {
                "sumIsCustom": this.sumIsCustom,
            }
        }
        localStorage.setItem(this.itemLocalStorage, JSON.stringify(Object.assign(this.options.data, colors)));
    }

    loadDataFromLocalStorage(){
        var data = JSON.parse(localStorage.getItem(this.itemLocalStorage));
        if(data)
        {
            if(data["colors"])
            {
                this.tableRowsColors = data["colors"]["tableRowsColors"];
                this.tableRowsShadedColors = this.tableRowsColors.map(function(color) { return shadeColor(color, -20); } );
                this.removedColors = data["colors"]["removedColors"];
                delete data["colors"];
            }
            if(data["anyValues"])
            {
                this.sumIsCustom = data["anyValues"]["sumIsCustom"];
                delete data["anyValues"];
            }
            this.options.data = data;
        }
    }

    tdColorPicker(parentNode, currentColor, rowID)
    {
        parentNode.style.background = currentColor
        parentNode.innerHTML = "";
        parentNode.id = this.rowPrefixes["rowColor"].concat(rowID);
        var colorPicker = createNode("input", parentNode, {
            "type": "color",
            "style": "border-color: transparent;",
            "value": rgba2hex(currentColor)
        });
        colorPicker.addEventListener("input", (event) => {parentNode.style.background = event.currentTarget.value; this.draw();});
        parentNode.addEventListener("click", (event) => {colorPicker.click();});
        return colorPicker;
    }
    //types = empty, color-view, string, number, remove
    addRow(values, tdTypes, waitNewRow=false)
    {
        var rowID = this.randomID();
        if (!waitNewRow) {
            this.tableRowsID.push(rowID);
            var currentColor = this.getNextColor();
        }
        var tr = createNode("tr", this.table, {"id": this.rowPrefixes["row"].concat(rowID)});
        var valuePos = 0;
        tdTypes.forEach((tdType) => {
            var td = createNode("td", tr);
            if (tdType == 'color-view') {
                var rowCount = this.tableRowsID.length;
                currentColor = rowCount <= this.tableRowsColors.length ? this.tableRowsColors[rowCount-1] : currentColor;
                this.tdColorPicker(td, currentColor, rowID);
            }
            else if (tdType == 'remove')
            {
                var span = createNode("span", td);
                var btn = createNode("button", span, {
                    "type": "button",
                    "className": "btn btn-danger btn-rounded btn-sm my-0",
                    "innerText": "X",
                    "style.display": waitNewRow ? "none": "",
                    "id": this.rowPrefixes["rowRemove"].concat(rowID)
                })
                btn.addEventListener('click', (event) => {
                    var thisRowID = event.currentTarget.id.split(this.rowPrefixes["rowRemove"]).pop();
                    this.removedColors.push(document.getElementById(this.rowPrefixes["rowColor"].concat(thisRowID)).style.background);
                    delete this.tableRowsID[this.tableRowsID.indexOf(thisRowID)];
                    tr.remove();
                    this.draw();
                });
            } else if (['string', "number"].includes(tdType)) {
                    var nodeOptions = {
                        "placeholder": "Item",
                        "value": values[valuePos],
                        "id": this.rowPrefixes["rowItem"].concat(rowID),
                        "className" : "input-pie-data"
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
                            if(waitNewRow)
                            {
                                var thisRowID = event.currentTarget.id.split(this.rowPrefixes["rowValue"]).pop();
                                this.tableRowsID.push(thisRowID);
                                var btnRemove = document.getElementById(this.rowPrefixes["rowRemove"].concat(thisRowID));
                                btnRemove.style.display = "";
                                var currentColor = this.getNextColor();
                                var colorView = findNode(this.rowPrefixes["rowEmpty"].concat(thisRowID));
                                this.tdColorPicker(colorView, currentColor, thisRowID);
                                colorView.className = "";
                                waitNewRow = false;
                                this.addDynamicNewRow();
                            }
                            this.draw();
                        });
                    }
            } else { //empty
                td.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;";
                td.className = this.rowPrefixes["rowEmpty"].concat(rowID);
            }
            valuePos++;
        });
    }

    addRows()
    {
        for (var posItem in this.options.data){
            var item = this.options.data[posItem]["item"]
            var value = this.options.data[posItem]["value"]
            var values = ["", item, value]
            var tdTypes = ["color-view", "string", "number", "remove"]
            this.addRow(values, tdTypes)
        }
        this.addDynamicNewRow();
    }

    addDynamicNewRow()
    {
        const values = ["","",""];
        const tdTypes = ["empty", "string", "number", "remove"];
        const waitNewRow = true;
        this.addRow(values, tdTypes, waitNewRow);
    }

    generateHTMLSkelet()
    {
        this.leftPart = createNode("div", this.parentNode, {
            "className": "col-md-8 col-lg-6",
            "style.margin": "100px auto auto",
            "style.paddingLeft": "0",
            "style.paddingRight": "0"
        });
        this.table = createNode("table", this.leftPart,
                    {"className": "table table-responsive-md text-center", "id": "table-".concat(this.chartID)});


        this.rightPart = createNode("div", this.parentNode, {"className": "col-md-8 col-lg-6", "style.margin": "50px auto auto",});
        this.canvas = createNode("canvas", this.rightPart, {"id": "canvas-".concat(this.chartID)});
        this.canvas.width = this.canvasSize;
        this.canvas.height = this.canvasSize;
        this.ctx = this.canvas.getContext("2d");
        var parentClass = "text-center piechart-sum-block-parent";
        var sumBlockParent = createNode("div", this.rightPart, {
            "className": parentClass,
            "style.width": this.canvas.width
        });
        this.sumBlock = createNode("div", sumBlockParent, {
            "className": "col-md-auto piechart-sum-block",
            "style.width":this.canvas.width
        });
        /*var sumTotalBlockParent = createNode("div", this.rightPart, {
            "className": parentClass,
            "style.width": this.canvas.width
        });
        this.sumTotal = createNode("div", sumTotalBlockParent, {
            "className": "col-md-auto piechart-sum-block",
            "style.width":this.canvas.width
        });*/
        this.addRows();
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
        var total_value = this.sum;
        var shift = this.shiftPiechart;
        var coef_padding = 0.03

        while(shift>=0)
        {
            var color_index = 0;
            var start_angle = 0;
            for (var posItem in this.options.data){
                var val = this.options.data[posItem]["value"];
                if(!val) {val=0;}
                var slice_angle = 2 * Math.PI * val / total_value;

                var current_colors = shift == 0 ? this.tableRowsColors : this.tableRowsShadedColors;
                this.drawPieSlice(
                    this.ctx,
                    this.canvas.width/2-shift+this.shiftPiechart/2,
                    this.canvas.height/2+shift-this.shiftPiechart/2,
                    Math.min(this.canvas.width/2-this.canvas.width*coef_padding,this.canvas.height/2-this.canvas.height*coef_padding),
                    start_angle,
                    start_angle+slice_angle,
                    current_colors[color_index%this.tableRowsColors.length]
                );

                start_angle += slice_angle;
                color_index++;
            }
            shift -= 1
        }
    }

    drawPercentLabels()
    {
        var total_value = this.sum;
        var start_angle = 0;

        for (var posItem in this.options.data){
            var val = this.options.data[posItem]["value"];
            if(!val) {val=0;}
            var slice_angle = 2 * Math.PI * val / total_value;
            var pieRadius = Math.min(this.canvas.width/2,this.canvas.height/2);
            var labelX = this.canvas.width/2 + (pieRadius / 2) * Math.cos(start_angle + slice_angle/2);
            labelX -= labelX*0.05;
            var labelY = this.canvas.height/2 + (pieRadius / 2) * Math.sin(start_angle + slice_angle/2);
            //labelY += labelY*0.05;

            if (this.options.doughnutHoleSize){
                var offset = (pieRadius * this.options.doughnutHoleSize ) / 2;
                labelX = this.canvas.width/2 + (offset + pieRadius / 2) * Math.cos(start_angle + slice_angle/2)+this.shiftPiechart/2;
                labelY = this.canvas.height/2 + (offset + pieRadius / 2) * Math.sin(start_angle + slice_angle/2)-this.shiftPiechart/2;

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
        this.calcSum();
        this.sumBlock.innerText = formatNum(this.sum);
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
    0 : { "item":"item-note-1", "value":2},
    1 : { "item":"item-note-2", "value":3},
    2 : { "item":"item-note-3", "value":5},
    3 : { "item":"item-note-4", "value":5},
    4 : { "item":"item-note-5", "value":6},
    5 : { "item":"item-note-6", "value":7},
    6 : { "item":"item-note-7", "value":8},
    7 : { "item":"item-note-8", "value":9},
    8 : { "item":"item-note-9", "value":10},
    9 : { "item":"item-note-10", "value":11},
    10 : { "item":"item-note-11", "value":12},
    11 : { "item":"item-note-12", "value":13},
    12 : { "item":"item-note-13", "value":14}
}


var myVinyls = {
}

const editor = document.getElementById("pie-editor");
const canvasSize = 460;

var myDougnutChart = new Piechart(
    {
        parentNode:editor,
        canvasSize:canvasSize,
        data:myVinyls,
        dataFromLocalStorage:true,
        saveDataToLocalStorage:true,
        colors:["#fde23e"],
    }
);

myDougnutChart.draw();

