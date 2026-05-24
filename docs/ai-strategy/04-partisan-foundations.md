# Partisan Foundations: Why Sprague-Grundy Fails

While the Impartial variant is solved using the [Sprague-Grundy Theorem](01-foundations.md), the Partisan variant requires a fundamental shift in game theory architecture. 

## 1. The Collapse of the SG Function
The Sprague-Grundy function, $g(x)$, and the Minimal Excludant (`mex`) mathematically rely on the fact that a game is **impartial** — meaning both players have the exact same valid moves from any given position. 

In Partisan DraftSubtraction, Player 1 subtracts from $S_1$ and Player 2 subtracts from $S_2$. Because the options are disjoint ($S_1 \cap S_2 = \emptyset$), the game tree fractures. You cannot assign a single objective integer $g(x)$ to a heap size $N$ because the value of the state depends entirely on whose turn it is. 

## 2. The Solution: Mutually Recursive Boolean Arrays
To replace the SG function, the AI must evaluate the game from two separate perspectives simultaneously. Instead of calculating one array of integers, the AI calculates **two parallel arrays of booleans**:

* `P1_Win[N]`: `True` if Player 1 has a mathematically guaranteed win from heap size $N$ when it is **Player 1's turn to move**.
* `P2_Win[N]`: `True` if Player 2 has a mathematically guaranteed win from heap size $N$ when it is **Player 2's turn to move**.

## 3. The Logic of the Partisan Trap
In the Impartial variant, a player wins by finding a move that hands the opponent a $0$-state. In the Partisan variant, a player wins by finding a move that hands the opponent a `False` state in their respective array.

* `P1_Win[N] = True` **IF** there exists at least one $s \in S_1$ such that `P2_Win[N - s] == False`.
* `P2_Win[N] = True` **IF** there exists at least one $s \in S_2$ such that `P1_Win[N - s] == False`.

If a player has no moves, or if all their valid moves hand the opponent a `True` state, their current state evaluates to `False` (they are trapped).