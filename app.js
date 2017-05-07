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


    window.App = !(typeof window['App'] !== 'undefined') ? (function () {
        return {
            init: function () {
                var oscillators = [];
                for (var i = 0; i < 2; i++) {
                    // Constructs oscillators.
                    oscillators.push(new Oscillator());
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
                        console.log("Osc #" + i + ":" + oscillators[i].lastTheta);
                    }
                }, 10);

            }
        };
    })() : window.app;

})();
