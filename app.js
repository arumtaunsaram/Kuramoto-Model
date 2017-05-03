(function() {
    var Oscillator = function () {
        var _ = {};
        /** @type Array */
        _.coupled = [];
        _.omega = 0;
        _.lastTheta = 0;

        _.addCoupledOscillator = function (oscilattor) {
            this.coupled.push(oscilattor);
        };

        _.step = function () {
          // Value between 0.0 and 1.0 will be stored
          this.omega = Math.random();

          this.lastTheta = this.omega; // TODO: Cast the calculated
        };

        return _;
    };


    window.App = !(typeof window['App'] !== 'undefined') ? (function () {
        return {
            init: function () {
                var oscillators = [];
                for (var i = 0; i < 2; i++) {
                    oscillators.push(new Oscillator());
                }

                // Add 1 step to all oscillators
                for (i = 0; i < oscillators.length; i++) {
                  oscillators[i].step();
                }

                // Shows last thetas(debug)
                for (i = 0; i < oscillators.length; i++) {
                    console.log("Osc #" + i + ":" + oscillators[i].lastTheta);
                }

            }
        };
    })() : window.app;

})();
