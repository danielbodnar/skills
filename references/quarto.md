# Quarto Reference

**Always remember to reference @$HOME/.claude/references/quarto.md and look for snippets and examples in @$HOME/.claude/snippets/quarto/**

## Quick Reference

- Installation: Download from [https://quarto.org/docs/get-started/](https://quarto.org/docs/get-started/)
- CLI Commands: `quarto render`, `quarto preview`, `quarto publish`
- Documentation: <https://quarto.org/docs/>
- GitHub: <https://github.com/quarto-dev/quarto-cli>
- Version: Latest stable release available

## Default Usage Patterns

Quarto is an open-source scientific and technical publishing system that enables:

- **Multi-language Support**: Execute code in Python, R, Julia, and Observable within documents
- **Dynamic Publishing**: Create reproducible documents with integrated code execution
- **Multiple Output Formats**: Generate HTML, PDF, Word, ePub, presentations, websites, books
- **Interactive Content**: Build dashboards, presentations, and interactive reports
- **Academic Publishing**: Citations, cross-references, equations, and scholarly formatting

## Resources and Documentation

- [Quarto Documentation](https://quarto.org/docs/)
  - [Getting Started](https://quarto.org/docs/get-started/)
  - [Guide](https://quarto.org/docs/guide/)
    - [Authoring](https://quarto.org/docs/authoring/)
    - [Computations](https://quarto.org/docs/computations/)
    - [Output Formats](https://quarto.org/docs/output-formats/)
    - [Publishing](https://quarto.org/docs/publishing/)
  - [Reference](https://quarto.org/docs/reference/)
    - [Projects](https://quarto.org/docs/reference/projects/)
    - [Formats](https://quarto.org/docs/reference/formats/)
    - [Tools](https://quarto.org/docs/tools/)
  - [Gallery](https://quarto.org/docs/gallery/)
- [Community Resources](https://quarto.org/docs/blog/)
  - [GitHub Repository](https://github.com/quarto-dev/quarto-cli)
  - [GitHub Discussions](https://github.com/quarto-dev/quarto-cli/discussions)
  - [Examples Repository](https://github.com/quarto-dev/quarto-examples)

## Core Concepts

### Document Types

- **Documents**: Individual `.qmd` files for articles, reports, notebooks
- **Websites**: Multi-page sites with navigation, search, and theming
- **Books**: Long-form publications with chapters and cross-references
- **Presentations**: Slide decks with reveal.js or Beamer
- **Dashboards**: Interactive data visualization panels

### Authoring Tools

- **Jupyter Lab**: Direct `.ipynb` notebook support
- **VS Code**: Quarto extension with preview and rendering
- **RStudio**: Integrated Quarto support
- **Text Editors**: Any editor with markdown support

### Computing Engines

- **Jupyter**: Python, Julia, and other Jupyter kernels
- **Knitr**: R code execution and output
- **Observable**: JavaScript and Observable Plot
- **Static**: Pure markdown without code execution

### Publishing Targets

- **GitHub Pages**: Automated deployment via GitHub Actions
- **Netlify**: Static site hosting with continuous deployment
- **Posit Connect**: Enterprise publishing platform
- **Confluence**: Corporate wiki integration
- **Local**: Static HTML/PDF generation

## Core CLI Commands

### Document Rendering

```bash
quarto render document.qmd              # Render single document
quarto render document.qmd --to pdf     # Render to specific format
quarto render .                         # Render entire project
quarto render --execute-daemon          # Use kernel daemon for performance
```

### Preview and Development

```bash
quarto preview document.qmd             # Live preview with auto-reload
quarto preview .                        # Preview entire project
quarto preview --port 4200              # Custom port
quarto preview --no-browser             # Disable auto-browser opening
```

### Project Management

```bash
quarto create project website mysite    # Create new website project
quarto create project book mybook       # Create new book project
quarto convert document.ipynb           # Convert Jupyter to .qmd
```

### Publishing

```bash
quarto publish netlify                  # Publish to Netlify
quarto publish gh-pages                 # Publish to GitHub Pages
quarto publish connect                  # Publish to Posit Connect
```

### System and Diagnostics

```bash
quarto check                           # Check system requirements
quarto check jupyter                   # Check Jupyter configuration
quarto --version                       # Display version information
```

## Document Structure

### YAML Front Matter

```yaml
---
title: "Document Title"
author: "Author Name"
date: "2024-01-01"
format:
  html:
    theme: cosmo
    toc: true
  pdf:
    documentclass: article
execute:
  cache: true
  freeze: auto
---
```

### Code Execution

```markdown
## Code Blocks

```{python}
#| label: fig-plot
#| fig-cap: "Sample Plot"
import matplotlib.pyplot as plt
plt.plot([1, 2, 3, 4])
plt.show()
```

## Inline Code

The result is `{python} 2 + 2`.

```

### Cross-References
```markdown
See @fig-plot for the visualization.
Equation @eq-standard shows the standard deviation:

$$
s = \sqrt{\frac{1}{N-1} \sum_{i=1}^N (x_i - \overline{x})^2}
$$ {#eq-standard}
```

## Project Configuration

### Website Projects (`_quarto.yml`)

```yaml
project:
  type: website
  output-dir: _site

website:
  title: "My Website"
  navbar:
    left:
      - href: index.qmd
        text: Home
      - about.qmd
    right:
      - icon: github
        href: https://github.com/
  sidebar:
    search: true

format:
  html:
    theme: cosmo
    css: styles.css
```

### Book Projects

```yaml
project:
  type: book
  output-dir: _book

book:
  title: "My Book"
  author: "Author Name"
  chapters:
    - index.qmd
    - intro.qmd
    - summary.qmd

format:
  html:
    theme: cosmo
  pdf:
    documentclass: scrbook
```

## Advanced Features

### Parameterized Reports

```yaml
---
title: "Parameterized Report"
params:
  region: "North"
  start_date: "2024-01-01"
---
```

### Computational Caching

```yaml
execute:
  cache: true        # Enable caching
  freeze: auto       # Freeze on source change
  daemon: 60         # Kernel daemon timeout
```

### Publishing Automation

```yaml
# GitHub Actions workflow
- name: Render and Publish
  uses: quarto-dev/quarto-actions/publish@v2
  with:
    target: gh-pages
    render: true
```

### Extensions and Filters

```yaml
filters:
  - lightbox        # Image lightbox extension
  - social-share    # Social sharing buttons

from: markdown+emoji   # Enable emoji support
```

## Output Formats

### HTML Options

```yaml
format:
  html:
    theme: [cosmo, custom.scss]
    toc: true
    toc-depth: 3
    number-sections: true
    highlight-style: github
    code-fold: true
    code-tools: true
```

### PDF Options

```yaml
format:
  pdf:
    documentclass: article
    geometry: margin=1in
    fontsize: 11pt
    cite-method: citeproc
    bibliography: references.bib
```

### Presentation Options

```yaml
format:
  revealjs:
    theme: dark
    transition: slide
    incremental: true
    chalkboard: true
```

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/quarto/`:

- Basic document authoring patterns
- Project configuration examples
- Multi-format publishing setups
- Interactive dashboard templates
- Academic paper templates
- Website and book project structures
- CI/CD automation workflows
- Advanced customization examples

## Schema and Type Definitions

YAML schema definitions and validation patterns in `$HOME/.claude/snippets/quarto/schemas/`

## Linting and Formatting

Configuration files for markdown linting and formatting in `$HOME/.claude/snippets/quarto/linting/`

## Installation Methods

### Pre-built Installers

- Download from [quarto.org/docs/get-started/](https://quarto.org/docs/get-started/)
- Supports Windows, macOS, and Linux
- Includes all dependencies and engines

### Package Managers

```bash
# Homebrew (macOS)
brew install quarto

# Conda
conda install -c conda-forge quarto

# Chocolatey (Windows)
choco install quarto
```

### Development Version

```bash
git clone https://github.com/quarto-dev/quarto-cli
cd quarto-cli
./configure.sh    # Linux/macOS
configure.cmd     # Windows
```

## Integration Patterns

### Python Environments

```bash
# Create virtual environment
python -m venv quarto-env
source quarto-env/bin/activate  # Linux/macOS
# quarto-env\Scripts\activate   # Windows

# Install required packages
pip install jupyter matplotlib pandas plotly
```

### R Environments

```bash
# Using renv for project isolation
Rscript -e "renv::init()"
Rscript -e "renv::install(c('ggplot2', 'dplyr', 'knitr'))"
```

### Julia Setup

```bash
julia -e 'using Pkg; Pkg.add("IJulia")'  # Jupyter kernel
julia -e 'using Pkg; Pkg.add("Plots")'   # Plotting package
```

## Common Workflows

### Academic Paper

1. Create document with citations and cross-references
2. Configure PDF output with academic formatting
3. Set up bibliography and citation style
4. Enable equation and figure numbering
5. Render to PDF for submission

### Data Science Report

1. Set up parameterized document
2. Configure code execution and caching
3. Create interactive visualizations
4. Set up multiple output formats (HTML, PDF)
5. Automate with scheduled rendering

### Website Publishing

1. Create website project structure
2. Configure navigation and theming
3. Set up search and social features
4. Configure GitHub Actions deployment
5. Publish to GitHub Pages or Netlify

### Interactive Dashboard

1. Configure Shiny or Observable integration
2. Create reactive visualizations
3. Set up parameter controls
4. Deploy to hosting platform
5. Configure real-time data updates

## Best Practices

### Project Organization

- Use consistent file naming conventions
- Organize content in logical directory structure
- Separate data, scripts, and output
- Version control source files, not outputs
- Use relative paths for portability

### Performance Optimization

- Enable computational caching for expensive operations
- Use kernel daemon for repeated renders
- Optimize image sizes and formats
- Minimize external dependencies
- Profile and optimize slow code blocks

### Reproducibility

- Pin dependency versions
- Use freeze feature for stable outputs
- Document computational environment
- Include data sources and processing steps
- Test renders on different systems

### Publishing Strategy

- Configure multiple output formats
- Set up automated deployment pipelines
- Optimize for target platforms
- Include appropriate metadata
- Test published outputs thoroughly
