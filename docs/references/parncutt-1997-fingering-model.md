# Parncutt et al. (1997): fingering model reference

Source: R. Parncutt, J. A. Sloboda, E. F. Clarke, M. Raekallio & P. Desain,
"An Ergonomic Model of Keyboard Fingering for Melodic Fragments",
*Music Perception* 14(4), 1997, pp. 341–382.
PDF: https://static.uni-graz.at/fileadmin/_Persoenliche_Webseite/parncutt_richard/Pdfs/PaSlClRaDe97_FingeringModel.pdf

This file summarises the parts of the paper that `src/fingering/parncutt.ts` implements. The table
values are transcribed from Table 1 (p. 346). The rules are paraphrased from pp. 349–357. Check
against the paper before changing anything.

## Table 1: right-hand spans in semitones (p. 346)

For each pair `f-g`, `f` is the finger on the first note and `g` the finger on the second note.
Positive values are rising intervals and negative values falling ones. Negative entries mean the
fingers pass over the thumb, or the thumb passes under the fingers.

| Pair | MinPrac | MinComf | MinRel | MaxRel | MaxComf | MaxPrac |
|------|--------:|--------:|-------:|-------:|--------:|--------:|
| 1-2  | -5 | -3 | 1 | 5  | 8  | 10 |
| 1-3  | -4 | -2 | 3 | 7  | 10 | 12 |
| 1-4  | -3 | -1 | 5 | 9  | 12 | 14 |
| 1-5  | -1 | 1  | 7 | 10 | 13 | 15 |
| 2-3  | 1  | 1  | 1 | 2  | 3  | 5  |
| 2-4  | 1  | 1  | 3 | 4  | 5  | 7  |
| 2-5  | 2  | 2  | 5 | 6  | 8  | 10 |
| 3-4  | 1  | 1  | 1 | 2  | 2  | 4  |
| 3-5  | 1  | 1  | 3 | 4  | 5  | 7  |
| 4-5  | 1  | 1  | 1 | 2  | 3  | 5  |

- **Reverse pairs** (`g-f`, the higher-numbered finger first): change the sign of every value and
  swap Min and Max. For example, MaxPrac for 2-1 is 5 (p. 346).
- **Same finger on two different notes:** the model doesn't allow this (p. 346, Appendix).
- **Smaller hands:** the paper notes that Table 1 could be adjusted for smaller hands by
  multiplying all values by about 0.9 (p. 345). This app doesn't do that. It adds its own
  small-hand rule instead (see the plan, Task 4).

## The 12 rules (pp. 349–357), paraphrased

"Thumb pair" means a finger pair that includes finger 1. Intervals are in semitones, from the
first note to the second.

**Rules on two consecutive notes:**

1. **Stretch:** 2 points per semitone that the interval is above MaxComf or below MinComf.
2. **Small-Span:** for each semitone that the interval is below MinRel, 1 point for a thumb pair
   and 2 points for any other pair.
3. **Large-Span:** for each semitone that the interval is above MaxRel, 1 point for a thumb pair
   and 2 points for any other pair.

**Rules on three consecutive notes (first, second, third):**

4. **Position-Change-Count:** a change of hand position happens when the interval from the
   first to the third note is above MaxComf or below MinComf for the first and third fingers.
   - A *full* change scores 2 points. It needs all of these: the second note is played by the
     thumb, the second pitch lies between the first and third, and the first-to-third interval
     is above MaxPrac or below MinPrac.
   - Any other change is a *half* change and scores 1 point.
5. **Position-Change-Size:** compare the first-to-third interval with MinComf and MaxComf for
   the first and third fingers. Below MinComf, add the shortfall in semitones. Above MaxComf,
   add the excess in semitones.

**Rules on single fingers and finger patterns:**

6. **Weak-Finger:** 1 point each time finger 4 or 5 is used.
7. **Three-Four-Five:** 1 point each time fingers 3, 4 and 5 occur on three consecutive notes,
   in any order. Overlapping groups count separately.
8. **Three-to-Four:** 1 point each time finger 3 is immediately followed by finger 4.
9. **Four-on-Black:** 1 point each time fingers 3 and 4 are consecutive (in either order) with
   finger 3 on a white key and finger 4 on a black key.

**Rules on black keys (the notes just before and after matter):**

10. **Thumb-on-Black:** when the thumb plays a black key, 1 point. Add 2 more if the note just
    before is white, and 2 more if the note just after is white.
11. **Five-on-Black:** when finger 5 plays a black key, 0 points if the notes just before and
    after are both black. Otherwise add 2 if the note just before is white, and 2 if the note
    just after is white.
12. **Thumb-Passing:** 1 point for each thumb or finger pass between keys at the same level
    (white to white, or black to black). 3 points when the lower note is white and played by a
    finger, and the upper note is black and played by the thumb.
