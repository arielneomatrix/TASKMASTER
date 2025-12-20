/**
 * A pure JavaScript implementation of SHA-256 for environments where crypto.subtle is unavailable (e.g. insecure contexts).
 * Adapted for TypeScript.
 */

export async function sha256Polyfill(ascii: string): Promise<string> {
    function rightRotate(value: number, amount: number) {
        return (value >>> amount) | (value << (32 - amount));
    }

    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    const lengthProperty = 'length'
    let i, j; // Used as a counter across the whole file
    let result = ''

    const words: number[] = [];
    const asciiBitLength = ascii[lengthProperty] * 8;

    //* caching results is optional - remove/add slash from front of this line to toggle
    //0x80000000 | 0
    let hash = (sha256Polyfill as any).h = (sha256Polyfill as any).h || [];
    // Round constants: first 32 bits of the fractional parts of the cube roots of the first 64 primes
    const k = (sha256Polyfill as any).k = (sha256Polyfill as any).k || [];
    let primeCounter = k[lengthProperty];
    /*/
    const hash = [], k = [];
    const primeCounter = 0;
    //*/

    const isComposite: any = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
        if (!isComposite[candidate]) {
            for (i = 0; i < 313; i += candidate) {
                isComposite[i] = candidate;
            }
            hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
            k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
        }
    }

    ascii += '\x80' // Append Ƈ' bit (plus zero padding)
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00' // More zero padding
    for (i = 0; i < ascii[lengthProperty]; i++) {
        j = ascii.charCodeAt(i);
        if (j >> 8) return ''; // ASCII check: only support ASCII characters
        words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiBitLength)

    // process each chunk
    for (j = 0; j < words[lengthProperty];) {
        const w = words.slice(j, j += 16); // The message is expanded into 64 words as part of the iteration
        const oldHash = hash;
        // This is now the "working hash", often labelled as variables a...h
        // (we have to copy the array because the algorithm is "destructive")
        hash = hash.slice(0, 8);

        for (i = 0; i < 64; i++) {
            // Expand the message into 64 words
            // W[t] = \u03c31(W[t-2])     + W[t-7] + \u03c30(W[t-15])   + W[t-16];
            const w15 = w[i - 15], w2 = w[i - 2];

            // Iterate
            const a = hash[0], e = hash[4];
            const temp1 = hash[7]
                + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) // S1
                + ((e & hash[5]) ^ ((~e) & hash[6])) // ch
                + k[i]
                // Expand the message schedule if needed
                + (w[i] = (i < 16) ? w[i] : (
                    w[i - 16]
                    + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) // s0
                    + w[i - 7]
                    + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10)) // s1
                ) | 0
                );
            // This is only used once, so *could* be moved below, but it only saves 4 bytes and makes things unreadble
            const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) // S0
                + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2])); // maj

            hash = [(temp1 + temp2) | 0].concat(hash); // This is right!
            hash[4] = (hash[4] + temp1) | 0;
        }

        for (i = 0; i < 8; i++) {
            hash[i] = (hash[i] + oldHash[i]) | 0;
        }
    }

    for (i = 0; i < 8; i++) {
        for (j = 3; j + 1; j--) {
            const b = (hash[i] >> (j * 8)) & 255;
            result += ((b < 16) ? 0 : '') + b.toString(16);
        }
    }
    return result;
}
