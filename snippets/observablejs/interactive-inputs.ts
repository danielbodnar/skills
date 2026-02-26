// Observable Framework - Interactive Inputs Examples

// ============================================================================
// Basic Input Types
// ============================================================================

// Range/Slider inputs
export const rangeInputs = {
  // Basic range slider
  basicRange: () => {
    return Inputs.range([0, 100], {
      label: "Threshold",
      value: 50,
      step: 1
    });
  },

  // Range with custom formatting
  formattedRange: () => {
    return Inputs.range([0, 1000000], {
      label: "Budget",
      value: 500000,
      step: 10000,
      format: d => `$${(d / 1000).toFixed(0)}K`
    });
  },

  // Logarithmic range
  logRange: () => {
    return Inputs.range([1, 1000], {
      label: "Log Scale", 
      value: 100,
      transform: Math.log,
      format: d => d.toFixed(0)
    });
  },

  // Date range picker
  dateRange: () => {
    return Inputs.range([
      new Date("2020-01-01"),
      new Date("2024-12-31")
    ], {
      label: "Date Range",
      value: [new Date("2023-01-01"), new Date("2023-12-31")],
      step: 24 * 60 * 60 * 1000 // 1 day in milliseconds
    });
  }
};

// Text inputs
export const textInputs = {
  // Basic text input
  basicText: () => {
    return Inputs.text({
      label: "Search Query",
      placeholder: "Enter search terms...",
      value: ""
    });
  },

  // Email input with validation
  email: () => {
    return Inputs.text({
      type: "email",
      label: "Email Address",
      placeholder: "user@example.com",
      required: true
    });
  },

  // Password input
  password: () => {
    return Inputs.text({
      type: "password",
      label: "Password",
      minlength: 8
    });
  },

  // URL input
  url: () => {
    return Inputs.text({
      type: "url",
      label: "Website",
      placeholder: "https://example.com"
    });
  },

  // Textarea for long text
  textarea: () => {
    return Inputs.textarea({
      label: "Description",
      placeholder: "Enter detailed description...",
      rows: 4,
      resize: true
    });
  }
};

// Select inputs
export const selectInputs = {
  // Basic dropdown select
  basicSelect: (options: string[]) => {
    return Inputs.select(options, {
      label: "Category",
      value: options[0]
    });
  },

  // Multi-select
  multiSelect: (options: string[]) => {
    return Inputs.select(options, {
      label: "Tags",
      multiple: true,
      value: []
    });
  },

  // Select with object values
  objectSelect: (items: Array<{id: string, name: string}>) => {
    return Inputs.select(items, {
      label: "Product",
      format: d => d.name,
      value: items[0]
    });
  },

  // Radio buttons
  radio: (options: string[]) => {
    return Inputs.radio(options, {
      label: "Priority",
      value: options[0]
    });
  },

  // Checkbox group
  checkbox: (options: string[]) => {
    return Inputs.checkbox(options, {
      label: "Features",
      value: []
    });
  }
};

// Date and time inputs
export const dateTimeInputs = {
  // Date picker
  date: () => {
    return Inputs.date({
      label: "Start Date",
      value: new Date(),
      min: "2020-01-01",
      max: "2030-12-31"
    });
  },

  // Date with time
  datetime: () => {
    return Inputs.datetime({
      label: "Appointment Time",
      value: new Date()
    });
  },

  // Time only
  time: () => {
    return Inputs.time({
      label: "Meeting Time",
      value: "09:00"
    });
  },

  // Month picker
  month: () => {
    return Inputs.month({
      label: "Reporting Month",
      value: new Date().toISOString().slice(0, 7)
    });
  }
};

// ============================================================================
// Advanced Input Patterns
// ============================================================================

// Color inputs
export const colorInputs = {
  // Basic color picker
  colorPicker: () => {
    return Inputs.color({
      label: "Brand Color",
      value: "#007bff"
    });
  },

  // Multiple color selection
  colorPalette: (colors: string[]) => {
    return Inputs.radio(colors, {
      label: "Theme",
      format: color => html`<span style="background: ${color}; width: 20px; height: 20px; display: inline-block; margin-right: 8px; border-radius: 3px;"></span>${color}`
    });
  }
};

// File inputs
export const fileInputs = {
  // File upload
  fileUpload: () => {
    return Inputs.file({
      label: "Upload Data",
      accept: ".csv,.json,.xlsx",
      required: false
    });
  },

  // Multiple files
  multipleFiles: () => {
    return Inputs.file({
      label: "Upload Images",
      accept: "image/*",
      multiple: true
    });
  }
};

// Toggle inputs
export const toggleInputs = {
  // Simple toggle
  toggle: () => {
    return Inputs.toggle({
      label: "Enable Notifications",
      value: false
    });
  },

  // Toggle with custom values
  customToggle: () => {
    return Inputs.toggle({
      label: "Mode",
      values: ["Light", "Dark"],
      value: "Light"
    });
  }
};

// ============================================================================
// Search and Filter Inputs
// ============================================================================

