# Subtraction Phase Algorithm (Periodicity)

Once the draft phase ends, the subtraction set $S$ is locked. Because the game rules only allow subtracting numbers present in $S$, the Sprague-Grundy values for the heap $N$ become highly predictable. The AI exploits this to achieve $O(1)$ calculation times.

## The Memory Window
When calculating $g(N)$ for a specific heap size, the AI only needs to look back at the states resulting from valid subtractions: $N - s$ for all $s \in S$. 

Let $m = \max(S)$. To calculate any new state, the AI only ever needs to reference a **memory window** of the previous $m$ calculated values. 

## The Pigeonhole Principle & Periodicity
Because the maximum value a state can output is strictly bounded by the size of the subtraction set ($|S|$), the number of possible unique sequences of length $m$ is finite. 

By calculating the sequence linearly, the AI will eventually generate a block of $m$ numbers that exactly matches an $m$-length block it has already seen. By the **Pigeonhole Principle**, once an $m$-length memory window repeats perfectly, the entire sequence from that point onward is locked into an infinite loop.

### How the AI Evaluates $N$
Rather than running a massive recursive tree for a large heap like $N = 1,000,000$, the AI performs the following:
1. Calculates $g(x)$ linearly starting from $x=0$.
2. Tracks the memory window of size $m$.
3. Stops calculating the moment an $m$-length window repeats.
4. Identifies the **pre-period** (initial noise) and the **period** (the repeating block of values).
5. Uses modulo arithmetic to find the value of $N$:
   * If $N < \text{length}(\text{pre-period})$, return the value from the pre-period array.
   * Otherwise, `index = (N - length(pre-period)) % length(period)`. Return the value at `index` from the periodic array.

If the value is $>0$, the AI identifies which valid subtraction $s \in S$ results in a remainder with $g(N-s) = 0$, and executes that move.