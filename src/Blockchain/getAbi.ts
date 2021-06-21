export function getAbi() {
  try {
    const abi = require('../contract/artifacts/skyekiwi.json');
    return abi;
  } catch(err) {
    try {
      const abi = require('../abi/skyekiwi.json');
      return abi;
    } catch(err) {
      throw new Error("abi not found or misnamed. Looking for skyekiwi.json")
    }
  }
}
