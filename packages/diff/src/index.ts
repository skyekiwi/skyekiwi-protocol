// Copyright 2021-2022 @skyekiwi/diff authors & contributors
// SPDX-License-Identifier: Apache-2.0

// ported from 'fast-diff' by "Jason Chen <jhchen7@gmail.com>"

/**
 * This library modifies the diff-patch-match library by Neil Fraser
 * by removing the patch and match functionality and certain advanced
 * options in the diff function. The original license is as follows:
 *
 * ===
 *
 * Diff Match and Patch
 *
 * Copyright 2006 Google Inc.
 * http://code.google.com/p/google-diff-match-patch/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { DiffOp } from './types';

import { hexToU8a, u8aToHex } from '@skyekiwi/util';

const DIFF_EQUAL = 0;
const DIFF_DELETE = -1;
const DIFF_INSERT = 1;

/* eslint-disable sort-keys, camelcase */
class Diff {
  public static diff (origin: Uint8Array, target: Uint8Array): DiffOp[] {
    // only pass fix_unicode=true at the top level, not when diff_main is
    // recursively invoked
    return this.diff_main(u8aToHex(origin), u8aToHex(target));
  }

  /**
  * Find the differences between two texts.  Simplifies the problem by stripping
  * any common prefix or suffix off the texts before diffing.
  * @param {string} text1 Old string to be diffed.
  * @param {string} text2 New string to be diffed.
  * @param {Int|Object} [cursor_pos] Edit position in text1 or object with more info
  * @return {Array} Array of diff tuples.
  */
  private static diff_main (text1: string, text2: string): DiffOp[] {
    // Check for equality
    if (text1 === text2) {
      if (text1) {
        return [[DIFF_EQUAL, text1]];
      }

      return [];
    }

    // Trim off common prefix (speedup).
    let commonlength = this.diff_commonPrefix(text1, text2);
    const commonprefix = text1.substring(0, commonlength);

    text1 = text1.substring(commonlength);
    text2 = text2.substring(commonlength);

    // Trim off common suffix (speedup).
    commonlength = this.diff_commonSuffix(text1, text2);
    const commonsuffix = text1.substring(text1.length - commonlength);

    text1 = text1.substring(0, text1.length - commonlength);
    text2 = text2.substring(0, text2.length - commonlength);

    // Compute the diff on the middle block.
    const diffs = this.diff_compute_(text1, text2);

    // Restore the prefix and suffix.
    if (commonprefix) {
      diffs.unshift([DIFF_EQUAL, commonprefix]);
    }

    if (commonsuffix) {
      diffs.push([DIFF_EQUAL, commonsuffix]);
    }

    this.diff_cleanupMerge(diffs);

    return diffs;
  }

  /**
  * Find the differences between two texts.  Assumes that the texts do not
  * have any common prefix or suffix.
  * @param {string} text1 Old string to be diffed.
  * @param {string} text2 New string to be diffed.
  * @return {Array} Array of diff tuples.
  */
  private static diff_compute_ (text1: string, text2: string): DiffOp[] {
    // Just add some text (speedup).
    if (!text1) return [[DIFF_INSERT, text2]];

    // Just delete some text (speedup).
    if (!text2) return [[DIFF_DELETE, text1]];

    let diffs: DiffOp[] = [];
    const longtext = text1.length > text2.length ? text1 : text2;
    const shorttext = text1.length > text2.length ? text2 : text1;
    const i = longtext.indexOf(shorttext);

    if (i !== -1) {
      // Shorter text is inside the longer text (speedup).
      diffs = [
        [DIFF_INSERT, longtext.substring(0, i)],
        [DIFF_EQUAL, shorttext],
        [DIFF_INSERT, longtext.substring(i + shorttext.length)]
      ];

      // Swap insertions for deletions if diff is reversed.
      if (text1.length > text2.length) {
        diffs[0][0] = diffs[2][0] = DIFF_DELETE;
      }

      return diffs;
    }

    if (shorttext.length === 1) {
      // Single character string.
      // After the previous speedup, the character can't be an equality.
      return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
    }

    // Check to see if the problem can be split in two.
    const hm = this.diff_halfMatch_(text1, text2);

    if (hm) {
      // A half-match was found, sort out the return data.
      const text1_a = hm[0];
      const text1_b = hm[1];
      const text2_a = hm[2];
      const text2_b = hm[3];
      const mid_common = hm[4];
      // Send both pairs off for separate processing.
      const diffs_a = this.diff_main(text1_a, text2_a);
      const diffs_b = this.diff_main(text1_b, text2_b);

      // Merge the results.
      return diffs_a.concat([[DIFF_EQUAL, mid_common]], diffs_b);
    }

    return this.diff_bisect_(text1, text2);
  }

