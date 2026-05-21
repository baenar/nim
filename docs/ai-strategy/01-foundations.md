# Game Theory Foundations

To build an invincible AI for the **Impartial Variant** of DraftSubtraction, we rely on the core principles of Combinatorial Game Theory, specifically the Sprague-Grundy Theorem.

## 1. Progressively Bounded Graphs
DraftSubtraction can be modeled as a directed graph where every node is a game state and every directed edge is a legal move. 

Crucially, our game is played on a **progressively bounded graph**. Because the draft pool $P$ is finite, the draft size $k$ is fixed, and tokens are strictly removed during the subtraction phase, there are no infinite loops or cycles. Every possible match has a strictly finite maximum number of moves. This guarantees that every position in the game can be evaluated definitively without infinite paradoxes.

## 2. P-States and N-States
Every position in the game resolves into one of two states:
* **P-state (Previous player winning):** A losing position for the player whose turn it is. If the AI is handed a P-state, it will lose if the opponent plays perfectly.
* **N-state (Next player winning):** A winning position for the player whose turn it is. If the AI is handed an N-state, it is mathematically guaranteed to have at least one move that hands a P-state back to the opponent.

## 3. The Sprague-Grundy Function & Minimal Excludant (Mex)
To calculate whether a state is a P-state or an N-state, we use the Sprague-Grundy function, $g(x)$. 

The value of a state is the **Minimal Excludant (mex)** of the values of all states that can be reached in a single legal move:
$$g(x) = \text{mex}({g(y) : y \in \text{Followers}(x)})$$

*The `mex` is the smallest non-negative integer $\{0, 1, 2, \dots\}$ that is missing from the set.*

### The Logic of the Trap
* **Terminal States:** If there are no legal moves, the set of followers is empty. $g(x) = \text{mex}(\emptyset) = 0$. Since having no moves means you lose, **0 is the ultimate losing value**.
* **Evaluating to 0 (P-State):** If $g(x) = 0$, it means `0` is missing from the set of reachable states. Therefore, any move the player makes will force them to hand a state $>0$ to their opponent.
* **Evaluating to >0 (N-State):** If $g(x) > 0$, it means `0` *is* present in the set of reachable states. The winning strategy is always to find the move that leads to the state where $g(y) = 0$, trapping the opponent.