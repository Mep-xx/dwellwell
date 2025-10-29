function toClassNames(input) {
    if (!input)
        return [];
    if (Array.isArray(input))
        return input.flatMap(toClassNames);
    if (typeof input === "object") {
        const out = [];
        for (const [k, v] of Object.entries(input))
            if (v)
                out.push(k);
        return out;
    }
    return [String(input)];
}
// Simple Tailwind-friendly join (no tailwind-merge dedup).
export function cn(...values) {
    return toClassNames(values).join(" ").trim().replace(/\s+/g, " ");
}
// Optional named export parity with some code that imports { clsx }:
export const clsx = cn;
