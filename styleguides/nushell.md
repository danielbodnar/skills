# CLAUDE.md - Nushell Code Generation Guide

## Overview

This guide provides comprehensive patterns, best practices, and examples for generating Nushell code. Nushell is a new type of shell that works with structured data, offering powerful pipelines, broad OS compatibility, and a modern command-line experience.

## Core Nushell Principles

### Everything is Data

- Nushell treats everything as structured data (tables, records, lists)
- Commands output structured data that can be piped and transformed
- Use `describe` to inspect data types

### Pipeline-Oriented

- Commands are connected via pipes (`|`)
- Data flows from left to right
- Each command transforms the data stream

### Immutable by Default

- Variables are immutable unless declared with `mut`
- Prefer functional, immutable patterns over stateful loops
- Use `each`, `map`, `filter` instead of traditional loops

## Syntax and Language Features

### Variables and Types

```nushell
# Immutable variables
let name = "World"
let count = 42
let pi = 3.14159

# Mutable variables
mut counter = 0
$counter = $counter + 1

# Accessing variables
$name
$env.PATH  # Environment variables

# Special variables
$in        # Pipeline input
$nu        # Nushell configuration
$env       # Environment variables
```

### Data Types

```nushell
# Strings
"hello" | 'world' | `backtick strings`
$"Interpolated ($variable) string"
$'Raw string with \n escape'

# Numbers
42 | 3.14 | 1.5e10 | 0x1F | 0b1010 | 0o755

# Booleans
true | false

# Dates and durations
2025-01-01 | 2hr | 3min | 4sec | 5ms

# File sizes
100b | 1kb | 2mb | 3gb | 4tb

# Lists
[1 2 3] | ["a", "b", "c"]

# Records
{ name: "Alice", age: 30 }

# Tables (list of records)
[[name age]; ["Alice" 30] ["Bob" 25]]

# Ranges
1..10      # Inclusive: 1 to 10
1..<10     # Exclusive end: 1 to 9
1..        # Unbounded
```

## Custom Commands (Functions)

### Basic Command Definition

```nushell
# Simple command
def greet [name: string] {
    $"Hello, ($name)!"
}

# Command with type annotations
def add [a: int, b: int]: int -> int {
    $a + $b
}

# Command with pipeline input
def double []: int -> int {
    $in * 2
}

# Command with implicit return
def latest-file [] {
    ls | sort-by modified | last
}
```

### Parameter Types

```nushell
# Required positional parameters
def greet [name: string, age: int] {
    $"Hello ($name), you are ($age) years old"
}

# Optional parameters with defaults
def greet [name: string = "World"] {
    $"Hello, ($name)!"
}

# Named flags (--flag)
def greet [name: string, --age: int] {
    if $age == null {
        $"Hello, ($name)!"
    } else {
        $"Hello, ($name)! You are ($age) years old."
    }
}

# Boolean switches
def greet [name: string, --caps] {
    let greeting = $"Hello, ($name)!"
    if $caps {
        $greeting | str upcase
    } else {
        $greeting
    }
}

# Rest parameters (variadic)
def multi-greet [...names: string] {
    for name in $names {
        print $"Hello, ($name)!"
    }
}
```

### Signatures and Type Constraints

```nushell
# Input/output type signatures
def inc []: int -> int { $in + 1 }
def "str stats" []: string -> record { }
def process []: list<int> -> list<int> { }

# Nothing type for side effects
def save-file [path: string]: nothing -> nothing {
    $in | save $path
}

# Any type for flexible input
def inspect []: any -> string {
    $in | describe
}
```

### Subcommands

```nushell
# Define subcommands with spaces
def "str is-alphanumeric" []: string -> bool {
    # Implementation
}

# Command groups
def "math add" [a: int, b: int] { $a + $b }
def "math sub" [a: int, b: int] { $a - $b }
def "math mul" [a: int, b: int] { $a * $b }
```

### Command Documentation

