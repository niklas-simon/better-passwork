import { useEffect, useState } from "react";

export default function useMonostable(delay: number): [boolean, () => void] {
    const [v, set] = useState(false);

    useEffect(() => {
        if (v) {
            const t = setTimeout(() => {
                set(false);
            }, delay);

            return () => clearTimeout(t);
        }
    }, [v]);

    return [v, () => set(true)];
}