  /**
  * Find the 'middle snake' of a diff, split the problem in two
  * and return the recursively constructed diff.
  * See Myers 1986 paper: An O(ND) Difference Algorithm and Its Variations.
  * @param {string} text1 Old string to be diffed.
  * @param {string} text2 New string to be diffed.
  * @return {Array} Array of diff tuples.
  * @private
  */
  private static diff_bisect_ (text1: string, text2: string): DiffOp[] {
    // Cache the text lengths to prevent multiple calls.
    const text1_length = text1.length;
    const text2_length = text2.length;

    const max_d = Math.ceil((text1_length + text2_length) / 2);
    const v_offset = max_d;
    const v_length = 2 * max_d;
    const v1: number[] = [];
    const v2: number[] = [];

    // Setting all elements to -1 is faster in Chrome & Firefox than mixing
    // integers and undefined.
    for (let x = 0; x < v_length; x++) {
      v1[x] = -1; v2[x] = -1;
    }

    v1[v_offset + 1] = 0;
    v2[v_offset + 1] = 0;
    const delta = text1_length - text2_length;

    // If the total number of characters is odd, then the front path will collide
    // with the reverse path.
    const front = (delta % 2 !== 0);

    // Offsets for start and end of k loop.
    // Prevents mapping of space beyond the grid.
    let k1start = 0;
    let k1end = 0;
    let k2start = 0;
    let k2end = 0;

    for (let d = 0; d < max_d; d++) {
      // Walk the front path one step.
      for (let k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
        const k1_offset = v_offset + k1;
        let x1;

        if (k1 === -d || (k1 !== d && v1[k1_offset - 1] < v1[k1_offset + 1])) {
          x1 = v1[k1_offset + 1];
        } else {
          x1 = v1[k1_offset - 1] + 1;
        }

        let y1 = x1 - k1;

        while (
          x1 < text1_length && y1 < text2_length &&
          text1[x1] === text2[y1]
        ) {
          x1++;
          y1++;
        }

        v1[k1_offset] = x1;

        if (x1 > text1_length) {
          // Ran off the right of the graph.
          k1end += 2;
        } else if (y1 > text2_length) {
          // Ran off the bottom of the graph.
          k1start += 2;
        } else if (front) {
          const k2_offset = v_offset + delta - k1;

          if (k2_offset >= 0 && k2_offset < v_length && v2[k2_offset] !== -1) {
            // Mirror x2 onto top-left coordinate system.
            const x2 = text1_length - v2[k2_offset];

            if (x1 >= x2) {
              // Overlap detected.
              return this.diff_bisectSplit_(text1, text2, x1, y1);
            }
          }
        }
      }

      // Walk the reverse path one step.
      for (let k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
        const k2_offset = v_offset + k2;
        let x2;

        if (k2 === -d || (k2 !== d && v2[k2_offset - 1] < v2[k2_offset + 1])) {
          x2 = v2[k2_offset + 1];
        } else {
          x2 = v2[k2_offset - 1] + 1;
        }

        let y2 = x2 - k2;

        while (
          x2 < text1_length && y2 < text2_length &&
          text1[text1_length - x2 - 1] === text2[text2_length - y2 - 1]
        ) {
          x2++;
          y2++;
        }

        v2[k2_offset] = x2;

        if (x2 > text1_length) {
          // Ran off the left of the graph.
          k2end += 2;
        } else if (y2 > text2_length) {
          // Ran off the top of the graph.
          k2start += 2;
        } else if (!front) {
          const k1_offset = v_offset + delta - k2;

          if (k1_offset >= 0 && k1_offset < v_length && v1[k1_offset] !== -1) {
            const x1 = v1[k1_offset];
            const y1 = v_offset + x1 - k1_offset;

            // Mirror x2 onto top-left coordinate system.
            x2 = text1_length - x2;

            if (x1 >= x2) {
              // Overlap detected.
              return this.diff_bisectSplit_(text1, text2, x1, y1);
            }
          }
        }
      }
    }

    // Diff took too long and hit the deadline or
    // number of diffs equals number of characters, no commonality at all.
    return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
  }

