/**
 * @description Pool configuration layout
 *
 * @example https://solscan.io/account/EdPxg8QaeFSrTYqdWJn6Kezwy9McWncTYueD9eMGCuzR#anchorData
 */
export declare const AmmConfigLayout: import("./libs/marshmallow/index.js").Structure<number | import("@solana/web3.js").PublicKey | Buffer<ArrayBufferLike>, "", {
    owner: import("@solana/web3.js").PublicKey;
    index: number;
    tickSpacing: number;
    tradeFeeRate: number;
    protocolFeeRate: number;
    fundFeeRate: number;
    bump: number;
    fundOwner: import("@solana/web3.js").PublicKey;
    padding: number;
}>;
export type IAmmConfigLayout = ReturnType<typeof AmmConfigLayout.decode>;
/**
 * @description Observation account layout
 *
 * @example https://solscan.io/account/AA5RaVvyGyZgtmAsJJHT5ZVBxVPtAXuYaMwfgeFJW4Mk#anchorData
 */
export declare const ObservationLayout: import("./libs/marshmallow/index.js").Structure<number | boolean | import("bn.js") | import("@solana/web3.js").PublicKey | Buffer<ArrayBufferLike> | {
    blockTimestamp: number;
    tickCumulative: import("bn.js");
}[], "", {
    poolId: import("@solana/web3.js").PublicKey;
    initialized: boolean;
    recentEpoch: import("bn.js");
    observationIndex: number;
    observations: {
        blockTimestamp: number;
        tickCumulative: import("bn.js");
    }[];
}>;
export type IObservationLayout = ReturnType<typeof ObservationLayout.decode>;
/**
 * @description Pool information layout
 *
 * @example https://solscan.io/account/CYbD9RaToYMtWKA7QZyoLahnHdWq553Vm62Lh6qWtuxq#anchorData
 */
export declare const PoolLayout: import("./libs/marshmallow/index.js").Structure<number | import("bn.js") | number[] | import("@solana/web3.js").PublicKey | import("bn.js")[] | Buffer<ArrayBufferLike> | {
    tokenMint: import("@solana/web3.js").PublicKey;
    openTime: import("bn.js");
    emissionsPerSecondX64: import("bn.js");
    endTime: import("bn.js");
    rewardState: number;
    lastUpdateTime: import("bn.js");
    rewardTotalEmissioned: import("bn.js");
    rewardClaimed: import("bn.js");
    tokenVault: import("@solana/web3.js").PublicKey;
    rewardGrowthGlobalX64: import("bn.js");
    creator: import("@solana/web3.js").PublicKey;
}[], "", {
    ammConfig: import("@solana/web3.js").PublicKey;
    tickSpacing: number;
    tickArrayBitmap: import("bn.js")[];
    sqrtPriceX64: import("bn.js");
    openTime: import("bn.js");
    liquidity: import("bn.js");
    status: number;
    bump: number;
    recentEpoch: import("bn.js");
    rewardInfos: {
        tokenMint: import("@solana/web3.js").PublicKey;
        openTime: import("bn.js");
        emissionsPerSecondX64: import("bn.js");
        endTime: import("bn.js");
        rewardState: number;
        lastUpdateTime: import("bn.js");
        rewardTotalEmissioned: import("bn.js");
        rewardClaimed: import("bn.js");
        tokenVault: import("@solana/web3.js").PublicKey;
        rewardGrowthGlobalX64: import("bn.js");
        creator: import("@solana/web3.js").PublicKey;
    }[];
    tickCurrent: number;
    padding1: import("bn.js")[];
    padding2: import("bn.js")[];
    creator: import("@solana/web3.js").PublicKey;
    mintA: import("@solana/web3.js").PublicKey;
    mintB: import("@solana/web3.js").PublicKey;
    vaultA: import("@solana/web3.js").PublicKey;
    vaultB: import("@solana/web3.js").PublicKey;
    observationId: import("@solana/web3.js").PublicKey;
    mintDecimalsA: number;
    mintDecimalsB: number;
    feeGrowthGlobalX64A: import("bn.js");
    feeGrowthGlobalX64B: import("bn.js");
    protocolFeesTokenA: import("bn.js");
    protocolFeesTokenB: import("bn.js");
    swapInAmountTokenA: import("bn.js");
    swapOutAmountTokenB: import("bn.js");
    swapInAmountTokenB: import("bn.js");
    swapOutAmountTokenA: import("bn.js");
    totalFeesTokenA: import("bn.js");
    totalFeesClaimedTokenA: import("bn.js");
    totalFeesTokenB: import("bn.js");
    totalFeesClaimedTokenB: import("bn.js");
    fundFeesTokenA: import("bn.js");
    fundFeesTokenB: import("bn.js");
    decayFeeFlag: number;
    decayFeeInitFeeRate: number;
    decayFeeDecreaseRate: number;
    decayFeeDecreaseInterval: number;
    padding1_1: number[];
}>;
export type IPoolLayout = ReturnType<typeof PoolLayout.decode>;
/**
 * @description Personal position information layout
 *
 * @example https://solscan.io/account/CLYRosA3oGsx6WjuebDYmEL3kukTCSsncmYU6at8nDsn#anchorData
 */
