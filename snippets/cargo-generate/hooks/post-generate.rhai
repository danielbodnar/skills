// hooks/post-generate.rhai - Post-generation setup and formatting

// Import required modules
import "std" as std;

// Formatting functions
fn format_rust_code() {
    print("🔧 Formatting Rust code...");
    
    // Format all Rust files
    let format_result = system::command("rustfmt", ["--edition", variable::get("rust_edition"), "src/lib.rs"]);
    
    if format_result.exit_code == 0 {
        print("✓ Rust code formatted successfully");
    } else {
        print("Warning: rustfmt not available or formatting failed");
        print("Install rustfmt with: rustup component add rustfmt");
    }
    
    // Format Cargo.toml
    let cargo_fmt_result = system::command("cargo", ["fmt"]);
    if cargo_fmt_result.exit_code == 0 {
        print("✓ Cargo.toml formatted");
    }
}

fn setup_git_repository() {
    let init_git = variable::get("init_git");
    
    if init_git {
        print("📦 Initializing Git repository...");
        
        // Initialize git repository
        let git_init_result = system::command("git", ["init"]);
        if git_init_result.exit_code != 0 {
            print("Warning: Failed to initialize Git repository");
            return;
        }
        
        // Add all files
        let git_add_result = system::command("git", ["add", "."]);
        if git_add_result.exit_code != 0 {
            print("Warning: Failed to add files to Git");
            return;
        }
        
        // Create initial commit
        let commit_message = `Initial commit for ${variable::get("project-name")}`;
        let git_commit_result = system::command("git", ["commit", "-m", commit_message]);
        
        if git_commit_result.exit_code == 0 {
            print("✓ Initial Git commit created");
        } else {
            print("Warning: Failed to create initial commit");
        }
        
        // Set up default branch name
        let git_branch_result = system::command("git", ["branch", "-M", "main"]);
        if git_branch_result.exit_code == 0 {
            print("✓ Set default branch to 'main'");
        }
    }
}

fn generate_additional_files() {
    print("📄 Generating additional files...");
    
    // Generate .gitignore if not exists
    if !file::exists(".gitignore") {
        let gitignore_content = `/target/
/Cargo.lock
*.pdb
*.swp
*.swo
*~
.DS_Store
.vscode/
.idea/
*.iml
*.orig
.env
.env.local
tmp/
log/
logs/
`;
        file::write(".gitignore", gitignore_content);
        print("✓ Generated .gitignore");
    }
    
    // Generate rustfmt.toml
    if !file::exists("rustfmt.toml") {
        let rustfmt_content = `edition = "${variable::get("rust_edition")}"
max_width = 100
hard_tabs = false
tab_spaces = 4
newline_style = "Unix"
use_small_heuristics = "Default"
reorder_imports = true
reorder_modules = true
remove_nested_parens = true
merge_derives = true
use_try_shorthand = true
use_field_init_shorthand = true
force_explicit_abi = true
empty_item_single_line = true
struct_lit_single_line = true
fn_single_line = false
where_single_line = false
imports_layout = "Mixed"
merge_imports = false
`;
        file::write("rustfmt.toml", rustfmt_content);
        print("✓ Generated rustfmt.toml");
    }
    
    // Generate clippy.toml
    if !file::exists("clippy.toml") {
        let clippy_content = `# Clippy configuration for ${variable::get("project-name")}
too-many-arguments-threshold = 8
type-complexity-threshold = 250
single-char-lifetime-names-threshold = 4
trivial-copy-size-limit = 64
`;
        file::write("clippy.toml", clippy_content);
        print("✓ Generated clippy.toml");
    }
}

fn setup_vscode_configuration() {
    let setup_vscode = variable::get("setup_vscode");
    
    if setup_vscode {
        print("🔧 Setting up VS Code configuration...");
        
        // Create .vscode directory
        if !file::exists(".vscode") {
            system::command("mkdir", [".vscode"]);
        }
        
        // Generate settings.json
        let features = variable::get("features");
        let features_json = "";
        for feature in features {
            if features_json != "" {
                features_json += ", ";
            }
            features_json += `"${feature}"`;
        }
        
        let settings_content = `{
    "rust-analyzer.cargo.features": [${features_json}],
    "rust-analyzer.checkOnSave.command": "clippy",
    "rust-analyzer.completion.callable.snippets": "fill_arguments",
    "rust-analyzer.imports.merge.behavior": "crate",
    "rust-analyzer.imports.prefix": "crate",
    "files.associations": {
        "*.rs": "rust"
    },
    "editor.formatOnSave": true,
    "[rust]": {
        "editor.defaultFormatter": "rust-lang.rust-analyzer"
    }
}`;
        
        file::write(".vscode/settings.json", settings_content);
        
        // Generate launch.json for debugging
        let launch_content = `{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "lldb",
            "request": "launch",
            "name": "Debug ${variable::get("project-name")}",
            "cargo": {
                "args": ["build", "--bin=${variable::get("crate_name")}"],
                "filter": {
                    "name": "${variable::get("crate_name")}",
                    "kind": "bin"
                }
            },
            "args": [],
            "cwd": "\${workspaceFolder}"
        }
    ]
}`;
        
        if variable::get("crate_type") == "bin" {
            file::write(".vscode/launch.json", launch_content);
        }
        
        print("✓ VS Code configuration set up");
    }
}

