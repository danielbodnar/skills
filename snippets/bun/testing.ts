// Bun Testing Examples

import { 
  test, 
  expect, 
  describe, 
  beforeAll, 
  afterAll, 
  beforeEach, 
  afterEach,
  mock,
  spyOn,
  jest
} from "bun:test";

// 1. Basic Test Structure
describe("Basic Tests", () => {
  test("simple assertion", () => {
    expect(2 + 2).toBe(4);
    expect("hello").toEqual("hello");
    expect([1, 2, 3]).toContain(2);
  });
  
  test("async test", async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });
  
  test("test with timeout", async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(true).toBe(true);
  }, 5000); // 5 second timeout
});

// 2. Setup and Teardown
describe("Lifecycle Hooks", () => {
  let testData: any;
  
  beforeAll(() => {
    console.log("Setting up test suite");
    testData = { initialized: true };
  });
  
  afterAll(() => {
    console.log("Cleaning up test suite");
    testData = null;
  });
  
  beforeEach(() => {
    console.log("Before each test");
  });
  
  afterEach(() => {
    console.log("After each test");
  });
  
  test("uses setup data", () => {
    expect(testData.initialized).toBe(true);
  });
});

// 3. Mocking Functions
describe("Mocking", () => {
  test("mock function", () => {
    const mockFn = mock(() => "mocked!");
    expect(mockFn()).toBe("mocked!");
    expect(mockFn).toHaveBeenCalled();
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
  
  test("mock with implementation", () => {
    const mockMath = mock((a: number, b: number) => a * b);
    expect(mockMath(2, 3)).toBe(6);
    expect(mockMath).toHaveBeenCalledWith(2, 3);
  });
  
  test("jest.fn compatibility", () => {
    const jestMock = jest.fn(() => "jest mock");
    expect(jestMock()).toBe("jest mock");
    expect(jestMock).toHaveBeenCalled();
  });
});

// 4. Spying on Objects
describe("Spying", () => {
  const mathUtils = {
    add: (a: number, b: number) => a + b,
    multiply: (a: number, b: number) => a * b,
  };
  
  test("spy on method", () => {
    const addSpy = spyOn(mathUtils, "add");
    
    const result = mathUtils.add(2, 3);
    expect(result).toBe(5);
    expect(addSpy).toHaveBeenCalledWith(2, 3);
  });
  
  test("spy with mock implementation", () => {
    const multiplySpy = spyOn(mathUtils, "multiply").mockImplementation(
      (a, b) => a + b // Change behavior
    );
    
    const result = mathUtils.multiply(2, 3);
    expect(result).toBe(5); // Now returns addition instead
    expect(multiplySpy).toHaveBeenCalledWith(2, 3);
  });
});

// 5. Testing HTTP Requests
describe("HTTP Testing", () => {
  test("fetch request", async () => {
    // Mock fetch if needed
    const mockFetch = mock(() => 
      Promise.resolve(new Response(JSON.stringify({ id: 1 })))
    );
    
    globalThis.fetch = mockFetch;
    
    const response = await fetch("/api/user/1");
    const data = await response.json();
    
    expect(data).toEqual({ id: 1 });
    expect(mockFetch).toHaveBeenCalledWith("/api/user/1");
  });
});

// 6. Testing File Operations
describe("File Operations", () => {
  test("file reading", async () => {
    // Create test file
    await Bun.write("test-file.txt", "test content");
    
    const content = await Bun.file("test-file.txt").text();
    expect(content).toBe("test content");
    
    // Cleanup
    await Bun.spawn(["rm", "test-file.txt"]);
  });
  
  test("JSON file handling", async () => {
    const testData = { name: "test", value: 42 };
    await Bun.write("test.json", JSON.stringify(testData));
    
    const loadedData = await Bun.file("test.json").json();
    expect(loadedData).toEqual(testData);
    
    // Cleanup
    await Bun.spawn(["rm", "test.json"]);
  });
});

// 7. Testing Bun Server
describe("Server Testing", () => {
  test("basic server response", async () => {
    const server = {
      port: 0, // Use random port
      fetch(request: Request) {
        const url = new URL(request.url);
        if (url.pathname === "/health") {
          return new Response("OK");
        }
        return new Response("Not Found", { status: 404 });
      },
    };
    
    // Test the fetch handler directly
    const request = new Request("http://localhost/health");
    const response = await server.fetch(request);
    
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("OK");
  });
});

// 8. Error Testing
describe("Error Handling", () => {
  test("expect error to be thrown", () => {
    const throwError = () => {
      throw new Error("Something went wrong");
    };
    
    expect(throwError).toThrow("Something went wrong");
    expect(throwError).toThrow(Error);
  });
  
  test("async error handling", async () => {
    const asyncError = async () => {
      throw new Error("Async error");
    };
    
    await expect(asyncError()).rejects.toThrow("Async error");
  });
});

// 9. Snapshot Testing
describe("Snapshot Testing", () => {
  test("object snapshot", () => {
    const data = {
      id: 1,
      name: "John Doe",
      active: true,
      tags: ["admin", "user"],
    };
    
    expect(data).toMatchSnapshot();
  });
});

// 10. Custom Matchers
expect.extend({
  toBeEven(received: number) {
    const pass = received % 2 === 0;
    return {
      pass,
      message: () => `Expected ${received} to be even`,
    };
  },
});

describe("Custom Matchers", () => {
  test("custom matcher", () => {
    expect(4).toBeEven();
    expect(3).not.toBeEven();
  });
});

// 11. Testing Environment Variables
describe("Environment Testing", () => {
  test("environment variables", () => {
    // Set test environment variable
    process.env.TEST_VAR = "test-value";
    
    expect(process.env.TEST_VAR).toBe("test-value");
    
    // Cleanup
    delete process.env.TEST_VAR;
  });
});

// 12. Concurrent Tests
describe("Concurrent Testing", () => {
  test.concurrent("concurrent test 1", async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(true).toBe(true);
  });
  
  test.concurrent("concurrent test 2", async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(true).toBe(true);
  });
});

// 13. Skip and Only
describe("Test Control", () => {
  test.skip("skipped test", () => {
    // This test will be skipped
    expect(false).toBe(true);
  });
  
  test.todo("todo test"); // Placeholder for future test
  
  // Use test.only to run only this test
  // test.only("only this test", () => {
  //   expect(true).toBe(true);
  // });
});

// 14. Testing with Happy DOM (for browser-like environment)
// Add to bunfig.toml: [test] preload = ["./test-setup.ts"]
/*
// test-setup.ts
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
*/

describe("DOM Testing", () => {
  test("DOM manipulation", () => {
    // This would work with happy-dom setup
    // document.body.innerHTML = '<div id="test">Hello</div>';
    // const element = document.getElementById("test");
    // expect(element?.textContent).toBe("Hello");
  });
});

// 15. Performance Testing
describe("Performance", () => {
  test("performance timing", () => {
    const start = performance.now();
    
    // Some operation
    for (let i = 0; i < 1000; i++) {
      Math.sqrt(i);
    }
    
    const end = performance.now();
    const duration = end - start;
    
    expect(duration).toBeLessThan(100); // Should complete in less than 100ms
  });
});

// Export test utilities for reuse
export const testUtils = {
  createMockRequest: (url: string, options?: RequestInit) => {
    return new Request(url, options);
  },
  
  createMockResponse: (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  },
  
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};