```nushell
# Document your commands
# Calculate the nth Fibonacci number
#
# This uses a recursive algorithm
# which is simple but not efficient
# for large values of n
def fib [
    n: int  # The position in the sequence
]: nothing -> int {
    if $n <= 1 { $n } else { (fib ($n - 1)) + (fib ($n - 2)) }
}
```

### Environment Commands

```nushell
# Commands that modify environment
def --env go-home [] {
    cd ~
}

def --env set-path [dir: string] {
    $env.PATH = ($env.PATH | prepend $dir)
}
```

### Wrapped Commands

```nushell
# Wrap external commands
def --wrapped ezal [...rest] {
    eza -l --icons ...$rest
}

# Conditional wrapping
def --wrapped ezal [...rest] {
    if '-G' in $rest {
        eza ...$rest
    } else {
        eza -l --icons ...$rest
    }
}
```

## Control Flow

### Conditionals

```nushell
# if/else expressions
let result = if $x > 0 {
    'positive'
} else if $x == 0 {
    'zero'
} else {
    'negative'
}

# match expressions
let result = match $value {
    1 => 'one',
    2 => 'two',
    3..10 => 'three to ten',
    _ => 'other'
}

# match with pattern matching
match $record {
    { name: "Alice", age: $a } => $"Alice is ($a) years old",
    { name: $n, age: 30 } => $"($n) is thirty",
    _ => "Unknown person"
}

# match with guards
match $foo {
    { count: $c } if $c > 10 => "many",
    { count: $c } if $c > 0 => "some",
    _ => "none"
}
```

### Loops (Use Sparingly)

```nushell
# Prefer functional approaches
[1 2 3] | each { $in * 2 }  # Better

# But loops are available when needed
mut sum = 0
for x in [1 2 3] {
    $sum = $sum + $x
}

# while loops
mut x = 0
while $x < 10 {
    print $x
    $x = $x + 1
}

# infinite loops
mut counter = 0
loop {
    if $counter > 10 { break }
    $counter = $counter + 1
}
```

### Error Handling

```nushell
# try/catch for error handling
try {
    dangerous_operation
} catch {
    print $"Error occurred: ($in)"
}

# Custom errors
error make {
    msg: "Something went wrong",
    label: {
        text: "error here",
        span: (metadata $value).span
    }
}

# Null coalescing
let result = $value? | default "fallback"
```

## Modules

### Creating Modules

```nushell
# Simple module file: math.nu
export def add [a: int, b: int] { $a + $b }
export def sub [a: int, b: int] { $a - $b }

# Module with main command
export def main [] { "Math utilities" }
export def add [a: int, b: int] { $a + $b }

# Module with environment
export-env {
    $env.MATH_PRECISION = 2
}

# Module with submodules
export module ./statistics.nu
export use ./algebra.nu
```

### Module Organization

```nushell
# File structure
my-utils/
├── mod.nu          # Main module file
├── math.nu         # Submodule
├── strings.nu      # Submodule
└── helpers.nu      # Internal helpers (not exported)

# mod.nu content
export module ./math.nu
export module ./strings.nu

# Or re-export into parent
export use ./math.nu *
export use ./strings.nu *
```

### Using Modules

```nushell
# Import entire module
use math.nu
math add 1 2

# Import all exports
use math.nu *
add 1 2

# Import specific items
use math.nu [add, sub]
use std/assert

# Import with aliases
use very-long-module-name.nu as vlm
```

### Standard Library Modules

```nushell
# Assertions for testing
use std/assert
assert equal $a $b
assert ($value > 0)

# Logging
use std/log
log info "Application started"
log error "Something went wrong"

# Formats
use std/formats *
$data | to json
$data | from yaml
```

## Testing

### Using Assertions

```nushell
use std/assert

# Basic assertions
assert true
assert ($value == expected)
assert equal $actual $expected
assert not equal $a $b
assert greater $a $b
assert less or equal $a $b

# String assertions
assert str contains $haystack $needle
assert str starts-with $string $prefix

# Custom assertions
def "assert even" [n: int] {
    assert ($n mod 2 == 0) --error-label {
        text: $"($n) is not even",
        span: (metadata $n).span
    }
}
```

### Test Organization

