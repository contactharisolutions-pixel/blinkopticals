const measurement = "59-44-145";
const parts = String(measurement).split(/[\s\-_/x]+/).filter(Boolean);
console.log(parts);
const lensWidth = parts[0];
const bridgeWidth = parts[1];
const templeLength = parts[2] || '';
console.log({ lensWidth, bridgeWidth, templeLength });
