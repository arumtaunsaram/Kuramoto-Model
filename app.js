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

        // Coefficient of 2nd term (K in Wikipedia)
        this.coeff = 1.0;
    };

    Oscillator.prototype.addCoupledOscillator = function (oscilattor) {
        this.coupled.push(oscilattor);
    };

    Oscillator.prototype.calculateNextTheta = function () {
        // 1st term
        // Value between 0.0 and 1.0 will be stored
        this.omega = Math.random();

        // Calculates the 2nd term
        if (this.coupled.length < 1) {
            this.nextTheta = this.omega;
            return;
        }

        var sum = 0.0;
        for (var i = 0; i < this.coupled.length; i++) {
            sum += Math.sin(this.lastTheta - this.coupled[ i ].lastTheta);
        }
        this.nextTheta = this.omega - ((this.coeff / this.coupled.length) * sum);
    };

    Oscillator.prototype.updateTheta = function () {
        this.lastTheta = this.nextTheta;
    };



    /**
     * This class uses d3.js
     * @param {Array.<Array.<Number>>} data
     * @constructor
     */
    function LineGraph(data) {
        // Specifies the parent element this graph add to.
       this.container = d3.select("#debugLineGraphs");
       this.maxLength = 100;
       this.width = 960;
       this.height = 200;
       var margin = {};
       margin.top = margin.right = margin.bottom = margin.left = 30;
       this.margin = margin;
       this.data = data;
       this.x = d3.scaleLinear().range([0, this.width]);

       this.color = d3.scaleOrdinal(d3.schemeCategory10);
    }

    LineGraph.prototype.render = function() {
        var self = this;
        
        if (!self.svg) { // render first time
            self.y = d3.scaleLinear()
                .range([self.height, 0]);

            self.xAxis = d3.axisBottom()
                .scale(self.x);
            self.yAxis = d3.axisLeft()
                .scale(self.y);

            self.line = d3.line()
                .x(function(d, i) { return self.x(i); })
                .y(function(d) { return self.y(d); });
                // Really need this?
                //.interpolate("basis");
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

            self.lines = self.svg.append("g")
                .attr("class", "lines");

            self.linesWithData = self.lines
                .selectAll("path.line")
                .data(self.data, function(ts, i) {return i;})
                .enter()
                .append("path")
                .attr("class", "line")
                .attr("stroke", "red")
                .attr("fill", "none")
                .attr("d", self.line);
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

        }
    };


    window.App = !(typeof window['App'] !== 'undefined') ? (function () {

        var STEPS_TO_REMEMBER = 100;
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


                for (var i = 0; i < 5; i++) {
                    // Constructs an oscillator.
                    oscillators.push(new Oscillator());
                    // Constructs an oscillator value holder.
                    oscillatorValues.push([]);
                }
                var lineGraph = new LineGraph(oscillatorValues);

                // Sets coupled oscillators
                for (var target = 0; target < oscillators.length; target++) {

                    for (i = 0; i < oscillators.length; i++) {
                        if (i === target) {
                            // Skips if the setting target and the oscillator to be set are same.
                            continue;
                        }
                        oscillators[target].addCoupledOscillator(oscillators[i]);
                    }
                }

                // Sets up interval oscillator updates.
                var x = 0;
                intervalTimer = window.setInterval(function() {

                    for (var i = 0; i < oscillators.length; i++) {
                        oscillators[i].calculateNextTheta();
                    }

                    for (var i = 0; i < oscillators.length; i++) {
                        oscillators[i].updateTheta();

                        // Saves the value onto oscillatorValues.
                        if (oscillatorValues[i].length >= STEPS_TO_REMEMBER) {
                            // Removes the oldest value if the array exceeds the limit.
                            oscillatorValues[i].shift();
                        }
                        oscillatorValues[i].push(oscillators[i].lastTheta);
                    }

                    lineGraph.render();
                    // Shows last thetas(debug)
                    //for (i = 0; i < oscillators.length; i++) {
                    //    //console.log("Osc #" + i + ":" + oscillators[ i ].lastTheta);
                    //    debugGraphs[ i ].addValue({x: x, y: oscillators[ i ].lastTheta});
                    //    debugGraphs[ i ].render();
                    //}
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
