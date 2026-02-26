// Basic WebExtensions AI API Usage Examples

// 1. Basic Engine Creation and Inference
async function basicAIInference() {
  try {
    // Create a summarization engine
    const engine = await browser.trial.ml.createEngine({
      modelHub: "huggingface",
      taskName: "summarization"
    });

    // Run inference
    const result = await browser.trial.ml.runEngine({
      args: ["This is a long article that needs to be summarized. It contains many paragraphs with detailed information about various topics."]
    });

    console.log("Summary:", result);
  } catch (error) {
    console.error("AI inference failed:", error);
  }
}

// 2. Text Classification
async function classifyText() {
  const engine = await browser.trial.ml.createEngine({
    modelHub: "huggingface",
    taskName: "text-classification"
  });

  const result = await browser.trial.ml.runEngine({
    args: ["This is a positive review of the product."]
  });

  console.log("Classification:", result);
}

// 3. Question Answering
async function answerQuestion() {
  const engine = await browser.trial.ml.createEngine({
    modelHub: "huggingface",
    taskName: "question-answering"
  });

  const result = await browser.trial.ml.runEngine({
    args: [{
      question: "What is the capital of France?",
      context: "France is a country in Europe. Paris is the capital city of France and is known for the Eiffel Tower."
    }]
  });

  console.log("Answer:", result);
}

// 4. Translation
async function translateText() {
  const engine = await browser.trial.ml.createEngine({
    modelHub: "huggingface",
    taskName: "translation",
    modelId: "Helsinki-NLP/opus-mt-en-fr"
  });

  const result = await browser.trial.ml.runEngine({
    args: ["Hello, how are you?"]
  });

  console.log("Translation:", result);
}

// 5. Text Generation
async function generateText() {
  const engine = await browser.trial.ml.createEngine({
    modelHub: "huggingface",
    taskName: "text-generation"
  });

  const result = await browser.trial.ml.runEngine({
    args: ["The future of artificial intelligence is"]
  });

  console.log("Generated text:", result);
}

// 6. Image Classification
async function classifyImage() {
  const engine = await browser.trial.ml.createEngine({
    modelHub: "huggingface",
    taskName: "image-classification"
  });

  // Assuming you have an image URL or base64 data
  const result = await browser.trial.ml.runEngine({
    args: [imageData]
  });

  console.log("Image classification:", result);
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    basicAIInference,
    classifyText,
    answerQuestion,
    translateText,
    generateText,
    classifyImage
  };
}