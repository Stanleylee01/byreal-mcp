import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import BN from 'bn.js';
import { BYREAL_CLMM_PROGRAM_ID } from '../constants.js';
import ByrealClmmIDL from './target/idl/byreal_amm_v3.json' with { type: 'json' };
export const getAmmV3Program = (programId) => {
    // Create a read-only provider, no wallet needed
    const provider = new anchor.AnchorProvider(new Connection(clusterApiUrl('mainnet-beta'), 'confirmed'), {}, // Empty wallet object, since only instruction creation is needed
    { commitment: 'confirmed' });
    if (programId.toBase58() === BYREAL_CLMM_PROGRAM_ID.toBase58()) {
        return new Program(ByrealClmmIDL, provider);
    }
    throw new Error('[getAmmV3Program error]: Invalid program id');
};
export class BaseInstruction {
    static async createPoolInstruction(programId, poolCreator, poolManager, ammConfigId, mintA, mintProgramIdA, mintB, mintProgramIdB, sqrtPriceX64, openTime, extendMintAccount) {
        const program = getAmmV3Program(programId);
        const _openTime = openTime || new BN(0);
        const instruction = program.methods.createPool(sqrtPriceX64, _openTime).accounts({
            poolCreator,
            poolManager,
            ammConfig: ammConfigId,
            tokenMint0: mintA,
            tokenMint1: mintB,
            tokenProgram0: mintProgramIdA,
            tokenProgram1: mintProgramIdB,
        });
        // If there are additional mint accounts, add them as remaining accounts
        if (extendMintAccount && extendMintAccount.length > 0) {
            instruction.remainingAccounts(extendMintAccount.map((k) => ({
                pubkey: k,
                isSigner: false,
                isWritable: false,
            })));
        }
        return await instruction.instruction();
    }
    static async openPositionFromLiquidityInstruction(programId, payer, poolId, positionNftOwner, positionNftMint, positionNftAccount, metadataAccount, protocolPosition, tickArrayLower, tickArrayUpper, personalPosition, ownerTokenAccountA, ownerTokenAccountB, tokenVaultA, tokenVaultB, tokenMintA, tokenMintB, tickLowerIndex, tickUpperIndex, tickArrayLowerStartIndex, tickArrayUpperStartIndex, liquidity, amountMaxA, amountMaxB, withMetadata, exTickArrayBitmap) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods
            .openPositionV2(tickLowerIndex, tickUpperIndex, tickArrayLowerStartIndex, tickArrayUpperStartIndex, liquidity, amountMaxA, amountMaxB, withMetadata === 'create', null // Set baseFlag to null, since this is based on liquidity
        )
            .accountsPartial({
            payer,
            positionNftOwner,
            positionNftMint,
            positionNftAccount,
            metadataAccount,
            poolState: poolId,
            protocolPosition,
            tickArrayLower,
            tickArrayUpper,
            personalPosition,
            tokenAccount0: ownerTokenAccountA,
            tokenAccount1: ownerTokenAccountB,
            tokenVault0: tokenVaultA,
            tokenVault1: tokenVaultB,
            vault0Mint: tokenMintA,
            vault1Mint: tokenMintB,
        });
        // If there are additional tick array bitmaps, add them as remaining accounts
        if (exTickArrayBitmap) {
            instruction.remainingAccounts([{ pubkey: exTickArrayBitmap, isSigner: false, isWritable: true }]);
        }
        return await instruction.instruction();
    }
    static async openPositionFromLiquidityInstruction22(programId, payer, poolId, positionNftOwner, positionNftMint, positionNftAccount, protocolPosition, tickArrayLower, tickArrayUpper, personalPosition, ownerTokenAccountA, ownerTokenAccountB, tokenVaultA, tokenVaultB, tokenMintA, tokenMintB, tickLowerIndex, tickUpperIndex, tickArrayLowerStartIndex, tickArrayUpperStartIndex, liquidity, amountMaxA, amountMaxB, withMetadata, exTickArrayBitmap) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods
            .openPositionWithToken22Nft(tickLowerIndex, tickUpperIndex, tickArrayLowerStartIndex, tickArrayUpperStartIndex, liquidity, amountMaxA, amountMaxB, withMetadata === 'create', null)
            .accountsPartial({
            payer,
            positionNftOwner,
            positionNftMint,
            positionNftAccount,
            poolState: poolId,
            // Here we need to manually pass in the generated PDA account, because anchor auto-generation uses little endian, while raydium's contract uses big endian (tick_lower_index.to_be_bytes()), using anchor auto-generation will cause errors;
            protocolPosition,
            tickArrayLower,
            tickArrayUpper,
            personalPosition,
            tokenAccount0: ownerTokenAccountA,
            tokenAccount1: ownerTokenAccountB,
            tokenVault0: tokenVaultA,
            tokenVault1: tokenVaultB,
            vault0Mint: tokenMintA,
            vault1Mint: tokenMintB,
        });
        // If there are additional tick array bitmaps, add them as remaining accounts
        if (exTickArrayBitmap) {
            instruction.remainingAccounts([{ pubkey: exTickArrayBitmap, isSigner: false, isWritable: true }]);
        }
        return await instruction.instruction();
    }
    static async openPositionFromBaseInstruction(programId, payer, poolId, positionNftOwner, positionNftMint, positionNftAccount, metadataAccount, protocolPosition, tickArrayLower, tickArrayUpper, personalPosition, ownerTokenAccountA, ownerTokenAccountB, tokenVaultA, tokenVaultB, tokenMintA, tokenMintB, tickLowerIndex, tickUpperIndex, tickArrayLowerStartIndex, tickArrayUpperStartIndex, withMetadata, base, baseAmount, otherAmountMax, exTickArrayBitmap) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods
            .openPositionV2(tickLowerIndex, tickUpperIndex, tickArrayLowerStartIndex, tickArrayUpperStartIndex, new BN(0), // Set liquidity to 0, since this is based on base amount
        base === 'MintA' ? baseAmount : otherAmountMax, // amount0Max
        base === 'MintA' ? otherAmountMax : baseAmount, // amount1Max
        withMetadata === 'create', base === 'MintA' // baseFlag
        )
            .accountsPartial({
            payer,
            positionNftOwner,
            positionNftMint,
            positionNftAccount,
            metadataAccount,
            poolState: poolId,
            protocolPosition,
            tickArrayLower,
            tickArrayUpper,
            personalPosition,
            tokenAccount0: ownerTokenAccountA,
            tokenAccount1: ownerTokenAccountB,
            tokenVault0: tokenVaultA,
            tokenVault1: tokenVaultB,
            vault0Mint: tokenMintA,
            vault1Mint: tokenMintB,
        });
        // If there are additional tick array bitmaps, add them as remaining accounts
        if (exTickArrayBitmap) {
            instruction.remainingAccounts([{ pubkey: exTickArrayBitmap, isSigner: false, isWritable: true }]);
        }
        return await instruction.instruction();
    }
    static async openPositionFromBaseInstruction22(programId, payer, poolId, positionNftOwner, positionNftMint, positionNftAccount, protocolPosition, tickArrayLower, tickArrayUpper, personalPosition, ownerTokenAccountA, ownerTokenAccountB, tokenVaultA, tokenVaultB, tokenMintA, tokenMintB, tickLowerIndex, tickUpperIndex, tickArrayLowerStartIndex, tickArrayUpperStartIndex, withMetadata, base, baseAmount, otherAmountMax, exTickArrayBitmap) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods
            .openPositionWithToken22Nft(tickLowerIndex, tickUpperIndex, tickArrayLowerStartIndex, tickArrayUpperStartIndex, new BN(0), // Set liquidity to 0, since this is based on base amount
        base === 'MintA' ? baseAmount : otherAmountMax, // amountMaxA
        base === 'MintA' ? otherAmountMax : baseAmount, // amountMaxB
        withMetadata === 'create', base === 'MintA' // baseFlag
        )
            .accountsPartial({
            payer,
            positionNftOwner,
            positionNftMint,
            positionNftAccount,
            poolState: poolId,
            // Here we need to manually pass in the generated PDA account, because anchor auto-generation uses little endian; while raydium's contract uses big endian (tick_lower_index.to_be_bytes())
            protocolPosition,
            tickArrayLower,
            tickArrayUpper,
            personalPosition,
            tokenAccount0: ownerTokenAccountA,
            tokenAccount1: ownerTokenAccountB,
            tokenVault0: tokenVaultA,
            tokenVault1: tokenVaultB,
            vault0Mint: tokenMintA,
            vault1Mint: tokenMintB,
        });
        // If there are additional tick array bitmaps, add them as remaining accounts
        if (exTickArrayBitmap) {
            instruction.remainingAccounts([{ pubkey: exTickArrayBitmap, isSigner: false, isWritable: true }]);
        }
        return await instruction.instruction();
    }
    static async closePositionInstruction(programId, positionNftOwner, positionNftMint, positionNftAccount, nft2022) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods.closePosition().accounts({
            nftOwner: positionNftOwner,
            positionNftMint,
            positionNftAccount,
            tokenProgram: nft2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID,
        });
        return await instruction.instruction();
    }
    static async increasePositionFromLiquidityInstruction(programId, positionNftOwner, positionNftAccount, personalPosition, poolId, protocolPosition, tickArrayLower, tickArrayUpper, ownerTokenAccountA, ownerTokenAccountB, mintVaultA, mintVaultB, mintMintA, mintMintB, liquidity, amountMaxA, amountMaxB, exTickArrayBitmap) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods
            .increaseLiquidityV2(liquidity, amountMaxA, amountMaxB, null // Set baseFlag to null, since this is based on liquidity instruction
        )
            .accountsPartial({
            nftOwner: positionNftOwner,
            nftAccount: positionNftAccount,
            poolState: poolId,
            protocolPosition,
            personalPosition,
            tickArrayLower,
            tickArrayUpper,
            tokenAccount0: ownerTokenAccountA,
            tokenAccount1: ownerTokenAccountB,
            tokenVault0: mintVaultA,
            tokenVault1: mintVaultB,
            vault0Mint: mintMintA,
            vault1Mint: mintMintB,
        });
        // If there are additional tick array bitmaps, add them as remaining accounts
        if (exTickArrayBitmap) {
            instruction.remainingAccounts([{ pubkey: exTickArrayBitmap, isSigner: false, isWritable: true }]);
        }
        return await instruction.instruction();
    }
    static async increasePositionFromBaseInstruction(programId, positionNftOwner, positionNftAccount, personalPosition, poolId, protocolPosition, tickArrayLower, tickArrayUpper, ownerTokenAccountA, ownerTokenAccountB, mintVaultA, mintVaultB, mintMintA, mintMintB, base, baseAmount, otherAmountMax, exTickArrayBitmap) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods
            .increaseLiquidityV2(new BN(0), // Set liquidity to 0, since this is based on base amount
        base === 'MintA' ? baseAmount : otherAmountMax, // amount0Max
        base === 'MintA' ? otherAmountMax : baseAmount, // amount1Max
        base === 'MintA' // baseFlag
        )
            .accountsPartial({
            nftOwner: positionNftOwner,
            nftAccount: positionNftAccount,
            poolState: poolId,
            protocolPosition,
            personalPosition,
            tickArrayLower,
            tickArrayUpper,
            tokenAccount0: ownerTokenAccountA,
            tokenAccount1: ownerTokenAccountB,
            tokenVault0: mintVaultA,
            tokenVault1: mintVaultB,
            vault0Mint: mintMintA,
            vault1Mint: mintMintB,
        });
        // If there are additional tick array bitmaps, add them as remaining accounts
        if (exTickArrayBitmap) {
            instruction.remainingAccounts([{ pubkey: exTickArrayBitmap, isSigner: false, isWritable: true }]);
        }
        return await instruction.instruction();
    }
    static async decreaseLiquidityInstruction(programId, positionNftOwner, positionNftAccount, personalPosition, poolId, protocolPosition, tickArrayLower, tickArrayUpper, ownerTokenAccountA, ownerTokenAccountB, mintVaultA, mintVaultB, mintMintA, mintMintB, rewardAccounts, liquidity, amountMinA, amountMinB, exTickArrayBitmap) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods.decreaseLiquidityV2(liquidity, amountMinA, amountMinB).accountsPartial({
            nftOwner: positionNftOwner,
            nftAccount: positionNftAccount,
            personalPosition,
            poolState: poolId,
            protocolPosition,
            tokenVault0: mintVaultA,
            tokenVault1: mintVaultB,
            tickArrayLower,
            tickArrayUpper,
            recipientTokenAccount0: ownerTokenAccountA,
            recipientTokenAccount1: ownerTokenAccountB,
            vault0Mint: mintMintA,
            vault1Mint: mintMintB,
        });
        // Build remaining accounts
        const remainingAccounts = [
            ...(exTickArrayBitmap ? [{ pubkey: exTickArrayBitmap, isSigner: false, isWritable: true }] : []),
            ...rewardAccounts
                .map((i) => [
                { pubkey: i.poolRewardVault, isSigner: false, isWritable: true },
                { pubkey: i.ownerRewardVault, isSigner: false, isWritable: true },
                { pubkey: i.rewardMint, isSigner: false, isWritable: false },
            ])
                .flat(),
        ];
        if (remainingAccounts.length > 0) {
            instruction.remainingAccounts(remainingAccounts);
        }
        return await instruction.instruction();
    }
    static async swapInstruction(programId, payer, poolId, ammConfigId, inputTokenAccount, outputTokenAccount, inputVault, outputVault, inputMint, outputMint, tickArray, observationId, amount, otherAmountThreshold, sqrtPriceLimitX64, isBaseInput, exTickArrayBitmap) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods.swapV2(amount, otherAmountThreshold, sqrtPriceLimitX64, isBaseInput).accounts({
            payer,
            ammConfig: ammConfigId,
            poolState: poolId,
            inputTokenAccount,
            outputTokenAccount,
            inputVault,
            outputVault,
            observationState: observationId,
            inputVaultMint: inputMint,
            outputVaultMint: outputMint,
        });
        // Build remaining accounts
        const remainingAccounts = [
            ...(exTickArrayBitmap ? [{ pubkey: exTickArrayBitmap, isSigner: false, isWritable: true }] : []),
            ...tickArray.map((i) => ({
                pubkey: i,
                isSigner: false,
                isWritable: true,
            })),
        ];
        if (remainingAccounts.length > 0) {
            instruction.remainingAccounts(remainingAccounts);
        }
        return await instruction.instruction();
    }
    static async initRewardInstruction(programId, rewardFunder, funderTokenAccount, ammConfigId, poolId, rewardMint, rewardProgramId, openTime, endTime, emissionsPerSecondX64) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods
            .initializeReward({
            openTime: new BN(openTime),
            endTime: new BN(endTime),
            emissionsPerSecondX64,
        })
            .accounts({
            rewardFunder,
            funderTokenAccount,
            ammConfig: ammConfigId,
            poolState: poolId,
            rewardTokenMint: rewardMint,
            rewardTokenProgram: rewardProgramId,
        });
        return await instruction.instruction();
    }
    static async setRewardInstruction(programId, authority, ammConfigId, poolId, rewardIndex, emissionsPerSecondX64, openTime, endTime) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods
            .setRewardParams(rewardIndex, emissionsPerSecondX64, new BN(openTime), new BN(endTime))
            .accounts({
            authority,
            ammConfig: ammConfigId,
            poolState: poolId,
        });
        return await instruction.instruction();
    }
    static async collectRewardInstruction(programId, rewardFunder, funderTokenAccount, poolId, rewardVault, rewardMint, rewardIndex) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods.collectRemainingRewards(rewardIndex).accounts({
            rewardFunder,
            funderTokenAccount,
            poolState: poolId,
            rewardTokenVault: rewardVault,
            rewardVaultMint: rewardMint,
        });
        return await instruction.instruction();
    }
    static async createAmmConfigInstruction(programId, owner, ammConfigId, index, tickSpacing, tradeFeeRate, protocolFeeRate, fundFeeRate) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods
            .createAmmConfig(index, tickSpacing, tradeFeeRate, protocolFeeRate, fundFeeRate)
            .accountsPartial({
            owner,
            ammConfig: ammConfigId,
        });
        return await instruction.instruction();
    }
    static async updateAmmConfigInstruction(programId, ammConfigId, owner, param, value) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods.updateAmmConfig(param, value).accounts({
            owner,
            ammConfig: ammConfigId,
        });
        return await instruction.instruction();
    }
    static async updatePoolStatusInstruction(programId, authority, poolState, status) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods.updatePoolStatus(status).accounts({
            poolState,
            authority,
        });
        return await instruction.instruction();
    }
    static async createSupportMintAssociatedInstruction(programId, owner, tokenMint) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods.createSupportMintAssociated().accounts({
            owner,
            tokenMint,
        });
        return await instruction.instruction();
    }
    static async createOperationAccountInstruction(programId, owner) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods.createOperationAccount().accounts({
            owner,
        });
        return await instruction.instruction();
    }
    static async updateOperationAccountInstruction(programId, owner, param, keys) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods.updateOperationAccount(param, keys).accounts({
            owner,
        });
        return await instruction.instruction();
    }
    static async transferRewardOwnerInstruction(programId, authority, poolState, newOwner) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods.transferRewardOwner(newOwner).accounts({
            poolState,
            authority,
        });
        return await instruction.instruction();
    }
    static async updateRewardInfosInstruction(programId, poolState) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods.updateRewardInfos().accounts({
            poolState,
        });
        return await instruction.instruction();
    }
    static async collectProtocolFeeInstruction(programId, poolState, tokenVault0, tokenVault1, vault0Mint, vault1Mint, amount0Requested, amount1Requested) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods.collectProtocolFee(amount0Requested, amount1Requested).accounts({
            poolState,
            tokenVault0,
            tokenVault1,
            vault0Mint,
            vault1Mint,
        });
        return await instruction.instruction();
    }
    static async collectFundFeeInstruction(programId, poolState, tokenVault0, tokenVault1, vault0Mint, vault1Mint, amount0Requested, amount1Requested) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods.collectFundFee(amount0Requested, amount1Requested).accounts({
            poolState,
            tokenVault0,
            tokenVault1,
            vault0Mint,
            vault1Mint,
        });
        return await instruction.instruction();
    }
    static async _legacy_openPosition(programId, payer, positionNftOwner, positionNftMint, positionNftAccount, metadataAccount, poolState, protocolPosition, tickArrayLower, tickArrayUpper, personalPosition, tokenAccount0, tokenAccount1, tokenVault0, tokenVault1, tickLowerIndex, tickUpperIndex, tickArrayLowerStartIndex, tickArrayUpperStartIndex, liquidity, amount0Max, amount1Max, remainingAccounts) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods
            .openPosition(tickLowerIndex, tickUpperIndex, tickArrayLowerStartIndex, tickArrayUpperStartIndex, liquidity, amount0Max, amount1Max)
            .accountsPartial({
            payer,
            positionNftOwner,
            positionNftMint,
            positionNftAccount,
            metadataAccount,
            poolState,
            protocolPosition,
            tickArrayLower,
            tickArrayUpper,
            personalPosition,
            tokenAccount0,
            tokenAccount1,
            tokenVault0,
            tokenVault1,
        });
        // Add remaining accounts
        if (remainingAccounts && remainingAccounts.length > 0) {
            instruction.remainingAccounts(remainingAccounts);
        }
        return await instruction.instruction();
    }
    static async _legacy_increaseLiquidity(programId, nftOwner, nftAccount, poolState, protocolPosition, personalPosition, tickArrayLower, tickArrayUpper, tokenAccount0, tokenAccount1, tokenVault0, tokenVault1, liquidity, amount0Max, amount1Max, remainingAccounts) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods.increaseLiquidity(liquidity, amount0Max, amount1Max).accountsPartial({
            nftOwner,
            nftAccount,
            poolState,
            protocolPosition,
            personalPosition,
            tickArrayLower,
            tickArrayUpper,
            tokenAccount0,
            tokenAccount1,
            tokenVault0,
            tokenVault1,
        });
        // Add remaining accounts
        if (remainingAccounts && remainingAccounts.length > 0) {
            instruction.remainingAccounts(remainingAccounts);
        }
        return await instruction.instruction();
    }
    static async _legacy_decreaseLiquidity(programId, nftOwner, nftAccount, personalPosition, poolState, protocolPosition, tokenVaultA, tokenVaultB, tickArrayLower, tickArrayUpper, recipientTokenAccountA, recipientTokenAccountB, liquidity, amountAMin, amountBMin, remainingAccounts) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods.decreaseLiquidity(liquidity, amountAMin, amountBMin).accountsPartial({
            nftOwner,
            nftAccount,
            personalPosition,
            poolState,
            protocolPosition,
            tokenVault0: tokenVaultA,
            tokenVault1: tokenVaultB,
            tickArrayLower,
            tickArrayUpper,
            recipientTokenAccount0: recipientTokenAccountA,
            recipientTokenAccount1: recipientTokenAccountB,
        });
        // Add remaining accounts
        if (remainingAccounts && remainingAccounts.length > 0) {
            instruction.remainingAccounts(remainingAccounts);
        }
        return await instruction.instruction();
    }
    static async _legacy_swap(programId, payer, ammConfig, poolState, inputTokenAccount, outputTokenAccount, inputVault, outputVault, observationState, tickArray, amount, otherAmountThreshold, sqrtPriceLimitX64, isBaseInput, remainingAccounts) {
        const program = getAmmV3Program(programId);
        // First tick array as required account, the rest as remaining accounts
        const [firstTickArray, ...restTickArrays] = tickArray;
        const instruction = program.methods.swap(amount, otherAmountThreshold, sqrtPriceLimitX64, isBaseInput).accounts({
            payer,
            ammConfig,
            poolState,
            inputTokenAccount,
            outputTokenAccount,
            inputVault,
            outputVault,
            observationState,
            tickArray: firstTickArray,
        });
        // Build remaining accounts, including remaining tick arrays and additional accounts
        const allRemainingAccounts = [
            ...restTickArrays.map((pubkey) => ({
                pubkey,
                isSigner: false,
                isWritable: true,
            })),
            ...(remainingAccounts || []),
        ];
        if (allRemainingAccounts.length > 0) {
            instruction.remainingAccounts(allRemainingAccounts);
        }
        return await instruction.instruction();
    }
    // Initialize admin group
    static async initAmmAdminGroupInstruction(programId, params) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods.initAmmAdminGroup({
            feeKeeper: params.feeKeeper,
            rewardConfigManager: params.rewardConfigManager,
            rewardClaimManager: params.rewardClaimManager,
            poolManager: params.poolManager,
            emergencyManager: params.emergencyManager,
            normalManager: params.normalManager,
        });
        return await instruction.instruction();
    }
    // Update admin group
    static async updateAmmAdminGroupInstruction(programId, params) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods.updateAmmAdminGroup({
            feeKeeper: params.feeKeeper ?? null,
            rewardConfigManager: params.rewardConfigManager ?? null,
            rewardClaimManager: params.rewardClaimManager ?? null,
            poolManager: params.poolManager ?? null,
            emergencyManager: params.emergencyManager ?? null,
            normalManager: params.normalManager ?? null,
        });
        return await instruction.instruction();
    }
    // New chain-off reward related instructions
    static async depositOffchainRewardInstruction(programId, poolId, payer, authority, tokenMint, payerTokenAccount, tokenProgram, amount) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods.depositOffchainReward(amount).accountsPartial({
            payer,
            poolId,
            authority,
            tokenMint,
            payerTokenAccount,
            tokenProgram,
        });
        return await instruction.instruction();
    }
    static async claimOffchainRewardInstruction(programId, poolId, claimer, authority, tokenMint, claimerTokenAccount, tokenProgram, amount) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods.claimOffchainReward(amount).accountsPartial({
            claimer,
            authority,
            poolId,
            tokenMint,
            claimerTokenAccount,
            tokenProgram,
        });
        return await instruction.instruction();
    }
    static async withdrawOffchainRewardInstruction(programId, poolId, authority, tokenMint, receiverTokenAccount, tokenProgram, amount) {
        const program = getAmmV3Program(programId);
        const instruction = program.methods.withdrawOffchainReward(amount).accountsPartial({
            authority,
            tokenMint,
            poolId,
            receiverTokenAccount,
            tokenProgram,
        });
        return await instruction.instruction();
    }
}