  /**
  * Given the location of the 'middle snake', split the diff in two parts
  * and recurse.
  * @param {string} text1 Old string to be diffed.
  * @param {string} text2 New string to be diffed.
  * @param {number} x Index of split point in text1.
  * @param {number} y Index of split point in text2.
  * @return {Array} Array of diff tuples.
  */
  private static diff_bisectSplit_ (text1: string, text2: string, x: number, y: number): DiffOp[] {
    const text1a = text1.slice(0, x);
    const text2a = text2.slice(0, y);
    const text1b = text1.slice(x);
    const text2b = text2.slice(y);

    // Compute both diffs serially.
    const diffs = this.diff_main(text1a, text2a);
    const diffsb = this.diff_main(text1b, text2b);

    return diffs.concat(diffsb);
  }

  /**
  * Determine the common prefix of two strings.
  * @param {string} text1 First string.
  * @param {string} text2 Second string.
  * @return {number} The number of characters common to the start of each
  *     string.
  */
  private static diff_commonPrefix (text1: string, text2: string): number {
    // Quick check for common null cases.
    if (!text1 || !text2 || text1.charAt(0) !== text2.charAt(0)) {
      return 0;
    }

    // Binary search.
    // Performance analysis: http://neil.fraser.name/news/2007/10/09/
    let pointermin = 0;
    let pointermax = Math.min(text1.length, text2.length);
    let pointermid = pointermax;
    let pointerstart = 0;

    while (pointermin < pointermid) {
      if (
        text1.substring(pointerstart, pointermid) ===
        text2.substring(pointerstart, pointermid)
      ) {
        pointermin = pointermid;
        pointerstart = pointermin;
      } else {
        pointermax = pointermid;
      }

      pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
    }

    return pointermid;
  }

  private static diff_commonSuffix (text1: string, text2: string): number {
    // Quick check for common null cases.
    if (!text1 || !text2 || text1.slice(-1) !== text2.slice(-1)) {
      return 0;
    }

    // Binary search.
    // Performance analysis: http://neil.fraser.name/news/2007/10/09/
    let pointermin = 0;
    let pointermax = Math.min(text1.length, text2.length);
    let pointermid = pointermax;
    let pointerend = 0;

    while (pointermin < pointermid) {
      if (
        text1.substring(text1.length - pointermid, text1.length - pointerend) ===
        text2.substring(text2.length - pointermid, text2.length - pointerend)
      ) {
        pointermin = pointermid;
        pointerend = pointermin;
      } else {
        pointermax = pointermid;
      }

      pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
    }

    return pointermid;
  }

