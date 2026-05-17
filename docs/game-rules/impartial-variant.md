# Impartial variant (shared draft)

**Impartial DraftSubtraction** is a variant of the DraftSubtraction game where both players form a **shared subtraction set** during the draft phase. This means that both players have access to the same pool of numbers and contribute to the same subtraction set $S$ that will be used in the subtraction phase.

## Example of the draft phase

Assume, $N = 15$, $k = 3$ and $P = \{1, 2, 3, 4, 5, 6\}$.

1. Player 1 selects the number 2 from the pool $P$ and adds it to the subtraction set $S$. Now, $S = \{2\}$.
2. Player 2 selects the number 3 from the pool $P$ and adds it to the subtraction set $S$. Now, $S = \{2, 3\}$.
3. Player 1 selects the number 5 from the pool $P$ and adds it to the subtraction set $S$. Now, $S = \{2, 3, 5\}$.
   
The draft phase ends as $S$ has now reached the required size of $k = 3$. The subtraction phase will then proceed with the common subtraction set $S = \{2, 3, 5\}$.

As the draft phase finished by a move of Player 1, the first move in the subtraction phase will be made by Player 2. 