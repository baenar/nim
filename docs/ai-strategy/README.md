# DraftSubtraction AI Strategy & Architecture

This section of the documentation details the mathematical foundation and algorithmic architecture of the DraftSubtraction AI bot. 

Because DraftSubtraction is a finite, deterministic game with perfect information played under the normal play convention, it can be perfectly solved. The AI does not rely on heuristics or machine learning; instead, it uses **Combinatorial Game Theory (CGT)** to mathematically guarantee optimal play.

## AI Architecture Overview

The AI evaluates the game differently depending on the current phase:

1. **[The Subtraction Phase](02-subtraction-phase.md):** Once the draft is complete and the subtraction set $S$ is locked, the game becomes a linear subtraction game. The AI calculates the Sprague-Grundy values to find repeating periodic patterns (P-states and N-states), allowing it to evaluate any heap size $N$ in $O(1)$ time.
2. **[The Draft Phase](03-draft-phase.md):** During the draft, the game state is a combinatorial combination of drafted numbers. The AI uses **Memoized Depth-First Search (DFS)** with an **Early Exit** optimization to traverse the state tree, evaluating draft choices based on the periodic outcomes of the resulting subtraction phases.

## Table of Contents
1. [Game Theory Foundations (Sprague-Grundy, P/N States)](01-foundations.md)
2. [Subtraction Phase Algorithm (Periodicity)](02-subtraction-phase.md)
3. [Draft Phase Algorithm (DFS & Pruning)](03-draft-phase.md)