export declare const PersonalPositionLayout: import("./libs/marshmallow/index.js").Structure<number | import("bn.js") | import("@solana/web3.js").PublicKey | Buffer<ArrayBufferLike> | {
    growthInsideLastX64: import("bn.js");
    rewardAmountOwed: import("bn.js");
}[], "", {
    poolId: import("@solana/web3.js").PublicKey;
    liquidity: import("bn.js");
    bump: number;
    tickLower: number;
    tickUpper: number;
    nftMint: import("@solana/web3.js").PublicKey;
    rewardInfos: {
        growthInsideLastX64: import("bn.js");
        rewardAmountOwed: import("bn.js");
    }[];
    feeGrowthInsideLastX64A: import("bn.js");
    feeGrowthInsideLastX64B: import("bn.js");
    tokenFeesOwedA: import("bn.js");
    tokenFeesOwedB: import("bn.js");
}>;
export type IPersonalPositionLayout = ReturnType<typeof PersonalPositionLayout.decode>;
/**
 * @description Protocol position information layout, used to track liquidity within specific price ranges
 *
 * @example https://solscan.io/account/38GUhmh7vPyWStAV3YKEEYPHrLk2Mnw5jvaUQkMGS1hb#anchorData
 */
export declare const ProtocolPositionLayout: import("./libs/marshmallow/index.js").Structure<number | import("bn.js") | import("@solana/web3.js").PublicKey | import("bn.js")[] | Buffer<ArrayBufferLike>, "", {
    poolId: import("@solana/web3.js").PublicKey;
    liquidity: import("bn.js");
    tickLowerIndex: number;
    tickUpperIndex: number;
    bump: number;
    rewardGrowthInside: import("bn.js")[];
    feeGrowthInsideLastX64A: import("bn.js");
    feeGrowthInsideLastX64B: import("bn.js");
    tokenFeesOwedA: import("bn.js");
    tokenFeesOwedB: import("bn.js");
}>;
/**
 * @description Price tick array layout
 *
 * @example https://solscan.io/account/4vGLPwfohNUd2o4NwZPMx7q8AH98DQ9Eth5tS1p8dew1#anchorData
 */
/**
 * @description TickState layout (168 bytes)
 */
export declare const TickStateLayout: import("./libs/marshmallow/index.js").Structure<number | import("bn.js") | number[] | import("bn.js")[], "", {
    tick: number;
    liquidityNet: import("bn.js");
    liquidityGross: import("bn.js");
    rewardGrowthsOutsideX64: import("bn.js")[];
    feeGrowthOutsideX64A: import("bn.js");
    feeGrowthOutsideX64B: import("bn.js");
}>;
export type ITickStateLayout = ReturnType<typeof TickStateLayout.decode>;
export declare const TickArrayLayout: import("./libs/marshmallow/index.js").Structure<number | import("@solana/web3.js").PublicKey | Buffer<ArrayBufferLike> | {
    tick: number;
    liquidityNet: import("bn.js");
    liquidityGross: import("bn.js");
    rewardGrowthsOutsideX64: import("bn.js")[];
    feeGrowthOutsideX64A: import("bn.js");
    feeGrowthOutsideX64B: import("bn.js");
}[], "", {
    poolId: import("@solana/web3.js").PublicKey;
    startTickIndex: number;
    ticks: {
        tick: number;
        liquidityNet: import("bn.js");
        liquidityGross: import("bn.js");
        rewardGrowthsOutsideX64: import("bn.js")[];
        feeGrowthOutsideX64A: import("bn.js");
        feeGrowthOutsideX64B: import("bn.js");
    }[];
    initializedTickCount: number;
}>;
export type ITickArrayLayout = ReturnType<typeof TickArrayLayout.decode>;
/**
 * @description Dynamic Tick Array layout
 *
 * Dynamic tick arrays use a sparse storage model with a mapping table (tick_offset_index)
 * to track which logical tick positions have allocated TickStates.
 * This allows for more efficient memory usage compared to fixed tick arrays.
 *
 * Struct size: 208 bytes (32+4+4+60+1+1+2+8+96)
 * Header size: 216 bytes (8 discriminator + 208 struct)
 * Followed by dynamic number of TickStates (max 60, each 168 bytes)
 */
export declare const DynTickArrayLayout: import("./libs/marshmallow/index.js").Structure<number | import("bn.js") | number[] | import("@solana/web3.js").PublicKey | Buffer<ArrayBufferLike>, "", {
    poolId: import("@solana/web3.js").PublicKey;
    recentEpoch: import("bn.js");
    padding1: Buffer<ArrayBufferLike>;
    padding2: Buffer<ArrayBufferLike>;
    startTickIndex: number;
    initializedTickCount: number;
    padding0: Buffer<ArrayBufferLike>;
    tickOffsetIndex: number[];
    allocTickCount: number;
}>;
export type IDynTickArrayLayout = ReturnType<typeof DynTickArrayLayout.decode>;
/**
 * @description Price tick array bitmap extension layout
 *
 * @example https://solscan.io/account/DoPuiZfJu7sypqwR4eiU7C5TMcmmiFoU4HaF5SoD8mRy#anchorData
 */
export declare const TickArrayBitmapExtensionLayout: import("./libs/marshmallow/index.js").Structure<import("@solana/web3.js").PublicKey | Buffer<ArrayBufferLike> | import("bn.js")[][], "", {
    poolId: import("@solana/web3.js").PublicKey;
    positiveTickArrayBitmap: import("bn.js")[][];
    negativeTickArrayBitmap: import("bn.js")[][];
}>;
export declare const SPLTokenAccountLayout: import("./libs/marshmallow/index.js").Structure<number | import("bn.js") | import("@solana/web3.js").PublicKey, "", {
    amount: import("bn.js");
    owner: import("@solana/web3.js").PublicKey;
    mint: import("@solana/web3.js").PublicKey;
    delegateOption: number;
    delegate: import("@solana/web3.js").PublicKey;
    state: number;
    isNativeOption: number;
    isNative: import("bn.js");
    delegatedAmount: import("bn.js");
    closeAuthorityOption: number;
    closeAuthority: import("@solana/web3.js").PublicKey;
}>;
