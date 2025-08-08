// Mock for inquirer
const inquirer = {
  prompt: jest.fn().mockResolvedValue({}),
  createPromptModule: jest.fn(() => inquirer.prompt),
  registerPrompt: jest.fn(),
  Separator: class Separator {
    constructor(line) {
      this.type = 'separator';
      this.line = line || '--------';
    }
  }
};

module.exports = inquirer;
module.exports.default = inquirer;