import { prisma } from "./connection.js";

async function seed() {
  const problems = await prisma.problem.createMany({
    data: [
      {
        title: "Two Sum",
        slug: "two-sum",
        difficulty: "EASY",
        description:
          "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
        examples: [
          {
            input: "nums = [2,7,11,15], target = 9",
            output: "[0,1]",
            explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
          },
          {
            input: "nums = [3,2,4], target = 6",
            output: "[1,2]",
          },
        ],
        constraints: [
          "2 <= nums.length <= 10^4",
          "-10^9 <= nums[i] <= 10^9",
          "-10^9 <= target <= 10^9",
          "Only one valid answer exists.",
        ],
        starterCode: {
          javascript: "function twoSum(nums, target) {\n  \n}",
          python: "def twoSum(nums, target):\n    ",
        },
        testCases: [
          { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
          { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2] },
          { input: { nums: [3, 3], target: 6 }, expected: [0, 1] },
        ],
      },

      {
        title: "Longest Substring Without Repeating Characters",
        slug: "longest-substring-without-repeating-characters",
        difficulty: "MEDIUM",
        description:
          "Given a string s, find the length of the longest substring without repeating characters.",
        examples: [
          {
            input: 's = "abcabcbb"',
            output: "3",
            explanation: 'The answer is "abc", with the length of 3.',
          },
          {
            input: 's = "bbbbb"',
            output: "1",
            explanation: 'The answer is "b", with the length of 1.',
          },
        ],
        constraints: [
          "0 <= s.length <= 5 * 10^4",
          "s consists of English letters, digits, symbols and spaces.",
        ],
        starterCode: {
          javascript: "function lengthOfLongestSubstring(s) {\n  \n}",
          python: "def lengthOfLongestSubstring(s):\n    ",
        },
        testCases: [
          { input: { s: "abcabcbb" }, expected: 3 },
          { input: { s: "bbbbb" }, expected: 1 },
          { input: { s: "pwwkew" }, expected: 3 },
        ],
      },

      {
        title: "Merge Intervals",
        slug: "merge-intervals",
        difficulty: "MEDIUM",
        description:
          "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
        examples: [
          {
            input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
            output: "[[1,6],[8,10],[15,18]]",
            explanation:
              "Since intervals [1,3] and [2,6] overlap, merge them into [1,6].",
          },
          {
            input: "intervals = [[1,4],[4,5]]",
            output: "[[1,5]]",
            explanation:
              "Intervals [1,4] and [4,5] are considered overlapping.",
          },
        ],
        constraints: [
          "1 <= intervals.length <= 10^4",
          "intervals[i].length == 2",
          "0 <= starti <= endi <= 10^4",
        ],
        starterCode: {
          javascript: "function merge(intervals) {\n  \n}",
          python: "def merge(intervals):\n    ",
        },
        testCases: [
          {
            input: {
              intervals: [
                [1, 3],
                [2, 6],
                [8, 10],
                [15, 18],
              ],
            },
            expected: [
              [1, 6],
              [8, 10],
              [15, 18],
            ],
          },
          {
            input: {
              intervals: [
                [1, 4],
                [4, 5],
              ],
            },
            expected: [[1, 5]],
          },
        ],
      },
    ],
  });

  console.log(`Seeded ${problems.count} problems`);
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
