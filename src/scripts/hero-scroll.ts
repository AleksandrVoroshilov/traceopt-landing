// Hero scroll- and hover-tied behavior for the SVG overlay:
//   • .hero-stub shrinks right→left as the pin wrapper scrolls
//   • .layer-main Group 2 path draws left→right via stroke-dashoffset
//   • Hovering near a group adds .active to it (nearest-group sampling, same
//     algorithm as tasks/hero-svg-test.html)

export function initHeroScroll(): void {
    const wrap = document.querySelector<HTMLElement>(".hero-pin-wrap");
    const stub = document.querySelector<HTMLElement>(".hero-stub");
    const svg = document.querySelector<SVGSVGElement>("#hero-svg-overlay");
    const animatedPath = document.querySelector<SVGPathElement>(
        "#hero-svg-overlay .layer-main path.animated",
    );
    if (!wrap || !animatedPath) return;

    const isMobile = window.matchMedia("(max-width: 1000px)").matches;
    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

    if (isMobile || reduceMotion) {
        if (stub) stub.style.setProperty("--stub-progress", "0");
        animatedPath.setAttribute("stroke-dashoffset", "0");
        return;
    }

    // -------- Scroll-tied draw + stub shrink --------
    // Animation maps to the first 80% of the pin range; the remaining 20%
    // is a "hold" — line stays drawn, section stays pinned, then unpins.
    // Progress is anchored to window.scrollY relative to the wrap's natural
    // position. Using scrollY directly (not rect.top) avoids sub-pixel jitter
    // from sticky engagement and the -1px pre-engage margin on the wrap.
    const HOLD_END_RATIO = 0.2;
    const navH =
        parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue(
                "--nav-h",
            ),
        ) || 60;
    const section = wrap.querySelector<HTMLElement>("section.hero");

    const computeStickyStartY = () => {
        // The scrollY value at which the section first becomes sticky-pinned.
        // For our layout (wrap right after sticky nav, with -1px pre-engage),
        // this is essentially 0. Computing it makes the script resilient if
        // the wrap is ever moved further down the page.
        const wrapDocTop = wrap.getBoundingClientRect().top + window.scrollY;
        return Math.max(0, wrapDocTop - navH);
    };
    let stickyStartY = computeStickyStartY();

    const updateScroll = () => {
        const pinRange = section
            ? wrap.offsetHeight - section.offsetHeight
            : wrap.offsetHeight - window.innerHeight;
        const animRange = Math.max(1, pinRange * (1 - HOLD_END_RATIO));
        const scrolled = Math.max(0, window.scrollY - stickyStartY);
        let progress = scrolled / animRange;
        progress = Math.max(0, Math.min(1, progress));

        if (stub) {
            stub.style.setProperty("--stub-progress", String(1 - progress));
        }
        // Drives the scroll-hint fade (CSS reads --hero-progress).
        if (section) {
            section.style.setProperty("--hero-progress", String(progress));
        }
        animatedPath.setAttribute(
            "stroke-dashoffset",
            String(1000 * (1 - progress)),
        );
        animatedPath.classList.toggle("boosted", progress > 0.92);
        // Pulse highlight only while computing (mid-draw); static at idle states.
        if (svg) svg.classList.toggle("computing", progress > 0 && progress < 1);
    };

    const onResize = () => {
        stickyStartY = computeStickyStartY();
        updateScroll();
    };

    let scrollPending = false;
    const onScroll = () => {
        if (!scrollPending) {
            requestAnimationFrame(() => {
                updateScroll();
                scrollPending = false;
            });
            scrollPending = true;
        }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    updateScroll();

    // -------- Hover-nearest-group highlight --------
    // Sniff pointer position from the wrap (SVG itself is pointer-events:none
    // so the canvas keeps receiving its own pointer events for mouse repulsion).
    if (!svg) return;

    const groups = Array.from(
        svg.querySelectorAll<SVGGElement>(".layer-main g[data-group]"),
    );
    if (!groups.length) return;

    // Precompute sample points for every path in every group, in viewBox coords.
    // Animated merged path of Group 2 contributes its full geometry — hover
    // works even when the orange portion is partially drawn.
    type Sample = { x: number; y: number };
    const groupSamples: Sample[][] = groups.map((g) => {
        const samples: Sample[] = [];
        const paths = g.querySelectorAll<SVGPathElement>("path");
        paths.forEach((p) => {
            const total = p.getTotalLength();
            for (let i = 0; i <= 8; i++) {
                const pt = p.getPointAtLength((total / 8) * i);
                samples.push({ x: pt.x, y: pt.y });
            }
        });
        return samples;
    });

    let activeGroup: SVGGElement | null = null;
    let mouseX = -9999;
    let mouseY = -9999;
    let hoverPending = false;

    const evaluateHover = () => {
        if (mouseX < -1000) {
            if (activeGroup) {
                activeGroup.classList.remove("active");
                activeGroup = null;
            }
            return;
        }
        let bestGroup: SVGGElement | null = null;
        let bestDist = Infinity;
        for (let g = 0; g < groups.length; g++) {
            const samples = groupSamples[g];
            let groupMin = Infinity;
            for (let i = 0; i < samples.length; i++) {
                const dx = mouseX - samples[i].x;
                const dy = mouseY - samples[i].y;
                const d = dx * dx + dy * dy;
                if (d < groupMin) groupMin = d;
            }
            if (groupMin < bestDist) {
                bestDist = groupMin;
                bestGroup = groups[g];
            }
        }
        if (bestGroup && bestGroup !== activeGroup) {
            if (activeGroup) activeGroup.classList.remove("active");
            bestGroup.classList.add("active");
            activeGroup = bestGroup;
        }
    };

    const onPointerMove = (e: PointerEvent) => {
        const rect = svg.getBoundingClientRect();
        // Convert client coords → viewBox (0..1024) coords, accounting for
        // xMidYMid meet letterboxing (square SVG inside non-square container).
        const vbSize = 1024;
        const cAspect = rect.width / rect.height;
        let scale: number, ox: number, oy: number;
        if (cAspect > 1) {
            scale = rect.height;
            ox = (rect.width - scale) / 2;
            oy = 0;
        } else {
            scale = rect.width;
            ox = 0;
            oy = (rect.height - scale) / 2;
        }
        const lx = e.clientX - rect.left - ox;
        const ly = e.clientY - rect.top - oy;
        mouseX = (lx / scale) * vbSize;
        mouseY = (ly / scale) * vbSize;

        if (!hoverPending) {
            requestAnimationFrame(() => {
                evaluateHover();
                hoverPending = false;
            });
            hoverPending = true;
        }
    };

    const onPointerLeave = () => {
        mouseX = -9999;
        mouseY = -9999;
        if (activeGroup) {
            activeGroup.classList.remove("active");
            activeGroup = null;
        }
    };

    wrap.addEventListener("pointermove", onPointerMove, { passive: true });
    wrap.addEventListener("pointerleave", onPointerLeave, { passive: true });
}
