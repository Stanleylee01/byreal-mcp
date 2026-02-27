import { MintLayout } from '@solana/spl-token';
import { Connection, PublicKey, VersionedTransaction, TransactionInstruction } from '@solana/web3.js';
import { IPoolLayoutWithId, IPersonalPositionLayout, ITokenInfo } from '../../instructions/index';
import { IAddLiquidityParams, IClosePositionParams, ICollectFeesParams, ICreatePoolParams, IQuoteSwapExactOutParams, IQuoteSwapExactOutReturn, ISwapExactOutParams, ICreatePositionParams, IDecreaseFullLiquidityParams, IDecreaseLiquidityParams, IInstructionReturn, ParamsWithSignerCallback, ICollectAllFeesParams, SignerCallback, IGetPositionInfoByNftMintReturn, ICalculateCreatePositionFee, IQouteSwapParams, IQouteSwapReturn, ISwapParams } from './models';
import { alignPriceToTickPrice, calculateApr, calculateRewardApr, calculateRangeAprs, getAmountAFromAmountB, getAmountBFromAmountA } from './utils';
export declare class Chain {
    connection: Connection;
    programId: PublicKey;
    private rentFeeCache;
    /**
     * Constructor
     * @param params.connection Solana chain connection object
     * @param params.programId CLMM program ID, default is CLMM_PROGRAM_ID
     */
    constructor(params: {
        connection: Connection;
        programId?: PublicKey;
    });
    /**
     * Get all CLMM position information for a specified account
     * @param userAddress User wallet address
     * @returns Promise<IPersonalPositionLayout[]> Position information list
     */
    getRawPositionInfoListByUserAddress(userAddress: PublicKey): Promise<IPersonalPositionLayout[]>;
    /**
     * Get the corresponding position information based on the NFT mint address
     * @param nftMint NFT mint address
     * @returns Promise<IPersonalPositionLayout | null> Position information
     */
    getRawPositionInfoByNftMint(nftMint: PublicKey): Promise<IPersonalPositionLayout | null>;
    /**
     * Get the corresponding pool information based on the pool address
     * @param poolId Pool address or PublicKey
     * @returns Promise<IPoolLayoutWithId> Pool information
     */
    getRawPoolInfoByPoolId(poolId: string | PublicKey): Promise<IPoolLayoutWithId>;
    /**
     * Get the corresponding token information based on the token mint address
     * @param mintAddress Token mint address
     * @returns Promise<...> Token information
     */
    getRawTokenInfoByMint(mintAddress: PublicKey): Promise<(ReturnType<typeof MintLayout.decode> & {
        owner: PublicKey;
    }) | null>;
    /**
     * Get the simplified token information (including address, precision, and programId)
     * @param mintAddress Token mint address
     * @returns Promise<ITokenInfo>
     */
    getTokenInfoByMint(mintAddress: PublicKey): Promise<ITokenInfo>;
    /**
     * Get the detailed position information, including price range, token amount, fee, etc.
     * @param nftMint NFT mint address
     * @returns Promise<{...}> Detailed position information
     */
    getPositionInfoByNftMint(nftMint: PublicKey): Promise<IGetPositionInfoByNftMintReturn | null>;
    /**
     * Create position instructions on the chain (does not directly send transactions)
     * @param params Parameters required for creating a position
     * @returns IInstructionReturn Contains instructions, signers, and transaction objects
     */
    createPositionInstructions(params: ICreatePositionParams): Promise<IInstructionReturn>;
    /**
     * Calculate the rent fee required for creating a position
     *
     * @param params Parameters required for creating a position and options
     */
    calculateCreatePositionFee(params: ICreatePositionParams & {
        useCache?: boolean;
    }): Promise<ICalculateCreatePositionFee>;
    /**
     * Create a new position and send a transaction
     * @param params Parameters required for creating a position, including a signature callback
     * @returns Promise<string> Transaction signature
     */
    createPosition(params: ParamsWithSignerCallback<ICreatePositionParams>): Promise<string>;
    /**
     * Close the specified position (only when the liquidity is 0, it can be closed)
     * @param params.userAddress User wallet address
     * @param params.nftMint NFT mint address
     * @returns IInstructionReturn Contains instructions and transaction objects
     */
    closePositionInstructions(params: IClosePositionParams): Promise<IInstructionReturn>;
    /**
     * Close the specified position and send a transaction
     * @param params.userAddress User wallet address
     * @param params.nftMint NFT mint address
     * @param params.signerCallback Signature callback
     * @returns Promise<string> Transaction signature
     */
    closePosition(params: {
        userAddress: PublicKey;
        nftMint: PublicKey;
        signerCallback: SignerCallback;
    }): Promise<string>;
    /**
     * Partially remove position liquidity, generate chain instructions
     * @param params Contains user, position, removed liquidity amount, slippage, etc.
     * @returns IInstructionReturn
     */
    decreaseLiquidityInstructions(params: IDecreaseLiquidityParams): Promise<IInstructionReturn>;
    /**
     * Partially remove position liquidity and send a transaction
     * @param params Contains signature callback, etc.
     * @returns Promise<string> Transaction signature
     */
    decreaseLiquidity(params: ParamsWithSignerCallback<IDecreaseLiquidityParams>): Promise<string>;
    /**
     * Remove all position liquidity (optional to automatically close position)
     * @param params.closePosition Whether to close position automatically
     * @param params Other parameters are the same as decreaseLiquidityInstructions
     * @returns IInstructionReturn
     */
    decreaseFullLiquidityInstructions(params: IDecreaseFullLiquidityParams): Promise<IInstructionReturn>;
    /**
     * Remove all position liquidity and send a transaction
     * @param params Contains signature callback, etc.
     * @returns Promise<string> Transaction signature
     */
    decreaseFullLiquidity(params: ParamsWithSignerCallback<IDecreaseFullLiquidityParams>): Promise<string>;
    /**
     * Collect fees for a single position (essentially removing 0 liquidity)
     * @param params Contains user, position, etc.
     * @returns IInstructionReturn
     */
    collectFeesInstructions(params: ICollectFeesParams): Promise<IInstructionReturn>;
    /**
     * Collect fees for all positions of a user, automatically batch to avoid exceeding transaction size limit
     * @param params.userAddress User wallet address
     * @param params.nftMintList NFT mint list
     * @returns { instructionsList, transactions } Batch instructions and transaction objects
     */
    collectAllPositionFeesInstructions(params: ICollectAllFeesParams): Promise<{
        instructionsList: TransactionInstruction[][];
        transactions: VersionedTransaction[];
    }>;
    /**
     * Collect fees for a single position and send a transaction
     * @param params Contains signature callback, etc.
     * @returns Promise<string> Transaction signature
     */
    collectFees(params: ParamsWithSignerCallback<ICollectFeesParams>): Promise<string>;
    /**
     * Add liquidity to an existing position, generate chain instructions
     * @param params Contains user, position, liquidity amount, etc.
     * @returns IInstructionReturn
     */
    addLiquidityInstructions(params: IAddLiquidityParams): Promise<IInstructionReturn>;
    /**
     * Add liquidity to an existing position and send a transaction
     * @param params Contains signature callback, etc.
     * @returns Promise<string> Transaction signature
     */
    addLiquidity(params: ParamsWithSignerCallback<IAddLiquidityParams>): Promise<string>;
    /**
     * Create pool instructions
     * @param params Create pool parameters
     * @returns IInstructionReturn
     */
    createPoolInstructions(params: ICreatePoolParams): Promise<IInstructionReturn>;
    /**
     * Create a new pool and send a transaction
     * @param params Contains signature callback, etc.
     * @returns Promise<string> Transaction signature
     */
    createPool(params: ParamsWithSignerCallback<ICreatePoolParams>): Promise<string>;
    qouteSwap(params: IQouteSwapParams): Promise<IQouteSwapReturn>;
    swapInstructions(params: ISwapParams): Promise<IInstructionReturn>;
    /**
     * Create swap exact out instructions
     * @param params Contains pool info, quote return, and user address
     * @returns IInstructionReturn
     */
    swapExactOutInstructions(params: {
        poolInfo: IPoolLayoutWithId;
        quoteReturn: IQuoteSwapExactOutReturn;
        userAddress: PublicKey;
    }): Promise<IInstructionReturn>;
    swap(params: ParamsWithSignerCallback<ISwapParams>): Promise<string>;
    /**
     * Execute swap exact out transaction
     * @param params Contains signature callback, etc.
     * @returns Promise<string> Transaction signature
     */
    swapExactOut(params: ParamsWithSignerCallback<ISwapExactOutParams>): Promise<string>;
    /**
     * Quote swap exact output - calculate required input amount for desired output
     * @param params Quote parameters including output amount and slippage
     * @returns Quote result with expected input amount and other swap details
     */
    quoteSwapExactOut(params: IQuoteSwapExactOutParams): Promise<IQuoteSwapExactOutReturn>;
    /**
     * Handle SOL/WSOL packaging logic, automatically generate related instructions
     *
     * @param params.userAddress User wallet address
     * @param params.mintA Pool tokenA mint
     * @param params.mintB Pool tokenB mint
     * @param params.amountA Optional, tokenA quantity
     * @param params.amountB Optional, tokenB quantity
     * @param params.rentExemptLamports Optional, WSOL account rent exemption lamports
     * @returns tokenAccountA/B, pre-instructions, post-instructions
     */
    private handleTokenAccount;
    private estimateRentFee;
    calculateApr: typeof calculateApr;
    calculateRewardApr: typeof calculateRewardApr;
    calculateRangeAprs: typeof calculateRangeAprs;
    alignPriceToTickPrice: typeof alignPriceToTickPrice;
    getAmountBFromAmountA: typeof getAmountBFromAmountA;
    getAmountAFromAmountB: typeof getAmountAFromAmountB;
}
