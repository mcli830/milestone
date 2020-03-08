/*
 *  UTILITY FUNCTIONS FOR DEBUGGING
 */

const colorCodes = {
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m"
};

function customLogger(colorName, head = '', tail = ''){
    const color = colorCodes[colorName] || '';
    return (msg) => console.log(color + head, msg, tail);
}

module.exports = {
    customLogger
}