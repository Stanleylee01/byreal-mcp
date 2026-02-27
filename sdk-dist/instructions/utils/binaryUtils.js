// Convert 16-bit unsigned integer to byte array
export function u16ToBytes(num) {
    const arr = new ArrayBuffer(2);
    const view = new DataView(arr);
    view.setUint16(0, num, false);
    return new Uint8Array(arr);
}
// Convert 16-bit integer to byte array
export function i16ToBytes(num) {
    const arr = new ArrayBuffer(2);
    const view = new DataView(arr);
    view.setInt16(0, num, false);
    return new Uint8Array(arr);
}
// Convert 32-bit unsigned integer to byte array
export function u32ToBytes(num) {
    const arr = new ArrayBuffer(4);
    const view = new DataView(arr);
    view.setUint32(0, num, false);
    return new Uint8Array(arr);
}
// Convert 32-bit integer to byte array
export function i32ToBytes(num) {
    const arr = new ArrayBuffer(4);
    const view = new DataView(arr);
    view.setInt32(0, num, false);
    return new Uint8Array(arr);
}
// Find the position of the highest bit '1' in the bitmap
export function leadingZeros(bitNum, data) {
    let i = 0;
    for (let j = bitNum - 1; j >= 0; j--) {
        if (!data.testn(j)) {
            i++;
        }
        else {
            break;
        }
    }
    return i;
}
// Find the position of the lowest '0' in the bitmap
export function trailingZeros(bitNum, data) {
    let i = 0;
    for (let j = 0; j < bitNum; j++) {
        if (!data.testn(j)) {
            i++;
        }
        else {
            break;
        }
    }
    return i;
}
// Check if the bitmap is empty
export function isZero(bitNum, data) {
    for (let i = 0; i < bitNum; i++) {
        if (data.testn(i))
            return false;
    }
    return true;
}
// Find the position of the highest bit '1' in the bitmap
export function mostSignificantBit(bitNum, data) {
    if (isZero(bitNum, data))
        return null;
    else
        return leadingZeros(bitNum, data);
}
// Find the position of the lowest bit '1' in the bitmap
export function leastSignificantBit(bitNum, data) {
    if (isZero(bitNum, data))
        return null;
    else
        return trailingZeros(bitNum, data);
}
