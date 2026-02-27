import BN from 'bn.js';
import { TickArrayBitmapExtensionType } from '../models.js';
export declare class TickArrayBitmap {
    static maxTickInTickarrayBitmap(tickSpacing: number): number;
    static getBitmapTickBoundary(tickarrayStartIndex: number, tickSpacing: number): {
        minValue: number;
        maxValue: number;
    };
    static nextInitializedTickArrayStartIndex(bitMap: BN, lastTickArrayStartIndex: number, tickSpacing: number, zeroForOne: boolean): {
        isInit: boolean;
        tickIndex: number;
    };
}
export declare class TickArrayBitmapExtensionUtils {
    static getBitmapOffset(tickIndex: number, tickSpacing: number): number;
    static getBitmap(tickIndex: number, tickSpacing: number, tickArrayBitmapExtension: TickArrayBitmapExtensionType): {
        offset: number;
        tickarrayBitmap: BN[];
    };
    static extensionTickBoundary(tickSpacing: number): {
        positiveTickBoundary: number;
        negativeTickBoundary: number;
    };
    static checkTickArrayIsInit(tickArrayStartIndex: number, tickSpacing: number, tickArrayBitmapExtension: TickArrayBitmapExtensionType): {
        isInitialized: boolean;
        startIndex: number;
    };
    static nextInitializedTickArrayFromOneBitmap(lastTickArrayStartIndex: number, tickSpacing: number, zeroForOne: boolean, tickArrayBitmapExtension: TickArrayBitmapExtensionType): {
        isInit: boolean;
        tickIndex: number;
    };
    static nextInitializedTickArrayInBitmap(tickarrayBitmap: BN[], nextTickArrayStartIndex: number, tickSpacing: number, zeroForOne: boolean): {
        isInit: boolean;
        tickIndex: number;
    };
    static tickArrayOffsetInBitmap(tickArrayStartIndex: number, tickSpacing: number): number;
}
