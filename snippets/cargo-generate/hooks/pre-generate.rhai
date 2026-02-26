// hooks/pre-generate.rhai - Pre-generation validation and setup

// Import required modules
import "std" as std;

// Validation functions
fn validate_project_name() {
    let name = variable::get("project-name");
    
    // Check length
    if name.len() < 3 {
        abort("Project name must be at least 3 characters long");
    }
    
    if name.len() > 50 {
        abort("Project name must be less than 50 characters long");
    }
    
    // Check valid characters (letters, numbers, hyphens, underscores)
    if !name.matches("^[a-zA-Z][a-zA-Z0-9_-]*$") {
        abort("Project name must start with a letter and contain only alphanumeric characters, underscores, or hyphens");
    }
    
    // Check for reserved names
    let reserved = ["test", "main", "lib", "src", "target", "cargo", "rust"];
    if reserved.contains(name.to_lower()) {
        abort(`Project name '${name}' is reserved and cannot be used`);
    }
    
    print(`✓ Project name '${name}' is valid`);
}

fn validate_crate_name() {
    let crate_name = variable::get("crate_name");
    
    // Check if crate_name is valid Rust identifier
    if !crate_name.matches("^[a-z][a-z0-9_]*$") {
        abort("Crate name must be a valid Rust identifier (lowercase, starts with letter, contains only letters, numbers, and underscores)");
    }
    
    // Check length limits
    if crate_name.len() > 64 {
        abort("Crate name must be less than 64 characters");
    }
    
    print(`✓ Crate name '${crate_name}' is valid`);
}

fn validate_author_email() {
    let email = variable::get("author_email");
    
    if email != "" && !email.matches("^[^@]+@[^@]+\\.[^@]+$") {
        abort("Author email must be a valid email address");
    }
    
    if email != "" {
        print(`✓ Author email '${email}' is valid`);
    }
}

fn validate_license() {
    let license = variable::get("license");
    let valid_licenses = ["MIT", "Apache-2.0", "GPL-3.0", "BSD-3-Clause", "ISC", "Unlicense"];
    
    if !valid_licenses.contains(license) {
        abort(`License '${license}' is not in the list of supported licenses: ${valid_licenses}`);
    }
    
    print(`✓ License '${license}' is valid`);
}

fn validate_rust_edition() {
    let edition = variable::get("rust_edition");
    let valid_editions = ["2018", "2021"];
    
    if !valid_editions.contains(edition) {
        abort(`Rust edition '${edition}' is not supported. Valid editions: ${valid_editions}`);
    }
    
    print(`✓ Rust edition '${edition}' is valid`);
}

fn validate_features() {
    let features = variable::get("features");
    let valid_features = ["serde", "tokio", "clap", "anyhow", "tracing", "reqwest", "diesel", "sqlx"];
    
    for feature in features {
        if !valid_features.contains(feature) {
            print(`Warning: Feature '${feature}' is not in the standard list: ${valid_features}`);
        }
    }
    
    print(`✓ Features validated: ${features}`);
}

// Setup functions
fn setup_derived_variables() {
    let project_name = variable::get("project-name");
    
    // Generate crate_name from project-name if not set
    if !variable::is_set("crate_name") {
        let crate_name = project_name.to_lower().replace("-", "_");
        variable::set("crate_name", crate_name);
        print(`✓ Generated crate_name: ${crate_name}`);
    }
    
    // Generate uppercase variants
    let project_name_upper = project_name.to_upper().replace("-", "_");
    variable::set("PROJECT_NAME_UPPER", project_name_upper);
    
    // Generate PascalCase variant
    let words = project_name.split("-");
    let pascal_case = "";
    for word in words {
        pascal_case += word.sub_string(0, 1).to_upper() + word.sub_string(1).to_lower();
    }
    variable::set("project_name_pascal", pascal_case);
    
    print(`✓ Generated derived variables: ${project_name_upper}, ${pascal_case}`);
}

fn setup_conditional_variables() {
    let crate_type = variable::get("crate_type");
    let features = variable::get("features");
    
    // Set boolean flags for easier template logic
    variable::set("is_binary", crate_type == "bin");
    variable::set("is_library", crate_type == "lib");
    
    // Feature flags
    variable::set("use_serde", features.contains("serde"));
    variable::set("use_tokio", features.contains("tokio"));
    variable::set("use_clap", features.contains("clap"));
    variable::set("use_tracing", features.contains("tracing"));
    variable::set("use_async", features.contains("tokio") || variable::get("use_async"));
    
    // Dependency flags
    let use_database = features.contains("diesel") || features.contains("sqlx");
    variable::set("use_database", use_database);
    
    let use_web = features.contains("reqwest") || features.contains("axum") || features.contains("actix");
    variable::set("use_web", use_web);
    
    print("✓ Set up conditional variables");
}

fn setup_metadata() {
    // Set generation timestamp
    variable::set("generation_timestamp", system::now());
    
    // Set generator version
    variable::set("cargo_generate_version", "0.18.0");
    
    // Get system information
    variable::set("os", system::os());
    variable::set("arch", system::arch());
    
    // Set up build information
    variable::set("build_date", system::now());
    variable::set("rustc_version", "1.70.0"); // This would ideally be detected
    
    print("✓ Set up metadata variables");
}

// Check dependencies
fn check_system_dependencies() {
    // Check if cargo is available
    let cargo_result = system::command("cargo", ["--version"]);
    if cargo_result.exit_code != 0 {
        abort("Cargo is not installed or not available in PATH");
    }
    
    // Check if rustc is available
    let rustc_result = system::command("rustc", ["--version"]);
    if rustc_result.exit_code != 0 {
        abort("Rust compiler is not installed or not available in PATH");
    }
    
    // Check minimum Rust version
    let rustc_output = rustc_result.stdout;
    if rustc_output.contains("1.6") && !rustc_output.contains("1.70") {
        print("Warning: Rust version may be older than recommended (1.70+)");
    }
    
    print("✓ System dependencies verified");
}

fn check_git_configuration() {
    // Check if git is configured
    let git_name_result = system::command("git", ["config", "user.name"]);
    let git_email_result = system::command("git", ["config", "user.email"]);
    
    if git_name_result.exit_code != 0 || git_email_result.exit_code != 0 {
        print("Warning: Git user name and/or email not configured");
        print("Run: git config --global user.name 'Your Name'");
        print("Run: git config --global user.email 'your.email@example.com'");
    } else {
        let git_name = git_name_result.stdout.trim();
        let git_email = git_email_result.stdout.trim();
        
        // Use git config as default if not provided
        if !variable::is_set("author_name") && git_name != "" {
            variable::set("author_name", git_name);
        }
        
        if !variable::is_set("author_email") && git_email != "" {
            variable::set("author_email", git_email);
        }
        
        print(`✓ Git configuration found: ${git_name} <${git_email}>`);
    }
}

// Main execution
fn main() {
    print("🚀 Starting pre-generation validation...");
    
    // Validate all inputs
    validate_project_name();
    validate_crate_name();
    validate_author_email();
    validate_license();
    validate_rust_edition();
    validate_features();
    
    // Set up derived variables
    setup_derived_variables();
    setup_conditional_variables();
    setup_metadata();
    
    // Check system
    check_system_dependencies();
    check_git_configuration();
    
    print("✅ Pre-generation validation completed successfully!");
    print(`Project: ${variable::get("project-name")}`);
    print(`Crate: ${variable::get("crate_name")}`);
    print(`Type: ${variable::get("crate_type")}`);
    print(`License: ${variable::get("license")}`);
    print(`Features: ${variable::get("features")}`);
}

// Execute main function
main();