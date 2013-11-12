# Benchmarks (12 Nov 2013)
Tests performed using [promises-benchmark](https://github.com/killdream/promises-benchmark).

```
  * "microPromise": "0.2.5"
  * "pinky": "~0.1.3"
  * "pinky-sync": "git://github.com/killdream/pinky.git#sync-then"
  * "when": "~2.1.1"
  * "deferred": "~0.6.5"
```

## Results

Note: this is only a rough performance comparison.

```
:: Benchmarks for: Serial (no noise)
›› microPromise x 33.38 ops/sec ±2.25% (80 runs sampled)
›› Pinky x 26.99 ops/sec ±1.60% (67 runs sampled)
›› Pinky (synchronous) x 34.76 ops/sec ±1.19% (83 runs sampled)
›› When x 32.11 ops/sec ±3.95% (58 runs sampled)
›› Deferred x 29.03 ops/sec ±2.80% (71 runs sampled)
--- 
Fastest: Pinky (synchronous), microPromise 
Slowest: Pinky

:: Benchmarks for: Serial (some noise)
›› microPromise x 30.89 ops/sec ±2.52% (75 runs sampled)
›› Pinky x 24.11 ops/sec ±1.28% (61 runs sampled)
›› Pinky (synchronous) x 31.11 ops/sec ±1.33% (75 runs sampled)
›› When x 29.70 ops/sec ±3.35% (53 runs sampled)
›› Deferred x 27.39 ops/sec ±2.88% (67 runs sampled)
--- 
Fastest: Pinky (synchronous), microPromise, When 
Slowest: Pinky

:: Benchmarks for: Serial (noisy)
›› microPromise x 28.59 ops/sec ±3.05% (70 runs sampled)
›› Pinky x 21.84 ops/sec ±0.65% (56 runs sampled)
›› Pinky (synchronous) x 28.11 ops/sec ±1.62% (69 runs sampled)
›› When x 27.47 ops/sec ±4.29% (68 runs sampled)
›› Deferred x 25.69 ops/sec ±2.89% (64 runs sampled)
--- 
Fastest: microPromise, When 
Slowest: Pinky

:: Benchmarks for: Serial (mostly noise)
›› microPromise x 23.17 ops/sec ±3.25% (58 runs sampled)
›› Pinky x 15.41 ops/sec ±1.72% (76 runs sampled)
›› Pinky (synchronous) x 20.17 ops/sec ±2.24% (52 runs sampled)
›› When x 20.54 ops/sec ±2.65% (53 runs sampled)
›› Deferred x 20.12 ops/sec ±3.34% (52 runs sampled)
--- 
Fastest: microPromise 
Slowest: Pinky
node scenarios/light-serial/index.js

:: Benchmarks for: Lightweight serial (no noise)
›› microPromise x 56.54 ops/sec ±2.31% (70 runs sampled)
›› Pinky x 42.08 ops/sec ±1.69% (70 runs sampled)
›› Pinky (synchronous) x 52.33 ops/sec ±1.30% (83 runs sampled)
›› When x 54.08 ops/sec ±4.09% (67 runs sampled)
›› Deferred x 52.86 ops/sec ±3.45% (66 runs sampled)
--- 
Fastest: microPromise, When 
Slowest: Pinky

:: Benchmarks for: Lightweight serial (some noise)
›› microPromise x 50.29 ops/sec ±2.95% (81 runs sampled)
›› Pinky x 35.35 ops/sec ±1.20% (84 runs sampled)
›› Pinky (synchronous) x 44.84 ops/sec ±1.29% (73 runs sampled)
›› When x 48.09 ops/sec ±3.51% (61 runs sampled)
›› Deferred x 47.16 ops/sec ±2.94% (77 runs sampled)
--- 
Fastest: microPromise 
Slowest: Pinky

:: Benchmarks for: Lightweight serial (noisy)
›› microPromise x 45.77 ops/sec ±3.28% (75 runs sampled)
›› Pinky x 30.80 ops/sec ±1.14% (75 runs sampled)
›› Pinky (synchronous) x 39.19 ops/sec ±1.44% (65 runs sampled)
›› When x 42.11 ops/sec ±4.01% (69 runs sampled)
›› Deferred x 41.91 ops/sec ±3.16% (69 runs sampled)
--- 
Fastest: microPromise 
Slowest: Pinky

:: Benchmarks for: Lightweight serial (mostly noise)
›› microPromise x 32.54 ops/sec ±2.98% (79 runs sampled)
›› Pinky x 19.62 ops/sec ±2.09% (51 runs sampled)
›› Pinky (synchronous) x 25.30 ops/sec ±1.65% (63 runs sampled)
›› When x 27.80 ops/sec ±4.91% (68 runs sampled)
›› Deferred x 29.54 ops/sec ±3.09% (72 runs sampled)
--- 
Fastest: microPromise 
Slowest: Pinky
node scenarios/parallel/index.js

:: Benchmarks for: Parallelism (no cache)
›› microPromise x 103 ops/sec ±1.79% (81 runs sampled)
›› Pinky x 101 ops/sec ±0.63% (80 runs sampled)
›› Pinky (synchronous) x 99.92 ops/sec ±0.64% (80 runs sampled)
›› When x 105 ops/sec ±3.01% (83 runs sampled)
›› Deferred x 85.40 ops/sec ±2.33% (82 runs sampled)
--- 
Fastest: When 
Slowest: Deferred

:: Benchmarks for: Parallelism (small cache)
›› microPromise x 110 ops/sec ±2.02% (77 runs sampled)
›› Pinky x 106 ops/sec ±1.07% (85 runs sampled)
›› Pinky (synchronous) x 108 ops/sec ±0.63% (85 runs sampled)
›› When x 111 ops/sec ±3.23% (77 runs sampled)
›› Deferred x 90.90 ops/sec ±2.39% (74 runs sampled)
--- 
Fastest: microPromise 
Slowest: Deferred

:: Benchmarks for: Parallelism (big cache)
›› microPromise x 179 ops/sec ±2.18% (73 runs sampled)
›› Pinky x 164 ops/sec ±0.90% (86 runs sampled)
›› Pinky (synchronous) x 174 ops/sec ±0.73% (83 runs sampled)
›› When x 181 ops/sec ±3.78% (79 runs sampled)
›› Deferred x 140 ops/sec ±2.39% (83 runs sampled)
--- 
Fastest: microPromise, When 
Slowest: Deferred

:: Benchmarks for: Parallelism (fully cached)
›› microPromise x 347 ops/sec ±2.41% (68 runs sampled)
›› Pinky x 297 ops/sec ±0.55% (79 runs sampled)
›› Pinky (synchronous) x 342 ops/sec ±0.88% (67 runs sampled)
›› When x 365 ops/sec ±2.76% (52 runs sampled)
›› Deferred x 248 ops/sec ±3.13% (80 runs sampled)
--- 
Fastest: When, microPromise 
Slowest: Deferred
```
