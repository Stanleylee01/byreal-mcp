/**
 * Calculate tick-aligned price range
 * @param poolInfo
 * @param startPrice
 * @param endPrice
 * @returns
 */
export declare function calculateTickAlignedPriceRange(info: {
    tickSpacing: number;
    mintDecimalsA: number;
    mintDecimalsB: number;
    startPrice: string | number;
    endPrice: string | number;
}): {
    priceInTickLower: import("./index.js").TickAlignedPriceDetails;
    priceInTickUpper: import("./index.js").TickAlignedPriceDetails;
};
/**
  Using the following process, reassemble a function that takes a tick + tickSpacing and returns a new price

// tick + tickSpacing -> sqrtPriceX64
SqrtPriceMath.getSqrtPriceX64FromTick;
// sqrtPriceX64 -> price
SqrtPriceMath.sqrtPriceX64ToPrice;
 */
export declare function calculatePriceFromTick(tick: number | string, mintDecimalsA: number, mintDecimalsB: number, tickSpacing: number | string): {
    price: string;
    tick: number;
};
/**
 * Calculate the available price range from a TickSpacing, returns an object containing min and max prices
 * @param tickSpacing
 * @returns
 */
export declare function calculatePriceRangeFromTickSpacing(tickSpacing: number, mintDecimalsA: number, mintDecimalsB: number): {
    min: {
        price: string;
        tick: number;
    };
    max: {
        price: string;
        tick: number;
    };
};