```nushell
# Test file: test_math.nu
use std/assert
use math.nu *

def "test addition" [] {
    assert equal (add 2 3) 5
    assert equal (add -1 1) 0
}

def "test subtraction" [] {
    assert equal (sub 5 3) 2
    assert equal (sub 0 1) -1
}

# Run tests
def main [] {
    test addition
    test subtraction
    print "All tests passed!"
}
```

### Test Framework Pattern

```nushell
use std/assert

def main [] {
    print "Running tests..."

    let test_commands = (
        scope commands
        | where ($it.type == "custom")
            and ($it.name | str starts-with "test ")
            and not ($it.name | str starts-with "ignore")
        | get name
    )

    for test in $test_commands {
        print $"Running: ($test)"
        nu -c $"source ($env.CURRENT_FILE); ($test)"
    }

    print "Tests completed!"
}

def "test example" [] {
    assert equal (1 + 1) 2
}
```

## Common Patterns

### Data Transformation

```nushell
# Filter and transform
ls | where size > 1mb | select name size modified

# Group and aggregate
ls | group-by type | transpose key value | each { |row|
    {
        type: $row.key,
        count: ($row.value | length)
    }
}

# Sort and limit
ps | sort-by cpu | last 10

# Pivot data
$data | pivot column_name value_name
```

### Working with Files

```nushell
# Read files
open data.json | from json
open data.csv | from csv
open data.txt | lines

# Write files
$data | to json | save output.json
$data | to csv | save output.csv
"text" | save output.txt

# File operations
ls **/*.rs  # Glob patterns
cd ~/projects
mkdir -p deeply/nested/directory
rm -rf old_directory
```

### String Manipulation

```nushell
# String operations
"hello" | str upcase
"WORLD" | str downcase
"  trim  " | str trim
"hello world" | str replace "world" "nushell"
"one,two,three" | split row ","

# String interpolation
let name = "Alice"
$"Hello, ($name)!"
$"2 + 2 = (2 + 2)"
```

### Working with Structured Data

```nushell
# Create tables
let data = [[name age]; ["Alice" 30] ["Bob" 25]]

# Access fields
$data | get name
$data.0.name  # First row's name
$data | select name age

# Update data
$data | upsert status "active"
$data | update age { $in + 1 }

# Merge data
$data1 | merge $data2
```

### Pipeline Patterns

```nushell
# Collect results
1..10 | each { $in * 2 } | collect

# Reduce/fold
[1 2 3 4] | reduce --fold 0 { |it, acc| $acc + $it }

# Parallel processing
1..100 | par-each { |n|
    expensive_computation $n
}

# Tee pattern (process and pass through)
ls | tee { print $"Files: ($in | length)" } | where size > 1mb
```

## Best Practices

### Code Style

```nushell
# Use descriptive command names with hyphens
def parse-config-file [] { }

# Use type annotations
def calculate [x: int, y: int]: int -> int { }

# Document complex commands
# Parse configuration from YAML file
# Returns a record with config values
def parse-config [path: string]: nothing -> record { }

# Prefer pipelines over loops
# Good
ls | each { |file| process $file }

# Avoid
for file in (ls) { process $file }
```

### Performance

```nushell
# Use lazy evaluation
1.. | each { $in * 2 } | take 10  # Only processes 10 items

# Use par-each for CPU-bound work
$large_list | par-each { expensive_op $in }

# Avoid repeated computations
let result = expensive_computation
# Use $result multiple times

# Stream processing for large data
open large_file.txt | lines | each { process_line $in }
```

### Error Handling

```nushell
# Validate inputs
def process [value: int] {
    if $value < 0 {
        error make { msg: "Value must be non-negative" }
    }
    # Process value
}

# Use try/catch for external commands
try {
    ^external-command
} catch {
    print $"Command failed: ($in)"
    # Handle error
}

# Provide helpful error messages
assert ($condition) "Expected condition to be true, but got false"
```

### Module Design

```nushell
# Export only public interface
export def public-command [] { }
def private-helper [] { }  # Not exported

# Use main for primary functionality
export def main [] { }
export def subcommand [] { }

# Group related commands
export def "db connect" [] { }
export def "db query" [] { }
export def "db close" [] { }
```

