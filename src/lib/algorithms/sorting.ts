import { AlgorithmResult } from '../types';

/**
 * Merge Sort implementation.
 * Counts comparisons and measures time.
 */
export function mergeSort<T>(array: T[], compareFn: (a: T, b: T) => number): AlgorithmResult<T[]> {
  const start = performance.now();
  let comparisons = 0;
  
  function sort(arr: T[]): T[] {
    if (arr.length <= 1) return arr;
    const mid = Math.floor(arr.length / 2);
    const left = sort(arr.slice(0, mid));
    const right = sort(arr.slice(mid));
    return merge(left, right);
  }
  
  function merge(left: T[], right: T[]): T[] {
    const result: T[] = [];
    let i = 0, j = 0;
    while (i < left.length && j < right.length) {
      comparisons++;
      if (compareFn(left[i], right[j]) <= 0) {
        result.push(left[i]);
        i++;
      } else {
        result.push(right[j]);
        j++;
      }
    }
    return result.concat(left.slice(i)).concat(right.slice(j));
  }
  
  const result = sort([...array]);
  
  return {
    result,
    runtimeMs: performance.now() - start,
    comparisons
  };
}

/**
 * Quick Sort implementation.
 * Counts comparisons and measures time.
 */
export function quickSort<T>(array: T[], compareFn: (a: T, b: T) => number): AlgorithmResult<T[]> {
  const start = performance.now();
  let comparisons = 0;
  const result = [...array];
  
  function sort(arr: T[], low: number, high: number) {
    if (low < high) {
      const pi = partition(arr, low, high);
      sort(arr, low, pi - 1);
      sort(arr, pi + 1, high);
    }
  }
  
  function partition(arr: T[], low: number, high: number): number {
    const pivot = arr[high];
    let i = low - 1;
    for (let j = low; j <= high - 1; j++) {
      comparisons++;
      if (compareFn(arr[j], pivot) < 0) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    return i + 1;
  }
  
  sort(result, 0, result.length - 1);
  
  return {
    result,
    runtimeMs: performance.now() - start,
    comparisons
  };
}
