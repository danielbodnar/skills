# Rust Reference

**Always remember to reference @$HOME/.claude/references/rust.md and look for snippets and examples in @$HOME/.claude/snippets/rust/**

## Quick Reference

- Installation: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- Current Version: Rust 1.85.0 (2025-02-17) with 2024 edition
- Package Manager: Cargo
- Documentation: <https://doc.rust-lang.org/>
- GitHub: <https://github.com/rust-lang/rust>
- Community: <https://users.rust-lang.org/>

## Default Usage Patterns

Rust is a systems programming language focused on safety, speed, and concurrency:

- **Memory Safety**: Zero-cost abstractions with compile-time memory safety guarantees
- **Ownership System**: Unique ownership model that prevents data races and memory leaks
- **Performance**: Zero-cost abstractions with predictable performance
- **Concurrency**: Safe, fast concurrent programming with ownership-based thread safety
- **Type System**: Powerful static type system with type inference
- **Pattern Matching**: Comprehensive pattern matching with `match` expressions
- **Error Handling**: Explicit error handling with `Result<T, E>` and `Option<T>`
- **Trait System**: Flexible composition via traits (similar to interfaces)

## Core Concepts

### Ownership System

- **Ownership**: Each value has a single owner
- **Borrowing**: References that don't transfer ownership
- **Lifetimes**: Ensuring references are valid for their usage scope
- **Move Semantics**: Values are moved by default, not copied

### Memory Safety

- **No Garbage Collector**: Manual memory management with compile-time checks
- **Zero-cost Abstractions**: High-level features with no runtime overhead
- **Borrow Checker**: Compile-time verification of memory safety
- **RAII (Resource Acquisition Is Initialization)**: Automatic resource cleanup

### Type System

- **Static Typing**: All types known at compile time
- **Type Inference**: Compiler deduces types where possible
- **Generics**: Parameterized types and functions
- **Traits**: Shared behavior across types
- **Pattern Matching**: Exhaustive matching with `match`

## Installation and Setup

### Rustup (Recommended)

```bash
# Install Rust through rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Source the environment
source ~/.cargo/env

# Verify installation
rustc --version
cargo --version
```

### Update Rust

```bash
# Update to latest stable
rustup update stable

# Update all components
rustup update
```

### Toolchain Management

```bash
# Install specific toolchain
rustup toolchain install nightly

# Set default toolchain
rustup default stable

# Use specific toolchain for project
rustup override set nightly
```

## Project Structure

### Creating New Project

```bash
# Create binary project
cargo new my_project
cd my_project

# Create library project
cargo new --lib my_library

# Initialize in existing directory
cargo init
```

### Standard Project Layout

```
my_project/
├── Cargo.toml          # Package manifest
├── Cargo.lock          # Lock file (auto-generated)
├── src/
│   ├── main.rs         # Binary entry point
│   ├── lib.rs          # Library root
│   └── bin/            # Additional binaries
├── tests/              # Integration tests
├── examples/           # Example code
├── benches/           # Benchmarks
└── target/            # Build artifacts (auto-generated)
```

### Cargo.toml Configuration

```toml
[package]
name = "my_project"
version = "0.1.0"
edition = "2024"
authors = ["Your Name <email@example.com>"]
license = "MIT OR Apache-2.0"
description = "A brief description"
repository = "https://github.com/username/repo"
keywords = ["cli", "tool"]
categories = ["command-line-utilities"]

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.0", features = ["full"] }
clap = { version = "4.0", features = ["derive"] }

[dev-dependencies]
criterion = "0.5"

[[bin]]
name = "my_binary"
path = "src/bin/my_binary.rs"

[features]
default = ["std"]
std = []
experimental = []
```

## Core Language Features

### Variables and Mutability

```rust
// Immutable by default
let x = 5;
// x = 6; // Error: cannot assign twice to immutable variable

// Mutable variables
let mut y = 5;
y = 6; // OK

// Constants
const MAX_POINTS: u32 = 100_000;

// Shadowing
let x = 5;
let x = x + 1; // New variable, shadows previous
let x = "hello"; // Different type, shadows previous
```

### Data Types

```rust
// Scalar types
let integer: i32 = 42;
let float: f64 = 3.14;
let boolean: bool = true;
let character: char = '🦀';

// Compound types
let tuple: (i32, f64, bool) = (42, 3.14, true);
let array: [i32; 5] = [1, 2, 3, 4, 5];

// String types
let string_literal: &str = "Hello, world!";
let owned_string: String = String::from("Hello, world!");

// Collections
let vector: Vec<i32> = vec![1, 2, 3, 4, 5];
let hash_map: std::collections::HashMap<String, i32> = std::collections::HashMap::new();
```

### Functions

```rust
// Basic function
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

// Function with multiple parameters
fn calculate(x: i32, y: i32) -> i32 {
    x + y // Expression, no semicolon
}

// Function with no return value (returns unit type ())
fn print_message(msg: &str) {
    println!("{}", msg);
}

// Generic function
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}
```

### Ownership and Borrowing

```rust
// Ownership transfer (move)
fn take_ownership(s: String) {
    println!("{}", s);
} // s goes out of scope and is dropped

// Borrowing (immutable reference)
fn calculate_length(s: &String) -> usize {
    s.len()
} // s goes out of scope, but nothing happens (no ownership)

// Mutable borrowing
fn change(s: &mut String) {
    s.push_str(", world!");
}

// Usage
let s1 = String::from("hello");
let len = calculate_length(&s1); // Borrow s1

let mut s2 = String::from("hello");
change(&mut s2); // Mutable borrow
```

### Error Handling

```rust
use std::fs::File;
use std::io::ErrorKind;

// Result type for recoverable errors
fn read_file(filename: &str) -> Result<String, std::io::Error> {
    std::fs::read_to_string(filename)
}

// Using Result with match
match read_file("hello.txt") {
    Ok(contents) => println!("File contents: {}", contents),
    Err(error) => println!("Error reading file: {}", error),
}

// Using ? operator for error propagation
fn read_and_process() -> Result<String, std::io::Error> {
    let contents = std::fs::read_to_string("data.txt")?;
    Ok(contents.to_uppercase())
}

// Option type for nullable values
fn find_character(s: &str, ch: char) -> Option<usize> {
    s.find(ch)
}

// Using Option
if let Some(index) = find_character("hello", 'e') {
    println!("Found 'e' at index: {}", index);
}
```

### Pattern Matching

```rust
// Match expressions
fn describe_number(x: i32) -> &'static str {
    match x {
        0 => "zero",
        1..=5 => "small",
        6..=10 => "medium",
        _ => "large",
    }
}

// Destructuring tuples
let point = (3, 5);
match point {
    (0, 0) => println!("Origin"),
    (0, y) => println!("On Y-axis at {}", y),
    (x, 0) => println!("On X-axis at {}", x),
    (x, y) => println!("Point at ({}, {})", x, y),
}

// If let for simple pattern matching
let some_value = Some(3);
if let Some(value) = some_value {
    println!("Got a value: {}", value);
}
```

### Structs and Enums

```rust
// Struct definition
#[derive(Debug, Clone, PartialEq)]
struct Rectangle {
    width: u32,
    height: u32,
}

// Struct implementation
impl Rectangle {
    // Associated function (constructor)
    fn new(width: u32, height: u32) -> Self {
        Rectangle { width, height }
    }
    
    // Method
    fn area(&self) -> u32 {
        self.width * self.height
    }
    
    // Mutable method
    fn double(&mut self) {
        self.width *= 2;
        self.height *= 2;
    }
}

// Enum definition
#[derive(Debug, Clone)]
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

// Enum implementation
impl Message {
    fn process(&self) {
        match self {
            Message::Quit => println!("Quit message"),
            Message::Move { x, y } => println!("Move to ({}, {})", x, y),
            Message::Write(text) => println!("Write: {}", text),
            Message::ChangeColor(r, g, b) => println!("Change color to ({}, {}, {})", r, g, b),
        }
    }
}
```

### Traits

```rust
// Trait definition
trait Drawable {
    fn draw(&self);
    
    // Default implementation
    fn describe(&self) {
        println!("This is a drawable object");
    }
}

// Trait implementation
impl Drawable for Rectangle {
    fn draw(&self) {
        println!("Drawing rectangle {}x{}", self.width, self.height);
    }
}

// Generic function with trait bounds
fn draw_something<T: Drawable>(item: T) {
    item.describe();
    item.draw();
}

// Multiple trait bounds
fn process_item<T: Drawable + Clone>(item: T) {
    let copy = item.clone();
    copy.draw();
}

// Where clause for complex bounds
fn complex_function<T, U>(t: T, u: U) -> String
where
    T: std::fmt::Display + Clone,
    U: std::fmt::Debug,
{
    format!("T: {}, U: {:?}", t, u)
}
```

### Generics and Lifetimes

```rust
// Generic struct
#[derive(Debug)]
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn new(x: T, y: T) -> Self {
        Point { x, y }
    }
    
    fn x(&self) -> &T {
        &self.x
    }
}

// Lifetimes
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

// Struct with lifetimes
#[derive(Debug)]
struct ImportantExcerpt<'a> {
    part: &'a str,
}

impl<'a> ImportantExcerpt<'a> {
    fn announce_and_return_part(&self, announcement: &str) -> &str {
        println!("Attention please: {}", announcement);
        self.part
    }
}
```

## Standard Library Essentials

### Collections

```rust
use std::collections::{HashMap, HashSet, BTreeMap, VecDeque};

// Vector
let mut vec = Vec::new();
vec.push(1);
vec.push(2);
let numbers = vec![1, 2, 3, 4, 5];

// HashMap
let mut scores = HashMap::new();
scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Red"), 50);

// HashSet
let mut set = HashSet::new();
set.insert(1);
set.insert(2);

// BTreeMap (sorted)
let mut map = BTreeMap::new();
map.insert("key1", "value1");

// VecDeque (double-ended queue)
let mut deque = VecDeque::new();
deque.push_back(1);
deque.push_front(0);
```

### Iterators

```rust
let numbers = vec![1, 2, 3, 4, 5];

// Iterator adapters (lazy)
let doubled: Vec<i32> = numbers
    .iter()
    .map(|x| x * 2)
    .filter(|&x| x > 4)
    .collect();

// Iterator consumption
let sum: i32 = numbers.iter().sum();
let max = numbers.iter().max();

// for_each
numbers.iter().for_each(|x| println!("{}", x));

// Custom iterator
for (index, value) in numbers.iter().enumerate() {
    println!("Index: {}, Value: {}", index, value);
}

// Range iterators
for i in 0..10 {
    println!("{}", i);
}

// Infinite iterators
let infinite = (0..).map(|x| x * x);
let first_10_squares: Vec<i32> = infinite.take(10).collect();
```

### String Handling

```rust
// String creation
let s1 = String::new();
let s2 = String::from("hello");
let s3 = "world".to_string();

// String manipulation
let mut s = String::from("Hello");
s.push_str(", world!");
s.push('!');

// String formatting
let formatted = format!("Hello, {}! You are {} years old.", "Alice", 30);

// String slicing
let hello = "Hello, world!";
let hello_slice = &hello[0..5];  // "Hello"
let world_slice = &hello[7..];   // "world!"

// String methods
let text = "  Hello, World!  ";
let trimmed = text.trim();
let uppercase = text.to_uppercase();
let replaced = text.replace("World", "Rust");

// String parsing
let number: i32 = "42".parse().expect("Not a number!");
let number_result: Result<i32, _> = "42".parse();
```

### File I/O

```rust
use std::fs::{File, OpenOptions};
use std::io::{self, Read, Write, BufRead, BufReader, BufWriter};
use std::path::Path;

// Reading files
fn read_file_to_string(filename: &str) -> io::Result<String> {
    std::fs::read_to_string(filename)
}

// Writing files
fn write_to_file(filename: &str, content: &str) -> io::Result<()> {
    std::fs::write(filename, content)
}

// Buffered reading
fn read_lines(filename: &str) -> io::Result<Vec<String>> {
    let file = File::open(filename)?;
    let reader = BufReader::new(file);
    reader.lines().collect()
}

// Buffered writing
fn write_lines(filename: &str, lines: &[String]) -> io::Result<()> {
    let file = File::create(filename)?;
    let mut writer = BufWriter::new(file);
    
    for line in lines {
        writeln!(writer, "{}", line)?;
    }
    
    writer.flush()
}

// Working with paths
let path = Path::new("./data/file.txt");
if path.exists() {
    println!("File exists");
}

let parent = path.parent();
let filename = path.file_name();
let extension = path.extension();
```

## Concurrency and Threading

### Basic Threading

```rust
use std::thread;
use std::time::Duration;

// Spawning threads
let handle = thread::spawn(|| {
    for i in 1..10 {
        println!("Thread: {}", i);
        thread::sleep(Duration::from_millis(1));
    }
});

// Wait for thread to finish
handle.join().unwrap();

// Moving data into threads
let data = vec![1, 2, 3, 4, 5];
let handle = thread::spawn(move || {
    println!("Thread got: {:?}", data);
});

handle.join().unwrap();
```

### Shared State with Mutex

```rust
use std::sync::{Arc, Mutex};
use std::thread;

// Shared counter
let counter = Arc::new(Mutex::new(0));
let mut handles = vec![];

for _ in 0..10 {
    let counter = Arc::clone(&counter);
    let handle = thread::spawn(move || {
        let mut num = counter.lock().unwrap();
        *num += 1;
    });
    handles.push(handle);
}

for handle in handles {
    handle.join().unwrap();
}

println!("Result: {}", *counter.lock().unwrap());
```

### Channels for Message Passing

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

// Single producer, single consumer
let (tx, rx) = mpsc::channel();

thread::spawn(move || {
    let vals = vec![
        String::from("hi"),
        String::from("from"),
        String::from("the"),
        String::from("thread"),
    ];

    for val in vals {
        tx.send(val).unwrap();
        thread::sleep(Duration::from_secs(1));
    }
});

for received in rx {
    println!("Got: {}", received);
}

// Multiple producers
let (tx, rx) = mpsc::channel();

for i in 0..3 {
    let tx_clone = tx.clone();
    thread::spawn(move || {
        tx_clone.send(format!("Message from thread {}", i)).unwrap();
    });
}

drop(tx); // Close the channel

for received in rx {
    println!("Received: {}", received);
}
```

## Build System and Cargo

### Common Cargo Commands

```bash
# Create new project
cargo new my_project
cargo new --lib my_library

# Build project
cargo build                    # Debug build
cargo build --release         # Release build
cargo build --target x86_64-pc-windows-gnu  # Cross-compile

# Run project
cargo run                      # Run main binary
cargo run --bin my_binary      # Run specific binary
cargo run --example my_example # Run example

# Test project
cargo test                     # Run all tests
cargo test integration_test    # Run specific test
cargo test --doc              # Run documentation tests

# Check project
cargo check                    # Fast compile check
cargo clippy                   # Linting
cargo fmt                     # Format code

# Documentation
cargo doc                     # Generate documentation
cargo doc --open             # Generate and open docs

# Package management
cargo update                  # Update dependencies
cargo tree                   # Show dependency tree
cargo audit                  # Security audit

# Publishing
cargo publish                 # Publish to crates.io
cargo package                # Create package archive
```

### Workspace Configuration

```toml
# Cargo.toml in workspace root
[workspace]
members = [
    "app",
    "library",
    "shared",
]

[workspace.dependencies]
serde = "1.0"
tokio = "1.0"

# In member crate Cargo.toml
[package]
name = "app"
version = "0.1.0"
edition = "2024"

[dependencies]
serde = { workspace = true, features = ["derive"] }
library = { path = "../library" }
```

### Custom Build Scripts

```rust
// build.rs
use std::env;
use std::path::PathBuf;

fn main() {
    // Tell cargo to rerun if environment changes
    println!("cargo:rerun-if-env-changed=MY_ENV_VAR");
    
    // Set environment variable for the build
    println!("cargo:rustc-env=BUILD_TIME={}", chrono::Utc::now());
    
    // Link to external library
    println!("cargo:rustc-link-lib=ssl");
    println!("cargo:rustc-link-search=native=/usr/local/lib");
    
    // Generate bindings
    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        .parse_callbacks(Box::new(bindgen::CargoCallbacks::new()))
        .generate()
        .expect("Unable to generate bindings");

    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap());
    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("Couldn't write bindings!");
}
```

## Testing

### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_addition() {
        assert_eq!(2 + 2, 4);
    }

    #[test]
    fn test_with_result() -> Result<(), String> {
        if 2 + 2 == 4 {
            Ok(())
        } else {
            Err(String::from("Math is broken"))
        }
    }

    #[test]
    #[should_panic(expected = "divide by zero")]
    fn test_panic() {
        let _result = 10 / 0;
    }

    #[test]
    #[ignore]
    fn expensive_test() {
        // This test is ignored by default
        // Run with: cargo test -- --ignored
    }
}
```

### Integration Tests

```rust
// tests/integration_test.rs
use my_crate;

#[test]
fn integration_test() {
    assert_eq!(my_crate::add(2, 2), 4);
}

// tests/common/mod.rs
pub fn setup() {
    // Common test setup code
}

// tests/another_test.rs
mod common;

#[test]
fn test_with_setup() {
    common::setup();
    // Test code here
}
```

### Benchmarking with Criterion

```rust
// benches/benchmark.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion};
use my_crate::fibonacci;

fn criterion_benchmark(c: &mut Criterion) {
    c.bench_function("fib 20", |b| b.iter(|| fibonacci(black_box(20))));
    
    c.bench_function("fib group", |b| {
        b.iter(|| {
            for i in 0..100 {
                fibonacci(black_box(i));
            }
        })
    });
}

criterion_group!(benches, criterion_benchmark);
criterion_main!(benches);
```

## Best Practices

### Code Organization

```rust
// Use modules for organization
mod network {
    pub mod http {
        pub fn get(url: &str) -> Result<String, Error> {
            // Implementation
        }
    }
    
    pub mod websocket {
        pub struct Connection;
        
        impl Connection {
            pub fn new() -> Self {
                Connection
            }
        }
    }
}

// Re-export for convenience
pub use network::http::get;
pub use network::websocket::Connection;
```

### Error Handling Patterns

```rust
use std::error::Error;
use std::fmt;

// Custom error type
#[derive(Debug)]
enum MyError {
    Io(std::io::Error),
    Parse(std::num::ParseIntError),
    Custom(String),
}

impl fmt::Display for MyError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            MyError::Io(err) => write!(f, "IO error: {}", err),
            MyError::Parse(err) => write!(f, "Parse error: {}", err),
            MyError::Custom(msg) => write!(f, "Error: {}", msg),
        }
    }
}

impl Error for MyError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            MyError::Io(err) => Some(err),
            MyError::Parse(err) => Some(err),
            MyError::Custom(_) => None,
        }
    }
}

// Error conversion
impl From<std::io::Error> for MyError {
    fn from(err: std::io::Error) -> Self {
        MyError::Io(err)
    }
}

impl From<std::num::ParseIntError> for MyError {
    fn from(err: std::num::ParseIntError) -> Self {
        MyError::Parse(err)
    }
}

// Using the error type
fn process_file(filename: &str) -> Result<i32, MyError> {
    let contents = std::fs::read_to_string(filename)?;
    let number: i32 = contents.trim().parse()?;
    Ok(number * 2)
}
```

### Performance Tips

```rust
// Use iterators instead of index-based loops
let numbers = vec![1, 2, 3, 4, 5];

// Prefer this
let sum: i32 = numbers.iter().sum();

// Over this
let mut sum = 0;
for i in 0..numbers.len() {
    sum += numbers[i];
}

// Use Vec::with_capacity when size is known
let mut vec = Vec::with_capacity(1000);
for i in 0..1000 {
    vec.push(i);
}

// Use references to avoid unnecessary clones
fn process_string(s: &str) -> String {
    s.to_uppercase()
}

// Use Cow for conditional cloning
use std::borrow::Cow;

fn process_text(text: &str) -> Cow<str> {
    if text.contains("rust") {
        Cow::Owned(text.replace("rust", "Rust"))
    } else {
        Cow::Borrowed(text)
    }
}
```

### Memory Management

```rust
// Use Box for heap allocation
let boxed_value = Box::new(42);

// Use Rc for shared ownership (single-threaded)
use std::rc::Rc;
let shared = Rc::new(vec![1, 2, 3]);
let reference1 = Rc::clone(&shared);
let reference2 = Rc::clone(&shared);

// Use Arc for shared ownership (multi-threaded)
use std::sync::Arc;
let shared = Arc::new(vec![1, 2, 3]);
let reference1 = Arc::clone(&shared);

// Use RefCell for interior mutability
use std::cell::RefCell;
let value = RefCell::new(42);
*value.borrow_mut() = 84;

// Combine Rc and RefCell for shared mutable data
let shared_data = Rc::new(RefCell::new(vec![1, 2, 3]));
shared_data.borrow_mut().push(4);
```

## Common Patterns

### Builder Pattern

```rust
#[derive(Debug)]
struct Config {
    host: String,
    port: u16,
    timeout: u64,
    retries: u32,
}

impl Config {
    fn builder() -> ConfigBuilder {
        ConfigBuilder::default()
    }
}

#[derive(Default)]
struct ConfigBuilder {
    host: Option<String>,
    port: Option<u16>,
    timeout: Option<u64>,
    retries: Option<u32>,
}

impl ConfigBuilder {
    fn host(mut self, host: impl Into<String>) -> Self {
        self.host = Some(host.into());
        self
    }
    
    fn port(mut self, port: u16) -> Self {
        self.port = Some(port);
        self
    }
    
    fn timeout(mut self, timeout: u64) -> Self {
        self.timeout = Some(timeout);
        self
    }
    
    fn retries(mut self, retries: u32) -> Self {
        self.retries = Some(retries);
        self
    }
    
    fn build(self) -> Result<Config, &'static str> {
        Ok(Config {
            host: self.host.ok_or("host is required")?,
            port: self.port.unwrap_or(8080),
            timeout: self.timeout.unwrap_or(30),
            retries: self.retries.unwrap_or(3),
        })
    }
}

// Usage
let config = Config::builder()
    .host("localhost")
    .port(3000)
    .timeout(60)
    .build()?;
```

### State Machine Pattern

```rust
#[derive(Debug)]
struct Connection<State> {
    state: State,
}

#[derive(Debug)]
struct Disconnected;

#[derive(Debug)]
struct Connected {
    socket: std::net::TcpStream,
}

#[derive(Debug)]
struct Authenticated {
    socket: std::net::TcpStream,
    user: String,
}

impl Connection<Disconnected> {
    fn new() -> Self {
        Connection {
            state: Disconnected,
        }
    }
    
    fn connect(self, addr: &str) -> Result<Connection<Connected>, std::io::Error> {
        let socket = std::net::TcpStream::connect(addr)?;
        Ok(Connection {
            state: Connected { socket },
        })
    }
}

impl Connection<Connected> {
    fn authenticate(self, user: String) -> Connection<Authenticated> {
        Connection {
            state: Authenticated {
                socket: self.state.socket,
                user,
            },
        }
    }
}

impl Connection<Authenticated> {
    fn send_message(&mut self, message: &str) -> std::io::Result<()> {
        use std::io::Write;
        writeln!(self.state.socket, "{}", message)
    }
}
```

## Development Tools

### Formatting and Linting

```bash
# Format code
cargo fmt

# Check formatting
cargo fmt -- --check

# Lint code
cargo clippy

# Lint with all features
cargo clippy --all-features --all-targets

# Fix lint warnings automatically
cargo clippy --fix
```

### Documentation

```rust
//! This is a crate-level documentation comment.
//! 
//! # Examples
//! 
//! ```
//! use my_crate::function;
//! assert_eq!(function(2, 2), 4);
//! ```

/// This function adds two numbers.
/// 
/// # Arguments
/// 
/// * `a` - The first number
/// * `b` - The second number
/// 
/// # Examples
/// 
/// ```
/// assert_eq!(add(2, 2), 4);
/// ```
/// 
/// # Panics
/// 
/// This function doesn't panic.
/// 
/// # Errors
/// 
/// This function doesn't return errors.
/// 
/// # Safety
/// 
/// This function is safe to call.
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

### Debugging

```rust
// Debug printing
#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}

let point = Point { x: 1, y: 2 };
println!("{:?}", point);      // Debug format
println!("{:#?}", point);     // Pretty debug format
dbg!(point);                  // Debug macro with location

// Conditional compilation for debug builds
#[cfg(debug_assertions)]
println!("Debug build");

#[cfg(not(debug_assertions))]
println!("Release build");

// Debug-only code
debug_assert_eq!(2 + 2, 4);
debug_assert!(true);
```

## Cross-Platform Development

### Platform-Specific Code

```rust
#[cfg(target_os = "windows")]
fn platform_specific() {
    println!("Running on Windows");
}

#[cfg(target_os = "linux")]
fn platform_specific() {
    println!("Running on Linux");
}

#[cfg(target_os = "macos")]
fn platform_specific() {
    println!("Running on macOS");
}

#[cfg(unix)]
fn unix_specific() {
    println!("Running on Unix-like system");
}

#[cfg(not(target_os = "windows"))]
fn non_windows() {
    println!("Not running on Windows");
}
```

### Feature Flags

```toml
# Cargo.toml
[features]
default = ["std"]
std = []
serde_support = ["serde"]
async_support = ["tokio"]

[dependencies]
serde = { version = "1.0", optional = true }
tokio = { version = "1.0", optional = true }
```

```rust
#[cfg(feature = "serde_support")]
use serde::{Serialize, Deserialize};

#[derive(Debug)]
#[cfg_attr(feature = "serde_support", derive(Serialize, Deserialize))]
struct Data {
    value: i32,
}

#[cfg(feature = "async_support")]
async fn async_function() {
    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
}
```

## Integration with CLAUDE.md Stack

### Rust for CLI/TUI Tools

```rust
// Example CLI with clap
use clap::{Args, Parser, Subcommand};

#[derive(Parser)]
#[command(name = "mytool")]
#[command(about = "A CLI tool for system automation")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Process files
    Process(ProcessArgs),
    /// Generate reports
    Report(ReportArgs),
}

#[derive(Args)]
struct ProcessArgs {
    /// Input file path
    #[arg(short, long)]
    input: std::path::PathBuf,
    
    /// Output directory
    #[arg(short, long)]
    output: Option<std::path::PathBuf>,
    
    /// Verbose output
    #[arg(short, long)]
    verbose: bool,
}

#[derive(Args)]
struct ReportArgs {
    /// Report format
    #[arg(value_enum)]
    format: ReportFormat,
}

#[derive(clap::ValueEnum, Clone)]
enum ReportFormat {
    Json,
    Yaml,
    Csv,
}

fn main() {
    let cli = Cli::parse();
    
    match &cli.command {
        Commands::Process(args) => {
            println!("Processing file: {:?}", args.input);
        }
        Commands::Report(args) => {
            println!("Generating {:?} report", args.format);
        }
    }
}
```

### Systems Programming

```rust
// Example system utility
use std::process::Command;
use std::path::Path;

fn run_system_command(cmd: &str, args: &[&str]) -> Result<String, Box<dyn std::error::Error>> {
    let output = Command::new(cmd)
        .args(args)
        .output()?;
    
    if output.status.success() {
        Ok(String::from_utf8(output.stdout)?)
    } else {
        Err(format!("Command failed: {}", String::from_utf8_lossy(&output.stderr)).into())
    }
}

fn check_mise_installation() -> Result<bool, Box<dyn std::error::Error>> {
    match run_system_command("mise", &["--version"]) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

fn install_tool(tool: &str, version: &str) -> Result<(), Box<dyn std::error::Error>> {
    run_system_command("mise", &["install", tool, version])?;
    Ok(())
}
```

## Version Information

- **Current Stable**: Rust 1.85.0 (2025-02-17)
- **Edition**: 2024 (latest)
- **LTS Support**: Rust follows a 6-week release cycle
- **Breaking Changes**: Major versions maintain backward compatibility
- **Migration**: Use `cargo fix` for edition migrations

## Resources

### Official Documentation

- [The Rust Programming Language Book](https://doc.rust-lang.org/book/)
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/)
- [The Rust Reference](https://doc.rust-lang.org/reference/)
- [Standard Library Documentation](https://doc.rust-lang.org/std/)
- [Cargo Book](https://doc.rust-lang.org/cargo/)
- [Rustc Book](https://doc.rust-lang.org/rustc/)

### Community Resources

- [Rust Users Forum](https://users.rust-lang.org/)
- [Rust Internals Forum](https://internals.rust-lang.org/)
- [r/rust Subreddit](https://www.reddit.com/r/rust/)
- [Rust Discord](https://discord.gg/rust-lang)
- [This Week in Rust](https://this-week-in-rust.org/)

### Learning Resources

- [Rustlings](https://github.com/rust-lang/rustlings) - Small exercises
- [Rust Cookbook](https://rust-lang-nursery.github.io/rust-cookbook/)
- [Rust Design Patterns](https://rust-unofficial.github.io/patterns/)
- [The Rustonomicon](https://doc.rust-lang.org/nomicon/) - Unsafe Rust
- [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)

### Development Tools

- [Visual Studio Code](https://code.visualstudio.com/) with rust-analyzer
- [IntelliJ IDEA](https://www.jetbrains.com/idea/) with Rust plugin
- [Vim/Neovim](https://neovim.io/) with rust.vim and coc-rust-analyzer
- [Emacs](https://www.gnu.org/software/emacs/) with rust-mode

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/rust/`:

- Basic syntax and language features
- Standard library usage patterns
- Concurrency and async programming
- Error handling strategies
- Testing and benchmarking
- Build system configuration
- Cross-platform development
- Integration patterns
- Performance optimization
- CLI/TUI applications
- Systems programming examples

## Rust in Our Tech Stack

Rust fits perfectly in our technology stack for:

- **Systems Programming**: Low-level tools and utilities
- **CLI/TUI Applications**: Command-line interfaces and terminal UIs
- **High-Performance Services**: When Effect-TS/Bun isn't suitable
- **WebAssembly**: Frontend performance-critical components
- **Network Programming**: High-performance network services
- **Embedded Systems**: IoT and embedded development

Rust complements our Effect-TS/Bun/TypeScript stack by providing:

- Zero-cost performance for system-level operations
- Memory safety without garbage collection
- Excellent cross-platform support
- Strong ecosystem for systems programming
- Seamless WebAssembly integration
