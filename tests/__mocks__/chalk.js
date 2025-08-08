// Mock for chalk
const chalk = {
  red: (text) => text,
  green: (text) => text,
  yellow: (text) => text,
  blue: (text) => text,
  cyan: (text) => text,
  magenta: (text) => text,
  white: (text) => text,
  gray: (text) => text,
  bold: (text) => text,
  dim: (text) => text,
  italic: (text) => text,
  underline: (text) => text,
  strikethrough: (text) => text,
  inverse: (text) => text,
  bgRed: (text) => text,
  bgGreen: (text) => text,
  bgYellow: (text) => text,
  bgBlue: (text) => text,
  bgCyan: (text) => text,
  bgMagenta: (text) => text,
  bgWhite: (text) => text,
  bgGray: (text) => text,
};

// Support chaining
Object.keys(chalk).forEach(key => {
  chalk[key] = Object.assign((text) => text, chalk);
});

module.exports = chalk;