import { AlgorithmResult } from '../types';

/**
 * Binary search implementation for exact-match lookups.
 * Assumes the array is sorted by the field we are searching on.
 */
export function binarySearch<T>(
    array: T[], 
    target: string, 
    extractField: (item: T) => string
): AlgorithmResult<T | null> {
    const start = performance.now();
    let comparisons = 0;
    
    let low = 0;
    let high = array.length - 1;
    let result: T | null = null;
    
    while (low <= high) {
        comparisons++;
        const mid = Math.floor((low + high) / 2);
        const midVal = extractField(array[mid]);
        
        if (midVal === target) {
            result = array[mid];
            break;
        } else if (midVal < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    
    return {
        result,
        runtimeMs: performance.now() - start,
        comparisons
    };
}