## Anti-Patterns to Avoid

### Don't Use Loops When Pipes Work

```nushell
# Bad: Using loop for transformation
mut result = []
for item in $list {
    $result = ($result | append ($item * 2))
}

# Good: Using pipeline
$list | each { $in * 2 }
```

### Don't Mutate When Immutable Works

```nushell
# Bad: Unnecessary mutation
mut sum = 0
for n in [1 2 3] {
    $sum = $sum + $n
}

# Good: Functional approach
[1 2 3] | reduce --fold 0 { |it, acc| $acc + $it }
```

### Don't Nest Deeply

```nushell
# Bad: Deep nesting
if $condition1 {
    if $condition2 {
        if $condition3 {
            # Do something
        }
    }
}

# Good: Early returns or match
if not $condition1 { return }
if not $condition2 { return }
if not $condition3 { return }
# Do something
```

### Don't Ignore Types

```nushell
# Bad: No type information
def process [data] { }

# Good: Clear types
def process [data: list<record>]: nothing -> table { }
```

## Advanced Patterns and Templates

### Command-Line Argument Parsing

```nushell
# Comprehensive argument parser with validation
def "parse arguments" [
    raw_args: string,
    command_spec: record
] -> record {
    # Parse help flag first
    if ($raw_args | str contains "--help") or ($raw_args | str contains "-h") {
        print_help $command_spec
        return {parsed: {}, help_shown: true}
    }

    # Split arguments preserving quoted strings
    let args = ($raw_args | split row ' ' | where $it != "")

    mut parsed = {}
    mut positional = []
    mut i = 0

    while $i < ($args | length) {
        let arg = ($args | get $i)

        if ($arg | str starts-with '--') {
            # Long flag handling
            let flag_name = ($arg | str replace '--' '')
            if ($i + 1) < ($args | length) {
                let next_arg = ($args | get ($i + 1))
                if not ($next_arg | str starts-with '-') {
                    $parsed = ($parsed | insert $flag_name $next_arg)
                    $i = $i + 2
                } else {
                    $parsed = ($parsed | insert $flag_name true)
                    $i = $i + 1
                }
            }
        } else {
            $positional = ($positional | append $arg)
            $i = $i + 1
        }
    }

    # Apply defaults and validate
    for spec in ($command_spec.arguments? | default []) {
        if ($spec.name not-in ($parsed | columns)) and ($spec.default? != null) {
            $parsed = ($parsed | insert $spec.name $spec.default)
        }
    }

    return {parsed: $parsed, help_shown: false}
}

# Create command specification
def "create command spec" [
    name: string,
    description: string,
    arguments: list,
    --usage: string,
    --examples: list
] -> record {
    mut spec = {
        name: $name,
        description: $description,
        arguments: $arguments
    }

    if ($usage != null) {
        $spec = ($spec | insert usage $usage)
    }

    if ($examples != null) {
        $spec = ($spec | insert examples $examples)
    }

    return $spec
}

# Create argument specification
def "create arg spec" [
    name: string,
    description: string,
    --type: string,
    --short: string,
    --required = false,
    --default: any,
    --choices: list,
    --min: int,
    --max: int
] -> record {
    mut spec = {
        name: $name,
        description: $description,
        required: $required
    }

    if ($type != null) { $spec = ($spec | insert type $type) }
    if ($short != null) { $spec = ($spec | insert short $short) }
    if ($default != null) { $spec = ($spec | insert default $default) }
    if ($choices != null) { $spec = ($spec | insert choices $choices) }
    if ($min != null) { $spec = ($spec | insert min $min) }
    if ($max != null) { $spec = ($spec | insert max $max) }

    return $spec
}
```

### Command Dispatcher Pattern

