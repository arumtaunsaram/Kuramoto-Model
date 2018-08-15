(function() {

    /**
     * This represents one oscillator of Kuramoto-Network.
     * @constructor
     */
    var Oscillator = function () {
        /**
         * References to coupled oscillators.
         * @type {Array.<Oscillator>} */
        this.coupled = [];
        this.omega = 0;
        this.nextTheta = 0;
        this.lastTheta = 0;
    };

    // Coefficient of 2nd term (K in Wikipedia)
    Oscillator.coeff = 1.0;

    Oscillator.prototype.addCoupledOscillator = function (oscilattor) {
        this.coupled.push(oscilattor);
    };

    Oscillator.prototype.calculateNextTheta = function () {
        // 1st term
        // Value between -0.5 and 0.5 will be stored
        this.omega = Math.random() - 0.5;

        // Calculates the 2nd term
        if (this.coupled.length < 1) {
            this.nextTheta = this.omega;
            return;
        }

        var sum = 0.0;
        for (var i = 0; i < this.coupled.length; i++) {
            sum += Math.sin(this.lastTheta - this.coupled[ i ].lastTheta);
        }
        this.nextTheta = this.omega - ((Oscillator.coeff / this.coupled.length) * sum);
    };

    Oscillator.prototype.updateTheta = function () {
        this.lastTheta = this.nextTheta;
    };



    /**
     * This class uses d3.js
     * @param {Array.<Array.<Number>>} data
     * @constructor
     */
    function LineGraph(data, orderParameters) {
        // Specifies the parent element this graph add to.
       this.container = d3.select("#debugLineGraphs");
       this.width = 960;
       this.height = 200;
       var margin = {};
       margin.top = margin.right = margin.bottom = margin.left = 30;
       this.margin = margin;
       this.data = data;
       this.orderParameters = orderParameters;
       this.x = d3.scaleLinear().range([0, this.width]);

       this.color = d3.scaleOrdinal(d3.schemeCategory10);
    }

    LineGraph.prototype.render = function() {
        var self = this;
        
        if (!self.svg) { // render first time
            self.y = d3.scaleLinear()
                .range([self.height, 0]);

            self.yOrderParam = d3.scaleLinear()
                .range([self.height, 0])
            self.yOrderParam.domain([0,1]);

            self.xAxis = d3.axisBottom()
                .scale(self.x);
            self.yAxis = d3.axisLeft()
                .scale(self.y);

            self.yAxis2 = d3.axisRight()
                .scale(self.yOrderParam);


            self.line = d3.line()
                .x(function(d, i) { return self.x(i); })
                .y(function(d) { return self.y(d); });
                // Really need this?
                //.interpolate("basis");

            self.orderParamLine = d3.line()
                .x(function(d, i) { /*console.log("x)d:" + d + ",i:" + i);*/ return self.x(i); })
                .y(function(d) { /*console.log("y)d:" + d);*/ return self.yOrderParam(d);});

            self.svg = self.container.append("svg")
                .attr("width", self.width + self.margin.left + self.margin.right)
                .attr("height", self.height + self.margin.top + self.margin.bottom)
                .append("g")
                .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

            //self.x.domain(d3.extent(data, function(d) { return d.x; }));
            //self.y.domain(d3.extent(data, function(d) { return d.y; }));

            self.svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + self.height + ")")
                .call(self.xAxis);

            self.svg.append("g")
                .attr("class", "y axis")
                .call(self.yAxis);

            self.svg.append("g")
                .attr("class", "y axis2")
                .attr("transform", "translate(" + self.width + ",0)")
                .call(self.yAxis2);

            self.lines = self.svg.append("g")
                .attr("class", "lines");

            self.lines
                .selectAll("path.line")
                .data(self.data, function(ts, i) {return i;})
                .enter()
                .append("path")
                .attr("class", "line")
                .attr("stroke", "red")
                .attr("fill", "none")
                .attr("d", self.line);

            self.orderParameter = self.svg.append("g")
                .attr("class", "orderParameterLine");

            self.orderParameter
                .append("path")
                .data(self.orderParameters)
                .attr("fill", "none")
                .attr("stroke", "silver")
                .attr("d", self.orderParamLine);

        } else {
            // Resets the target domain (min and max values of each axis)
            self.x.domain([0, d3.max(self.data, function(d) {return d.length;})]);
            self.y.domain(d3.extent(d3.merge(self.data)));

            self.svg.select("g.y")
                .transition()
                .duration(100)
                .call(self.yAxis);

            self.svg.select("g.x")
                .transition()
                .duration(100)
                .call(self.xAxis);

            self.lines
                .selectAll("path.line")
                .data(self.data)
                .attr("d", self.line).style("stroke", function(d, i) {return self.color(i);});

            self.orderParameter
                .select("path")
                .attr("stroke", "black")
                .attr("d", self.orderParamLine(self.orderParameters));
        }
    };

    /**
     *
     * @constructor
     */
    function OrderParameterCell() {
        this.td = document.createElement("td");
        this.svg = d3.select(this.td).append("svg");
        this.text = document.createTextNode("");
        this.td.appendChild(this.text);
    }


    window.App = !(typeof window['App'] !== 'undefined') ? (function () {

        var NUMBERS_OF_OSCILLATOR = 5;
        var STEPS_TO_REMEMBER = 50;
        var intervalTimer = null;

        return {
            init: function () {
                var oscillators = [];

                /**
                 * Stores old values of the oscillators.
                 * @type {Array.<Array.<Number>>}
                 * */
                var oscillatorValues = [
                    // Elements such below come here
                    // - Time series values (an array) of oscillator #1,
                    // - Time series values (an array) of oscillator #2,..
                ];
                var orderParameters = [];
                var orderParameterTable = document.getElementById("orderParameterTable");
                /* @type {Array.<Array.{Element(td)}>} */
                var orderParameterCells = [];

                // Set K
                var k = parseFloat(document.getElementById("k").value);
                if (Number.isNaN(k)) {
                    alert("K is NaN");
                    return;
                } else {
                    Oscillator.coeff = k;
                }


                for (var i = 0; i < NUMBERS_OF_OSCILLATOR; i++) {
                    // Constructs an oscillator.
                    oscillators.push(new Oscillator());
                    // Constructs an oscillator value holder.
                    oscillatorValues.push([]);

                    // Appends a row of the order parameter table
                    var tr = document.createElement("tr");
                    var cells = [];
                    for (var k = 0; k < NUMBERS_OF_OSCILLATOR; k++) {
                        if (k === i) {
                            var td = document.createElement("td");
                            td.appendChild(document.createTextNode("Osc #" + i));
                            td.setAttribute("class", "diagonal");
                            tr.appendChild(td);
                            cells.push(td);
                        } else {
                            var cell = new OrderParameterCell();
                            tr.appendChild(cell.td);
                            cells.push(cell);
                        }
                    }
                    orderParameterTable.appendChild(tr);
                    orderParameterCells.push(cells);
                }
                var lineGraph = new LineGraph(oscillatorValues, orderParameters);

                // Sets coupled oscillators
                for (var target = 0; target < oscillators.length; target++) {
                    console.log("connecting #" + target + " to:");
                    for (i = 0; i < oscillators.length; i++) {
                        if (i === target) {
                            // Skips if the setting target and the oscillator to be set are same.
                            continue;
                        }
                        oscillators[target].addCoupledOscillator(oscillators[i]);
                        console.log("\t#" + i);
                    }
                }

                // Sets up interval oscillator updates.
                var x = 0;
                intervalTimer = window.setInterval(function() {

                    for (var i = 0; i < oscillators.length; i++) {
                        oscillators[i].calculateNextTheta();
                    }

                    // Its absolute value will be taken when we calculate the order parameter.
                    var sum_of_euler_real = 0.0;
                    var sum_of_euler_imaginary = 0.0;
                    for (var i = 0; i < oscillators.length; i++) {
                        oscillators[i].updateTheta();

                        // Saves the value onto oscillatorValues.
                        if (oscillatorValues[i].length >= STEPS_TO_REMEMBER) {
                            // Removes the oldest value if the array exceeds the limit.
                            oscillatorValues[i].shift();
                        }
                        oscillatorValues[i].push(oscillators[i].lastTheta);

                        // Updates the order parameter table.
                        for (var k = i + 1; k < oscillators.length; k++) {
                            // Calculates an order parameter just for the 2 oscillators.
                            var real = Math.cos(oscillators[i].lastTheta) + Math.cos(oscillators[k].lastTheta);
                            var imaginary = Math.sin(oscillators[i].lastTheta) + Math.sin(oscillators[k].lastTheta);
                            var partialOrderParameter = Math.sqrt(Math.pow(real, 2) + Math.pow(imaginary, 2)) / 2;

                            // Updates the target cell.
                            if (orderParameterCells[i][k] instanceof OrderParameterCell) {
                                orderParameterCells[i][k].text.textContent =  partialOrderParameter.toFixed(3);
                                // Updates: #FFFFFF
                                //             ^^^^ here, like if 0.0 -> FFFFFF, 1.0 -> FF0000
                                var blueOrGreen = Math.round((1 - partialOrderParameter) * 255).toString(16);
                                // Add leading zeros
                                blueOrGreen = ("00" + blueOrGreen).substr(-2);
                                console.log("mapped " + partialOrderParameter + " to " + blueOrGreen)
                                orderParameterCells[i][k].td.style.backgroundColor = "#FF" +
                                    blueOrGreen + blueOrGreen;
                                console.log("#FF" + blueOrGreen + blueOrGreen)
                            }
                        }

                        // Calculates order parameter components for the whole system (all oscillators).
                        sum_of_euler_real += Math.cos(oscillators[i].lastTheta);
                        sum_of_euler_imaginary += Math.sin(oscillators[i].lastTheta);
                    }

                    if (orderParameters.length >= STEPS_TO_REMEMBER) {
                        // Removes the oldest value if the array exceeds the limit.
                        orderParameters.shift();
                    }
                    // Calculates the order parameter
                    var absoluteSum = Math.sqrt(Math.pow(sum_of_euler_real, 2) + Math.pow(sum_of_euler_imaginary, 2));
                    console.log("m=" + (absoluteSum / oscillators.length));
                    orderParameters.push((absoluteSum / oscillators.length));

                    lineGraph.render();

                    x++;
                }, 300);

            },
            stop: function() {
                if (intervalTimer !== null)
                {
                    clearInterval(intervalTimer);
                }
            }
        };
    })() : window.app;

})();
