/**
 * Type guard to check if a container is a fixed tick array
 */
export function isFixedTickArray(container) {
    return container.type === 'Fixed';
}
/**
 * Type guard to check if a container is a dynamic tick array
 */
export function isDynamicTickArray(container) {
    return container.type === 'Dynamic';
}