```nushell
#!/usr/bin/env nu

# Main command dispatcher with subcommands
def main [command?: string, ...args: string] {
    let available_commands = [
        "build", "test", "deploy", "status", "help"
    ]

    if ($command | is-empty) or $command == "help" {
        show_help $available_commands
        return
    }

    if $command not-in $available_commands {
        log error $"Unknown command: ($command)"
        show_help $available_commands
        exit 1
    }

    match $command {
        "build" => { main build ...$args }
        "test" => { main test ...$args }
        "deploy" => { main deploy ...$args }
        "status" => { main status ...$args }
        _ => {
            log error $"Command not implemented: ($command)"
            exit 1
        }
    }
}

# Subcommand implementation
def "main build" [
    --env: string = "development",
    --clean = false,
    --verbose = false
] {
    log info $"Building for environment: ($env)"

    if $clean {
        log info "Cleaning build directory..."
        rm -rf build/
    }

    # Build implementation
    try {
        # Build steps here
        log success "✅ Build completed successfully"
    } catch { |e|
        log error $"❌ Build failed: ($e.msg)"
        exit 1
    }
}

def show_help [commands: list<string>] {
    print "📦 Project Manager"
    print ""
    print "Usage: nu project.nu <command> [options]"
    print ""
    print "Available commands:"
    for cmd in $commands {
        print $"  ($cmd | str pad-right 10) - ($get_command_description $cmd)"
    }
}
```

### Module Organization with Types

```nushell
# modules/types.nu - Type definitions and validation
export def "validate email" [email: string] -> bool {
    $email | str contains "@" and ($email | str contains ".")
}

export def "validate url" [url: string] -> bool {
    $url | str starts-with "http://" or $url | str starts-with "https://"
}

# Create typed record with validation
export def "create user" [
    name: string,
    email: string,
    age: int,
    --role: string = "user"
] -> record {
    # Validate inputs
    if not (validate email $email) {
        error make {
            msg: "Invalid email address",
            label: {
                text: $"Email must contain @ and .: ($email)",
                span: (metadata $email).span
            }
        }
    }

    if $age < 0 or $age > 150 {
        error make {
            msg: "Invalid age",
            label: {
                text: $"Age must be between 0 and 150: ($age)",
                span: (metadata $age).span
            }
        }
    }

    # Return validated record
    {
        id: (random uuid),
        name: ($name | str trim),
        email: ($email | str trim | str downcase),
        age: $age,
        role: $role,
        created_at: (date now),
        updated_at: (date now)
    }
}
```

### Configuration Management Pattern

```nushell
# config/manager.nu - Configuration management system

# Load configuration with fallbacks
export def "load config" [
    --env: string = "development",
    --override: record = {}
] -> record {
    # Configuration hierarchy: overrides > env-specific > defaults
    let default_config = load_default_config
    let env_config = load_env_config $env
    let final_config = ($default_config | merge $env_config | merge $override)

    # Validate configuration
    validate_config $final_config

    return $final_config
}

def load_default_config [] -> record {
    {
        app: {
            name: "MyApp",
            version: "1.0.0",
            port: 8080,
            host: "localhost"
        },
        database: {
            type: "sqlite",
            path: "data/app.db"
        },
        logging: {
            level: "info",
            format: "json"
        }
    }
}

def load_env_config [env: string] -> record {
    let config_file = $"config/($env).yaml"

    if ($config_file | path exists) {
        open $config_file | from yaml
    } else {
        {}
    }
}

def validate_config [config: record] {
    # Ensure required fields exist
    let required = ["app.name", "app.port", "database.type"]

    for field in $required {
        let parts = ($field | split row ".")
        let value = try {
            $config | get $parts.0 | get $parts.1
        } catch {
            error make {
                msg: $"Required configuration field missing: ($field)"
            }
        }
    }

    # Validate port range
    if $config.app.port < 1 or $config.app.port > 65535 {
        error make {
            msg: $"Invalid port number: ($config.app.port)"
        }
    }
}
```

### Cross-Environment Orchestration