export const searchInputs = {
  // Basic search with data
  dataSearch: <T>(data: T[], columns?: (keyof T)[]) => {
    return Inputs.search(data, {
      label: "Search Records",
      placeholder: "Type to search...",
      columns: columns
    });
  },

  // Search with custom query function
  customSearch: <T>(data: T[], queryFn: (item: T, query: string) => boolean) => {
    return Inputs.search(data, {
      label: "Advanced Search",
      query: queryFn
    });
  },

  // Fuzzy search
  fuzzySearch: <T>(data: T[]) => {
    return Inputs.search(data, {
      label: "Fuzzy Search",
      placeholder: "Type to find similar matches...",
      query: (item, query) => {
        const text = JSON.stringify(item).toLowerCase();
        const q = query.toLowerCase();
        // Simple fuzzy matching
        let lastIndex = -1;
        for (const char of q) {
          const index = text.indexOf(char, lastIndex + 1);
          if (index === -1) return false;
          lastIndex = index;
        }
        return true;
      }
    });
  }
};

// ============================================================================
// Table Inputs
// ============================================================================

export const tableInputs = {
  // Basic table with selection
  selectableTable: <T>(data: T[]) => {
    return Inputs.table(data, {
      header: true,
      multiple: true,
      required: false,
      sort: "name",
      reverse: false
    });
  },

  // Table with custom formatting
  formattedTable: <T>(data: T[], columns: Record<keyof T, any>) => {
    return Inputs.table(data, {
      columns: Object.keys(columns),
      header: columns,
      width: {
        name: 200,
        value: 100,
        date: 150
      },
      align: {
        value: "right",
        date: "center"
      },
      format: {
        value: d => d.toLocaleString(),
        date: d => d.toLocaleDateString()
      }
    });
  },

  // Paginated table
  paginatedTable: <T>(data: T[], pageSize = 20) => {
    return Inputs.table(data, {
      rows: pageSize,
      pagination: true,
      sort: true,
      header: true
    });
  }
};

// ============================================================================
// Form Composition
// ============================================================================

export const formComposition = {
  // User profile form
  userProfileForm: () => {
    const firstName = Inputs.text({
      label: "First Name",
      required: true,
      placeholder: "John"
    });

    const lastName = Inputs.text({
      label: "Last Name", 
      required: true,
      placeholder: "Doe"
    });

    const email = Inputs.text({
      type: "email",
      label: "Email",
      required: true,
      placeholder: "john.doe@example.com"
    });

    const birthDate = Inputs.date({
      label: "Birth Date",
      max: new Date().toISOString().split('T')[0]
    });

    const preferences = Inputs.checkbox([
      "Email notifications",
      "SMS alerts", 
      "Newsletter subscription"
    ], {
      label: "Preferences"
    });

    return {firstName, lastName, email, birthDate, preferences};
  },

  // Survey form
  surveyForm: () => {
    const satisfaction = Inputs.radio([1, 2, 3, 4, 5], {
      label: "How satisfied are you?",
      format: d => "★".repeat(d) + "☆".repeat(5 - d)
    });

    const features = Inputs.checkbox([
      "Easy to use",
      "Fast performance",
      "Good design",
      "Helpful support"
    ], {
      label: "What do you like?"
    });

    const recommendation = Inputs.range([0, 10], {
      label: "Likelihood to recommend",
      step: 1,
      value: 7
    });

    const comments = Inputs.textarea({
      label: "Additional comments",
      rows: 3,
      placeholder: "Optional feedback..."
    });

    return {satisfaction, features, recommendation, comments};
  }
};

// ============================================================================
// Input Validation and Constraints
// ============================================================================

export const inputValidation = {
  // Number input with constraints
  constrainedNumber: () => {
    return Inputs.range([0, 100], {
      label: "Percentage",
      value: 50,
      step: 0.1,
      format: d => `${d.toFixed(1)}%`
    });
  },

  // Text input with pattern validation
  patternValidation: () => {
    return Inputs.text({
      label: "Product Code",
      pattern: "[A-Z]{2}\\d{4}",
      placeholder: "AB1234",
      title: "Format: 2 letters followed by 4 digits"
    });
  },

  // Required field with custom validation
  customValidation: () => {
    const input = Inputs.text({
      label: "Username",
      required: true,
      minlength: 3,
      maxlength: 20,
      placeholder: "Enter username"
    });

    // Add custom validation logic
    input.addEventListener("input", (event) => {
      const value = event.target.value;
      const isValid = /^[a-zA-Z0-9_]+$/.test(value);
      
      if (!isValid && value.length > 0) {
        event.target.setCustomValidity("Only letters, numbers, and underscores allowed");
      } else {
        event.target.setCustomValidity("");
      }
    });

    return input;
  }
};

// ============================================================================
// Reactive Input Patterns
// ============================================================================

