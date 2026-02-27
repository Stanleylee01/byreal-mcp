import { PublicKey } from '@solana/web3.js';
import { Tick, DynTickArray, TickArrayContainer } from './models.js';
/**
 * Tick Array 工具类
 * 处理固定和动态 Tick Array 的统一操作
 */
export declare class TickArrayUtils {
    /**
     * Discriminator 常量
     * 这些值通过 Anchor 框架自动生成（SHA256("account:<StructName>") 的前 8 字节）
     */
    private static readonly FIXED_TICK_ARRAY_DISCRIMINATOR;
    private static readonly DYN_TICK_ARRAY_DISCRIMINATOR;
    /**
     * 识别 Tick Array 的类型
     * @param accountData 账户数据
     * @returns 'Fixed' 或 'Dynamic'
     */
    static identifyTickArrayType(accountData: Buffer): 'Fixed' | 'Dynamic';
    /**
     * 解码动态 Tick Array
     * @param accountData 账户数据
     * @param address 账户地址（可选）
     * @returns DynTickArray
     */
    static decodeDynTickArray(accountData: Buffer, address?: PublicKey): DynTickArray;
    /**
     * 从容器中获取 Tick State
     * @param container TickArrayContainer
     * @param tickIndex Tick 索引
     * @param tickSpacing Tick 间距
     * @returns Tick 或 null（如果未分配）
     */
    static getTickStateFromContainer(container: TickArrayContainer, tickIndex: number, tickSpacing: number): Tick | null;
    /**
     * 从动态 Tick Array 中获取 Tick State
     * @param dynTickArray DynTickArray
     * @param tickIndex Tick 索引
     * @param tickSpacing Tick 间距
     * @returns Tick 或 null（如果未分配）
     */
    private static getTickStateFromDynArray;
    /**
     * Parse tick array account data into a container
     * Supports both fixed and dynamic tick arrays
     * @private
     */
    static parseTickArrayContainer(accountData: Buffer, address: PublicKey): TickArrayContainer;
}
