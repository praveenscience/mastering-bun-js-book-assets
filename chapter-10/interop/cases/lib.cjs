// A CommonJS module, as most older packages are.
exports.rate = 0.2;
exports.withTax = (cents) => Math.round(cents * (1 + exports.rate));
