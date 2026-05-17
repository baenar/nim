# Partisan variant (separate drafts)

**Partisan DraftSubtraction** is a variant of the DraftSubtraction game where each player forms their own **separate subtraction set** during the draft phase. This means that each player has access to the same pool of numbers but contributes to their own subtraction set $S_1$ and $S_2$ that will be used in the subtraction phase.

It's important to note, that in the partisan variant, the subtraction sets $S_1$ and $S_2$ are disjoint, meaning that no number can be selected by both players during the draft phase. Each player will have their own unique set of numbers that they can use during the subtraction phase. If a Player 1 selects $2$ from the pool $P$, Player 2 no longer can select $2$ for their subtraction set, and vice versa.

## Example of the draft phase

Assume, $N = 23$, $k = 3$ and $P = \{1, 2, 3, 4, 5, 6, 7, 8, 9\}$.

1. Player 1 selects the number 2 from the pool $P$ and adds it to their subtraction set $S_1$. Now, $S_1 = \{2\}$ and $P = \{1, 3, 4, 5, 6, 7, 8, 9\}$.
2. Player 2 selects the number 3 from the pool $P$ and adds it to their subtraction set $S_2$. Now, $S_2 = \{3\}$ and $P = \{1, 4, 5, 6, 7, 8, 9\}$.
3. Player 1 selects the number 5 from the pool $P$ and adds it to their subtraction set $S_1$. Now, $S_1 = \{2, 5\}$ and $P = \{1, 4, 6, 7, 8, 9\}$.
4. Player 2 selects the number 6 from the pool $P$ and adds it to their subtraction set $S_2$. Now, $S_2 = \{3, 6\}$ and $P = \{1, 4, 7, 8, 9\}$.
5. Player 1 selects the number 7 from the pool $P$ and adds it to their subtraction set $S_1$. Now, $S_1 = \{2, 5, 7\}$ and $P = \{1, 4, 8, 9\}$.
6. Player 2 selects the number 8 from the pool $P$ and adds it to their subtraction set $S_2$. Now, $S_2 = \{3, 6, 8\}$ and $P = \{1, 4, 9\}$.

The draft phase ends as both $S_1$ and $S_2$ have now reached the required size of $k = 3$. The subtraction phase will then proceed with the separate subtraction sets $S_1 = \{2, 5, 7\}$ for Player 1 and $S_2 = \{3, 6, 8\}$ for Player 2.

Note, that the draft will always end by Player 2, so the first move in the subtraction phase will always be made by Player 1.