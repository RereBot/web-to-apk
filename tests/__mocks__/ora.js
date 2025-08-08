// Mock for ora
const createSpinner = (options) => {
  const spinner = {
    start: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    warn: jest.fn().mockReturnThis(),
    info: jest.fn().mockReturnThis(),
    text: typeof options === 'string' ? options : (options?.text || ''),
    color: 'cyan',
    isSpinning: false,
    clear: jest.fn().mockReturnThis(),
    render: jest.fn().mockReturnThis(),
  };
  
  return spinner;
};

const ora = (options) => createSpinner(options);

export default ora;