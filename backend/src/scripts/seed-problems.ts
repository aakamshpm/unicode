import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ProblemsService } from '../modules/problems/problem.service';
import { CreateProblemDto } from '../modules/problems/dto/create-problem.dto';
import { UsersService } from '../modules/users/users.service';
import { Difficulty } from 'src/modules/problems/entities/problem.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const problemsService = app.get(ProblemsService);
  const usersService = app.get(UsersService);

  console.log('Starting problem seeding...\n');

  // Get admin user as creator
  const adminUser = await usersService.findByEmail(''); // Enter your local admin email here
  if (!adminUser) {
    console.error(
      'Admin user not found. Please run npm run create:admin first',
    );
    process.exit(1);
  }

  const problems: CreateProblemDto[] = [
    {
      title: 'Two Sum',
      slug: 'two-sum',
      difficulty: Difficulty.EASY,
      description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have ***exactly one solution***, and you may not use the *same* element twice.

You can return the answer in any order.

**Constraints:**
- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`
- Only one valid answer exists.`,
      examples: [
        {
          input: 'nums = [2,7,11,15], target = 9',
          output: '[0,1]',
          explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
        },
        {
          input: 'nums = [3,2,4], target = 6',
          output: '[1,2]',
        },
        {
          input: 'nums = [3,3], target = 6',
          output: '[0,1]',
        },
      ],
      starter_code: {
        python: `def twoSum(nums: List[int], target: int) -> List[int]:
    # Write your code here
    pass`,
        javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Write your code here
}`,
        c: `/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    // Write your code here
}`,
      },
      test_cases: [
        {
          input: { nums: [2, 7, 11, 15], target: 9 },
          expected_output: [0, 1],
          is_sample: true,
          order: 1,
        },
        {
          input: { nums: [3, 2, 4], target: 6 },
          expected_output: [1, 2],
          is_sample: true,
          order: 2,
        },
        {
          input: { nums: [3, 3], target: 6 },
          expected_output: [0, 1],
          is_sample: true,
          order: 3,
        },
        {
          input: { nums: [1, 5, 3, 7, 9], target: 10 },
          expected_output: [1, 3],
          is_sample: false,
          order: 4,
        },
        {
          input: { nums: [-1, -2, -3, -4, -5], target: -8 },
          expected_output: [2, 4],
          is_sample: false,
          order: 5,
        },
        {
          input: { nums: [0, 4, 3, 0], target: 0 },
          expected_output: [0, 3],
          is_sample: false,
          order: 6,
        },
        {
          input: { nums: [1000000000, -1000000000], target: 0 },
          expected_output: [0, 1],
          is_sample: false,
          order: 7,
        },
        {
          input: {
            nums: Array.from({ length: 10000 }, (_, i) => i),
            target: 19997,
          },
          expected_output: [9998, 9999],
          is_sample: false,
          order: 8,
        },
      ],
    },
    {
      title: 'Valid Parentheses',
      slug: 'valid-parentheses',
      difficulty: Difficulty.EASY,
      description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

**Constraints:**
- \`1 <= s.length <= 10^4\`
- \`s\` consists of parentheses only \`'()[]{}'\`.`,
      examples: [
        {
          input: 's = "()"',
          output: 'true',
        },
        {
          input: 's = "()[]{}"',
          output: 'true',
        },
        {
          input: 's = "(]"',
          output: 'false',
        },
      ],
      starter_code: {
        python: `def isValid(s: str) -> bool:
    # Write your code here
    pass`,
        javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
    // Write your code here
}`,
        c: `#include <stdbool.h>

bool isValid(char* s) {
    // Write your code here
}`,
      },
      test_cases: [
        {
          input: { s: '()' },
          expected_output: true,
          is_sample: true,
          order: 1,
        },
        {
          input: { s: '()[]{}' },
          expected_output: true,
          is_sample: true,
          order: 2,
        },
        {
          input: { s: '(]' },
          expected_output: false,
          is_sample: true,
          order: 3,
        },
        {
          input: { s: '([)]' },
          expected_output: false,
          is_sample: false,
          order: 4,
        },
        {
          input: { s: '{[]}' },
          expected_output: true,
          is_sample: false,
          order: 5,
        },
        {
          input: { s: '(((((' },
          expected_output: false,
          is_sample: false,
          order: 6,
        },
        {
          input: { s: ')))))' },
          expected_output: false,
          is_sample: false,
          order: 7,
        },
        {
          input: { s: '{[()]}' },
          expected_output: true,
          is_sample: false,
          order: 8,
        },
        {
          input: { s: ''.repeat(5000) + '()'.repeat(5000) },
          expected_output: false,
          is_sample: false,
          order: 9,
        },
      ],
    },
    {
      title: 'Reverse String',
      slug: 'reverse-string',
      difficulty: Difficulty.EASY,
      description: `Write a function that reverses a string. The input string is given as an array of characters \`s\`.

You must do this by modifying the input array in-place with \`O(1)\` extra memory.

**Constraints:**
- \`1 <= s.length <= 10^5\`
- \`s[i]\` is a printable ASCII character.`,
      examples: [
        {
          input: 's = ["h","e","l","l","o"]',
          output: '["o","l","l","e","h"]',
        },
        {
          input: 's = ["H","a","n","n","a","h"]',
          output: '["h","a","n","n","a","H"]',
        },
      ],
      starter_code: {
        python: `def reverseString(s: List[str]) -> None:
    """
    Do not return anything, modify s in-place instead.
    """
    # Write your code here
    pass`,
        javascript: `/**
 * @param {character[]} s
 * @return {void} Do not return anything, modify s in-place instead.
 */
function reverseString(s) {
    // Write your code here
}`,
        c: `void reverseString(char* s, int sSize) {
    // Write your code here
}`,
      },
      test_cases: [
        {
          input: { s: ['h', 'e', 'l', 'l', 'o'] },
          expected_output: ['o', 'l', 'l', 'e', 'h'],
          is_sample: true,
          order: 1,
        },
        {
          input: { s: ['H', 'a', 'n', 'n', 'a', 'h'] },
          expected_output: ['h', 'a', 'n', 'n', 'a', 'H'],
          is_sample: true,
          order: 2,
        },
        {
          input: { s: ['a'] },
          expected_output: ['a'],
          is_sample: false,
          order: 3,
        },
        {
          input: { s: ['a', 'b'] },
          expected_output: ['b', 'a'],
          is_sample: false,
          order: 4,
        },
        {
          input: {
            s: Array.from({ length: 100000 }, (_, i) =>
              String.fromCharCode(65 + (i % 26)),
            ),
          },
          expected_output: Array.from({ length: 100000 }, (_, i) =>
            String.fromCharCode(65 + ((100000 - 1 - i) % 26)),
          ),
          is_sample: false,
          order: 5,
        },
      ],
    },
    {
      title: 'Merge Intervals',
      slug: 'merge-intervals',
      difficulty: Difficulty.MEDIUM,
      description: `Given an array of \`intervals\` where \`intervals[i] = [start_i, end_i]\`, merge all overlapping intervals, and return *an array of the non-overlapping intervals that cover all the intervals in the input*.

**Constraints:**
- \`1 <= intervals.length <= 10^4\`
- \`intervals[i].length == 2\`
- \`0 <= start_i <= end_i <= 10^4\``,
      examples: [
        {
          input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]',
          output: '[[1,6],[8,10],[15,18]]',
          explanation:
            'Since intervals [1,3] and [2,6] overlap, merge them into [1,6].',
        },
        {
          input: 'intervals = [[1,4],[4,5]]',
          output: '[[1,5]]',
          explanation: 'Intervals [1,4] and [4,5] are considered overlapping.',
        },
      ],
      starter_code: {
        python: `def merge(intervals: List[List[int]]) -> List[List[int]]:
    # Write your code here
    pass`,
        javascript: `/**
 * @param {number[][]} intervals
 * @return {number[][]}
 */
function merge(intervals) {
    // Write your code here
}`,
        c: `/**
 * Return an array of arrays of size *returnSize.
 * The sizes of the arrays are returned as *returnColumnSizes array.
 * Note: Both returned array and *columnSizes array must be malloced, assume caller calls free().
 */
int** merge(int** intervals, int intervalsSize, int* intervalsColSize, int* returnSize, int** returnColumnSizes) {
    // Write your code here
}`,
      },
      test_cases: [
        {
          input: {
            intervals: [
              [1, 3],
              [2, 6],
              [8, 10],
              [15, 18],
            ],
          },
          expected_output: [
            [1, 6],
            [8, 10],
            [15, 18],
          ],
          is_sample: true,
          order: 1,
        },
        {
          input: {
            intervals: [
              [1, 4],
              [4, 5],
            ],
          },
          expected_output: [[1, 5]],
          is_sample: true,
          order: 2,
        },
        {
          input: {
            intervals: [
              [1, 4],
              [0, 4],
            ],
          },
          expected_output: [[0, 4]],
          is_sample: false,
          order: 3,
        },
        {
          input: {
            intervals: [
              [1, 4],
              [2, 3],
            ],
          },
          expected_output: [[1, 4]],
          is_sample: false,
          order: 4,
        },
        {
          input: {
            intervals: [
              [1, 10],
              [2, 3],
              [4, 5],
              [6, 7],
              [8, 9],
            ],
          },
          expected_output: [[1, 10]],
          is_sample: false,
          order: 5,
        },
        {
          input: {
            intervals: [
              [1, 2],
              [3, 4],
              [5, 6],
              [7, 8],
            ],
          },
          expected_output: [
            [1, 2],
            [3, 4],
            [5, 6],
            [7, 8],
          ],
          is_sample: false,
          order: 6,
        },
      ],
    },
    {
      title: 'Trapping Rain Water',
      slug: 'trapping-rain-water',
      difficulty: Difficulty.HARD,
      description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.

**Constraints:**
- \`n == height.length\`
- \`1 <= n <= 2 * 10^4\`
- \`0 <= height[i] <= 10^5\``,
      examples: [
        {
          input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]',
          output: '6',
          explanation:
            'The elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are being trapped.',
        },
        {
          input: 'height = [4,2,0,3,2,5]',
          output: '9',
        },
      ],
      starter_code: {
        python: `def trap(height: List[int]) -> int:
    # Write your code here
    pass`,
        javascript: `/**
 * @param {number[]} height
 * @return {number}
 */
function trap(height) {
    // Write your code here
}`,
        c: `int trap(int* height, int heightSize) {
    // Write your code here
}`,
      },
      test_cases: [
        {
          input: { height: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1] },
          expected_output: 6,
          is_sample: true,
          order: 1,
        },
        {
          input: { height: [4, 2, 0, 3, 2, 5] },
          expected_output: 9,
          is_sample: true,
          order: 2,
        },
        {
          input: { height: [0, 1, 0] },
          expected_output: 0,
          is_sample: false,
          order: 3,
        },
        {
          input: { height: [3, 0, 2, 0, 4] },
          expected_output: 7,
          is_sample: false,
          order: 4,
        },
        {
          input: { height: [5, 4, 3, 2, 1] },
          expected_output: 0,
          is_sample: false,
          order: 5,
        },
        {
          input: { height: [1, 2, 3, 4, 5] },
          expected_output: 0,
          is_sample: false,
          order: 6,
        },
        {
          input: { height: [5, 5, 1, 7, 1, 1, 5, 2, 7, 6] },
          expected_output: 23,
          is_sample: false,
          order: 7,
        },
        {
          input: { height: Array(20000).fill(100000) },
          expected_output: 0,
          is_sample: false,
          order: 8,
        },
      ],
    },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const problemData of problems) {
    try {
      await problemsService.create(problemData, adminUser.id);
      console.log(
        `Created problem: ${problemData.title} (${problemData.difficulty})`,
      );
      createdCount++;
    } catch (error) {
      // Check if it's a ConflictException (problem already exists)
      if (error.status === 409) {
        console.log(`Skipping "${problemData.title}" - already exists`);
        skippedCount++;
      } else {
        console.error(
          `Failed to create "${problemData.title}":`,
          error.message,
        );
      }
    }
  }

  console.log(`\nSummary:`);
  console.log(`Created: ${createdCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Total: ${problems.length}\n`);

  await app.close();
  process.exit(0);
}

bootstrap();