  /**
  * Do the two texts share a substring which is at least half the length of the
  * longer text?
  * This speedup can produce non-minimal diffs.
  * @param {string} text1 First string.
  * @param {string} text2 Second string.
  * @return {Array.<string>} Five element Array, containing the prefix of
  *     text1, the suffix of text1, the prefix of text2, the suffix of
  *     text2 and the common middle.  Or null if there was no match.
  */
  private static diff_halfMatch_ (text1: string, text2: string): string[] {
    const longtext = text1.length > text2.length ? text1 : text2;
    const shorttext = text1.length > text2.length ? text2 : text1;

    if (longtext.length < 4 || shorttext.length * 2 < longtext.length) {
      return null; // Pointless.
    }

    /**
    * Does a substring of shorttext exist within longtext such that the substring
    * is at least half the length of longtext?
    * Closure, but does not reference any external variables.
    * @param {string} longtext Longer string.
    * @param {string} shorttext Shorter string.
    * @param {number} i Start index of quarter length substring within longtext.
    * @return {Array.<string>} Five element Array, containing the prefix of
    *     longtext, the suffix of longtext, the prefix of shorttext, the suffix
    *     of shorttext and the common middle.  Or null if there was no match.
    * @private
    */
    const diff_halfMatchI_ = (longtext: string, shorttext: string, i: number): string[] => {
      // Start with a 1/4 length substring at position i as a seed.
      const seed = longtext.slice(i, i + Math.floor(longtext.length / 4));
      let j = -1;
      let best_common = '';
      let best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b;

      while ((j = shorttext.indexOf(seed, j + 1)) !== -1) {
        const prefixLength = this.diff_commonPrefix(
          longtext.substring(i), shorttext.substring(j));
        const suffixLength = this.diff_commonSuffix(
          longtext.substring(0, i), shorttext.substring(0, j));

        if (best_common.length < suffixLength + prefixLength) {
          best_common = shorttext.substring(
            j - suffixLength, j) + shorttext.substring(j, j + prefixLength);
          best_longtext_a = longtext.substring(0, i - suffixLength);
          best_longtext_b = longtext.substring(i + prefixLength);
          best_shorttext_a = shorttext.substring(0, j - suffixLength);
          best_shorttext_b = shorttext.substring(j + prefixLength);
        }
      }

      if (best_common.length * 2 >= longtext.length) {
        return [
          best_longtext_a, best_longtext_b,
          best_shorttext_a, best_shorttext_b, best_common
        ];
      } else {
        return null;
      }
    };

    // First check if the second quarter is the seed for a half-match.
    const hm1 = diff_halfMatchI_(longtext, shorttext, Math.ceil(longtext.length / 4));
    // Check again based on the third quarter.
    const hm2 = diff_halfMatchI_(longtext, shorttext, Math.ceil(longtext.length / 2));
    let hm;

    if (!hm1 && !hm2) {
      return null;
    } else if (!hm2) {
      hm = hm1;
    } else if (!hm1) {
      hm = hm2;
    } else {
      // Both matched.  Select the longest.
      hm = hm1[4].length > hm2[4].length ? hm1 : hm2;
    }

    // A half-match was found, sort out the return data.
    let text1_a, text1_b, text2_a, text2_b;

    if (text1.length > text2.length) {
      text1_a = hm[0];
      text1_b = hm[1];
      text2_a = hm[2];
      text2_b = hm[3];
    } else {
      text2_a = hm[0];
      text2_b = hm[1];
      text1_a = hm[2];
      text1_b = hm[3];
    }

    const mid_common = hm[4];

    return [text1_a, text1_b, text2_a, text2_b, mid_common];
  }

