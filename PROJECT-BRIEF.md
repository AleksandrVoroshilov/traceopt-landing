# Traceopt — Project Brief

## What is Traceopt

**Traceopt** is an engineering-as-a-service solution for **optimal heat-tracer routing** in process piping networks.

We help process, piping and EPC companies dramatically reduce time and material costs when designing heat tracing systems (thermal tracers / heat tracing circuits) for industrial plants.

## The Problem

- Up to **40%** of process piping may require heat tracing depending on climate and process requirements.
- **10–15%** of a piping designer’s total effort goes into heat tracing design.
- **80%** of that effort is spent manually routing tracers in 3D models.
- Optimal tracer routing is an **NP-hard** arc-routing problem.

Manual routing is extremely time-consuming and rarely optimal in terms of material usage.

## Our Solution

Instead of another CAD plugin, Traceopt is a **professional engineering service** powered by custom optimization algorithms:

- **Input**: PCF files or 3D model export
- **Output**: Optimal tracer polylines (x, y, z) + BOM-ready data

**Key benefits**:
- Minutes instead of weeks/months
- Significantly reduced tracer length and material consumption
- Deterministic + high-quality results (RPS-ER solver + ALNS metaheuristic)

## How it works (high-level)

1. Client sends piping data + tracing brief
2. We import → build graph → contract chains → solve with proprietary arc-routing solver
3. Return optimized circuits and documentation

**First project is a free pilot.** No CAD plugin, no onboarding — you send a brief, we return a solved result.

## Technology (for engineers)

- Graph contraction + custom RPS-ER solver
- Adaptive Large Neighborhood Search (ALNS)
- Built by process engineers + optimization researchers

---

**Status**: Landing page redesign in progress (Astro)
**Repository**: https://github.com/AleksandrVoroshilov/traceopt-landing

Built for serious industrial projects.
