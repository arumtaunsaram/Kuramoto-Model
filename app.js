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
       this.width = 960;
       this.height = 200;
       var margin = {};
       margin.top = margin.right = margin.bottom = margin.left = 30;
       this.margin = margin;
       this.data = [];
       this.x = d3.scaleLinear().range([0, this.width]);
    }

    LineGraph.prototype.render = function() {
        if (!this.svg) { // render first time
            this.y = d3.scaleLinear()
                .range([this.height, 0]);

            this.xAxis = d3.axisBottom()
                .scale(this.x);
            this.yAxis = d3.axisLeft()
                .scale(this.y);

            this.line = d3.line()
                .x(function(d) { return x(d.x); })
                .y(function(d) { return y(d.y); });
                // Really need this?
                //.interpolate("basis");
            this.svg = this.container.append("svg")
                .attr("width", this.width + this.margin.left + this.margin.right)
                .attr("height", this.height + this.margin.top + this.margin.bottom)
                .append("g")
                .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

            //this.x.domain(d3.extent(data, function(d) { return d.x; }));
            //this.y.domain(d3.extent(data, function(d) { return d.y; }));

            this.svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + this.height + ")")
                .call(this.xAxis);

            this.svg.append("g")
                .attr("class", "y axis")
                .call(this.yAxis);

            this.svg.append("path")
                .datum(this.data)
                .attr("stroke", "red")
                .attr("d", this.line);
        } else {
            // Resets the target domain
            this.x.domain(d3.extent(this.data, function(d) { return d.x; }));
            this.y.domain(d3.extent(this.data, function(d) { return d.y; }));

            this.svg.select("g.y")
                .transition()
                .duration(100)
                .call(this.yAxis);

            this.svg.select("g.x")
                .transition()
                .duration(100)
                .call(this.xAxis);

            this.svg.selectAll("path.line")
                .datum(this.data)
                .transition(100)
                .attr("d", this.line);
        }
    };

    LineGraph.prototype.addValue = function(value) {
        this.data.push(value);
    };


    window.App = !(typeof window['App'] !== 'undefined') ? (function () {
        return {
            init: function () {
                var oscillators = [];
                /** @type Array<LineGraph> */
                var debugGraphs = [];

                for (var i = 0; i < 2; i++) {
                    // Constructs oscillators.
                    oscillators.push(new Oscillator());
                    debugGraphs.push(new LineGraph());
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

                window.setInterval(function() {
                    // Add 1 step to all oscillators
                    for (var i = 0; i < oscillators.length; i++) {
                      oscillators[i].step();
                    }

                    // Shows last thetas(debug)
                    for (i = 0; i < oscillators.length; i++) {
                        console.log("Osc #" + i + ":" + oscillators[ i ].lastTheta);
                        debugGraphs[ i ].addValue(oscillators[ i ].lastTheta);
                        debugGraphs[ i ].render();
                    }
                }, 300);

            }
        };
    })() : window.app;

})();
