# Draft Phase Algorithm

The draft phase operates on a combinatorial state space rather than a linear number line. Because of this, we cannot use periodicity. However, because the pool of available numbers $P$ is strictly bounded by $P = \lfloor 0.4N \rfloor$, the total number of possible draft combinations is small enough to be fully explored.

The AI solves this phase perfectly using **Memoized Depth-First Search (DFS)** coupled with **Early Exit (Alpha-Beta Pruning)**.

## 1. The State Space
A state in the draft phase is defined entirely by the current subset of drafted numbers: $S_{cur}$. 
* **Terminal States (Depth $k$):** When $|S_{cur}| = k$, the draft is over. The AI passes $S_{cur}$ to the Subtraction Phase Algorithm. If the subtraction phase evaluates to a Win for the player whose turn it is to subtract, this terminal draft state is marked `True` (Win). Otherwise, `False` (Loss).
* **Intermediate States (Depth $< k$):** The current player must choose a number $p \in P \setminus S_{cur}$. 

## 2. Early Exit (Alpha-Beta Pruning)
The AI evaluates a draft state by looping through all valid choices $p$. For each choice, it checks what the outcome will be for the *opponent* who inherits the new state $S_{cur} \cup \{p\}$.

**The Optimization:**
Because the AI only needs *one* winning move, it does not need to calculate every branch of the tree. 
* The exact millisecond the AI finds a choice $p$ that results in a **Loss (`False`)** for the opponent, it immediately stops evaluating the remaining numbers in the pool. It marks the current state as a **Win (`True`)**, saves it to the transposition table (memoization cache), and returns it.
* A state is only declared a **Loss (`False`)** if the AI is forced to exhaust every single possible choice and finds that they all lead to a Win for the opponent.

## 3. Bot Execution
When it is the AI's turn to draft:
1. It analyzes the current draft subset $S_{cur}$.
2. It loops through the remaining pool options.
3. It recursively asks: *"If I pick $p$, does the resulting state lead to a Loss for my opponent?"*
4. It executes the first choice that guarantees an opponent loss. If no such choice exists (it is trapped in a P-state), it executes a random legal move, as perfect play from the opponent will mathematically guarantee an AI loss regardless.