```nushell
# scripts/cross-env-orchestrator.nu

# Orchestrate tasks across multiple environments
def orchestrate [
    task: string,
    --environments: list<string> = ["python-env", "typescript-env", "rust-env"],
    --parallel = false,
    --stop-on-error = true
] {
    log info $"🎭 Orchestrating '($task)' across ($environments | length) environments"

    if $parallel {
        orchestrate_parallel $task $environments
    } else {
        orchestrate_sequential $task $environments $stop_on_error
    }
}

def orchestrate_sequential [
    task: string,
    environments: list<string>,
    stop_on_error: bool
] {
    mut results = []

    for env in $environments {
        log info $"🔧 Running ($task) in ($env)..."

        let result = try {
            execute_in_environment $env $task
            {environment: $env, status: "success", output: "Task completed"}
        } catch { |e|
            {environment: $env, status: "failed", error: $e.msg}
        }

        $results = ($results | append $result)

        if $result.status == "failed" and $stop_on_error {
            log error $"❌ Failed in ($env), stopping orchestration"
            break
        }
    }

    # Display results
    print_results $results
}

def execute_in_environment [env: string, task: string] {
    cd $env

    match $task {
        "test" => {
            match $env {
                "python-env" => { ^uv run pytest }
                "typescript-env" => { ^npm test }
                "rust-env" => { ^cargo test }
                _ => { error make {msg: $"Unknown environment: ($env)"} }
            }
        }
        "build" => {
            match $env {
                "python-env" => { ^uv build }
                "typescript-env" => { ^npm run build }
                "rust-env" => { ^cargo build --release }
                _ => { error make {msg: $"Unknown environment: ($env)"} }
            }
        }
        _ => {
            error make {msg: $"Unknown task: ($task)"}
        }
    }

    cd ..
}
```

### Comprehensive Testing Framework

```nushell
# tests/framework.nu - Testing framework

# Test runner with discovery
def "run tests" [
    --pattern: string = "test_*.nu",
    --verbose = false,
    --stop-on-failure = false
] {
    log info "🧪 Starting test runner"

    # Discover test files
    let test_files = (ls tests/**/*.nu | where name =~ $pattern | get name)

    log info $"Found ($test_files | length) test files"

    mut total_tests = 0
    mut passed_tests = 0
    mut failed_tests = []

    for file in $test_files {
        log info $"Running tests in ($file)..."

        # Source the test file
        source $file

        # Discover test functions
        let test_functions = (
            scope commands
            | where type == "custom" and ($it.name | str starts-with "test ")
            | get name
        )

        for test_fn in $test_functions {
            $total_tests = $total_tests + 1

            let result = run_single_test $test_fn $verbose

            if $result.passed {
                $passed_tests = $passed_tests + 1
                if $verbose {
                    log success $"✅ ($test_fn)"
                }
            } else {
                $failed_tests = ($failed_tests | append {
                    test: $test_fn,
                    error: $result.error
                })
                log error $"❌ ($test_fn): ($result.error)"

                if $stop_on_failure {
                    break
                }
            }
        }
    }

    # Print summary
    print ""
    print "=" * 50
    print $"📊 Test Results: ($passed_tests)/($total_tests) passed"

    if ($failed_tests | length) > 0 {
        print ""
        print "Failed tests:"
        for test in $failed_tests {
            print $"  ❌ ($test.test): ($test.error)"
        }
        exit 1
    } else {
        log success "🎉 All tests passed!"
    }
}

def run_single_test [test_name: string, verbose: bool] -> record {
    try {
        # Set up test environment
        setup_test_env

        # Run test
        do $test_name

        # Clean up
        cleanup_test_env

        {passed: true, error: null}
    } catch { |e|
        {passed: false, error: $e.msg}
    }
}

# Test assertion helpers
def assert [condition: bool, --message: string = "Assertion failed"] {
    if not $condition {
        error make {msg: $message}
    }
}

def "assert equal" [actual: any, expected: any] {
    if $actual != $expected {
        error make {
            msg: $"Expected ($expected), got ($actual)"
        }
    }
}

def "assert contains" [haystack: string, needle: string] {
    if not ($haystack | str contains $needle) {
        error make {
            msg: $"Expected '($haystack)' to contain '($needle)'"
        }
    }
}
```

### Dynamic Template Generation

