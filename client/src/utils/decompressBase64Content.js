import pako from "pako";

function decompressBase64Content(base64Str) {
  // 1. Decode base64 to binary string
  const binaryString = atob(base64Str);

  // 2. Convert binary string to Uint8Array
  const charCodes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    charCodes[i] = binaryString.charCodeAt(i);
  }

  // 3. Decompress using pako
  const decompressed = pako.inflate(charCodes, { to: "string" });

  return decompressed;
}
export default decompressBase64Content;