fn setup_github_actions() {
    let use_github_actions = variable::get("use_github_actions");
    
    if use_github_actions {
        print("⚙️ Setting up GitHub Actions...");
        
        // Create .github/workflows directory
        if !file::exists(".github") {
            system::command("mkdir", [".github"]);
        }
        if !file::exists(".github/workflows") {
            system::command("mkdir", [".github/workflows"]);
        }
        
        let features = variable::get("features");
        let feature_flags = "";
        for feature in features {
            if feature_flags != "" {
                feature_flags += ",";
            }
            feature_flags += feature;
        }
        
        let ci_content = `name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  CARGO_TERM_COLOR: always

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Install Rust
      uses: dtolnay/rust-toolchain@stable
      with:
        components: rustfmt, clippy
    
    - name: Cache dependencies
      uses: actions/cache@v3
      with:
        path: |
          ~/.cargo/registry
          ~/.cargo/git
          target
        key: \${{ runner.os }}-cargo-\${{ hashFiles('**/Cargo.lock') }}
    
    - name: Check formatting
      run: cargo fmt --all -- --check
    
    - name: Run clippy
      run: cargo clippy --all-targets --all-features -- -D warnings
    
    - name: Run tests
      run: cargo test --verbose${feature_flags != "" ? ` --features ${feature_flags}` : ""}
    
    - name: Run doctests
      run: cargo test --doc
    
    - name: Build release
      run: cargo build --release --verbose

  security_audit:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: rustsec/audit-check@v1.2.0
      with:
        token: \${{ secrets.GITHUB_TOKEN }}
`;
        
        file::write(".github/workflows/ci.yml", ci_content);
        print("✓ GitHub Actions CI workflow created");
    }
}

fn setup_documentation() {
    let generate_docs = variable::get("generate_docs");
    
    if generate_docs {
        print("📚 Setting up documentation...");
        
        // Create docs directory
        if !file::exists("docs") {
            system::command("mkdir", ["docs"]);
        }
        
        // Generate basic documentation structure
        let docs_readme = `# ${variable::get("project-name")} Documentation

This directory contains the documentation for ${variable::get("project-name")}.

## API Documentation

Run \`cargo doc --open\` to generate and view the API documentation.

## Examples

See the \`examples/\` directory for usage examples.

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.
`;
        
        file::write("docs/README.md", docs_readme);
        
        // Generate CONTRIBUTING.md
        let contributing_content = `# Contributing to ${variable::get("project-name")}

Thank you for your interest in contributing to ${variable::get("project-name")}!

## Development Setup

1. Clone the repository
2. Install Rust (https://rustup.rs/)
3. Run \`cargo test\` to ensure everything works

## Code Style

- Follow the existing code style
- Run \`cargo fmt\` before committing
- Run \`cargo clippy\` and fix any warnings
- Add tests for new functionality

## Submitting Changes

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

By contributing, you agree that your contributions will be licensed under the ${variable::get("license")} license.
`;
        
        file::write("CONTRIBUTING.md", contributing_content);
        print("✓ Documentation structure created");
    }
}

fn run_initial_checks() {
    print("🔍 Running initial project checks...");
    
    // Check that the project compiles
    let check_result = system::command("cargo", ["check"]);
    if check_result.exit_code == 0 {
        print("✓ Project compiles successfully");
    } else {
        print("⚠️  Warning: Project may have compilation issues");
        print("Run 'cargo check' to see details");
    }
    
    // Run tests if they exist
    let test_result = system::command("cargo", ["test", "--no-run"]);
    if test_result.exit_code == 0 {
        print("✓ Tests compile successfully");
        
        // Actually run the tests
        let run_tests = system::command("cargo", ["test"]);
        if run_tests.exit_code == 0 {
            print("✓ All tests pass");
        } else {
            print("⚠️  Some tests may be failing");
        }
    }
}

fn display_next_steps() {
    print("");
    print("🎉 Project generation completed successfully!");
    print("");
    print("📋 Next Steps:");
    print("1. cd " + variable::get("project-name"));
    print("2. cargo build          # Build the project");
    print("3. cargo test           # Run tests");
    print("4. cargo run            # Run the project (if binary)");
    print("");
    print("🛠️  Development Commands:");
    print("- cargo check           # Quick syntax check");
    print("- cargo clippy          # Linting");
    print("- cargo fmt             # Format code");
    print("- cargo doc --open      # Generate and view docs");
    print("");
    
    let features = variable::get("features");
    if features.len() > 0 {
        print("🔧 Available Features: " + features.join(", "));
        print("- cargo build --features feature_name");
        print("");
    }
    
    if variable::get("use_github_actions") {
        print("⚙️  GitHub Actions CI is configured and ready to use");
    }
    
    if variable::get("setup_vscode") {
        print("🔧 VS Code configuration is set up for Rust development");
    }
    
    print("📚 Documentation: https://doc.rust-lang.org/book/");
    print("🦀 Happy coding!");
}

// Main execution
fn main() {
    print("🔧 Starting post-generation setup...");
    
    // Format code
    format_rust_code();
    
    // Generate additional files
    generate_additional_files();
    
    // Set up development environment
    setup_vscode_configuration();
    
    // Set up CI/CD
    setup_github_actions();
    
    // Set up documentation
    setup_documentation();
    
    // Initialize Git repository
    setup_git_repository();
    
    // Run initial checks
    run_initial_checks();
    
    // Display next steps
    display_next_steps();
}

// Execute main function
main();