```nushell
# templates/generator.nu - Template generation system

# Generate file from template
def "generate from template" [
    template_name: string,
    output_path: string,
    variables: record
] {
    log info $"📝 Generating from template: ($template_name)"

    # Load template
    let template_path = $"templates/($template_name).tpl"
    if not ($template_path | path exists) {
        error make {msg: $"Template not found: ($template_path)"}
    }

    let template = (open $template_path)

    # Process template variables
    let processed = (process_template $template $variables)

    # Ensure output directory exists
    mkdir ($output_path | path dirname)

    # Write output
    $processed | save $output_path --force
    log success $"✅ Generated: ($output_path)"
}

def process_template [template: string, variables: record] -> string {
    mut result = $template

    # Replace variables in format {{variable_name}}
    for key in ($variables | columns) {
        let value = ($variables | get $key)
        let pattern = $"\\{\\{($key)\\}\\}"
        $result = ($result | str replace --all $pattern ($value | to text))
    }

    # Process conditionals {{#if variable}} ... {{/if}}
    $result = (process_conditionals $result $variables)

    # Process loops {{#each items}} ... {{/each}}
    $result = (process_loops $result $variables)

    return $result
}

def process_conditionals [template: string, variables: record] -> string {
    mut result = $template

    # Find all conditionals
    let pattern = '\\{\\{#if ([^}]+)\\}\\}([\\s\\S]*?)\\{\\{/if\\}\\}'

    # This is simplified - real implementation would use proper regex
    # Process each conditional block

    return $result
}
```

### Logging and Error Handling Utilities

```nushell
# common/utils.nu - Common utilities

# Enhanced logging with levels and formatting
export def log [
    level: string,
    message: string,
    --data: any = null
] {
    let timestamp = (date now | format date "%Y-%m-%d %H:%M:%S")
    let color = match $level {
        "debug" => "gray"
        "info" => "blue"
        "success" => "green"
        "warning" => "yellow"
        "error" => "red"
        _ => "white"
    }

    let icon = match $level {
        "debug" => "🔍"
        "info" => "ℹ️"
        "success" => "✅"
        "warning" => "⚠️"
        "error" => "❌"
        _ => "📝"
    }

    let formatted = $"[($timestamp)] ($icon) ($message)"

    # Output to stderr for errors/warnings
    if $level in ["error", "warning"] {
        print -e $formatted
    } else {
        print $formatted
    }

    # Log additional data if provided
    if $data != null {
        print ($data | to json --indent 2)
    }

    # Also write to log file
    let log_file = "logs/app.log"
    mkdir logs
    $"[($timestamp)] [($level | str upcase)] ($message)\n" | save --append $log_file
}

# Retry mechanism for flaky operations
export def retry [
    operation: closure,
    --max-attempts: int = 3,
    --delay: duration = 1sec,
    --backoff: float = 2.0
] -> any {
    mut attempt = 1
    mut current_delay = $delay

    loop {
        log debug $"Attempt ($attempt)/($max_attempts)"

        let result = try {
            do $operation
        } catch { |e|
            if $attempt >= $max_attempts {
                log error $"All ($max_attempts) attempts failed"
                error make {msg: $"Operation failed after ($max_attempts) attempts: ($e.msg)"}
            }

            log warning $"Attempt ($attempt) failed: ($e.msg), retrying in ($current_delay)..."
            sleep $current_delay

            # Exponential backoff
            $current_delay = ($current_delay * $backoff)
            $attempt = $attempt + 1

            continue
        }

        return $result
    }
}

# Safe file operations
export def "safe save" [
    path: string,
    content: any,
    --backup = true
] {
    if $backup and ($path | path exists) {
        let backup_path = $"($path).backup.(date now | format date '%Y%m%d_%H%M%S')"
        cp $path $backup_path
        log info $"Created backup: ($backup_path)"
    }

    # Write to temporary file first
    let temp_path = $"($path).tmp"
    $content | save $temp_path

    # Atomic rename
    mv $temp_path $path --force
    log success $"Saved: ($path)"
}
```

### Environment Detection and Adaptation

