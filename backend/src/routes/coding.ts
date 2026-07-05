import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Test Cases definition for common questions
interface TestCase {
  input: string;
  output: string;
  evalCheck: (outputStr: string) => boolean;
}

const TEST_CASES: Record<string, TestCase[]> = {
  twoSum: [
    {
      input: 'nums = [2, 7, 11, 15], target = 9',
      output: '[0, 1]',
      evalCheck: (val: string) => {
        try {
          const arr = JSON.parse(val);
          return Array.isArray(arr) && arr.includes(0) && arr.includes(1) && arr.length === 2;
        } catch (e) {
          return false;
        }
      }
    },
    {
      input: 'nums = [3, 2, 4], target = 6',
      output: '[1, 2]',
      evalCheck: (val: string) => {
        try {
          const arr = JSON.parse(val);
          return Array.isArray(arr) && arr.includes(1) && arr.includes(2) && arr.length === 2;
        } catch (e) {
          return false;
        }
      }
    },
  ],
  reverseList: [
    {
      input: '[1, 2, 3, 4, 5]',
      output: '[5, 4, 3, 2, 1]',
      evalCheck: (val: string) => {
        try {
          const arr = JSON.parse(val);
          return Array.isArray(arr) && JSON.stringify(arr) === '[5,4,3,2,1]';
        } catch (e) {
          return false;
        }
      }
    },
  ],
  binarySearch: [
    {
      input: 'nums = [-1, 0, 3, 5, 9, 12], target = 9',
      output: '4',
      evalCheck: (val: string) => val.trim() === '4'
    },
    {
      input: 'nums = [-1, 0, 3, 5, 9, 12], target = 2',
      output: '-1',
      evalCheck: (val: string) => val.trim() === '-1'
    },
  ],
};

function getDriverScript(problemId: string, language: string, userCode: string): { driverCode: string; languageKey: string; filename: string } {
  const normLang = (language || 'javascript').toLowerCase();
  
  let languageKey = 'javascript';
  let filename = 'index.js';
  
  if (normLang === 'python' || normLang === 'py' || normLang === 'python3') {
    languageKey = 'python3';
    filename = 'main.py';
  } else if (normLang === 'java') {
    languageKey = 'java';
    filename = 'Main.java';
  } else if (normLang === 'typescript' || normLang === 'ts') {
    languageKey = 'typescript';
    filename = 'index.ts';
  }

  let driverCode = userCode;

  if (languageKey === 'javascript' || languageKey === 'typescript') {
    driverCode = `${userCode}

// --- DRIVER CODE ---
console.log("__TESTS_START__");
try {
  const _twoSum = typeof twoSum === 'function' ? twoSum : (typeof two_sum === 'function' ? two_sum : null);
  const _reverseList = typeof reverseList === 'function' ? reverseList : (typeof reverse_list === 'function' ? reverse_list : null);
  const _binarySearch = typeof binarySearch === 'function' ? binarySearch : (typeof binary_search === 'function' ? binary_search : null);

  if (_twoSum) {
    console.log("TEST_1:", JSON.stringify(_twoSum([2, 7, 11, 15], 9)));
    console.log("TEST_2:", JSON.stringify(_twoSum([3, 2, 4], 6)));
  } else if (_reverseList) {
    console.log("TEST_1:", JSON.stringify(_reverseList([1, 2, 3, 4, 5])));
  } else if (_binarySearch) {
    console.log("TEST_1:", JSON.stringify(_binarySearch([-1, 0, 3, 5, 9, 12], 9)));
    console.log("TEST_2:", JSON.stringify(_binarySearch([-1, 0, 3, 5, 9, 12], 2)));
  } else {
    console.log("ERROR: No matching solver function found (twoSum, reverseList, binarySearch)");
  }
} catch (e) {
  console.log("RUNTIME_ERROR:", e.message);
}
`;
  } else if (languageKey === 'python3') {
    driverCode = `${userCode}

# --- DRIVER CODE ---
import json
print("__TESTS_START__")
try:
    g = globals()
    _twoSum = g.get('twoSum') or g.get('two_sum')
    _reverseList = g.get('reverseList') or g.get('reverse_list')
    _binarySearch = g.get('binarySearch') or g.get('binary_search')

    if _twoSum:
        print("TEST_1:", json.dumps(_twoSum([2, 7, 11, 15], 9)))
        print("TEST_2:", json.dumps(_twoSum([3, 2, 4], 6)))
    elif _reverseList:
        print("TEST_1:", json.dumps(_reverseList([1, 2, 3, 4, 5])))
    elif _binarySearch:
        print("TEST_1:", json.dumps(_binarySearch([-1, 0, 3, 5, 9, 12], 9)))
        print("TEST_2:", json.dumps(_binarySearch([-1, 0, 3, 5, 9, 12], 2)))
    else:
        print("ERROR: No matching solver function found (twoSum, reverseList, binarySearch)")
except Exception as e:
    print("RUNTIME_ERROR:", str(e))
`;
  } else if (languageKey === 'java') {
    const cleanUserCode = userCode.replace(/public\s+class\s+Solution/g, 'class Solution');
    driverCode = `${cleanUserCode}

// --- DRIVER CODE ---
public class Main {
    public static void main(String[] args) {
        System.out.println("__TESTS_START__");
        try {
            Solution sol = new Solution();
            java.lang.reflect.Method[] methods = Solution.class.getDeclaredMethods();
            java.lang.reflect.Method targetMethod = null;
            String mode = "";
            
            for (java.lang.reflect.Method m : methods) {
                String name = m.getName();
                if (name.equals("twoSum") || name.equals("two_sum")) {
                    targetMethod = m;
                    mode = "twoSum";
                    break;
                } else if (name.equals("reverseList") || name.equals("reverse_list")) {
                    targetMethod = m;
                    mode = "reverseList";
                    break;
                } else if (name.equals("binarySearch") || name.equals("binary_search")) {
                    targetMethod = m;
                    mode = "binarySearch";
                    break;
                }
            }
            
            if (targetMethod == null) {
                System.out.println("ERROR: No matching solver method found in Solution class (twoSum, reverseList, binarySearch)");
                return;
            }
            
            if (mode.equals("twoSum")) {
                int[] res1 = (int[]) targetMethod.invoke(sol, new int[]{2, 7, 11, 15}, 9);
                System.out.println("TEST_1: [" + res1[0] + "," + res1[1] + "]");
                int[] res2 = (int[]) targetMethod.invoke(sol, new int[]{3, 2, 4}, 6);
                System.out.println("TEST_2: [" + res2[0] + "," + res2[1] + "]");
            } else if (mode.equals("reverseList")) {
                int[] res1 = (int[]) targetMethod.invoke(sol, (Object) new int[]{1, 2, 3, 4, 5});
                StringBuilder sb = new StringBuilder("[");
                for (int i = 0; i < res1.length; i++) {
                    sb.append(res1[i]);
                    if (i < res1.length - 1) sb.append(",");
                }
                sb.append("]");
                System.out.println("TEST_1: " + sb.toString());
            } else if (mode.equals("binarySearch")) {
                int res1 = (int) targetMethod.invoke(sol, new int[]{-1, 0, 3, 5, 9, 12}, 9);
                System.out.println("TEST_1: " + res1);
                int res2 = (int) targetMethod.invoke(sol, new int[]{-1, 0, 3, 5, 9, 12}, 2);
                System.out.println("TEST_2: " + res2);
            }
        } catch (Exception e) {
            System.out.println("RUNTIME_ERROR: " + e.getMessage());
            if (e.getCause() != null) {
                System.out.println("CAUSE: " + e.getCause().getMessage());
            }
        }
    }
}
`;
  }

  return { driverCode, languageKey, filename };
}

