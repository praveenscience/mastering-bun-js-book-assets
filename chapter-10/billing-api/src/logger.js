const { requestId } = require("./context");

function log(level, msg, fields = {}) {
  const line = { level, msg, requestId: requestId(), ...fields };
  process.stdout.write(JSON.stringify(line) + "\n");
}

module.exports = {
  info: (msg, fields) => log("info", msg, fields),
  error: (msg, fields) => log("error", msg, fields),
};