```nushell
# env/detector.nu - Environment detection and adaptation

# Detect current environment and capabilities
export def "detect environment" [] -> record {
    {
        os: (sys host | get name),
        arch: (sys host | get arch),
        nu_version: (version | get version),
        shell: $nu.env.SHELL?,
        in_container: (detect_container),
        in_devbox: (detect_devbox),
        in_git_repo: (detect_git),
        available_tools: (detect_available_tools)
    }
}

def detect_container [] -> bool {
    # Check for Docker or Podman
    ("/proc/1/cgroup" | path exists) and (
        open /proc/1/cgroup | str contains "docker" or
        open /proc/1/cgroup | str contains "podman"
    ) or ("/.dockerenv" | path exists)
}

def detect_devbox [] -> bool {
    ($env.DEVBOX_SHELL_ENABLED? | default false) == true
}

def detect_git [] -> bool {
    try {
        git rev-parse --git-dir | complete | get exit_code
    } | default 1 == 0
}

def detect_available_tools [] -> record {
    let tools = ["docker", "git", "python", "node", "cargo", "go"]

    mut available = {}
    for tool in $tools {
        let exists = (which $tool | is-not-empty)
        if $exists {
            let version = try {
                match $tool {
                    "python" => (^python --version 2>&1 | str trim)
                    "node" => (^node --version | str trim)
                    _ => "unknown"
                }
            } catch { "error" }
            $available = ($available | insert $tool {exists: true, version: $version})
        } else {
            $available = ($available | insert $tool {exists: false, version: null})
        }
    }

    $available
}
```

### Advanced Features

### Overlays

```nushell
# Create overlay from module
module spam {
    export def foo [] { "foo" }
    export-env { $env.BAZ = "baz" }
}

overlay use spam
overlay list
overlay hide spam
```

### Parse-Time Constants

```nushell
# Define constants for performance
const CONFIG_DIR = $nu.default-config-dir | path join "myapp"
const MAX_RETRIES = 3

# Use in commands
def load-config [] {
    open $CONFIG_DIR | path join "config.toml"
}
```

### Custom Completions

```nushell
# Define custom completion
def animals [] {
    ["cat", "dog", "hamster"]
}

# Use in command
export def feed [pet: string@animals] {
    $"Feeding ($pet)"
}
```

### Scope Introspection

```nushell
# Inspect available commands
scope commands | where type == "custom"

# Inspect modules
scope modules

# Inspect variables
scope variables
```

## References and Resources

### Official Documentation

- [Nushell Book](https://www.nushell.sh/book/) - Main documentation
- [Nushell Commands](https://www.nushell.sh/commands/) - Command reference
- [Nushell Cookbook](https://www.nushell.sh/cookbook/) - Recipes and patterns
- [Nushell Blog](https://www.nushell.sh/blog/) - Updates and articles

### Key Documentation Pages

- [Custom Commands](https://www.nushell.sh/book/custom_commands.html) - Defining functions
- [Modules](https://www.nushell.sh/book/modules.html) - Code organization
- [Control Flow](https://www.nushell.sh/book/control_flow.html) - Conditionals and loops
- [Testing](https://www.nushell.sh/book/testing.html) - Writing tests
- [Pipelines](https://www.nushell.sh/book/pipelines.html) - Core concept
- [Working with Lists](https://www.nushell.sh/book/working_with_lists.html) - Data manipulation
- [Environment](https://www.nushell.sh/book/environment.html) - Environment variables

### Community Resources

- [GitHub Repository](https://github.com/nushell/nushell) - Source code
- [Discord Server](https://discord.gg/NtAbbGn) - Community chat
- [Awesome Nushell](https://github.com/nushell/awesome-nu) - Curated list of resources
- [Nu Scripts](https://github.com/nushell/nu_scripts) - Example scripts

### Related Tools

- [Nupm](https://github.com/nushell/nupm) - Package manager for Nushell
- [Nushell Plugins](https://github.com/nushell/nushell/tree/main/crates/nu_plugin_*) - Extension system

## Version Information

This guide is based on Nushell 0.107.0 (current version as of 2025). Check your version with:

```nushell
version | get version
```

Update to the latest version for all features described in this guide.
