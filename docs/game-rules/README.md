# DraftSubtraction game 

DraftSubtraction is a simple two-phase game, which is based on the classic game of subtraction. 

## List of contents

1. [Impartial variant (shared draft)](impartial-variant.md)
2. [Partisan variant (separate drafts)](partisan-variant.md)

## Global Starting Parameters

Every match of DraftSubtraction, regardless of the variant, is defined at the start of the game by 3 global parameters configured in the game settings:

| Parameter | Description | Example Value |
| --- | --- | --- |
| $N$ | The initial number of tokens on the heap. | 37 |
| $k$ | The size of the subtraction set, i.e., the number of different moves available to the players. | 3 |
| $P$ | The pool of allowable numbers available for selection during the draft phase, where $P = \{1, 2, \dots, \lfloor 0.4N \rfloor\}$ | {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15} |
---

## Game Phases

The game consists of two distinct phases:
1. **Draft Phase**. During this phase, players are forming the common subtraction set $S$ by selecting numbers from the pool $P$. The size of the subtraction set is determined by the parameter $k$, which is configured at the start of the game. 
2. **Subtraction Phase** (main phase). During this phase, players make moves one after another by subtracting a chosen number of tokens from the heap, where the number of tokens to be subtracted must be an element of the subtraction set $S$ formed during the draft phase. The game continues until one player cannot make a valid move on their turn, at which point that player loses and the other player wins.

## General information

* The game is played under **perfect information** and is **deterministic** (no hidden moves, no chance elements, no hidden states).
* The game follows the **normal play convention**, where the player who makes the last move **wins** and the player who cannot make a move on their turn **loses**.


The specific rules and mechanics of the draft phase, as well as the structure of the subtraction set, can vary between the impartial and partisan variants of the game, which are detailed in their respective sections.