// Run Code Endpoint
router.post('/run', authMiddleware, async (req, res) => {
  try {
    const { code, language, problemId } = req.body; // e.g. problemId: "twoSum"

    if (!code) {
      return res.status(400).json({ error: 'Code content is required.' });
    }

    const pid = problemId || 'twoSum';
    const tests = TEST_CASES[pid] || TEST_CASES['twoSum'];

    const { driverCode, languageKey, filename } = getDriverScript(pid, language, code);

    // Call Piston execution API
    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: languageKey,
        version: '*',
        files: [
          {
            name: filename,
            content: driverCode,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Piston API execution returned status ${response.status}`);
    }

    const result: any = await response.json();

    const runStdout = result.run?.stdout || '';
    const runStderr = result.run?.stderr || '';
    const compileStderr = result.compile?.stderr || '';

    // Check for compilation errors
    if (result.compile && result.compile.code !== 0) {
      return res.json({
        status: 'Compilation Error',
        stdout: '',
        error: compileStderr || 'Compilation failed.',
        passed: 0,
        total: tests.length,
        results: [],
      });
    }

    // Check for runtime crash (nonzero exit code when stdout doesn't have tests)
    if (result.run && result.run.code !== 0 && !runStdout.includes('__TESTS_START__')) {
      return res.json({
        status: 'Runtime Error',
        stdout: runStdout,
        error: runStderr || 'Process crashed during execution.',
        passed: 0,
        total: tests.length,
        results: [],
      });
    }

    // Parse outputs
    const lines = runStdout.split('\n');
    let testStartIndex = lines.findIndex((l: string) => l.trim() === '__TESTS_START__');
    
    let userStdoutLines: string[] = [];
    let testOutputs: Record<string, string> = {};
    let executionError: string | null = null;

    if (testStartIndex !== -1) {
      // User prints are everything before the test token
      userStdoutLines = lines.slice(0, testStartIndex);
      
      // Driver outputs are everything after
      const driverLines = lines.slice(testStartIndex + 1);
      driverLines.forEach((l: string) => {
        const trimmed = l.trim();
        if (trimmed.startsWith('TEST_1:')) {
          testOutputs['TEST_1'] = trimmed.substring(7).trim();
        } else if (trimmed.startsWith('TEST_2:')) {
          testOutputs['TEST_2'] = trimmed.substring(7).trim();
        } else if (trimmed.startsWith('RUNTIME_ERROR:') || trimmed.startsWith('ERROR:')) {
          executionError = trimmed;
        }
      });
    } else {
      userStdoutLines = lines;
    }

    // Compile results
    let passedCount = 0;
    const testResults = tests.map((t, idx) => {
      const key = `TEST_${idx + 1}`;
      const actualVal = testOutputs[key];
      
      let passed = false;
      let errorMsg: string | null = null;

      if (executionError) {
        errorMsg = executionError;
      } else if (actualVal === undefined) {
        errorMsg = 'Test case did not execute or function not found.';
      } else {
        passed = t.evalCheck(actualVal);
        if (!passed) {
          errorMsg = `Expected: ${t.output}. Got: ${actualVal}`;
        }
      }

      if (passed) passedCount++;

      return {
        testCase: idx + 1,
        input: t.input,
        expected: t.output,
        passed,
        error: errorMsg,
      };
    });

    return res.json({
      status: passedCount === tests.length ? 'Success' : 'Failed',
      stdout: userStdoutLines.join('\n') + (runStderr ? `\n\nStderr:\n${runStderr}` : ''),
      passed: passedCount,
      total: tests.length,
      results: testResults,
    });

  } catch (error: any) {
    console.error('Run code endpoint error:', error);
    return res.status(500).json({ error: error.message || 'Failed to run code.' });
  }
});

export default router;