export const reactivePatterns = {
  // Cascading dropdowns
  cascadingSelects: (data: Array<{region: string, country: string, city: string}>) => {
    const regions = [...new Set(data.map(d => d.region))];
    const regionSelect = Inputs.select(regions, {label: "Region"});
    const regionValue = Generators.input(regionSelect);

    // Countries filtered by selected region
    const countries = regionValue ? 
      [...new Set(data.filter(d => d.region === regionValue).map(d => d.country))] :
      [];
    const countrySelect = Inputs.select(countries, {label: "Country"});
    const countryValue = Generators.input(countrySelect);

    // Cities filtered by selected country
    const cities = countryValue ?
      [...new Set(data.filter(d => d.country === countryValue).map(d => d.city))] :
      [];
    const citySelect = Inputs.select(cities, {label: "City"});

    return {regionSelect, countrySelect, citySelect};
  },

  // Conditional inputs
  conditionalInputs: () => {
    const type = Inputs.radio(["Personal", "Business"], {
      label: "Account Type",
      value: "Personal"
    });
    const typeValue = Generators.input(type);

    // Show different fields based on type
    const personalFields = typeValue === "Personal" ? {
      firstName: Inputs.text({label: "First Name"}),
      lastName: Inputs.text({label: "Last Name"})
    } : null;

    const businessFields = typeValue === "Business" ? {
      companyName: Inputs.text({label: "Company Name"}),
      taxId: Inputs.text({label: "Tax ID"})
    } : null;

    return {type, personalFields, businessFields};
  },

  // Dynamic form builder
  dynamicForm: (fields: Array<{name: string, type: string, options?: any}>) => {
    const form = {};

    for (const field of fields) {
      switch (field.type) {
        case "text":
          form[field.name] = Inputs.text({
            label: field.name,
            ...field.options
          });
          break;
        case "select":
          form[field.name] = Inputs.select(field.options?.values || [], {
            label: field.name,
            ...field.options
          });
          break;
        case "range":
          form[field.name] = Inputs.range(field.options?.domain || [0, 100], {
            label: field.name,
            ...field.options
          });
          break;
        case "checkbox":
          form[field.name] = Inputs.checkbox(field.options?.values || [], {
            label: field.name,
            ...field.options
          });
          break;
      }
    }

    return form;
  }
};

// ============================================================================
// Input Synchronization and Binding
// ============================================================================

export const inputSynchronization = {
  // Synchronized sliders
  synchronizedSliders: () => {
    const slider1 = Inputs.range([0, 100], {label: "Slider 1", value: 50});
    const slider2 = Inputs.range([0, 100], {label: "Slider 2", value: 50});

    // Bind sliders together
    const binding = Inputs.bind(slider1, slider2);

    return {slider1, slider2, binding};
  },

  // Two-way data binding
  twoWayBinding: <T>(data: T[], key: keyof T) => {
    const table = Inputs.table(data);
    const search = Inputs.search(data);

    // Synchronize table and search
    const tableValue = Generators.input(table);
    const searchValue = Generators.input(search);

    return {table, search, tableValue, searchValue};
  }
};

// ============================================================================
// Custom Input Components
// ============================================================================

export const customInputs = {
  // Color gradient picker
  gradientPicker: (colors: string[]) => {
    const container = html`<div class="gradient-picker"></div>`;
    
    colors.forEach((color, i) => {
      const colorInput = Inputs.color({value: color});
      colorInput.style.display = "inline-block";
      colorInput.style.margin = "2px";
      container.appendChild(colorInput);
    });

    return container;
  },

  // Star rating input
  starRating: (maxStars = 5) => {
    const container = html`<div class="star-rating"></div>`;
    let currentRating = 0;

    for (let i = 1; i <= maxStars; i++) {
      const star = html`<span class="star" data-rating="${i}">☆</span>`;
      star.style.cursor = "pointer";
      star.style.fontSize = "24px";
      star.style.color = "#ccc";
      
      star.addEventListener("click", () => {
        currentRating = i;
        updateStars();
        container.dispatchEvent(new CustomEvent("input", {detail: currentRating}));
      });

      container.appendChild(star);
    }

    const updateStars = () => {
      container.querySelectorAll(".star").forEach((star, index) => {
        star.textContent = index < currentRating ? "★" : "☆";
        star.style.color = index < currentRating ? "#ffd700" : "#ccc";
      });
    };

    container.value = currentRating;
    return container;
  },

  // Tag input
  tagInput: (suggestions: string[] = []) => {
    const container = html`<div class="tag-input">
      <div class="tags"></div>
      <input type="text" placeholder="Add tag...">
    </div>`;

    const tagsContainer = container.querySelector(".tags");
    const input = container.querySelector("input");
    let tags = [];

    const addTag = (tag: string) => {
      if (tag && !tags.includes(tag)) {
        tags.push(tag);
        updateTags();
        container.dispatchEvent(new CustomEvent("input", {detail: tags}));
      }
    };

    const removeTag = (tag: string) => {
      tags = tags.filter(t => t !== tag);
      updateTags();
      container.dispatchEvent(new CustomEvent("input", {detail: tags}));
    };

    const updateTags = () => {
      tagsContainer.innerHTML = "";
      tags.forEach(tag => {
        const tagElement = html`<span class="tag">
          ${tag}
          <button type="button" onclick=${() => removeTag(tag)}>×</button>
        </span>`;
        tagsContainer.appendChild(tagElement);
      });
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag(input.value.trim());
        input.value = "";
      }
    });

    container.value = tags;
    return container;
  }
};