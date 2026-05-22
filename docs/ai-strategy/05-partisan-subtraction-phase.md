# Partisan Subtraction Phase Algorithm

Once the draft phase concludes, $S_1$ and $S_2$ are locked. Just like the [Impartial Subtraction Phase](02-subtraction-phase.md), the AI leverages the **Pigeonhole Principle** to avoid calculating massive game trees, finding a repeating periodic loop in $O(1)$ lookup time. 

However, the mechanism for detecting the period is modified to handle two players.

## 1. The Partisan Memory Window
In the impartial game, the memory window $m$ was simply $\max(S)$. In the partisan game, a state depends on the cross-reference between both players' arrays. 

Therefore, the AI must track a memory window dictated by the largest move available on the entire board:
$$m = \max(S_1 \cup S_2)$$

## 2. Periodicity on Boolean Tuples
Instead of looking for a repeating sequence of integers, the AI must look for a repeating sequence of **boolean pairs** (tuples).

At each heap size $n$, the state is defined by the pair: `(P1_Win[n], P2_Win[n])`.
Because there are only 4 possible combinations for this pair `[(T,T), (T,F), (F,T), (F,F)]`, the number of unique sequences of length $m$ is strictly finite ($4^m$). By calculating the arrays linearly, the AI is mathematically guaranteed to eventually generate a block of $m$ pairs that perfectly matches a previously seen block.

## 3. Generating the Arrays
The AI runs a single `while` loop starting from $N=0$:
1. **Calculate P1:** Check `P2_Win[n - s]` for all $s \in S_1$. If any are `False`, `P1_Win[n] = True`. Else, `False`.
2. **Calculate P2:** Check `P1_Win[n - s]` for all $s \in S_2$. If any are `False`, `P2_Win[n] = True`. Else, `False`.
3. **Check Pattern:** Form a string/hash of the last $m$ pairs. If this exact string exists in the `windows` cache, the period is locked.

## 4. Execution
When asked for a move at a large heap size $N$:
* The AI uses modulo arithmetic on the period to find the exact pair `(P1_Win[N], P2_Win[N])`.
* If it is Player 1's turn, it loops through $s \in S_1$ to find the move that results in `P2_Win[N-s] == False`. 
* *(Note: If the current state evaluates to `False`, the AI is trapped and should execute a random valid move, known as Minimax Collapse).*