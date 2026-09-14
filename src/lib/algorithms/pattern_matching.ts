import { AlgorithmResult } from '../types';

export interface MatchResult {
  matches: number[]; // starting indices of matches in the text
}

export function naiveSearch(text: string, pattern: string): AlgorithmResult<MatchResult> {
    const start = performance.now();
    let comparisons = 0;
    const matches: number[] = [];
    
    const n = text.length;
    const m = pattern.length;
    
    if (m === 0) return { result: { matches }, runtimeMs: performance.now() - start, comparisons: 0 };
    
    for (let i = 0; i <= n - m; i++) {
        let j = 0;
        while (j < m) {
            comparisons++;
            if (text[i + j] !== pattern[j]) {
                break;
            }
            j++;
        }
        if (j === m) {
            matches.push(i);
        }
    }
    
    return {
        result: { matches },
        runtimeMs: performance.now() - start,
        comparisons
    };
}

export function buildKMPTable(pattern: string): number[] {
    const m = pattern.length;
    const lps = new Array(m).fill(0);
    let len = 0;
    let i = 1;
    while (i < m) {
        if (pattern[i] === pattern[len]) {
            len++;
            lps[i] = len;
            i++;
        } else {
            if (len !== 0) {
                len = lps[len - 1];
            } else {
                lps[i] = 0;
                i++;
            }
        }
    }
    return lps;
}

export function kmpSearch(text: string, pattern: string): AlgorithmResult<MatchResult> {
    const start = performance.now();
    let comparisons = 0;
    const matches: number[] = [];
    
    const n = text.length;
    const m = pattern.length;
    
    if (m === 0) return { result: { matches }, runtimeMs: performance.now() - start, comparisons: 0 };
    
    // Compute LPS array
    const lps = buildKMPTable(pattern);
    
    let i = 0;
    let j = 0;
    while (i < n) {
        comparisons++;
        if (pattern[j] === text[i]) {
            j++;
            i++;
        }
        if (j === m) {
            matches.push(i - j);
            j = lps[j - 1];
        } else if (i < n && pattern[j] !== text[i]) {
            if (j !== 0) {
                j = lps[j - 1];
            } else {
                i++;
            }
        }
    }
    
    return {
        result: { matches },
        runtimeMs: performance.now() - start,
        comparisons
    };
}

export function rabinKarpSearch(text: string, pattern: string): AlgorithmResult<MatchResult> {
    const start = performance.now();
    let comparisons = 0;
    const matches: number[] = [];
    
    const n = text.length;
    const m = pattern.length;
    
    if (m === 0) return { result: { matches }, runtimeMs: performance.now() - start, comparisons: 0 };
    
    const d = 256;
    const q = 101; // prime
    
    let p = 0;
    let t = 0;
    let h = 1;
    
    for (let i = 0; i < m - 1; i++) {
        h = (h * d) % q;
    }
    
    for (let i = 0; i < m; i++) {
        p = (d * p + pattern.charCodeAt(i)) % q;
        t = (d * t + text.charCodeAt(i)) % q;
    }
    
    for (let i = 0; i <= n - m; i++) {
        if (p === t) {
            let j = 0;
            for (j = 0; j < m; j++) {
                comparisons++;
                if (text[i + j] !== pattern[j]) {
                    break;
                }
            }
            if (j === m) {
                matches.push(i);
            }
        } else {
            comparisons++; // checking hashes
        }
        
        if (i < n - m) {
            t = (d * (t - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % q;
            if (t < 0) {
                t = t + q;
            }
        }
    }
    
    return {
        result: { matches },
        runtimeMs: performance.now() - start,
        comparisons
    };
}
