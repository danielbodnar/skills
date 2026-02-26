# Block Goose AI Prompting Examples

## Basic Prompting

### Clear and Direct Instructions

```
# Vague
Goose, what's a pull request?

# Better - Specific and Clear
Goose, explain how GitHub pull requests work like I'm new to coding

# Best - Set Context
Goose, remember I'm not a developer. Explain things at a high level unless I ask for technical details
```

### Few-Shot Learning

```
# Provide Examples
Goose, here's how I usually summarize reports: (example summary). Can you summarize this new report the same way?

# Without Examples
Goose, summarize this report
```

## Development Tasks

### Project Setup

```
set up a new JavaScript project with Express, Mongoose, Nodemon, and Dotenv? Fetch the latest package versions, generate a README with those versions, and initialize Git
```

### Code Analysis

```
What does this phrase mean: "Who does Vegas have as the favorite?"
```

### Image Processing

```
Resize this image (~/Downloads/image.png) to 1000x1000 pixels. Maintain the aspect ratio and image quality.
```

### Git Operations

```
I don't know when I introduced a bug. Can you walk me through using git bisect to find the commit that caused it?
```

## Learning and Tutorials

### Building Extensions

```
I'd like to learn how to build an extension or MCP server for Goose
```

### Speech-to-Text

```
I'd like to speak instead of typing.
```

## AI Agent Capabilities

### Tool Selection Examples

```json
[
  {
    "tool": "read_file",
    "parameters": { "file_path": "UserService.java" }
  }
]
```

```json
[
  {
    "tool": "edit_file",
    "parameters": {
      "file_path": "UserService.java",
      "modifications": {
        "line_number": 3,
        "replacement": "private Database db = new Database();"
      }
    }
  }
]
```

```json
[
  {
    "tool": "run_tests",
    "parameters": {}
  }
]
```

## System Prompts and Context

### Available Tools

- `read_file(file_path: str)` - Returns the contents of the specified file
- `analyze_code(file_content: str)` - Identifies potential errors and suggests fixes
- `edit_file(file_path: str, modifications: dict)` - Applies code changes
- `run_tests()` - Executes the test suite and returns results

### Extension Management

- `search_available_extensions()` - Discovers and lists available extensions
- `enable_extension(extension_name: str)` - Activates a specified extension

### Text Editor Tools

- `text_editor.str_replace(file_path: str, old_string: str, new_string: str)` - Replaces text in files
- `write(file_path: str, content: str)` - Writes content to files

## Best Practices

1. **Be Specific**: Provide clear, detailed instructions
2. **Set Context**: Explain your skill level and preferences
3. **Use Examples**: Show the desired format or style
4. **Iterate**: Build on previous responses
5. **Provide File Paths**: Be explicit about file locations
6. **State Requirements**: Mention constraints or requirements upfront
