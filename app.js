(function() {
    var Oscillator = function () {
        var _ = {};
        /** @type Array */
        _.coupled = [];
        _.omega = 0;
        _.lastTheta = 0;

        // Coefficient of 2nd term (K in Wikipedia)
        _.coeff = 1.0;

        _.addCoupledOscillator = function (oscilattor) {
            this.coupled.push(oscilattor);
        };

        _.step = function () {
            // 1st term
            // Value between 0.0 and 1.0 will be stored
            this.omega = Math.random();

            // Calculates the 2nd term
            if (this.coupled.length < 1) {
                this.lastTheta = this.omega;
                return;
            }

            var sum = 0.0;
            for (var i = 0; i < this.coupled.length; i++) {
                sum += Math.sin(this.lastTheta - this.coupled[ i ].lastTheta);
            }
            this.lastTheta = this.omega - ((this.coeff / this.coupled.length) * sum);
        };

        return _;
    };


    /**
     * This class uses d3.js
     * @constructor
     */
    function LineGraph() {
        // Specifies the parent element this graph add to.
       this.container = d3.select("#debugLineGraphs");
       this.maxLength = 100;
       this.width = 960;
       this.height = 200;
       var margin = {};
       margin.top = margin.right = margin.bottom = margin.left = 30;
       this.margin = margin;
       this.data = [];
       this.x = d3.scaleLinear().range([0, this.width]);
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
                .x(function(d) { return self.x(d.x); })
                .y(function(d) { return self.y(d.y); });
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

            self.svg.append("path")
                .datum(self.data)
                .attr("class", "line")
                .attr("stroke", "red")
                .attr("fill", "none")
                .attr("d", self.line);
        } else {
            // Resets the target domain
            self.x.domain(d3.extent(self.data, function(d) { return d.x; }));
            self.y.domain(d3.extent(self.data, function(d) { return d.y; }));

            self.svg.select("g.y")
                .transition()
                .duration(100)
                .call(self.yAxis);

            self.svg.select("g.x")
                .transition()
                .duration(100)
                .call(self.xAxis);

            self.svg.selectAll("path.line")
                .datum(self.data)
                //.transition(100)
                .attr("d", self.line);
        }
    };

    LineGraph.prototype.addValue = function(value) {
        if (this.data.length > this.maxLength) {
            // Removes the current first element.
            this.data.shift();
        }
        this.data.push(value);
    };


    window.App = !(typeof window['App'] !== 'undefined') ? (function () {

        var STEPS_TO_REMEMBER = 100;

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

                /** @type Array<LineGraph> */
                var debugGraphs = [];

                for (var i = 0; i < 2; i++) {
                    // Constructs an oscillator.
                    oscillators.push(new Oscillator());
                    // Constructs an oscillator value holder.
                    oscillatorValues.push([]);
                    //debugGraphs.push(new LineGraph());
                }

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

                var x = 0;
                window.setInterval(function() {
                    // Add 1 step to all oscillators
                    for (var i = 0; i < oscillators.length; i++) {

                      oscillators[i].step();


                      // Saves the value.

                      if (oscillatorValues[i].length >= STEPS_TO_REMEMBER) {
                          // Removes the oldest value if the array exceeds the limit.
                          oscillatorValues[i].shift();
                      }
                      oscillatorValues[i].push(oscillators[i].lastTheta);
                    }
                    console.log("0th element in step #" + x);
                    console.log(oscillatorValues[0][0]);
                    console.log(oscillatorValues[1][0]);

                    // Shows last thetas(debug)
                    //for (i = 0; i < oscillators.length; i++) {
                    //    //console.log("Osc #" + i + ":" + oscillators[ i ].lastTheta);
                    //    debugGraphs[ i ].addValue({x: x, y: oscillators[ i ].lastTheta});
                    //    debugGraphs[ i ].render();
                    //}
                    x++;
                }, 300);

            }
        };
    })() : window.app;

})();