  /**
  * Reorder and merge like edit sections.  Merge equalities.
  * Any edit section can move as long as it doesn't cross an equality.
  * @param {Array} diffs Array of diff tuples.
  * @param {boolean} fix_unicode Whether to normalize to a unicode-correct diff
  */
  private static diff_cleanupMerge (diffs: DiffOp[]) {
    diffs.push([DIFF_EQUAL, '']); // Add a dummy entry at the end.
    let pointer = 0;
    let count_delete = 0;
    let count_insert = 0;
    let text_delete = '';
    let text_insert = '';
    let commonlength;

    while (pointer < diffs.length) {
      if (pointer < diffs.length - 1 && !diffs[pointer][1]) {
        diffs.splice(pointer, 1);
        continue;
      }

      switch (diffs[pointer][0]) {
        case DIFF_INSERT:

          count_insert++;
          text_insert += diffs[pointer][1];
          pointer++;
          break;
        case DIFF_DELETE:
          count_delete++;
          text_delete += diffs[pointer][1];
          pointer++;
          break;
        case DIFF_EQUAL:

          if (pointer < diffs.length - 1 && !diffs[pointer][1]) {
            // for empty equality not at end, wait for next equality
            diffs.splice(pointer, 1);
            break;
          }

          if (text_delete.length > 0 || text_insert.length > 0) {
            // note that diff_commonPrefix and diff_commonSuffix are unicode-aware
            if (text_delete.length > 0 && text_insert.length > 0) {
              // Factor out any common prefixes.
              commonlength = this.diff_commonPrefix(text_insert, text_delete);

              if (commonlength !== 0) {
                if (pointer - count_insert - count_delete - 1 >= 0) {
                  diffs[pointer - count_insert - count_delete - 1][1] += text_insert.substring(0, commonlength);
                } else {
                  diffs.splice(0, 0, [DIFF_EQUAL, text_insert.substring(0, commonlength)]);
                  pointer++;
                }

                text_insert = text_insert.substring(commonlength);
                text_delete = text_delete.substring(commonlength);
              }

              // Factor out any common suffixes.
              commonlength = this.diff_commonSuffix(text_insert, text_delete);

              if (commonlength !== 0) {
                diffs[pointer][1] =
                  text_insert.substring(text_insert.length - commonlength) + diffs[pointer][1];
                text_insert = text_insert.substring(0, text_insert.length - commonlength);
                text_delete = text_delete.substring(0, text_delete.length - commonlength);
              }
            }

            // Delete the offending records and add the merged ones.
            const n = count_insert + count_delete;

            if (text_delete.length === 0 && text_insert.length === 0) {
              diffs.splice(pointer - n, n);
              pointer = pointer - n;
            } else if (text_delete.length === 0) {
              diffs.splice(pointer - n, n, [DIFF_INSERT, text_insert]);
              pointer = pointer - n + 1;
            } else if (text_insert.length === 0) {
              diffs.splice(pointer - n, n, [DIFF_DELETE, text_delete]);
              pointer = pointer - n + 1;
            } else {
              diffs.splice(pointer - n, n, [DIFF_DELETE, text_delete], [DIFF_INSERT, text_insert]);
              pointer = pointer - n + 2;
            }
          }

          if (pointer !== 0 && diffs[pointer - 1][0] === DIFF_EQUAL) {
            // Merge this equality with the previous one.
            diffs[pointer - 1][1] += diffs[pointer][1];
            diffs.splice(pointer, 1);
          } else {
            pointer++;
          }

          count_insert = 0;
          count_delete = 0;
          text_delete = '';
          text_insert = '';
          break;
      }
    }

    if (diffs[diffs.length - 1][1] === '') {
      diffs.pop(); // Remove the dummy entry at the end.
    }

    // Second pass: look for single edits surrounded on both sides by equalities
    // which can be shifted sideways to eliminate an equality.
    // e.g: A<ins>BA</ins>C -> <ins>AB</ins>AC
    let changes = false;

    pointer = 1;

    // Intentionally ignore the first and last element (don't need checking).
    while (pointer < diffs.length - 1) {
      if (diffs[pointer - 1][0] === DIFF_EQUAL &&
        diffs[pointer + 1][0] === DIFF_EQUAL) {
        // This is a single edit surrounded by equalities.
        if (diffs[pointer][1].substring(diffs[pointer][1].length -
          diffs[pointer - 1][1].length) === diffs[pointer - 1][1]) {
          // Shift the edit over the previous equality.
          diffs[pointer][1] = diffs[pointer - 1][1] +
            diffs[pointer][1].substring(0, diffs[pointer][1].length -
              diffs[pointer - 1][1].length);
          diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
          diffs.splice(pointer - 1, 1);
          changes = true;
        } else if (diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) ===
          diffs[pointer + 1][1]) {
          // Shift the edit over the next equality.
          diffs[pointer - 1][1] += diffs[pointer + 1][1];
          diffs[pointer][1] =
            diffs[pointer][1].substring(diffs[pointer + 1][1].length) +
            diffs[pointer + 1][1];
          diffs.splice(pointer + 1, 1);
          changes = true;
        }
      }

      pointer++;
    }

    // If shifts were made, the diff needs reordering and another shift sweep.
    if (changes) {
      this.diff_cleanupMerge(diffs);
    }
  }

  // Applies a diff to text, throwing an error if diff is invalid or incorrect
  public static patch (diffs: DiffOp[], raw: Uint8Array): Uint8Array {
    const text = u8aToHex(raw);
    let pos = 0;

    let result = '';
    let inserts_since_last_equality = 0;
    let deletes_since_last_equality = 0;

    for (let i = 0; i < diffs.length; i++) {
      const d = diffs[i];

      if (!d[1]) {
        throw new Error('Empty tuple in diff');
      }

      switch (d[0]) {
        case DIFF_EQUAL:
          if (i !== 0 && !inserts_since_last_equality && !deletes_since_last_equality) {
            throw new Error('two consecutive equalities in diff');
          }

          inserts_since_last_equality = 0;
          deletes_since_last_equality = 0;
          expect(d[1]);
          result += d[1];
          pos += d[1].length;
          break;
        case DIFF_DELETE:
          if (deletes_since_last_equality) {
            throw new Error('multiple deletes between equalities');
          }

          if (inserts_since_last_equality) {
            throw new Error('delete following insert in diff');
          }

          deletes_since_last_equality++;
          expect(d[1]);
          pos += d[1].length;
          break;
        case DIFF_INSERT:
          if (inserts_since_last_equality) {
            throw new Error('multiple inserts between equalities');
          }

          inserts_since_last_equality++;
          result += d[1];
          break;
      }
    }

    if (pos !== text.length) {
      throw new Error('Diff did not consume entire input text');
    }

    return hexToU8a(result);
  }
}

export { Diff };
