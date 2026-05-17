import { prisma } from "./connection.js";

async function seed() {
  const problemData = [
    {
      title: "Two Sum",
      slug: "two-sum",
      difficulty: "EASY" as const,
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
    },

    {
      title: "Longest Substring Without Repeating Characters",
      slug: "longest-substring-without-repeating-characters",
      difficulty: "MEDIUM" as const,
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
    },

    {
      title: "Merge Intervals",
      slug: "merge-intervals",
      difficulty: "MEDIUM" as const,
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
          explanation: "Intervals [1,4] and [4,5] are considered overlapping.",
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
    },
  ];

  for (const data of problemData) {
    await prisma.problem.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    });
  }

  const twoSum = await prisma.problem.findUniqueOrThrow({
    where: { slug: "two-sum" },
  });

  const longestSubstring = await prisma.problem.findUniqueOrThrow({
    where: { slug: "longest-substring-without-repeating-characters" },
  });

  const mergeIntervals = await prisma.problem.findUniqueOrThrow({
    where: { slug: "merge-intervals" },
  });

  const testCaseData = [
    {
      problemId: twoSum.id,
      input: "2, 7, 11, 15\n9",
      expectedOutput: "[0, 1]",
      order: 1,
    },
    {
      problemId: twoSum.id,
      input: "3, 2, 4\n6",
      expectedOutput: "[1, 2]",
      order: 2,
    },
    {
      problemId: twoSum.id,
      input: "3, 3\n6",
      expectedOutput: "[0, 1]",
      order: 3,
    },
    {
      problemId: twoSum.id,
      input: "1, 5, 7, -2, 9\n3",
      expectedOutput: "[0, 3]",
      order: 4,
      isHidden: true,
    },
    {
      problemId: longestSubstring.id,
      input: "abcabcbb",
      expectedOutput: "3",
      order: 1,
    },
    {
      problemId: longestSubstring.id,
      input: "bbbbb",
      expectedOutput: "1",
      order: 2,
    },
    {
      problemId: longestSubstring.id,
      input: "pwwkew",
      expectedOutput: "3",
      order: 3,
    },
    {
      problemId: longestSubstring.id,
      input: "",
      expectedOutput: "0",
      order: 4,
    },
    {
      problemId: longestSubstring.id,
      input: "abcdef",
      expectedOutput: "6",
      order: 5,
      isHidden: true,
    },
    {
      problemId: mergeIntervals.id,
      input: "[[1,3],[2,6],[8,10],[15,18]]",
      expectedOutput: "[[1,6],[8,10],[15,18]]",
      order: 1,
    },
    {
      problemId: mergeIntervals.id,
      input: "[[1,4],[4,5]]",
      expectedOutput: "[[1,5]]",
      order: 2,
    },
    {
      problemId: mergeIntervals.id,
      input: "[[1,4],[0,4]]",
      expectedOutput: "[[0,4]]",
      order: 3,
    },
    {
      problemId: mergeIntervals.id,
      input: "[[1,4],[2,3]]",
      expectedOutput: "[[1,4]]",
      order: 4,
      isHidden: true,
    },
  ];

  for (const tc of testCaseData) {
    await prisma.testCase.upsert({
      where: {
        problemId_order: { problemId: tc.problemId, order: tc.order },
      },
      update: {},
      create: tc,
    });
  }

  console.log("Seeded 3 problems with test cases");

  // --- Contest Seeding ---
   const now = new Date();
   const contestStartTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
   const contestEndTime = new Date(contestStartTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
   const contest = await prisma.contest.upsert({
     where: { slug: "weekly-contest-1" },
     update: {},
     create: {
       title: "Weekly Contest 1",
       slug: "weekly-contest-1",
       description: "Weekly coding contest featuring 3 problems. Solve as many as you can within 2 hours.",
       startTime: contestStartTime,
       endTime: contestEndTime,
       isActive: true,
     },
   });
   const contestProblems = [
     { contestId: contest.id, problemId: twoSum.id, points: 500, order: 1 },
     { contestId: contest.id, problemId: longestSubstring.id, points: 1000, order: 2 },
     { contestId: contest.id, problemId: mergeIntervals.id, points: 1500, order: 3 },
   ];
   for (const cp of contestProblems) {
     await prisma.contestProblem.upsert({
       where: {
         contestId_problemId: { contestId: cp.contestId, problemId: cp.problemId },
       },
       update: {},
       create: cp,
     });
   }
   console.log("Seeded 1 contest with 3 problems");
}
seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
