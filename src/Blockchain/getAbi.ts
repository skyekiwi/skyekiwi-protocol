export function getAbi() {
  try {
    return require('../../abi/skyekiwi.json');
  } catch (e) {
    throw new Error("abi not found or misnamed. Looking for skyekiwi.json")
    return null;
  }
}
