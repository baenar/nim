# Partisan Draft Phase Algorithm

The Partisan draft phase relies on the same **Memoized Depth-First Search (DFS)** and **Early Exit (Alpha-Beta Pruning)** architecture detailed in the [Impartial Draft Phase](03-draft-phase.md). 

However, because the sets are segregated, the AI must act as a true **Negamax/Minimax** agent, alternating its perspective between Player 1 and Player 2 as it traverses down the tree.

## 1. Segregated State Space & Cache Configuration
In the impartial variant, the state was just `S`. In the partisan variant, a state is defined by three distinct properties. The transposition table (cache) key must strictly segregate these to prevent cache contamination:

`key = "{sorted(S1)} | {sorted(S2)} | {Turn}"`

*Failure to include `Turn` or mixing the sets will cause the AI to hallucinate, treating a path where P1 drafted '4' identically to a path where P2 drafted '4'.*

## 2. Terminal State Evaluation (Depth $2k$)
When $|S_1| = k$ and $|S_2| = k$, the draft is over. The AI runs the Boolean Tuple generator to evaluate the subtraction phase.
* Since $k$ is known, the AI knows exactly who starts the subtraction phase.
* If Player 1 makes the first subtraction move, the terminal node returns the value of `P1_Win[N]`.
* If Player 2 makes the first subtraction move, the terminal node returns the value of `P2_Win[N]`.

## 3. The Opponent Trap (Recursive Step)
The recursive function `evaluate_draft(S1, S2, Turn)` loops through all available numbers $p \in P \setminus (S_1 \cup S_2)$.

* **If it is Player 1's Turn:** It simulates picking $p$ by recursively calling `evaluate_draft(S1 + {p}, S2, Turn = 2)`.
* **If it is Player 2's Turn:** It simulates picking $p$ by recursively calling `evaluate_draft(S1, S2 + {p}, Turn = 1)`.

**The Evaluation Logic:**
Because the recursive call always evaluates the state from the *opponent's* perspective on the next turn, the AI is looking for a `False` return.
* If the recursive call returns `False` (meaning the opponent loses from that state), the AI has found a winning draft pick. It immediately caches `True` and executes the Early Exit.
* If every single choice $p$ returns `True` (meaning the opponent wins no matter what), the AI is mathematically trapped. It caches `False` and returns `False`.